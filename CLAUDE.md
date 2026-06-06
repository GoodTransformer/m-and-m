# CLAUDE.md

Bilingual (EN · ES) Astro + TypeScript wedding site for **Mari & Michael**,
deployed on Vercel. Self-hosted RSVP (Astro Actions + Turso/libSQL + Resend +
Cloudflare Turnstile).

## Where things are documented

- [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) — **outstanding work + launch/ops state. Start here.**
- [`README.md`](README.md) — overview & quick start; "Details to confirm" tracks content placeholders.
- [`RSVP-SETUP.md`](RSVP-SETUP.md) — how the RSVP system works, plus deploy/provisioning & env vars.
- [`RECOVERY.md`](RECOVERY.md) — backup & disaster-recovery runbook.
- [`BRAND-TO-WEB.md`](BRAND-TO-WEB.md) — design-system rationale.

## Conventions

- Track outstanding tasks in `LAUNCH-CHECKLIST.md` (content placeholders in
  `README.md`). Update those lists — don't start new ones.
- Secrets live in Vercel env + GitHub Actions secrets, never in the repo.
  `.env`, `local.db`, and `backups/` are gitignored — never commit guest data
  (this repo is public).
- `npm run dev` runs everything locally (RSVP included) against `local.db`;
  `npm run build` prerenders content and bundles the RSVP routes for Vercel
  (Node 22). `npm run backup` / `npm run restore` handle the database.
