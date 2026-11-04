const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  h.w.dash.setParams({ view: 'country', iso: 'CO', tags: ['colombia'], ctab: 'companies', csub: 'partners', ours: 'next' }); await h.settle(); await h.settle();
  console.log('red tag CO:', (h.d.querySelector('.cm-nexttag') || {}).textContent);
  h.w.dash.setParams({ iso: 'CL', tags: ['chile'] }); await h.settle(); await h.settle(); console.log('red tag CL (none):', !!h.d.querySelector('.cm-nexttag'));
  h.w.__cm3.openBrands(h.d.body); await new Promise((r) => setTimeout(r, 300)); await h.settle(); const S = h.d.getElementById('cm-sheet'); console.log('brands:', (S.querySelector('.mut') || {}).textContent, '| rows:', S.querySelectorAll('.cm-brrow').length);
  [...S.querySelectorAll('.cm-btn')].find((b) => /Add brand/.test(b.textContent)).click(); await h.settle(); console.log('add form fields:', S.querySelectorAll('.cm-mlform input').length, S.querySelectorAll('.cm-mlform .cm-chip').length);
  const ps = h.w.__cm.rowsOf('pipeline_stages'); console.log('pipeline has category:', ps.length, ps[0] && 'category' in ps[0]);
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
