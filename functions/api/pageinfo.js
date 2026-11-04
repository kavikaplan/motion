import { quota } from '../_lib/quota.js';
/**
 * Read one web page for Medint's 📌 country notes & sources.
 *   GET /api/pageinfo?url=https://…
 * → { url, title, description, lang, text }  (text = the readable page text, max ~9,000 characters)
 * Nothing is saved here: Medint asks the AI to sort and summarise it, then saves the note on the country's NetHunt record.
 * A page that won't open directly is read through Firecrawl (FIRECRAWL_API_KEY) or Bright Data (BRIGHTDATA_API_KEY + BRIGHTDATA_ZONE) when set.
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=3600' } });
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; Medint/1.0)', accept: 'text/html,application/xhtml+xml', 'accept-language': 'en,es;q=0.8,pt;q=0.6,tr;q=0.5' };
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1|\[?f[cd])/i;
const ent = (s) => String(s || '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
async function direct(url) { try { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(9000) }); if (!r.ok || !/html|text/i.test(r.headers.get('content-type') || '')) return null; return { url: r.url || url, html: (await r.text()).slice(0, 800000) }; } catch { return null; } }
async function via(env, url) {
  try { if (env.FIRECRAWL_API_KEY) { const r = await fetch('https://api.firecrawl.dev/v1/scrape', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.FIRECRAWL_API_KEY}` }, body: JSON.stringify({ url, formats: ['rawHtml'], onlyMainContent: false, timeout: 20000 }), signal: AbortSignal.timeout(25000) }); const d = await r.json().catch(() => ({})); const h = d.data && (d.data.rawHtml || d.data.html); if (h) return { url, html: String(h).slice(0, 800000), via: 'Firecrawl' }; } } catch { /* next */ }
  try { if (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_ZONE) { const r = await fetch('https://api.brightdata.com/request', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.BRIGHTDATA_API_KEY}` }, body: JSON.stringify({ zone: env.BRIGHTDATA_ZONE, url, format: 'raw' }), signal: AbortSignal.timeout(25000) }); if (r.ok) { const h = await r.text(); if (/<html|<body|<div/i.test(h)) return { url, html: h.slice(0, 800000), via: 'Bright Data' }; } } } catch { /* none */ }
  return null; }
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url); let url = (u.searchParams.get('url') || '').trim();
  if (!url) return json({ error: 'Add ?url=' }, 400);
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let host = ''; try { host = new URL(url).hostname; } catch { return json({ error: 'Not a web address' }, 400); }
  if (PRIVATE.test(host)) return json({ error: 'Not a public web address' }, 400);
  { const q = await quota(request, env, 'enrich'); if (q) return q; }
  const p = (await direct(url)) || (await via(env, url));
  if (!p) return json({ url, title: '', description: '', text: '', error: 'The page did not open (it may block robots or need a login) — the note is saved with the link and what you wrote.' });
  const h = p.html; const meta = (n) => ent(((h.match(new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]*content=["']([^"']*)`, 'i')) || h.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${n}["']`, 'i')) || [])[1]) || '').trim();
  const title = ent((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || meta('og:title')).replace(/\s+/g, ' ').trim().slice(0, 200);
  const text = ent(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<(br|p|div|li|h\d|tr)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim().slice(0, 9000);
  return json({ url: p.url || url, title, description: (meta('description') || meta('og:description')).slice(0, 400), lang: ((h.match(/<html[^>]+lang=["']([a-z-]+)/i) || [])[1] || '').slice(0, 10), text, via: p.via || '' });
}
