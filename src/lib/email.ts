// ============================================================
// Transactional email via Resend. SERVER-ONLY.
//  - Guest confirmation + couple notification fire on each reply (best-effort).
//  - Invitations + reminders are sent in guarded batches from /admin.
// Health data (dietary/allergies) is NEVER put in email — the couple read it in
// the secured /admin inbox. With no RESEND_API_KEY (dev) sends are logged, not made.
// ============================================================
import { Resend } from 'resend';
import type { Household, RsvpResponse } from './db';
import { householdLink, adminUrl } from './links';
import { SITE, RSVP, rosterLines } from '../data/site';

const API_KEY = import.meta.env.RESEND_API_KEY || '';
const FROM = import.meta.env.RSVP_FROM_EMAIL || 'Mari & Michael <onboarding@resend.dev>';
const COUPLE = import.meta.env.COUPLE_NOTIFY_EMAIL || '';

const resend = API_KEY ? new Resend(API_KEY) : null;

export interface EmailPayload {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string; // plain-text alternative — improves inbox placement everywhere
}

export interface BatchResult {
  ok: boolean;
  sent: number;
  failures: Map<number, string>; // index in the payload array → error message
  error?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso: string, locale: 'en' | 'es', withWeekday = false): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withWeekday ? { weekday: 'long' } : {}),
  };
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', opts).format(
    new Date(`${iso}T12:00:00`),
  );
}

function shell(inner: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;color:#24140f;max-width:34rem;line-height:1.55">${inner}<p style="margin-top:1.75rem">— Mari &amp; Michael</p></div>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:1.5rem 0"><a href="${href}" style="display:inline-block;background:#5b1215;color:#f2e8d8;text-decoration:none;padding:0.7rem 1.4rem;border-radius:4px;font-size:0.95rem;letter-spacing:0.04em">${esc(label)}</a></p>`;
}

// --- invitations & reminders --------------------------------------------------
export function buildInvite(h: Household): EmailPayload | null {
  if (!h.email) return null;
  const es = h.locale === 'es';
  const link = householdLink(h.code, h.locale);
  const date = fmtDate(SITE.date, h.locale, true);
  const by = fmtDate(RSVP.deadline, h.locale);
  const subject = es ? 'Están invitados · Mari & Michael' : 'You’re invited · Mari & Michael';
  const inner = es
    ? `<p>Hola ${esc(h.label)},</p>
       <p>Nos encantaría que nos acompañaran en Oxford y Bicester el <strong>${date}</strong>. Por favor, díganos si pueden venir — solo toma un minuto.</p>
       ${button(link, 'Confirmar asistencia')}
       <p style="color:#6b5a4f;font-size:0.9rem">Este enlace es personal de su invitación; por favor, no lo reenvíen. Agradeceríamos su respuesta antes del ${by}.</p>`
    : `<p>Dear ${esc(h.label)},</p>
       <p>We would be so glad if you could join us in Oxford and Bicester on <strong>${date}</strong>. Please let us know whether you can come — it only takes a minute.</p>
       ${button(link, 'RSVP')}
       <p style="color:#6b5a4f;font-size:0.9rem">This link is personal to your invitation, so please don’t forward it. We’d be grateful for your reply by ${by}.</p>`;
  const text = es
    ? `Hola ${h.label},\n\nNos encantaría que nos acompañaran en Oxford y Bicester el ${date}. Por favor, díganos si pueden venir:\n\n${link}\n\nEste enlace es personal de su invitación; por favor, no lo reenvíen. Agradeceríamos su respuesta antes del ${by}.\n\n— Mari & Michael`
    : `Dear ${h.label},\n\nWe would be so glad if you could join us in Oxford and Bicester on ${date}. Please let us know whether you can come:\n\n${link}\n\nThis link is personal to your invitation, so please don’t forward it. We’d be grateful for your reply by ${by}.\n\n— Mari & Michael`;
  return { from: FROM, to: h.email, replyTo: COUPLE || undefined, subject, html: shell(inner), text };
}

export function buildReminder(h: Household): EmailPayload | null {
  if (!h.email) return null;
  const es = h.locale === 'es';
  const link = householdLink(h.code, h.locale);
  const date = fmtDate(SITE.date, h.locale, true);
  const by = fmtDate(RSVP.deadline, h.locale);
  const subject = es ? 'Un recordatorio · Mari & Michael' : 'A gentle reminder · Mari & Michael';
  const inner = es
    ? `<p>Hola ${esc(h.label)},</p>
       <p>Solo un recordatorio: aún no sabemos si podrán acompañarnos el <strong>${date}</strong>. Cuando tengan un momento, nos encantaría saberlo.</p>
       ${button(link, 'Confirmar asistencia')}
       <p style="color:#6b5a4f;font-size:0.9rem">Por favor, respondan antes del ${by}. Si ya respondieron, pueden ignorar este mensaje.</p>`
    : `<p>Dear ${esc(h.label)},</p>
       <p>Just a gentle note — we haven’t yet heard whether you can join us on <strong>${date}</strong>. When you have a moment, we’d love to know.</p>
       ${button(link, 'RSVP')}
       <p style="color:#6b5a4f;font-size:0.9rem">Kindly reply by ${by}. If you’ve already responded, please ignore this.</p>`;
  const text = es
    ? `Hola ${h.label},\n\nSolo un recordatorio: aún no sabemos si podrán acompañarnos el ${date}. Cuando tengan un momento, nos encantaría saberlo:\n\n${link}\n\nPor favor, respondan antes del ${by}. Si ya respondieron, pueden ignorar este mensaje.\n\n— Mari & Michael`
    : `Dear ${h.label},\n\nJust a gentle note — we haven’t yet heard whether you can join us on ${date}. When you have a moment, we’d love to know:\n\n${link}\n\nKindly reply by ${by}. If you’ve already responded, please ignore this.\n\n— Mari & Michael`;
  return { from: FROM, to: h.email, replyTo: COUPLE || undefined, subject, html: shell(inner), text };
}

/**
 * Send a batch of personalised emails. Idempotent: retrying with the same
 * idempotencyKey within 24h will not re-send. Returns per-index failures so the
 * caller can mark exactly who sent vs failed. In dev (no key) it logs instead.
 */
export async function sendBatch(payloads: EmailPayload[], idempotencyKey: string): Promise<BatchResult> {
  if (!payloads.length) return { ok: true, sent: 0, failures: new Map() };
  if (!resend) {
    payloads.forEach((p) => console.log(`[email skipped — no RESEND_API_KEY] → ${p.to}: ${p.subject}`));
    return { ok: true, sent: payloads.length, failures: new Map() };
  }
  try {
    const { data, error } = await resend.batch.send(payloads, {
      idempotencyKey,
      batchValidation: 'permissive',
    });
    if (error) return { ok: false, sent: 0, failures: new Map(), error: error.message };
    const failures = new Map<number, string>();
    for (const e of data?.errors ?? []) failures.set(e.index, e.message);
    return { ok: true, sent: payloads.length - failures.size, failures };
  } catch (err) {
    return { ok: false, sent: 0, failures: new Map(), error: err instanceof Error ? err.message : 'send failed' };
  }
}

// --- per-reply emails (fire on submit) ---------------------------------------
function attendingLine(r: RsvpResponse, locale: 'en' | 'es'): string {
  const es = locale === 'es';
  if (r.attending === 'yes') {
    return es
      ? `Asistirán · ${r.partySize} ${r.partySize === 1 ? 'persona' : 'personas'}`
      : `Attending · ${r.partySize} ${r.partySize === 1 ? 'guest' : 'guests'}`;
  }
  return es ? 'No podrán asistir' : 'Unable to attend';
}

/** Confirmation to the guest, echoing their reply. `toEmail` is the household's
    on-file address (chosen by the action, not the form input) so the form can
    never be used to send mail from our domain to an arbitrary recipient. */
export async function sendGuestConfirmation(
  r: RsvpResponse,
  locale: 'en' | 'es',
  toEmail: string,
): Promise<void> {
  if (!toEmail) return;
  if (!resend) {
    console.log(`[email skipped] guest confirmation → ${toEmail} (${r.attending})`);
    return;
  }
  const es = locale === 'es';
  const subject = es ? 'Hemos recibido su respuesta · Mari & Michael' : 'We have your reply · Mari & Michael';
  const intro = es ? 'Esto es lo que nos enviaron:' : 'Here is what you sent us:';
  const rows = [
    [es ? 'Nombre(s)' : 'Name(s)', r.names],
    [es ? 'Respuesta' : 'Reply', attendingLine(r, locale)],
  ];
  const roster = rosterLines(r.guestNames, r.meals, locale);
  if (roster.length) rows.push([es ? 'Menú' : 'Meals', roster.join(', ')]);
  if (r.dietary.trim()) rows.push([es ? 'Dietas / alergias' : 'Dietary / allergies', r.dietary]);
  if (r.message.trim()) rows.push([es ? 'Mensaje' : 'Message', r.message]);
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b5a4f">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('');
  const closing = es
    ? 'Si algo cambia, vuelvan a abrir su enlace personal para actualizar la respuesta.'
    : 'If anything changes, just re-open your personal link to update your reply.';
  const text = `${es ? 'Gracias — lo tenemos.' : 'Thank you — we’ve got it.'}\n\n${intro}\n${rows
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n\n${closing}\n\n— Mari & Michael`;
  await resend.emails.send(
    {
      from: FROM,
      to: toEmail,
      replyTo: COUPLE || undefined,
      subject,
      html: shell(
        `<p>${es ? 'Gracias' : 'Thank you'} — ${es ? 'lo tenemos' : 'we’ve got it'}.</p><p>${intro}</p><table style="border-collapse:collapse;margin:1rem 0">${table}</table><p style="color:#6b5a4f">${closing}</p>`,
      ),
      text,
    },
    { idempotencyKey: `confirm:${toEmail}:${r.updatedAt}` },
  );
}

/** Notification to the couple — NO health data; links to the secured inbox. */
export async function sendCoupleNotification(h: Household, r: RsvpResponse): Promise<void> {
  if (!resend || !COUPLE) {
    console.log(`[email skipped] couple notification for ${h.label} (${r.attending})`);
    return;
  }
  const subject = `RSVP — ${h.label}: ${r.attending === 'yes' ? `attending (${r.partySize})` : 'not attending'}`;
  const note = r.dietary.trim()
    ? '<p style="color:#6b5a4f;font-size:0.9rem">This guest noted dietary needs — view them in the inbox (kept out of email).</p>'
    : '';
  const text = `New reply from ${h.label}: ${attendingLine(r, 'en')}.${
    r.dietary.trim() ? '\nDietary needs noted — view them in the inbox.' : ''
  }\nInbox: ${adminUrl()}`;
  await resend.emails.send({
    from: FROM,
    to: COUPLE,
    subject,
    html: shell(
      `<p>New reply from <strong>${esc(h.label)}</strong>: ${esc(attendingLine(r, 'en'))}.</p>${note}${button(adminUrl(), 'Open the RSVP inbox')}`,
    ),
    text,
  });
}
