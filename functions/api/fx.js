/**
 * Exchange rates against the US dollar, for the small “1 USD = 945 CLP” note on country pages.
 *   GET /api/fx → { base: 'USD', rates: { CLP: 945.2, … }, updated }
 * Source: open.er-api.com (free, no key), refreshed at most every 6 hours (kept in Cloudflare's cache).
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=21600' } });
let mem = null;
export async function onRequestGet({ request }) {
  if (mem && Date.now() - mem.at < 6 * 36e5) return json(mem.body);
  const cache = typeof caches !== 'undefined' ? caches.default : null; const key = new Request(new URL('/api/fx-cache', request.url).href);
  if (cache) { const hit = await cache.match(key); if (hit) { const b = await hit.json(); mem = { at: Date.now(), body: b }; return json(b); } }
  try { const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(8000) }); const j = await r.json(); if (j.result !== 'success' || !j.rates) throw new Error(j['error-type'] || `HTTP ${r.status}`);
    const body = { base: 'USD', rates: j.rates, updated: j.time_last_update_utc || '' }; mem = { at: Date.now(), body }; if (cache) await cache.put(key, json(body)); return json(body);
  } catch (e) { return json({ error: String(e.message || e), rates: {} }, 502); }
}
