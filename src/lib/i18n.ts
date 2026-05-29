// ============================================================
// Locale + base-path aware URL helpers.
// English is the default locale (served at "/"); Spanish at "/es/".
// All internal links go through localePath() so they respect both the
// active locale and the deploy base path (e.g. "/<repo>/" on GitHub Pages).
// ============================================================

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

// import.meta.env.BASE_URL always ends with "/".
const BASE = import.meta.env.BASE_URL;

/**
 * Build a locale-aware, base-aware URL for a logical path such as "/venues".
 * localePath("/venues", "es") -> "/es/venues/"  (or "/<base>/es/venues/")
 * localePath("/", "en")       -> "/"            (or "/<base>/")
 */
export function localePath(path = '/', locale: Locale = DEFAULT_LOCALE): string {
  const segments = path.split('/').filter(Boolean);
  const prefix = locale === DEFAULT_LOCALE ? [] : [locale];
  const all = [...prefix, ...segments];
  return BASE + (all.length ? all.join('/') + '/' : '');
}

/** Prefix a public asset path (in /public) with the deploy base. */
export function asset(path: string): string {
  return BASE + path.replace(/^\//, '');
}

/** The counterpart locale, used by the language toggle. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};
