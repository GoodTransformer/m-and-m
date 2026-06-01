// Guest-list import (gated by the admin middleware). POST { csv, dryRun }:
//  - dryRun → parse + validate, return a preview (no writes)
//  - otherwise → upsert households (match existing by email, else by name)
export const prerender = false;
import type { APIRoute } from 'astro';
import { parseGuestCsv } from '../../lib/guests';
import { listHouseholdsWithResponses, importHouseholds, type NewHousehold } from '../../lib/db';
import { generateCode } from '../../lib/code';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { csv?: string; dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const parsed = parseGuestCsv(typeof body.csv === 'string' ? body.csv : '');
  if (parsed.headerError) return json({ error: parsed.headerError }, 400);

  if (body.dryRun) {
    return json({ preview: parsed.rows, validCount: parsed.validCount, total: parsed.rows.length });
  }

  // Match existing households: by email when present, else by name.
  const existing = await listHouseholdsWithResponses();
  const byEmail = new Map<string, number>();
  const byLabel = new Map<string, number>();
  const codes = new Set<string>();
  for (const h of existing) {
    if (h.email) byEmail.set(h.email.toLowerCase(), h.id);
    byLabel.set(h.label.toLowerCase(), h.id);
    codes.add(h.code);
  }

  const inserts: Array<NewHousehold & { code: string }> = [];
  const updates: Array<NewHousehold & { id: number }> = [];
  for (const row of parsed.rows) {
    if (!row.valid) continue;
    const base: NewHousehold = {
      label: row.label,
      invitedNames: row.invitedNames,
      email: row.email,
      maxSeats: row.maxSeats,
      locale: row.locale,
    };
    const existingId = row.email ? byEmail.get(row.email) : byLabel.get(row.label.toLowerCase());
    if (existingId != null) {
      updates.push({ ...base, id: existingId });
    } else {
      let code = generateCode();
      while (codes.has(code)) code = generateCode();
      codes.add(code);
      inserts.push({ ...base, code });
    }
  }

  await importHouseholds(inserts, updates);
  const skipped = parsed.rows
    .filter((r) => !r.valid)
    .map((r) => ({ line: r.line, label: r.label, issue: r.issue }));

  return json({ inserted: inserts.length, updated: updates.length, skipped, total: parsed.rows.length });
};
