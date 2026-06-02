import { describe, it, expect } from 'vitest';
import { parseGuestCsv } from '../src/lib/guests';

const first = (csv: string) => parseGuestCsv(csv).rows[0];

describe('parseGuestCsv', () => {
  it('splits the guests column into named seats on semicolons', () => {
    const r = first('household,guests\nThe Whitfields,Eleanor Whitfield; James Whitfield');
    expect(r.invitedGuests).toEqual(['Eleanor Whitfield', 'James Whitfield']);
    expect(r.maxSeats).toBe(2);
    expect(r.valid).toBe(true);
  });

  it('keeps a comma inside a quoted name without splitting the column', () => {
    const r = first('household,guests\nParty,"Anne O\'Brien, Jr.; Bob Lee"');
    expect(r.invitedGuests).toEqual(["Anne O'Brien, Jr.", 'Bob Lee']);
  });

  it('derives seats from names plus the plus-one allowance', () => {
    const r = first('household,guests,plus\nH,A; B,2');
    expect(r.invitedGuests).toEqual(['A', 'B']);
    expect(r.plusOnes).toBe(2);
    expect(r.maxSeats).toBe(4);
  });

  it('falls back to the household label as a single seat when guests is blank', () => {
    const r = first('household,guests\nThe Smiths,');
    expect(r.invitedGuests).toEqual(['The Smiths']);
    expect(r.maxSeats).toBe(1);
  });

  it('errors when there is no household column', () => {
    const res = parseGuestCsv('guests,email\nA; B,x@y.com');
    expect(res.headerError).toBeTruthy();
    expect(res.rows.length).toBe(0);
  });

  it('flags an invalid email but accepts a valid one', () => {
    const res = parseGuestCsv('household,guests,email\nA,X,not-an-email\nB,Y,ok@example.com');
    expect(res.rows[0].valid).toBe(false);
    expect(res.rows[0].issue).toMatch(/email/i);
    expect(res.rows[1].valid).toBe(true);
    expect(res.validCount).toBe(1);
  });

  it('flags a duplicate email within the same list', () => {
    const res = parseGuestCsv('household,guests,email\nA,X,same@example.com\nB,Y,same@example.com');
    expect(res.rows[0].valid).toBe(true);
    expect(res.rows[1].valid).toBe(false);
    expect(res.rows[1].issue).toMatch(/duplicate/i);
  });

  it('flags a second no-email household with the same name (would collide on re-import)', () => {
    const res = parseGuestCsv('household,guests\nPaper Guest,A\nPaper Guest,B');
    expect(res.rows[0].valid).toBe(true);
    expect(res.rows[1].valid).toBe(false);
    expect(res.rows[1].issue).toMatch(/duplicate name/i);
  });

  it('allows the same name twice when emails tell them apart', () => {
    const res = parseGuestCsv(
      'household,guests,email\nThe Smiths,A,a@example.com\nThe Smiths,B,b@example.com',
    );
    expect(res.rows[0].valid).toBe(true);
    expect(res.rows[1].valid).toBe(true);
  });

  it('rejects a non-numeric or out-of-range plus value', () => {
    expect(first('household,guests,plus\nA,X,abc').valid).toBe(false);
    expect(first('household,guests,plus\nA,X,99').valid).toBe(false);
  });

  it('rejects an unknown language, accepts es, defaults to en', () => {
    expect(first('household,guests,language\nA,X,fr').valid).toBe(false);
    expect(first('household,guests,language\nA,X,es').locale).toBe('es');
    expect(first('household,guests\nA,X').locale).toBe('en');
  });

  it('accepts column aliases (party / names / lang)', () => {
    const r = first('party,names,language\nThe Okonkwos,Chidi; Amara,es');
    expect(r.label).toBe('The Okonkwos');
    expect(r.invitedGuests).toEqual(['Chidi', 'Amara']);
    expect(r.locale).toBe('es');
  });

  it('builds a natural-language display name', () => {
    expect(first('household,guests\nH,A; B; C').invitedNames).toBe('A, B & C');
    expect(first('household,guests\nH,A; B').invitedNames).toBe('A & B');
    expect(first('household,guests\nH,Solo').invitedNames).toBe('Solo');
  });
});
