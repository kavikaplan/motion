import { whoIs } from '../_lib/access.js';
import { callTool } from './nethunt.js';
/**
 * Your Google Calendar on the website, read from its private iCal address.
 * Set once in Cloudflare → medint → Settings → Variables and secrets:
 *   GOOGLE_CALENDAR_ICS (secret) = the "Secret address in iCal format" from Google Calendar
 *   (Google Calendar → ⚙ Settings → your calendar → Integrate calendar).
 * GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD → { events: [...] } in the same shape as the
 * Google Calendar connector, so the dashboard's meeting matching works unchanged.
 */
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// local wall-clock time in an IANA zone → UTC milliseconds
function zonedToUtc(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = Object.fromEntries(f.formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    const asLocal = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return guess - (asLocal - guess);
  } catch { return guess; }
}
function parseDate(prop) { // prop = { params, value }
  const v = prop.value.trim(); const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h) return { date: `${y}-${mo}-${d}` };
  const ms = z ? Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) : zonedToUtc(+y, +mo, +d, +h, +mi, +s, prop.params.TZID || 'UTC');
  return { dateTime: new Date(ms).toISOString() };
}
const unescape = (s) => String(s || '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

export async function onRequestGet({ request, env }) {
  // your calendar is private: only House sees it; a Person gets the meetings linked in NetHunt only
  const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  if (login && env.NETHUNT_MCP_URL) { try { const me = await whoIs(env, (n, a) => callTool(env, n, a), login); if (me.role !== 'House') return json({ events: [], note: 'House calendar is private.' }); } catch { return json({ events: [] }); } }
  if (!env.GOOGLE_CALENDAR_ICS) return json({ error: 'Calendar not connected on the website yet — add GOOGLE_CALENDAR_ICS (your calendar’s secret iCal address) in Cloudflare.', code: 'not_configured' }, 501);
  const u = new URL(request.url); const from = u.searchParams.get('from') || new Date().toISOString().slice(0, 10); const to = u.searchParams.get('to') || '2100-01-01';
  let text;
  const url = String(env.GOOGLE_CALENDAR_ICS).trim();
  try {
    let r = await fetch(url, { cf: { cacheTtl: 300 }, signal: AbortSignal.timeout(10000) });
    if (r.status === 404 && url.includes('@')) r = await fetch(url.replace(/@/g, '%40'), { cf: { cacheTtl: 300 }, signal: AbortSignal.timeout(10000) }); // same address, email encoded
    if (!r.ok) return json({ error: `Google Calendar answered ${r.status}`, code: 'upstream', hint: /\/private-[0-9a-f]+\/basic\.ics/.test(url) ? 'The secret address looks right but Google refused it — reset it in Google Calendar (Integrate calendar → Reset) and paste the new one.' : 'This is not the “Secret address in iCal format” (it should contain /private-…/basic.ics). The public address only works for public calendars.' }, 502);
    text = await r.text();
  } catch (e) { return json({ error: 'Could not reach Google Calendar', code: 'upstream' }, 502); }
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const events = []; let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = { attendees: [] }; continue; }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = line.indexOf(':'); if (i < 0) continue;
    const head = line.slice(0, i); const value = line.slice(i + 1);
    const [name, ...ps] = head.split(';'); const params = Object.fromEntries(ps.map((p) => p.split('=')).map(([k, v]) => [k.toUpperCase(), (v || '').replace(/^"|"$/g, '')]));
    const N = name.toUpperCase();
    if (N === 'UID') cur.id = value;
    else if (N === 'SUMMARY') cur.summary = unescape(value);
    else if (N === 'DESCRIPTION') cur.description = unescape(value).slice(0, 1200);
    else if (N === 'LOCATION') cur.location = unescape(value);
    else if (N === 'STATUS') cur.status = value.toLowerCase();
    else if (N === 'DTSTART') cur.start = parseDate({ params, value });
    else if (N === 'ATTENDEE' || N === 'ORGANIZER') { const m = value.match(/mailto:(.+)$/i); if (m) cur.attendees.push({ email: m[1] }); }
    else if (N === 'URL') cur.htmlLink = value;
    else if (N === 'RECURRENCE-ID') cur.recurrence = true;
  }
  const inRange = (e) => { const s = e.start && (e.start.dateTime || e.start.date); return s && s.slice(0, 10) >= from && s.slice(0, 10) < to; };
  const out = events.filter((e) => e.start && inRange(e) && e.status !== 'cancelled').sort((a, b) => String(a.start.dateTime || a.start.date).localeCompare(String(b.start.dateTime || b.start.date))).slice(0, 400);
  return json({ events: out, note: 'From your calendar’s private iCal address (event colours are not included, so proposed meetings show as set).' });
}
