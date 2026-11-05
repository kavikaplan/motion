// ⚡ Qualify & enrich (Richard in Medint): free gates, CRM check, research + deep pass, live NetHunt recheck, details/people/email checks, outcomes, add ready ones (Import Batch, links not duplicates)
// · 🏫 associations in the country Overview · 📰 the week inside 🧾 Log (no separate menu item) · client report “Done this week” line · Power hour header compact · activity comments without an empty column
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  const L = (W.cmLeadsFor('CO', true) || []).slice(0, 40); console.log('CO leads:', L.length);
  // pick: one clinic (free drop), three to research
  const clinic = { key: 'test|clinica', name: 'Clínica San Felipe SAC' }; const pick = L.filter((e) => !/cl[ií]nica|hospital|farmac/i.test(e.name) && [ 'ortho', 'maybe' ].includes(X.qlRulesX(e)[0]) && !(X.leadMatchX && X.leadMatchX(e, 'CO'))).slice(0, 3);
  const verdicts = [ 'qualified', 'insufficient_evidence', 'not_a_fit' ]; const calls = { research: 0, deep: 0, leads: 0, verify: 0 };
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (String(u) === '/api/research' && o && o.body) u = '/api/research?' + Object.entries(JSON.parse(o.body)).filter(([k]) => k !== 'own').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&'); /* POST → the same names as an address */
    if (u.startsWith('/api/research')) { const deep = /deep=1/.test(u); deep ? calls.deep++ : calls.research++; const nm = decodeURIComponent((u.match(/name=([^&]*)/) || [])[1] || ''); const i = pick.findIndex((e) => e.name === nm);
      return J(deep ? { verdict: 'adjacent_supplier', reason: 'sells lab equipment' } : { verdict: verdicts[i] || 'insufficient_evidence', reason: `test ${i}`, website: i === 0 ? 'https://ortomed-test.co' : '', quote: i === 0 ? 'Distribuidor de implantes ortopédicos' : '', quote_url: i === 0 ? 'https://ortomed-test.co/nosotros' : '' }); }
    if (u.startsWith('/api/leads') && (o.method || 'GET') === 'POST') { calls.verify++; const b = JSON.parse(o.body || '{}'); return J({ results: (b.emails || []).map((em) => ({ email: em, state: 'deliverable' })) }); }
    if (u.startsWith('/api/leads')) { calls.leads++; return J({ people: [ { name: 'Ana Ruiz', title: 'Gerente General', email: 'ana@ortomed-test.co' } ], emails: [ { source: 'Snov', email: 'ventas@ortomed-test.co' } ] }); }
    if (u.startsWith('/api/enrich')) return J({ items: [], search_ready: true });
    return of(u, o); };
  const rows = [ { e: clinic, iso: 'CO' }, ...pick.map((e) => ({ e, iso: 'CO' })) ];
  await X.richRun(rows, { ppl: true, verify: true }); await h.settle(); await wait(200);
  const Rn = X.RR.last; console.log('outcomes:', Rn && Rn.R.map((x) => `${x.e.name.slice(0, 20)}=${x.out}`).join(' | '), '| calls', JSON.stringify(calls));
  const out = (e) => Rn.R.find((x) => x.e === e).out;
  if (out(clinic) !== 'free') bad.push('free gate'); if (out(pick[0]) !== 'ready') bad.push('qualified → ready'); if (out(pick[1]) !== 'adjacent') bad.push('deep pass decides the unsure'); if (out(pick[2]) !== 'nonicp') bad.push('not a fit');
  if (calls.research !== 3 || calls.deep !== 1 || calls.leads < 1 || calls.verify < 1) bad.push('stage calls');
  const ti = D.getElementById('cm-sheet-title').textContent; const sum = D.querySelector('#cm-sheet .cm-rrsum'); console.log('results sheet:', ti, '|', sum && sum.textContent); if (!/⚡/.test(ti) || !sum || !/1 ready for NetHunt/.test(sum.textContent) || !/research incomplete/.test(sum.textContent)) bad.push('results sheet');
  // add the ready one: Import Batch on the company, the person as a contact
  W.confirm = () => true; const ab = [...D.querySelectorAll('#cm-sheet button')].find((b) => /Add 1 ready/.test(b.textContent)); ab.click(); await wait(600); await h.settle();
  const cr = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].fields && c[2].fields.Name === pick[0].name).pop(); console.log('created:', cr && JSON.stringify({ batch: cr[2].fields['Import Batch'], site: cr[2].fields.Website, cat: cr[2].fields.Category, src: cr[2].fields.Source }));
  if (!cr || !cr[2].fields['Import Batch'] || cr[2].fields.Source || cr[2].fields.Category !== 'Ortho') bad.push('create fields');
  const pc = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].fields && c[2].fields.Name === 'Ana Ruiz').pop(); pc || bad.push('contact created');
  console.log('after add:', out(pick[0])); out(pick[0]) !== 'added' && bad.push('marked added');
  C.closeSheet();
  // 🏫 associations in the Overview
  W.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'overview' }); await h.settle(); await wait(900); await h.settle();
  const as = D.querySelector('#ctry-assoc'); console.log('associations:', as && as.textContent.replace(/\s+/g, ' ').slice(0, 220)); if (!as || !/SCHOT|Sociedad Chilena/.test(as.textContent)) bad.push('associations');
  // 📰 the week is a tab of the Log, not a menu item
  const more = W.__cm2.moreItems().map((x) => x[0]); console.log('menu has Weekly report:', more.some((x) => /Weekly report/.test(x))); more.some((x) => /📰 Weekly report/.test(x)) && bad.push('weekly in menu');
  W.__cm2.openWeekly(D.body); await h.settle(); const tabs = [...D.querySelectorAll('#cm-sheet .cm-cgtabs .cm-chip')].map((b) => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`); console.log('log tabs:', tabs.join(' | '), '| title', D.getElementById('cm-sheet-title').textContent); if (!tabs.some((t) => /The week\*/.test(t))) bad.push('week tab'); C.closeSheet();
  // client report: DONE line asked from the AI and shown
  let ask = ''; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { ask = JSON.stringify(JSON.parse(o.body || '{}')); return J({ text: 'NOW: Interested.\nLAST: They asked for prices on 20 Oct.\nNEXT: Send prices.\nDONE: We called twice and sent the price list.\nYAPILAN: İki kez aradık, fiyat listesini gönderdik.\nTR: İlgili.\nKISI: Ana' }); } return of(u, o); };
  const D0 = X.rptData('next', 'lastweek') || X.rptData('next', 'thisweek'); if (!D0) { console.log('no report data'); } else { const park = (r) => /exploring|market entry|nurtur|not a fit|no fit|not interested|lost|rejected/i.test(String(r.status || '')); const r0 = D0.rows.find((r) => (r.touches || r.replies) && !park(r)) || D0.rows.find((r) => !park(r)) || D0.rows[0]; // the report leaves out parked companies (which ones are in last week's data depends on today's date) console.log('report row:', r0 && r0.company);
    if (r0) { await X.rptMakeAI({ ...D0, rows: [ r0 ], force: true }); console.log('prompt asks DONE:', /DONE: what we did/.test(ask)); /DONE: what we did/.test(ask) || bad.push('DONE asked'); const html = X.rptHTML ? X.rptHTML(D0, 'Kavi') : W.__cm2.rptHTML(D0, 'Kavi'); const ok = /Done this (week|month):<\/b> We called twice/.test(html); console.log('report shows Done:', ok); ok || bad.push('Done shown'); } }
  // Power hour: fit badge in the header, status select on the meta line, 🔎 at its end
  W.fetch = of; W.dash.setParams({ view: 'country', iso: 'CO', tags: ['colombia'], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(500);
  W.__cm2.openPowerHour(D.body); await wait(1200); await h.settle(); X.fitWatch && X.fitWatch(true); await h.settle(); await wait(100);
  const mt = D.querySelector('#cm-sheet .cm-phmeta'); console.log('meta line:', mt && [...mt.children].map((c) => c.className || c.tagName).join(' · '));
  if (mt && D.querySelector('#cm-sheet select.cm-phstat-nm') && D.querySelector('#cm-sheet select.cm-phstat-nm').parentElement !== mt) bad.push('status select on meta line');
  mt && mt.querySelector('.cm-stpill') && D.querySelector('#cm-sheet select.cm-phstat-nm') && bad.push('duplicate status pill');
  const am = D.querySelector('#cm-sheet .cm-addmiss'); console.log('find contacts parent:', am && am.parentElement.className); if (am && !am.parentElement.classList.contains('cm-phwho')) bad.push('find contacts on the name line');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
