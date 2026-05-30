// ============================================================
// Map deep-links + what3words, built statically (no map library, no API key).
// Universal Google Maps URLs work cross-platform (iOS / Android / desktop).
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Universal Google Maps directions link.
 *
 * `query` is a precise place string ("Weston Manor, Bicester OX25 3QL") so
 * Maps resolves the exact business, not an approximate coordinate. We omit
 * `origin` deliberately: per Google's URL API, that defaults to the user's
 * current location on the mobile app and prompts for it on web. We also
 * set `travelmode=driving` to skip the mode-picker.
 *
 * Docs: https://developers.google.com/maps/documentation/urls/get-started
 */
export function googleDirections(query: string): string {
  const dest = encodeURIComponent(query);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

/**
 * Apple Maps directions link. `daddr` is the destination; omitting `saddr`
 * means "from current location". `dirflg=d` selects driving.
 *
 * Docs: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
 */
export function appleMaps(query: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=d`;
}

/** what3words destination URL. `words` is a dotted triple, e.g. "filled.count.soap". */
export function what3wordsUrl(words: string): string {
  return `https://what3words.com/${words.replace(/^\/+/, '')}`;
}

/** Branded display form: ///three.word.address */
export function what3wordsDisplay(words: string): string {
  return `///${words.replace(/^\/+/, '')}`;
}
