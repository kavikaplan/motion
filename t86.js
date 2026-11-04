const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  h.w.dash.setParams({ view: 'country', iso: 'PA', tags: ['panama'] }); await h.settle(); h.w.cmOpenBrand('CONMED'); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); await h.settle();
  const c = h.d.querySelector('#brand-view .cm-brprof'); console.log('card:', !!c, c && c.textContent.slice(0, 260));
  console.log('fields:', c && c.querySelectorAll('input').length, '| seg chips:', c && c.querySelectorAll('.cm-brside .cm-chip').length);
  h.w.dash.setParams({ view: 'country', iso: 'PA', tags: ['panama'], ctab: 'overview' }); await h.settle(); await new Promise((r) => setTimeout(r, 600)); const t = h.d.querySelector('.cm-trtar'); if (t) { t.dispatchEvent(new h.w.MouseEvent('mouseover', { bubbles: true })); console.log('tip:', (h.d.querySelector('.cm-tip') || {}).textContent?.slice(0, 80)); } else console.log('no tariff chip');
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
