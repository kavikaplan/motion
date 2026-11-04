const { run } = require('./harness');
const calls = [];
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async (s, t, i) => { calls.push([t, i]); return { content: [{ type: 'text', text: t === 'filter_records' && i.folderId === '6ad6c66c23cd83301a3640da' ? '{"records":[]}' : '{"id":"x"}' }] }; } } : null });
(async () => {
  const h = run({ params: { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next', ctab: 'companies' }, claude }); await h.settle(); h.w.dash.data('contact_history'); h.w.dash.data('medint_ignore'); await h.settle(); await h.settle();
  const $ = (s) => h.d.querySelector(s); const $$ = (s) => [...h.d.querySelectorAll(s)];
  console.log('main button:', $('.cm-goto-markets').textContent);
  $('.cm-phtop').click(); await h.settle(); await h.settle(); for (let i = 0; i < 40 && h.d.querySelector('#cm-sheet .cm-phload'); i++) await h.settle(150); /* the loading card shows until the company is complete */ console.log('queue:', $('#cm-sheet-title').textContent.slice(0, 40));
  const ig = $$('#cm-sheet .cm-mini').find((b) => /Ignore/.test(b.textContent)); ig.click(); await h.settle(); $$('#cm-menu button').find((b) => /3 months/.test(b.textContent)).click(); await h.settle(300);
  const c = calls.find((x) => x[0] === 'create_record' && x[1].folderId === '6ad6c66c23cd83301a3640da'); console.log('shared ignore:', c && JSON.stringify(c[1].fields).slice(0, 160));
  console.log('queue after:', $('#cm-sheet-title').textContent.slice(0, 40));
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0);
})();
