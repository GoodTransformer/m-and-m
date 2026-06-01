// ============================================================
// RSVP submission. The form carries a household `code` (from the personal link),
// so a reply is tied to one household and *updates* on resubmit — never a
// duplicate. Flow: validate → anti-spam → look up household → cap party size →
// upsert reply → best-effort confirmation + (slim) notification emails.
// ============================================================
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { getHouseholdByCode, upsertRsvpForHousehold, getResponseForHousehold } from '../lib/db';
import { verifyTurnstile } from '../lib/turnstile';
import { sendGuestConfirmation, sendCoupleNotification } from '../lib/email';
import { isRsvpOpen } from '../data/site';

// Astro forwards empty form fields as null; normalize optional text to ''.
const optionalText = (max: number) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().trim().max(max));

export const server = {
  rsvp: defineAction({
    accept: 'form',
    input: z.object({
      code: z.string().trim().min(1).max(32),
      names: z.string().trim().min(1).max(200),
      email: z.string().trim().email().max(200),
      attending: z.enum(['yes', 'no']),
      partySize: z.coerce.number().int().min(0).max(50).catch(1),
      dietary: optionalText(1000),
      message: optionalText(2000),
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

      // Cap the party size to this household's allowance (never below 1 seat).
      const cap = Math.max(household.maxSeats, 1);
      const partySize = input.attending === 'yes' ? Math.min(Math.max(input.partySize, 1), cap) : 0;

      await upsertRsvpForHousehold(household.id, {
        attending: input.attending,
        partySize,
        names: input.names,
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

      return { ok: true as const, attending: input.attending };
    },
  }),
};
