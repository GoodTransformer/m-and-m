// ============================================================
// Map an action result into localized, per-field error state for the no-JS
// re-render of the RSVP form. (The JavaScript path maps errors client-side.)
// ============================================================
import { isInputError } from 'astro:actions';
import { getStrings } from '../i18n';
import type { Locale } from './i18n';
import { getHouseholdByCode, getResponseForHousehold, type Household, type RsvpResponse } from './db';

export interface RsvpFieldErrors {
  names?: string;
  email?: string;
  attending?: string;
  partySize?: string;
}

export interface RsvpErrorState {
  errors: RsvpFieldErrors;
  summary?: string;
}

export function rsvpErrorsFrom(
  result: { error?: unknown } | undefined,
  locale: Locale,
): RsvpErrorState {
  const t = getStrings(locale).rsvp;
  const error = result?.error;
  if (!error) return { errors: {} };

  // Field-level validation failures.
  if (isInputError(error as never)) {
    const fields = (error as { fields: Record<string, string[] | undefined> }).fields;
    const errors: RsvpFieldErrors = {};
    if (fields.names) errors.names = t.errorNames;
    if (fields.email) errors.email = t.errorEmail;
    if (fields.attending) errors.attending = t.errorAttending;
    if (fields.partySize) errors.partySize = t.errorParty;
    return { errors, summary: t.errorSummary };
  }

  // Non-field errors (closed deadline, honeypot/captcha, or a server fault).
  const message = (error as { message?: string }).message;
  if (message === 'closed') return { errors: {}, summary: t.closedBody };
  return { errors: {}, summary: t.errorSummary };
}

export interface RsvpContext {
  household: Household | null;
  response: RsvpResponse | null;
  errors: RsvpFieldErrors;
  summary?: string;
}

/** Load the household for a code (from a path segment or ?c=) plus any prior
    reply, and map an action error. Shared by the path and query RSVP routes. */
export async function loadRsvp(
  code: string,
  result: { error?: unknown } | undefined,
  locale: Locale,
): Promise<RsvpContext> {
  const trimmed = code.trim();
  const household = trimmed ? await getHouseholdByCode(trimmed) : null;
  const response = household ? await getResponseForHousehold(household.id) : null;
  const { errors, summary } = rsvpErrorsFrom(result, locale);
  return { household, response, errors, summary };
}
