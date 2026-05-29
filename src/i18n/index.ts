import type { Locale } from '../lib/i18n';
import type { Strings } from './types';
import { en } from './en';
import { es } from './es';

const DICTS: Record<Locale, Strings> = { en, es };

/** Return the full string dictionary for a locale. */
export function getStrings(locale: Locale): Strings {
  return DICTS[locale];
}

export type { Strings } from './types';
