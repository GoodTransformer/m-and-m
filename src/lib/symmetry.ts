// ============================================================
// Copy symmetry helper.
// Where a section has multiple copy blocks (paired venue blurbs, the
// "weekend at a glance" cards, etc.), we aim for matched character counts
// *within each language* so the blocks render as balanced columns.
// This dev-only check warns in the console when paired blocks drift apart.
// ============================================================

/** Visible character count, whitespace-normalised. */
export function charCount(s: string): number {
  return [...s.replace(/\s+/g, ' ').trim()].length;
}

/**
 * Warn (in dev only) when blocks in a set vary beyond `tolerance` (fraction
 * of the longest block). Pass the rendered strings for a single locale.
 */
export function checkSymmetry(label: string, blocks: string[], tolerance = 0.18): void {
  if (!import.meta.env.DEV || blocks.length < 2) return;
  const counts = blocks.map(charCount);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (max - min > max * tolerance) {
    // eslint-disable-next-line no-console
    console.warn(
      `[symmetry] "${label}" — blocks vary by ${max - min} chars (${counts.join(' / ')}); aim within ${Math.round(
        tolerance * 100,
      )}%.`,
    );
  }
}

/** Target character budgets per block type (English; Spanish ≈ 1.2×). */
export const BUDGET = {
  sectionIntro: { en: 240, es: 290 },
  card: { en: 110, es: 130 },
  venueBlurb: { en: 200, es: 240 },
  faqAnswer: { en: 320, es: 380 },
} as const;
