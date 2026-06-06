# Disaster Recovery — Mari & Michael RSVP site

What to do if the site goes down or the database is damaged. **The code is
replaceable; the RSVP replies are not.** This is the runbook.

## Where everything lives

| Thing | Location | If lost |
|---|---|---|
| Site code | GitHub `GoodTransformer/m-and-m` → Vercel | Redeploy from GitHub (minutes) |
| Secrets (Turso URL/token, Resend key, admin passcode) | Vercel env vars + local `.env` (gitignored) | Re-add from `.env`, or regenerate |
| **Guest list + RSVP replies** | **Turso** (libSQL): tables `households` + `rsvps` | **This runbook** |

> The `local.db` file in the repo is **dev-only** and gitignored — it is *not* a
> copy of production. Don't rely on it.

## The threat model

Turso's **free tier keeps only the last ~24 hours** of point-in-time history.
RSVPs arrive over weeks, so if the data is deleted or corrupted and you don't
notice within a day, Turso alone can't bring it back. That's why we keep
independent backups.

## The three safety layers (in place)

1. **Turso point-in-time restore** — automatic, last ~24h (free tier). First
   line of defense for an "oops" caught within a day.
2. **Encrypted daily backups in GitHub Actions** — `.github/workflows/backup.yml`
   dumps the whole DB every day, AES-encrypts it (the repo is public, so the
   dump is encrypted with a secret passphrase), and keeps it as a workflow
   artifact for 90 days.
3. **On-demand local backup** — `npm run backup` writes a full `.sql` dump to
   `backups/` (gitignored) any time you want a copy on your own machine.

---

## Make a backup right now (local)

```sh
npm run backup
```

Writes `backups/rsvp-backup-<timestamp>.sql` for whatever DB your `.env` points
at. It contains guests' personal details — keep it somewhere safe and **don't
commit it** (`backups/` is gitignored).

## Restore — the database is damaged or gone

### Option A — within 24h: Turso point-in-time restore (fastest, no file needed)

1. In the Turso dashboard/CLI, create a new database restored to a timestamp
   *before* the damage.
2. Copy its URL + auth token.
3. Vercel → project `m-and-m` → Settings → Environment Variables → set
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to the new database.
4. Redeploy. Done.

### Option B — from a backup file (any age)

1. Get a backup `.sql`:
   - **Local:** pick one from `backups/`.
   - **From GitHub Actions:** Actions tab → **RSVP backup** → latest run →
     download the `rsvp-backup-…` artifact, unzip, then decrypt:
     ```sh
     openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
       -in rsvp-backup-XXXX.sql.enc -out rsvp-backup-XXXX.sql \
       -pass pass:'YOUR_BACKUP_PASSPHRASE'
     ```
2. Create a fresh, empty Turso database; copy its URL + token.
3. Load the backup into it:
   ```sh
   TURSO_DATABASE_URL='libsql://NEW-db...' TURSO_AUTH_TOKEN='...' \
     node scripts/restore-db.mjs backups/rsvp-backup-XXXX.sql
   ```
   It prints the restored row counts.
4. Point Vercel's `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` at the new database
   and redeploy.

## Restore — the whole site/Vercel is gone (data intact)

Just redeploy: the code is on GitHub. Re-create the Vercel project if needed,
re-add the environment variables (from your `.env`), deploy. No data action
needed — Turso is independent of Vercel.

---

## One-time setup for the daily backups

The GitHub Action needs three repo secrets:

```sh
gh secret set TURSO_DATABASE_URL --repo GoodTransformer/m-and-m   # the libsql:// prod URL
gh secret set TURSO_AUTH_TOKEN  --repo GoodTransformer/m-and-m    # the prod token
gh secret set BACKUP_PASSPHRASE --repo GoodTransformer/m-and-m    # a long passphrase YOU choose
```

**Store the passphrase in a password manager.** Without it the encrypted backups
cannot be decrypted. Then commit + push so the workflow lives on the default
branch (scheduled workflows only run from there), and trigger a first run from
the Actions tab → **Run workflow** to confirm it goes green.

## Test your backups (do this once, and again before the RSVP wave)

A backup you've never restored isn't a backup. Prove the round-trip without
touching production:

```sh
npm run backup                                          # dump the current DB
TURSO_DATABASE_URL='file:_restore_test.db' \
  node scripts/restore-db.mjs backups/rsvp-backup-XXXX.sql
sqlite3 _restore_test.db 'SELECT count(*) FROM rsvps;'  # matches the original?
rm -f _restore_test.db
```

## Optional: widen the Turso window

Upgrading Turso to a paid tier extends point-in-time history from ~24h to
10/30/90 days — a cheap floor under everything above. Not required given the
daily encrypted backups, but nice insurance during the RSVP rush.
