/**
 * Data files (/data/*.json) for a Person: only rows about companies assigned to them.
 * House (and the site without a login) gets the files unchanged.
 */
import { whoIs, allowedSet } from './_lib/access.js';
import { callTool } from './api/nethunt.js';
const ID = /^[0-9a-f]{24}$/;
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/data/') || !url.pathname.endsWith('.json')) return next();
  const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  if (!login || !env.NETHUNT_MCP_URL) return next();
  const nh = (n, a) => callTool(env, n, a);
  let me; try { me = await whoIs(env, nh, login); } catch { return next(); }
  if (me.role === 'House') return next();
  const res = await next(); if (!res.ok) return res;
  let rows; try { rows = await res.clone().json(); } catch { return res; }
  if (!Array.isArray(rows) || !rows.some((r) => r && ID.test(String(r.id || '')))) return res; // not a per-company file
  if (me.role === 'Unknown' || !me.active) return new Response('[]', { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  const allow = await allowedSet(nh, me.name);
  const out = rows.filter((r) => !r || !ID.test(String(r.id || '')) || allow.has(r.id));
  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
