// Structural parity between the two editions. TypeScript already forces the
// same keys; these tests catch what types can't — placeholder tokens lost in
// translation, and paired arrays drifting to different lengths.
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';

type Leaf = { path: string; value: string };

function leaves(node: unknown, path = ''): Leaf[] {
  if (typeof node === 'string') return [{ path, value: node }];
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function arrayLengths(node: unknown, path = ''): Map<string, number> {
  const out = new Map<string, number>();
  if (Array.isArray(node)) {
    out.set(path, node.length);
    node.forEach((v, i) => arrayLengths(v, `${path}[${i}]`).forEach((n, p) => out.set(p, n)));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      arrayLengths(v, path ? `${path}.${k}` : k).forEach((n, p) => out.set(p, n));
    }
  }
  return out;
}

const tokens = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort();

describe('EN/ES parity', () => {
  it('keeps every {placeholder} token through translation', () => {
    const enByPath = new Map(leaves(en).map((l) => [l.path, l.value]));
    for (const { path, value } of leaves(es)) {
      const counterpart = enByPath.get(path);
      // Array items can differ in count (checked below); compare where both exist.
      if (counterpart === undefined) continue;
      expect(tokens(value), `tokens differ at ${path}`).toEqual(tokens(counterpart));
    }
  });

  it('keeps paired arrays (body paragraphs, FAQ lists) the same length', () => {
    const enLengths = arrayLengths(en);
    const esLengths = arrayLengths(es);
    expect([...esLengths.keys()].sort()).toEqual([...enLengths.keys()].sort());
    for (const [path, n] of enLengths) {
      expect(esLengths.get(path), `array length differs at ${path}`).toBe(n);
    }
  });
});
