import { describe, it, expect } from 'vitest';
import { parseCsv, csvCell } from '../src/lib/csv';

describe('parseCsv', () => {
  it('parses quoted fields with embedded commas and escaped quotes', () => {
    expect(parseCsv('a,"b,c","d""e"')).toEqual([['a', 'b,c', 'd"e']]);
  });

  it('handles CRLF / CR / LF and drops blank lines', () => {
    expect(parseCsv('a,b\r\nc,d\re,f\n\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('parses tab-separated rows pasted from a spreadsheet', () => {
    expect(parseCsv('household\tguests\nThe Whitfields\tEleanor Whitfield; James Whitfield')).toEqual([
      ['household', 'guests'],
      ['The Whitfields', 'Eleanor Whitfield; James Whitfield'],
    ]);
  });

  it('does NOT split on a comma inside a cell when the paste is tab-separated', () => {
    expect(parseCsv('name\tnote\nSmith, Jones\thello')).toEqual([
      ['name', 'note'],
      ['Smith, Jones', 'hello'],
    ]);
  });
});

describe('csvCell (spreadsheet formula-injection guard)', () => {
  it('quotes every cell and doubles internal quotes', () => {
    expect(csvCell('plain')).toBe('"plain"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('neutralises a cell that starts with a formula trigger', () => {
    for (const lead of ['=', '+', '-', '@']) {
      expect(csvCell(`${lead}cmd`)).toBe(`"'${lead}cmd"`);
    }
  });

  it('neutralises a trigger hidden behind leading whitespace', () => {
    // Some importers strip leading spaces/tabs before parsing, so " =cmd" would
    // still execute — it must be prefixed too.
    expect(csvCell('  =SUM(A1)')).toBe(`"'  =SUM(A1)"`);
    expect(csvCell('\t-2+3')).toBe(`"'\t-2+3"`);
    expect(csvCell('\n@cmd')).toBe(`"'\n@cmd"`);
  });

  it('leaves a safe value unprefixed', () => {
    expect(csvCell('Eleanor')).toBe('"Eleanor"');
    expect(csvCell(4)).toBe('"4"');
    // Leading spaces with no trigger after them must NOT be mangled.
    expect(csvCell('  Eleanor')).toBe('"  Eleanor"');
  });
});
