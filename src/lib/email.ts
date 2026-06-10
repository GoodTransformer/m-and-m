// ============================================================
// Transactional email via Resend. SERVER-ONLY.
//  - Guest confirmation + couple notification fire on each reply (best-effort).
//  - Invitations + reminders are sent in guarded batches from /admin.
// Dietary/allergy notes are kept out of the COUPLE notification (they read those
// in the secured /admin inbox); the guest's own confirmation echoes their reply —
// including any dietary note they entered — back to their own on-file address, so
// they can check it. With no RESEND_API_KEY (dev) sends are logged, not made.
// ============================================================
import { Resend } from 'resend';
import { useLiveServices } from './services';
import type { Household, RsvpResponse } from './db';
import { householdLink, adminUrl, calendarUrl, assetUrl } from './links';
import { SITE, RSVP, rosterLines, notComingNames } from '../data/site';

const API_KEY = import.meta.env.RESEND_API_KEY || '';
const FROM = import.meta.env.RSVP_FROM_EMAIL || 'Mari & Michael <onboarding@resend.dev>';
const COUPLE = import.meta.env.COUPLE_NOTIFY_EMAIL || '';

// No client outside live mode: the dev .env legitimately carries the real key
// (for ops scripts), and a local test reply must never email real guests or
// the couple. Every send path checks `resend` and logs instead when null.
const resend = useLiveServices && API_KEY ? new Resend(API_KEY) : null;

/** True if RSVP_FROM_EMAIL is unset or still Resend's shared sandbox
    (`onboarding@resend.dev`). Real mail must go from a *verified* domain, or it
    lands in spam (or is blocked) — so /admin warns and a live send refuses while
    this is the case. The biggest single deliverability factor. */
export function fromLooksUnset(): boolean {
  const raw = import.meta.env.RSVP_FROM_EMAIL || '';
  return !raw.trim() || /resend\.dev/i.test(raw);
}

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

// The site's ornate Fraunces swash ampersand. Mail clients can't load the font,
// so the couple's "Mari & Michael" lockups use an image of the *real* glyph
// (bronze, transparent — generated from the font at opsz 144, the same display
// optical size the site pins). Sized to its context from the surrounding
// font-size; alt="&" degrades to a plain ampersand if a client blocks images.
const AMP_SRC = assetUrl('amp.png');
function ampImg(fs: number): string {
  const h = Math.round(fs * 0.92);
  const w = Math.round(h * 0.767); // glyph aspect (w/h) from the font outline
  const dy = -Math.round(fs * 0.18); // drop so the swash descender sits below the baseline
  const m = Math.max(2, Math.round(fs * 0.15));
  return `<img src="${AMP_SRC}" alt="&amp;" width="${w}" height="${h}" style="width:${w}px;height:${h}px;vertical-align:${dy}px;margin:0 ${m}px;border:0;outline:none" />`;
}
/** Replace the couple-lockup ampersand in a plain string with the swash glyph. */
function withSwash(s: string, fs: number): string {
  return esc(s).replace('&amp;', ampImg(fs));
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
  return `<div style="font-family:Georgia,'Times New Roman',serif;color:#24140f;max-width:34rem;line-height:1.55">${inner}<p style="margin-top:1.75rem">— Mari${ampImg(16)}Michael</p></div>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:1.5rem 0"><a href="${href}" style="display:inline-block;background:#5b1215;color:#f2e8d8;text-decoration:none;padding:0.7rem 1.4rem;border-radius:4px;font-size:0.95rem;letter-spacing:0.04em">${esc(label)}</a></p>`;
}

// --- invitations & reminders --------------------------------------------------
/** The people this invitation is for, named — with the plus-one allowance shown
    as "& guest" (the extra seat isn't named, because the host doesn't yet know who
    it will be). e.g. "Eleanor Whitfield & James Whitfield", "Lizzie Thornton & guest". */
function invitedDisplay(h: Household, es: boolean): string {
  const names = h.invitedNames || h.label;
  if (h.plusOnes === 1) return `${names} & ${es ? 'acompañante' : 'guest'}`;
  if (h.plusOnes > 1) return `${names} & ${h.plusOnes} ${es ? 'acompañantes' : 'guests'}`;
  return names;
}

/** A designed, centred invitation card. HTML email best practice: nested tables
    + inline styles + a web-safe serif, so it renders the same in Gmail, Outlook
    and Apple Mail. The named guests are the centrepiece. */
function invitationHtml(o: {
  eyebrow: string;
  date: string;
  venue: string;
  forLabel: string;
  names: string;
  intro: string;
  link: string;
  cta: string;
  note: string;
  signoff: string;
}): string {
  // Echoes the site's above-the-fold hero: centred type on the candle-ivory
  // ground, no card. (Email clients won't load Fraunces, so the web-safe serif
  // stands in — the composition + palette carry the consistency.)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2e8d8;margin:0"><tr><td align="center" style="padding:48px 24px">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px"><tr><td style="font-family:Georgia,'Times New Roman',serif;color:#24140f;text-align:center">
    <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#6c4f36">${esc(o.eyebrow)}</div>
    <div style="margin:18px 0 12px;font-size:40px;line-height:1.15;color:#2b1b14">Mari${ampImg(40)}Michael</div>
    <div style="font-size:17px;font-style:italic;color:#24140f">${esc(o.date)}</div>
    <div style="margin:9px 0 0;font-size:11px;letter-spacing:0.13em;text-transform:uppercase;color:#6c4f36;line-height:1.5">Magdalen College, Oxford &middot; Weston Manor, Bicester</div>
    <div style="margin:34px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6c4f36">${esc(o.forLabel)}</div>
    <div style="margin:8px 0 0;font-size:20px;color:#24140f">${esc(o.names)}</div>
    <p style="margin:20px auto 28px;max-width:30em;font-size:15px;line-height:1.6;color:#24140f">${esc(o.intro)}</p>
    <a href="${o.link}" style="display:inline-block;background:#5b1215;color:#f2e8d8;text-decoration:none;padding:13px 34px;border-radius:3px;font-size:14px;letter-spacing:0.06em">${esc(o.cta)}</a>
    <p style="margin:28px auto 0;max-width:30em;font-size:12px;line-height:1.55;color:#6c4f36">${esc(o.note)}</p>
    <p style="margin:24px 0 0;font-size:13px;font-style:italic;color:#6c4f36">${withSwash(o.signoff, 13)}</p>
  </td></tr></table>
</td></tr></table>`;
}

export function buildInvite(h: Household): EmailPayload | null {
  if (!h.email) return null;
  const es = h.locale === 'es';
  const link = householdLink(h.code, h.locale);
  const date = fmtDate(SITE.date, h.locale, true);
  const venue = es ? 'Oxford y Bicester' : 'Oxford & Bicester';
  const by = fmtDate(RSVP.deadline, h.locale);
  const names = invitedDisplay(h, es);
  const subject = es ? 'Están invitados · Mari & Michael' : 'You’re invited · Mari & Michael';
  const html = invitationHtml({
    eyebrow: es ? 'Están invitados' : 'You’re invited',
    date,
    venue,
    forLabel: es ? 'Esta invitación es para' : 'This invitation is for',
    names,
    intro: es
      ? 'Nos encantaría que nos acompañaran. Por favor, díganos si pueden venir — solo toma un minuto.'
      : 'We would be so glad if you could join us. Please let us know whether you can come — it only takes a minute.',
    link,
    cta: es ? 'Confirmar asistencia' : 'RSVP',
    note: es
      ? `Este enlace es personal de su invitación; por favor, no lo reenvíen. Agradeceríamos su respuesta antes del ${by}.`
      : `This link is personal to your invitation, so please don’t forward it. We’d be grateful for your reply by ${by}.`,
    signoff: es ? 'Con cariño, Mari & Michael' : 'With love, Mari & Michael',
  });
  const text = es
    ? `Están invitados — Mari & Michael\n${date} · ${venue}\n\nPara: ${names}\n\nNos encantaría que nos acompañaran. Por favor, díganos si pueden venir:\n${link}\n\nEste enlace es personal de su invitación; por favor, no lo reenvíen. Agradeceríamos su respuesta antes del ${by}.\n\n— Mari & Michael`
    : `You’re invited — Mari & Michael\n${date} · ${venue}\n\nFor: ${names}\n\nWe would be so glad if you could join us. Please let us know whether you can come:\n${link}\n\nThis link is personal to your invitation, so please don’t forward it. We’d be grateful for your reply by ${by}.\n\n— Mari & Michael`;
  return { from: FROM, to: h.email, replyTo: COUPLE || undefined, subject, html, text };
}

export function buildReminder(h: Household): EmailPayload | null {
  if (!h.email) return null;
  const es = h.locale === 'es';
  const link = householdLink(h.code, h.locale);
  const date = fmtDate(SITE.date, h.locale, true);
  const venue = es ? 'Oxford y Bicester' : 'Oxford & Bicester';
  const by = fmtDate(RSVP.deadline, h.locale);
  const names = invitedDisplay(h, es);
  const subject = es ? 'Un recordatorio · Mari & Michael' : 'A gentle reminder · Mari & Michael';
  const html = invitationHtml({
    eyebrow: es ? 'Un recordatorio' : 'A gentle reminder',
    date,
    venue,
    forLabel: es ? 'Esta invitación es para' : 'This invitation is for',
    names,
    intro: es
      ? 'Aún no sabemos si podrán acompañarnos. Cuando tengan un momento, nos encantaría saberlo.'
      : 'We haven’t yet heard whether you can join us. When you have a moment, we’d love to know.',
    link,
    cta: es ? 'Confirmar asistencia' : 'RSVP',
    note: es
      ? `Por favor, respondan antes del ${by}. Si ya respondieron, pueden ignorar este mensaje.`
      : `Kindly reply by ${by}. If you’ve already responded, please ignore this.`,
    signoff: es ? 'Con cariño, Mari & Michael' : 'With love, Mari & Michael',
  });
  const text = es
    ? `Un recordatorio — Mari & Michael\n${date} · ${venue}\n\nPara: ${names}\n\nAún no sabemos si podrán acompañarnos. Cuando tengan un momento, nos encantaría saberlo:\n${link}\n\nPor favor, respondan antes del ${by}. Si ya respondieron, pueden ignorar este mensaje.\n\n— Mari & Michael`
    : `A gentle reminder — Mari & Michael\n${date} · ${venue}\n\nFor: ${names}\n\nWe haven’t yet heard whether you can join us. When you have a moment, we’d love to know:\n${link}\n\nKindly reply by ${by}. If you’ve already responded, please ignore this.\n\n— Mari & Michael`;
  return { from: FROM, to: h.email, replyTo: COUPLE || undefined, subject, html, text };
}

/**
 * Send a batch of personalised emails. Idempotent: retrying with the same
 * idempotencyKey within 24h will not re-send. Returns per-index failures so the
 * caller can mark exactly who sent vs failed. In dev (no key) it logs instead.
 */
export async function sendBatch(payloads: EmailPayload[], idempotencyKey: string): Promise<BatchResult> {
  if (!payloads.length) return { ok: true, sent: 0, failures: new Map() };
  if (!resend) {
    payloads.forEach((p) => console.log(`[email skipped — dev, or no RESEND_API_KEY] → ${p.to}: ${p.subject}`));
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
  code: string,
  // Override the dedupe key to force a genuine re-send (the /admin "Resend"
  // button passes a unique key). Default keys off the reply's updatedAt, so the
  // automatic on-submit send is naturally idempotent.
  idempotencyKey?: string,
): Promise<void> {
  if (!toEmail) return;
  const es = locale === 'es';
  const link = householdLink(code, locale);
  const subject = es
    ? 'Hemos recibido su respuesta · Mari & Michael'
    : 'We have your reply · Mari & Michael';
  const heading = es ? 'Gracias — tenemos su respuesta.' : 'Thank you — we have your reply.';
  const intro = es
    ? 'Esto es lo que registramos. Si algo no está bien, pueden cambiarlo cuando quieran:'
    : 'Here’s what we recorded. Please check it — if anything is wrong, you can change it any time:';
  const coming = rosterLines(r.roster, locale);
  const notComing = notComingNames(r.roster);
  const changeLabel = es ? 'Cambiar mi respuesta' : 'Change my reply';
  // The when/where, shown only to those coming (a decline shouldn't be met with
  // "here's where it is"). A handy reminder for the guest to keep.
  const whenWhere =
    r.attending === 'yes'
      ? `${fmtDate(SITE.date, locale, true)} · ${es ? 'Oxford y Bicester' : 'Oxford & Bicester'}`
      : '';

  const addToCal = es ? 'Añadir al calendario' : 'Add to calendar';

  // --- HTML body: the reply, then a clear per-person list, then a change button.
  let inner = `<p>${esc(heading)}</p>`;
  if (whenWhere)
    inner += `<p style="margin:0.4rem 0 0;color:#6b5a4f;font-size:0.92rem">${esc(whenWhere)} · <a href="${calendarUrl()}" style="color:#5b1215;text-decoration:underline">${esc(addToCal)}</a></p>`;
  inner += `<p>${esc(intro)}</p>`;
  inner += `<p style="margin:0.9rem 0 0.3rem"><strong>${esc(attendingLine(r, locale))}</strong></p>`;
  if (coming.length) {
    inner +=
      `<ul style="margin:0.2rem 0 0;padding-left:1.1rem">` +
      coming.map((l) => `<li style="margin:0.15rem 0">${esc(l)}</li>`).join('') +
      `</ul>`;
  }
  if (notComing.length) {
    inner += `<p style="margin:0.6rem 0 0;color:#6b5a4f">${es ? 'No podrán venir' : 'Can’t come'}: ${esc(notComing.join(', '))}</p>`;
  }
  if (r.dietary.trim()) {
    inner += `<p style="margin:0.6rem 0 0;color:#6b5a4f">${es ? 'Dietas / alergias' : 'Dietary / allergies'}: ${esc(r.dietary)}</p>`;
  }
  if (r.message.trim()) {
    inner += `<p style="margin:0.6rem 0 0;color:#6b5a4f">${es ? 'Mensaje' : 'Message'}: ${esc(r.message)}</p>`;
  }
  inner += button(link, changeLabel);

  // --- plain-text alternative (includes the link as a URL).
  const lines: string[] = whenWhere
    ? [heading, whenWhere, `${addToCal}: ${calendarUrl()}`, '', intro, '', attendingLine(r, locale)]
    : [heading, '', intro, '', attendingLine(r, locale)];
  for (const l of coming) lines.push(`  • ${l}`);
  if (notComing.length) lines.push(`${es ? 'No podrán venir' : 'Can’t come'}: ${notComing.join(', ')}`);
  if (r.dietary.trim()) lines.push(`${es ? 'Dietas / alergias' : 'Dietary / allergies'}: ${r.dietary}`);
  if (r.message.trim()) lines.push(`${es ? 'Mensaje' : 'Message'}: ${r.message}`);
  lines.push('', `${changeLabel}: ${link}`, '', '— Mari & Michael');
  const text = lines.join('\n');

  if (!resend) {
    console.log(`[email skipped] guest confirmation → ${toEmail}\n---\n${text}\n---`);
    return;
  }
  await resend.emails.send(
    {
      from: FROM,
      to: toEmail,
      replyTo: COUPLE || undefined,
      subject,
      html: shell(inner),
      text,
    },
    { idempotencyKey: idempotencyKey ?? `confirm:${toEmail}:${r.updatedAt}` },
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
