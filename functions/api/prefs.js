/**
 * GET /api/prefs?path=…  → { exists, data, seed? }   PUT /api/prefs?path=… (body: JSON) → { ok }
 * The website's saved settings (trips, stars, templates, views…) kept per login in the D1 database, so phone and laptop share them.
 * Falls back to the browser's own storage when MEDINT_DB isn't bound.
 */
import { SEED } from '../_lib/seed_prefs.js';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
let made = false;
async function ready(db) { if (made) return; await db.prepare('CREATE TABLE IF NOT EXISTS prefs (login TEXT, path TEXT, json TEXT, at INTEGER, PRIMARY KEY (login, path))').run(); made = true; }
const who = (request) => (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
const okPath = (p) => /^[\w./:-]{1,120}$/.test(p) && !p.includes('..');
export async function onRequestGet({ request, env }) {
  const login = who(request); const path = new URL(request.url).searchParams.get('path') || '';
  if (!env.MEDINT_DB) return json({ code: 'not_configured' }, 501); if (!login) return json({ error: 'not signed in' }, 401); if (!okPath(path)) return json({ error: 'bad path' }, 400);
  await ready(env.MEDINT_DB); const r = await env.MEDINT_DB.prepare('SELECT json, at FROM prefs WHERE login = ? AND path = ?').bind(login, path).first();
  if (r) { let data = null; try { data = JSON.parse(r.json); } catch { /* broken row */ } return json({ exists: data != null, data, at: r.at }); }
  const seed = /\/prefs$/.test(path) && SEED[login] ? { ui: SEED[login] } : null; return json({ exists: false, seed });
}
export async function onRequestPut({ request, env }) {
  const login = who(request); const path = new URL(request.url).searchParams.get('path') || '';
  if (!env.MEDINT_DB) return json({ code: 'not_configured' }, 501); if (!login) return json({ error: 'not signed in' }, 401); if (!okPath(path)) return json({ error: 'bad path' }, 400);
  const body = await request.text(); if (body.length > 400000) return json({ error: 'too large' }, 413); try { JSON.parse(body); } catch { return json({ error: 'not JSON' }, 400); }
  await ready(env.MEDINT_DB); await env.MEDINT_DB.prepare('INSERT INTO prefs (login, path, json, at) VALUES (?, ?, ?, ?) ON CONFLICT(login, path) DO UPDATE SET json = excluded.json, at = excluded.at').bind(login, path, body, Date.now()).run();
  return json({ ok: true });
}
