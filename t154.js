// ⚡ Qualify & enrich reads what we already have first: NetHunt notes / timeline / 🧠 summary, imported lists, tenders they won and devices
// registered to them. Anything orthopaedic there → qualified (ortho), not “adjacent supplier” · a manufacturer's branch keeps its verdict
(async () => { const P = require('path'); const bad = [];
  const RS = await import(P.join(__dirname, '../functions/api/research.js'));
  const pad = ' lorem ipsum '.repeat(30); let ANS = {}; let asked = '';
  global.fetch = async (url, o = {}) => { url = String(url); if (url.includes('api.brightdata.com/request')) return new Response(JSON.stringify({ organic: [] }), { status: 200 });
    if (url.includes('anthropic')) { asked = JSON.stringify(JSON.parse(o.body)); return new Response(JSON.stringify({ content: [ { type: 'text', text: JSON.stringify(ANS) } ] }), { status: 200 }); }
    const h = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, ''); return h === 'labmed.co' ? new Response(`<title>Labmed</title><body>Labmed Bogotá Colombia — equipos de laboratorio y diagnóstico ${pad}</body>`, { status: 200, headers: { 'content-type': 'text/html' } }) : new Response('no', { status: 404 }); };
  const env = { BRIGHTDATA_API_KEY: 'b', BRIGHTDATA_SERP_ZONE: 'serp', ANTHROPIC_API_KEY: 'k' };
  const own = 'Public tender awards they won: 13 award(s) in 2021, 2023 — field: Trauma Fixation; Spine\nDevice registered to them: Locking plate (Osteosynthesis) made by Hofer';
  const post = async (b) => (await RS.onRequestPost({ request: new Request('https://m/api/research', { method: 'POST', body: JSON.stringify(b) }), env })).json();
  // 1 · the website only shows lab equipment → the AI says adjacent; our records say ortho tenders → qualified, quoted from our records
  ANS = { verdict: 'adjacent_supplier', role: 'distributor', reason: 'lab and diagnostics distributor', quote: 'equipos de laboratorio y diagnóstico', page: 2 };
  let j = await post({ site: 'labmed.co', name: 'LABMED SAS', country: 'Colombia', own, ortho: 'they won public tenders for Trauma Fixation (2021, 2023)' });
  console.log('1 · website lab, records ortho →', j.verdict, '|', j.reason, '|', j.quote_url); if (j.verdict !== 'qualified' || j.quote_url !== 'medint:records' || !/Trauma/.test(j.quote) || j.first_verdict !== 'adjacent_supplier') bad.push('ortho records win');
  console.log('  the AI was given our records first:', /OUR OWN RECORDS/.test(asked) && /Trauma Fixation/.test(asked) && asked.indexOf('Trauma Fixation') < asked.indexOf('laboratorio')); if (!/OUR OWN RECORDS/.test(asked) || asked.indexOf('Trauma Fixation') > asked.indexOf('laboratorio')) bad.push('records sent first');
  // 2 · a manufacturer's own branch with ortho tenders stays adjacent (manufacturer_branch)
  ANS = { verdict: 'adjacent_supplier', role: 'manufacturer_branch', reason: 'Stryker’s own company', quote: 'Labmed', page: 2 };
  j = await post({ site: 'labmed.co', name: 'LABMED SAS', country: 'Colombia', own, ortho: 'they won public tenders for Trauma Fixation' }); console.log('2 · manufacturer branch →', j.verdict, j.role); if (j.verdict !== 'adjacent_supplier') bad.push('branch kept');
  // 3 · no website anywhere: judged from our records (instead of “research blocked”)
  ANS = { verdict: 'qualified', role: 'distributor', reason: 'wins trauma tenders', quote: 'Trauma Fixation; Spine', page: 1 };
  j = await post({ site: '', name: 'GHOST ORTO LTDA', country: 'Colombia', own }); console.log('3 · no website, our records →', j.verdict, '|', j.reason); if (j.verdict !== 'qualified' || !/our records/.test(j.reason)) bad.push('records without website');
  // 4 · no records → as before (the website decides; not ortho)
  ANS = { verdict: 'adjacent_supplier', role: 'distributor', reason: 'lab distributor', quote: 'equipos de laboratorio y diagnóstico', page: 1 };
  j = await post({ site: 'labmed.co', name: 'LABMED SAS', country: 'Colombia' }); console.log('4 · no records →', j.verdict, '| records in the question:', /OUR OWN RECORDS/.test(asked)); if (j.verdict !== 'adjacent_supplier' || /OUR OWN RECORDS/.test(asked)) bad.push('no records unchanged');
  // 5 · the page: what Medint collects (tenders, registrations, NetHunt) for a lead
  const { run } = require('./harness'); const h = run({ site: true, params: { view: 'country', iso: 'CO', tags: [ 'colombia' ], ctab: 'companies' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle();
  const W = h.w; const C = W.__cm; W.dash.data('tender_awards'); W.dash.data('registrations'); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); await h.settle();
  const t = C.rowsOf('tender_awards').find((x) => x.country_iso === 'CO' && /trauma|spine|ortho/i.test(x.niche || '')) || C.rowsOf('tender_awards').find((x) => /^ORT/.test(x.niche_code || ''));
  const iso = t ? t.country_iso : 'CO'; const e = { key: `t|${t ? t.company : 'x'}`, name: t ? t.company : 'x' };
  let sent = null; const of = W.fetch; W.fetch = async (u, o = {}) => { if (String(u) === '/api/research') { sent = JSON.parse(o.body); return new Response(JSON.stringify({ verdict: 'qualified', reason: 'x' }), { status: 200 }); } return of(u, o); };
  await W.__cm3.leadResearch(e, iso).catch((er) => bad.push('page ' + er.message)); W.fetch = of;
  console.log('5 · a tender winner in', iso, '(', e.name, ') — sent as POST with our records:', !!sent, '| ortho:', sent && sent.ortho, '| records:', sent && String(sent.own).slice(0, 140));
  if (!sent || !sent.own || !/tender/i.test(sent.own) || !sent.ortho) bad.push('page sends records');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })().catch((e) => { console.log('errors 1', e.stack); process.exit(0); });
