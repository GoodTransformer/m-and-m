// ============================================================
// Locale-aware date formatting (Intl). Used for the wedding date display.
// ============================================================
import type { Locale } from './i18n';

const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-GB',
  es: 'es-ES',
};

/** "Wednesday, 23 September 2026" / "miércoles, 23 de septiembre de 2026". */
export function formatDateLong(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Capitalise the first letter (Spanish weekday/month come lowercased from Intl). */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
