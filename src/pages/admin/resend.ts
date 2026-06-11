// Re-send one household's confirmation email (gated by the admin middleware).
// POST { code } — used by the "Resend email" button in the replies table when a
// guest says they never got their confirmation. Forces a genuine re-send with a
// fresh idempotency key (the on-submit send dedupes off updatedAt, which would
// otherwise suppress a manual re-send within Resend's 24h window).
export const prerender = false;
import type { APIRoute } from 'astro';
import { getHouseholdByCode, getResponseForHousehold } from '../../lib/db';
import { sendGuestConfirmation, fromLooksUnset } from '../../lib/email';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) return json({ error: 'No household specified.' }, 400);

  // Same production guardrails as a real send: don't "succeed" into the void or
  // send from the spam-bound sandbox.
  if (import.meta.env.PROD) {
    if (!(process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY))
      return json({ error: 'Email isn’t configured yet (RESEND_API_KEY).' }, 503);
    if (fromLooksUnset())
      return json(
        { error: 'Set a verified RSVP_FROM_EMAIL before sending — the sandbox sender lands in spam.' },
        503,
      );
  }

  const household = await getHouseholdByCode(code);
  if (!household) return json({ error: 'Household not found.' }, 404);
  const response = await getResponseForHousehold(household.id);
  if (!response) return json({ error: 'This household hasn’t replied yet — nothing to resend.' }, 400);

  // Confirm to the on-file address (or the entered one only when there is none) —
  // never an arbitrary value, matching the on-submit rule.
  const to = household.email || response.email;
  if (!to) return json({ error: 'No email on file for this household.' }, 400);

  try {
    await sendGuestConfirmation(response, household.locale, to, household.code, crypto.randomUUID());
    return json({ ok: true, to });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Send failed.' }, 502);
  }
};
