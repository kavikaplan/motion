/**
 * 🟢 Is this number on WhatsApp? POST /api/wacheck { numbers: ['+56912345678', …] } → { results: { '56912345678': true|false }, checked, cached }
 * The check is done by the Apify actor “WhatsApp Number Validator” (vtrdev) — it needs no WhatsApp account of ours, so nothing of ours can be
 * banned. About $1 per 1,000 numbers. Each answer is kept in D1 (table wa_check) for 120 days, so a number is paid for once.
 * Setup: Cloudflare secret APIFY_TOKEN (Apify Console → Settings → API & Integrations). Without it → 501 not_configured (Medint keeps its own guess).
 */
import { json, loginOf } from '../_lib/gmail.js';
import { quota } from '../_lib/quota.js';
const ACTOR = 'vtrdev~whatsapp-number-validator';
const KEEP = 120 * 864e5;
export const waNorm = (t) => { const s = String(t || '').trim(); if (!/^(\+|00)/.test(s)) return ''; const n = s.replace(/\D/g, '').replace(/^00/, ''); return n.length >= 8 && n.length <= 15 && !/^0/.test(n) ? n : ''; };
let made = false;
async function table(db) { if (!made) { await db.prepare('CREATE TABLE IF NOT EXISTS wa_check (num TEXT PRIMARY KEY, has INTEGER, at INTEGER, by TEXT)').run(); made = true; } }
export async function apifyCheck(env, nums) { // → Map digits → true/false (numbers the actor gave no answer for are left out)
  const out = new Map();
  for (let k = 0; k < nums.length; k += 100) {
    const part = nums.slice(k, k + 100);
    const r = await fetch(`https://api.apify.com/v2/actors/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(env.APIFY_TOKEN)}&timeout=90`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone_numbers: part.map((n) => `+${n}`) }), signal: AbortSignal.timeout(100000) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(j)) { const m = (j && j.error && (j.error.message || j.error.type)) || `Apify error ${r.status}`; throw Object.assign(new Error(/credit|usage|limit|payment/i.test(m) ? `Apify: ${m} — top up the Apify account` : m), { status: r.status }); }
    j.forEach((x) => { const n = String((x && (x.phone || x.number || x.phone_number)) || '').replace(/\D/g, ''); const v = x && (x.hasWhatsapp ?? x.has_whatsapp ?? x.isWhatsapp ?? x.exists); if (n && typeof v === 'boolean') out.set(n, v); });
  }
  return out;
}
export async function onRequestPost({ request, env }) {
  const login = loginOf(request); if (!login) return json({ error: 'not signed in' }, 401);
  let b = {}; try { b = await request.json(); } catch { /* empty */ }
  const nums = [ ...new Set([].concat(b.numbers || []).map((x) => (/^\d{8,15}$/.test(String(x)) ? String(x) : waNorm(x))).filter(Boolean)) ].slice(0, 300);
  if (!nums.length) return json({ results: {}, checked: 0, cached: 0 });
  const results = {}; const db = env.MEDINT_DB; const now = Date.now();
  if (db) { try { await table(db); for (let k = 0; k < nums.length; k += 90) { const part = nums.slice(k, k + 90); const R = await db.prepare(`SELECT num, has, at FROM wa_check WHERE num IN (${part.map(() => '?').join(',')})`).bind(...part).all(); (R.results || []).forEach((r) => { if (now - r.at < KEEP) results[r.num] = !!r.has; }); } } catch { /* no cache: ask Apify */ } }
  const todo = nums.filter((n) => !(n in results)); const cached = nums.length - todo.length;
  if (!todo.length) return json({ results, checked: 0, cached });
  if (!env.APIFY_TOKEN) return json({ results, checked: 0, cached, error: 'The WhatsApp check isn’t set up — add the Cloudflare secret APIFY_TOKEN.', code: 'not_configured' }, cached ? 200 : 501);
  { const q = await quota(request, env, 'wa'); if (q) return q; }
  let got;
  try { got = await apifyCheck(env, todo); } catch (e) { return json({ results, checked: 0, cached, error: e.message || String(e), code: 'apify' }, cached ? 200 : 502); }
  const save = [];
  got.forEach((v, n) => { if (!todo.includes(n)) return; results[n] = v; save.push([ n, v ? 1 : 0 ]); });
  if (db && save.length) { try { await db.batch(save.map(([n, v]) => db.prepare('INSERT INTO wa_check (num, has, at, by) VALUES (?, ?, ?, ?) ON CONFLICT(num) DO UPDATE SET has = excluded.has, at = excluded.at, by = excluded.by').bind(n, v, now, login))); } catch { /* answered anyway */ } }
  return json({ results, checked: save.length, cached });
}
