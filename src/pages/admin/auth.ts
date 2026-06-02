// Login form handler: verify the passcode, set the session cookie, redirect.
// The middleware already enforces same-origin on this route.
export const prerender = false;
import type { APIRoute } from 'astro';
import { ADMIN_COOKIE, adminPasscode, safeEqual, sessionToken } from '../../lib/admin-auth';

export const POST: APIRoute = async (context) => {
  const pass = adminPasscode();
  if (!pass) return new Response('Admin is disabled until ADMIN_PASSCODE is set.', { status: 503 });

  const form = await context.request.formData().catch(() => null);
  const entered = form ? String(form.get('passcode') ?? '') : '';
  if (!safeEqual(entered, pass)) {
    return context.redirect('/admin/login/?error=1', 303);
  }

  context.cookies.set(ADMIN_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return context.redirect('/admin/', 303);
};
