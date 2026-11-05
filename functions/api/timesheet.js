/** ⚡ Medint work → Task Timesheet: GET = the latest blocks sent (House) · POST = send the finished sessions now (House). See _lib/timesheet.js. */
import { tsSync, ttReady } from '../_lib/timesheet.js';
import { whoIs } from '../_lib/access.js';
import { callTool } from './nethunt.js';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function house(request, env) { const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase(); if (!login) return true; try { return (await whoIs(env, (n, a) => callTool(env, n, a), login)).role === 'House'; } catch { return false; } }
export async function onRequestGet({ request, env }) {
  if (!(await house(request, env))) return json({ error: 'House only' }, 403);
  if (!env.MEDINT_DB) return json({ rows: [] });
  try { const r = await env.MEDINT_DB.prepare('SELECT title, note, at, task_id FROM ts_sent ORDER BY at DESC LIMIT 30').all(); return json({ configured: ttReady(env), rows: r.results || [] }); } catch { return json({ configured: ttReady(env), rows: [] }); }
}
export async function onRequestPost({ request, env }) {
  if (!(await house(request, env))) return json({ error: 'House only' }, 403);
  try { return json(await tsSync(env)); } catch (e) { return json({ ok: false, error: e.message || String(e) }, 502); }
}
