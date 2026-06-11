// The calendar file, validated against the RFC 5545 rules the route claims to
// follow: 75-octet line folding, TEXT escaping, and the BST offset arithmetic
// (14:30 UK local on 23 September = 13:30 UTC).
import { describe, expect, it } from 'vitest';
import { GET } from '../src/pages/wedding.ics';

async function fetchIcs(): Promise<{ res: Response; raw: string; unfolded: string[] }> {
  const res = (await (GET as unknown as (ctx: object) => Response | Promise<Response>)(
    {},
  )) as Response;
  const raw = await res.text();
  // Unfold continuation lines (CRLF + single space) to read logical lines.
  const unfolded = raw.replace(/\r\n[ \t]/g, '').split('\r\n').filter(Boolean);
  return { res, raw, unfolded };
}

describe('wedding.ics', () => {
  it('serves a well-formed VCALENDAR with calendar headers', async () => {
    const { res, unfolded } = await fetchIcs();
    expect(res.headers.get('Content-Type')).toContain('text/calendar');
    expect(res.headers.get('Content-Disposition')).toContain('.ics');
    expect(unfolded[0]).toBe('BEGIN:VCALENDAR');
    expect(unfolded[unfolded.length - 1]).toBe('END:VCALENDAR');
    expect(unfolded).toContain('BEGIN:VEVENT');
    expect(unfolded).toContain('END:VEVENT');
  });

  it('stores UK-local times as the correct UTC instants (BST, +01:00)', async () => {
    const { unfolded } = await fetchIcs();
    // Guests arrive 14:30 UK local; BST means 13:30Z. 9.5h later is 23:00Z.
    expect(unfolded).toContain('DTSTART:20260923T133000Z');
    expect(unfolded).toContain('DTEND:20260923T230000Z');
  });

  it('escapes commas in TEXT values', async () => {
    const { unfolded } = await fetchIcs();
    const location = unfolded.find((l) => l.startsWith('LOCATION:'));
    expect(location).toBe('LOCATION:Magdalen College\\, High Street\\, Oxford OX1 4AU');
    const description = unfolded.find((l) => l.startsWith('DESCRIPTION:'));
    expect(description).toContain('\\,');
    expect(description).not.toMatch(/[^\\],\s/); // no unescaped comma-space survives
  });

  it('folds every physical line to 75 octets or fewer', async () => {
    const { raw } = await fetchIcs();
    const enc = new TextEncoder();
    for (const line of raw.split('\r\n')) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('keeps a stable UID so reimporting updates rather than duplicates', async () => {
    const { unfolded } = await fetchIcs();
    expect(unfolded).toContain('UID:mari-and-michael-wedding-2026-09-23@m-and-m');
  });
});
