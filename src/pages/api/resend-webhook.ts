// Resend delivery webhook — records whether each invitation/email actually
// reached the guest, so /admin can flag bounced addresses (a guest who never got
// their link). PUBLIC (Resend calls it), so it's verified by signature, not the
// admin middleware. Configure in Resend: add an endpoint pointing here, copy its
// signing secret to RESEND_WEBHOOK_SECRET, and subscribe to email.delivered /
// email.bounced / email.complained.
export const prerender = false;
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { recordDelivery } from '../../lib/db';

const SECRET = (process.env.RESEND_WEBHOOK_SECRET ?? import.meta.env.RESEND_WEBHOOK_SECRET) || '';

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Verify the Svix signature Resend sends (svix-id/-timestamp/-signature). The
    secret is `whsec_<base64>`; the signed content is `id.timestamp.body`. */
function verify(headers: Headers, body: string): boolean {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');
  if (!id || !ts || !sigHeader) return false;
  // Replay guard: reject timestamps more than 5 minutes from now.
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false;
  const key = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
  // Header is space-separated "v1,<base64sig>" entries; any match passes.
  return sigHeader.split(' ').some((part) => {
    const sig = part.split(',')[1];
    return Boolean(sig) && timingSafeEq(sig, expected);
  });
}

const STATUS: Record<string, 'delivered' | 'bounced' | 'complained'> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

export const POST: APIRoute = async ({ request }) => {
  const raw = await request.text();

  if (SECRET) {
    if (!verify(request.headers, raw)) return new Response('invalid signature', { status: 401 });
  } else if (import.meta.env.PROD) {
    // No secret configured in production → we can't trust the caller. (Locally,
    // an unsigned POST is accepted so the flow can be exercised.)
    return new Response('webhook secret not configured', { status: 503 });
  }

  let event: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const status = STATUS[String(event?.type || '')];
  if (!status) return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });

  const data = event.data ?? {};
  const to: string[] = Array.isArray(data.to) ? data.to : data.to ? [String(data.to)] : [];
  const detail =
    status === 'bounced'
      ? String(data.bounce?.message || data.bounce?.subType || data.bounce?.type || 'bounced').slice(0, 300)
      : undefined;

  let updated = 0;
  for (const addr of to) {
    if (typeof addr === 'string' && addr.trim()) updated += await recordDelivery(addr.trim(), status, detail);
  }

  return new Response(JSON.stringify({ ok: true, type: event.type, updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
