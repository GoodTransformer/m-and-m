// ============================================================
// RSVP datastore (libSQL / Turso). SERVER-ONLY — never imported by client code.
// Guest-list model: one `households` row per invited party (with an unguessable
// code and invite status), and at most one `rsvps` row per household (their
// reply). Every query is parameterised, so input can't be interpolated into SQL.
// ============================================================
import { createClient, type Client } from '@libsql/client';
import { generateCode } from './code';

const url = import.meta.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = import.meta.env.TURSO_AUTH_TOKEN || undefined;

let _client: Client | null = null;
function db(): Client {
  if (!_client) _client = createClient({ url, authToken });
  return _client;
}

export type Attending = 'yes' | 'no';
export type InviteStatus = 'pending' | 'sent' | 'failed';
export type Locale = 'en' | 'es';

export interface Household {
  id: number;
  code: string;
  label: string;
  invitedNames: string;
  email: string | null;
  maxSeats: number;
  locale: Locale;
  inviteStatus: InviteStatus;
  invitedAt: string | null;
  remindedAt: string | null;
  inviteError: string | null;
  createdAt: string;
}

export interface RsvpResponse {
  attending: Attending;
  partySize: number;
  names: string;
  email: string;
  dietary: string;
  message: string;
  meals: string[]; // one meal id per attending guest ('' = not chosen)
  guestNames: string[]; // optional name per attending guest, parallel to meals
  updatedAt: string;
}

export interface HouseholdWithResponse extends Household {
  response: RsvpResponse | null;
}

export interface NewHousehold {
  label: string;
  invitedNames: string;
  email: string | null;
  maxSeats: number;
  locale: Locale;
}

// --- schema -------------------------------------------------------------------
let _schema: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!_schema) {
    _schema = (async () => {
      await db().batch(
        [
          `CREATE TABLE IF NOT EXISTS households (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            code          TEXT    NOT NULL UNIQUE,
            label         TEXT    NOT NULL,
            invited_names TEXT    NOT NULL DEFAULT '',
            email         TEXT,
            max_seats     INTEGER NOT NULL DEFAULT 2,
            locale        TEXT    NOT NULL DEFAULT 'en',
            invite_status TEXT    NOT NULL DEFAULT 'pending',
            invited_at    TEXT,
            reminded_at   TEXT,
            invite_error  TEXT,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
          )`,
          // One household per email (NULLs allowed for paper-only guests).
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_households_email ON households(lower(email))`,
          `CREATE TABLE IF NOT EXISTS rsvps (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            household_id INTEGER NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
            attending    TEXT    NOT NULL,
            party_size   INTEGER NOT NULL DEFAULT 0,
            names        TEXT    NOT NULL DEFAULT '',
            email        TEXT    NOT NULL DEFAULT '',
            dietary      TEXT    NOT NULL DEFAULT '',
            message      TEXT    NOT NULL DEFAULT '',
            meals        TEXT    NOT NULL DEFAULT '[]',
            guest_names  TEXT    NOT NULL DEFAULT '[]',
            created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
          )`,
        ],
        'write',
      );
      // Migrations for databases created before a column existed (no-op if present).
      await db()
        .execute(`ALTER TABLE rsvps ADD COLUMN meals TEXT NOT NULL DEFAULT '[]'`)
        .catch(() => undefined);
      await db()
        .execute(`ALTER TABLE rsvps ADD COLUMN guest_names TEXT NOT NULL DEFAULT '[]'`)
        .catch(() => undefined);
    })().catch((err) => {
      _schema = null;
      throw err;
    });
  }
  return _schema;
}

// --- row mappers --------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
function toHousehold(r: any): Household {
  return {
    id: Number(r.id),
    code: String(r.code),
    label: String(r.label ?? ''),
    invitedNames: String(r.invited_names ?? ''),
    email: r.email == null ? null : String(r.email),
    maxSeats: Number(r.max_seats ?? 1),
    locale: String(r.locale) === 'es' ? 'es' : 'en',
    inviteStatus: (['pending', 'sent', 'failed'].includes(String(r.invite_status))
      ? String(r.invite_status)
      : 'pending') as InviteStatus,
    invitedAt: r.invited_at == null ? null : String(r.invited_at),
    remindedAt: r.reminded_at == null ? null : String(r.reminded_at),
    inviteError: r.invite_error == null ? null : String(r.invite_error),
    createdAt: String(r.created_at ?? ''),
  };
}

function parseStringArray(v: unknown): string[] {
  if (typeof v !== 'string' || !v) return [];
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toResponse(r: any): RsvpResponse | null {
  if (r.attending == null) return null;
  return {
    attending: String(r.attending) === 'no' ? 'no' : 'yes',
    partySize: Number(r.party_size ?? 0),
    names: String(r.r_names ?? ''),
    email: String(r.r_email ?? ''),
    dietary: String(r.dietary ?? ''),
    message: String(r.message ?? ''),
    meals: parseStringArray(r.meals),
    guestNames: parseStringArray(r.guest_names),
    updatedAt: String(r.r_updated ?? ''),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- households ---------------------------------------------------------------
export async function generateUniqueCode(): Promise<string> {
  await ensureSchema();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode();
    const { rows } = await db().execute({
      sql: 'SELECT 1 FROM households WHERE code = ? LIMIT 1',
      args: [code],
    });
    if (rows.length === 0) return code;
  }
  throw new Error('Could not allocate a unique household code');
}

export async function getHouseholdByCode(code: string): Promise<Household | null> {
  await ensureSchema();
  const { rows } = await db().execute({
    sql: 'SELECT * FROM households WHERE code = ? LIMIT 1',
    args: [code],
  });
  return rows.length ? toHousehold(rows[0]) : null;
}

export async function getHouseholdByEmail(email: string): Promise<Household | null> {
  await ensureSchema();
  const { rows } = await db().execute({
    sql: 'SELECT * FROM households WHERE lower(email) = lower(?) LIMIT 1',
    args: [email],
  });
  return rows.length ? toHousehold(rows[0]) : null;
}

/** Insert a new household with a freshly-allocated code; returns the code. */
export async function insertHousehold(h: NewHousehold): Promise<string> {
  await ensureSchema();
  const code = await generateUniqueCode();
  await db().execute({
    sql: `INSERT INTO households (code, label, invited_names, email, max_seats, locale)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [code, h.label, h.invitedNames, h.email, h.maxSeats, h.locale],
  });
  return code;
}

/** Update an existing household's details on re-import (code/status untouched). */
export async function updateHouseholdDetails(id: number, h: NewHousehold): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `UPDATE households
          SET label = ?, invited_names = ?, email = ?, max_seats = ?, locale = ?
          WHERE id = ?`,
    args: [h.label, h.invitedNames, h.email, h.maxSeats, h.locale, id],
  });
}

/** Bulk insert/update households in a single transaction (used by CSV import).
    `resetInvite` on an update re-queues the invitation (used when an email is
    corrected). INSERT OR IGNORE means a stray unique-constraint hit skips just
    that row rather than rolling back the whole import. */
export async function importHouseholds(
  inserts: Array<NewHousehold & { code: string }>,
  updates: Array<NewHousehold & { id: number; resetInvite?: boolean }>,
): Promise<void> {
  if (!inserts.length && !updates.length) return;
  await ensureSchema();
  const stmts = [
    ...inserts.map((h) => ({
      sql: `INSERT OR IGNORE INTO households (code, label, invited_names, email, max_seats, locale)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [h.code, h.label, h.invitedNames, h.email, h.maxSeats, h.locale],
    })),
    ...updates.map((h) =>
      h.resetInvite
        ? {
            sql: `UPDATE households
                  SET label = ?, invited_names = ?, email = ?, max_seats = ?, locale = ?,
                      invite_status = 'pending', invited_at = NULL, invite_error = NULL
                  WHERE id = ?`,
            args: [h.label, h.invitedNames, h.email, h.maxSeats, h.locale, h.id],
          }
        : {
            sql: `UPDATE households
                  SET label = ?, invited_names = ?, email = ?, max_seats = ?, locale = ?
                  WHERE id = ?`,
            args: [h.label, h.invitedNames, h.email, h.maxSeats, h.locale, h.id],
          },
    ),
  ];
  await db().batch(stmts, 'write');
}

export async function listHouseholdsWithResponses(): Promise<HouseholdWithResponse[]> {
  await ensureSchema();
  const { rows } = await db().execute(
    `SELECT h.*,
            r.attending, r.party_size, r.names AS r_names, r.email AS r_email,
            r.dietary, r.message, r.meals, r.guest_names, r.updated_at AS r_updated
     FROM households h
     LEFT JOIN rsvps r ON r.household_id = h.id
     ORDER BY h.label COLLATE NOCASE`,
  );
  return rows.map((r) => ({ ...toHousehold(r), response: toResponse(r) }));
}

// --- a guest's reply ----------------------------------------------------------
export async function upsertRsvpForHousehold(
  householdId: number,
  data: {
    attending: Attending;
    partySize: number;
    names: string;
    email: string;
    dietary: string;
    message: string;
    meals: string[];
    guestNames: string[];
  },
): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT INTO rsvps (household_id, attending, party_size, names, email, dietary, message, meals, guest_names)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(household_id) DO UPDATE SET
            attending   = excluded.attending,
            party_size  = excluded.party_size,
            names       = excluded.names,
            email       = excluded.email,
            dietary     = excluded.dietary,
            message     = excluded.message,
            meals       = excluded.meals,
            guest_names = excluded.guest_names,
            updated_at  = datetime('now')`,
    args: [
      householdId,
      data.attending,
      data.partySize,
      data.names,
      data.email,
      data.dietary,
      data.message,
      JSON.stringify(data.meals),
      JSON.stringify(data.guestNames),
    ],
  });
}

export async function getResponseForHousehold(householdId: number): Promise<RsvpResponse | null> {
  await ensureSchema();
  const { rows } = await db().execute({
    sql: `SELECT attending, party_size, names AS r_names, email AS r_email,
                 dietary, message, meals, guest_names, updated_at AS r_updated
          FROM rsvps WHERE household_id = ? LIMIT 1`,
    args: [householdId],
  });
  return rows.length ? toResponse(rows[0]) : null;
}

// --- sending (invites + reminders) -------------------------------------------
/** Households that still need their invitation sent and have an email. */
export async function householdsPendingInvite(): Promise<Household[]> {
  await ensureSchema();
  const { rows } = await db().execute(
    `SELECT * FROM households
     WHERE invite_status != 'sent' AND email IS NOT NULL AND trim(email) != ''
     ORDER BY id`,
  );
  return rows.map(toHousehold);
}

/** Invited households that haven't replied yet AND haven't been reminded in the
    last 12h (reminder targets). The cooldown makes "send reminders" safe to click
    again — already-reminded households drop out, so no one is reminded twice even
    if some guests reply between sends. A deliberate later wave still works. */
export async function invitedNonResponders(): Promise<Household[]> {
  await ensureSchema();
  const { rows } = await db().execute(
    `SELECT h.* FROM households h
     LEFT JOIN rsvps r ON r.household_id = h.id
     WHERE h.invite_status = 'sent' AND r.id IS NULL
       AND h.email IS NOT NULL AND trim(h.email) != ''
       AND (h.reminded_at IS NULL OR h.reminded_at <= datetime('now', '-12 hours'))
     ORDER BY h.id`,
  );
  return rows.map(toHousehold);
}

export async function markInvited(
  results: Array<{ id: number; status: InviteStatus; error?: string | null }>,
): Promise<void> {
  if (!results.length) return;
  await ensureSchema();
  await db().batch(
    results.map((r) => ({
      sql: `UPDATE households
            SET invite_status = ?,
                invite_error = ?,
                invited_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE invited_at END
            WHERE id = ?`,
      args: [r.status, r.error ?? null, r.status, r.id],
    })),
    'write',
  );
}

export async function markReminded(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await ensureSchema();
  await db().batch(
    ids.map((id) => ({
      sql: `UPDATE households SET reminded_at = datetime('now') WHERE id = ?`,
      args: [id],
    })),
    'write',
  );
}
