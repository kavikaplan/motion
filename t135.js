// 📣 Campaigns page (top bar): countries + filters run in NetHunt → compact list → select all → create → receivers (prefetched, no extra company reads),
// 🚩 wrong / undeliverable / bounced-before emails red and unticked, ✓ check with Snov, 🧩 fallbacks for missing values, 🖼 images + 📎 files in the emails;
// server: fallbacks, images inline (cid) + attachments in the MIME
const { run } = require('./harness'); const path = require('path');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } });
  W.dash.data('company_schema'); await h.settle();
  const MC = await W.claude.use('mcp'); const ct0 = MC.callTool; const txt = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] }); const nh = [];
  const COS = [ { id: 'c1', fields: { Name: 'Promed Chile', Country: [ 'Chile' ], City: [ 'Santiago' ], Status: 'Lead', Category: 'Ortho', Tags: [ 'Alibaba', 'NEXT' ], Email: [ 'info@promed.con', 'ventas@promed.cl' ], 'Related records': [ 'aaaaaaaaaaaaaaaaaaaaaaa1' ], 'Last Interaction Date': Date.now() - 200 * 864e5 } },
    { id: 'c2', fields: { Name: 'Traumed', Country: [ 'Chile' ], Status: 'Lead', Email: [ 'contacto@traumed.cl' ] } }, { id: 'c3', fields: { Name: 'Busy Co', Country: [ 'Chile' ], Status: 'Lead', Email: [ 'x@busy.cl' ] } } ];
  MC.callTool = async (s, t, a) => { nh.push([ t, a ]); h.calls.push([ 'nh', t, a ]);
    if (t === 'filter_records' && a.folderId === C.NH_FOLDER) return txt({ records: COS, total: 3 });
    if (t === 'filter_records') return txt({ records: [ { id: 'p1', fields: { Name: 'Ana Ruiz', Title: 'Gerente', Email: [ 'ana@promed.cl' ], Company: [ 'c1' ] } }, { id: 'p2', fields: { Name: 'Rosa Vega', Email: [ 'rosa@traumed.cl' ], Company: [ 'c2' ] } } ] });
    if (t === 'get_record' && a.recordId === 'aaaaaaaaaaaaaaaaaaaaaaa1') return txt({ id: 'aaaaaaaaaaaaaaaaaaaaaaa1', fields: { Name: 'Luis Soto', Email: [ 'luis@promed.cl' ] } });
    return ct0(s, t, a); };
  const posts = []; const of = W.fetch;
  W.fetch = async (u, o = {}) => { u = String(u); const b = o.body && typeof o.body === 'string' ? JSON.parse(o.body) : null; b && posts.push([ u, b ]);
    if (u.startsWith('/api/gmail/camp/busyco')) return J({ rows: [ { id: 'c3', camp: 'Oct run' } ] }); if (u.startsWith('/api/gmail/camp/check')) return J({ busy: [], bounced: [ { email: 'rosa@traumed.cl', why: 'Address not found' } ] });
    if (u.startsWith('/api/gmail/accounts')) return J({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true } ] } ] }); if (u.startsWith('/api/gmail/camp/load')) return J({ boxes: [] }); if (u.startsWith('/api/gmail/camp/list')) return J({ camps: [] });
    if (u.startsWith('/api/gmail/camp/create')) return J({ ok: true, id: 'C9', added: b.rcpts.length, skipped: [] }); if (u.startsWith('/api/gmail/camp/get')) return J({ camp: { id: 'C9', name: 'x', steps: b ? [] : [], status: 'active', mailbox: 'hi@kavikaplan.com', sender: 'hi@kavikaplan.com', n: {} }, rcpts: [] });
    if (u.startsWith('/api/gmail/')) return J({ labels: [], threads: [], rows: [] });
    if (u === '/api/leads' && b && b.action === 'verify') return J({ results: b.emails.map((e) => ({ email: e, state: e === 'ventas@promed.cl' ? 'undeliverable' : 'deliverable', detail: 'test' })) });
    return of(u, o); };
  // the button on the top bar
  X.cpCoWatch && 0; const tb = D.querySelector('.cm-cpgbtn'); console.log('top bar button:', !!tb, tb && tb.getAttribute('aria-label')); tb || bad.push('top bar button');
  X.openCampPage('CL'); await wait(400); await h.settle(); await wait(200); await h.settle(); const pg = () => D.getElementById('cm-cpg');
  const fq = nh.filter((x) => x[0] === 'filter_records' && x[1].folderId === C.NH_FOLDER).pop(); console.log('NetHunt filter:', JSON.stringify(fq && fq[1].filter)); (!fq || !fq[1].filter.Country._any.some((x) => /chile/i.test(x))) && bad.push('country filter');
  console.log('rows:', pg().querySelectorAll('.cm-carow').length, '| kpi:', [ ...pg().querySelectorAll('.cm-lpk') ].map((k) => k.textContent).join(' · ')); pg().querySelectorAll('.cm-carow').length !== 2 && bad.push('busy company hidden');
  const r1 = pg().querySelector('.cm-carow'); console.log('row 1:', r1.textContent.replace(/\s+/g, ' ')); (!/Promed Chile/.test(r1.textContent) || !/wrong email/.test(r1.textContent) || !/Lead/.test(r1.textContent)) && bad.push('compact row');
  // status + last contact filters
  const CA = X.CAx(); CA.status.push('Lead'); CA.since = 'old90'; const F = X.caFilter(); console.log('filter with status + 90 days:', JSON.stringify(F).slice(0, 220)); (!F._and || !F._and[0].Status || !F._and[1]._or) && bad.push('status / last-contact filter');
  CA.all = !0; const F2 = X.caFilter(); F2._and[0].Country && bad.push('all countries = no country filter for House'); CA.all = !1; CA.status.splice(0); CA.since = '';
  // select all → create
  [ ...pg().querySelectorAll('.cm-lpbar .cm-mini') ].find((b) => /Select all/.test(b.textContent)).click(); await h.settle(); const cb = pg().querySelector('.cm-cacreate'); console.log('create button:', cb.textContent);
  const n0 = nh.filter((x) => x[0] === 'get_record' && x[1].folderId === C.NH_FOLDER).length; cb.click(); await wait(600); await h.settle(); await wait(300); await h.settle(); await wait(200); await h.settle();
  const n1 = nh.filter((x) => x[0] === 'get_record' && x[1].folderId === C.NH_FOLDER).length; console.log('company reads in the builder:', n1 - n0); n1 - n0 && bad.push('prefetched records not used');
  const sh = () => D.getElementById('cm-sheet'); const rows = [ ...sh().querySelectorAll('.cm-cpwho .rr') ].map((r) => `${r.querySelector('input').checked ? '☑' : '☐'}${r.classList.contains('bad') ? '🔴' : ''} ${r.textContent.replace(/\s+/g, ' ').trim()}`); console.log('receivers:\n  ' + rows.join('\n  '));
  if (!rows.some((r) => /^☐🔴.*info@promed\.con.*wrong email/.test(r)) || !rows.some((r) => /^☐🔴.*rosa@traumed\.cl.*bounced before/.test(r)) || !rows.some((r) => /^☑.*Luis Soto/.test(r)) || !rows.some((r) => /^☑.*ventas@promed\.cl/.test(r))) bad.push('red flags');
  const g = sh().querySelector('.cm-cpco .gh'); console.log('company line:', g.textContent.replace(/\s+/g, ' ')); g.querySelector('.cnt') || bad.push('company line count');
  // ✓ check emails with Snov
  W.confirm = () => !0; [ ...sh().querySelectorAll('.cm-cpwtb .cm-mini') ].find((b) => /Check emails/.test(b.textContent)).click(); await wait(300); await h.settle();
  const vp = posts.filter(([u]) => u === '/api/leads').pop(); console.log('checked:', vp && vp[1].emails.join(', ')); const rows2 = [ ...sh().querySelectorAll('.cm-cpwho .rr') ].map((r) => `${r.querySelector('input').checked ? '☑' : '☐'}${r.classList.contains('bad') ? '🔴' : ''} ${r.textContent.replace(/\s+/g, ' ').trim()}`);
  console.log('after check:', rows2.filter((r) => /ventas|luis/.test(r)).join(' | ')); (!rows2.some((r) => /^☐🔴.*ventas@promed\.cl.*undeliverable/.test(r)) || !rows2.some((r) => /^☑.*luis.*✓/.test(r))) && bad.push('undeliverable after check');
  // fallbacks + files + images
  const d = X.CP.draft; d.mailbox = 'hi@kavikaplan.com'; d.sender = 'hi@kavikaplan.com'; d.steps[0].subject = 'Implants for {company}'; d.steps[0].body = 'Hi {name}, is {company} in {city} working with surgeons? {title}';
  d.steps[0].images = [ { key: 'k-img', name: 'shoulder.png', size: 2000 } ]; d.steps[0].files = [ { key: 'k-pdf', name: 'Catalogue.pdf', size: 900000 } ]; C.sheetDraw(); await h.settle();
  const fb = sh().querySelector('.cm-cpfb'); console.log('fallbacks:', fb && fb.textContent.replace(/\s+/g, ' ').slice(0, 220)); (!fb || !/\{city\}/.test(fb.textContent) || !/\{name\}/.test(fb.textContent)) && bad.push('fallback panel');
  const ti = [ ...fb.querySelectorAll('.r') ].find((r) => /\{title\}/.test(r.textContent)).querySelector('input'); ti.value = 'colleague'; ti.dispatchEvent(new W.Event('input')); C.sheetDraw(); await h.settle();
  console.log('files row:', [ ...sh().querySelectorAll('.cm-cpstep')[0].querySelectorAll('.cm-cpfile') ].map((x) => x.textContent).join(' | ')); sh().querySelectorAll('.cm-cpstep')[0].querySelectorAll('.cm-cpfile').length !== 2 && bad.push('files + images shown');
  const ps = [ ...sh().querySelectorAll('.cm-cpbox select.cm-cpin') ].pop(); const ci = [ ...ps.options ].findIndex((o) => /Luis/.test(o.text)); ps.value = String(ci < 0 ? 0 : ci); ps.dispatchEvent(new W.Event('change')); await h.settle();
  const pv = sh().querySelector('.cm-cpprev'); console.log('preview:', pv.textContent.replace(/\s+/g, ' ').slice(0, 220), '| img:', !!pv.querySelector('img.pimg')); (!/your city|colleague/.test(pv.textContent) || !pv.querySelector('img.pimg') || !/Catalogue\.pdf/.test(pv.textContent)) && bad.push('preview fallbacks / images / files');
  const go = () => [ ...sh().querySelectorAll('.cm-cpgo .cm-btn') ].pop(); go().click(); await h.settle(); go().click(); await wait(300); await h.settle();
  const cr = posts.find(([u]) => /camp\/create/.test(u)); const cbd = cr && cr[1]; console.log('create:', cbd && JSON.stringify({ fb: cbd.fallbacks, img: cbd.steps[0].images, files: cbd.steps[0].files, to: cbd.rcpts.map((r) => r.email) }));
  if (!cbd || cbd.fallbacks.title !== 'colleague' || cbd.fallbacks.city !== 'your city' || cbd.steps[0].images[0].key !== 'k-img' || cbd.steps[0].files[0].key !== 'k-pdf' || cbd.rcpts.some((r) => /promed\.con|rosa@|ventas@/.test(r.email))) bad.push('create carries fallbacks / files / no red emails');
  C.closeSheet(); X.caClose(); W.fetch = of; MC.callTool = ct0;
  // server: the email itself
  const K = await import(path.join(__dirname, '../functions/_lib/camp.js')); const G = await import(path.join(__dirname, '../functions/_lib/gmail.js'));
  const c = { id: 'C1', name: 'x', steps: JSON.stringify([ { subject: 'Hi {company}', body: 'Dear {name}, in {city}.', images: [ { key: 'k-img', name: 'a.png' } ], files: [ { key: 'k-pdf', name: 'c.pdf' } ] } ]), fallbacks: JSON.stringify({ name: 'there', city: 'your city' }), optout: 'Reply no.', sender_name: 'Kavi', brand: '' };
  const m = K.build(c, { id: 'C1:0', kind: 'company', name: '', company: 'Promed', city: '', country: 'Chile' }, 0, 'Kavi<br>UV'); console.log('server email:', m.subject, '|', m.body.replace(/\n/g, ' '), '| inline', JSON.stringify(m.inline), '| files', JSON.stringify(m.files));
  if (!/Dear there, in your city\./.test(m.body) || !/cid:img0/.test(m.html) || m.files[0] !== 'k-pdf' || !m.inline.length) bad.push('server build');
  const raw = G.mime({ from: 'hi@kavikaplan.com', to: 'a@b.cl', subject: 's', text: 't', html: m.html, files: [ { name: 'a.png', type: 'image/png', b64: 'iVBORw0KGgo=', cid: m.inline[0].cid }, { name: 'c.pdf', type: 'application/pdf', b64: 'JVBERi0=' } ] });
  const ok = /multipart\/related/.test(raw) && raw.includes(`Content-ID: <${m.inline[0].cid}>`) && /Content-Disposition: inline; filename="a.png"/.test(raw) && /Content-Disposition: attachment; filename="c.pdf"/.test(raw); console.log('MIME related + inline + attachment:', ok); ok || bad.push('mime');
  const raw2 = G.mime({ from: 'a@b.c', to: 'd@e.f', subject: 's', text: 't', html: 'h', files: [ { name: 'c.pdf', type: 'application/pdf', b64: 'JVBERi0=' } ] }); /multipart\/related/.test(raw2) && bad.push('plain emails unchanged');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
