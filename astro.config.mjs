// @ts-check
import { defineConfig } from 'astro/config';

// Base path is environment-driven so local dev runs at "/" while the GitHub
// Pages deploy can build under "/<repo>/". The deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH ?? '/';
const site = process.env.SITE_URL ?? 'https://example.github.io';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
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
