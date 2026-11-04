const { run } = require('./harness');
(async () => {
  const h = run({ params: { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next', ctab: 'companies', psort: 'status' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2700)); h.w.dash.setParams({ view: 'country', iso: 'CL', ctab: 'companies' }); h.w.dash.data('contact_history'); await h.settle(); await h.settle();
  const $ = (s) => h.d.querySelector(s); const $$ = (s) => [...h.d.querySelectorAll(s)];
  $$('.cm-partner').slice(0, 4).forEach((r) => console.log(r.querySelector('.pn').textContent.slice(0, 28).padEnd(28), '|', r.querySelector('.cm-next') ? r.querySelector('.cm-next').textContent : '-', '|', r.querySelector('.cm-pend') ? r.querySelector('.cm-pend').textContent : '', '|', r.querySelector('.cm-lc .w').textContent, '|', r.querySelector('.pl').textContent, '|', r.querySelector('.cm-person') ? 'PERSON' : ''));
  console.log('icons in first row:', [...$('.cm-partner .cm-qa').children].map((c) => c.className.replace('cm-qi ', '')).join(','));
  $('.cm-psort').click(); await h.settle(); console.log('sort menu:', $$('#cm-menu button').map((b) => b.textContent.slice(0, 18)).join(' | '));
  h.setParams({ pcity: 'Santiago' }); await h.settle(); console.log('city chosen → place:', $('.cm-partner .pl').textContent);
  $('.cm-pfit').click(); await h.settle(); console.log('fit menu:', $$('#cm-menu button').map((b) => b.textContent.slice(0, 22)).join(' | '));
  console.log('errors', h.errors.length, h.errors.join('\n').slice(0, 500));
  process.exit(0);
})();
