const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  ['tender_awards', 'registrations', 'tender_suppliers', 'moh_leads', 'congress_companies', 'company_index'].forEach((d) => h.w.dash.data(d)); await h.settle(); await new Promise((r) => setTimeout(r, 800));
  const t0 = Date.now(); h.w.__cm3.openLeadsPage('PE'); await h.settle(); await new Promise((r) => setTimeout(r, 500)); await h.settle(); const P = h.d.getElementById('cm-lp'); console.log('ms', Date.now() - t0);
  console.log('kpis:', [...P.querySelectorAll('.cm-lpk')].map((b) => b.textContent).join(' | '));
  console.log('suggest:', [...P.querySelectorAll('.cm-lpsug .sr span')].map((s) => s.textContent.slice(0, 90)).join(' || '));
  console.log('rows:', P.querySelectorAll('.cm-lprow').length, '| matches shown:', P.querySelectorAll('.cm-lpmatch').length, '| first match:', (P.querySelector('.cm-lpmatch') || {}).textContent?.slice(0, 140));
  const oc = [...P.querySelectorAll('.cm-lpfl .cm-chip')].find((b) => /Other specialty|🩺/.test(b.textContent)); if (oc) { oc.click(); await h.settle(); console.log('specialties:', [...h.d.querySelectorAll('#cm-lp .cm-lpfl.sub .cm-chip')].slice(0, 6).map((b) => b.textContent).join(' | ')); console.log('other chips:', [...h.d.querySelectorAll('#cm-lp .cm-qlchip.q-other')].slice(0, 4).map((b) => b.textContent).join(' | ')); }
  const t1 = Date.now(); h.w.__cm3.openLeadsPage(''); await h.settle(); console.log('all countries ms', Date.now() - t1, '| kpi', (h.d.querySelector('#cm-lp .cm-lpk') || {}).textContent);
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
