// a country's Power hour only shows companies of that country (before: Uruguay showed "1 of 25" filled with Chilean companies)
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { iso: 'UY', view: 'country', tags: ['uruguay'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle();
  h.w.dash.setParams({ view: 'country', iso: 'UY', tags: ['uruguay'] }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); await h.settle(); console.log('view:', h.w.dash.params().view);
  h.w.__cm2.openPowerHour(h.d.body); await new Promise((r) => setTimeout(r, 1500)); await h.settle();
  const t = (h.d.getElementById('cm-sheet-title') || {}).textContent || ''; const flag = (h.d.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent || '';
  const bad = /🇨🇱|HELICO/.test(flag); console.log('title:', t.slice(0, 60), '| first:', flag.slice(0, 40) || '(none)', '| hint:', ((h.d.querySelector('#cm-sheet .hint') || {}).textContent || '').slice(0, 60));
  console.log(`errors ${h.errors.length + (bad ? 1 : 0)}`); process.exit(0); })();
