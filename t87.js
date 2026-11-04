const { run } = require('./harness');
(async () => { const h = run({ params: { iso: 'UY', view: 'country', tags: ['uruguay'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle();
  h.w.__cm2.openPowerHour(h.d.body); await new Promise((r) => setTimeout(r, 900)); await h.settle();
  const t = (h.d.getElementById('cm-sheet-title') || {}).textContent; const b = h.d.querySelector('#cm-sheet .hint'); const hd = h.d.querySelector('#cm-sheet .cm-phhd, #cm-sheet .cm-phtop'); console.log('title:', t, '| first:', (h.d.querySelector('#cm-sheet .cm-phwho') || {}).textContent?.slice(0, 60), '| hint:', b && b.textContent.slice(0, 60));
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
