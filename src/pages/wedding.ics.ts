// "Add to calendar" file for guests — one event covering the day. Served as a
// static .ics so any calendar app (Apple, Google, Outlook) can import it.
//
// Times are UK local; late September is **British Summer Time (UTC+1)**, so the
// stored UTC is one hour behind — which also means an overseas guest's calendar
// shows the correct local equivalent automatically. Edit the constants here if
// the schedule changes (the human date comes from SITE.date).
export const prerender = true;
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

const ARRIVE_LOCAL = '14:30'; // guests arrive (2:30pm); ceremony is 3:00pm
const DURATION_HOURS = 9.5; // 2:30pm → midnight (carriages)
const BST_OFFSET = '+01:00'; // British Summer Time on 23 September
const SUMMARY = "Mari & Michael's Wedding";
const LOCATION = 'Magdalen College, High Street, Oxford OX1 4AU';
const DESCRIPTION =
  'Ceremony 3:00pm at Magdalen College, Oxford — please arrive by 2:30pm. Dinner & dancing at Weston Manor, Bicester. Black tie.';

/** Date → iCal UTC stamp, e.g. 20260923T133000Z */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
/** Escape iCalendar TEXT values (RFC 5545): backslash, semicolon, comma, newline. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export const GET: APIRoute = () => {
  const start = new Date(`${SITE.date}T${ARRIVE_LOCAL}:00${BST_OFFSET}`);
  const end = new Date(start.getTime() + DURATION_HOURS * 60 * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mari & Michael//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // Stable UID + DTSTAMP so re-adding updates the same event (no duplicates).
    `UID:mari-and-michael-wedding-${SITE.date}@m-and-m`,
    'DTSTAMP:20260101T000000Z',
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(SUMMARY)}`,
    `LOCATION:${esc(LOCATION)}`,
    `DESCRIPTION:${esc(DESCRIPTION)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mari-and-michael.ics"',
    },
  });
};
