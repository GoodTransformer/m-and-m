// links.ts captures SITE_URL at module load, so each case re-imports the module
// behind a stubbed env.
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadLinks(origin: string) {
  vi.resetModules();
  vi.stubEnv('SITE_URL', origin);
  return await import('../src/lib/links');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('householdLink', () => {
  it('builds locale-correct, path-style personal links', async () => {
    const links = await loadLinks('https://m-and-m-amber.vercel.app');
    expect(links.householdLink('K7P2QX42', 'en')).toBe(
      'https://m-and-m-amber.vercel.app/rsvp/K7P2QX42/',
    );
    expect(links.householdLink('K7P2QX42', 'es')).toBe(
      'https://m-and-m-amber.vercel.app/es/rsvp/K7P2QX42/',
    );
  });

  it('trims a trailing slash on SITE_URL and URL-encodes the code', async () => {
    const links = await loadLinks('https://m-and-m-amber.vercel.app/');
    expect(links.householdLink('A/B?', 'en')).toBe(
      'https://m-and-m-amber.vercel.app/rsvp/A%2FB%3F/',
    );
  });
});

describe('calendarUrl / adminUrl / assetUrl', () => {
  it('resolves against the deploy origin', async () => {
    const links = await loadLinks('https://m-and-m-amber.vercel.app');
    expect(links.calendarUrl()).toBe('https://m-and-m-amber.vercel.app/wedding.ics');
    expect(links.adminUrl()).toBe('https://m-and-m-amber.vercel.app/admin/');
    expect(links.assetUrl('/amp.png')).toBe('https://m-and-m-amber.vercel.app/amp.png');
  });
});

describe('siteOriginLooksUnset', () => {
  it('flags empty, localhost and example origins; accepts the real deploy', async () => {
    expect((await loadLinks('')).siteOriginLooksUnset()).toBe(true);
    expect((await loadLinks('http://localhost:4321')).siteOriginLooksUnset()).toBe(true);
    expect((await loadLinks('https://example.org')).siteOriginLooksUnset()).toBe(true);
    expect((await loadLinks('https://m-and-m-amber.vercel.app')).siteOriginLooksUnset()).toBe(
      false,
    );
  });
});
