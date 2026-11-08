// ➕ Add to Medint (browser button): the bookmark is valid and sends link + title + highlight + page text · /api/capture reads their
// website (emails / phones) + one AI call → company + person (LinkedIn pages are not fetched) · the window checks NetHunt live and
// adds the company (Source Browser, notes with the link) + the person linked to it, logged as you · an existing company gets only the person
const P = require('path'); const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  // ---- server
  const CAP = await import(P.join(__dirname, '../functions/api/capture.js')); const asked = []; const of = global.fetch; let aiOut = '';
  global.fetch = async (u, o = {}) => { u = String(u); asked.push(u); if (u.startsWith('https://api.anthropic.com')) { const b = JSON.parse(o.body); asked.push('PROMPT:' + b.messages[0].content.slice(0, 4000)); return new Response(JSON.stringify({ content: [ { type: 'text', text: aiOut } ] }), { status: 200 }); }
    if (/acme-ortho\.cl/.test(u)) return new Response('<html><head><title>Acme Ortho</title></head><body><a href="/contacto">Contacto</a><p>Distribuidor de implantes ortopédicos. ventas@acme-ortho.cl · +56 2 2345 6789</p></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
    return new Response('', { status: 404 }); };
  const env = { ANTHROPIC_API_KEY: 'k' };
  aiOut = '{"kind":"company","company":{"name":"Acme Ortho SpA","country":"Chile","city":"Santiago","phones":[],"emails":[],"ortho":"yes","what_they_do":"Distributes trauma implants"},"person":{}}';
  const r1 = await (await CAP.onRequestPost({ request: new Request('https://m/api/capture', { method: 'POST', body: JSON.stringify({ url: 'https://www.acme-ortho.cl/nosotros', title: 'Acme Ortho', text: 'Somos distribuidores' }) }), env })).json();
  console.log('company site →', JSON.stringify({ n: r1.company.name, web: r1.company.website, em: r1.company.emails, ph: r1.company.phones, site: r1.site }));
  if (r1.company.name !== 'Acme Ortho SpA' || !r1.company.emails.includes('ventas@acme-ortho.cl') || !r1.company.phones.some((x) => /2345/.test(x)) || r1.site !== 'https://www.acme-ortho.cl/') bad.push('site enrichment');
  asked.length = 0; aiOut = '{"kind":"both","company":{"name":"Acme Ortho SpA","country":"Chile"},"person":{"name":"María Pérez","title":"Gerente Comercial","company":"Acme Ortho SpA"}}';
  const r2 = await (await CAP.onRequestPost({ request: new Request('https://m/api/capture', { method: 'POST', body: JSON.stringify({ url: 'https://www.linkedin.com/in/maria-perez-123/?trk=x', title: 'María Pérez | LinkedIn', sel: 'María Pérez Gerente Comercial en Acme Ortho SpA', text: 'María Pérez · Gerente Comercial · Acme Ortho SpA · Santiago, Chile' }) }), env })).json();
  console.log('LinkedIn profile →', JSON.stringify({ p: r2.person, site: r2.site }), '| pages fetched:', asked.filter((u) => /^https?:/.test(u) && !/anthropic/.test(u)).length, '| highlight in the prompt:', asked.some((u) => /HIGHLIGHTED: María Pérez Gerente/.test(u)));
  if (r2.person.name !== 'María Pérez' || r2.person.linkedin !== 'https://www.linkedin.com/in/maria-perez-123/' || r2.site || asked.some((u) => /linkedin\.com/.test(u) && !u.startsWith('PROMPT'))) bad.push('linkedin');
  global.fetch = of;
  // ---- page
  const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await wait(1500); await h.settle(); const W = h.w, D = h.d, X = W.__cm3;
  // the bookmark is valid JavaScript and opens Medint with the page
  const bm = X.capBookmarklet(); let opened = ''; try { new Function(bm.replace(/^javascript:/, '')); } catch (e) { bad.push('bookmark syntax ' + e.message); }
  { const fake = { location: { href: 'https://x.com/p', origin: 'https://x.com' }, document: { title: 'T', body: { innerText: 'hello' }, querySelector: () => null }, getSelection: () => 'sel', window: { open: (u) => { opened = u; } }, alert: () => {} };
    new Function('location', 'document', 'getSelection', 'window', 'alert', bm.replace(/^javascript:/, ''))(fake.location, fake.document, fake.getSelection, fake.window, fake.alert); }
  const sent = opened ? JSON.parse(decodeURIComponent(opened.split('#capture=')[1])) : {}; console.log('bookmark opens', opened.split('#')[0], '→', JSON.stringify(sent)); if (sent.u !== 'https://x.com/p' || sent.s !== 'sel' || sent.x !== 'hello') bad.push('bookmark');
  const R0 = W.Response || globalThis.Response; const fW = W.fetch; let capRes = null; const logs = [];
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/capture')) return new R0(JSON.stringify(capRes), { status: 200 }); if (u === '/api/medint' && o.method === 'POST') { logs.push(JSON.parse(o.body)); return new R0('{"ok":true}'); } return fW(u, o); };
  const mcp = await W.claude.use('mcp'); const ct0 = mcp.callTool; const made = []; let existing = null; const T = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] });
  mcp.callTool = async (srv, tool, a = {}) => { if (tool === 'search_records') return T({ records: existing && a.folderId !== '6682e9b8b6386800f586c0b0' ? [ existing ] : [] }); if (tool === 'create_record') { [ W.__cm.NH_FOLDER, '6682e9b8b6386800f586c0b0' ].includes(a.folderId) && made.push(a); return T({ id: a.folderId === '6682e9b8b6386800f586c0b0' ? 'P1' : 'NEW1' }); } return ct0(srv, tool, a); };
  capRes = { kind: 'both', company: { name: 'Acme Ortho SpA', country: 'Chile', city: 'Santiago', website: 'https://www.acme-ortho.cl/', emails: [ 'ventas@acme-ortho.cl' ], phones: [ '+56 2 2345 6789' ], ortho: 'yes', what_they_do: 'Distributes trauma implants' }, person: { name: 'María Pérez', title: 'Gerente Comercial', linkedin: 'https://www.linkedin.com/in/maria-perez-123/' }, items: [], site: 'https://www.acme-ortho.cl/' };
  X.openCapture({ u: 'https://www.linkedin.com/in/maria-perez-123/', t: 'María Pérez | LinkedIn', s: '', x: '' }); for (let k = 0; k < 30 && !D.querySelector('#cm-cap .cm-capgo'); k++) await wait(100);
  const pg = D.getElementById('cm-cap'); console.log('window:', pg && [ ...pg.querySelectorAll('.cm-capf input') ].slice(0, 3).map((i) => i.value).join(' | '), '| country:', pg && pg.querySelector('.cm-capf select').value, '| button:', pg && pg.querySelector('.cm-capgo').textContent);
  pg.querySelector('.cm-capgo').click(); for (let k = 0; k < 30 && !D.querySelector('#cm-cap .cm-capdone'); k++) await wait(100);
  const coF = (made[0] || {}).fields || {}, peF = (made[1] || {}).fields || {}; console.log('created:', JSON.stringify({ Name: coF.Name, Country: coF.Country, Category: coF.Category, Source: coF.Source, Email: coF.Email, Notes: String(coF.Notes || '').split('\n')[1] }), '| person:', JSON.stringify({ n: peF.Name, c: peF.Company, li: peF.LinkedIn }), '|', (D.querySelector('#cm-cap .cm-capdone') || {}).textContent);
  if (coF.Name !== 'Acme Ortho SpA' || coF.Country[0] !== 'Chile' || coF.Category !== 'Ortho' || !/linkedin\.com\/in\/maria/.test(coF.Notes) || peF.Company[0] !== 'NEW1' || peF.Name !== 'María Pérez' || !logs.some((l) => /➕ browser/.test(l.Outcome))) bad.push('add');
  // already in NetHunt → only the person, on that company
  made.length = 0; existing = { id: 'OLD9', fields: { Name: 'Acme Ortho SpA', Status: 'Contacted', Website: 'https://www.acme-ortho.cl' } };
  X.openCapture({ u: 'https://www.linkedin.com/in/maria-perez-123/', t: 'x', s: '', x: '' }); for (let k = 0; k < 30 && !D.querySelector('#cm-cap .cm-capdup'); k++) await wait(100);
  const pg2 = D.getElementById('cm-cap'); console.log('existing:', (pg2.querySelector('.cm-capdup') || {}).textContent, '| button:', pg2.querySelector('.cm-capgo').textContent); pg2.querySelector('.cm-capgo').click(); for (let k = 0; k < 30 && !D.querySelector('#cm-cap .cm-capdone'); k++) await wait(100);
  console.log('created:', made.map((m) => `${m.folderId === '6682e9b8b6386800f586c0b0' ? 'person' : 'company'} ${(m.fields || {}).Name} → ${JSON.stringify((m.fields || {}).Company || '')}`).join(' | ')); if (made.length !== 1 || made[0].fields.Company[0] !== 'OLD9') bad.push('existing');
  mcp.callTool = ct0; W.fetch = fW;
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })().catch((e) => { console.log('errors 1', e.stack); process.exit(0); });
