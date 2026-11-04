const { run } = require('./harness');
const calls = [];
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async (s, t, i) => { calls.push([t, i]); let out = { id: 'x', records: [] };
  if (t === 'filter_records' && i.folderId === '6682e9b8b6386800f586c0b0') out = { records: [{ id: 'P9', fields: { Name: 'Valerio Morisco', Label: [] } }] };
  if (t === 'list_record_timeline' && i.folderId === '6682e9b8b6386800f586c0b0') out = { events: [{ id: 'E9', timeISO: new Date().toISOString(), type: 'chat', chat: { name: '39333' } }] };
  if (t === 'get_record_timeline_item') out = { messages: [{ incoming: true, body: 'Please send the reverse shoulder price list', time: Date.now() }] };
  return { content: [{ type: 'text', text: JSON.stringify(out) }] }; } } : n === 'sample' ? async (p) => { global.__prompt = p; return { text: 'They asked for the reverse shoulder price list; we will send it.' }; } : null });
const CO = '6908ae29847fe001cd52bfef';
(async () => { const h = run({ params: { iso: 'CL', view: 'company', cid: CO, tags: ['chile'], ours: 'next' }, claude }); h.d.dispatchEvent(new h.w.Event('pointerdown')); await new Promise((r) => setTimeout(r, 450)); h.w.dash.setParams({ view: 'company', cid: CO, iso: 'CL', tags: ['chile'] }); await h.settle(); await h.settle(); await new Promise((r) => setTimeout(r, 300));
  h.w.confirm = () => true; h.d.querySelector('#company-people .cm-pedit').click(); await h.settle(); const del = h.d.querySelector('#cm-sheet .cm-pdel'); console.log('delete in edit form:', !!del); del.click(); await h.settle(300);
  console.log('deleted:', JSON.stringify((calls.find((c) => c[0] === 'delete_record') || [, {}])[1]));
  // AI summary reads people's chats
  const D = h.w.__cm2.rptData('next', 'lastmonth'); if (D && D.rows.length) { D.rows[0].stage = 4; await h.w.__cm2.rptMakeAI({ ...D, rows: [D.rows[0]] }); console.log('prompt reads the chat:', /reverse shoulder price list/.test(global.__prompt || '')); } else console.log('no report rows');
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
