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
    if (user !== USER || pass !== PASS) return challenge();
  }
  return next();
});
