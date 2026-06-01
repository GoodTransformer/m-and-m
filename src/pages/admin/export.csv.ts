// Private CSV export of the guest list + replies (gated by the admin middleware).
// BOM + CRLF so it opens cleanly in Excel/Numbers for the caterer and venue.
export const prerender = false;
import type { APIRoute } from 'astro';
import { listHouseholdsWithResponses } from '../../lib/db';
import { rosterLines } from '../../data/site';
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
        r && r.attending === 'yes' ? rosterLines(r.guestNames, r.meals, 'en').join('; ') : '',
        r ? r.dietary : '',
        r ? r.message : '',
        r ? r.updatedAt : '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  const csv = '﻿' + lines.join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mari-and-michael-rsvps.csv"',
    },
  });
};
