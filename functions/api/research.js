import { quota } from '../_lib/quota.js';
import { readSite } from './enrich.js';
import { discover } from '../_lib/discover.js';
import { onRequestPost as ai } from './summarize.js';
import { webSearch } from '../_lib/search.js';
/**
 * Richard-style qualification of ONE company, with evidence.
 *   GET /api/research?site=&name=&country=&hint=
 * → { verdict: qualified | adjacent_supplier | not_a_fit | research_blocked | insufficient_evidence,
 *     role, segments: [], reason, quote, quote_url, pages: [urls], website, website_ownership,
 *     presence_url, presence_kind, presence_phone, presence_email, linkedin, facebook, instagram, attempts: [], round }
 * Website discovery follows Richard (see _lib/discover.js): the plain full-name search + the quoted name with the country,
 * every candidate confirmed on its own page, namesakes abroad rejected, then a presence page and Instagram.
 * A judgement made on somebody else's page is not a judgement on the company: that host is blocked and the search
 * runs once more (round 2) — never a third time. A company we could not read is research_blocked, never a rejection.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const V = ['qualified', 'adjacent_supplier', 'not_a_fit', 'research_blocked', 'insufficient_evidence'];
const host = (u) => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

// what we already know about the company (sent by Medint): our NetHunt notes and timeline, the 🧠 summary, imported lists, and the public
// tender awards and device registrations matched to its name in this country — read FIRST, as [page 1] “our records”
const OWN_URL = 'medint:records';
const withOwn = (pages, own) => (own ? [ { url: OWN_URL, text: own }, ...pages ] : pages);
async function judge(env, request, name, country, hint, pages0, source, own) {
  const pages = withOwn(pages0, own);
  const body = pages.map((p, i) => `[page ${i + 1}] ${p.url === OWN_URL ? 'OUR OWN RECORDS about this company (trusted: our CRM history and notes, public tender awards they won, devices registered to them)' : p.url}\n${p.text}`).join('\n\n').slice(0, 16000);
  const prompt = `You qualify B2B leads. We sell ORTHOPAEDIC IMPLANTS (trauma plates/screws/nails, spine, hip/knee/shoulder joint replacement, sports medicine) and want DISTRIBUTORS / IMPORTERS that sell to hospitals in ${country || 'their country'}.
Company: "${name}"${country ? ` in ${country}` : ''}. Other information (unverified, do not use as evidence): ${hint || 'none'}.
Below is ${own ? `[page 1] our own records about this company, then ${source}` : source}. Judge ONLY from it.${own ? `
OUR OWN RECORDS count as evidence (they are about this exact company): public tender awards for trauma / spine / joint / arthroscopy / bone graft / orthopaedic items, registrations of orthopaedic implants, or our notes and emails showing they sell or buy orthopaedic products ⇒ the company IS in orthopaedics. Then answer qualified (a distributor, importer, dealer or supplier that sells to hospitals) — NOT adjacent_supplier — even if their website also shows other fields, unless it is a manufacturer / a global manufacturer's own branch (adjacent_supplier) or a hospital / clinic (not_a_fit). A quote from our records is a valid quote (page 1).` : ''}
FIRST check identity: if this is clearly ANOTHER company (a different name, or the same name in another country), answer "wrong_company" — a page about somebody else says nothing about our company.
- qualified = a distributor, importer or dealer whose text shows orthopaedic / trauma / spine / joint / surgical-implant products or brands.
- adjacent_supplier = a medical distributor in another field (e.g. general hospital supplies, imaging, lab, dental), or an orthopaedic manufacturer/brand owner rather than a distributor — this includes a global manufacturer's own company in this country (Stryker, Zimmer Biomet, Johnson & Johnson / DePuy Synthes, Smith & Nephew, Medtronic, B. Braun / Aesculap, Arthrex, Globus, NuVasive, Enovis/DJO, MicroPort, Meril, Narang, GPC Medical, Auxein…): then role = "manufacturer_branch".
- not_a_fit = needs evidence of an excluded business: a hospital/clinic/care provider, a pharmacy, consumer retail, or not a medical business at all.
- insufficient_evidence = readable but does not say enough. Missing information is never a "no".
Rules learned from past mistakes (Lead research skill):
- A manufacturer's own sales company or subsidiary, a contract manufacturer or a coating / sterilisation service counts as a manufacturer (adjacent_supplier, role manufacturer or manufacturer_branch), never a distributor.
- Hospitals, clinic groups, doctors and surgeons are not_a_fit (role buyer). Pharmacies and consumer retail (braces, orthopaedic shoes sold to the public) are not_a_fit.
- A generic trading / import-export company with no medical product evidence is insufficient_evidence (role "trading company"), not qualified.
- A personal profile (a LinkedIn person, a doctor's page) is never proof of what the company sells.
- Captcha, login, "access denied" or cookie-wall text is not evidence: insufficient_evidence.
- An address or phone in another country than ${country || 'the declared one'} means another company: wrong_company.
Quote the exact words (max 25 words) that decide it and say which page. Also list brands they name (max 12). If it is not decided, say in "missing" what evidence would decide it.
Answer ONLY JSON: {"verdict":"qualified|adjacent_supplier|not_a_fit|insufficient_evidence|wrong_company","role":"distributor|manufacturer|manufacturer_branch|buyer|trading company|other","segments":["trauma","spine",...],"brands":["..."],"reason":"max 20 words","quote":"exact words","page":1,"missing":"max 20 words, or empty"}

${body}`;
  const r = await ai({ request: new Request('https://x/api/summarize', { method: 'POST', body: JSON.stringify({ prompt }) }), env }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'AI failed');
  const m = String(d.text || '').match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : {};
  const pg = pages[(Number(o.page) || 1) - 1] || pages[0]; let quote = String(o.quote || '').slice(0, 240);
  const found = quote && pg.text.toLowerCase().includes(quote.toLowerCase().slice(0, 30));
  let v = o.verdict === 'wrong_company' ? 'wrong_company' : V.includes(o.verdict) ? o.verdict : 'insufficient_evidence';
  if (quote && !found) quote = `${quote} (not found word-for-word on the page — check it)`;
  if ((v === 'qualified' || v === 'not_a_fit') && (!quote || !found)) v = 'insufficient_evidence'; // a yes or a firm no needs a real quote
  return { verdict: v, missing: v === 'qualified' || v === 'not_a_fit' ? '' : String(o.missing || '').slice(0, 200), role: o.role || '', segments: [].concat(o.segments || []).slice(0, 8), brands: [].concat(o.brands || []).map(String).slice(0, 12), reason: String(o.reason || '').slice(0, 200), quote, quote_url: pg.url };
}

// 🔬 deep check (Lead research skill, second pass): an unsure company gets one more look from OTHER sources — its LinkedIn / Facebook company page,
// catalogues, directories and registries — aimed at the one question still open. A firm “no” stands only when the identity is confirmed.
async function deepCheck(env, request, name, country, hint, missing, site, own) {
  const nm = String(name).replace(/\b(s\.?a\.?(s|c)?|s\.?r\.?l|ltda|llc|inc|ltd|gmbh|cia|e\.?i\.?r\.?l|s\.?a\.? de c\.?v)\.?$/i, '').trim();
  const qs = [ `"${nm}" ${country} linkedin`, `"${nm}" ${country} facebook`, `"${nm}" ${country} productos OR products OR catálogo OR catalog`, `"${nm}" ${country} distribuidor OR distributor OR importador OR importer` ];
  const key = (nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter((w) => w.length > 3)[0]) || nm.toLowerCase();
  const seen = new Set(); const hits = []; const tried = [];
  for (const q of qs) { const r = await webSearch(env, q, 6); tried.push(`${q} → ${(r.organic || []).length}${r.error ? ` (${r.error})` : ''}`);
    (r.organic || []).forEach((x) => { const t = `${x.title || ''} ${x.snippet || ''} ${x.link || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); if (!x.link || seen.has(x.link) || !t.includes(key)) return; seen.add(x.link); hits.push({ url: x.link, text: `${x.title || ''}\n${x.snippet || ''}` }); }); }
  if (!hits.length && own) { const j0 = await judge(env, request, name, country, hint, [], 'no other source (nothing about this company found in search)', own); return { ...j0, verdict: j0.verdict === 'wrong_company' ? 'insufficient_evidence' : j0.verdict, pages: [ OWN_URL ], attempts: tried, deep: !0, website: site || '' }; }
  if (!hits.length) return { verdict: 'insufficient_evidence', reason: 'deep check: no other source about this company found', missing, pages: [], attempts: tried, deep: !0 };
  const pages = hits.slice(0, 12);
  const j = await judge(env, request, name, country, `${hint || ''}${missing ? ` · still open: ${missing}` : ''}`, pages, `search results from other sources (LinkedIn / Facebook company pages, catalogues, directories, registries). Each [page] is one result's title and summary. Use only results clearly about this company in ${country || 'its country'}; resolve only what is still open: ${missing || 'what they sell and whether they distribute'}. A not_a_fit needs the identity confirmed`, own);
  return { ...j, verdict: j.verdict === 'wrong_company' ? 'insufficient_evidence' : j.verdict, pages: pages.map((p) => p.url), attempts: tried, deep: !0, website: site || '' };
}

// GET with the address, or POST with the same names in a JSON body (POST carries `own` — our own records, which can be long — and `ortho`)
export async function onRequestGet({ request, env }) { const u = new URL(request.url); return run(request, env, u.searchParams); }
export async function onRequestPost({ request, env }) { let b = {}; try { b = await request.json(); } catch { /* empty */ } return run(request, env, { get: (k) => (b[k] == null ? null : String(b[k])) }); }
// our records show ortho (an orthopaedic tender won, an orthopaedic device registered, our CRM says Ortho): the company is ortho — qualified,
// not “adjacent supplier” or “unsure” (a manufacturer / its own branch, a hospital or a firm “not a fit” keep their verdict)
function orthoWins(j, why) {
  if (!why || !j || !j.verdict || /^(qualified|not_a_fit|wrong_company)$/.test(j.verdict)) return j;
  if (j.verdict === 'adjacent_supplier' && /manufacturer/.test(j.role || '')) return j;
  return { ...j, verdict: 'qualified', role: j.role && !/manufacturer|buyer/.test(j.role) ? j.role : 'distributor', reason: `ortho in our records: ${why}${j.reason ? ` (from the website alone: ${j.reason})` : ''}`.slice(0, 260), quote: why.slice(0, 240), quote_url: OWN_URL, missing: '', ortho_from: 'records', first_verdict: j.verdict };
}
async function run(request, env, sp) {
  { const q = await quota(request, env, 'qualify'); if (q) return q; }
  const u = { searchParams: sp };
  const own = (sp.get('own') || '').slice(0, 6000); const orthoWhy = (sp.get('ortho') || '').slice(0, 300);
  const jsonV = (o, s) => json(o && o.verdict ? orthoWins(o, orthoWhy) : o, s);
  if (u.searchParams.get('deep') === '1') { const name = (u.searchParams.get('name') || '').trim().slice(0, 160); if (!name) return json({ error: 'name missing' }, 400);
    try { return jsonV(await deepCheck(env, request, name, (u.searchParams.get('country') || '').slice(0, 60), (u.searchParams.get('hint') || '').slice(0, 400), (u.searchParams.get('missing') || '').slice(0, 200), (u.searchParams.get('site') || '').slice(0, 200), own)); } catch (e) { return json({ error: `AI: ${e.message || e}` }); } } const given = (u.searchParams.get('site') || '').trim(); const name = (u.searchParams.get('name') || '').trim().slice(0, 160); const country = (u.searchParams.get('country') || '').trim().slice(0, 60); const hint = (u.searchParams.get('hint') || '').slice(0, 400);
  if (!name) return json({ error: 'name missing' }, 400);
  const block = []; let disc = null; let site = given; let last = null;
  for (let round = 1; round <= 2; round++) {
    if (!site) { disc = await discover(env, name, country, { block }); site = disc.website; }
    const D = disc || { attempts: [`website given: ${host(site)}`] }; const base = { website_ownership: disc ? disc.website_ownership : 'given', presence_url: D.presence_url || '', presence_kind: D.presence_kind || '', presence_phone: D.presence_phone || '', presence_email: D.presence_email || '', linkedin: D.linkedin || '', facebook: D.facebook || '', instagram: D.instagram || '', attempts: [...(last ? last.attempts : []), ...(D.attempts || [])], round, via: D.via || '' };
    try {
      if (site) { const rd = await readSite(env, site, 4);
        if (!rd.pages.length) { const bad = rd.reason || 'it did not open';
          // the website on file can't be read: once, look the company up by name (Richard's search) before giving up — the address on file is kept, nothing is overwritten
          if (!disc && round === 1 && name) { base.attempts.push(`website on file ${host(site)} did not open: ${bad}${rd.tried && rd.tried.length ? ` (tried ${rd.tried.length} addresses)` : ''} — searching by name`); block.push(host(site)); last = { ...base, siteError: bad, siteGiven: site }; site = ''; disc = null; continue; }
          return jsonV({ ...base, verdict: 'research_blocked', reason: `the website could not be opened — ${bad} (not a rejection)`, site_error: bad, website: site, pages: [] }); }
        const j = await judge(env, request, name, country, hint, rd.pages, 'the text of their website', own);
        if (j.verdict === 'wrong_company' && round === 1) { base.attempts.push(`round 1: ${host(site)} is another company (“${j.reason}”) — blocked, searching once more`); block.push(host(site)); last = base; site = ''; disc = null; continue; }
        if (j.verdict === 'wrong_company') return jsonV({ ...base, verdict: 'insufficient_evidence', reason: `${host(site)} is another company — needs a person to check`, website: '', pages: rd.pages.map((p) => p.url) });
        return jsonV({ ...base, ...j, ...(last && last.siteError ? { site_error: last.siteError, site_given: last.siteGiven, reason: `${j.reason} (found by name — the website on file didn’t open: ${last.siteError})` } : {}), website: rd.pages[0].url, pages: rd.pages.map((p) => p.url) }); }
      // no website: judge from the company's own LinkedIn / Facebook page as shown in search (Richard: the snippet stands in for a login wall)
      if (D.presence_url && /facebook|linkedin/.test(D.presence_kind)) { const r = (D.results || []).find((x) => x.link && x.link.startsWith(D.presence_url)) || {}; const t = `${r.title || ''}\n${r.snippet || ''}`.trim();
        if (t.length > 40) { const j = await judge(env, request, name, country, hint, [{ url: D.presence_url, text: t }], `what their own ${D.presence_kind} page shows in search (title and summary)`, own);
          if (j.verdict !== 'wrong_company') return jsonV({ ...base, ...j, reason: `${j.reason} (from their ${D.presence_kind} page — no website)`, website: '', pages: [D.presence_url] }); } }
      if (own.length > 60) { const j = await judge(env, request, name, country, hint, [], 'nothing from the web (no website of theirs could be found or read)', own);
        if (/^(qualified|adjacent_supplier|not_a_fit)$/.test(j.verdict)) return jsonV({ ...base, ...j, reason: `${j.reason} (from our records — no website read)`, website: '', pages: [ OWN_URL ] }); }
      return jsonV({ ...base, ...(last && last.siteError ? { site_error: last.siteError, site_given: last.siteGiven } : {}), verdict: 'research_blocked', reason: last && last.siteError ? `the website on file didn’t open (${last.siteError}) and no other website was found by name — not a rejection` : D.error ? D.error : D.presence_url ? `no website — ${D.presence_kind === 'listing' ? 'a listing names them with contact details' : `own ${D.presence_kind} page found`}` : 'no website or page of theirs found — not a rejection', website: '', pages: D.presence_url ? [D.presence_url] : [] });
    } catch (e) { return jsonV({ ...base, error: `AI: ${e.message || e}`, website: site }); }
  }
  return jsonV({ verdict: 'research_blocked', reason: 'nothing found', pages: [] });
}
