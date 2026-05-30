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
