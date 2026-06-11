// ============================================================
// Shared helpers for the admin passcode session. A correct passcode sets an
// httpOnly cookie holding a one-way token derived from the passcode (SHA-256) —
// never the passcode itself. The middleware checks that token on every /admin
// request; the login page + /admin/auth issue it. This replaces the browser's
// unstyleable Basic-auth dialog with a branded login page.
// ============================================================
const PASS = (process.env.ADMIN_PASSCODE ?? import.meta.env.ADMIN_PASSCODE) || '';
export const ADMIN_COOKIE = 'mm_admin';
const SALT = 'm&m-rsvp-admin-v1'; // domain separation only — not a secret

export function adminPasscode(): string {
  return PASS;
}

/** Constant-time compare (length folded in; no early-out on length). */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Session token = SHA-256(salt + passcode), hex. Proves the bearer knew the
    passcode without storing it, and can't be forged without the secret. */
export async function sessionToken(): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + PASS));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Reject a cross-site POST (belt-and-braces CSRF). A missing Origin header (some
    top-level navigations) is allowed — the passcode/token is still required. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
