// Guarded invitation / reminder sender (gated by the admin middleware).
// POST { type: 'invite'|'reminder', mode: 'test'|'dryRun'|'live', limit? }
//  - test   → send ONE sample to the couple's own address; no status change
//  - dryRun → list who *would* be emailed; sends nothing
//  - live   → send a throttled batch (≤100) with an idempotency key; record status
// Live sends are idempotent (same recipient set → same key → no re-send within 24h)
// and only ever target households not yet sent (invite) / not yet replied (reminder).
export const prerender = false;
import type { APIRoute } from 'astro';
import {
  householdsPendingInvite,
  invitedNonResponders,
  markInvited,
  markReminded,
  type Household,
} from '../../lib/db';
import { buildInvite, buildReminder, sendBatch, type EmailPayload } from '../../lib/email';
import { siteOriginLooksUnset } from '../../lib/links';

const DEFAULT_LIMIT = 90; // headroom under Resend's free 100/day cap
const MAX_LIMIT = 100; // Resend batch maximum per call

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Stable key for a recipient set, so a double-clicked live send dedupes at Resend
// — but a *genuinely new* send must NOT collide inside Resend's 24h idempotency
// window. We fold each recipient's email and their invited/reminded timestamps
// into the key: a corrected address (email changed) or a later reminder wave
// (reminded_at advanced past the 12h cooldown) yields a fresh key and sends,
// while a rapid retry of the same wave (identical fields) repeats the key and
// dedupes. Without this, the same IDs hashed to the same key for 24h, so a
// corrected invite or a same-day second reminder could be marked sent yet never
// actually delivered.
function stableKey(
  prefix: string,
  recipients: Array<Pick<Household, 'id' | 'email' | 'invitedAt' | 'remindedAt'>>,
): string {
  const s = recipients
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((r) => `${r.id}:${r.email ?? ''}:${r.invitedAt ?? ''}:${r.remindedAt ?? ''}`)
    .join(',');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `${prefix}:${h.toString(36)}`;
}

function sampleHousehold(email: string): Household {
  return {
    id: 0,
    code: 'SAMPLE00',
    label: 'Sample Household',
    invitedNames: 'Sample Guest',
    invitedGuests: ['Sample Guest'],
    plusOnes: 0,
    email,
    maxSeats: 1,
    locale: 'en',
    inviteStatus: 'pending',
    invitedAt: null,
    remindedAt: null,
    inviteError: null,
    createdAt: '',
  };
}

export const POST: APIRoute = async ({ request }) => {
  let body: { type?: string; mode?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const type: 'invite' | 'reminder' = body.type === 'reminder' ? 'reminder' : 'invite';
  const mode = (['test', 'dryRun', 'live'] as const).find((m) => m === body.mode) ?? 'dryRun';
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const build = type === 'invite' ? buildInvite : buildReminder;

  // Guardrails for a real send (test or live) in production: refuse if email or the
  // link origin isn't configured — better to fail loudly than to "succeed" into the
  // void (no key → mail is only logged, not sent) or to mail broken personal links.
  if (mode !== 'dryRun' && import.meta.env.PROD) {
    if (!import.meta.env.RESEND_API_KEY)
      return json({ error: 'Email isn’t configured yet (RESEND_API_KEY) — no mail was sent.' }, 503);
    if (siteOriginLooksUnset())
      return json({ error: 'SITE_URL isn’t set — personal links would be broken. Set it and redeploy.' }, 503);
  }

  const recipients = type === 'invite' ? await householdsPendingInvite() : await invitedNonResponders();

  // --- test: one sample to the couple ---------------------------------------
  if (mode === 'test') {
    const couple = import.meta.env.COUPLE_NOTIFY_EMAIL || '';
    if (!couple) return json({ error: 'Set COUPLE_NOTIFY_EMAIL to receive a test send.' }, 400);
    // Always a synthetic sample — never a real household. Its link carries the
    // fake SAMPLE00 code, so clicking through lands on the invalid-code page and
    // can never overwrite a real guest's RSVP. (Deliverability + rendering is
    // what a test checks; it doesn't need a live, submittable code.)
    const sample = sampleHousehold(couple);
    const payload = build(sample);
    if (!payload) return json({ error: 'Could not build a test email.' }, 400);
    const res = await sendBatch([payload], crypto.randomUUID()); // unique → always sends
    return res.ok
      ? json({ tested: true, to: couple })
      : json({ error: res.error || 'Test send failed.' }, 502);
  }

  // Build payloads for the next slice (skip any with no email).
  const slice = recipients.slice(0, limit);
  const payloads: EmailPayload[] = [];
  const ids: number[] = [];
  const targets: Household[] = [];
  for (const h of slice) {
    const p = build(h);
    if (p) {
      payloads.push(p);
      ids.push(h.id);
      targets.push(h);
    }
  }

  // --- dryRun: show who would be emailed ------------------------------------
  if (mode === 'dryRun') {
    return json({
      dryRun: true,
      type,
      totalPending: recipients.length,
      willSend: payloads.map((p, i) => ({ to: p.to, subject: p.subject, label: slice[i]?.label })),
      remainingAfter: Math.max(recipients.length - payloads.length, 0),
    });
  }

  // --- live -----------------------------------------------------------------
  if (payloads.length === 0) return json({ type, attempted: 0, sent: 0, failed: 0, remaining: 0 });

  const result = await sendBatch(payloads, stableKey(type, targets));

  if (!result.ok && result.error) {
    // Whole call failed (network/auth). Flag invites as failed so they retry.
    if (type === 'invite') {
      await markInvited(ids.map((id) => ({ id, status: 'failed' as const, error: result.error })));
    }
    return json({ error: result.error, attempted: ids.length, sent: 0, failed: ids.length }, 502);
  }

  const sentIds: number[] = [];
  const failures: Array<{ id: number; label: string; error: string }> = [];
  const inviteResults: Array<{ id: number; status: 'sent' | 'failed'; error?: string }> = [];
  ids.forEach((id, i) => {
    if (result.failures.has(i)) {
      const error = result.failures.get(i) || 'Failed';
      failures.push({ id, label: slice[i]?.label ?? '', error });
      inviteResults.push({ id, status: 'failed', error });
    } else {
      sentIds.push(id);
      inviteResults.push({ id, status: 'sent' });
    }
  });

  if (type === 'invite') await markInvited(inviteResults);
  else await markReminded(sentIds);

  return json({
    type,
    attempted: ids.length,
    sent: sentIds.length,
    failed: failures.length,
    failures,
    // Failed recipients are still pending — count only the ones actually sent.
    remaining: Math.max(recipients.length - sentIds.length, 0),
  });
};
