// Motion report scope · Power hour / AI only use this company's events · 📧 tap an email row → that email · 🎯 My goal card (hours, pace, exact number)
// · 🧳 congresses + trade fairs in trip planning (add to trip from the event, fit my stop, ✈ flights) · ☑ task rows with icons · 🎯 score edited by picking evidence
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3, Y = W.__cm2; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Motion: everything except shoulder prostheses and nails
  const mt = X.rptScope('motion', 'They import locking plates from Germany. They also sell shoulder prostheses. Intramedullary nails come from China. Spine cages too.'); console.log('motion scope:', mt);
  if (/shoulder|nails/i.test(mt) || !/plates/.test(mt) || !/Spine/.test(mt)) bad.push('motion scope');
  // 📧 email rows open the email
  const li = D.createElement('li'); li.innerHTML = '<span class="h"><b>Re: offer</b></span><button class="x">reply</button>'; D.body.append(li); X.mailRowClick(li, { type: 'email', title: 'Re: offer', rid: 'c1' });
  const R0 = W.Response || globalThis.Response; const JJ = (o) => new R0(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); const of0 = W.fetch; const got = [];
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/gmail/')) got.push(u); if (u.startsWith('/api/gmail/accounts')) return JJ({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [] } ] }); if (u.startsWith('/api/gmail/find')) return JJ({ mailbox: 'hi@kavikaplan.com', threadId: 'th9' }); if (u.startsWith('/api/gmail/thread')) return JJ({ id: 'th9', messages: [ { id: 'm1', from: 'Ana <ana@x.cl>', to: 'hi@kavikaplan.com', subject: 'Re: offer', date: Date.now(), text: 'Thanks, send prices', mine: false } ] }); if (u.startsWith('/api/gmail/')) return JJ({}); return of0(u, o); };
  const ow = W.open; let opened = 0; W.open = () => { opened++; return null; }; li.querySelector('button').click(); await wait(50); const o1 = got.length; li.click(); await wait(300); await h.settle(); await wait(100); W.open = ow;
  const shT = (D.getElementById('cm-sheet-title') || {}).textContent || ''; const subjEl = D.querySelector('#cm-sheet .cm-ibsubj'); console.log('email row:', li.classList.contains('cm-evmail'), '| button click looks up email:', o1, '| row click → sheet:', shT, '| subject:', subjEl && subjEl.textContent, '| new tabs:', opened, '| thread loaded:', got.some((u) => /gmail\/thread\?.*th9/.test(u)));
  if (!li.classList.contains('cm-evmail') || o1 || opened || !/Inbox/.test(shT) || !subjEl || !/offer/.test(subjEl.textContent) || !got.some((u) => /thread\?.*th9/.test(u))) bad.push('email row → Medint inbox');
  W.fetch = of0; C.closeSheet();
  const li2 = D.createElement('li'); X.mailRowClick(li2, { type: 'call' }); li2.classList.contains('cm-evmail') && bad.push('call row is not an email'); li.remove();
  // 🎯 My goal card
  Y.setPlan(3, !1, 0); await h.settle(); console.log('goal from hours:', Y.myGoal(Y.planToday()), '(pace', Y.myPace(), ')'); Y.myGoal(Y.planToday()) !== 3 * Y.myPace() && bad.push('goal = hours × pace');
  Y.setPlan(3, !1, 25); await h.settle(); console.log('exact goal:', Y.myGoal(Y.planToday())); Y.myGoal(Y.planToday()) !== 25 && bad.push('exact goal');
  const lg = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].fields && /plan:/.test(JSON.stringify(c[2].fields))).pop() || h.calls.filter((c) => /plan: 3 h · 25/.test(JSON.stringify(c))).pop(); console.log('logged:', !!lg);
  W.dash.setParams({ view: 'home' }); await h.settle(); await wait(300); Y.drawHome(); await h.settle(); const gc = D.querySelector('#home-view .cm-hmgoal'); console.log('goal card:', gc && gc.textContent.replace(/\s+/g, ' ').slice(0, 140));
  if (!gc || !gc.querySelector('.cm-goalin') || gc.querySelector('.cm-goalin').value !== '25' || !/My pace/.test(gc.textContent)) bad.push('goal card');
  // ☑ task rows: icon by kind, flag + company pill, due pill
  const today = new Date().toISOString().slice(0, 10); W.cmAddTask ? 0 : 0;
  const ks = [ [ '💬 Send WhatsApp to confirm price', 'wa' ], [ 'Call Juan about the tender', 'call' ], [ 'Email the catalogue', 'mail' ], [ 'Prepare INVIMA registration dossier', 'reg' ], [ 'Confirm dispatch of the order', 'ship' ], [ 'Think about it', 'gen' ] ];
  // taskRow is internal: build rows through the tasks panel API if there, else check the kind map through a rendered panel
  const rowsOk = ks.map(([t, k]) => { const host = D.createElement('div'); D.body.append(host); const r = X.taskRowX ? X.taskRowX({ id: `t${k}`, text: t, due: '2020-01-01', cid: '', company: '' }, () => {}) : null; if (r) host.append(r); const ic = r && r.querySelector('.cm-tkic'); const ok = !!ic && ic.classList.contains(`k-${k}`); host.remove(); return [ k, ok, r && r.querySelector('.cm-tkdue').className ]; });
  console.log('task icons:', rowsOk.map(([k, ok]) => `${k}:${ok ? '✓' : '✗'}`).join(' '), '| late pill:', rowsOk[0][2]); if (rowsOk.some(([, ok]) => !ok) || !/late/.test(rowsOk[0][2] || '')) bad.push('task icons');
  // 🧳 trips: fairs are in the planner's events, a congress or fair can start a trip
  W.dash.data('exhibitions'); W.dash.data('congresses'); await h.settle(); await wait(500); await h.settle();
  const EV = X.tpEvents(); const fx = EV.filter((e) => e.fair); console.log('trip events:', EV.length, '| fairs among them:', fx.length); fx.length || bad.push('fairs in trips');
  const fair = fx.find((e) => e.start >= today && e.city) || fx[0]; const before = (C.tripPlans || []).length;
  const btn = X.tripAddBtn({ series: fair.series, iso: fair.iso, city: fair.city, start: fair.start, end: fair.end }); D.body.append(btn); btn.click(); await h.settle(); const pop = D.querySelector('.cm-tpadd'); console.log('trip pop:', pop && pop.textContent.replace(/\s+/g, ' ').slice(0, 160));
  if (!pop || !pop.querySelector('a[href*="google.com/travel/flights"]')) bad.push('trip pop + flights');
  [ ...pop.querySelectorAll('button') ].find((b) => /New trip around it/.test(b.textContent)).click(); await h.settle(); await wait(300); await h.settle();
  const T = (C.tripPlans || []); const nt = T[T.length - 1]; console.log('new trip:', nt && `${nt.name} · start ${nt.start} · legs ${JSON.stringify(nt.legs)}`, '| view', W.dash.params().view);
  if (T.length !== before + 1 || nt.legs[0].iso !== fair.iso || nt.start >= fair.start || W.dash.params().view !== 'trips') bad.push('new trip from fair');
  // add a second event to that trip
  const cg = EV.find((e) => !e.fair && e.start >= today && e.iso !== fair.iso); if (cg) { const b2 = X.tripAddBtn(cg); D.body.append(b2); b2.click(); await h.settle(); const p2 = D.querySelector('.cm-tpadd'); const add = [ ...p2.querySelectorAll('button') ].find((b) => b.textContent.includes(nt.name)); console.log('add to existing trip offered:', !!add); if (add) { add.click(); await h.settle(); await wait(200); const t2 = C.tripPlans.find((p) => p.id === nt.id); console.log('legs now:', t2.legs.map((l) => l.iso).join(' → ')); t2.legs.length !== 2 && bad.push('add to trip'); } else bad.push('add to trip offered'); b2.remove(); }
  btn.remove();
  // the congresses page has 🧳 on upcoming congresses; the fairs tab too
  W.dash.setParams({ view: 'congresses' }); await h.settle(); await wait(300); W.cmCongressTab && W.cmCongressTab('events'); await h.settle(); await wait(200); const cb = [ ...D.querySelectorAll('#congress-view .cm-cgcard button') ].filter((b) => /🧳/.test(b.textContent)).length; console.log('🧳 on congress cards:', cb); cb || bad.push('congress trip buttons');
  W.cmCongressTab && W.cmCongressTab('fairs'); await h.settle(); await wait(300); await h.settle(); const fb = [ ...D.querySelectorAll('#congress-view .cm-fxcard button') ].filter((b) => /🧳/.test(b.textContent)).length; console.log('🧳 on fair cards:', fb); fb || bad.push('fair trip buttons');
  // 🎯 score by picking evidence
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(300); await h.settle();
  const P = C.rowsOf('partners'); const r0 = P.find((r) => (r.score_all ?? null) != null && r.id && r.pts_imp < 25) || P[0]; const p = (() => { const k = C.oursKey(); return C.OURS[k] && C.OURS[k].all ? 'all' : k; })(); const s0 = r0[`score_${p}`]; const i0 = r0.pts_imp;
  const a = D.createElement('button'); D.body.append(a); X.scoEdit(a, r0.id); const pan = D.querySelector('.cm-scpan'); console.log('editor:', pan && pan.textContent.replace(/\s+/g, ' ').slice(0, 200));
  if (!pan || pan.querySelector('input[type=range]') || pan.querySelector('.cm-scnum') || pan.querySelectorAll('.cm-scpart').length !== 5) bad.push('editor parts, no slider');
  const big = [ ...pan.querySelectorAll('.cm-scpart') ].find((x) => /Imports/.test(x.textContent)); [ ...big.querySelectorAll('.cm-chip') ].find((b) => /Big importer/.test(b.textContent)).click(); const tot = Number(pan.querySelector('.cm-sctot').textContent); console.log('imports → big importer: total', s0, '→', tot); tot !== Math.min(100, s0 - i0 + 25) && bad.push('total follows');
  const op = [ ...pan.querySelectorAll('.cm-scpart') ].find((x) => /Ortho evidence/.test(x.textContent)); [ ...op.querySelectorAll('.cm-chip') ].find((b) => /Not ortho/.test(b.textContent)).click(); const tot2 = Number(pan.querySelector('.cm-sctot').textContent); console.log('not ortho → total', tot2); tot2 > tot && bad.push('not ortho');
  [ ...pan.querySelectorAll('button') ].find((b) => b.textContent === 'Save').click(); await wait(150);
  console.log('saved:', r0[`score_${p}`], '| imports part now', r0.pts_imp, '| ortho part', r0.pts_ortho); if (r0[`score_${p}`] !== tot2 || r0.pts_imp !== 25 || r0.pts_ortho !== 0) bad.push('saved parts');
  const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment' && c[2].recordId === r0.id).pop(); console.log('NetHunt note:', cm && cm[2].text.replace(/\n/g, ' | ')); (!cm || !/Big importer/.test(cm[2].text)) && bad.push('note');
  const cat = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record' && c[2].recordId === r0.id && c[2].fields && c[2].fields.Category === 'Not Ortho').length; console.log('Not Ortho saved in NetHunt:', cat); cat || bad.push('not ortho to NetHunt');
  // the Best partners list score opens the same editor
  const sc = D.querySelector('.cm-partner .sc'); sc && sc.click(); await h.settle(); console.log('list score → editor:', !!D.querySelector('.cm-scpan.float')); sc && !D.querySelector('.cm-scpan.float') && bad.push('list score opens editor');
  D.querySelectorAll('.cm-scpan').forEach((x) => x.remove());
  X.SCO.set(`${r0.id}|${p}`, { ...X.SCO.get(`${r0.id}|${p}`), off: 1 }); X.scoApply(); const r1 = C.rowsOf('partners').find((r) => r.id === r0.id); console.log('reset:', r1 === r0, r1[`score_${p}`], s0, r1.pts_imp, i0); (r1[`score_${p}`] !== s0 || r1.pts_imp !== i0) && bad.push('reset restores parts');
  a.remove();
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
