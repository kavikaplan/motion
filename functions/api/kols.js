import { quota } from '../_lib/quota.js';
import { webSearch } from '../_lib/search.js';
import { onRequestPost as ai } from './summarize.js';
/**
 * 🩺 KOL finder — surgeons of one specialty in one country, from the open web.
 *   POST /api/kols { iso, country, specialty: { id, label, words: { en: [..], es: [..] } }, langs: ['es','en'], exclude: [names] }
 * → { people: [{ name, title, role, hospital, city, email, phone, whatsapp, linkedin, web, source, source_label, specialty }], searched: [queries], pages: n }
 * Searches society boards, congress faculty, hospital directories and AO faculty pages, reads the best pages and has the AI
 * pull out only the surgeons that page names, with only the contact details printed on it. A name not found on its page is dropped.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; Medint/1.0)', accept: 'text/html,application/xhtml+xml' };
const SKIP = /facebook|instagram|youtube|tiktok|twitter|x\.com|pinterest|wikipedia|amazon|mercadolibre|indeed|computrabajo|glassdoor/i;
const txt = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
async function page(env, url) { try { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(9000) }); if (r.ok && /html/i.test(r.headers.get('content-type') || '')) { const t = txt((await r.text()).slice(0, 500000)); if (t.length > 300) return t; } } catch { /* reader */ }
  try { if (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_ZONE) { const r = await fetch('https://api.brightdata.com/request', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.BRIGHTDATA_API_KEY}` }, body: JSON.stringify({ zone: env.BRIGHTDATA_ZONE, url, format: 'raw' }), signal: AbortSignal.timeout(25000) }); if (r.ok) { const t = txt((await r.text()).slice(0, 500000)); if (t.length > 300) return t; } } } catch { /* none */ }
  try { if (env.FIRECRAWL_API_KEY) { const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.FIRECRAWL_API_KEY}` }, body: JSON.stringify({ url, formats: ['markdown'] }), signal: AbortSignal.timeout(25000) }); const j = await r.json().catch(() => ({})); const t = j.data && j.data.markdown; if (r.ok && t && t.length > 300) return String(t).slice(0, 200000); } } catch { /* none */ }
  return ''; }
const Q = { // how surgeons are named in each language — [specialist words, society / congress words]
  es: ['cirujano', 'sociedad junta directiva', 'congreso profesores', 'hospital médicos staff'], pt: ['cirurgião', 'sociedade diretoria', 'congresso palestrantes', 'hospital corpo clínico'],
  en: ['surgeon', 'society board', 'congress faculty', 'hospital consultants'], fr: ['chirurgien', 'société bureau', 'congrès intervenants', 'hôpital équipe'], tr: ['cerrahı', 'derneği yönetim kurulu', 'kongre konuşmacılar', 'hastane doktorlar'], ru: ['хирург', 'общество правление', 'конгресс докладчики', 'больница врачи'] };
export async function onRequestPost({ request, env }) {
  { const q = await quota(request, env, 'qualify'); if (q) return q; }
  const b = await request.json().catch(() => ({})); const iso = String(b.iso || '').toUpperCase().slice(0, 2); const country = String(b.country || '').slice(0, 60); const sp = b.specialty || {};
  const W = sp.words && typeof sp.words === 'object' && !Array.isArray(sp.words) ? sp.words : { en: [].concat(sp.words || []) }; const words = [...new Set(Object.values(W).flat().map(String).filter(Boolean))].slice(0, 12); if (!country || !words.length) return json({ error: 'country and specialty words needed' }, 400);
  const langs = [...new Set([].concat(b.langs || []).filter((l) => Q[l]).concat('en'))].slice(0, 2); const exclude = new Set([].concat(b.exclude || []).map(norm));
  if (!(env.SERPER_API_KEY || env.FIRECRAWL_API_KEY || (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE))) return json({ error: 'web search isn’t set up (SERPER_API_KEY, FIRECRAWL_API_KEY or BRIGHTDATA_SERP_ZONE)' }, 501);
  // searches: the specialty society's board, congress faculty, hospital specialists, AO / international faculty — in the country's language and English
  const qs = []; for (const l of langs) { const L0 = [].concat(W[l] || W.en || words); const w = L0[0], w2 = L0[1] || L0[0]; qs.push(`"${w2}" ${country} ${Q[l][1]}`, `${w} ${country} ${Q[l][2]}`, `${w} ${country} ${Q[l][3]}`); }
  sp.extra && qs.push(`${sp.extra} ${country}`);
  const found = new Map(); const searched = [];
  for (const q of qs.slice(0, 6)) { const r = await webSearch(env, q, 8); searched.push(`${q} → ${(r.organic || []).length}${r.error ? ` (${r.error})` : ''}`); (r.organic || []).forEach((x, i) => { try { const h = new URL(x.link).host; if (SKIP.test(h)) return; const k = x.link.split('#')[0]; const o = found.get(k) || { link: k, title: x.title, snippet: x.snippet || '', score: 0 }; o.score += 10 - i + (/sociedad|society|sociedade|association|asociaci|board|junta|directiva|diretoria|faculty|profesores|congres|staff|equipo|médicos|doctors|consultants/i.test(`${x.title} ${x.snippet} ${k}`) ? 5 : 0); found.set(k, o); } catch { /* bad url */ } }); }
  const top = [...found.values()].sort((a, b2) => b2.score - a.score).slice(0, 6); const people = []; let pages = 0;
  for (const p of top) { const t = await page(env, p.link); if (!t) continue; pages++; const body = t.slice(0, 12000);
    const prompt = `From this web page, list the ${sp.label || words[0]} surgeons (orthopaedic) it names who practise in ${country}. Only people the page explicitly shows as surgeons/doctors related to ${words.join(' / ')} (society officers, congress faculty, hospital specialists, AO faculty). Copy contact details ONLY if printed on the page for that person (professional phone, email, WhatsApp, website, LinkedIn) — never guess. Skip anyone not in ${country}.
Answer ONLY a JSON array (max 25), each item: {"name":"exact name as written","title":"Dr./Prof. if shown","role":"position or reason they are on the page, max 12 words","hospital":"","city":"","email":"","phone":"","whatsapp":"","linkedin":"","web":""}. Empty array if none.

PAGE (${p.link}) — ${p.title}:
${body}`;
    try { const r = await ai({ request: new Request('https://x/api/summarize', { method: 'POST', body: JSON.stringify({ prompt }) }), env }); const d = await r.json(); if (!r.ok) { searched.push(`AI: ${d.error || r.status}`); if (r.status >= 500) break; continue; }
      const m = String(d.text || '').match(/\[[\s\S]*\]/); const L = m ? JSON.parse(m[0]) : []; const nt = norm(t);
      for (const x of Array.isArray(L) ? L : []) { const name = String(x.name || '').trim(); if (name.length < 5 || name.split(/\s+/).length < 2) continue; const parts = norm(name).split(/[^a-z]+/).filter((w) => w.length > 2);
        if (!parts.length || parts.filter((w) => nt.includes(w)).length < Math.min(2, parts.length)) continue; // the page must really name them
        if (exclude.has(norm(name)) || people.some((y) => norm(y.name) === norm(name))) continue;
        const clean = (v, re) => { const s = String(v || '').trim(); return s && (!re || re.test(s)) && nt.includes(norm(s).slice(0, 8)) ? s.slice(0, 160) : ''; }; // contact details must be on the page too
        people.push({ name, title: String(x.title || '').slice(0, 20), role: String(x.role || '').slice(0, 120), hospital: String(x.hospital || '').slice(0, 120), city: String(x.city || '').slice(0, 60), email: clean(x.email, /@/), phone: clean(x.phone, /\d{6,}|\d[\d\s().-]{6,}/), whatsapp: clean(x.whatsapp, /\d{6,}|\d[\d\s().-]{6,}/), linkedin: /linkedin\.com\//.test(x.linkedin || '') ? x.linkedin : '', web: /^https?:\/\//.test(x.web || '') ? x.web : '', source: p.link, source_label: String(p.title || '').slice(0, 90), specialty: [sp.id || 'other'], iso }); }
    } catch (e) { searched.push(`page ${p.link}: ${e.message || e}`); }
    if (people.length >= 40) break; }
  return json({ people, searched, pages });
}
