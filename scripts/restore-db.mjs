#!/usr/bin/env node
// ============================================================
// Restore an RSVP datastore backup (from scripts/backup-db.mjs) into the
// database TURSO_DATABASE_URL points at, via @libsql/client.executeMultiple —
// the libsql-blessed way to apply a SQL dump (parsed by SQLite, so semicolons
// inside guests' messages are handled correctly, never naively split).
//
// USAGE — restore into a FRESH/empty database, then repoint the app at it:
//   TURSO_DATABASE_URL='libsql://NEW-db...' TURSO_AUTH_TOKEN='...' \
//     node scripts/restore-db.mjs backups/rsvp-backup-XXXX.sql
//
// Refuses to run if the target already holds replies (pass --force to override).
// Full runbook: RECOVERY.md.
// ============================================================
import { readFile } from 'node:fs/promises';

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const file = argv.find((a) => !a.startsWith('--'));

if (!file) {
  console.error('Usage: node scripts/restore-db.mjs <backup.sql> [--force]');
  process.exit(1);
}
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error('Refusing to run: set TURSO_DATABASE_URL to the TARGET database.');
  process.exit(1);
}
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const sql = await readFile(file, 'utf8');
const { createClient } = url.startsWith('file:')
  ? await import('@libsql/client')
  : await import('@libsql/client/web');
const client = createClient({ url, authToken });

try {
  // Guard: don't load on top of a database that already has replies unless
  // forced. Restore is designed for an EMPTY target (a new Turso db, or a
  // recovered branch). A missing rsvps table just means a fresh target.
  try {
    const { rows } = await client.execute(`SELECT count(*) AS n FROM rsvps`);
    const n = Number(rows[0]?.n ?? 0);
    if (n > 0 && !force) {
      console.error(`Target already holds ${n} rsvp row(s). Restore into an EMPTY database,`);
      console.error(`or re-run with --force if you are certain you want to load on top.`);
      process.exit(1);
    }
  } catch {
    /* no rsvps table yet — fresh target, good */
  }

  console.log(`Restoring ${file} → ${url.replace(/[?&]authToken=[^&]*/i, '')} ...`);
  await client.executeMultiple(sql);

  const h = await client.execute(`SELECT count(*) AS n FROM households`);
  const r = await client.execute(`SELECT count(*) AS n FROM rsvps`);
  console.log(`✓ Restored. households=${Number(h.rows[0]?.n ?? 0)}, rsvps=${Number(r.rows[0]?.n ?? 0)}`);
  console.log(`Next: set this database's URL/token as TURSO_DATABASE_URL/TURSO_AUTH_TOKEN in Vercel and redeploy.`);
} finally {
  client.close();
}
