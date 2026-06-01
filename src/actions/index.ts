// ============================================================
// RSVP submission. The form carries a household `code` (from the personal link),
// so a reply is tied to one household and *updates* on resubmit — never a
// duplicate. The invited people's NAMES come from the household on the server,
// never the form: the form only reports, per seat, whether that person is coming
// and their meal, plus any typed names for plus-one seats you've granted.
// Flow: validate → anti-spam → look up household → build roster → upsert →
// best-effort confirmation + (slim) notification emails.
// ============================================================
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import {
  getHouseholdByCode,
  upsertRsvpForHousehold,
  getResponseForHousehold,
  type RosterEntry,
} from '../lib/db';
import { verifyTurnstile } from '../lib/turnstile';
import { sendGuestConfirmation, sendCoupleNotification } from '../lib/email';
import { isRsvpOpen, MEAL_IDS } from '../data/site';

// Astro forwards empty form fields as null; normalize optional text to ''.
const optionalText = (max: number) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().trim().max(max));

export const server = {
  rsvp: defineAction({
    accept: 'form',
    input: z.object({
      code: z.string().trim().min(1).max(32),
      email: z.string().trim().email().max(200),
      attending: z.enum(['yes', 'no']),
      dietary: optionalText(1000),
      message: optionalText(2000),
      // Per-seat fields. Bare z.array makes Astro collect every same-name control
      // via getAll() (a preprocess/effects wrapper would not). One `coming` and
      // one `meals` per invited seat (in order); one `plusName` per plus-one seat.
      coming: z.array(z.string().max(8)).max(60),
      meals: z.array(z.string().max(40)).max(60),
      plusName: z.array(z.string().max(120)).max(30),
      // Anti-spam (not shown to humans):
      website: optionalText(100), // honeypot — must come back empty
      _t: z.coerce.number().catch(0), // epoch ms the form was rendered
      'cf-turnstile-response': optionalText(5000),
    }),
    handler: async (input, context) => {
      if (!isRsvpOpen()) throw new ActionError({ code: 'FORBIDDEN', message: 'closed' });
      if (input.website) throw new ActionError({ code: 'BAD_REQUEST', message: 'spam' });
      // Time-trap: only meaningful when JS stamped _t. 1.2s is plenty to beat a
      // bot without flagging a returning guest who re-confirms a pre-filled form.
      if (input._t && Date.now() - input._t < 1200) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'spam' });
      }

      const household = await getHouseholdByCode(input.code);
      if (!household) throw new ActionError({ code: 'NOT_FOUND', message: 'invalid-code' });

      // Turnstile only when a token is present. The widget needs JavaScript, so a
      // no-JS guest produces no token — verifying would block them. The unguessable
      // code + honeypot + time-trap already gate the form, so skip gracefully.
      const token = input['cf-turnstile-response'];
      if (token) {
        const ip = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
        const ts = await verifyTurnstile(token, ip);
        if (!ts.ok) throw new ActionError({ code: 'BAD_REQUEST', message: 'captcha' });
      }

      // Build the reply roster server-side. Invited names are the household's, not
      // the form's; plus-one names are accepted only up to the granted allowance.
      const invited = household.invitedGuests;
      const plusCap = Math.max(household.plusOnes, 0);
      const mealAt = (i: number) => {
        const m = input.meals[i] ?? '';
        return MEAL_IDS.has(m) ? m : '';
      };

      const roster: RosterEntry[] = [];
      if (input.attending === 'yes') {
        invited.forEach((name, i) => {
          const coming = input.coming[i] !== 'no'; // default to coming unless said otherwise
          roster.push({ name, coming, meal: coming ? mealAt(i) : '', plusOne: false });
        });
        for (let j = 0; j < plusCap; j++) {
          const name = (input.plusName[j] ?? '').trim().slice(0, 120);
          const coming = name !== ''; // a plus-one only counts once named
          roster.push({ name, coming, meal: coming ? mealAt(invited.length + j) : '', plusOne: true });
        }
      }

      const partySize = roster.filter((r) => r.coming).length;
      // Said yes but nobody is actually coming → treat as a decline.
      const attending = partySize > 0 ? 'yes' : 'no';

      await upsertRsvpForHousehold(household.id, {
        attending,
        partySize,
        roster,
        email: input.email,
        dietary: input.dietary,
        message: input.message,
      });

      const response = await getResponseForHousehold(household.id);
      if (response) {
        // Send the confirmation to the household's on-file address (or the
        // entered one only when there is none) — never an arbitrary form value.
        const confirmTo = household.email || response.email;
        try {
          await sendGuestConfirmation(response, household.locale, confirmTo);
        } catch (err) {
          console.error('[rsvp] guest confirmation email failed', err);
        }
        try {
          await sendCoupleNotification(household, response);
        } catch (err) {
          console.error('[rsvp] couple notification email failed', err);
        }
      }

      return { ok: true as const, attending };
    },
  }),
};
