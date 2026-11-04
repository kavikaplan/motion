// 📂 import a lead list (CSV with ; or Excel) into ✨ Not in NetHunt: columns guessed (Spanish headers too), rows of one company joined, countries from names
// (unknown → pick or leave out), tags for all + from the file, people, every other column kept as info → website / phones / emails / people ready for ⚡ Qualify & enrich
// → filters by list and tag on the page → ＋ Add to NetHunt carries Tags, City, Source “Lead generation” and the info in Notes → remove a list
const { run } = require('./harness'); const fs = require('fs'); const path = require('path');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const csv = [ 'Empresa;País;Ciudad;Web;Email;Teléfono;Etiquetas;Contacto;Cargo;Email contacto;Tipo;Facturación;Notas',
    'Ortomedica Andes SpA;Chile;Santiago;ortomedica-andes.cl;ventas@ortomedica-andes.cl;+56 2 2345 6789;Distribuidor, Trauma;Pedro Soto;Gerente;pedro@ortomedica-andes.cl;Distribuidor ortopédico;USD 2M;Vende placas y clavos',
    'Ortomedica Andes SpA;Chile;Santiago;;;;Hospitales;María Paz;Compras;maria@ortomedica-andes.cl;;;',
    'Implantes del Sur Ltda;CL;Concepción;https://implantesdelsur.cl;info@implantesdelsur.cl;;Columna;;;;Importador;;',
    'Brasil Ortho Ltda;Brasil;São Paulo;brasilortho.com.br;;+55 11 4000 1000;;;;;;;',
    'Narnia Medical;Narnia;Cair Paravel;;;;;;;;;;',
    ';Chile;;;;;;;;;;;' ].join('\r\n');
  // the column guesses
  const P = X.impCsv(csv); const G = X.impGuess(P.cols); console.log('columns:', P.cols.length, '| rows', P.rows.length, '| guessed:', JSON.stringify(G));
  const want = { Empresa: 'name', 'País': 'country', Ciudad: 'city', Web: 'website', Email: 'email', 'Teléfono': 'phone', Etiquetas: 'tags', Contacto: 'p_name', Cargo: 'p_title', 'Email contacto': 'p_email', Tipo: 'category', 'Facturación': 'info', Notas: 'notes' };
  Object.entries(want).forEach(([c, f]) => G[c] !== f && bad.push(`guess ${c}→${G[c]}`));
  console.log('countries:', [ 'Chile', 'CL', 'Brasil', 'Narnia', 'Türkiye', 'Estados Unidos' ].map((v) => `${v}=${X.impIso(v) || '?'}`).join(' ')); if (X.impIso('Brasil') !== 'BR' || X.impIso('CL') !== 'CL' || X.impIso('Narnia')) bad.push('country names');
  // the import sheet: file in, list name, tags for all, unknown country left out
  X.openImport(D.body); await h.settle(); const sh = () => D.getElementById('cm-sheet'); console.log('sheet:', D.getElementById('cm-sheet-title').textContent);
  const inp = sh().querySelector('.cm-impdrop input[type=file]'); const file = new W.File([ csv ], 'chile_leads oct.csv', { type: 'text/csv' }); Object.defineProperty(inp, 'files', { value: [ file ] }); inp.dispatchEvent(new W.Event('change')); await wait(200); await h.settle();
  const sec3 = () => [ ...sh().querySelectorAll('.cm-cpbox') ].find((b) => /Check/.test(b.textContent)); console.log('check:', sec3() && sec3().querySelector('.cm-cpbh').textContent);
  const ln = sh().querySelector('.cm-cpset input.cm-cpin'); console.log('list name:', ln.value); ln.value !== 'chile leads oct' && bad.push('list name from file name');
  const tg = sh().querySelectorAll('.cm-cpset input.cm-cpin')[1]; tg.value = 'Lead generation, Oct 2026'; tg.dispatchEvent(new W.Event('change')); await h.settle();
  console.log('unknown countries:', [ ...sh().querySelectorAll('.cm-impunk .r b') ].map((b) => b.textContent).join(', ')); if (![ ...sh().querySelectorAll('.cm-impunk .r b') ].some((b) => /Narnia/.test(b.textContent))) bad.push('unknown country asked');
  if (!/3 companies/.test(sec3().textContent) || !/1 rows joined|1 row joined/.test(sec3().textContent) && !/joined/.test(sec3().textContent) || !/1 rows without a name/.test(sec3().textContent)) bad.push('check counts');
  const go = [ ...sh().querySelectorAll('.cm-cpgo .cm-btn') ].pop(); console.log('button:', go.textContent); go.click(); await wait(200); await h.settle();
  console.log('done:', (sh().querySelector('.cm-impdone') || {}).textContent);
  const nk = W.cmNkey; const rec = X.IMP.get(`CL|${nk('Ortomedica Andes SpA')}`); console.log('record:', JSON.stringify(rec && { tags: rec.tags, city: rec.city, web: rec.website, em: rec.emails, ph: rec.phones, people: rec.people.map((p) => `${p.name}/${p.title}/${p.email}`), cat: rec.category, info: rec.info, notes: rec.notes, list: rec.list }));
  if (!rec || !rec.tags.includes('Lead generation') || !rec.tags.includes('Oct 2026') || !rec.tags.includes('Trauma') || !rec.tags.includes('Hospitales') || rec.people.length !== 2 || rec.website !== 'https://ortomedica-andes.cl' || rec.info['Facturación'] !== 'USD 2M' || rec.city !== 'Santiago') bad.push('record joined with everything');
  if (X.IMP.get(`BR|${nk('Brasil Ortho Ltda')}`) == null) bad.push('Brazil row'); if ([ ...X.IMP.values() ].some((v) => /Narnia/.test(v.name || ''))) bad.push('Narnia left out');
  const lf = W.__cm3.LF ? W.__cm3.LF.get(nk('Ortomedica Andes SpA')) : null; console.log('details ready for enrichment:', lf ? JSON.stringify(lf.d).slice(0, 160) : '(LF not exported)');
  // shared: the leadstore gets kind “lead”
  await wait(2300); const ls = h.calls.filter((c) => /leadstore/.test(String(c[1] || c[0]))).length; console.log('leadstore pushes seen:', ls);
  // in ✨ Not in NetHunt
  const L = W.cmLeadsFor('CL', !0); const e = L.find((x) => x.imp && /Ortomedica Andes/.test(x.name)); console.log('in Chile’s leads:', !!e, '| source chip:', e && e.imp.list); e || bad.push('lead in cmLeadsFor');
  X.LPx().list = 'chile leads oct'; X.openLeadsPage('CL', !0); await wait(300); await h.settle(); const pg = D.getElementById('cm-lp'); const rows = pg ? [ ...pg.querySelectorAll('.cm-lprow') ] : []; console.log('page rows (list filter):', rows.length, '| first:', rows[0] && rows[0].textContent.replace(/\s+/g, ' ').slice(0, 200));
  if (rows.length !== 2 || !pg.querySelector('.cm-lpsrc.s-imp') || !pg.querySelector('.cm-lpimpf') || !pg.querySelector('.cm-lptag') || !pg.querySelector('.cm-impbtn')) bad.push('page shows the list');
  const tb = [ ...pg.querySelectorAll('.cm-lptag') ].find((b) => /Columna/.test(b.textContent)); tb.click(); await h.settle(); const rows2 = [ ...D.getElementById('cm-lp').querySelectorAll('.cm-lprow') ]; console.log('tag “Columna”:', rows2.length, rows2[0] && rows2[0].querySelector('.cm-lpname').textContent); (rows2.length !== 1 || !/Implantes del Sur/.test(rows2[0].textContent)) && bad.push('tag filter');
  // into NetHunt
  const fx = X.impFields(nk('Ortomedica Andes SpA')); const nt = X.impNotes(nk('Ortomedica Andes SpA')); console.log('NetHunt fields:', JSON.stringify(fx), '| notes:', nt.join(' | ').slice(0, 200));
  if (!fx.Tags || !fx.Tags.includes('Trauma') || fx.City[0] !== 'Santiago' || !nt.some((x) => /Facturación: USD 2M/.test(x)) || !nt.some((x) => /Imported list: chile leads oct/.test(x))) bad.push('fields for NetHunt');
  const le = X.leadExtra(nk('Ortomedica Andes SpA')); console.log('leadExtra:', JSON.stringify(le).slice(0, 200)); (!le.Tags || !le.Website || !le.Email) && bad.push('leadExtra carries the list');
  X.LPx().tag = ''; X.LPx().list = 'chile leads oct'; X.openLeadsPage('CL', !0); await wait(200); await h.settle(); const MC = await W.claude.use('mcp'); const ct0 = MC.callTool; const cr = []; const txt = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] });
  MC.callTool = async (s, t, a) => { h.calls.push([ 'nh', t, a ]); if (t === 'search_records') return txt({ records: [] }); if (t === 'create_record') { cr.push(a); return txt({ id: 'NEW1' }); } return ct0(s, t, a); }; W.confirm = () => !0;
  const r0 = [ ...D.getElementById('cm-lp').querySelectorAll('.cm-lprow') ].find((r) => /Ortomedica Andes/.test(r.textContent)); r0.querySelector('input').click(); [ ...D.querySelectorAll('#cm-lp .cm-lpbar .cm-mini') ].find((b) => /Add to NetHunt/.test(b.textContent)).click(); await wait(600); await h.settle();
  const c0 = cr.find((a) => a.folderId === C.NH_FOLDER); console.log('created:', c0 && JSON.stringify({ Name: c0.fields.Name, Country: c0.fields.Country, City: c0.fields.City, Tags: c0.fields.Tags, Source: c0.fields.Source, Website: c0.fields.Website, Notes: (c0.fields.Notes || '').split('\n').slice(0, 5) }));
  if (!c0 || !c0.fields.Tags.includes('Lead generation') || c0.fields.Source[0] !== 'Lead generation' || c0.fields.City[0] !== 'Santiago' || !/Facturación: USD 2M/.test(c0.fields.Notes)) bad.push('added to NetHunt with tags/city/notes');
  MC.callTool = ct0;
  // Excel
  W.eval(fs.readFileSync(path.join(__dirname, '../public/xlsx.full.min.js'), 'utf8')); const XL = W.XLSX; const wb = XL.utils.book_new(); XL.utils.book_append_sheet(wb, XL.utils.aoa_to_sheet([ [ 'Company Name', 'Country', 'City', 'Website', 'Tags', 'Employees' ], [ 'Medisur Peru SAC', 'Peru', 'Lima', 'medisur.pe', 'Trauma', '45' ] ]), 'Leads');
  const buf = XL.write(wb, { type: 'array', bookType: 'xlsx' }); const xf = new W.File([ buf ], 'peru.xlsx'); xf.arrayBuffer || (xf.arrayBuffer = async () => buf);
  C.closeSheet(); await h.settle(); X.openImport(D.body); await h.settle(); const inp2 = D.querySelector('#cm-sheet .cm-impdrop input[type=file]'); Object.defineProperty(inp2, 'files', { value: [ xf ] }); inp2.dispatchEvent(new W.Event('change')); await wait(300); await h.settle();
  const ck2 = [ ...D.querySelectorAll('#cm-sheet .cm-cpbox') ].find((b) => /Check/.test(b.textContent)); console.log('excel check:', ck2 && ck2.querySelector('.cm-cpbh').textContent, '| guesses:', [ ...D.querySelectorAll('#cm-sheet .cm-impmap select') ].map((s) => s.value).join(','));
  if (!ck2 || !/1 company/.test(ck2.textContent)) bad.push('excel read');
  // remove the CSV list
  X.impRemove('chile leads oct'); const left = [ ...X.IMP.values() ].filter((v) => v && !v.gone).length; console.log('after removing the list:', left, 'left'); left !== 0 && bad.push('remove list');
  C.closeSheet();
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
