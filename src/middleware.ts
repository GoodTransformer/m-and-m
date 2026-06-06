// ============================================================
// Gate the private RSVP admin (/admin and its endpoints) behind a branded
// passcode login. /admin/login shows the form and /admin/auth issues an httpOnly
// session cookie; every other /admin request must carry a valid one. This
// replaces the browser's unstyleable Basic-auth dialog with an on-brand page.
// ============================================================
import { defineMiddleware } from 'astro:middleware';
import { ADMIN_COOKIE, adminPasscode, safeEqual, sameOrigin, sessionToken } from './lib/admin-auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (!/^\/admin(\/|$)/i.test(path)) return next();

  if (!adminPasscode()) {
    return new Response('Admin is disabled until ADMIN_PASSCODE is set.', { status: 503 });
  }

  // Sign out: clear the cookie and return to the login page.
  if (/^\/admin\/logout\/?$/i.test(path)) {
    context.cookies.delete(ADMIN_COOKIE, { path: '/admin' });
    return context.redirect('/admin/login/', 303);
  }

  const cookie = context.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const authed = cookie !== '' && safeEqual(cookie, await sessionToken());

  // The login page + its POST handler ARE the gate — let them through.
  if (/^\/admin\/(login|auth)\/?$/i.test(path)) {
    // Already signed in and asking for the form? Skip straight to the dashboard.
    if (authed && /\/login\/?$/i.test(path) && context.request.method === 'GET') {
      return context.redirect('/admin/', 303);
    }
    if (context.request.method !== 'GET' && !sameOrigin(context.request)) {
      return new Response('Cross-origin request refused.', { status: 403 });
    }
    return next();
  }

  // Everything else under /admin needs a valid session.
  if (!authed) {
    if (context.request.method === 'GET') return context.redirect('/admin/login/', 303);
    return new Response('Not authenticated.', { status: 401 });
  }

  // CSRF: a mutating admin request (send / import) must be same-origin.
  if (context.request.method !== 'GET' && !sameOrigin(context.request)) {
    return new Response('Cross-origin request refused.', { status: 403 });
  }

  return next();
});
