// The flows a guest actually walks: accept with meals, change to a decline,
// the Spanish edition, the no-JS fallback, and the no-link nudge page.
import { expect, test } from './fixtures';
import { readFile } from 'node:fs/promises';
import { SEED_FILE } from '../playwright.config';

let codes: Record<string, string>;
test.beforeAll(async () => {
  codes = JSON.parse(await readFile(SEED_FILE, 'utf8'));
});

// The form's anti-bot time-trap rejects a submit within 1.2s of render.
const settleTimeTrap = (ms = 1400) => new Promise((r) => setTimeout(r, ms));

test('a household accepts, with meals, and can change to a decline', async ({ page }) => {
  await page.goto(`/rsvp/${codes['The Berrys']}/`);
  await expect(page.getByRole('heading', { name: 'Will you join us?' })).toBeVisible();

  await page.getByRole('radio', { name: 'Joyfully, yes' }).check();
  const coming = page.locator('select[name="coming"]');
  await coming.nth(0).selectOption('yes');
  await coming.nth(1).selectOption('yes');
  const meals = page.locator('select[name="meals"]');
  await meals.nth(0).selectOption('vegetarian');
  await meals.nth(1).selectOption('main-1');
  await page.locator('input[name="email"]').fill('berrys@e2e.invalid');

  await settleTimeTrap();
  await page.getByRole('button', { name: 'Send your reply' }).click();

  await expect(page.getByText('Thank you — your reply is in.')).toBeVisible();
  await expect(page.getByText('Alice Berry — Vegetarian')).toBeVisible();
  await expect(page.getByText('Add to calendar')).toBeVisible();
  await expect(page.getByText('We can’t wait to celebrate with you.')).toBeVisible();

  // Change the answer to a decline: the copy must not promise celebration.
  await page.getByRole('button', { name: 'Change my answer' }).click();
  await page.getByRole('radio', { name: 'Sadly, no' }).check();
  await settleTimeTrap();
  await page.getByRole('button', { name: 'Send your reply' }).click();

  await expect(page.getByText('we’ll miss you', { exact: false })).toBeVisible();
  await expect(page.getByText('Add to calendar')).toBeHidden();
  await expect(page.getByText('Thank you for letting us know.')).toBeVisible();
});

test('the Spanish edition replies in Spanish', async ({ page }) => {
  await page.goto(`/es/rsvp/${codes['Familia Sol']}/`);
  await expect(page.getByRole('heading', { name: '¿Nos acompañan?' })).toBeVisible();

  await page.getByRole('radio', { name: 'Sí, con alegría' }).check();
  const meals = page.locator('select[name="meals"]');
  if (await meals.count()) await meals.first().selectOption('vegetarian');
  await page.locator('input[name="email"]').fill('sol@e2e.invalid');

  await settleTimeTrap();
  await page.getByRole('button', { name: 'Enviar respuesta' }).click();
  await expect(page.getByText('Gracias — su respuesta quedó registrada.')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the form still submits and lands on the thank-you page', async ({ page }) => {
    await page.goto(`/rsvp/${codes['The Berrys']}/`);
    await page.getByRole('radio', { name: 'Joyfully, yes' }).check();
    const coming = page.locator('select[name="coming"]');
    await coming.nth(0).selectOption('yes');
    await coming.nth(1).selectOption('no');
    await page.locator('select[name="meals"]').nth(0).selectOption('main-2');
    await page.locator('input[name="email"]').fill('berrys@e2e.invalid');
    await page.getByRole('button', { name: 'Send your reply' }).click();

    await expect(page).toHaveURL(/\/rsvp\/thank-you\/?$/);
    await expect(page.getByText('Thank you — your reply is in.')).toBeVisible();
  });
});

test('a guest without a link sees the nudge page, not a form', async ({ page }) => {
  await page.goto('/rsvp/');
  await expect(page.getByText('Your link is in your invitation email')).toBeVisible();
  await expect(page.locator('form.rsvp, button[type=submit].rsvp__submit')).toHaveCount(0);
});

test('an invalid code gets the nudge, never an error page', async ({ page }) => {
  const res = await page.goto('/rsvp/ZZZZZZZZ/');
  expect(res!.status()).toBeLessThan(500);
  await expect(page.getByText('Your link is in your invitation email')).toBeVisible();
});
