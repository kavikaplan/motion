/**
 * Daily caps on paid lookups (Apollo / Snov / Serper / Firecrawl / Bright Data / AI web checks).
 * House is never capped. Everyone else gets a generous daily allowance per kind; the count lives in D1 (table quota).
 * Returns null when the call may go ahead, or a 429 Response when today's allowance is used up.
 */
export const LIMITS = { enrich: 400, qualify: 400, leads: 150, wa: 300 }; // wa: WhatsApp checks (calls of up to 300 numbers)
let made = false;
export async function quota(request, env, kind) {
  const db = env.MEDINT_DB; const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  if (!db || !login) return null; // no database or no login (local preview): unchanged behaviour
  const house = String(env.MEDINT_HOUSE || 'hi@kavikaplan.com').toLowerCase().split(',').map((x) => x.trim());
  if (house.includes(login)) return null;
  const limit = LIMITS[kind] || 300; const k = `${login}|${kind}|${new Date().toISOString().slice(0, 10)}`;
  try {
    if (!made) { await db.prepare('CREATE TABLE IF NOT EXISTS quota (k TEXT PRIMARY KEY, n INTEGER)').run(); made = true; }
    const r = await db.prepare('INSERT INTO quota (k, n) VALUES (?, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n').bind(k).first();
    if (r && r.n > limit) return new Response(JSON.stringify({ error: `Daily limit reached for ${kind} lookups (${limit} per person per day) — try again tomorrow or ask Kavi.`, code: 'quota' }), { status: 429, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch { /* counting failed: never block work because of the counter */ }
  return null;
}
