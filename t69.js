const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2700));
  h.w.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'companies', csub: 'partners' }); h.w.dash.data('contact_history'); await h.settle(); await h.settle();
  const P = h.w.__cm.rowsOf('partners'); const cats = {}; P.forEach((p) => { cats[p.category || '(none)'] = (cats[p.category || '(none)'] || 0) + 1; }); console.log('categories:', JSON.stringify(cats));
  const x = P.filter((p) => !p.cat_ok && !p.ortho_rel); console.log('not ortho-related:', x.length, x.slice(0, 3).map((p) => `${p.company}(${p.category}) score ${p.score_next}`).join('; '));
  console.log('rows shown:', h.d.querySelectorAll('.cm-partner').length);
  h.d.querySelector('.cm-phbtn').click(); await h.settle(); await h.settle(); console.log('PH status pill:', (h.d.querySelector('#cm-sheet .cm-stpill') || {}).outerHTML, '| category select:', !!h.d.querySelector('#cm-sheet .cm-phcat'), '| status select st:', (h.d.querySelector('#cm-sheet select.cm-phstat:not(.cm-phcat)') || {}).dataset && h.d.querySelector('#cm-sheet select.cm-phstat:not(.cm-phcat)').dataset.st);
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
