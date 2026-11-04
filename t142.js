// Medint × Richard (Nov 2026): Snov out of credits is recognised and skipped (Apollo and the website still run, no retries for 30 min);
// a website that won't open is tried as https / http / with or without www and the real reason is reported, then the company is looked up by name;
// no website → Richard's search by name first, then Apollo. Nothing real is called: every outside service is simulated here.
const P = require('path');
(async () => { const bad = []; const calls = []; let mode = {};
  const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
  const H = (html, s = 200, ct = 'text/html; charset=utf-8') => new Response(html, { status: s, headers: { 'content-type': ct } });
  const page = (title, body) => `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>${body}</p><p>${title} est une entreprise de distribution de dispositifs médicaux. Nous travaillons avec les hôpitaux publics et les cliniques privées depuis 1998, avec une équipe commerciale et un service après-vente.</p><a href="/contacto">Contacto</a></body></html>`;
  global.fetch = async (u, o = {}) => { u = String(u); calls.push(u);
    if (u.startsWith('https://google.serper.dev')) { const q = JSON.parse(o.body).q; (mode.searches = mode.searches || []).push(q); return J({ organic: (mode.serp || (() => []))(q) }); }
    if (u.startsWith('https://api.snov.io/v1/oauth')) return J({ access_token: 'tk', expires_in: 3600 });
    if (u.startsWith('https://api.snov.io/v2/')) { mode.snov = (mode.snov || 0) + 1; return mode.snovOk ? J({ task_hash: 'h1' }) : J({ success: false, message: 'You don’t have enough credits to perform this action' }, 402); }
    if (u.startsWith('https://api.apollo.io')) { mode.apollo = (mode.apollo || 0) + 1; return J(/mixed_companies/.test(u) ? { organizations: [] } : /people/.test(u) ? { people: [ { id: 'a1', first_name: 'Ana', last_name: 'Ruiz', title: 'Gerente' } ] } : { organization: { name: 'Biomed Tunis', website_url: 'http://biomedtunis.tn' } }); }
    const site = mode.sites || {}; const k = Object.keys(site).find((x) => u.startsWith(x)); if (k) { const v = site[k]; if (v instanceof Error) throw v; return typeof v === 'function' ? v(u) : v.clone(); }
    throw new TypeError('fetch failed: getaddrinfo ENOTFOUND'); };
  const EN = await import(P.join(__dirname, '../functions/api/enrich.js')); const LE = await import(P.join(__dirname, '../functions/api/leads.js')); const RS = await import(P.join(__dirname, '../functions/api/research.js'));
  const req = (url) => new Request(`https://m.local${url}`, { headers: { 'cf-access-authenticated-user-email': 'hi@kavikaplan.com' } });
  // ---- 2 · websites
  console.log('NetHunt values cleaned:', [ 'www.biomedtunis.tn, www.other.com', 'http//biomedtunis.tn/en ', 'https://Biomedtunis.TN.', 'not a site' ].map((v) => EN.cleanSite(v)).join(' | '));
  if (EN.cleanSite('www.biomedtunis.tn, www.other.com') !== 'https://www.biomedtunis.tn/' || EN.cleanSite('http//biomedtunis.tn/en ') !== 'http://biomedtunis.tn/en' || EN.cleanSite('not a site') !== '') bad.push('clean site');
  // only http works (https broken) → read
  mode = { sites: { 'https://biomedtunis.tn': new TypeError('fetch failed: SSL handshake failed'), 'https://www.biomedtunis.tn': new TypeError('fetch failed'), 'http://biomedtunis.tn': H(page('Biomed Tunis', 'Distributeur de implants orthopédiques en Tunisie')) } };
  const r1 = await EN.readSite({}, 'biomedtunis.tn'); console.log('https broken, http works → pages:', r1.pages.length, r1.pages[0] && r1.pages[0].url); if (!r1.pages.length) bad.push('http fallback');
  // blocked (403) everywhere → the reason says so
  mode = { sites: { 'https://': H('no', 403), 'http://': H('no', 403) } }; const r2 = await EN.readSite({}, 'https://blocked.tn'); console.log('403 → reason:', r2.reason, '| tried:', (r2.tried || []).length); if (!/blocked automatic reading \(HTTP 403\)/.test(r2.reason || '')) bad.push('403 reason');
  mode = { sites: { 'https://': H('<html><head><title>Just a moment...</title></head><body>cf</body></html>'), 'http://': H('<html><head><title>Just a moment...</title></head></html>') } }; const r3 = await EN.readSite({}, 'https://cf.tn'); console.log('robot check → reason:', r3.reason); if (!/robot check/.test(r3.reason || '')) bad.push('challenge reason');
  mode = { sites: {} }; const r4 = await EN.readSite({}, 'https://gone-domain.tn'); console.log('domain gone → reason:', r4.reason); if (!/does not exist/.test(r4.reason || '')) bad.push('dns reason');
  // enrich: the site on file is dead → reason + Richard's search by name finds the real one (suggested, NetHunt untouched)
  const serpBiomed = (q) => /biomed/i.test(q) && !/site:/.test(q) ? [ { title: 'Biomed Tunis — implants orthopédiques', link: 'https://biomedtunis.tn/', snippet: 'Biomed Tunis, distributeur à Tunis, Tunisie' } ] : [];
  mode = { serp: serpBiomed, sites: { 'https://old-biomed.tn': new TypeError('fetch failed: getaddrinfo ENOTFOUND'), 'http://old-biomed.tn': new TypeError('getaddrinfo ENOTFOUND'), 'https://www.old-biomed.tn': new TypeError('ENOTFOUND'), 'http://www.old-biomed.tn': new TypeError('ENOTFOUND'), 'https://biomedtunis.tn': H(page('Biomed Tunis', 'Tunisie · implants orthopédiques · +216 71 000 000')) } };
  const e1 = await (await EN.onRequestGet({ request: req('/api/enrich?site=old-biomed.tn&q=Biomed%20Tunis&raw=Biomed%20Tunis&country=Tunisia'), env: { SERPER_API_KEY: 'k' } })).json();
  const w1 = (e1.items || []).find((x) => x.kind === 'website'); console.log('dead site on file → error:', e1.site_error, '| fallback:', e1.fallback, '| found:', w1 && w1.value, '| source:', w1 && w1.source, '| pages read:', e1.pages.length);
  if (!/does not exist/.test(e1.site_error || '') || e1.fallback !== 'name' || !w1 || !/biomedtunis\.tn/.test(w1.value) || !/found by name/.test(w1.source) || !e1.pages.length) bad.push('enrich fallback');
  // enrich with NO website and only Bright Data search set (Richard's engine) → still searches by name
  mode = { serp: serpBiomed, sites: { 'https://biomedtunis.tn': H(page('Biomed Tunis', 'Tunisie · implants')) } };
  const brd = (q) => J({ organic: serpBiomed(q) }); const of = global.fetch; global.fetch = async (u, o = {}) => (String(u).startsWith('https://api.brightdata.com/request') ? brd(decodeURIComponent((String(JSON.parse(o.body).url).match(/q=([^&]+)/) || [])[1] || '').replace(/\+/g, ' ')) : of(u, o));
  const e2 = await (await EN.onRequestGet({ request: req('/api/enrich?site=&q=Biomed%20Tunis%20Tunis%20Tunisia&raw=Biomed%20Tunis&country=Tunisia'), env: { BRIGHTDATA_API_KEY: 'b', BRIGHTDATA_SERP_ZONE: 'serp' } })).json(); global.fetch = of;
  const w2 = (e2.items || []).find((x) => x.kind === 'website'); console.log('no website + Bright Data search only → searched:', e2.searched, '| found:', w2 && w2.value); if (!e2.searched || !w2) bad.push('no-website name search (bright data)');
  // research: the site on file won't open and nothing else is found by name → the real reason, not a rejection
  mode = { serp: () => [], sites: {} };
  const rr = await (await RS.onRequestGet({ request: req('/api/research?site=dead-site.tn&name=Ghost%20Medical&country=Tunisia'), env: { SERPER_API_KEY: 'k' } })).json();
  console.log('research, dead site:', rr.verdict, '|', rr.reason, '| searched by name:', (mode.searches || []).some((q) => /Ghost Medical/.test(q)));
  if (rr.verdict !== 'research_blocked' || !/didn’t open \(the address does not exist/.test(rr.reason || '') || !/not a rejection/.test(rr.reason || '') || !(mode.searches || []).some((q) => /Ghost Medical/.test(q))) bad.push('research dead site');
  // ---- 3 · leads with no website: search by name first, then Apollo
  mode = { serp: serpBiomed, snovOk: true, sites: { 'https://biomedtunis.tn': H(page('Biomed Tunis', 'Tunisie · implants orthopédiques')) } };
  const envL = { SERPER_API_KEY: 'k', APOLLO_API_KEY: 'a' };
  const l1 = await (await LE.onRequestGet({ request: req('/api/leads?domain=&name=Biomed%20Tunis&country=Tunisia'), env: envL })).json();
  console.log('leads, no website → domain:', l1.domain, '| from:', l1.domain_from, l1.domain_ownership, '| Apollo name search used:', calls.some((u) => /mixed_companies/.test(u))); if (l1.domain !== 'biomedtunis.tn' || l1.domain_from !== 'search' || calls.some((u) => /mixed_companies/.test(u))) bad.push('leads name search first');
  // ---- 1 · Snov out of credits
  mode = { snovOk: false, sites: {} }; const envS = { APOLLO_API_KEY: 'a', SNOV_CLIENT_ID: 's', SNOV_CLIENT_SECRET: 's' };
  const s1 = await (await LE.onRequestGet({ request: req('/api/leads?domain=biomedtunis.tn&name=Biomed&country=Tunisia'), env: envS })).json(); const n1 = mode.snov;
  console.log('Snov no credits → flag:', s1.snov, '| errors:', JSON.stringify(s1.errors), '| Apollo people still there:', (s1.people || []).length, '| Snov calls:', n1);
  if (s1.snov !== 'no_credits' || s1.errors.filter((e) => /Snov/.test(e)).length !== 1 || !/Snov credits are used up/.test(s1.errors.join(' ')) || !(s1.people || []).length) bad.push('snov credits classified');
  const s2 = await (await LE.onRequestGet({ request: req('/api/leads?domain=other.tn&name=Other&country=Tunisia'), env: envS })).json(); console.log('next lookup: Snov called again?', mode.snov > n1, '| flag:', s2.snov); if (mode.snov > n1 || s2.snov !== 'no_credits') bad.push('snov not retried');
  const v1 = await (await LE.onRequestPost({ request: new Request('https://m.local/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-access-authenticated-user-email': 'hi@kavikaplan.com' }, body: JSON.stringify({ action: 'verify', emails: [ 'a@biomedtunis.tn' ] }) }), env: envS })).json();
  console.log('email check → code:', v1.code, '|', v1.error); if (v1.code !== 'snov_credits') bad.push('verify credits');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
