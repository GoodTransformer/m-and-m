// Shared test base: every page emulates prefers-reduced-motion. The site's own
// @media fallbacks then take over — instant scroll (no "element is not stable"
// click failures from html{scroll-behavior:smooth}) and reveal-on-scroll
// content at full opacity (axe otherwise samples text mid-fade and reports
// phantom contrast failures). Set via page.emulateMedia because the
// use:{reducedMotion} config option did not take effect under this setup.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await use(page);
  },
});

export { expect };
