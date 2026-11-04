// exchange rate next to the currency on the country page
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); const of = h.w.fetch; h.w.fetch = async (u, o) => String(u).startsWith('/api/fx') ? new Response(JSON.stringify({ rates: { USD: 1, PAB: 1, CLP: 945.24 }, updated: '' + new Date().toUTCString() + '' })) : of(u, o);
  await h.settle(); await new Promise((r) => setTimeout(r, 1500));
  const show = async (iso, tag) => { h.w.dash.setParams({ view: 'country', iso, tags: [tag] }); await h.settle(); await new Promise((r) => setTimeout(r, 900)); await h.settle(); const g = [...h.d.querySelectorAll('#glance .g')].find((x) => x.querySelector('.cm-fx')); return g ? g.textContent : (h.d.querySelector('#glance') || {}).textContent; };
  const cl = await show('CL', 'chile'); const pa = await show('PA', 'panama'); console.log('Chile:', cl, '| Panama:', pa);
  console.log(`errors ${h.errors.length + (/1 USD = 945 CLP/.test(cl) && /1 USD = 1 PAB/.test(pa) ? 0 : 1)}`); process.exit(0); })();
