// Simpler Medint, round 2: one ⚡ research button · one reports place · one Meetings place (7 days ahead, 📋 Prep) · no Hot / Meetings cards on Home
// · ✎ Mine tab in 🧾 Log replaces “What I logged” · the top brand decides Power hour's brand · rarely used tools in one 🛠 Tools sheet
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const now = Date.now();
  // Home: no 🔥 Hot / 📅 Meetings cards
  const h2 = [...D.querySelectorAll('#home-view .cm-hmcard h2')].map((x) => x.textContent); console.log('home cards:', h2.join(' | ')); if (h2.some((t) => /Hot companies|Meetings · next 7/.test(t))) bad.push('home cards');
  // ✨ Not in NetHunt: one ⚡ button
  X.openLeadsPage('CO'); await h.settle(); await wait(500); const bar = [...D.querySelectorAll('#cm-lp .cm-lpbar button')].map((b) => b.textContent); console.log('lead bar:', bar.filter((t) => /Prequal|Research|Find details|Qualify/.test(t)).join(' | '));
  if (!bar.some((t) => /⚡ Qualify & enrich/.test(t)) || bar.some((t) => /^🧪 Prequalify$|^🔬 Research$|^🔎 Find details$/.test(t))) bad.push('lead bar'); D.getElementById('cm-lp') && D.getElementById('cm-lp').remove();
  // 📊 reports: one place (the list is inside the report)
  X.openReports(D.body); await h.settle(); const t1 = D.getElementById('cm-sheet-title').textContent; const al = D.querySelector('#cm-sheet details.cm-rnall'); console.log('reports:', t1, '| list inside, open:', al && al.open); if (!/Client report/.test(t1) || !al || !al.open) bad.push('reports one place'); C.closeSheet();
  // 🤝 Meetings: 7 days ahead with 📋 Prep
  const co = C.rowsOf('company_index').find((c) => c.domains && /\./.test(c.domains)); const dom = String(co.domains).split(/[|,;\s]+/)[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/calendar')) return new R(JSON.stringify({ events: [ { id: 'f1', summary: 'Visit', start: { dateTime: new Date(now + 3 * 864e5).toISOString() }, attendees: [ { email: `x@${dom}` } ] } ] }), { status: 200 }); return of(u, o); };
  X.MT.calAt = 0; await X.mtLoadCal(true); X.openMeetings(D.body); await h.settle(); const mt = D.querySelector('#cm-sheet'); console.log('meetings:', D.getElementById('cm-sheet-title').textContent, '|', [...mt.querySelectorAll('.cm-cgk')].map((x) => x.textContent).join(' | '), '| prep buttons:', [...mt.querySelectorAll('button')].filter((b) => /Prep/.test(b.textContent)).length);
  if (!/Coming · next 7 days/.test(mt.textContent) || ![...mt.querySelectorAll('button')].some((b) => /📋 Prep/.test(b.textContent))) bad.push('meetings 7 days + prep'); C.closeSheet(); W.fetch = of;
  // ✎ Mine in the Log
  W.__cm2.openPowerHour && 0; const cid = co.id; W.__cm2x && 0; (W.__cm2.openLog ? W.__cm2.openLog : () => 0)(D.body, 'mine', { cid, name: co.company }); await h.settle(); const tabs = [...D.querySelectorAll('#cm-sheet .cm-cgtabs .cm-chip')].map((b) => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`); console.log('log tabs:', tabs.join(' | '), '| title:', D.getElementById('cm-sheet-title').textContent); if (!tabs.some((t) => /Mine\*/.test(t))) bad.push('mine tab'); C.closeSheet();
  // 🛠 Tools
  const items = W.__cm2.moreItems().map((x) => x[0]); console.log('⋯ menu:', items.join(' | ')); const tl = W.__cm2.moreItems().find((x) => /🛠 Tools/.test(x[0])); if (!tl || items.some((t) => /Data health|Duplicate companies|Keyboard shortcuts/.test(t))) bad.push('tools in menu');
  if (tl) { tl[1]({ currentTarget: D.body }); await h.settle(); const tb = [...D.querySelectorAll('#cm-sheet .cm-toolbtn')].map((b) => b.textContent); console.log('tools:', tb.join(' | ')); if (!tb.some((t) => /Data health/.test(t))) bad.push('tools sheet'); C.closeSheet(); }
  // the top brand decides Power hour's brand
  W.dash.setParams({ view: 'country', iso: 'CO', tags: ['colombia'], ours: 'dunitech', ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(400); W.__cm2.openPowerHour(D.body); await wait(1000); await h.settle();
  const bs = [...D.querySelectorAll('#cm-sheet select.cm-phtpl')].find((s) => [...s.options].some((o) => o.value === 'motion') && [...s.options].length === 3); console.log('PH brand picker hidden with Dunitech on top:', !bs || bs.hidden); if (bs && !bs.hidden) bad.push('brand picker');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
