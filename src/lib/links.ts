// Absolute URLs for emails and the admin dashboard. Uses the deploy origin
// (SITE_URL) + base path so personal links resolve on the live site. In local
// dev set SITE_URL=http://localhost:4321 so the links are clickable.
const ORIGIN = (import.meta.env.SITE_URL || '').replace(/\/+$/, '');
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
