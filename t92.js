// the Log's Days & goals tab shows its table as soon as the daily numbers arrive (website mode)
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500));
  const open = h.w.__cm2 && h.w.__cm2.openLog; if (!open) { console.log('openLog not exported'); console.log('errors 1'); process.exit(0); }
  open(h.d.body); await h.settle(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  const S = h.d.getElementById('cm-sheet'); const loading = /Loading/.test(S.textContent); const table = !!S.querySelector('table, .cm-days, .cm-dtab, [class*="days"]');
  console.log('Days tab after 0.3 s:', loading ? 'still Loading…' : 'shown', '| table:', table); console.log(`errors ${loading ? 1 : 0}`); process.exit(0); })();
