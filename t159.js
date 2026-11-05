// 🧠 Lead research skill round trip: Claude pushes the qualified to NetHunt, Medint takes every result back — matched by the exported
// file's Row ID (“file#line”, merged duplicates “a#3+a#4”) even when Claude cleaned the name · nethunt_writes.csv → in NetHunt now
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w; const X = W.__cm3; const bad = [];
  W.URL.createObjectURL = () => 'blob:x'; W.URL.revokeObjectURL = () => {};
  const L = (W.cmLeadsFor('CO', true) || []).slice(0, 4); console.log('leads:', L.map((e) => e.name).join(' | '));
  const x = X.skExport(L.map((e) => ({ e, iso: 'CO' }))); const stem = x.file.replace(/\.csv$/, ''); const man = X.SKX.get(stem); console.log('exported:', x.file, '| remembered keys:', man && man.keys.length);
  if (!man || man.keys.length !== 4 || man.keys[0][0] !== L[0].key) bad.push('manifest');
  const x2 = X.skExport(L.slice(0, 1).map((e) => ({ e, iso: 'CO' }))); console.log('second export the same day gets its own name:', x2.file); if (x2.file === x.file) bad.push('unique name');
  const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const H = [ 'Company', 'Input name', 'Country', 'Outcome', 'Label', 'Reason', 'Research category', 'Website', 'Email', 'Phone', 'Evidence', 'Evidence URL', 'Delivery readiness', 'Delivery blockers', 'Brand represented', 'Products', 'Gate', 'CRM screen', 'Row ID' ];
  const out = csv([ H,
    [ 'Acme Ortho SAS', 'ACME ORTHO S.A.S. (renamed by Claude)', 'Colombia', 'qualified_contactable', 'Qualified — contactable', 'Distributes trauma implants', 'qualified', 'https://acme.co', 'info@acme.co', '', 'Distribuidor de implantes', 'https://acme.co', 'ready', '', '', '', '', 'new', `${stem}#2` ],
    [ 'Twin Medical', 'Twin Medical', 'Colombia', 'not_suitable', 'NON ICP', 'Dental only', 'not_a_fit', '', '', '', 'dental', '', '', '', '', '', '', 'new', `${stem}#3+${stem}#4` ] ]);
  const writes = csv([ [ 'time', 'batch', 'kind', 'name', 'outcome', 'record_id', 'detail' ], [ '2026-11-05', 'B2026-11-05-a', 'company', 'Acme Ortho SAS', 'created', '69aa00000000000000000001', '' ], [ '2026-11-05', 'B2026-11-05-a', 'contact', 'Juan', 'created', '69aa00000000000000000002', '' ] ]);
  const f = (name, text) => ({ name, text: async () => text });
  const r = await X.skImport([ f('company_outcomes.csv', out), f('nethunt_writes.csv', writes) ]); console.log('import:', JSON.stringify(r));
  const g = (e) => X.RQ.get(e.key) || {};
  console.log('row 1 (renamed by Claude) →', g(L[0]).verdict, '| in NetHunt:', g(L[0]).added, g(L[0]).addedBy, '| merged rows →', g(L[1]).verdict, g(L[2]).verdict, '| untouched:', g(L[3]).verdict || '—');
  if (!r || r.matched !== 3 || r.missing.length || g(L[0]).verdict !== 'qualified' || g(L[0]).added !== '69aa00000000000000000001' || r.pushed !== 1 || g(L[1]).verdict !== 'not_a_fit' || g(L[2]).verdict !== 'not_a_fit' || g(L[3]).verdict) bad.push('import');
  const p = X.skPrompt(x); console.log('prompt asks to push + nethunt_writes:', /Push the ready/.test(p) && /nethunt_writes\.csv/.test(p)); if (!/Push the ready/.test(p) || !/nethunt_writes\.csv/.test(p) || /Do not write to NetHunt/.test(p)) bad.push('prompt');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
