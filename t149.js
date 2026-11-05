// Power hour: (1) every company shows its own country however Power hour is opened (also from a Best partners row, region of several countries)
// (2) ‹ back at the top left (⚡ kept only as a hidden marker) · (3) at the end, the skipped companies come back on their own
// (4) 🟢 WhatsApp check: the open company's numbers go to /api/wacheck, the answer decides the WhatsApp button; not set up → a clear note · (5) the server side
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const wa = []; let waMode = 'ok';
  const h = run({ site: true, params: { view: 'country', iso: 'CL', isos: [ 'CL', 'PE', 'AR' ], tags: [ 'chile', 'peru', 'argentina' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } });
  { const W0 = h.w; const of = W0.fetch; const R0 = W0.Response || globalThis.Response;
    W0.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/wacheck')) { const b = JSON.parse(o.body); wa.push(b.numbers); if (waMode === 'off') return new R0(JSON.stringify({ results: {}, error: 'not set up', code: 'not_configured' }), { status: 501 }); const res = {}; b.numbers.forEach((n, k) => { res[n] = k % 2 === 0; }); return new R0(JSON.stringify({ results: res, checked: b.numbers.length, cached: 0 }), { status: 200 }); } return of(u, o); }; }
  await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X2 = W.__cm2x;
  const loaded = async () => { await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(150); };
  const ttl = () => D.getElementById('cm-sheet-title'); const who = () => ((D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent || '').trim();
  // (1) opened on a Peru company from its Best partners row (it may not be in the queue at all)
  const q = X2.powerQueue().list; const pe = C.rowsOf('partners').find((r) => /Per[uú]/.test((C.companyById(r.id) || {}).country || '') && !q.some((x) => x.id === r.id)) || C.rowsOf('partners').find((r) => /Per[uú]/.test((C.companyById(r.id) || {}).country || ''));
  console.log('a Peru company:', pe && pe.company, '| in the queue:', !!(pe && q.some((x) => x.id === pe.id)));
  const an = D.createElement('button'); D.body.append(an); X2.openPowerHour(an, pe.id); await loaded();
  const ctry = (ttl().querySelector('.cm-phctry') || {}).textContent || ''; console.log('title country:', ctry, '| company:', who()); if (!/Peru|Perú/.test(ctry)) bad.push('country from a row');
  C.closeSheet(); await wait(500);
  // (2) ‹ back at the top left
  D.querySelector('.cm-phbtn').click(); await loaded(); const first = who();
  console.log('first:', first, '| title starts with the ⚡ marker:', /^⚡/.test(ttl().textContent), '| ⚡ hidden:', !!ttl().querySelector('.cm-phk'), '| back on the first:', !!ttl().querySelector('.cm-phprev'));
  if (!/^⚡/.test(ttl().textContent) || !ttl().querySelector('.cm-phk') || ttl().querySelector('.cm-phprev')) bad.push('first title');
  let off = 0; const dn0 = W.Date.now.bind(W.Date); W.Date.now = () => dn0() + off; // each Skip a few seconds later (right after a Skip the button is ↶ Undo for 5 s)
  const skip = () => { off += 6000; C.sheetDraw(); return [ ...D.querySelectorAll('#cm-sheet button') ].find((b) => b.textContent.trim() === 'Skip'); };
  skip().click(); await loaded(); const second = who(); const pb = ttl().querySelector('.cm-phprev');
  console.log('after Skip:', second, '| ‹ at the top left:', pb && pb.textContent, '| first thing in the title:', pb && ttl().children[1] === pb);
  if (!pb || pb.textContent !== '‹' || second === first) bad.push('back button'); else { pb.click(); await loaded(); console.log('‹ back to:', who()); if (who() !== first) bad.push('back goes to previous'); }
  // (3) skip to the end → the skipped ones come back
  let n = 0; while (n < 80) { const s0 = skip(); if (!s0 || /Power hour · done/.test(ttl().textContent)) break; s0.click(); await loaded(); n++; if (ttl().querySelector('.cm-phagain')) break; }
  console.log('after skipping', n, '→ title:', ttl().textContent.replace(/\s+/g, ' ').slice(0, 90), '| company:', who());
  if (!ttl().querySelector('.cm-phagain') || !who()) bad.push('skipped come back');
  n = 0; while (n < 80) { const s0 = skip(); if (!s0 || /Power hour · done/.test(ttl().textContent)) break; s0.click(); await loaded(); n++; }
  console.log('skipped all again (nothing done) → done screen:', /Power hour · done/.test(ttl().textContent)); if (!/Power hour · done/.test(ttl().textContent)) bad.push('no endless loop');
  W.Date.now = dn0; C.closeSheet(); await wait(400);
  // (4) 🟢 WhatsApp check of the open company
  const asked = wa.flat(); console.log('numbers sent to the checker:', asked.length, asked.slice(0, 4).join(' '), '| answers kept:', C.waKnown.size);
  if (!asked.length || !C.waKnown.size) bad.push('auto check');
  const [ y, nn ] = [ ...C.waKnown.entries() ].reduce((a, [k, v]) => { a[v ? 0 : 1] = a[v ? 0 : 1] || k; return a; }, []);
  console.log('waOk — checked yes:', y && C.waOk(`+${y}`), '| checked no:', nn && C.waOk(`+${nn}`)); if ((y && !C.waOk(`+${y}`)) || (nn && C.waOk(`+${nn}`))) bad.push('answer decides');
  if (y) { const a0 = D.createElement('a'); a0.href = `https://wa.me/${y}`; a0.title = 'WhatsApp'; D.body.append(a0); await wait(1700); console.log('✓ dot on a checked WhatsApp button:', a0.classList.contains('cm-waok'), '|', a0.title); if (!a0.classList.contains('cm-waok')) bad.push('checked mark'); }
  C.waKnown.clear(); C.waKnown.set('56221234567', !0); console.log('a Chilean landline checked as WhatsApp:', C.waOk('+56 2 2123 4567')); if (!C.waOk('+56 2 2123 4567')) bad.push('checked beats the guess'); C.waKnown.clear();
  for (let k = 0; k < 30 && !D.querySelector('.cm-waall'); k++) { await wait(100); k % 5 === 4 && C.drawPartners && C.drawPartners(); } const b1 = D.querySelector('.cm-waall'); console.log('Best partners button:', b1 && b1.textContent, '|', b1 && b1.title.slice(0, 80)); if (!b1) bad.push('check all button');
  if (b1 && !b1.disabled) { const before = wa.length; b1.click(); await wait(400); await h.settle(); console.log('after 🟢 Check WhatsApp: calls', wa.length - before, '| button now:', (D.querySelector('.cm-waall') || {}).textContent, '| toast:', (D.getElementById('cm-toast') || {}).textContent); if (wa.length === before) bad.push('check all'); }
  waMode = 'off'; C.waKnown.clear(); const n2 = W.__cm3.waCheck([ '+56 9 8765 4321' ], !0); await wait(300); await h.settle(); W.__cm3.waCheck([ '+56 9 8765 4322' ], !0); await wait(100);
  const tw = (D.getElementById('cm-toast') || {}).textContent || ''; console.log('not set up →', tw.slice(0, 100)); if (!/APIFY_TOKEN/.test(tw)) bad.push('not set up note');
  bad.push(...h.errors.map((e) => 'err ' + String(e).slice(0, 160)));
  // (5) the server
  const M = await import('../functions/api/wacheck.js'); const ofG = globalThis.fetch; const sent = [];
  globalThis.fetch = async (u, o) => { sent.push([ String(u), JSON.parse(o.body) ]); return new Response(JSON.stringify(JSON.parse(o.body).phone_numbers.map((p) => ({ phone: p.replace('+', ''), hasWhatsapp: p.endsWith('1') }))), { status: 201 }); };
  const rows = new Map(); const db = { prepare: (sql) => ({ bind: (...a) => ({ all: async () => ({ results: a.filter((n) => rows.has(n)).map((n) => ({ num: n, ...rows.get(n) })) }), run: async () => { if (/INSERT/.test(sql)) rows.set(a[0], { has: a[1], at: a[2] }); } }), run: async () => ({}) }), batch: async (L) => { for (const x of L) await x.run(); } };
  const req = (nums) => new Request('https://m/api/wacheck', { method: 'POST', headers: { 'cf-access-authenticated-user-email': 'hi@kavikaplan.com' }, body: JSON.stringify({ numbers: nums }) });
  const r1 = await (await M.onRequestPost({ request: req([ '+56 9 1111 1111', '+56 9 2222 2220', '056 bad', '+56 9 1111 1111' ]), env: { APIFY_TOKEN: 't', MEDINT_DB: db } })).json();
  const r2 = await (await M.onRequestPost({ request: req([ '+56911111111', '+56922222220', '+5493333333331' ]), env: { APIFY_TOKEN: 't', MEDINT_DB: db } })).json();
  const r3 = await M.onRequestPost({ request: req([ '+56977777777' ]), env: { MEDINT_DB: db } });
  globalThis.fetch = ofG;
  console.log('server 1st:', JSON.stringify(r1), '| Apify got:', JSON.stringify(sent[0] && sent[0][1]), '| 2nd (2 remembered, 1 new):', JSON.stringify(r2), '| calls to Apify:', sent.length, sent[1] && JSON.stringify(sent[1][1]), '| no token:', r3.status);
  if (r1.results['56911111111'] !== true || r1.results['56922222220'] !== false || Object.keys(r1.results).length !== 2 || r2.cached !== 2 || r2.checked !== 1 || sent.length !== 2 || sent[1][1].phone_numbers.length !== 1 || !/apify\.com\/v2\/actors\/vtrdev~whatsapp-number-validator\/run-sync-get-dataset-items\?token=t/.test(sent[0][0]) || r3.status !== 501) bad.push('server');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
