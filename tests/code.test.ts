import { describe, expect, it } from 'vitest';
import { generateCode } from '../src/lib/code';

describe('generateCode', () => {
  it('emits 8 characters from the unambiguous Crockford-style alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
      // The whole point of the alphabet: nothing that misreads aloud.
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it('does not repeat in practice (8.5e11 combinations)', () => {
    const seen = new Set(Array.from({ length: 200 }, generateCode));
    expect(seen.size).toBe(200);
  });
});
