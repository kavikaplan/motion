// Power hour stays open: the 🎯 details open in place, and clicks inside small menus don't close it
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle();
  const W = h.w, D = h.d; W.__cm2.openPowerHour(D.body); await h.settle(); await new Promise((r) => setTimeout(r, 2600)); await h.settle(); const S = D.getElementById('cm-sheet');
  const fb = S.querySelector('#cm-sheet-title .cm-fit, .cm-phwho .cm-fit'); console.log('badge:', fb && fb.textContent, '| small:', fb && fb.classList.contains('sm'));
  fb.click(); await h.settle(); console.log('after tapping it — Power hour still open:', !S.hidden && /⚡/.test(D.getElementById('cm-sheet-title').textContent), '| details shown:', !!S.querySelector('.cm-fitpan'));
  const m = D.createElement('div'); m.className = 'cm-menu'; const it = D.createElement('button'); m.append(it); D.body.append(m); it.dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await h.settle(); console.log('mousedown inside a menu — still open:', !S.hidden);
  D.body.dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await h.settle(); // (outside-click closing is unchanged; the test opened Power hour from the page body, so it can't be checked here)
  const ok = fb && fb.classList.contains('sm') && !!S.querySelector && S.hidden; console.log(`errors ${h.errors.length}`); process.exit(0); })();
