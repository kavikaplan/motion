const { run } = require('./harness');
const calls = [];
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async (s, t, i) => { calls.push([t, i]); let out = { records: [] };
  if (t === 'list_record_timeline') out = { events: [{ id: 'E1', type: 'chat', timeISO: new Date().toISOString(), chat: { name: '393478434464', provider: 'whatsapp-private' } }] };
  if (t === 'get_record_timeline_item') out = { messages: [{ incoming: false, body: 'Hi, sent the price list', time: Date.now() - 864e5 }, { incoming: true, body: 'Thanks. Can we meet on Friday? @83550183358520', time: Date.now() - 3600e3 }] };
  if (t === 'filter_records' && i.filter && i.filter['Phone number']) out = { records: [{ id: 'Z1', fields: { Name: 'Chilemed SpA', City: ['Santiago'], Category: 'Ortho', Priority: 1, Highlights: 'Big tender player' } }, { id: 'Z2', fields: { Name: 'Target Site', Category: 'Ortho' } }] };
  if (t === 'get_record') out = { id: i.recordId, fields: { Name: 'Helico', 'Next step': 'Send price list', Notes: 'Ortho distributor' } };
  return { content: [{ type: 'text', text: JSON.stringify(out) }] }; } } : n === 'sample' ? async (p) => { global.__last = p; return { text: /four lines/.test(p) ? 'Where we stand: Interested, prices sent.\nWhat they said last: Asked to meet Friday.\nOpen requests: meeting\nNext step: Confirm Friday.' : 'Hi Miguel, Friday works — 10:00? Kavi' }; } : null });
const CO = '6908ae29847fe001cd52bfef';
(async () => { const h = run({ params: { view: 'home', ours: 'next' }, claude }); await h.settle(); await new Promise((r) => setTimeout(r, 2700));
  h.w.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'companies', csub: 'partners' }); await h.settle(); await h.settle();
  const nb = h.d.querySelector('.cm-partner .cm-qi.note'); nb.click(); await h.settle(); await new Promise((r) => setTimeout(r, 500));
  const sum = h.d.querySelector('.cm-sum2'); console.log('AI summary auto:', sum && sum.querySelector('.cm-aisum').textContent.slice(0, 160));
  const up = sum.querySelector('.cm-aisum .cm-chip'); up.dispatchEvent(new h.w.MouseEvent('pointerdown', { bubbles: true })); up.click(); await new Promise((r) => setTimeout(r, 400)); console.log('still open after Update:', !!h.d.querySelector('.cm-sum2'));
  // Enrich
  h.w.__cm.closeSheet(); h.d.querySelector('.cm-enrtop').click(); await h.settle(); await new Promise((r) => setTimeout(r, 400)); await h.settle();
  console.log('Enrich:', (h.d.getElementById('cm-sheet-title') || {}).textContent, '| chips:', [...h.d.querySelectorAll('.cm-eqbar .cm-chip.on')].map((x) => x.textContent).join(','), '| card:', (h.d.querySelector('.cm-eqcard .who') || {}).textContent, '| links:', h.d.querySelectorAll('.cm-eqlinks a').length, '| panel:', !!h.d.querySelector('.cm-eqcard .cm-enrich, .cm-eqcard textarea'));
  // Power hour AI draft + quote
  h.w.__cm.closeSheet(); h.w.dash.setParams({ view: 'company', cid: CO, iso: 'CL', tags: ['chile'] }); await h.settle(); await h.settle(); h.d.querySelector('.cm-cph').click(); await h.settle(); await new Promise((r) => setTimeout(r, 600)); await h.settle();
  console.log('PH draft:', (h.d.querySelector('#cm-sheet .cm-phdraft') || {}).value, '| quote:', (h.d.querySelector('#cm-sheet .msg') || {}).textContent);
  console.log('company sub-line:', (h.d.querySelector('#company .cm-csub') || {}).textContent.slice(0, 80));
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
