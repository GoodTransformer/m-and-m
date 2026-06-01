// ============================================================
// Cloudflare Turnstile server-side verification. SERVER-ONLY.
// If no secret is configured (local dev, or not yet provisioned) verification
// is skipped — the honeypot + time-trap still guard the form. In production,
// set TURNSTILE_SECRET_KEY and it is enforced.
// ============================================================
const SECRET = import.meta.env.TURNSTILE_SECRET_KEY || '';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  skipped?: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<TurnstileResult> {
  if (!SECRET) return { ok: true, skipped: true };
  if (!token) return { ok: false, errorCodes: ['missing-input-response'] };

  try {
    const body = new URLSearchParams();
    body.set('secret', SECRET);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);

    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return { ok: data.success === true, errorCodes: data['error-codes'] };
  } catch {
    // Couldn't reach Cloudflare: fail-open in dev so local testing isn't blocked,
    // fail-closed in production so a network blip can't wave bots through.
    return { ok: Boolean(import.meta.env.DEV), errorCodes: ['verify-unreachable'] };
  }
}
