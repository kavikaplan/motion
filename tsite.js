const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  h.w.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'] }); await h.settle(); await new Promise((r) => setTimeout(r, 1500));
  const api = h.calls.filter((c) => c[0] === 'fetch').map((c) => c[1].split('?')[0]); const u = {}; api.forEach((x) => { u[x] = (u[x] || 0) + 1; });
  console.log('website mode:', typeof h.w.cmBoot, '| /api calls:', JSON.stringify(u)); console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
