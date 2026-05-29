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
}

export const SITE = {
  couple: { a: 'Mari', b: 'Michael', monogram: 'M & M' },
  /** PLACEHOLDER date — a candlelit early-autumn Saturday. Confirm. */
  date: '2026-09-12',
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
    what3words: 'spells.tested.behave', // PLACEHOLDER — confirm
  },
  {
    id: 'weston-manor',
    name: 'Weston Manor',
    shortName: 'Weston Manor',
    role: 'reception',
    addressLines: ['Weston Manor', 'Northampton Road', 'Weston-on-the-Green'],
    postcode: 'Bicester OX25 3QL',
    coords: { lat: 51.8966, lng: -1.2299 }, // approx — confirm entrance
    what3words: 'manor.candle.evening', // PLACEHOLDER — confirm
    tel: '+441869350621',
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

/** Local taxis — PLACEHOLDER. Confirm/replace. */
export const TAXIS = [
  { name: 'Royal Cars, Oxford', tel: '+441865777333' }, // PLACEHOLDER
  { name: 'Bicester Taxis', tel: '+441869320320' }, // PLACEHOLDER
];
