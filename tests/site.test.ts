import { describe, it, expect } from 'vitest';
import { rosterLines, notComingNames, mealLabel, isRsvpOpen, MEALS, RSVP } from '../src/data/site';

const roster = [
  { name: 'Eleanor', coming: true, meal: MEALS[0].id },
  { name: 'James', coming: false, meal: '' },
  { name: 'Sofía', coming: true, meal: '' }, // coming, no meal chosen
];

describe('rosterLines', () => {
  it('lists only the coming guests as "name: meal"', () => {
    expect(rosterLines(roster, 'en')).toEqual([`Eleanor: ${MEALS[0].en}`, 'Sofía: —']);
  });

  it('localises the meal label', () => {
    expect(rosterLines([{ name: 'X', coming: true, meal: MEALS[0].id }], 'es')[0]).toBe(
      `X: ${MEALS[0].es}`,
    );
  });
});

describe('notComingNames', () => {
  it('returns named guests marked not coming', () => {
    expect(notComingNames(roster)).toEqual(['James']);
  });

  it('ignores empty (unused plus-one) slots', () => {
    expect(notComingNames([{ name: '', coming: false, meal: '' }])).toEqual([]);
  });
});

describe('mealLabel', () => {
  it('maps a known id to its localised label and echoes an unknown id', () => {
    expect(mealLabel(MEALS[0].id, 'en')).toBe(MEALS[0].en);
    expect(mealLabel(MEALS[0].id, 'es')).toBe(MEALS[0].es);
    expect(mealLabel('nope', 'en')).toBe('nope');
  });
});

describe('isRsvpOpen (Anywhere-on-Earth deadline)', () => {
  it('stays open until the end of the deadline day in the last timezone, then closes', () => {
    const end = new Date(`${RSVP.deadline}T23:59:59-12:00`); // AoE close
    expect(isRsvpOpen(new Date(end.getTime() - 1000))).toBe(true);
    expect(isRsvpOpen(end)).toBe(true); // boundary inclusive
    expect(isRsvpOpen(new Date(end.getTime() + 1000))).toBe(false);
  });
});
