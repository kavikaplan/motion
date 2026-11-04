// Power hour, tidier: 🔎 Find contacts on the name line and opening on the side · status + category as small boxes on the meta line (no labels, no “· ·”)
// · ↻ Call again next to the NetHunt icon · “Message draft: English Türkçe Español 📋” right above the draft · no “Invalid Date” · Medint AI hides empty “said last / open requests”
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // AI summary lines that say nothing are hidden
  const E = X.brEmpty; const cases = [ [ 'What they said last: No one from them. Last touch was our call on 27 Oct.', !0 ], [ 'Open requests: None from them. Our plan is to send the portfolio.', !0 ], [ 'What they said last: Ana asked for prices on 20 Oct.', !1 ], [ 'Open requests: They want the catalogue in Spanish.', !1 ], [ 'Where we stand: none yet', !1 ] ];
  cases.forEach(([l, want]) => { const got = E(l); console.log(got ? 'hide' : 'show', '|', l); got !== want && bad.push(`brEmpty: ${l.slice(0, 30)}`); });
  // Power hour
  W.dash.setParams({ view: 'country', iso: 'CO', tags: [ 'colombia' ], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(400); W.__cm2.openPowerHour(D.body); await wait(1200); await h.settle(); await wait(50);
  const S = D.getElementById('cm-sheet'); const who = S.querySelector('.cm-phwho'); const am = S.querySelector('.cm-addmiss'); console.log('🔎 on the name line:', !!(am && am.parentElement === who)); if (!am || am.parentElement !== who) bad.push('find contacts on name line');
  const mt = S.querySelector('.cm-phmeta'); console.log('meta line:', mt && mt.textContent.replace(/\s+/g, ' ').slice(0, 120), '| first:', mt && mt.firstElementChild && mt.firstElementChild.className);
  if (mt && S.querySelector('select.cm-phstat-nm') && mt.firstElementChild !== S.querySelector('select.cm-phstat-nm')) bad.push('status first on meta line');
  const cat = S.querySelector('select.cm-phcat'); console.log('category box:', cat ? cat.parentElement.className : '(no category options in test data)'); if (cat && cat.parentElement !== mt) bad.push('category next to status'); if (/Category:/.test(S.textContent)) bad.push('no Category label');
  mt && /·\s*·/.test(mt.textContent) && bad.push('double dot');
  /Invalid Date/.test(S.textContent) && bad.push('Invalid Date');
  const qa = S.querySelector('.cm-phagain'); const nh = S.querySelector('a.cm-ico[href*="nethunt"]'); console.log('call again after NetHunt icon:', !!(qa && nh && nh.nextElementSibling === qa)); if (qa && nh && nh.nextElementSibling !== qa) bad.push('call again by NetHunt');
  const dr = S.querySelector('textarea.cm-phdraft:not(.cm-phnotes)'); const hd = dr && dr.previousElementSibling; console.log('above the draft:', hd && hd.textContent.replace(/\s+/g, ' ').slice(0, 60)); if (dr && (!hd || !/draft:/i.test(hd.textContent))) bad.push('message draft line above the draft');
  // 🔎 opens on the side, Power hour stays open; ✕ closes; closing Power hour closes it
  am.click(); await h.settle(); let sd = D.querySelector('.cm-fcside'); console.log('side panel:', !!sd, sd && sd.querySelector('.cm-fcsh').textContent, '| PH open:', !S.hidden && /^⚡/.test(D.getElementById('cm-sheet-title').textContent), '| body class:', D.body.classList.contains('cm-fcopen'));
  if (!sd || !sd.querySelector('.cm-fc, .cm-enr') || S.hidden) bad.push('side panel');
  sd && sd.querySelector('.cm-fc input, .cm-enr input') && sd.querySelector('.cm-fc input, .cm-enr input').dispatchEvent(new W.MouseEvent('pointerdown', { bubbles: true })); sd && sd.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await h.settle(); console.log('click in panel keeps PH:', !S.hidden); S.hidden && bad.push('click in side panel closed Power hour');
  C.sheetDraw(); await h.settle(); console.log('after redraw, same panel:', D.querySelector('.cm-fcside') === sd); D.querySelector('.cm-fcside') !== sd && bad.push('panel survives redraw');
  sd.querySelector('.cm-fcsh .cm-mini').click(); await h.settle(); console.log('✕ closes:', !D.querySelector('.cm-fcside'), !D.body.classList.contains('cm-fcopen')); (D.querySelector('.cm-fcside') || D.body.classList.contains('cm-fcopen')) && bad.push('close');
  S.querySelector('.cm-addmiss').click(); await h.settle(); C.closeSheet(); await h.settle(); await wait(30); console.log('PH closed → panel gone:', !D.querySelector('.cm-fcside')); D.querySelector('.cm-fcside') && bad.push('panel with closed PH');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
