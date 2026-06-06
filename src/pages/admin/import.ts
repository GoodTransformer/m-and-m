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
  const emailById = new Map<number, string | null>();
  const byId = new Map<number, (typeof existing)[number]>();
  const codes = new Set<string>();
  for (const h of existing) {
    if (h.email) byEmail.set(h.email.toLowerCase(), h.id);
    byLabel.set(h.label.toLowerCase(), h.id);
    emailById.set(h.id, h.email ? h.email.toLowerCase() : null);
    byId.set(h.id, h);
    codes.add(h.code);
  }

  const inserts: Array<NewHousehold & { code: string }> = [];
  const updates: Array<NewHousehold & { id: number; resetInvite?: boolean }> = [];
  // Households that already replied but whose people/allowance changed in this
  // import — their saved roster (names + meals) may no longer line up, so the
  // couple should re-check that reply rather than trust a stale headcount.
  const changedAfterReply: Array<{ line: number; label: string }> = [];
  for (const row of parsed.rows) {
    if (!row.valid) continue;
    const base: NewHousehold = {
      label: row.label,
      invitedNames: row.invitedNames,
      invitedGuests: row.invitedGuests,
      plusOnes: row.plusOnes,
      email: row.email,
      locale: row.locale,
    };
    // Match an existing household by email, else by name — so correcting a typo'd
    // email updates the same household instead of inserting a duplicate.
    const existingId =
      (row.email ? byEmail.get(row.email) : undefined) ?? byLabel.get(row.label.toLowerCase());
    if (existingId != null) {
      const oldEmail = emailById.get(existingId) ?? null;
      const newEmail = row.email ?? null;
      // A changed address re-queues the invitation to the corrected email.
      updates.push({ ...base, id: existingId, resetInvite: oldEmail !== newEmail });
      const old = byId.get(existingId);
      if (
        old?.response &&
        (JSON.stringify(old.invitedGuests) !== JSON.stringify(row.invitedGuests) ||
          old.plusOnes !== row.plusOnes)
      ) {
        changedAfterReply.push({ line: row.line, label: row.label });
      }
    } else {
      let code = generateCode();
      while (codes.has(code)) code = generateCode();
      codes.add(code);
      inserts.push({ ...base, code });
    }
  }

  try {
    await importHouseholds(inserts, updates);
  } catch (err) {
    // The households table has a UNIQUE index on lower(email). A row that reuses
    // an address already held by a *different* household trips it, and because the
    // write is one atomic batch the whole import rolls back. Surface that clearly
    // instead of a blank 500.
    const msg = String((err as { message?: string })?.message || err);
    const duplicate = /unique|constraint/i.test(msg);
    return json(
      {
        error: duplicate
          ? 'Import failed: an email address is used by more than one household. Give each household its own email (or leave it blank) and try again — nothing was changed.'
          : 'Import failed while saving — nothing was changed. Please try again.',
      },
      duplicate ? 409 : 500,
    );
  }
  const skipped = parsed.rows
    .filter((r) => !r.valid)
    .map((r) => ({ line: r.line, label: r.label, issue: r.issue }));

  return json({
    inserted: inserts.length,
    updated: updates.length,
    skipped,
    changedAfterReply,
    total: parsed.rows.length,
  });
};
