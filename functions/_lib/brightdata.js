/**
 * Bright Data — the only service Medint uses to read the web (Serper and Firecrawl were removed, 2026-11-05).
 *  · Web Unlocker zone (BRIGHTDATA_API_KEY + BRIGHTDATA_ZONE, e.g. web_unlocker1): opens a page that won't open directly (blocked, Cloudflare check, needs JavaScript)
 *  · SERP zone        (BRIGHTDATA_API_KEY + BRIGHTDATA_SERP_ZONE, e.g. serp_api1): Google search results as JSON
 * Both go to POST https://api.brightdata.com/request with { zone, url, format: 'raw' }. A failed call is tried once more.
 */
const API = 'https://api.brightdata.com/request';
export const bdReader = (env) => !!(env && env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_ZONE);
export const bdSearchOn = (env) => !!(env && env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE);
const CHALLENGE = /just a moment|access denied|attention required|verify you are human|captcha|cloudflare ray id|enable javascript and cookies/i;
const titleOf = (h) => ((String(h || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
// why Bright Data said no, in words a person can act on
export function bdWhy(status, body) {
  const t = String(body || '').slice(0, 300); let m = ''; try { const j = JSON.parse(t); m = j.error || j.message || ''; } catch { m = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  if (status === 401 || status === 403 && /token|auth|key/i.test(m)) return 'Bright Data refused the API key (check BRIGHTDATA_API_KEY)';
  if (/zone/i.test(m) && /not found|inactive|disabled|exist/i.test(m)) return `Bright Data zone problem: ${m.slice(0, 120)}`;
  if (status === 402 || /balance|credit|payment|insufficient/i.test(m)) return 'Bright Data: no balance left (top up the account)';
  if (status === 429) return 'Bright Data: too many requests at once — try again in a minute';
  return `Bright Data: ${m.slice(0, 140) || `HTTP ${status}`}`;
}
async function call(env, zone, url, ms) {
  let last = '';
  for (let k = 0; k < 2; k++) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.BRIGHTDATA_API_KEY}` }, body: JSON.stringify({ zone, url, format: 'raw' }), signal: AbortSignal.timeout(ms) });
      const body = await r.text();
      if (r.ok) return { ok: true, status: r.status, body };
      last = bdWhy(r.status, body); if (r.status === 401 || r.status === 402 || /zone problem|no balance|API key/.test(last)) break; // no point trying again
    } catch (e) { last = /timeout|abort/i.test(String(e && (e.name || e.message))) ? 'Bright Data: did not answer in time' : `Bright Data: ${e.message || e}`; }
    if (k === 0) await new Promise((res) => setTimeout(res, 800));
  }
  return { ok: false, error: last };
}
/** a web page through the Web Unlocker → { url, html, via } or null (reason in opt.fails) */
export async function bdPage(env, url, opt = {}) {
  if (!bdReader(env)) return null;
  const r = await call(env, env.BRIGHTDATA_ZONE, url, opt.timeout || 30000);
  if (!r.ok) { opt.fails && opt.fails.push(r.error); return null; }
  const html = String(r.body || '').slice(0, opt.max || 600000);
  if (!/<html|<body|<div|<p[\s>]/i.test(html)) { opt.fails && opt.fails.push('Bright Data: the page came back empty'); return null; }
  if (CHALLENGE.test(titleOf(html))) { opt.fails && opt.fails.push('Bright Data: the site still showed a robot check'); return null; }
  return { url, html, via: 'Bright Data' };
}
/** Google search through the SERP zone → { organic: [{title, link, snippet}], kg, via, error } */
export async function bdSearch(env, q, num = 8) {
  if (!bdSearchOn(env)) return { organic: [], kg: {}, via: '', error: 'web search isn’t set up (add BRIGHTDATA_SERP_ZONE in Cloudflare)' };
  const r = await call(env, env.BRIGHTDATA_SERP_ZONE, `https://www.google.com/search?q=${encodeURIComponent(q)}&num=${num}&hl=en&brd_json=1`, 35000);
  if (!r.ok) return { organic: [], kg: {}, via: '', error: r.error };
  let j = null; try { j = JSON.parse(r.body); } catch { j = null; }
  if (!j || typeof j !== 'object') return { organic: [], kg: {}, via: '', error: 'Bright Data: Google answered with a page, not results (is the zone a SERP API zone?)' };
  const organic = (Array.isArray(j.organic) ? j.organic : []).map((x) => ({ title: x.title || '', link: x.link || x.url || '', snippet: x.description || x.snippet || '' })).filter((x) => x.link).slice(0, num);
  const kn = j.knowledge || j.knowledge_graph || {};
  return { organic, kg: { website: kn.website || kn.site || '', title: kn.name || kn.title || '', type: kn.subtitle || kn.type || '', description: kn.description || '' }, via: 'Bright Data' };
}
