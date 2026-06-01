// ============================================================
// Language-neutral facts. Prose + labels live in src/i18n/{en,es}.ts.
// Items marked PLACEHOLDER must be confirmed before the site goes public
// (see the "Details to confirm" checklist in README.md).
// ============================================================
import type { LatLng } from '../lib/maps';

export type VenueRole = 'ceremony' | 'reception';

export interface Venue {
  id: string;
  name: string;
  shortName: string;
  role: VenueRole;
  addressLines: string[];
  postcode: string;
  coords: LatLng;
  /** Dotted what3words triple, e.g. "filled.count.soap". PLACEHOLDER — confirm the square at each entrance. */
  what3words: string;
  tel?: string;
  /** Alt text for the venue photograph (the image itself lives in src/assets, keyed by id). */
  image?: { alt: string };
}

export const SITE = {
  couple: { a: 'Mari', b: 'Michael', monogram: 'M & M' },
  /** Confirmed: Wednesday, 23 September 2026 (a midweek wedding — no "weekend" copy). */
  date: '2026-09-23',
  placeLine: 'Oxford & Bicester',
  /** Quiet sticky utility bar on mobile — switch on in the final weeks. */
  showUtilityBar: false,
};

/** RSVP settings. `deadline` is a PLACEHOLDER — confirm with the couple
    (≈4 weeks before the wedding). Replies are accepted through the end of that
    day; afterwards the form shows a polite "closed" message. Set `enabled` to
    false to take the form down entirely. */
export const RSVP = {
  deadline: '2026-08-26',
  enabled: true,
};

/** Whether the RSVP form is currently accepting replies. Closes at the end of the
    deadline day "Anywhere on Earth" (UTC-12), so no guest is cut off early by their
    timezone — a guest in Bolivia or the US gets the full calendar day. */
export function isRsvpOpen(now: Date = new Date()): boolean {
  if (!RSVP.enabled) return false;
  const end = new Date(`${RSVP.deadline}T23:59:59-12:00`);
  if (Number.isNaN(end.getTime())) return true; // misconfigured date → stay open
  return now.getTime() <= end.getTime();
}

/** Meal choices on the RSVP form. Replace the `en`/`es` labels with your real
    dish names; the guest picks one per attending person. Set `MEALS_ENABLED`
    false to hide the meal section. Keep it to ~2 mains + a vegetarian (the
    catering standard for a plated dinner). */
export const MEALS_ENABLED = true;

export interface MealOption {
  id: string;
  en: string;
  es: string;
}

export const MEALS: MealOption[] = [
  { id: 'main-1', en: 'Main course 1 — set dish name', es: 'Plato principal 1 — poner nombre' },
  { id: 'main-2', en: 'Main course 2 — set dish name', es: 'Plato principal 2 — poner nombre' },
  { id: 'vegetarian', en: 'Vegetarian', es: 'Vegetariano' },
];

export const MEAL_IDS = new Set(MEALS.map((m) => m.id));

export function mealLabel(id: string, locale: 'en' | 'es'): string {
  return MEALS.find((m) => m.id === id)?.[locale] ?? id;
}

export const VENUES: Venue[] = [
  {
    id: 'magdalen',
    name: 'Magdalen College',
    shortName: 'Magdalen',
    role: 'ceremony',
    addressLines: ['Magdalen College', 'High Street'],
    postcode: 'Oxford OX1 4AU',
    coords: { lat: 51.7519, lng: -1.2464 }, // approx — confirm entrance
    what3words: '', // not published by the college — confirm the Porters' Lodge square
    image: { alt: 'Magdalen College and its great tower, Oxford' },
  },
  {
    id: 'weston-manor',
    name: 'Weston Manor',
    shortName: 'Weston Manor',
    role: 'reception',
    addressLines: ['Weston Manor', 'Northampton Road', 'Weston-on-the-Green'],
    postcode: 'Bicester OX25 3QL',
    coords: { lat: 51.8966, lng: -1.2299 }, // approx — confirm entrance
    what3words: 'luxury.royal.executive', // official, from themanorweston.com/contact
    tel: '+441869350621',
    image: { alt: 'Weston Manor and its gardens' },
  },
];

export function venueById(id: string): Venue | undefined {
  return VENUES.find((v) => v.id === id);
}

export function venueByRole(role: VenueRole): Venue {
  const v = VENUES.find((x) => x.role === role);
  if (!v) throw new Error(`No venue for role ${role}`);
  return v;
}

/** On-the-day contact — PLACEHOLDER. Confirm name + number. */
export const ON_DAY_CONTACT = {
  name: 'Wedding coordinator',
  tel: '+447700900123', // PLACEHOLDER UK mobile
};

/** Local taxis — Royal Cars (Oxford + Bicester), per royal-cars.com.
    Display keeps spaced numbers; the tel: href strips spaces (see TodayPage). */
export const TAXIS = [
  { name: 'Royal Cars, Oxford', tel: '+44 1865 777 333' },
  { name: 'Royal Cars, Bicester', tel: '+44 1869 350 350' },
];
