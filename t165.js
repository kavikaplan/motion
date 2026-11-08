// 🔴 countries where Next has a distributor: the 8 from the NetHunt NEXT filter are in (42 in all) · House adds / removes countries
// (✎ next to “🔴 Next countries”) and saves one list for the whole team (/api/prefs team/next-dist — everyone reads, only House writes)
const P = require('path'); const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  // server: team/ paths are one copy for everyone; only House writes
  const { DatabaseSync } = require('node:sqlite'); const sq = new DatabaseSync(':memory:');
  const stm = (sql) => { const st = { a: [], bind: (...x) => { st.a = x; return st; }, run: async () => { sq.prepare(sql).run(...st.a); return {}; }, first: async () => sq.prepare(sql).get(...st.a) || null }; return st; };
  const env = { MEDINT_DB: { prepare: stm } }; const PR = await import(P.join(__dirname, '../functions/api/prefs.js'));
  const req = (who, method, body) => new Request('https://m/api/prefs?path=team/next-dist', { method, headers: { 'cf-access-authenticated-user-email': who, 'content-type': 'application/json' }, body });
  const r1 = await PR.onRequestPut({ request: req('yaman@kavikaplan.com', 'PUT', JSON.stringify({ isos: [ 'XX' ] })), env }); const r2 = await PR.onRequestPut({ request: req('hi@kavikaplan.com', 'PUT', JSON.stringify({ isos: [ 'CL', 'TR' ], info: { CL: 'Grupo X' } })), env });
  const g = await (await PR.onRequestGet({ request: req('yaman@kavikaplan.com', 'GET'), env })).json(); console.log('person writes:', r1.status, '| House writes:', r2.status, '| a person reads:', JSON.stringify(g.data));
  if (r1.status !== 403 || r2.status !== 200 || !g.exists || g.data.isos.join() !== 'CL,TR') bad.push('server');
  const own = await (await PR.onRequestGet({ request: new Request('https://m/api/prefs?path=me/prefs', { headers: { 'cf-access-authenticated-user-email': 'yaman@kavikaplan.com' } }), env })).json(); if (own.exists) bad.push('own prefs untouched');
  // page
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all', psort: 'status' } });
  const saved = []; { const W0 = h.w; const of = W0.fetch; const R0 = W0.Response || globalThis.Response; W0.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/prefs?path=team/next-dist')) { if (o.method === 'PUT') { saved.push(JSON.parse(o.body)); return new R0('{"ok":true}', { status: 200 }); } return new R0('{"exists":false}', { status: 200 }); } return of(u, o); }; }
  await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d; const N = W.__cm2.nextDist();
  const eight = [ 'BI', 'TR', 'US', 'BG', 'EC', 'VE', 'CL', 'VN' ], nine = [ 'CN', 'YE', 'MD', 'ID', 'PR', 'NI', 'UA', 'MU', 'PT' ]; console.log('built-in list:', N.size, 'countries · the 8 in:', eight.every((i) => N.has(i)), '· the 9 kept:', nine.every((i) => N.has(i)));
  if (N.size !== 42 || !eight.every((i) => N.has(i)) || !nine.every((i) => N.has(i))) bad.push('list');
  const ed = D.querySelector('.cm-nextedit'); if (!ed) { bad.push('✎'); } else { ed.click(); await wait(200);
    const S = D.getElementById('cm-sheet'); console.log('editor:', D.getElementById('cm-sheet-title').textContent, '|', S.querySelectorAll('.cm-ndrow').length, 'rows');
    const rowOf = (txt) => [ ...S.querySelectorAll('.cm-ndrow') ].find((r) => r.querySelector('b').textContent.includes(txt));
    const pt = rowOf('Portugal'); pt && pt.querySelector('button').click(); const cl = rowOf('Chile'); if (cl) { const i = cl.querySelector('input'); i.value = 'Grupo Chile · exclusive'; i.dispatchEvent(new W.Event('input')); }
    const sel = S.querySelector('.cm-ndsel'); const opt = [ ...sel.options ].find((o) => o.value && o.value !== ''); sel.value = opt.value; S.querySelector('.cm-ndadd input').value = 'New Dist'; [ ...S.querySelectorAll('.cm-ndadd button') ][0].click(); await wait(200);
    const S2 = D.getElementById('cm-sheet'); [ ...S2.querySelectorAll('button') ].find((b) => /Save for the team/.test(b.textContent)).click(); await wait(400); await h.settle();
    const d = saved[0] || {}; console.log('saved:', (d.isos || []).length, 'countries · Portugal out:', !(d.isos || []).includes('PT'), `· ${opt.text} in:`, (d.isos || []).includes(opt.value), '· Chile:', (d.info || {}).CL);
    if (!d.isos || d.isos.length !== 42 || d.isos.includes('PT') || !d.isos.includes(opt.value) || d.info.CL !== 'Grupo Chile · exclusive' || d.info[opt.value] !== 'New Dist') bad.push('save');
    const N2 = W.__cm2.nextDist(); console.log('in use now:', N2.size, '· Portugal hidden for Next:', N2.has('PT')); if (N2.has('PT') || !N2.has(opt.value)) bad.push('used at once'); }
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
