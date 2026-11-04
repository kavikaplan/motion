// team access: a Person's companies come from the site's own list (data/assign_index.json) instead of thousands of full NetHunt records;
// an older answer is used at once and refreshed after; a company newer than the list is judged by its own fields; busy NetHunt → clear message
(async () => { const bad = []; const t0 = Date.now();
  const A = await import('../functions/_lib/access.js'); const N = await import('../functions/api/nethunt.js');
  const F = A.F; const calls = [];
  const R = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] });
  const people = [ { id: 'p1', fields: { Name: 'Yaman', Email: 'team@kavikaplan.com', Role: 'Person', Active: 'Active' } }, { id: 'p2', fields: { Name: 'Luz', Email: 'export@kavikaplan.com', Role: 'Person', Active: 'Active' } } ];
  const rules = [ { id: 'r1', createdAt: 1, fields: { Person: 'Luz', 'Rule type': 'Country', Active: 'Active', 'Country tags': 'peru\nchile' } }, { id: 'r2', createdAt: 2, fields: { Person: 'Yaman', 'Rule type': 'Country', Active: 'Active', 'Country tags': 'peru\nchile\niraq\niraq-erbil\njordan\nturkey' } } ];
  const nh = async (tool, args) => { calls.push([ tool, args.folderId, JSON.stringify(args.filter || {}) ]); if (args.folderId === F.PEOPLE) return R({ records: people }); if (args.folderId === F.ASSIGN) return R({ records: rules }); if (tool === 'get_record') return R(args.recordId === 'cNEW' ? { id: 'cNEW', fields: { Name: 'New Co', Country: [ 'Jordan' ] } } : { id: args.recordId, fields: { Name: 'X', Country: [ 'Peru' ] } }); if (args.folderId === F.COMPANIES) return R({ records: [] }); return R({}); };
  const snap = [ { id: 'cPE', c: 'peru' }, { id: 'cIQ', c: 'iraq-erbil' }, { id: 'cJO', c: 'jordan' }, { id: 'cTR', c: 'turkey' }, { id: 'cXX', c: 'mexico' } ];
  const kv = new Map(); const db = { prepare: (sql) => { const st = { args: [], bind: (...a) => { st.args = a; return st; }, run: async () => { if (/^INSERT INTO kv/.test(sql)) kv.set(st.args[0], { v: st.args[1], at: st.args[2] }); return {}; }, first: async () => (/SELECT v, at FROM kv/.test(sql) ? kv.get(st.args[0]) || null : null), all: async () => ({ results: [] }) }; return st; } };
  let assetHits = 0; const env = { MEDINT_DB: db, ASSETS: { fetch: async (req) => { assetHits++; return new Response(/assign_index\.json$/.test(new URL(req.url).pathname) ? JSON.stringify(snap) : 'nope', { status: /assign_index/.test(req.url) ? 200 : 404 }); } } };
  const bg = []; const opt = { origin: 'https://medint.kavikaplan.com', waitUntil: (p) => bg.push(p) };
  const yam = await A.allowedSet((n, a) => nh(n, a), 'Yaman', env, opt);
  const coCalls = calls.filter((c) => c[1] === F.COMPANIES).length;
  console.log('Yaman sees:', [ ...yam ].sort().join(' '), '| NetHunt company reads for it:', coCalls, '| list read:', assetHits);
  if (yam.has('cPE') || !yam.has('cIQ') || !yam.has('cJO') || !yam.has('cTR') || yam.has('cXX') || coCalls !== 0 || assetHits !== 1) bad.push('allowed set from the list');
  const luz = await A.allowedSet((n, a) => nh(n, a), 'Luz', env, opt); console.log('Luz sees:', [ ...luz ].join(' ')); if (!luz.has('cPE') || luz.size !== 1) bad.push('older rule wins');
  // an older saved answer (D1) is used at once; a fresh one is made after the answer
  kv.set('allow:cihangir', { v: JSON.stringify([ 'cOLD' ]), at: Date.now() - 60 * 60e3 }); rules.push({ id: 'r3', createdAt: 3, fields: { Person: 'Cihangir', 'Rule type': 'Country', Active: 'Active', 'Country tags': 'turkey' } }); A.clearAccessCache(null);
  const nBg = bg.length; const ci = await A.allowedSet((n, a) => nh(n, a), 'Cihangir', env, opt); console.log('older answer at once:', [ ...ci ].join(' '), '| refresh started after:', bg.length - nBg);
  await Promise.all(bg); const fresh = JSON.parse((kv.get('allow:cihangir') || {}).v || '[]'); console.log('refreshed to:', fresh.join(' '));
  if (!ci.has('cOLD') || bg.length - nBg !== 1) bad.push('stale while refresh'); // (Cihangir's own country rule is newer than Yaman's for Türkiye → Yaman keeps it, so the refreshed list is empty)
  // the NetHunt function for a Person
  A.clearAccessCache(null); const req = (body) => new Request('https://medint.kavikaplan.com/api/nethunt', { method: 'POST', headers: { 'cf-access-authenticated-user-email': 'team@kavikaplan.com', 'content-type': 'application/json', origin: 'https://medint.kavikaplan.com' }, body: JSON.stringify(body) });
  const ofG = globalThis.fetch; let sid = 0;
  globalThis.fetch = async (u, o) => { const b = JSON.parse(o.body); if (b.method === 'initialize') return new Response(JSON.stringify({ jsonrpc: '2.0', id: b.id, result: { protocolVersion: '2025-03-26' } }), { headers: { 'content-type': 'application/json', 'mcp-session-id': `s${++sid}` } }); if (!b.id) return new Response('', { status: 202 });
    const { name, arguments: a } = b.params; let out;
    if (name === 'filter_records' && a.folderId === F.COMPANIES) out = R({ records: [ { id: 'cIQ', fields: { Name: 'Iraq Co', Country: [ 'Iraq-Erbil' ] } }, { id: 'cNEW2', fields: { Name: 'Brand new', Country: [ 'Jordan' ] } }, { id: 'cPE', fields: { Name: 'Peru Co', Country: [ 'Peru' ] } }, { id: 'cMOVED', fields: { Name: 'Moved to Mexico', Country: [ 'Mexico' ] } } ] });
    else out = await nh(name, a);
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: b.id, result: out }), { headers: { 'content-type': 'application/json' } }); };
  const env2 = { ...env, NETHUNT_MCP_URL: 'https://nh.example/mcp' };
  const r1 = await N.onRequestPost({ request: req({ tool: 'filter_records', args: { folderId: F.COMPANIES, fieldKeys: 'label', filter: {} } }), env: env2, waitUntil: () => {} }); const j1 = await r1.json(); const got = JSON.parse(j1.content[0].text).records.map((x) => x.id);
  console.log('a country list as Yaman:', r1.status, got.join(' ')); if (r1.status !== 200 || got.join() !== 'cIQ,cNEW2') bad.push('live records judged by their own fields');
  const r2 = await N.onRequestPost({ request: req({ tool: 'get_record', args: { folderId: F.COMPANIES, recordId: 'cNEW', fieldKeys: 'label' } }), env: env2, waitUntil: () => {} }); console.log('a company newer than the list (Jordan):', r2.status); if (r2.status !== 200) bad.push('new company opens');
  const r3 = await N.onRequestPost({ request: req({ tool: 'get_record', args: { folderId: F.COMPANIES, recordId: 'cPE', fieldKeys: 'label' } }), env: env2, waitUntil: () => {} }); console.log('Luz’s Peru company as Yaman:', r3.status); if (r3.status !== 403) bad.push('still private');
  globalThis.fetch = ofG;
  // the built list
  const ai = require('../public/data/assign_index.json'); console.log('data/assign_index.json:', ai.length, 'companies, e.g.', JSON.stringify(ai[0])); if (ai.length < 1000 || !ai[0].id || typeof ai[0].c !== 'string') bad.push('built list');
  console.log(`errors ${bad.length}`, bad.join(', '), `(${Date.now() - t0} ms)`); process.exit(0); })().catch((e) => { console.log('errors 1', e.stack); process.exit(0); });
