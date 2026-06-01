// ============================================================
// Protect the private RSVP inbox (/admin and /admin/export.csv) with HTTP Basic
// auth. Credentials come from env (ADMIN_USER / ADMIN_PASSCODE) and are checked
// on the server only. Everything else passes straight through.
// ============================================================
import { defineMiddleware } from 'astro:middleware';

const USER = import.meta.env.ADMIN_USER || 'mari';
const PASS = import.meta.env.ADMIN_PASSCODE || '';

function challenge(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="RSVP inbox", charset="UTF-8"' },
  });
}

/** Length-aware constant-time string compare (avoids a passcode timing oracle). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const onRequest = defineMiddleware((context, next) => {
  if (/\/admin(\/|$)/i.test(context.url.pathname)) {
    if (!PASS) {
      return new Response('Admin is disabled until ADMIN_PASSCODE is set.', { status: 503 });
    }
    const header = context.request.headers.get('authorization') || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme !== 'Basic' || !encoded) return challenge();

    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      return challenge();
    }
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    // Compute both before combining so timing doesn't reveal which half failed.
    const userOk = safeEqual(user, USER);
    const passOk = safeEqual(pass, PASS);
    if (!(userOk && passOk)) return challenge();

    // CSRF: a mutating admin request (send / import) must originate from the admin
    // page itself. Browsers always send Origin on a POST; reject a cross-site one.
    // (The endpoints also require a JSON body, which already blocks simple form
    // CSRF — this is belt-and-suspenders.)
    if (context.request.method === 'POST') {
      const origin = context.request.headers.get('origin');
      const host = context.request.headers.get('host');
      if (origin && host && new URL(origin).host !== host) {
        return new Response('Cross-origin request refused.', { status: 403 });
      }
    }
  }
  return next();
});
