// Absolute URLs for emails and the admin dashboard. Uses the deploy origin
// (SITE_URL) + base path so personal links resolve on the live site. In local
// dev set SITE_URL=http://localhost:4321 so the links are clickable.
const ORIGIN = ((process.env.SITE_URL ?? import.meta.env.SITE_URL) || '').replace(/\/+$/, '');
const BASE = import.meta.env.BASE_URL || '/';

/** A household's personal RSVP link, e.g. https://site/es/rsvp/K7P2QX/
    A path segment (not a ?query) so it survives forwarding through corporate
    proxies and messaging apps that sometimes strip query strings. */
export function householdLink(code: string, locale: 'en' | 'es'): string {
  const path = locale === 'es' ? 'es/rsvp/' : 'rsvp/';
  return `${ORIGIN}${BASE}${path}${encodeURIComponent(code)}/`;
}

export function adminUrl(): string {
  return `${ORIGIN}${BASE}admin/`;
}

/** Absolute URL of the "add to calendar" .ics (for the confirmation email). */
export function calendarUrl(): string {
  return `${ORIGIN}${BASE}wedding.ics`;
}

/** Absolute URL of a file in /public, e.g. https://site/amp.png. Emails must
    reference images by absolute URL (a relative src won't resolve in a mail
    client). In local dev (SITE_URL=http://localhost:4321) it resolves too. */
export function assetUrl(file: string): string {
  return `${ORIGIN}${BASE}${file.replace(/^\/+/, '')}`;
}

/** True if SITE_URL looks unset/placeholder (still localhost or the example
    origin). Used to warn in /admin that invitation links would be wrong. */
export function siteOriginLooksUnset(): boolean {
  return !ORIGIN || /localhost|127\.0\.0\.1|example\./.test(ORIGIN);
}
