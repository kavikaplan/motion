// Bright Data only: Google search (SERP zone) + page reader (Web Unlocker) — parsing, one retry, clear errors · no Serper / Firecrawl / Brave left · the health page tests both zones
const P = require('path'); const fs = require('fs');
(async () => { const bad = []; const J = (o, s = 200) => new Response(typeof o === 'string' ? o : JSON.stringify(o), { status: s });
  const B = await import(P.join(__dirname, '../functions/_lib/brightdata.js')); const S = await import(P.join(__dirname, '../functions/_lib/search.js'));
  const env = { BRIGHTDATA_API_KEY: 'k', BRIGHTDATA_SERP_ZONE: 'serp_api1', BRIGHTDATA_ZONE: 'web_unlocker1' }; const calls = []; let plan = []; const of = global.fetch;
  global.fetch = async (u, o = {}) => { u = String(u); const b = o.body ? JSON.parse(o.body) : {}; calls.push({ u, zone: b.zone, url: b.url, auth: (o.headers || {}).authorization }); const f = plan.shift(); return f ? f(b) : J('{}', 500); };
  // 1. search: Bright Data's JSON → organic + knowledge panel
  plan = [ () => J({ organic: [ { title: 'Biomed', link: 'https://biomed.cl/', description: 'Distribuidor de implantes' }, { title: 'x' } ], knowledge: { name: 'Biomed SpA', website: 'https://biomed.cl' } }) ];
  const r1 = await S.webSearch(env, 'biomed chile', 5); const c1 = calls[0];
  console.log('search:', JSON.stringify(r1), '| zone', c1.zone, '| asks Google for JSON:', /google\.com\/search\?q=biomed%20chile.*brd_json=1/.test(c1.url), '| key sent:', c1.auth === 'Bearer k');
  if (r1.via !== 'Bright Data' || r1.organic.length !== 1 || r1.organic[0].snippet !== 'Distribuidor de implantes' || r1.kg.website !== 'https://biomed.cl' || c1.zone !== 'serp_api1' || c1.auth !== 'Bearer k') bad.push('search');
  // 2. a hiccup (502) is tried once more
  calls.length = 0; plan = [ () => J('bad gateway', 502), () => J({ organic: [ { title: 'A', link: 'https://a.cl' } ] }) ]; const r2 = await S.webSearch(env, 'a'); console.log('after one 502:', r2.organic.length, 'result ·', calls.length, 'calls'); if (r2.organic.length !== 1 || calls.length !== 2) bad.push('retry');
  // 3. clear errors — and no second try when it cannot help
  calls.length = 0; plan = [ () => J({ error: 'Invalid token' }, 401) ]; const r3 = await S.webSearch(env, 'a'); console.log('bad key:', r3.error, '·', calls.length, 'call'); if (!/API key/.test(r3.error) || calls.length !== 1) bad.push('401');
  plan = [ () => J({ error: 'Insufficient balance' }, 402) ]; const r4 = await S.webSearch(env, 'a'); console.log('no balance:', r4.error); if (!/no balance/.test(r4.error)) bad.push('402');
  plan = [ () => J('<html><body>google page</body></html>'), () => J('<html></html>') ]; const r5 = await S.webSearch(env, 'a'); console.log('wrong zone type:', r5.error); if (!/not results/.test(r5.error)) bad.push('html answer');
  const r6 = await S.webSearch({}, 'a'); console.log('not set up:', r6.error); if (!/BRIGHTDATA_SERP_ZONE/.test(r6.error)) bad.push('not set up');
  // 4. page reader: the Web Unlocker zone, robot checks are not pages
  calls.length = 0; plan = [ () => J('<html><head><title>Biomed</title></head><body><div>Contacto +56 2 2345 6789</div></body></html>') ]; const p1 = await B.bdPage(env, 'https://biomed.cl/'); console.log('page:', p1 && p1.via, '| zone', calls[0].zone); if (!p1 || calls[0].zone !== 'web_unlocker1') bad.push('page');
  const F = []; plan = [ () => J('<html><head><title>Just a moment...</title></head><body></body></html>') ]; const p2 = await B.bdPage(env, 'https://x.cl/', { fails: F }); console.log('robot check:', p2, F[0]); if (p2 || !/robot check/.test(F[0] || '')) bad.push('challenge');
  // 5. enrich: a site that blocks us is read through Bright Data (contact page too)
  const EN = await import(P.join(__dirname, '../functions/api/enrich.js'));
  global.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('https://api.brightdata.com/request')) { const b = JSON.parse(o.body); calls.push({ zone: b.zone, url: b.url }); return J(b.url.includes('contact') ? '<html><body><p>ventas@blocked.cl</p></body></html>' : '<html><head><title>Blocked SA</title></head><body><a href="/contacto">Contacto</a><p>info@blocked.cl +56 2 2222 3333</p></body></html>'); } return J('<html><head><title>Just a moment...</title></head></html>', 403); };
  calls.length = 0; const e = await (await EN.onRequestGet({ request: new Request('https://m/api/enrich?site=https://blocked.cl/&q=Blocked'), env: { BRIGHTDATA_API_KEY: 'k', BRIGHTDATA_ZONE: 'web_unlocker1' } })).json();
  const em = e.items.filter((x) => x.kind === 'email').map((x) => x.value); console.log('blocked site via Bright Data → emails:', em.join(', '), '| pages:', (e.pages || []).join(', '));
  if (!em.includes('info@blocked.cl') || !em.includes('ventas@blocked.cl')) bad.push('enrich via Bright Data');
  global.fetch = of;
  // 6. nothing else reads the web: no Serper / Firecrawl / Brave anywhere; health tests the two Bright Data zones
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? walk(P.join(d, x.name)) : /\.js$/.test(x.name) ? [ P.join(d, x.name) ] : []));
  const left = [ ...walk(P.join(__dirname, '../functions')), ...[ 'app.js', 'app2.js', 'app3.js' ].map((f) => P.join(__dirname, '../source', f)) ].filter((f) => /serper\.dev|firecrawl\.dev|search\.brave\.com|SERPER_API_KEY|FIRECRAWL_API_KEY|BRAVE_API_KEY/.test(fs.readFileSync(f, 'utf8')));
  console.log('files still using Serper / Firecrawl / Brave:', left.map((f) => P.basename(f)).join(', ') || 'none'); if (left.length) bad.push('leftovers');
  const H = await import(P.join(__dirname, '../functions/api/health.js')); global.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('https://api.brightdata.com/request')) { const b = JSON.parse(o.body); return b.zone === 'serp_api1' ? J({ organic: [ { title: 'a', link: 'https://a' }, { title: 'b', link: 'https://b' } ] }) : J('<html><body><div>ok</div></body></html>'); } return J('{}'); };
  const hj = await (await H.onRequestGet({ env })).json(); global.fetch = of; const rows = hj.checks.filter((c) => /Bright Data|Serper|Firecrawl|Brave/.test(c.name)); console.log('health:', rows.map((c) => `${c.name}: ${c.ok} ${c.note}`).join(' | '));
  if (rows.length !== 2 || rows.some((c) => !c.ok)) bad.push('health');
  const h0 = await (await H.onRequestGet({ env: {} })).json(); const miss = h0.checks.filter((c) => /Bright Data/.test(c.name)).map((c) => c.note); console.log('not set up:', miss.join(' | ')); if (!miss.every((n) => /BRIGHTDATA_/.test(n))) bad.push('health hint');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })().catch((e) => { console.log('errors 1', e.stack); process.exit(0); });
