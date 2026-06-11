// Seeds the scratch database through the real admin surface (login → CSV
// import), then records each household's personal code for the specs.
import { expect, test as setup } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { E2E_ORIGIN, E2E_PASSCODE, SEED_FILE } from '../playwright.config';

const CSV = `household,guests,email,plus,language
The Berrys,Alice Berry; Tom Berry,berrys@e2e.invalid,1,en
Familia Sol,Marisol Sol,sol@e2e.invalid,0,es
`;

setup('log in and import the guest list', async ({ request }) => {
  const login = await request.post('/admin/auth/', {
    form: { passcode: E2E_PASSCODE },
    headers: { origin: E2E_ORIGIN },
    maxRedirects: 0,
  });
  expect(login.status()).toBe(303);
  expect(login.headers()['location']).toBe('/admin/');

  const dryRun = await request.post('/admin/import/', {
    data: { csv: CSV, dryRun: true },
  });
  expect(dryRun.ok()).toBe(true);
  expect((await dryRun.json()).validCount).toBe(2);

  const imported = await request.post('/admin/import/', {
    data: { csv: CSV, dryRun: false },
  });
  expect(imported.ok()).toBe(true);
  const result = await imported.json();
  expect(result.inserted + result.updated).toBe(2);

  // Read the generated codes straight from the scratch DB.
  const { createClient } = await import('@libsql/client');
  const db = createClient({ url: 'file:e2e.db' });
  const rows = await db.execute('SELECT label, code FROM households');
  const codes = Object.fromEntries(rows.rows.map((r) => [String(r.label), String(r.code)]));
  expect(Object.keys(codes)).toHaveLength(2);

  await mkdir(dirname(SEED_FILE), { recursive: true });
  await writeFile(SEED_FILE, JSON.stringify(codes, null, 2));
});
