// ============================================================
// One switch for "live" external services (Turso, Resend, Turnstile).
// Production is always live. Dev is NEVER live by default — the local .env
// legitimately carries the production TURSO_DATABASE_URL / RESEND_API_KEY for
// `npm run backup` and friends, and `npm run dev` must stay on the safe local
// defaults the docs promise (local.db, email logged not sent, captcha off)
// no matter what credentials are sitting in .env. Set
// DEV_USE_LIVE_SERVICES=true to point a dev server at the real services
// deliberately.
// ============================================================
export const useLiveServices =
  import.meta.env.PROD || import.meta.env.DEV_USE_LIVE_SERVICES === 'true';
