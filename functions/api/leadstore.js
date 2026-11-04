/**
 * Shared lead research, kept in Medint's own database (D1, MEDINT_DB) instead of each person's browser:
 * prequalification labels, “Find details” results, website research verdicts, people found and email checks.
 *   GET  /api/leadstore?since=<ms>       → { rows: [{ kind, k, v, by, at }], now }   (everything changed after `since`)
 *   POST /api/leadstore { rows: [{ kind, k, v }] }  → saves them (the person is taken from the login); v = null removes one
 * Everyone signed in shares the same store, so research done once is seen by the whole team on every device.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const KINDS = new Set(['qual', 'find', 'rich', 'ppl', 'vmail', 'brain', 'task', 'objx', 'kol', 'kolspec', 'park', 'offer', 'mnote', 'use', 'score', 'fold', 'lead', 'evt']); // evt: 🎯 event sizes researched or typed by the team
let made = false;
async function ready(db) { if (made) return; await db.batch([db.prepare('CREATE TABLE IF NOT EXISTS leadstore (kind TEXT, k TEXT, v TEXT, by TEXT, at INTEGER, PRIMARY KEY (kind, k))'), db.prepare('CREATE INDEX IF NOT EXISTS ls_at ON leadstore (at)')]); made = true; }
const login = (r) => (r.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
export async function onRequestGet({ request, env }) {
  const db = env.MEDINT_DB; if (!db) return json({ error: 'MEDINT_DB is not bound', rows: [] }, 501); await ready(db);
  const u = new URL(request.url); const since = Number(u.searchParams.get('since')) || 0; const ck = String(u.searchParams.get('ck') || ''); const LIM = 4000;
  // pages of 4000, in (at, kind|k) order: a page never cuts rows that share the same time (?since=&ck= continue where the last page stopped)
  const r = await db.prepare("SELECT kind, k, v, by, at FROM leadstore WHERE at > ? OR (at = ? AND (kind || '|' || k) > ?) ORDER BY at, kind, k LIMIT ?").bind(since, since, ck, LIM).all(); const rows = r.results || [];
  const last = rows[rows.length - 1]; const more = rows.length === LIM;
  return json({ rows: rows.map((x) => ({ kind: x.kind, k: x.k, v: x.v == null ? null : JSON.parse(x.v), by: x.by, at: x.at })), now: last ? last.at : since, ck: last ? `${last.kind}|${last.k}` : ck, more }); // the cursor is the last row: nothing written meanwhile is skipped
}
export async function onRequestPost({ request, env }) {
  const db = env.MEDINT_DB; if (!db) return json({ error: 'MEDINT_DB is not bound' }, 501); await ready(db);
  const b = await request.json().catch(() => ({})); const who = login(request) || 'unknown'; const now = Date.now();
  const rows = [].concat(b.rows || []).filter((x) => x && KINDS.has(x.kind) && x.k && String(x.k).length <= 300).slice(0, 500);
  const st = []; for (const x of rows) { const v = x.v == null ? null : JSON.stringify(x.v); if (v && v.length > 40000) continue; st.push(db.prepare('INSERT INTO leadstore (kind, k, v, by, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(kind, k) DO UPDATE SET v = excluded.v, by = excluded.by, at = excluded.at').bind(x.kind, String(x.k), v, who, now)); }
  for (let i = 0; i < st.length; i += 100) await db.batch(st.slice(i, i + 100));
  return json({ ok: true, saved: st.length, at: now });
}
