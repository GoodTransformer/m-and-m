# Launch checklist — Mari & Michael

The single front door for outstanding work. **This file owns the completion
state of launch + ops tasks.** Detailed steps, commands, and values live in the
linked docs — follow the links rather than duplicating them here. Fine-grained
*content* placeholders are tracked in
[README → Details to confirm](README.md#details-to-confirm); the live `/admin`
page shows runtime warnings (placeholder meal names, unset contact email).

> **For agents & future maintainers:** tick the boxes here as things land. Don't
> start a new task list elsewhere — add to this one (or to README's content
> list). Keep each task's done/not-done state in exactly one place.

## 1 · Before go-live (blocks sharing the site widely)

- [ ] **Content placeholders resolved** — 1/13 done. Tracked in
      [README → Details to confirm](README.md#details-to-confirm) (RSVP deadline,
      ceremony/reception times, running order, dress code, what3words, on-the-day
      contact, taxis, accommodation, gifts, Our Story copy, photos, coordinates).
- [ ] **Real menu names** — replace the placeholder `MEALS` labels in
      [`src/data/site.ts`](src/data/site.ts) (also flagged live in `/admin`).
- [ ] **`CONTACT_EMAIL` set** — still the `WEDDING-EMAIL-TBC@gmail.com`
      placeholder in [`src/data/site.ts`](src/data/site.ts); see
      [RSVP-SETUP.md](RSVP-SETUP.md) → "Going live".
- [ ] **Accounts provisioned** — Turso, Resend (verify a sending domain),
      Cloudflare Turnstile. Steps: [RSVP-SETUP.md](RSVP-SETUP.md) → "Going live".
- [ ] **Vercel env vars set** — without these, prod RSVP/admin don't work. Full
      list: [RSVP-SETUP.md](RSVP-SETUP.md) → "Environment variables". At minimum:
      `SITE_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `RESEND_API_KEY`,
      `RSVP_FROM_EMAIL`, `COUPLE_NOTIFY_EMAIL`, `PUBLIC_TURNSTILE_SITEKEY`,
      `TURNSTILE_SECRET_KEY`, `ADMIN_PASSCODE`.
- [ ] **Guest list imported** — prod Turso starts empty; import the CSV via
      `/admin` once the DB is live.

## 2 · Activate backups (disaster recovery)

- [x] DR code shipped & pushed — `scripts/backup-db.mjs`, `scripts/restore-db.mjs`,
      `.github/workflows/backup.yml`.
- [ ] **Set the 3 repo secrets** — `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
      `BACKUP_PASSPHRASE` (store the passphrase in a password manager — backups
      can't be decrypted without it). Commands: [RECOVERY.md](RECOVERY.md) →
      "One-time setup for the daily backups".
- [ ] **First backup run is green** — Actions tab → RSVP backup → Run workflow.

## 3 · Recurring / ops

- [ ] **Test a restore before the RSVP wave** — a backup you've never restored
      isn't a backup: [RECOVERY.md](RECOVERY.md) → "Test your backups".
- [ ] **After the wedding** — export the final replies, then delete guest data:
      [RSVP-SETUP.md](RSVP-SETUP.md) → "A note on guest data".
