/**
 * Medint's own copy of the activity log (independent of NetHunt), in a Cloudflare D1 database bound as MEDINT_DB.
 * Kept forever: nothing is deleted (wrong lines are only marked voided). D1 holds millions of rows within the free 5 GB,
 * and counts are done by the database (indexed), so a long history doesn't slow the app.
 *   POST /api/medint                  → store one log line (the person is taken from the login)
 *   POST /api/medint?sync=1           → House: copy lines saved from the Claude dashboard (NetHunt “Medint Log”) that aren't here yet
 *   GET  /api/medint?summary=1&from=&to=&person=&action=  → House: counts per person × action + the latest 300 lines
 *   GET  /api/medint?csv=1&from=&to=  → House: download as CSV
 */
import { whoIs, F } from '../_lib/access.js';
import { callTool } from './nethunt.js';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const HOUSE = (env) => String(env.MEDINT_HOUSE || 'hi@kavikaplan.com,team@kavikaplan.com').toLowerCase().split(',').map((x) => x.trim());
let readyDone = false;
async function ready(db) {
  if (readyDone) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, epoch INTEGER, time TEXT, person TEXT, email TEXT, login TEXT, action TEXT, outcome TEXT, text TEXT, company_id TEXT, company TEXT, country TEXT, identity TEXT, source TEXT, voided INTEGER DEFAULT 0, nh_id TEXT)`),
    db.prepare('CREATE INDEX IF NOT EXISTS ev_epoch ON events (epoch)'),
    db.prepare('CREATE INDEX IF NOT EXISTS ev_person_epoch ON events (person, epoch)'),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS ev_once ON events (epoch, person, action, company_id)'),
  ]);
  try { await db.prepare('ALTER TABLE events ADD COLUMN nh_id TEXT').run(); } catch { /* already there */ }
  readyDone = true;
}
const row = (b, person, login) => [Number(b.Epoch) || Date.now(), String(b.Time || ''), person, String(b['Person email'] || ''), login, String(b.Action || ''), String(b.Outcome || '').slice(0, 500), String(b.Text || '').slice(0, 20000), String(b.Company || ''), String(b['Company name'] || ''), String(b.Country || ''), String(b.Identity || ''), String(b.Source || 'Website'), b.Voided ? 1 : 0, b.nh_id || null];
const INSERT = 'INSERT OR IGNORE INTO events (epoch, time, person, email, login, action, outcome, text, company_id, company, country, identity, source, voided, nh_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
async function me(request, env) {
  const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  let who = { name: '', role: HOUSE(env).includes(login) ? 'House' : 'Person' };
  if (login && env.NETHUNT_MCP_URL) { try { who = await whoIs(env, (n, a) => callTool(env, n, a), login); } catch { /* fallback above */ } }
  return { login, ...who };
}
export async function onRequestPost({ request, env }) {
  if (!env.MEDINT_DB) return json({ ok: false, code: 'not_configured' }, 501);
  const u = new URL(request.url); const who = await me(request, env); await ready(env.MEDINT_DB);
  if (u.searchParams.get('sync')) { // House: bring in lines written from the Claude dashboard
    if (who.role !== 'House') return json({ error: 'House only' }, 403);
    let added = 0;
    for (const SRC of ['Claude', 'NetHunt']) { // lines saved from the Claude dashboard, and work done directly in NetHunt
    const last = (await env.MEDINT_DB.prepare('SELECT MAX(epoch) AS m FROM events WHERE source = ?').bind(SRC).first()) || {};
    let cursor; let n = 0;
    do {
      const r = await callTool(env, 'filter_records', { folderId: F.LOG, fieldKeys: 'label', filter: { Epoch: { _gt: SRC === 'NetHunt' ? Math.max(0, (Number(last.m) || 0) - 7 * 864e5) : Number(last.m) || 0 }, Source: { _eq: SRC } }, limit: 500, ...(cursor ? { cursor } : {}) });
      let p = {}; try { p = JSON.parse(((r && r.content) || []).map((c) => c.text || '').join('')); } catch { break; }
      const recs = p.records || []; cursor = p.nextCursor; n += 1;
      if (recs.length) { const res = await env.MEDINT_DB.batch(recs.map((x) => { const f = x.fields || {}; return env.MEDINT_DB.prepare(INSERT).bind(...row({ ...f, Company: [].concat(f.Company || [])[0] || '', nh_id: x.id }, String(f.Person || ''), String(f['Person email'] || ''))); })); added += res.reduce((s, x) => s + ((x.meta && x.meta.changes) || 0), 0); }
    } while (cursor && n < 20);
    }
    return json({ ok: true, added });
  }
  let b; try { b = await request.json(); } catch { return json({ error: 'bad body' }, 400); }
  await env.MEDINT_DB.prepare(INSERT).bind(...row(b, who.name || String(b.Person || ''), who.login)).run();
  return json({ ok: true });
}
export async function onRequestGet({ request, env }) {
  if (!env.MEDINT_DB) return json({ ok: false, code: 'not_configured', note: 'Bind a D1 database as MEDINT_DB to keep Medint’s own copy of the log.' }, 501);
  const who = await me(request, env); const own = new URL(request.url).searchParams.get('daily') && (new URL(request.url).searchParams.get('person') || '') === who.name; if (who.role !== 'House' && !own) return json({ error: 'House only' }, 403);
  await ready(env.MEDINT_DB);
  const u = new URL(request.url); const from = Number(u.searchParams.get('from')) || Date.parse(u.searchParams.get('from') || '') || 0; const to = Number(u.searchParams.get('to')) || 9e15;
  const person = u.searchParams.get('person') || ''; const action = u.searchParams.get('action') || '';
  const country = u.searchParams.get('country') || ''; const source = u.searchParams.get('source') || '';
  if (u.searchParams.get('daily')) { // one person's actions per day (their own time zone offset in minutes), for the goals chart
    const tz = Number(u.searchParams.get('tz')) || 0; const who2 = u.searchParams.get('person') || ''; const all = u.searchParams.get('all') && who.role === 'House';
    const db = env.MEDINT_DB; const w = `voided = 0 AND epoch >= ? AND epoch < ?${all ? '' : ' AND person = ?'}`; const wa = [from, to, ...(all ? [] : [who2])];
    const [r1, r2, r3] = await db.batch([db.prepare(`SELECT person, CAST((epoch - ?) / 86400000 AS INTEGER) AS d, action, company_id, COUNT(*) AS n FROM events WHERE ${w} AND action <> 'Other' GROUP BY person, d, action, company_id`).bind(tz * 60000, ...wa),
      db.prepare(`SELECT person, CAST((epoch - ?) / 86400000 AS INTEGER) AS d, outcome, COUNT(*) AS n FROM events WHERE ${w} AND action = 'Contact' AND outcome LIKE 'found%' GROUP BY person, d, outcome`).bind(tz * 60000, ...wa),
      db.prepare(`SELECT person, CAST((epoch - ?) / 86400000 AS INTEGER) AS d, outcome, MAX(epoch) AS at FROM events WHERE ${w} AND action = 'Other' AND outcome LIKE 'plan:%' GROUP BY person, d`).bind(tz * 60000, ...wa)]);
    return json({ rows: r1.results, plans: r3.results, found: r2.results });
  }
  if (u.searchParams.get('summary')) {
    const db = env.MEDINT_DB;
    const w = `voided = 0 AND epoch >= ? AND epoch < ?${country ? ' AND country = ?' : ''}${source ? ' AND source = ?' : ''}`; const wa = [from, to, ...(country ? [country] : []), ...(source ? [source] : [])];
    if (u.searchParams.get('counts')) { // just the numbers (for comparing with another period)
      const [c0, co0, mt0] = await db.batch([db.prepare(`SELECT person, action, COUNT(*) AS n FROM events WHERE ${w} GROUP BY person, action`).bind(...wa), db.prepare(`SELECT person, COUNT(DISTINCT company_id) AS n FROM events WHERE ${w} AND company_id <> '' GROUP BY person`).bind(...wa), db.prepare(`SELECT person, COUNT(*) AS n FROM events WHERE ${w} AND (action = 'Meeting' OR outcome LIKE 'Meeting set%') GROUP BY person`).bind(...wa)]);
      return json({ counts: c0.results, companies: co0.results, meetings: mt0.results });
    }
    const [c, co, mt, list, ctry] = await db.batch([
      db.prepare(`SELECT person, action, COUNT(*) AS n FROM events WHERE ${w} GROUP BY person, action`).bind(...wa),
      db.prepare(`SELECT person, COUNT(DISTINCT company_id) AS n FROM events WHERE ${w} AND company_id <> '' GROUP BY person`).bind(...wa),
      db.prepare(`SELECT person, COUNT(*) AS n FROM events WHERE ${w} AND (action = 'Meeting' OR outcome LIKE 'Meeting set%') GROUP BY person`).bind(...wa),
      db.prepare(`SELECT id, epoch, time, person, action, outcome, text, company_id, company, country, identity, source, nh_id FROM events WHERE ${w}${person ? ' AND person = ?' : ''}${action ? ' AND action = ?' : ''} ORDER BY epoch DESC LIMIT 300`).bind(...wa, ...(person ? [person] : []), ...(action ? [action] : [])),
      db.prepare("SELECT country, COUNT(*) AS n FROM events WHERE voided = 0 AND epoch >= ? AND epoch < ? AND country <> '' GROUP BY country ORDER BY n DESC").bind(from, to),
    ]);
    const total = await db.prepare('SELECT COUNT(*) AS n FROM events').first();
    return json({ counts: c.results, companies: co.results, meetings: mt.results, rows: list.results, countries: ctry.results, stored: total.n });
  }
  const { results } = await env.MEDINT_DB.prepare('SELECT * FROM events WHERE epoch >= ? AND epoch < ? ORDER BY epoch DESC LIMIT 200000').bind(from, to).all();
  if (!u.searchParams.get('csv')) return json({ events: results.slice(0, 5000) });
  const cols = ['time', 'person', 'login', 'action', 'outcome', 'company', 'country', 'identity', 'source', 'text'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return new Response([cols.join(','), ...results.map((r) => cols.map((k) => q(r[k])).join(','))].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="medint-log.csv"' } });
}
