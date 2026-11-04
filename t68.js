const { run } = require('./harness');
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async () => ({ content: [{ type: 'text', text: '{"records":[]}' }] }) } : n === 'sample' ? async (p) => { global.__p = p; return { text: 'مرحبا أحمد،\nحابب أعرّفك على Next Shoulder' }; } : null });
(async () => { const h = run({ params: { view: 'home', ours: 'next' }, claude }); await h.settle(); await new Promise((r) => setTimeout(r, 400));
  let redrawn = 0; const it = { id: 'X1', __tpl: '' }; const first = h.w.__cm3.arDraft(it, 'Hello Ahmed, I would love to introduce Next Shoulder.', 'Ahmed', 'Next Shoulder', 'SA', 'Kavi', () => redrawn++);
  await new Promise((r) => setTimeout(r, 300)); const second = h.w.__cm3.arDraft(it, 'Hello Ahmed, I would love to introduce Next Shoulder.', 'Ahmed', 'Next Shoulder', 'SA', 'Kavi', () => redrawn++);
  console.log('first call (writing):', first, '| redrawn', redrawn, '| result has brand isolated:', /\u2068Next Shoulder\u2069/.test(second || ''), '| dialect asked:', /Saudi\/Gulf/.test(global.__p || ''), '| name in Arabic asked:', /first name "Ahmed" in Arabic script/.test(global.__p || ''));
  // status colours + waBack
  h.w.dash.setParams({ view: 'company', cid: '6908ae29847fe001cd52bfef', iso: 'CL', tags: ['chile'] }); await h.settle(); await h.settle(); await new Promise((r) => setTimeout(r, 200));
  console.log('status pills:', [...h.d.querySelectorAll('#company .cm-csub .cm-tag')].map((t) => `${t.textContent}=${t.dataset.st}`).join(' | '));
  h.w.__cm.markNoWa('+56 9 1234 5678'); await h.settle(); console.log('↺ shown for marked number:', h.d.querySelectorAll('.cm-waback').length > 0, '| ⋯ list item:', h.w.__cm3.moreExtra().map((x) => x[0]).join(','));
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
