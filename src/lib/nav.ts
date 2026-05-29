import { localePath, type Locale } from './i18n';
import { getStrings } from '../i18n';

export interface NavItem {
  path: string;
  href: string;
  label: string;
}

/** Primary navigation (masthead) — compact labels, kept to one elegant line.
    Questions intentionally omitted; it lives in the footer. */
export function mainNav(locale: Locale): NavItem[] {
  const t = getStrings(locale).nav;
  const entries: Array<[string, string]> = [
    ['/the-day', t.weekendShort],
    ['/venues', t.venues],
    ['/travel', t.travelShort],
    ['/today', t.today],
  ];
  return entries.map(([path, label]) => ({ path, href: localePath(path, locale), label }));
}

/** Footer navigation — includes Welcome and the optional Our Story. */
export function footerNav(locale: Locale): NavItem[] {
  const t = getStrings(locale).nav;
  const entries: Array<[string, string]> = [
    ['/', t.home],
    ['/the-day', t.weekend],
    ['/venues', t.venues],
    ['/travel', t.travel],
    ['/questions', t.questions],
    ['/gifts', t.gifts],
    ['/our-story', t.story],
    ['/today', t.today],
  ];
  return entries.map(([path, label]) => ({ path, href: localePath(path, locale), label }));
}
