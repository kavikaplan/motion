/**
 * Find a company's missing details on the internet (website only).
 *   GET /api/enrich?site=https://…&q=company+city+country
 * Reads the company website (home + contact / about pages) and, when a Brave Search key is set (BRAVE_API_KEY),
 * the top web results for the company. Returns what it found — emails, phones, WhatsApp, social links, address —
 * each with where it was seen. Nothing is saved here: the person chooses what to add.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=3600' } });
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; Medint/1.0)', accept: 'text/html,application/xhtml+xml' };
async function page(url) { try { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(8000) }); if (!r.ok || !/html/i.test(r.headers.get('content-type') || '')) return null; return { url: r.url, html: (await r.text()).slice(0, 600000) }; } catch { return null; } }
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
  const u = new URL(request.url); let site = (u.searchParams.get('site') || '').trim(); const q = (u.searchParams.get('q') || '').trim().slice(0, 200);
  const out = { items: [], seen: new Set(), pages: [], searched: false };
  if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
  if (/^https?:\/\//i.test(site)) {
    const home = await page(site);
    if (home) { out.pages.push(home.url); extract(home, out);
      const base = new URL(home.url); const links = [...new Set((home.html.match(/href=["']([^"'#]+)["']/gi) || []).map((h) => h.slice(6, -1)).filter((h) => /contact|contacto|contato|kontakt|iletisim|about|nosotros|quienes|empresa|sucursal|ubicaci/i.test(h)).map((h) => { try { return new URL(h, base).href; } catch { return null; } }).filter((h) => h && new URL(h).host === base.host))].slice(0, 3);
      for (const l of links) { const p = await page(l); if (p) { out.pages.push(p.url); extract(p, out); } } }
  }
  if (q && env.BRAVE_API_KEY) {
    out.searched = true;
    try { const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=6`, { headers: { 'X-Subscription-Token': env.BRAVE_API_KEY, accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
      if (r.ok) { const j = await r.json(); const res = ((j.web && j.web.results) || []).slice(0, 6);
        res.forEach((x) => { out.items.push({ kind: 'result', value: x.title, url: x.url, snippet: String(x.description || '').replace(/<[^>]+>/g, '').slice(0, 220), source: x.url }); const t = `${x.title} ${x.description || ''}`; extract({ url: x.url, html: t }, out); });
        for (const x of res.slice(0, 2)) { if (/facebook\.com|linkedin\.com|instagram\.com/.test(x.url)) continue; const p = await page(x.url); if (p) { out.pages.push(p.url); extract(p, out); } } } } catch { /* search optional */ }
  }
  return json({ items: out.items.slice(0, 60), pages: out.pages, searched: out.searched, search_ready: !!env.BRAVE_API_KEY });
}
