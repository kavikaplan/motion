/**
 * /api/holidays?cal=<Google holiday calendar id>&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Reads Google's public holiday feed for one country (no login or key needed) and answers
 * in the same shape as the Google Calendar tool the dashboard uses inside Claude.
 */
const ok = (body, status = 200, cache = 'public, max-age=21600') => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': cache } });

function unfold(ics) { return ics.replace(/\r?\n[ \t]/g, ''); }
function field(block, name) { const m = block.match(new RegExp(`^${name}(?:;[^:\\n]*)?:(.*)$`, 'm')); return m ? m[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';') : ''; }

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const cal = u.searchParams.get('cal') || '';
  if (!/^en\.[a-z_]+#holiday@group\.v\.calendar\.google\.com$/.test(cal)) return ok({ error: 'Unknown holiday calendar', code: 'bad_request' }, 400, 'no-store');
  const from = (u.searchParams.get('from') || '').slice(0, 10); const to = (u.searchParams.get('to') || '').slice(0, 10);
  const res = await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(cal)}/public/basic.ics`, { cf: { cacheTtl: 21600, cacheEverything: true } });
  if (!res.ok) return ok({ error: `Google answered ${res.status}`, code: 'server_unavailable' }, 502, 'no-store');
  const text = unfold(await res.text());
  const events = [];
  for (const block of text.split('BEGIN:VEVENT').slice(1)) {
    const d = field(block, 'DTSTART'); if (!/^\d{8}/.test(d)) continue;
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    if ((from && date < from) || (to && date >= to)) continue;
    events.push({ id: field(block, 'UID') || date, summary: field(block, 'SUMMARY'), description: field(block, 'DESCRIPTION'), start: { date }, eventType: 'DEFAULT' });
  }
  events.sort((a, b) => a.start.date.localeCompare(b.start.date));
  return ok({ content: [{ type: 'text', text: JSON.stringify({ events }) }] });
}
