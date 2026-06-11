// The email builders return payloads without sending, so the full guest-facing
// content is testable offline. Send paths are exercised only via their dev
// skip-path (the module never constructs a Resend client under vitest — PROD is
// false and DEV_USE_LIVE_SERVICES is unset).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildInvite, buildReminder, sendGuestConfirmation, fromLooksUnset } from '../src/lib/email';
import type { Household, RsvpResponse } from '../src/lib/db';

const household = (over: Partial<Household> = {}): Household => ({
  id: 1,
  code: 'K7P2QX42',
  label: 'The Whitfields',
  invitedNames: 'Eleanor & James Whitfield',
  invitedGuests: ['Eleanor Whitfield', 'James Whitfield'],
  plusOnes: 0,
  email: 'whitfields@example.com',
  maxSeats: 2,
  locale: 'en',
  inviteStatus: 'pending',
  invitedAt: null,
  remindedAt: null,
  inviteError: null,
  deliveryStatus: null,
  deliveryDetail: null,
  deliveryAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

const response = (over: Partial<RsvpResponse> = {}): RsvpResponse => ({
  attending: 'yes',
  partySize: 2,
  roster: [
    { name: 'Eleanor Whitfield', coming: true, meal: 'vegetarian', plusOne: false },
    { name: 'James Whitfield', coming: true, meal: 'main-1', plusOne: false },
  ],
  email: 'whitfields@example.com',
  dietary: '',
  message: '',
  updatedAt: '2026-06-01T12:00:00Z',
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('buildInvite', () => {
  it('builds the English invitation with the personal link and deadline', () => {
    const p = buildInvite(household());
    expect(p).not.toBeNull();
    expect(p!.to).toBe('whitfields@example.com');
    expect(p!.subject).toBe('You’re invited · Mari & Michael');
    expect(p!.text).toContain('/rsvp/K7P2QX42/');
    expect(p!.text).toContain('For: Eleanor & James Whitfield');
    expect(p!.text).toContain('26 August 2026'); // RSVP deadline, formatted
    expect(p!.html).toContain('This invitation is for');
  });

  it('builds the Spanish edition with the /es/ link', () => {
    const p = buildInvite(household({ locale: 'es' }));
    expect(p!.subject).toBe('Están invitados · Mari & Michael');
    expect(p!.text).toContain('/es/rsvp/K7P2QX42/');
    expect(p!.text).toContain('Para: Eleanor & James Whitfield');
    expect(p!.text).toContain('26 de agosto de 2026');
  });

  it('shows the plus-one allowance as an unnamed seat, per locale', () => {
    expect(buildInvite(household({ plusOnes: 1 }))!.text).toContain(
      'Eleanor & James Whitfield & guest',
    );
    expect(buildInvite(household({ plusOnes: 2, locale: 'es' }))!.text).toContain(
      'Eleanor & James Whitfield & 2 acompañantes',
    );
  });

  it('returns null for a household with no email (paper guest)', () => {
    expect(buildInvite(household({ email: null }))).toBeNull();
  });

  it('escapes guest-controlled names in the HTML body', () => {
    const p = buildInvite(household({ invitedNames: 'Smith <Bros> & "Co"' }));
    expect(p!.html).toContain('Smith &lt;Bros&gt;');
    expect(p!.html).not.toContain('<Bros>');
  });
});

describe('buildReminder', () => {
  it('uses the reminder subject and ignore-if-replied note in both languages', () => {
    const en = buildReminder(household());
    expect(en!.subject).toBe('A gentle reminder · Mari & Michael');
    expect(en!.text).toContain('If you’ve already responded, please ignore this.');
    const es = buildReminder(household({ locale: 'es' }));
    expect(es!.subject).toBe('Un recordatorio · Mari & Michael');
    expect(es!.text).toContain('pueden ignorar este mensaje');
  });
});

describe('sendGuestConfirmation (dev skip-path logs the full text body)', () => {
  const loggedText = async (r: RsvpResponse, locale: 'en' | 'es') => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await sendGuestConfirmation(r, locale, 'whitfields@example.com', 'K7P2QX42');
    return log.mock.calls.map((c) => c.join(' ')).join('\n');
  };

  it('includes the when/where and calendar link for an accepting reply', async () => {
    const text = await loggedText(response(), 'en');
    expect(text).toContain('Wednesday, 23 September 2026');
    expect(text).toContain('Add to calendar');
    expect(text).toContain('Eleanor Whitfield: Vegetarian');
    expect(text).toContain('Change my reply');
  });

  it('omits the when/where and calendar link for a decline', async () => {
    const decline = response({
      attending: 'no',
      partySize: 0,
      roster: [],
    });
    const text = await loggedText(decline, 'en');
    expect(text).not.toContain('Add to calendar');
    expect(text).not.toContain('Wednesday, 23 September 2026');
    expect(text).toContain('Thank you — we have your reply.');
  });

  it('localises the Spanish confirmation', async () => {
    const text = await loggedText(response(), 'es');
    expect(text).toContain('Añadir al calendario');
    expect(text).toContain('Gracias — tenemos su respuesta.');
  });
});

describe('fromLooksUnset', () => {
  it('flags an unset or sandbox sender, accepts a verified-domain one', () => {
    vi.stubEnv('RSVP_FROM_EMAIL', '');
    expect(fromLooksUnset()).toBe(true);
    vi.stubEnv('RSVP_FROM_EMAIL', 'Mari & Michael <onboarding@resend.dev>');
    expect(fromLooksUnset()).toBe(true);
    vi.stubEnv('RSVP_FROM_EMAIL', 'Mari & Michael <rsvp@mandm.uk>');
    expect(fromLooksUnset()).toBe(false);
  });
});
