// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Base path is environment-driven so local dev runs at "/" while a sub-path
// deploy can build under "/<repo>/". On Vercel the base is "/".
const base = process.env.BASE_PATH ?? '/';
const site = process.env.SITE_URL ?? 'https://m-and-m-amber.vercel.app';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // The content pages stay prerendered (static, fast). Only the routes that
  // opt out with `export const prerender = false` — the RSVP form, its action,
  // and the private /admin inbox — render on demand. That needs a server
  // adapter, so the site is hosted on Vercel (its free Hobby tier).
  adapter: vercel(),
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
