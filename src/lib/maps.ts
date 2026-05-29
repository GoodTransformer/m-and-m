// ============================================================
// Map deep-links + what3words, built statically (no map library, no API key).
// Universal Google Maps URLs work cross-platform (iOS / Android / desktop).
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Universal Google Maps directions link. `query` should be a precise place
 * string (e.g. "Weston Manor, Bicester OX25 3QL") so Maps resolves the exact
 * business rather than an approximate coordinate. Cross-platform, no API key.
 */
export function googleDirections(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/** Apple Maps search link (nice for iOS guests). */
export function appleMaps(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

/** what3words destination URL. `words` is a dotted triple, e.g. "filled.count.soap". */
export function what3wordsUrl(words: string): string {
  return `https://what3words.com/${words.replace(/^\/+/, '')}`;
}

/** Branded display form: ///three.word.address */
export function what3wordsDisplay(words: string): string {
  return `///${words.replace(/^\/+/, '')}`;
}
