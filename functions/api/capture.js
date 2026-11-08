/**
 * ➕ Add to Medint (the browser button): the page you are on → a company and/or a person, enriched, ready for NetHunt.
 * POST { url, title, desc, sel, text }  (sel = what you highlighted, text = what the page shows)
 *  1. the company's own website (not LinkedIn / Facebook / Maps…): home + contact / about pages read (Bright Data when a site blocks us),
 *     with its emails, phones and social links picked out (the same enrichment as Find contacts)
 *  2. one AI call turns everything into fields — company and person
 * → { kind, company: {...}, person: {...}, items: [...], site, pages, via }
 */
import { onRequestPost as ai } from './summarize.js';
import { onRequestGet as enrichGet, readSite } from './enrich.js';
import { quota } from '../_lib/quota.js';

const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
// pages that are about a company but are not its website
const PLATFORM = /(^|\.)(linkedin|facebook|fb|instagram|twitter|x|youtube|tiktok|google|goo|bing|yandex|maps\.apple|wikipedia|crunchbase|zoominfo|apollo|rocketreach|dnb|kompass|europages|yellowpages|paginasamarillas|amarillas|yelp|tripadvisor|glassdoor|indeed|bloomberg|opencorporates|medicalexpo|exhibitors?|mapyourshow|a2zinc|expocad|nethunt|snov|whatsapp|wa)\.[a-z.]+$/i;
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let b = {}; try { b = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  { const q = await quota(request, env, 'enrich'); if (q) return q; }
  let u = null; try { u = new URL(String(b.url || '')); } catch { u = null; }
  const host = u ? u.hostname.replace(/^www\./, '') : ''; const own = !!u && /^https?:$/.test(u.protocol) && !PLATFORM.test(host);
  const site = own ? `${u.protocol}//${u.hostname}/` : '';
  let items = [], pages = [], siteText = '', siteErr = '';
  if (site) {
    try { const r = await enrichGet({ request: new Request(`https://x/api/enrich?site=${encodeURIComponent(site)}&q=${encodeURIComponent(clean(b.title, 80))}&nosearch=1`, { headers: request.headers }), env }); const j = await r.json(); items = j.items || []; pages = j.pages || []; siteErr = j.site_error || ''; } catch (e) { siteErr = e.message; }
    try { const rs = await readSite(env, site, 3); siteText = (rs.pages || []).map((p) => `[${p.url}] ${clean(p.text, 3500)}`).join('\n').slice(0, 9000); } catch { /* the page text is enough */ }
  }
  const prompt = `You turn a web page a salesperson is looking at into CRM records. The salesperson sells orthopaedic implants and looks for distributors (companies) and their people, and for surgeons.
Return ONLY JSON:
{"kind":"company"|"person"|"both","company":{"name":"","website":"","country":"","city":"","address":"","phones":[],"emails":[],"linkedin":"","facebook":"","instagram":"","what_they_do":"one short line","ortho":"yes"|"maybe"|"no"},"person":{"name":"","title":"","company":"","email":"","phone":"","linkedin":"","country":"","city":"","specialty":""}}
Rules: use only what the text says — never invent emails or phones; keep phones with their country code when shown; country as an English country name;
"person" is empty ({}) when the page is not about a specific person; "company" is the person's employer when the page is a person's profile;
the HIGHLIGHTED text is what the salesperson cares about most.
PAGE: ${clean(b.title, 200)} — ${String(b.url || '').slice(0, 300)}
${b.desc ? `DESCRIPTION: ${clean(b.desc, 400)}\n` : ''}${b.sel ? `HIGHLIGHTED: ${clean(b.sel, 4000)}\n` : ''}PAGE TEXT: ${clean(b.text, 9000)}
${siteText ? `THEIR WEBSITE: ${siteText}` : ''}
${items.length ? `FOUND ON THEIR SITE: ${items.slice(0, 30).map((x) => `${x.kind}: ${x.value}`).join(' · ')}` : ''}`;
  let out = {};
  try { const r = await ai({ request: new Request('https://x/api/summarize', { method: 'POST', body: JSON.stringify({ prompt }) }), env }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'AI failed');
    const m = String(d.text || '').match(/\{[\s\S]*\}/); out = m ? JSON.parse(m[0]) : {}; }
  catch (e) { return json({ error: `Could not read the page: ${e.message}`, items, site, pages }, 502); }
  const co = out.company || {}; const pe = out.person || {};
  // what the website showed beats what the AI wrote
  const em = items.filter((x) => x.kind === 'email').map((x) => x.value), ph = items.filter((x) => x.kind === 'phone').map((x) => x.value);
  co.emails = [ ...new Set([ ...[].concat(co.emails || []), ...em ].map((x) => String(x).trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(x))) ].slice(0, 6);
  co.phones = [ ...new Set([ ...[].concat(co.phones || []), ...ph ].map((x) => String(x).trim()).filter((x) => x.replace(/\D/g, '').length >= 7)) ].slice(0, 6);
  if (!co.website && site) co.website = site;
  [ 'linkedin', 'facebook', 'instagram' ].forEach((k) => { if (!co[k]) { const it = items.find((x) => new RegExp(k, 'i').test(x.value || '')); it && (co[k] = it.value); } });
  if (/linkedin\.com\/in\//i.test(String(b.url || '')) && !pe.linkedin) pe.linkedin = String(b.url).split('?')[0];
  if (/linkedin\.com\/company\//i.test(String(b.url || '')) && !co.linkedin) co.linkedin = String(b.url).split('?')[0];
  return json({ kind: out.kind || (pe.name ? (co.name ? 'both' : 'person') : 'company'), company: co, person: pe, items: items.slice(0, 40), site, pages, site_error: siteErr });
}
