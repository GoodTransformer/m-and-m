// ============================================================
// RSVP datastore (libSQL / Turso). SERVER-ONLY — never imported by client code.
// Guest-list model: one `households` row per invited party, carrying the *named*
// invited guests and any granted plus-ones (plus an unguessable code + invite
// status), and at most one `rsvps` row per household — their reply, stored as a
// per-person roster. Every query is parameterised, so input can't be
// interpolated into SQL.
// ============================================================
import type { Client } from '@libsql/client';
import { generateCode } from './code';
import { useLiveServices } from './services';

// Local dev defaults to a SQLite file — even when .env carries the production
// TURSO_DATABASE_URL (it lives there for `npm run backup`). A dev server must
// never read or write the live guest list by accident; opt in explicitly with
// DEV_USE_LIVE_SERVICES=true. A `file:` URL is honoured even without the flag —
// it's local by construction (the e2e suite points the dev server at its own
// scratch file this way without un-gating email/captcha). Production (Vercel)
// has no writable local filesystem, so it must be given a remote Turso URL —
// never silently fall back to a file: path there (opening it throws and
// crashes the whole function).
const envUrl = import.meta.env.TURSO_DATABASE_URL || '';
const url = useLiveServices
  ? envUrl || (import.meta.env.PROD ? '' : 'file:local.db')
  : envUrl.startsWith('file:')
    ? envUrl
    : 'file:local.db';
const authToken = import.meta.env.TURSO_AUTH_TOKEN || undefined;

// Choose the driver by URL scheme. The default '@libsql/client' entry EAGERLY
// loads a platform-specific *native* binding (the `libsql` package) the moment
// it's imported — which a bundled serverless function on Vercel can't ship, so
// importing it there crashes the function on boot. Only the local file: DB needs
// it. Remote URLs use the pure-JS web client ('@libsql/client/web', hrana over
// HTTP), which bundles cleanly. The import is DYNAMIC so the native module is
// never even loaded in production. Cache the promise so init happens once.
let _clientP: Promise<Client> | null = null;
function getClient(): Promise<Client> {
  if (!_clientP) {
    _clientP = (
      url.startsWith('file:') ? import('@libsql/client') : import('@libsql/client/web')
    ).then((m) => m.createClient({ url, authToken }));
  }
  return _clientP;
}

export type Attending = 'yes' | 'no';
export type InviteStatus = 'pending' | 'sent' | 'failed';
export type Locale = 'en' | 'es';

export interface Household {
  id: number;
  code: string;
  label: string;
  invitedNames: string; // display string, e.g. "Eleanor & James Whitfield"
  invitedGuests: string[]; // the named people — the authoritative seat list
  plusOnes: number; // granted extra "+ guest" seats (default 0)
  email: string | null;
  maxSeats: number; // = invitedGuests.length + plusOnes (the cap)
  locale: Locale;
  inviteStatus: InviteStatus;
  invitedAt: string | null;
  remindedAt: string | null;
  inviteError: string | null;
  // Delivery outcome from the Resend webhook (does mail to this address arrive?).
  deliveryStatus: 'delivered' | 'bounced' | 'complained' | null;
  deliveryDetail: string | null; // bounce reason, when known
  deliveryAt: string | null; // when the last delivery event was recorded
  createdAt: string;
}

/** One seat of a reply. `name` is an invited person (taken from the household,
    never the form) or, for a plus-one, the name the guest typed. */
export interface RosterEntry {
  name: string;
  coming: boolean;
  meal: string; // meal id, or '' when none chosen / not coming
  plusOne: boolean;
}

export interface RsvpResponse {
  attending: Attending; // derived: 'yes' iff at least one seat is coming
  partySize: number; // count of coming seats
  roster: RosterEntry[]; // positional: invited guests first, then plus-one slots
  email: string;
  dietary: string;
  message: string;
  updatedAt: string;
}

export interface HouseholdWithResponse extends Household {
  response: RsvpResponse | null;
}

export interface NewHousehold {
  label: string;
  invitedNames: string;
  invitedGuests: string[];
  plusOnes: number;
  email: string | null;
  locale: Locale;
}

/** Seat cap = named people + granted plus-ones, never below 1. */
export function seatsFor(invitedGuests: string[], plusOnes: number): number {
  return Math.max(invitedGuests.length + Math.max(plusOnes, 0), 1);
}

// --- schema -------------------------------------------------------------------
let _schema: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!_schema) {
    _schema = (async () => {
      await (await getClient()).batch(
        [
          `CREATE TABLE IF NOT EXISTS households (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            code           TEXT    NOT NULL UNIQUE,
            label          TEXT    NOT NULL,
            invited_names  TEXT    NOT NULL DEFAULT '',
            invited_guests TEXT    NOT NULL DEFAULT '[]',
            plus_ones      INTEGER NOT NULL DEFAULT 0,
            email          TEXT,
            max_seats      INTEGER NOT NULL DEFAULT 2,
            locale         TEXT    NOT NULL DEFAULT 'en',
            invite_status  TEXT    NOT NULL DEFAULT 'pending',
            invited_at     TEXT,
            reminded_at    TEXT,
            invite_error   TEXT,
            delivery_status TEXT,
            delivery_detail TEXT,
            delivery_at     TEXT,
            created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
          )`,
          // One household per email (NULLs allowed for paper-only guests).
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_households_email ON households(lower(email))`,
          `CREATE TABLE IF NOT EXISTS rsvps (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            household_id INTEGER NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
            attending    TEXT    NOT NULL,
            party_size   INTEGER NOT NULL DEFAULT 0,
            roster       TEXT    NOT NULL DEFAULT '[]',
            email        TEXT    NOT NULL DEFAULT '',
            dietary      TEXT    NOT NULL DEFAULT '',
            message      TEXT    NOT NULL DEFAULT '',
            created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
          )`,
        ],
        'write',
      );
      // Additive migrations for databases created before a column existed
      // (no-op if the column is already there).
      const add = async (sql: string) => (await getClient()).execute(sql).catch(() => undefined);
      await add(`ALTER TABLE households ADD COLUMN invited_guests TEXT NOT NULL DEFAULT '[]'`);
      await add(`ALTER TABLE households ADD COLUMN plus_ones INTEGER NOT NULL DEFAULT 0`);
      await add(`ALTER TABLE rsvps ADD COLUMN roster TEXT NOT NULL DEFAULT '[]'`);
      await add(`ALTER TABLE households ADD COLUMN delivery_status TEXT`);
      await add(`ALTER TABLE households ADD COLUMN delivery_detail TEXT`);
      await add(`ALTER TABLE households ADD COLUMN delivery_at TEXT`);
    })().catch((err) => {
      _schema = null;
      throw err;
    });
  }
  return _schema;
}

// --- row mappers --------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
function parseStringArray(v: unknown): string[] {
  if (typeof v !== 'string' || !v) return [];
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseRoster(v: unknown): RosterEntry[] {
  if (typeof v !== 'string' || !v) return [];
  try {
    const a = JSON.parse(v);
    if (!Array.isArray(a)) return [];
    return a
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        name: typeof x.name === 'string' ? x.name : '',
        coming: Boolean(x.coming),
        meal: typeof x.meal === 'string' ? x.meal : '',
        plusOne: Boolean(x.plusOne),
      }));
  } catch {
    return [];
  }
}

function toHousehold(r: any): Household {
  const invitedGuests = parseStringArray(r.invited_guests);
  const plusOnes = Math.max(Number(r.plus_ones ?? 0) || 0, 0);
  return {
    id: Number(r.id),
    code: String(r.code),
    label: String(r.label ?? ''),
    invitedNames: String(r.invited_names ?? ''),
    invitedGuests,
    plusOnes,
    email: r.email == null ? null : String(r.email),
    maxSeats: Number(r.max_seats ?? 0) || seatsFor(invitedGuests, plusOnes),
    locale: String(r.locale) === 'es' ? 'es' : 'en',
    inviteStatus: (['pending', 'sent', 'failed'].includes(String(r.invite_status))
      ? String(r.invite_status)
      : 'pending') as InviteStatus,
    invitedAt: r.invited_at == null ? null : String(r.invited_at),
    remindedAt: r.reminded_at == null ? null : String(r.reminded_at),
    inviteError: r.invite_error == null ? null : String(r.invite_error),
    deliveryStatus: ['delivered', 'bounced', 'complained'].includes(String(r.delivery_status))
      ? (String(r.delivery_status) as 'delivered' | 'bounced' | 'complained')
      : null,
    deliveryDetail: r.delivery_detail == null ? null : String(r.delivery_detail),
    deliveryAt: r.delivery_at == null ? null : String(r.delivery_at),
    createdAt: String(r.created_at ?? ''),
  };
}

function toResponse(r: any): RsvpResponse | null {
  if (r.attending == null) return null;
  return {
    attending: String(r.attending) === 'no' ? 'no' : 'yes',
    partySize: Number(r.party_size ?? 0),
    roster: parseRoster(r.roster),
    email: String(r.r_email ?? ''),
    dietary: String(r.dietary ?? ''),
    message: String(r.message ?? ''),
    updatedAt: String(r.r_updated ?? ''),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- households ---------------------------------------------------------------
export async function generateUniqueCode(): Promise<string> {
  await ensureSchema();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode();
    const { rows } = await (await getClient()).execute({
      sql: 'SELECT 1 FROM households WHERE code = ? LIMIT 1',
      args: [code],
    });
    if (rows.length === 0) return code;
  }
  throw new Error('Could not allocate a unique household code');
}

export async function getHouseholdByCode(code: string): Promise<Household | null> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute({
    sql: 'SELECT * FROM households WHERE code = ? LIMIT 1',
    args: [code],
  });
  return rows.length ? toHousehold(rows[0]) : null;
}

export async function getHouseholdByEmail(email: string): Promise<Household | null> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute({
    sql: 'SELECT * FROM households WHERE lower(email) = lower(?) LIMIT 1',
    args: [email],
  });
  return rows.length ? toHousehold(rows[0]) : null;
}

/** Insert a new household with a freshly-allocated code; returns the code. */
export async function insertHousehold(h: NewHousehold): Promise<string> {
  await ensureSchema();
  const code = await generateUniqueCode();
  await (await getClient()).execute({
    sql: `INSERT INTO households (code, label, invited_names, invited_guests, plus_ones, email, max_seats, locale)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      code,
      h.label,
      h.invitedNames,
      JSON.stringify(h.invitedGuests),
      h.plusOnes,
      h.email,
      seatsFor(h.invitedGuests, h.plusOnes),
      h.locale,
    ],
  });
  return code;
}

/** Update an existing household's details on re-import (code/status untouched). */
export async function updateHouseholdDetails(id: number, h: NewHousehold): Promise<void> {
  await ensureSchema();
  await (await getClient()).execute({
    sql: `UPDATE households
          SET label = ?, invited_names = ?, invited_guests = ?, plus_ones = ?, email = ?, max_seats = ?, locale = ?
          WHERE id = ?`,
    args: [
      h.label,
      h.invitedNames,
      JSON.stringify(h.invitedGuests),
      h.plusOnes,
      h.email,
      seatsFor(h.invitedGuests, h.plusOnes),
      h.locale,
      id,
    ],
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
      sql: `INSERT OR IGNORE INTO households (code, label, invited_names, invited_guests, plus_ones, email, max_seats, locale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        h.code,
        h.label,
        h.invitedNames,
        JSON.stringify(h.invitedGuests),
        h.plusOnes,
        h.email,
        seatsFor(h.invitedGuests, h.plusOnes),
        h.locale,
      ],
    })),
    ...updates.map((h) =>
      h.resetInvite
        ? {
            sql: `UPDATE households
                  SET label = ?, invited_names = ?, invited_guests = ?, plus_ones = ?, email = ?, max_seats = ?, locale = ?,
                      invite_status = 'pending', invited_at = NULL, invite_error = NULL
                  WHERE id = ?`,
            args: [
              h.label,
              h.invitedNames,
              JSON.stringify(h.invitedGuests),
              h.plusOnes,
              h.email,
              seatsFor(h.invitedGuests, h.plusOnes),
              h.locale,
              h.id,
            ],
          }
        : {
            sql: `UPDATE households
                  SET label = ?, invited_names = ?, invited_guests = ?, plus_ones = ?, email = ?, max_seats = ?, locale = ?
                  WHERE id = ?`,
            args: [
              h.label,
              h.invitedNames,
              JSON.stringify(h.invitedGuests),
              h.plusOnes,
              h.email,
              seatsFor(h.invitedGuests, h.plusOnes),
              h.locale,
              h.id,
            ],
          },
    ),
  ];
  await (await getClient()).batch(stmts, 'write');
}

export async function listHouseholdsWithResponses(): Promise<HouseholdWithResponse[]> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute(
    `SELECT h.*,
            r.attending, r.party_size, r.roster, r.email AS r_email,
            r.dietary, r.message, r.updated_at AS r_updated
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
    roster: RosterEntry[];
    email: string;
    dietary: string;
    message: string;
  },
): Promise<void> {
  await ensureSchema();
  await (await getClient()).execute({
    sql: `INSERT INTO rsvps (household_id, attending, party_size, roster, email, dietary, message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(household_id) DO UPDATE SET
            attending   = excluded.attending,
            party_size  = excluded.party_size,
            roster      = excluded.roster,
            email       = excluded.email,
            dietary     = excluded.dietary,
            message     = excluded.message,
            updated_at  = datetime('now')`,
    args: [
      householdId,
      data.attending,
      data.partySize,
      JSON.stringify(data.roster),
      data.email,
      data.dietary,
      data.message,
    ],
  });
}

export async function getResponseForHousehold(householdId: number): Promise<RsvpResponse | null> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute({
    sql: `SELECT attending, party_size, roster, email AS r_email,
                 dietary, message, updated_at AS r_updated
          FROM rsvps WHERE household_id = ? LIMIT 1`,
    args: [householdId],
  });
  return rows.length ? toResponse(rows[0]) : null;
}

// --- sending (invites + reminders) -------------------------------------------
/** Households that still need their invitation sent, have an email, AND haven't
    already replied. The last clause matters after a re-import: correcting an
    email re-queues the invite (invite_status → 'pending'), but if that household
    has already RSVP'd we must NOT send them a fresh invitation. */
export async function householdsPendingInvite(): Promise<Household[]> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute(
    `SELECT h.* FROM households h
     LEFT JOIN rsvps r ON r.household_id = h.id
     WHERE h.invite_status != 'sent' AND h.email IS NOT NULL AND trim(h.email) != ''
       AND r.id IS NULL
     ORDER BY h.id`,
  );
  return rows.map(toHousehold);
}

/** Invited households that haven't replied yet AND haven't been reminded in the
    last 12h (reminder targets). The cooldown makes "send reminders" safe to click
    again — already-reminded households drop out, so no one is reminded twice even
    if some guests reply between sends. A deliberate later wave still works. */
export async function invitedNonResponders(): Promise<Household[]> {
  await ensureSchema();
  const { rows } = await (await getClient()).execute(
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
  await (await getClient()).batch(
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
  await (await getClient()).batch(
    ids.map((id) => ({
      sql: `UPDATE households SET reminded_at = datetime('now') WHERE id = ?`,
      args: [id],
    })),
    'write',
  );
}

/** Record a delivery outcome from the Resend webhook, matched by recipient email.
    Returns how many households were updated (0 if the address isn't a guest's —
    e.g. the couple's own notification/test inbox), so the webhook can ack either
    way. A 'bounced' means the invitation never reached that guest. */
export async function recordDelivery(
  email: string,
  status: 'delivered' | 'bounced' | 'complained',
  detail?: string,
): Promise<number> {
  await ensureSchema();
  const res = await (await getClient()).execute({
    sql: `UPDATE households SET delivery_status = ?, delivery_detail = ?, delivery_at = datetime('now')
          WHERE lower(email) = lower(?)`,
    args: [status, detail ?? null, email],
  });
  return Number(res.rowsAffected ?? 0);
}
