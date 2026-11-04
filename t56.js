const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2700));
  h.w.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'companies', csub: 'partners', psort: 'next' }); h.w.dash.data('contact_history'); await h.settle(); await h.settle(); await new Promise((r) => setTimeout(r, 200)); await h.settle();
  const $$ = (s) => [...h.d.querySelectorAll(s)];
  console.log('sort label:', (h.d.querySelector('.cm-psort') || {}).textContent);
  console.log('rows:', $$('.cm-partner').slice(0, 5).map((r) => `${r.querySelector('.pn').textContent.slice(0, 22)} [${(r.querySelector('.cm-why') || {}).textContent || '-'}]`).join(' | '));
  h.d.querySelector('.cm-phbtn').click(); await h.settle(); await h.settle(); const first = (h.d.getElementById('cm-sheet-title') || {}).textContent; console.log('PH first:', first.slice(0, 60), '| list first:', $$('.cm-partner')[0].querySelector('.pn').textContent.slice(0, 30), '| PH company:', (h.d.querySelector('#cm-sheet .cm-ph h3, #cm-sheet .cm-phname, #cm-sheet h2') || {}).textContent);
  h.w.__cm.closeSheet(); await h.settle();
  // fit filter → Power hour follows
  h.w.dash.setParams({ pfit: 'fit' }); await h.settle(); await h.settle(); console.log('fit rows:', $$('.cm-partner').length);
  // row action → outcome bar
  const wa = $$('.cm-partner a[href*="wa.me"]')[0]; if (wa) { h.w.__cm.uiFlags = { ...(h.w.__cm.uiFlags || {}), aiDrafts: false }; wa.addEventListener('click', (e) => e.preventDefault(), { once: true }); wa.click(); for (let i = 0; i < 25 && !h.d.querySelector('.cm-rowout'); i++) await new Promise((r) => setTimeout(r, 200)); console.log('outcome bar:', !!h.d.querySelector('.cm-rowout'), (h.d.querySelector('.cm-rowout') || {}).textContent.slice(0, 80)); } else console.log('no row action link');
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
