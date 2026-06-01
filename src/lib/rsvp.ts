// ============================================================
// Map an action result into localized, per-field error state for the no-JS
// re-render of the RSVP form. (The JavaScript path maps errors client-side.)
// ============================================================
import { isInputError } from 'astro:actions';
import { getStrings } from '../i18n';
import type { Locale } from './i18n';
import { getHouseholdByCode, getResponseForHousehold, type Household, type RsvpResponse } from './db';
import { CONTACT_EMAIL } from '../data/site';

export interface RsvpFieldErrors {
  email?: string;
  attending?: string;
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
    if (fields.email) errors.email = t.errorEmail;
    if (fields.attending) errors.attending = t.errorAttending;
    return { errors, summary: t.errorSummary };
  }

  // Non-field errors (closed deadline, honeypot/captcha, or a server fault).
  const message = (error as { message?: string }).message;
  if (message === 'closed')
    return { errors: {}, summary: t.closedBody.replace('{email}', CONTACT_EMAIL) };
  if (message === 'choose') return { errors: {}, summary: t.errorChoose };
  return { errors: {}, summary: t.errorSummary };
}

export interface SubmittedValues {
  email?: string;
  attending?: 'yes' | 'no';
  dietary?: string;
  message?: string;
  coming?: string[]; // per invited seat: 'yes' | 'no'
  meals?: string[]; // per seat (invited guests, then plus-one slots)
  plusName?: string[]; // per plus-one seat
}

export interface RsvpContext {
  household: Household | null;
  response: RsvpResponse | null;
  errors: RsvpFieldErrors;
  summary?: string;
  submitted?: SubmittedValues;
}

/** Load the household for a code (from a path segment or ?c=) plus any prior
    reply, and map an action error. Shared by the path and query RSVP routes. */
export async function loadRsvp(
  code: string,
  result: { error?: unknown } | undefined,
  locale: Locale,
  request?: Request,
): Promise<RsvpContext> {
  const trimmed = code.trim();
  const household = trimmed ? await getHouseholdByCode(trimmed) : null;
  const response = household ? await getResponseForHousehold(household.id) : null;
  const { errors, summary } = rsvpErrorsFrom(result, locale);

  // On a no-JS error re-render, recover what the guest just typed so the form
  // isn't reset to defaults. Best-effort: if the body was already consumed, skip.
  let submitted: SubmittedValues | undefined;
  if (result?.error && request && request.method === 'POST') {
    try {
      const fd = await request.formData();
      const str = (k: string) => {
        const v = fd.get(k);
        return typeof v === 'string' ? v : undefined;
      };
      const att = str('attending');
      const strArr = (k: string) =>
        fd.getAll(k).filter((v): v is string => typeof v === 'string');
      submitted = {
        email: str('email'),
        attending: att === 'yes' || att === 'no' ? att : undefined,
        dietary: str('dietary'),
        message: str('message'),
        coming: strArr('coming'),
        meals: strArr('meals'),
        plusName: strArr('plusName'),
      };
    } catch {
      submitted = undefined;
    }
  }

  return { household, response, errors, summary, submitted };
}
