// Parse + validate the couple's guest-list CSV. SERVER-ONLY (used by the import
// endpoint for both the dry-run preview and the real import).
//
// Accepted columns (header row, case-insensitive; aliases in parentheses):
//   household (label, party)   — required: the greeting / display name
//   email                      — optional: where the invitation is sent
//   seats (max_seats)          — optional: allowed party size (default 2)
//   language (locale)          — optional: en | es (default en)
//   names (invited_names)      — optional: names to pre-fill (default = household)
import { parseCsv } from './csv';

export interface ParsedGuestRow {
  line: number;
  label: string;
  email: string | null;
  maxSeats: number;
  locale: 'en' | 'es';
  invitedNames: string;
  valid: boolean;
  issue?: string;
}

export interface ParsedGuestList {
  rows: ParsedGuestRow[];
  headerError?: string;
  validCount: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function findColumn(header: string[], names: string[]): number {
  return header.findIndex((h) => names.includes(h));
}

export function parseGuestCsv(text: string): ParsedGuestList {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], headerError: 'The list is empty.', validCount: 0 };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = {
    label: findColumn(header, ['household', 'label', 'party', 'name']),
    email: findColumn(header, ['email', 'e-mail']),
    seats: findColumn(header, ['seats', 'max_seats', 'max seats', 'maxseats']),
    locale: findColumn(header, ['language', 'locale', 'lang']),
    names: findColumn(header, ['names', 'invited_names', 'invited names', 'guests']),
  };
  if (col.label === -1) {
    return {
      rows: [],
      headerError: 'Missing a "household" column. Header row must include at least: household, email.',
      validCount: 0,
    };
  }

  const seenEmail = new Set<string>();
  const rows: ParsedGuestRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const get = (idx: number) => (idx >= 0 && idx < r.length ? r[idx].trim() : '');

    const label = get(col.label);
    const rawEmail = get(col.email);
    const email = rawEmail ? rawEmail.toLowerCase() : null;
    const rawSeats = get(col.seats);
    const rawLocale = get(col.locale).toLowerCase();
    const names = get(col.names) || label;

    let issue: string | undefined;
    let maxSeats = 2;
    let locale: 'en' | 'es' = 'en';

    if (!label) issue = 'Missing household name';
    else if (email && !EMAIL_RE.test(email)) issue = 'Invalid email';
    else if (email && seenEmail.has(email)) issue = 'Duplicate email in list';
    else if (rawSeats && !/^\d+$/.test(rawSeats)) issue = 'Seats must be a whole number';
    else if (rawSeats && (Number(rawSeats) < 1 || Number(rawSeats) > 50)) issue = 'Seats must be 1–50';
    else if (rawLocale && rawLocale !== 'en' && rawLocale !== 'es') issue = 'Language must be en or es';

    if (rawSeats && /^\d+$/.test(rawSeats)) maxSeats = Math.min(Math.max(Number(rawSeats), 1), 50);
    if (rawLocale === 'es') locale = 'es';
    if (email) seenEmail.add(email);

    rows.push({
      line: i + 1,
      label,
      email,
      maxSeats,
      locale,
      invitedNames: names,
      valid: !issue,
      issue,
    });
  }

  return { rows, validCount: rows.filter((r) => r.valid).length };
}
