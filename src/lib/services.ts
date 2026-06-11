// ============================================================
// One switch for "live" external services (Turso, Resend, Turnstile).
// Production is always live. Dev is NEVER live by default — the local .env
// legitimately carries the production TURSO_DATABASE_URL / RESEND_API_KEY for
// `npm run backup` and friends, and `npm run dev` must stay on the safe local
// defaults the docs promise (local.db, email logged not sent, captcha off)
// no matter what credentials are sitting in .env. Set
// DEV_USE_LIVE_SERVICES=true to point a dev server at the real services
// deliberately.
//
// Env reads here and across the server code are `process.env` first: Astro 6
// inlines `import.meta.env.*` into the build output (Astro 5 rewrote it to a
// `process.env` lookup), so only a runtime read picks up values set or rotated
// in the Vercel dashboard. `import.meta.env` stays as the fallback — Vite still
// supplies .env values through it in dev and tests.
// ============================================================
export const useLiveServices =
  import.meta.env.PROD ||
  (process.env.DEV_USE_LIVE_SERVICES ?? import.meta.env.DEV_USE_LIVE_SERVICES) === 'true';
