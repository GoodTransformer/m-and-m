// Integration tests for the datastore against a throwaway SQLite file.
// db.ts only honours TURSO_DATABASE_URL when live services are on (the dev
// guard), so both env vars are stubbed BEFORE the module is imported.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const TMP_DIR = resolve(process.cwd(), 'tests/.tmp');
const DB_PATH = resolve(TMP_DIR, 'integration.db');

type Db = typeof import('../src/lib/db');
let db: Db;

const newHousehold = (label: string, email: string | null, code: string) => ({
  label,
  invitedNames: label,
  invitedGuests: [label],
  plusOnes: 0,
  email,
  locale: 'en' as const,
  code,
});

beforeAll(async () => {
  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });
  vi.resetModules();
  vi.stubEnv('DEV_USE_LIVE_SERVICES', 'true');
  vi.stubEnv('TURSO_DATABASE_URL', `file:${DB_PATH}`);
  db = await import('../src/lib/db');
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(TMP_DIR, { recursive: true, force: true });
});

describe('schema + lookup', () => {
  it('creates the schema on first use and finds a household by code', async () => {
    await db.importHouseholds([newHousehold('The Setups', 'setup@test.invalid', 'SETUP234')], []);
    const found = await db.getHouseholdByCode('SETUP234');
    expect(found?.label).toBe('The Setups');
    expect(found?.maxSeats).toBe(1);
    expect(await db.getHouseholdByCode('NOPE2345')).toBeNull();
  });

  it('matches email lookups case-insensitively', async () => {
    expect((await db.getHouseholdByEmail('SETUP@TEST.INVALID'))?.code).toBe('SETUP234');
  });
});

describe('upsertRsvpForHousehold', () => {
  it('replying twice updates the single response row, never duplicates', async () => {
    const h = await db.getHouseholdByCode('SETUP234');
    const reply = (attending: 'yes' | 'no', partySize: number) =>
      db.upsertRsvpForHousehold(h!.id, {
        attending,
        partySize,
        roster: [{ name: 'The Setups', coming: attending === 'yes', meal: '', plusOne: false }],
        email: 'setup@test.invalid',
        dietary: '',
        message: attending === 'yes' ? 'see you there' : 'so sorry',
      });

    await reply('yes', 1);
    await reply('no', 0);
    const r = await db.getResponseForHousehold(h!.id);
    expect(r?.attending).toBe('no');
    expect(r?.partySize).toBe(0);
    expect(r?.message).toBe('so sorry');
    // One row per household is a schema-level guarantee (UNIQUE household_id);
    // the visible contract is that the latest write wins.
    const all = await db.listHouseholdsWithResponses();
    expect(all.filter((x) => x.id === h!.id)).toHaveLength(1);
  });
});

describe('importHouseholds constraint behaviour', () => {
  it('silently skips an INSERT whose email already exists (INSERT OR IGNORE)', async () => {
    // Unreachable through /admin in practice — the CSV pre-flags duplicates and
    // existing emails become updates — but this pins the safety-net semantics.
    await db.importHouseholds(
      [newHousehold('The Copies', 'setup@test.invalid', 'COPY2345')],
      [],
    );
    expect(await db.getHouseholdByCode('COPY2345')).toBeNull();
  });

  it('rolls the whole batch back when an UPDATE collides on email', async () => {
    await db.importHouseholds(
      [
        newHousehold('The Firsts', 'first@test.invalid', 'FIRST234'),
        newHousehold('The Seconds', 'second@test.invalid', 'SECOND23'),
      ],
      [],
    );
    const second = await db.getHouseholdByCode('SECOND23');

    let error: unknown = null;
    try {
      await db.importHouseholds(
        [newHousehold('The Thirds', 'third@test.invalid', 'THIRD234')],
        [
          {
            ...newHousehold('The Seconds', 'first@test.invalid', ''),
            id: second!.id,
          },
        ],
      );
    } catch (err) {
      error = err;
    }

    expect(error, 'duplicate-email update must throw').not.toBeNull();
    // The /admin import discriminates email collisions by this pattern — if the
    // engine's wording changes, src/pages/admin/import.ts must change with it.
    expect(String((error as Error).message ?? error)).toMatch(
      /idx_households_email|households\.email/i,
    );
    // Atomicity: the batched INSERT must not have survived the failed UPDATE.
    expect(await db.getHouseholdByCode('THIRD234')).toBeNull();
    expect((await db.getHouseholdByEmail('second@test.invalid'))?.id).toBe(second!.id);
  });

  it('generateUniqueCode returns a fresh, well-formed code', async () => {
    const code = await db.generateUniqueCode();
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    expect(await db.getHouseholdByCode(code)).toBeNull();
  });
});
