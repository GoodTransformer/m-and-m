#!/usr/bin/env node
// ============================================================
// Full, self-contained backup of the RSVP datastore (households + rsvps, plus
// any other tables/indexes) to a timestamped .sql file.
//
// Uses the SAME @libsql/client the app depends on — NO Turso CLI required. The
// driver is chosen exactly like src/lib/db.ts: the pure-JS web client for a
// remote libsql:// URL, the native client for a local file: DB.
//
// Reads TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from the environment, so it backs
// up whatever your .env points at (production Turso, or file:local.db in dev).
//
// WHY THIS EXISTS: Turso's free tier keeps only 24h of point-in-time history,
// but RSVPs arrive over weeks. This independent, off-Turso copy is the real
// safety net. Restore with scripts/restore-db.mjs. Full runbook: RECOVERY.md.
// ============================================================
import { writeFile, mkdir, appendFile } from 'node:fs/promises';

// Load .env so a local `npm run backup` reaches the same DB the app uses.
// In CI there's no .env (vars come from secrets) — ignore the missing file.
// Values already in the environment win, so an explicit TURSO_DATABASE_URL=…
// on the command line still overrides the file.
try {
  process.loadEnvFile();
} catch {
  /* no .env present — env vars already provided (CI) */
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Serialize one SQLite value to a SQL literal. Strings are single-quoted with
// embedded quotes doubled; newlines and semicolons inside them are fine — the
// whole script is parsed by SQLite on restore, never split on ';'.
function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Uint8Array) {
    let hex = '';
    for (const b of v) hex += b.toString(16).padStart(2, '0');
    return `X'${hex}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

const { createClient } = url.startsWith('file:')
  ? await import('@libsql/client')
  : await import('@libsql/client/web');
const client = createClient({ url, authToken });

try {
  // Live DDL, verbatim — so the backup automatically tracks any future column
  // the app adds. Tables before indexes; skip SQLite's internal objects.
  const schema = await client.execute(
    `SELECT name, type, sql FROM sqlite_master
     WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
     ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, rowid`,
  );
  const tables = schema.rows.filter((r) => r.type === 'table').map((r) => String(r.name));

  const out = [
    `-- Mari & Michael — RSVP datastore backup`,
    `-- source:  ${url.replace(/[?&]authToken=[^&]*/i, '')}`,
    `-- created: ${new Date().toISOString()}`,
    `PRAGMA foreign_keys=OFF;`,
    `BEGIN TRANSACTION;`,
  ];

  // 1) schema (CREATE TABLE … then CREATE INDEX …, ordering from the query)
  for (const row of schema.rows) out.push(`${String(row.sql).trim()};`);

  // 2) data — ids preserved so rsvps.household_id still points at its household.
  //    households are dumped before rsvps (table order above), so the FK holds
  //    even with foreign_keys on.
  const counts = {};
  for (const table of tables) {
    const res = await client.execute(`SELECT * FROM "${table}"`);
    counts[table] = res.rows.length;
    if (!res.rows.length) continue;
    const cols = res.columns;
    const colList = cols.map((c) => `"${c}"`).join(', ');
    out.push(`-- ${table}: ${res.rows.length} row(s)`);
    for (const r of res.rows) {
      const vals = cols.map((c) => sqlLiteral(r[c])).join(', ');
      out.push(`INSERT INTO "${table}" (${colList}) VALUES (${vals});`);
    }
  }

  out.push(`COMMIT;`, '');
  const sql = out.join('\n');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2026-06-06T07-17-00
  await mkdir('backups', { recursive: true });
  const file = `backups/rsvp-backup-${stamp}.sql`;
  await writeFile(file, sql, 'utf8');

  console.log(`✓ Backup written: ${file}`);
  console.log(`  Tables: ${tables.map((t) => `${t}=${counts[t] ?? 0}`).join(', ') || '(none)'}`);
  console.log(`  Size:   ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KiB`);

  // Hand the path to the GitHub Action (for the encrypt + upload steps).
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `file=${file}\n`);
} finally {
  client.close();
}
