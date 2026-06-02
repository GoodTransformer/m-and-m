// Parse + validate the couple's guest-list CSV. SERVER-ONLY (used by the import
// endpoint for both the dry-run preview and the real import).
//
// Accepted columns (header row, case-insensitive; aliases in parentheses):
//   household (label, party)        — required: the greeting / display name
//   guests (names, invited_names)   — the people invited, one full name each,
//                                     separated by semicolons. These ARE the
//                                     seats. If blank, defaults to one seat using
//                                     the household name.
//   plus (plus_ones, plus-one)      — optional: extra unnamed "+ guest" seats the
//                                     household may bring (default 0)
//   email                           — optional: where the invitation is sent
//   language (locale)               — optional: en | es (default en)
import { parseCsv } from './csv';

export interface ParsedGuestRow {
  line: number;
  label: string;
  email: string | null;
  invitedGuests: string[];
  plusOnes: number;
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
const MAX_GUESTS = 20;
const MAX_PLUS = 20;

function findColumn(header: string[], names: string[]): number {
  return header.findIndex((h) => names.includes(h));
}

/** Natural-language join: "Eleanor", "Eleanor & James", "Chidi, Amara & Ngozi". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export function parseGuestCsv(text: string): ParsedGuestList {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], headerError: 'The list is empty.', validCount: 0 };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = {
    label: findColumn(header, ['household', 'label', 'party', 'name']),
    email: findColumn(header, ['email', 'e-mail']),
    guests: findColumn(header, ['guests', 'names', 'invited_names', 'invited names', 'people']),
    plus: findColumn(header, ['plus', 'plus_ones', 'plus ones', 'plusones', 'plus_one', 'plus-one', 'plus one', 'extra']),
    locale: findColumn(header, ['language', 'locale', 'lang']),
  };
  if (col.label === -1) {
    return {
      rows: [],
      headerError: 'Missing a "household" column. Header row must include at least: household, guests.',
      validCount: 0,
    };
  }

  const seenEmail = new Set<string>();
  const seenLabelNoEmail = new Set<string>();
  const rows: ParsedGuestRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const get = (idx: number) => (idx >= 0 && idx < r.length ? r[idx].trim() : '');

    const label = get(col.label);
    const rawEmail = get(col.email);
    const email = rawEmail ? rawEmail.toLowerCase() : null;
    const rawLocale = get(col.locale).toLowerCase();
    const rawPlus = get(col.plus);

    // The named people are the seats. Separate with semicolons or new lines.
    let invitedGuests = get(col.guests)
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.slice(0, 120));
    if (invitedGuests.length === 0 && label) invitedGuests = [label];

    let issue: string | undefined;
    let plusOnes = 0;
    let locale: 'en' | 'es' = 'en';

    if (!label) issue = 'Missing household name';
    else if (email && !EMAIL_RE.test(email)) issue = 'Invalid email';
    else if (email && seenEmail.has(email)) issue = 'Duplicate email in list';
    // Two no-email rows with the same name can't be told apart on re-import
    // (matching falls back to label), so they'd collide — flag the duplicate.
    else if (!email && seenLabelNoEmail.has(label.toLowerCase()))
      issue = 'Duplicate name — add an email to tell them apart';
    else if (invitedGuests.length > MAX_GUESTS) issue = `Too many guests (max ${MAX_GUESTS})`;
    else if (rawPlus && !/^\d+$/.test(rawPlus)) issue = 'Plus-ones must be a whole number';
    else if (rawPlus && Number(rawPlus) > MAX_PLUS) issue = `Plus-ones must be 0–${MAX_PLUS}`;
    else if (rawLocale && rawLocale !== 'en' && rawLocale !== 'es') issue = 'Language must be en or es';

    if (rawPlus && /^\d+$/.test(rawPlus)) plusOnes = Math.min(Number(rawPlus), MAX_PLUS);
    if (rawLocale === 'es') locale = 'es';
    if (email) seenEmail.add(email);
    else if (label) seenLabelNoEmail.add(label.toLowerCase());

    rows.push({
      line: i + 1,
      label,
      email,
      invitedGuests,
      plusOnes,
      maxSeats: Math.max(invitedGuests.length + plusOnes, 1),
      locale,
      invitedNames: joinNames(invitedGuests) || label,
      valid: !issue,
      issue,
    });
  }

  return { rows, validCount: rows.filter((r) => r.valid).length };
}
