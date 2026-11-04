import { quota } from '../_lib/quota.js';
import { webSearch } from '../_lib/search.js';
import { discover } from '../_lib/discover.js';
/**
 * Find a company's missing details on the internet (website only).
 *   GET /api/enrich?site=https://…&q=company+city+country
 * Reads the company website (home + contact / about pages) and, when a Brave Search key is set (BRAVE_API_KEY),
 * the top web results for the company. Returns what it found — emails, phones, WhatsApp, social links, address —
 * each with where it was seen. Nothing is saved here: the person chooses what to add.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=3600' } });
// a normal browser's headers: many company sites (and their firewalls) refuse anything that looks like a bot
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'en,es;q=0.8,pt;q=0.7,fr;q=0.6' };
const CHALLENGE = /just a moment|access denied|attention required|verify you are human|captcha|cloudflare ray id|enable javascript and cookies|ddos protection/i;
// what NetHunt holds is not always one clean address: “www.x.com, www.y.com”, “x.com/en ”, “http//x.com”, “https://x.com.”
export function cleanSite(v) { const s = String(v || '').trim().replace(/^(https?)\/\//i, '$1://').replace(/^(https?):\/(?!\/)/i, '$1://'); const m = s.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s,;|]*)?/i); if (!m) return ''; let u = m[0].replace(/[.,;:)]+$/, ''); if (!/^https?:\/\//i.test(u)) u = `https://${u}`; try { const x = new URL(u); return `${x.protocol}//${x.host.toLowerCase()}${x.pathname === '/' ? '/' : x.pathname}${x.search}`; } catch { return ''; } }
// why a page didn't open, in words a person can act on
const why = (e) => { const m = String((e && (e.message || e.name)) || e || ''); return /timeout|timed out|abort/i.test(m) ? 'it did not answer in time' : /dns|enotfound|getaddrinfo|resolve|name not/i.test(m) ? 'the address does not exist (domain not found)' : /certificate|ssl|tls|handshake/i.test(m) ? 'its security certificate is broken' : /refused|reset|econn|network|fetch failed|internal error/i.test(m) ? 'the server refused the connection' : m.slice(0, 80) || 'unknown error'; };
// a page that won't open directly is read through Firecrawl (FIRECRAWL_API_KEY) or Bright Data Web Unlocker (BRIGHTDATA_API_KEY + BRIGHTDATA_ZONE)
let ENV = {};
async function pageVia(url) { try { if (ENV.FIRECRAWL_API_KEY) { const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ENV.FIRECRAWL_API_KEY}` }, body: JSON.stringify({ url, formats: ['rawHtml'], onlyMainContent: false, timeout: 20000 }), signal: AbortSignal.timeout(25000) }); const d = await r.json().catch(() => ({})); const h = d.data && (d.data.rawHtml || d.data.html); if (h) return { url: (d.data.metadata && d.data.metadata.sourceURL) || url, html: String(h).slice(0, 600000), via: 'Firecrawl' }; } } catch { /* next */ }
  try { if (ENV.BRIGHTDATA_API_KEY && ENV.BRIGHTDATA_ZONE) { const r = await fetch('https://api.brightdata.com/request', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ENV.BRIGHTDATA_API_KEY}` }, body: JSON.stringify({ zone: ENV.BRIGHTDATA_ZONE, url, format: 'raw' }), signal: AbortSignal.timeout(25000) }); if (r.ok) { const h = await r.text(); if (/<html|<body|<div/i.test(h)) return { url, html: h.slice(0, 600000), via: 'Bright Data' }; } } } catch { /* none */ } return null; }
// open a page: the address as given, then https / http and with / without www (the home page only), then a reader service.
// Returns the page, or null — and the reason is kept in fails (the last one is shown to the person).
async function page(url, deep, fails) { const F = fails || []; const tries = [ url ];
  if (deep) { try { const u = new URL(url); const h = u.host; const alt = h.startsWith('www.') ? h.slice(4) : `www.${h}`; [ `https://${h}/`, `http://${h}/`, `https://${alt}/`, `http://${alt}/` ].forEach((x) => tries.includes(x) || tries.push(x)); } catch { /* bad address */ } }
  for (const t of tries.slice(0, 5)) { const p = await page0(t, F); if (p) return p; }
  if (!deep) return null; const v = await pageVia(url); if (v) return v; return null; }
async function page0(url, fails) { const F = fails || [];
  try { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    if (!r.ok) { F.push({ url, why: r.status === 403 || r.status === 401 || r.status === 429 ? `the site blocked automatic reading (HTTP ${r.status})` : r.status === 404 ? 'page not found (HTTP 404)' : r.status >= 500 ? `the site is down (HTTP ${r.status})` : `HTTP ${r.status}` }); return null; }
    const ct = r.headers.get('content-type') || ''; if (ct && !/html|xml|text\/plain/i.test(ct)) { F.push({ url, why: `not a web page (${ct.split(';')[0]})` }); return null; }
    const html = (await r.text()).slice(0, 600000); if (!/<(html|body|div|p|title|a)\b/i.test(html)) { F.push({ url, why: 'the page is empty' }); return null; }
    const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''); if (CHALLENGE.test(title) || (html.length < 6000 && CHALLENGE.test(html))) { F.push({ url, why: 'the site shows a robot check (captcha / “just a moment”)' }); return null; }
    return { url: r.url || url, html }; } catch (e) { F.push({ url, why: why(e) }); return null; } }
const BAD_MAIL = /\.(png|jpe?g|gif|svg|webp)$|example\.|sentry|wixpress|godaddy|domain\.com|email\.com|yourmail|@2x/i;
function extract(p, out) {
  const src = p.url; const html = p.html; const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const add = (kind, value, extra = {}) => { const v = String(value).trim(); if (!v) return; const k = `${kind}|${v.toLowerCase()}`; if (out.seen.has(k)) return; out.seen.add(k); out.items.push({ kind, value: v, source: src, ...extra }); };
  (html.match(/mailto:([^"'?>\s]+)/gi) || []).forEach((m) => add('email', decodeURIComponent(m.slice(7))));
  (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).forEach((m) => !BAD_MAIL.test(m) && add('email', m));
  (html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d{8,15})/gi) || []).forEach((m) => add('whatsapp', `+${m.match(/(\d{8,15})/)[1]}`));
  (html.match(/tel:([+\d][\d\s().-]{6,})/gi) || []).forEach((m) => add('phone', m.slice(4).replace(/\s+/g, ' ')));
  (text.match(/(?:\+|00)\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,5}\d{2,4}/g) || []).filter((m) => m.replace(/\D/g, '').length >= 9 && m.replace(/\D/g, '').length <= 15).forEach((m) => add('phone', m.trim()));
  [['linkedin', /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[^"'\s<>?#]+/gi], ['facebook', /https?:\/\/(?:www\.|m\.)?facebook\.com\/(?!sharer|plugins|tr\b|dialog)[^"'\s<>?#]+/gi], ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|explore)[^"'\s<>?#]+/gi]].forEach(([k, re]) => (html.match(re) || []).slice(0, 3).forEach((m) => add(k, m.replace(/\/$/, ''))));
  (html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []).forEach((b) => { try { const j = JSON.parse(b.replace(/<[^>]+>/g, '')); [].concat(j['@graph'] || j).forEach((o) => { if (!o) return; o.telephone && add('phone', o.telephone); o.email && add('email', String(o.email).replace(/^mailto:/, '')); const a = o.address; if (a && typeof a === 'object') add('address', [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry && (a.addressCountry.name || a.addressCountry)].filter(Boolean).join(', ')); }); } catch { /* not valid JSON */ } });
}
export async function onRequestGet({ request, env }) {
  { const q = await quota(request, env, 'enrich'); if (q) return q; }
  ENV = env; const u = new URL(request.url); let site = (u.searchParams.get('site') || '').trim(); const q = (u.searchParams.get('q') || '').trim().slice(0, 200); const name = (u.searchParams.get('name') || q.split(/\s{2,}/)[0] || '').trim();
  const out = { items: [], seen: new Set(), pages: [], searched: false };
  const given = site; site = cleanSite(site); out.given = given; // NetHunt's value, kept as it was — nothing here writes it
  // Richard's discovery (plain full-name search + quoted name & country, confirmed on the page, presence page, Instagram) when the country is known
  let disc = null; const ctry = u.searchParams.get('country'); const raw = (u.searchParams.get('raw') || name || '').trim();
  if (!/^https?:\/\//i.test(site) && ctry !== null && raw) {
    disc = await discover(env, raw, ctry); out.searched = true; out.via = disc.via; if (disc.error) out.searchError = disc.error;
    const add = (kind, value, source, extra = {}) => { const v = String(value || '').trim(); if (!v) return; const k = `${kind}|${v.toLowerCase()}`; if (out.seen.has(k)) return; out.seen.add(k); out.items.push({ kind, value: v, source, ...extra }); };
    if (disc.website) { site = disc.website; add('website', disc.website, disc.website_evidence || 'web search', { ownership: disc.website_ownership }); }
    ['linkedin', 'facebook', 'instagram'].forEach((k) => disc[k] && add(k, disc[k], 'web search'));
    if (disc.presence_url) { add('presence', disc.presence_url, disc.presence_kind); disc.presence_phone && add('phone', disc.presence_phone, disc.presence_url); disc.presence_email && add('email', disc.presence_email, disc.presence_url); }
    (disc.results || []).slice(0, 8).forEach((x) => out.items.push({ kind: 'result', value: x.title, url: x.link, snippet: String(x.snippet || '').slice(0, 220), source: x.link }));
  }
  if (/^https?:\/\//i.test(site)) {
    const fails = []; const home = await page(site, !0, fails);
    if (!home) { out.siteError = fails.length ? fails[0].why : 'it did not open'; out.siteTried = fails.map((f) => `${f.url} → ${f.why}`);
      // the website on file can't be read: look the company up by name (Richard's search) — reported as a suggestion, NetHunt is not changed
      if (!disc && raw && (env.SERPER_API_KEY || env.FIRECRAWL_API_KEY || (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE))) { const d2 = await discover(env, raw, ctry || '', { block: [ new URL(site).host.replace(/^www\./, '') ] }); out.searched = true; out.via = d2.via; if (d2.error) out.searchError = d2.error; out.fallback = 'name';
        const add = (kind, value, source, extra = {}) => { const v = String(value || '').trim(); if (!v) return; const k = `${kind}|${v.toLowerCase()}`; if (out.seen.has(k)) return; out.seen.add(k); out.items.push({ kind, value: v, source, ...extra }); };
        d2.website && add('website', d2.website, `found by name — the website on file didn’t open (${out.siteError})`, { ownership: d2.website_ownership }); [ 'linkedin', 'facebook', 'instagram' ].forEach((k) => d2[k] && add(k, d2[k], 'web search'));
        if (d2.presence_url) { add('presence', d2.presence_url, d2.presence_kind); d2.presence_phone && add('phone', d2.presence_phone, d2.presence_url); d2.presence_email && add('email', d2.presence_email, d2.presence_url); }
        if (d2.website) { const h2 = await page(d2.website, !0); if (h2) { out.pages.push(h2.url); extract(h2, out); } } disc = d2; } }
    if (home) { out.pages.push(home.url); extract(home, out);
      const base = new URL(home.url); const links = [...new Set((home.html.match(/href=["']([^"'#]+)["']/gi) || []).map((h) => h.slice(6, -1)).filter((h) => /contact|contacto|contato|kontakt|iletisim|about|nosotros|quienes|empresa|sucursal|ubicaci/i.test(h)).map((h) => { try { return new URL(h, base).href; } catch { return null; } }).filter((h) => h && new URL(h).host === base.host))].slice(0, 3);
      for (const l of links) { const p = await page(l); if (p) { out.pages.push(p.url); extract(p, out); } } }
  }
  if (!disc && q && (env.SERPER_API_KEY || env.FIRECRAWL_API_KEY || (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE))) { // (Bright Data search too — Richard's engine)
    out.searched = true;
    try { const sr = await webSearch(env, q, 8); out.via = sr.via; if (sr.error) out.searchError = sr.error; const j = { organic: sr.organic, knowledgeGraph: sr.kg };
      const kg = j.knowledgeGraph || {}; const at = kg.attributes || {}; const add = (kind, value, extra = {}) => { const v = String(value || '').trim(); if (!v) return; const k = `${kind}|${v.toLowerCase()}`; if (out.seen.has(k)) return; out.seen.add(k); out.items.push({ kind, value: v, source: 'Google', ...extra }); };
      if (kg.website) add('website', kg.website); const ph = kg.phoneNumber || at.Phone || at['Phone number'] || at.Teléfono; if (ph) add('phone', ph); const ad = kg.address || at.Address || at.Dirección; if (ad) add('address', ad);
      const org = (j.organic || []).slice(0, 8); const toks = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !/^(medical|medica|medicos|surgical|group|grupo|company|trading|import|international|ltda|sociedad)$/.test(w));
      org.forEach((x) => { out.items.push({ kind: 'result', value: x.title, url: x.link, snippet: String(x.snippet || '').slice(0, 220), source: x.link }); extract({ url: x.link, html: `${x.title} ${x.snippet || ''}` }, out); if (/linkedin\.com\/company/.test(x.link)) add('linkedin', x.link); if (/facebook\.com\//.test(x.link) && !/sharer/.test(x.link)) add('facebook', x.link); if (/instagram\.com\//.test(x.link)) add('instagram', x.link); });
      if (!site && !kg.website) { const hit = org.find((x) => { try { const h = new URL(x.link).host.replace(/^www\./, ''); return !/linkedin|facebook|instagram|youtube|twitter|x\.com|wikipedia|dnb\.com|zoominfo|bloomberg|opencorporates|empresite|infoempresa|panjiva|importgenius|volza|tradeatlas|mapquest|yelp|google|bing/.test(h) && toks.some((w) => h.includes(w)); } catch { return !1; } }); if (hit) add('website', `https://${new URL(hit.link).host}`); }
      const web = out.items.find((x) => x.kind === 'website'); if (web && !site) { const home = await page(web.value, !0); if (home) { out.pages.push(home.url); extract(home, out); const base = new URL(home.url); const links = [...new Set((home.html.match(/href=["']([^"'#]+)["']/gi) || []).map((h) => h.slice(6, -1)).filter((h) => /contact|contacto|contato|kontakt|iletisim|about|nosotros|quienes|empresa/i.test(h)).map((h) => { try { return new URL(h, base).href; } catch { return null; } }).filter((h) => h && new URL(h).host === base.host))].slice(0, 2); for (const l of links) { const p = await page(l); if (p) { out.pages.push(p.url); extract(p, out); } } } }
    } catch { /* search optional */ }
  }
  if (!disc && q && env.BRAVE_API_KEY && !env.SERPER_API_KEY && !env.FIRECRAWL_API_KEY) {
    out.searched = true;
    try { const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=6`, { headers: { 'X-Subscription-Token': env.BRAVE_API_KEY, accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
      if (r.ok) { const j = await r.json(); const res = ((j.web && j.web.results) || []).slice(0, 6);
        res.forEach((x) => { out.items.push({ kind: 'result', value: x.title, url: x.url, snippet: String(x.description || '').replace(/<[^>]+>/g, '').slice(0, 220), source: x.url }); const t = `${x.title} ${x.description || ''}`; extract({ url: x.url, html: t }, out); });
        for (const x of res.slice(0, 2)) { if (/facebook\.com|linkedin\.com|instagram\.com/.test(x.url)) continue; const p = await page(x.url); if (p) { out.pages.push(p.url); extract(p, out); } } } } catch { /* search optional */ }
  }
  return json({ items: out.items.slice(0, 60), pages: out.pages, site: site || '', site_error: out.siteError || '', site_tried: out.siteTried || [], fallback: out.fallback || '', searched: out.searched, search_ready: !!(env.BRAVE_API_KEY || env.SERPER_API_KEY || env.FIRECRAWL_API_KEY || (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE)), attempts: disc ? disc.attempts : [], ownership: disc ? disc.website_ownership : '', search_error: out.searchError || '', readers: [env.FIRECRAWL_API_KEY && 'Firecrawl', env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_ZONE && 'Bright Data'].filter(Boolean) });
}

// used by /api/research: read a company's site (home + contact/about/products pages) as plain text, with the page each part came from
export async function readSite(env, site, max = 4, linkRe = null) { // linkRe: which inner pages to read (default: products / about / contact)
  ENV = env; site = cleanSite(site); if (!site) return { pages: [], blocked: !1, reason: 'no usable website address' };
  const txt = (h) => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const fails = []; const home = await page(site, !0, fails); if (!home) return { pages: [], blocked: !0, reason: fails.length ? fails[0].why : 'it did not open', tried: fails.map((f) => `${f.url} → ${f.why}`) };
  const hu = home.url || site; const out = [{ url: hu, text: txt(home.html).slice(0, 6000) }]; const base = new URL(hu);
  const links = [...new Set((home.html.match(/href=["']([^"'#]+)["']/gi) || []).map((h) => h.slice(6, -1)).filter((h) => (linkRe || /product|producto|produto|catalog|cat[aá]logo|linea|l[ií]neas|marcas|brands|traumat|ortop|orthop|implant|about|nosotros|quienes|empresa|servicios|contact/i).test(h)).map((h) => { try { return new URL(h, base).href; } catch { return ''; } }).filter((h) => h && new URL(h).host === base.host))].slice(0, max - 1);
  for (const l of links) { const p = await page(l); if (p) out.push({ url: p.url || l, text: txt(p.html).slice(0, 4000) }); }
  return { pages: out, blocked: !1 };
}
