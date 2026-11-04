import { quota } from '../_lib/quota.js';
import { readSite, cleanSite } from './enrich.js';
import { webSearch } from '../_lib/search.js';
import { onRequestPost as ai } from './summarize.js';
/**
 * 🎯 How big is a congress / trade fair? GET /api/eventsize?name=&url=&year=&city=&country=
 * Reads the event's own site (home + exhibition / sponsorship / facts / about pages) and two web searches,
 * then an AI pulls out ONLY the numbers that are written there — participants, visitors, exhibitors, countries,
 * floor area, booth price — each with the exact words and the page. A number whose words are not found on that
 * page is returned as unverified (shown with ⚠ and not used for the verdict). Nothing is saved here.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const EV_LINKS = /exhib|expos|sponsor|industr|stand|booth|prospect|partner|facts|figures|statistic|key-?figures|about|history|visitor|attend|participa|registration|inscrip|patrocin|exposi|aussteller/i;
const NUM = ['participants', 'visitors', 'exhibitors', 'countries', 'area_m2'];
const norm = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

export async function onRequestGet({ request, env }) {
  { const q = await quota(request, env, 'qualify'); if (q) return q; }
  const u = new URL(request.url); const name = (u.searchParams.get('name') || '').trim().slice(0, 160); if (!name) return json({ error: 'name missing' }, 400);
  const site = cleanSite(u.searchParams.get('url') || ''); const year = (u.searchParams.get('year') || '').slice(0, 4); const city = (u.searchParams.get('city') || '').slice(0, 60); const country = (u.searchParams.get('country') || '').slice(0, 60);
  const pages = []; const attempts = [];
  // 1 · the event's own site
  if (site) { try { const rd = await readSite(env, site, 5, EV_LINKS); rd.pages.forEach((p) => pages.push({ url: p.url, text: p.text.slice(0, 5000) })); attempts.push(rd.pages.length ? `read ${rd.pages.length} page${rd.pages.length === 1 ? '' : 's'} of ${site}` : `${site} did not open: ${rd.reason || 'unknown'}`); } catch (e) { attempts.push(`${site}: ${e.message || e}`); } }
  // 2 · two searches: the figures, and the exhibitor prospectus / booth price
  const qs = [ `"${name}" ${year} exhibitors visitors participants countries`, `"${name}" ${year} exhibitor prospectus booth stand price sqm` ];
  for (const q of qs) { const r = await webSearch(env, q, 6); attempts.push(`search “${q}” → ${(r.organic || []).length}${r.error ? ` (${r.error})` : ''}`);
    (r.organic || []).slice(0, 6).forEach((x) => { if (x.link && !pages.some((p) => p.url === x.link)) pages.push({ url: x.link, text: `${x.title || ''}\n${x.snippet || x.description || ''}`, snippet: !0 }); }); }
  if (!pages.length) return json({ facts: {}, pages: [], attempts, error: 'nothing to read — no website and the search found nothing' });
  // 3 · the AI reads, quotes and never guesses
  const body = pages.map((p, i) => `[page ${i + 1}] ${p.url}${p.snippet ? ' (search result: title + summary only)' : ''}\n${p.text}`).join('\n\n').slice(0, 15000);
  const prompt = `You read pages about the event "${name}"${year ? ` (${year})` : ''}${city || country ? ` in ${[city, country].filter(Boolean).join(', ')}` : ''}. Extract ONLY numbers that are written in the text below — never estimate, never compute, never use your own knowledge.
For each number give the exact words from the page that contain it (max 25 words) and the page number. Prefer the most recent edition; say which year the number is for. Ignore numbers about OTHER events (another congress, another city or another organiser).
Fields:
- participants: delegates / registered participants / attendees of the congress
- visitors: trade visitors of an exhibition / fair
- exhibitors: exhibiting companies (or exhibitors + sponsors if only that is given — say so in note)
- countries: number of countries participants or exhibitors come from
- area_m2: exhibition floor area in square metres
- booth: the price to exhibit — {"price": number, "currency": "EUR|USD|GBP|…", "unit": "per m2|per booth|package", "size_m2": number or null}
- exhibition: "yes" if companies can exhibit / book a booth, "no" if the page says there is no exhibition, else "unknown"
- specialties: the medical fields covered (short words, max 6)
- audience: who comes, in a few words (e.g. "orthopaedic surgeons", "distributors and hospital buyers")
Answer ONLY JSON:
{"participants":{"value":0,"year":2025,"quote":"","page":1}|null,"visitors":…|null,"exhibitors":…|null,"countries":…|null,"area_m2":…|null,"booth":{"price":0,"currency":"","unit":"","size_m2":null,"quote":"","page":1}|null,"exhibition":{"value":"yes|no|unknown","quote":"","page":1},"specialties":[],"audience":"","note":""}

${body}`;
  let o = {};
  try { const r = await ai({ request: new Request('https://x/api/summarize', { method: 'POST', body: JSON.stringify({ prompt }) }), env }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'AI failed');
    const m = String(d.text || '').match(/\{[\s\S]*\}/); o = m ? JSON.parse(m[0]) : {}; } catch (e) { return json({ facts: {}, pages: pages.map((p) => p.url), attempts, error: `AI: ${e.message || e}` }); }
  // 4 · keep a number only when its words are on that page (and the number is in the words)
  const check = (f) => { if (!f || typeof f !== 'object') return null; const pg = pages[(Number(f.page) || 1) - 1]; const q = String(f.quote || '').slice(0, 260); const v = Number(String(f.value ?? f.price ?? '').replace(/[^\d.]/g, ''));
    const digits = String(Math.round(v)); const qn = norm(q); const onPage = !!(pg && qn && norm(pg.text).includes(qn.slice(0, 40))); const numIn = !!qn && (qn.replace(/[^\d]/g, '').includes(digits.slice(0, Math.min(3, digits.length))));
    return { quote: q, url: pg ? pg.url : '', year: f.year || null, verified: onPage && numIn, from: pg && pg.snippet ? 'search result' : 'event page' }; };
  const facts = {};
  NUM.forEach((k) => { const f = o[k]; const v = f && Number(String(f.value ?? '').replace(/[^\d.]/g, '')); if (v && v > 0 && v < 5e6) facts[k] = { value: Math.round(v), ...check(f) }; });
  if (o.booth && Number(o.booth.price) > 0) facts.booth = { price: Number(o.booth.price), currency: String(o.booth.currency || '').toUpperCase().slice(0, 3), unit: /m2|m²|sqm|square/i.test(o.booth.unit || '') ? 'per m2' : /package/i.test(o.booth.unit || '') ? 'package' : 'per booth', size_m2: Number(o.booth.size_m2) || null, ...check(o.booth) };
  if (o.exhibition && /^(yes|no)$/i.test(o.exhibition.value || '')) facts.exhibition = { value: o.exhibition.value.toLowerCase(), ...check({ ...o.exhibition, value: 1 }) };
  if (facts.exhibition && facts.exhibition.quote) facts.exhibition.verified = !!(pages[(Number(o.exhibition.page) || 1) - 1] && norm(pages[(Number(o.exhibition.page) || 1) - 1].text).includes(norm(facts.exhibition.quote).slice(0, 40)));
  const extra = { specialties: [].concat(o.specialties || []).map(String).slice(0, 6), audience: String(o.audience || '').slice(0, 120), note: String(o.note || '').slice(0, 200) };
  return json({ facts, ...extra, pages: pages.map((p) => p.url), attempts, at: Date.now() });
}
