// reports stay on the client's own products (Next Shoulder → shoulder prostheses, Dunitech → nails) · summaries kept per brand
// · Home “Team this week” only lists people the House set up · manufacturer page export-market chips readable
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D0 = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  // the filter itself
  const t = "Çok ilgililer ve pediatrik plak talep ediyorlar. 14 Ekim'de online toplantı yaptık, fiyat ve kataloğu gönderdik.";
  const n1 = X.rptScope('next', t); console.log('Next:', n1); if (/pediatri|plak/i.test(n1) || !/toplantı/.test(n1)) bad.push('next filter');
  const d1 = X.rptScope('dunitech', 'They asked for shoulder prostheses and an X-ray unit. Interested in our femoral nails. Sent the catalogue.'); console.log('Dunitech:', d1); if (/shoulder|X-ray/i.test(d1) || !/nails/.test(d1) || !/catalogue/.test(d1)) bad.push('dunitech filter');
  const n2 = X.rptScope('next', 'They want reverse shoulder prostheses and also plates. Meeting next week.'); console.log('Next keeps shoulder:', n2); /shoulder/.test(n2) || bad.push('keeps shoulder sentence');
  // a report summary: the AI is told the scope, and what it writes about other products is left out
  let ask = ''; const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { ask = JSON.parse(o.body || '{}').prompt || ''; return J({ text: "NOW: Very interested and asking for pediatric plates. We met online on 14 Oct and sent prices.\nLAST: They asked for pediatric plates on 20 Oct.\nNEXT: Send the shoulder catalogue.\nDONE: Online meeting and prices sent.\nYAPILAN: Online toplantı yaptık.\nTR: Çok ilgililer ve pediatrik plak talep ediyorlar. Fiyat ve kataloğu gönderdik.\nKISI: Ana" }); } return of(u, o); };
  const D = W.__cm2.rptData('next', 'lastmonth'); const r0 = D.rows.find((r) => r.iso) || D.rows[0]; r0.stage = 4; r0.status = 'Interested';
  await X.rptMakeAI({ ...D, rows: [ r0 ], force: true }); console.log('prompt scope:', /shoulder prostheses \(shoulder arthroplasty\) only/.test(ask), '| leave out other products:', /leave out anything about other products/.test(ask)); if (!/shoulder prostheses/.test(ask)) bad.push('prompt scope');
  const a = X.rptAIx('next')[r0.id] || {}; console.log('kept for Next:', JSON.stringify({ now: a.now, last: a.last, tr: a.tr })); if (/pediatri/i.test(`${a.now} ${a.last} ${a.tr}`) || !/sent prices/.test(a.now || '')) bad.push('summary filtered');
  const html = X.rptHTMLx({ ...D, rows: [ r0 ] }, 'Kavi'); console.log('report mentions pediatric:', /pediatri/i.test(html)); /pediatri/i.test(html) && bad.push('report html');
  const other = X.rptAIx('dunitech')[r0.id]; console.log('not shown in Dunitech’s report:', !other); other && bad.push('per brand');
  W.fetch = of;
  // team: only people the House set up
  const P = C.rowsOf('medint_people'); console.log('team list:', P.map((p) => p.name).join(', ') || '(empty in test data)');
  if (P.length) { console.log('outsider in team:', W.__cm2.inTeam('lesliedelapiedra@grupointersalud.com'), '| member:', W.__cm2.inTeam(P[0].name)); (W.__cm2.inTeam('lesliedelapiedra@grupointersalud.com') || !W.__cm2.inTeam(P[0].name)) && bad.push('inTeam'); }
  else { const ds = W.dash.data('medint_people'); ds.status = 'ok'; ds.data = [ { name: 'Luz', email: 'luz@kavikaplan.com', active: true } ]; console.log('outsider:', W.__cm2.inTeam('muhammet@endlog.com.tr'), '| Luz:', W.__cm2.inTeam('Luz'), '| me:', W.__cm2.inTeam('Kavi')); if (W.__cm2.inTeam('muhammet@endlog.com.tr') || !W.__cm2.inTeam('Luz') || !W.__cm2.inTeam('Kavi')) bad.push('inTeam'); }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
