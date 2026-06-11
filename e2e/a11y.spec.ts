// Axe scans of the key guest-facing pages, both editions. Serious/critical
// violations fail; minor/moderate ones are reported for judgement, not blocked
// on — this is a designed site, and some axe heuristics (e.g. contrast on
// decorative elements) deserve a human eye rather than an automatic veto.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { readFile } from 'node:fs/promises';
import { SEED_FILE } from '../playwright.config';

const PAGES = ['/', '/es/', '/questions/', '/travel/', '/the-day/'];

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`).join('\n'),
    ).toEqual([]);
  });
}

test('axe: the RSVP form', async ({ page }) => {
  const codes = JSON.parse(await readFile(SEED_FILE, 'utf8'));
  await page.goto(`/rsvp/${codes['The Berrys']}/`);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(
    blocking,
    blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`).join('\n'),
  ).toEqual([]);
});
