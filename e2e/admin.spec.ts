// The admin surface: auth gating, the login flow, and the brute-force throttle.
import { expect, test } from './fixtures';
import { E2E_ORIGIN, E2E_PASSCODE } from '../playwright.config';

test('every admin route is gated without a session', async ({ request }) => {
  const page = await request.get('/admin/', { maxRedirects: 0 });
  expect(page.status()).toBe(303);
  expect(page.headers()['location']).toContain('/admin/login');

  const csv = await request.get('/admin/export.csv', { maxRedirects: 0 });
  expect(csv.status()).toBe(303);

  const post = await request.post('/admin/import/', {
    data: { csv: 'household\nIntruders', dryRun: true },
  });
  expect(post.status()).toBe(401);
});

test('the login page signs the couple in', async ({ page }) => {
  await page.goto('/admin/login/');
  await page.locator('input[name="passcode"]').fill(E2E_PASSCODE);
  await page.getByRole('button', { name: /sign in|enter/i }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
});

test('a wrong passcode redirects back with the error flag', async ({ request }) => {
  const res = await request.post('/admin/auth/', {
    form: { passcode: 'not-the-passcode' },
    headers: { origin: E2E_ORIGIN, 'x-forwarded-for': '203.0.113.50' },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  expect(res.headers()['location']).toContain('error=1');
});

test('ten failures from one IP trip the throttle; other IPs are unaffected', async ({
  request,
}) => {
  const attempt = (ip: string) =>
    request.post('/admin/auth/', {
      form: { passcode: 'not-the-passcode' },
      headers: { origin: E2E_ORIGIN, 'x-forwarded-for': ip },
      maxRedirects: 0,
    });

  for (let i = 0; i < 10; i++) {
    expect((await attempt('203.0.113.99')).status()).toBe(303);
  }
  const blocked = await attempt('203.0.113.99');
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);

  // A neighbour is not collateral damage.
  expect((await attempt('203.0.113.100')).status()).toBe(303);

  // And the blocked IP can still come good: the throttle answers 429 even for
  // the correct passcode while blocked (no comparison happens at all).
  const rightButBlocked = await request.post('/admin/auth/', {
    form: { passcode: E2E_PASSCODE },
    headers: { origin: E2E_ORIGIN, 'x-forwarded-for': '203.0.113.99' },
    maxRedirects: 0,
  });
  expect(rightButBlocked.status()).toBe(429);
});
