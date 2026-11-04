const { run } = require('./harness');
const rec = { id: '6908ae29847fe001cd52bfef', fields: { Name: 'Helico', Category: 'Ortho', Country: ['Chile'], City: ['Santiago'], Website: 'helico.cl', Status: 'Enriched Leads', 'NEXT Status': 'Drip1', Highlights: 'Ortho distributor', Address: '' } };
const updates = [];
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async (s, t, i) => { if (t === 'update_record' || t === 'create_record') updates.push([t, JSON.stringify(i.fields)]); return { content: [{ type: 'text', text: JSON.stringify(t === 'filter_records' && i.filter && i.filter.Email ? { records: [rec] } : { records: [] }) }] }; } } : null });
(async () => { const h = run({ params: { view: 'home', ours: 'next' }, claude }); await h.settle(); await new Promise((r) => setTimeout(r, 2500));
  h.w.cmBoot = { x: 1 }; const R = (o) => Promise.resolve({ ok: true, status: 200, json: async () => o });
  h.w.fetch = (u) => { u = String(u); if (u.startsWith('/api/leads')) return R({ ready: { apollo: true, snov: true }, domain: 'helico.cl', company: { source: 'Apollo', phone: '+56 2 2345 6789', linkedin: 'https://linkedin.com/company/helico', industry: 'Medical devices', employees: 40 }, emails: [{ source: 'Snov', email: 'ventas@helico.cl' }], people: [{ source: 'Apollo', id: 'p1', name: 'Ana Rojas', title: 'Gerente Comercial', email: '', canReveal: true }], errors: [] }); if (u.startsWith('/api/gmail/accounts')) return R({ accounts: [] }); return R({}); };
  h.w.__cm3.openEnrichQ(h.d.body); h.w.__cm.closeSheet && 0; await new Promise((r) => setTimeout(r, 300)); await h.settle();
  // choose Chile only
  const S = () => h.d.getElementById('cm-sheet'); const sel = S().querySelector('.cm-eqbar select'); [...S().querySelectorAll('.cm-eqbar .cm-chip.on')].forEach((c) => c.click()); await h.settle(); const s2 = S().querySelector('.cm-eqbar select'); s2.value = 'CL'; s2.dispatchEvent(new h.w.Event('change')); await new Promise((r) => setTimeout(r, 400)); await h.settle(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  console.log('grid:', !!S().querySelector('.cm-eqgrid'), '| info:', (S().querySelector('.cm-eqinfo') || {}).textContent?.slice(0, 220));
  console.log('leads:', (S().querySelector('.cm-eqleads') || {}).textContent?.slice(0, 260));
  const addPhone = [...S().querySelectorAll('.cm-eqleads .cm-enrow')].find((r) => /2345/.test(r.textContent)).querySelector('.cm-mini'); addPhone.click(); await new Promise((r) => setTimeout(r, 200));
  console.log('saved:', updates.map((u) => u.join(' ')).join(' | '));
  const lg = h.w.__cmLastLog || null; console.log('add form open:', S().querySelector('.cm-eqadd').open, '| person fields:', S().querySelectorAll('.cm-eqadd .cm-mlform input').length);
  const ta = S().querySelector('.cm-enr textarea'); ta.value = 'Contacto: Ing. Mario Pérez, Gerente Comercial — ventas@helico.cl · +56 2 2987 6543 · www.helico-medical.cl'; ta.dispatchEvent(new h.w.Event('input')); [...S().querySelectorAll('.cm-enr .cm-btn')].find((b) => /Read pasted/.test(b.textContent)).click(); await h.settle();
  console.log('pasted:', [...S().querySelectorAll('.cm-enr .cm-enrow')].map((r) => r.textContent.slice(0, 40)).join(' ; '));
  h.w.__cm.sheetDraw(); await h.settle(); console.log('after redraw kept:', (S().querySelector('.cm-enr textarea') || {}).value.slice(0, 20), '|', S().querySelectorAll('.cm-enr .cm-enrow').length);
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
