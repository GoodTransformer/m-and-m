// The copy-symmetry rule, enforced: blocks that render side by side (or as a
// rhythmic sequence) stay within checkSymmetry's default tolerance of the
// longest block, within each language. If a copy edit breaks one of these,
// rebalance the paired blocks rather than loosening the test.
import { describe, expect, it } from 'vitest';
import { charCount } from '../src/lib/symmetry';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';

const TOLERANCE = 0.18; // checkSymmetry's default

function spread(blocks: string[]): { max: number; min: number } {
  const counts = blocks.map(charCount);
  return { max: Math.max(...counts), min: Math.min(...counts) };
}

const editions = [
  ['en', en],
  ['es', es],
] as const;

describe('copy symmetry', () => {
  it.each(editions)('%s: the four homepage chapter intros are length-matched', (_, t) => {
    const blocks = [
      t.home.weekend.intro,
      t.home.venues.intro,
      t.home.travel.intro,
      t.home.gifts.intro,
    ];
    const { max, min } = spread(blocks);
    expect(max - min, `intros vary by ${max - min} chars of ${max}`).toBeLessThanOrEqual(
      max * TOLERANCE,
    );
  });

  it.each(editions)('%s: the welcome body paragraphs are length-matched', (_, t) => {
    const { max, min } = spread(t.home.welcome.body);
    expect(max - min).toBeLessThanOrEqual(max * TOLERANCE);
  });

  it('charCount normalises whitespace before counting', () => {
    expect(charCount('  a  b\n c ')).toBe(5);
    expect(charCount('')).toBe(0);
  });
});
