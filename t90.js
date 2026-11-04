const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  ['tender_awards', 'registrations', 'tender_suppliers', 'moh_leads', 'congress_companies'].forEach((d) => h.w.dash.data(d)); await h.settle(); await new Promise((r) => setTimeout(r, 600));
  h.w.dash.setParams({ view: 'country', iso: 'PE', tags: ['peru'], ctab: 'overview' }); h.w.__cm3 && h.w.__cm3.resOn && h.w.__cm3.resOn(); await h.settle(); await new Promise((r) => setTimeout(r, 400)); await h.settle(); await h.settle(); await new Promise((r) => setTimeout(r, 3500)); await h.settle();
  const tab = h.d.querySelector('#country-view .cm-tabs .cm-nhtab'); console.log('tab:', tab && tab.textContent, '| tabs:', [...h.d.querySelectorAll('#country-view .cm-tabs > *')].map((x) => x.textContent.trim().slice(0, 22)).join(' | '));
  const top = h.d.querySelector('.cm-nhbtn'); console.log('top button:', top && top.textContent);
  h.w.dash.setParams({ view: 'home' }); await h.settle(); h.w.__cm3.openLeadsPicker(h.d.body); await new Promise((r) => setTimeout(r, 400)); await h.settle();
  const S = h.d.getElementById('cm-sheet'); console.log('picker:', (S.querySelector('p.mut') || {}).textContent?.slice(0, 140)); console.log('top rows:', [...S.querySelectorAll('.cm-nhrow')].slice(0, 6).map((r) => r.textContent).join(' | '));
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
