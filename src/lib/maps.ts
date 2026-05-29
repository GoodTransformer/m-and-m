// ============================================================
// Map deep-links + what3words, built statically (no map library, no API key).
// Universal Google Maps URLs work cross-platform (iOS / Android / desktop).
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

/** Universal Google Maps directions link to a destination. Opens the app where installed. */
export function googleDirections({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Universal Google Maps "drop a pin / search" link. */
export function googlePlace({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Apple Maps link (nice for iOS guests). */
export function appleMaps({ lat, lng }: LatLng, name: string): string {
  return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`;
}

/** what3words destination URL. `words` is a dotted triple, e.g. "filled.count.soap". */
export function what3wordsUrl(words: string): string {
  return `https://what3words.com/${words.replace(/^\/+/, '')}`;
}

/** Branded display form: ///three.word.address */
export function what3wordsDisplay(words: string): string {
  return `///${words.replace(/^\/+/, '')}`;
}
