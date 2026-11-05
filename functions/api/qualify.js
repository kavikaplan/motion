import { quota } from '../_lib/quota.js';
import { webSearch } from '../_lib/search.js';
import { bdSearchOn } from '../_lib/brightdata.js';
/**
 * GET /api/qualify?name=&country=  → { verdict: ortho|not|buyer|pharmacy|person|maybe, reason, website }
 * One Google search (Bright Data SERP zone) + the AI (same keys as /api/summarize) decides whether the company sells orthopaedic products.
 */
import { onRequestPost as ai } from './summarize.js';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export async function onRequestGet({ request, env }) {
  { const q = await quota(request, env, 'qualify'); if (q) return q; }
  const u = new URL(request.url); const name = (u.searchParams.get('name') || '').trim().slice(0, 160); const country = (u.searchParams.get('country') || '').trim().slice(0, 60); if (!name) return json({ error: 'name missing' }, 400);
  if (!bdSearchOn(env)) return json({ error: 'Web search isn’t set up — add BRIGHTDATA_API_KEY and BRIGHTDATA_SERP_ZONE in Cloudflare' });
  const sr = await webSearch(env, `"${name}" ${country}`, 8); if (!sr.organic.length && !sr.kg.title) return sr.error ? json({ error: sr.error }) : json({ verdict: 'maybe', reason: 'nothing found on the web' }); const res = sr.organic.slice(0, 8); const kg = sr.kg || {};
  const lines = [kg.title && `Google card: ${kg.title} — ${kg.type || ''} — ${kg.description || ''} — ${kg.website || ''}`, ...res.map((x, i) => `${i + 1}. ${x.title} — ${x.link} — ${x.snippet || ''}`)].filter(Boolean).join('\n').slice(0, 5000);
  if (!lines) return json({ verdict: 'maybe', reason: 'nothing found on Google' });
  const prompt = `We sell orthopaedic implants (trauma plates/screws, spine, joint replacement, sports medicine) to DISTRIBUTORS. Decide what "${name}" in ${country || 'its country'} is, from these Google results:\n${lines}\n\nAnswer ONLY with JSON: {"verdict":"ortho|other|not|buyer|pharmacy|person","specialty":"their main medical field if other","reason":"max 15 words","website":"their own website or empty"}\n- ortho = sells/distributes orthopaedic or surgical implants/instruments (also general medical-device distributors that clearly carry orthopaedics)\n- other = a medical / healthcare company in ANOTHER specialty (e.g. imaging, lab, dental, cardiology, ophthalmology, hospital furniture) with no orthopaedics\n- not = not a healthcare business at all\n- buyer = hospital, clinic or public institution\n- pharmacy = pharmacy, drugstore or pharmaceutical lab\n- person = an individual, not a company\nIf the results are about a different company, say "not" only if you are sure; otherwise use "ortho" only with evidence.`;
  try { const r = await ai({ request: new Request('https://x/api/summarize', { method: 'POST', body: JSON.stringify({ prompt }) }), env }); const d = await r.json(); if (!r.ok) return json({ error: d.error || 'AI failed' });
    const m = String(d.text || '').match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : {}; const v = ['ortho', 'other', 'not', 'buyer', 'pharmacy', 'person'].includes(o.verdict) ? o.verdict : 'maybe';
    return json({ verdict: v, reason: `${v === 'other' && o.specialty ? `${o.specialty} — ` : ''}${String(o.reason || '').slice(0, 140)}`, website: /^https?:\/\//.test(o.website || '') ? o.website : o.website ? `https://${o.website}` : '' }); }
  catch (e) { return json({ error: `AI: ${e.message || e}` }); }
}
