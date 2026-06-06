// Private CSV export of the guest list + replies (gated by the admin middleware).
// BOM + CRLF so it opens cleanly in Excel/Numbers for the caterer and venue.
export const prerender = false;
import type { APIRoute } from 'astro';
import { listHouseholdsWithResponses } from '../../lib/db';
import { rosterLines, notComingNames } from '../../data/site';
import { csvCell } from '../../lib/csv';

export const GET: APIRoute = async () => {
  const households = await listHouseholdsWithResponses();
  const header = [
    'Household',
    'Invited names',
    'Email',
    'Max seats',
    'Language',
    'Invite status',
    'Replied',
    'Attending',
    'Party size',
    'Guests & meals',
    'Not coming',
    'Dietary',
    'Message',
    'Updated',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const h of households) {
    const r = h.response;
    lines.push(
      [
        h.label,
        h.invitedNames,
        h.email ?? '',
        h.maxSeats,
        h.locale,
        h.inviteStatus,
        r ? 'yes' : 'no',
        r ? r.attending : '',
        r && r.attending === 'yes' ? r.partySize : '',
        r && r.attending === 'yes' ? rosterLines(r.roster, 'en').join('; ') : '',
        r ? notComingNames(r.roster).join('; ') : '',
        r ? r.dietary : '',
        r ? r.message : '',
        r ? r.updatedAt : '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  const csv = '﻿' + lines.join('\r\n');
  // Date-stamp the filename so a folder of exports is self-documenting — the
  // couple may grab a fresh copy days or months apart and need to know when
  // each was taken. This is the FALLBACK name (direct hit on the URL); the
  // dashboard's download links override it with the couple's *local* time via a
  // `download` attribute. Server time is UTC on Vercel, so it's labelled as such
  // to stay honest in that rare direct-URL case.
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}-${p(d.getUTCMinutes())}`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Replies ${stamp} UTC.csv"`,
    },
  });
};
