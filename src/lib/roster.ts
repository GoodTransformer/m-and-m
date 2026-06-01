// Pure, server-side construction of an RSVP reply roster. Extracted from the
// action so the rules can be unit-tested in isolation. The invariants it enforces
// are the precision guarantees of the whole system:
//  - invited guests' names come from the household (the caller passes them), never
//    the form, so a tampered submission can't rename anyone;
//  - a plus-one is counted only when the guest typed a name, and only up to the
//    granted `plusOnes` allowance — any extra plus-one fields are ignored;
//  - a meal is kept only for someone who is coming, and only if it's a known id;
//  - with two or more named guests each attendance is an explicit choice ('yes'
//    counts; blank / 'no' / missing do not). A lone guest is implied by the
//    household's "yes".
import { MEAL_IDS } from '../data/site';
import type { RosterEntry } from './db';

export interface RosterInput {
  invitedGuests: string[];
  plusOnes: number;
  attending: 'yes' | 'no';
  coming: string[]; // per invited seat: 'yes' | 'no' | ''
  meals: string[]; // per seat — invited guests first, then plus-one slots
  plusName: string[]; // per granted plus-one seat
}

export interface RosterResult {
  roster: RosterEntry[];
  partySize: number;
  attending: 'yes' | 'no';
}

export function buildRoster(input: RosterInput): RosterResult {
  const { invitedGuests, attending } = input;
  const plusCap = Math.max(input.plusOnes, 0);
  const mealAt = (i: number) => {
    const m = input.meals[i] ?? '';
    return MEAL_IDS.has(m) ? m : '';
  };
  const perGuest = invitedGuests.length > 1;

  const roster: RosterEntry[] = [];
  if (attending === 'yes') {
    invitedGuests.forEach((name, i) => {
      const coming = perGuest ? input.coming[i] === 'yes' : true;
      roster.push({ name, coming, meal: coming ? mealAt(i) : '', plusOne: false });
    });
    for (let j = 0; j < plusCap; j++) {
      const name = (input.plusName[j] ?? '').trim().slice(0, 120);
      const coming = name !== '';
      roster.push({
        name,
        coming,
        meal: coming ? mealAt(invitedGuests.length + j) : '',
        plusOne: true,
      });
    }
  }

  const partySize = roster.filter((r) => r.coming).length;
  // Said yes but nobody is actually coming → treat as a decline.
  return { roster, partySize, attending: partySize > 0 ? 'yes' : 'no' };
}
