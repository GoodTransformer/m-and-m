import { describe, expect, it } from 'vitest';
import { capitalise, formatDateLong } from '../src/lib/format';

describe('formatDateLong', () => {
  it('formats the wedding date per locale', () => {
    expect(formatDateLong('2026-09-23', 'en')).toBe('Wednesday, 23 September 2026');
    // Intl lowercases Spanish weekday/month — capitalise() exists for display.
    expect(formatDateLong('2026-09-23', 'es')).toBe('miércoles, 23 de septiembre de 2026');
  });

  it('is immune to timezone-induced off-by-one (noon anchor)', () => {
    // A date-only ISO parsed at UTC midnight can render as the previous day in
    // negative-offset timezones; the noon anchor must keep the calendar date.
    expect(formatDateLong('2026-01-01', 'en')).toContain('1 January 2026');
  });
});

describe('capitalise', () => {
  it('uppercases only the first character', () => {
    expect(capitalise('miércoles, 23 de septiembre')).toBe('Miércoles, 23 de septiembre');
    expect(capitalise('')).toBe('');
  });
});
