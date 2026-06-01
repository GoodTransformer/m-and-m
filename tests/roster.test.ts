import { describe, it, expect } from 'vitest';
import { buildRoster } from '../src/lib/roster';
import { MEALS } from '../src/data/site';

const VALID = MEALS[0].id; // a configured meal id
const VALID2 = MEALS[1].id;

describe('buildRoster', () => {
  it('takes invited names from the household, never the form (tamper-proof)', () => {
    const { roster } = buildRoster({
      invitedGuests: ['Eleanor Whitfield', 'James Whitfield'],
      plusOnes: 0,
      attending: 'yes',
      coming: ['yes', 'yes'],
      meals: [VALID, VALID2],
      plusName: ['Hacker McHackface'], // no plus-one granted → ignored
    });
    expect(roster.map((r) => r.name)).toEqual(['Eleanor Whitfield', 'James Whitfield']);
    expect(roster.every((r) => !r.plusOne)).toBe(true);
    expect(roster.some((r) => r.name.includes('Hacker'))).toBe(false);
  });

  it('makes each guest of a multi-person household an explicit choice', () => {
    const { roster, partySize } = buildRoster({
      invitedGuests: ['A', 'B', 'C'],
      plusOnes: 0,
      attending: 'yes',
      coming: ['yes', 'no', ''], // C left unanswered → not coming (conservative)
      meals: [VALID, VALID, VALID],
      plusName: [],
    });
    expect(roster.map((r) => r.coming)).toEqual([true, false, false]);
    expect(partySize).toBe(1);
    expect(roster[1].meal).toBe('');
    expect(roster[2].meal).toBe('');
  });

  it('treats a lone named guest as coming on the household yes (no per-person toggle)', () => {
    const { roster, partySize, attending } = buildRoster({
      invitedGuests: ['Margaret Hollis'],
      plusOnes: 0,
      attending: 'yes',
      coming: [], // single guest renders no coming select
      meals: [VALID],
      plusName: [],
    });
    expect(roster).toEqual([{ name: 'Margaret Hollis', coming: true, meal: VALID, plusOne: false }]);
    expect(partySize).toBe(1);
    expect(attending).toBe('yes');
  });

  it('caps plus-ones at the granted allowance and only counts named ones', () => {
    const { roster, partySize } = buildRoster({
      invitedGuests: ['Tomás'],
      plusOnes: 1, // only ONE granted
      attending: 'yes',
      coming: [],
      meals: [VALID, VALID2, 'sneaky'],
      plusName: ['Lucía Vargas', 'Gatecrasher Two'], // second is beyond the cap → ignored
    });
    expect(roster.map((r) => r.name)).toEqual(['Tomás', 'Lucía Vargas']);
    expect(roster[1].plusOne).toBe(true);
    expect(roster.some((r) => r.name.includes('Gatecrasher'))).toBe(false);
    expect(partySize).toBe(2);
  });

  it('does not count an unnamed plus-one', () => {
    const { roster, partySize } = buildRoster({
      invitedGuests: ['Solo'],
      plusOnes: 1,
      attending: 'yes',
      coming: [],
      meals: [VALID, VALID],
      plusName: ['   '], // whitespace only → not named
    });
    expect(roster.map((r) => r.name)).toEqual(['Solo', '']);
    expect(roster[1].coming).toBe(false);
    expect(roster[1].meal).toBe('');
    expect(partySize).toBe(1);
  });

  it('drops a meal that is not a configured option', () => {
    const { roster } = buildRoster({
      invitedGuests: ['A', 'B'],
      plusOnes: 0,
      attending: 'yes',
      coming: ['yes', 'yes'],
      meals: [VALID, 'definitely-not-a-meal'],
      plusName: [],
    });
    expect(roster[0].meal).toBe(VALID);
    expect(roster[1].meal).toBe('');
  });

  it('collapses a "yes" with everyone declined into a decline', () => {
    const { partySize, attending, roster } = buildRoster({
      invitedGuests: ['A', 'B'],
      plusOnes: 0,
      attending: 'yes',
      coming: ['no', 'no'],
      meals: [VALID, VALID],
      plusName: [],
    });
    expect(partySize).toBe(0);
    expect(attending).toBe('no'); // derived from headcount
    expect(roster.every((r) => !r.coming)).toBe(true);
  });

  it('stores an empty roster for a direct decline and ignores per-person data', () => {
    const { roster, partySize, attending } = buildRoster({
      invitedGuests: ['A', 'B'],
      plusOnes: 1,
      attending: 'no',
      coming: ['yes', 'yes'],
      meals: [VALID, VALID, VALID],
      plusName: ['Someone'],
    });
    expect(roster).toEqual([]);
    expect(partySize).toBe(0);
    expect(attending).toBe('no');
  });

  it('trims and length-caps a plus-one name at 120 chars', () => {
    const long = 'x'.repeat(200);
    const { roster } = buildRoster({
      invitedGuests: ['A'],
      plusOnes: 1,
      attending: 'yes',
      coming: [],
      meals: [VALID, VALID],
      plusName: [`  ${long}  `],
    });
    expect(roster[1].name).toBe(long.slice(0, 120));
    expect(roster[1].name.length).toBe(120);
  });

  it('keeps meals aligned by seat when a middle guest declines (hidden meal still submitted)', () => {
    const { roster } = buildRoster({
      invitedGuests: ['Chidi', 'Amara', 'Ngozi'],
      plusOnes: 1,
      attending: 'yes',
      coming: ['yes', 'no', 'yes'],
      meals: [VALID, VALID2, VALID, VALID2], // Amara's VALID2 ignored; later seats must not shift
      plusName: ['Plus'],
    });
    expect(roster.map((r) => [r.name, r.coming, r.meal])).toEqual([
      ['Chidi', true, VALID],
      ['Amara', false, ''],
      ['Ngozi', true, VALID],
      ['Plus', true, VALID2],
    ]);
  });
});
