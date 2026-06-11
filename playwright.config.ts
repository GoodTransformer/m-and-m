// ============================================================
// End-to-end suite. Boots the real dev server on its own port against a
// scratch database (file:e2e.db — a local `file:` URL is honoured without
// DEV_USE_LIVE_SERVICES, so email stays logged and the captcha stays off; see
// src/lib/db.ts). The `seed` project logs into /admin and imports a small
// guest list first; the specs then exercise the guest-facing flows.
// ============================================================
import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;
export const E2E_PASSCODE = 'e2e-passcode-only';
export const SEED_FILE = 'tests/.tmp/e2e-seed.json';
// Astro's built-in CSRF protection (security.checkOrigin) refuses a form POST
// without an Origin header. Browsers always send one; the API request context
// doesn't — so specs that POST forms directly must state it explicitly.
export const E2E_ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  // One shared server + one shared scratch DB: keep runs deterministic.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: E2E_ORIGIN,
    trace: 'retain-on-failure',
    // Reduced-motion emulation (instant scroll, reveals visible — required for
    // stable clicks and honest axe contrast sampling) is applied per-page in
    // e2e/fixtures.ts; the use:{reducedMotion} option here didn't take effect.
  },
  projects: [
    { name: 'seed', testMatch: /seed\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['seed'] },
  ],
  webServer: {
    command: `rm -f e2e.db e2e.db-* && npm run dev -- --port ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      TURSO_DATABASE_URL: 'file:e2e.db',
      ADMIN_PASSCODE: E2E_PASSCODE,
      DEV_USE_LIVE_SERVICES: 'false',
      SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
