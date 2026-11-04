const { run } = require('./harness');
const calls = [];
const claude = () => ({ use: async (n) => n === 'mcp' ? { callTool: async (s, t, i) => { calls.push([t, i]); return { content: [{ type: 'text', text: '{"id":"x"}' }] }; } } : n === 'sample' ? Object.assign(async () => ({ text: 'Hello, when are you visiting us?' }), {}) : null });
(async () => {
  const h = run({ params: { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next', ctab: 'companies' }, claude }); await h.settle(); h.w.dash.data('medint_people'); h.w.dash.data('contact_history'); await h.settle(); await h.settle();
  const $ = (s) => h.d.querySelector(s); const $$ = (s) => [...h.d.querySelectorAll(s)];
  $('.cm-phtop').click(); await h.settle(); await h.settle(); for (let i = 0; i < 40 && h.d.querySelector('#cm-sheet .cm-phload'); i++) await h.settle(150); /* the loading card shows until the company is complete */
  console.log('header selects:', $$('#cm-sheet .sh .cm-phctl select').map((s) => [...s.options].map((o) => o.textContent).join('/')).join(' | '));
  console.log('old chips gone:', !$$('#cm-sheet .meta').some((m) => /For:|Whose companies/.test(m.textContent)));
  console.log('icons:', $$('#cm-sheet .cm-ico').map((x) => x.title).join(' | '));
  console.log('how text:', [...$$('#cm-sheet .meta')].map((m) => m.textContent).find((t) => /How did/.test(t)), '| outcomes:', $$('#cm-sheet .outc .cm-chip').map((b) => b.textContent).join(','));
  const tr = $('#cm-sheet .cm-phtr'); if (tr) { tr.click(); await h.settle(300); console.log('translated:', tr.parentElement.textContent); }
  [...$$('#cm-sheet .outc .cm-chip')].find((b) => /Comment/.test(b.textContent)).click();
  const nt = $('#cm-sheet .cm-phnotes'); console.log('placeholder:', nt.placeholder.slice(0, 40)); nt.value = 'Closed until 5 Jan'; nt.dispatchEvent(new h.w.Event('input'));
  [...$$('#cm-sheet .cm-btn')].find((b) => /Done/.test(b.textContent)).click(); await h.settle(300);
  console.log('saved:', calls.filter((c) => /create_record_comment|create_record_call_log/.test(c[0])).map((c) => c[0] + ': ' + c[1].text).join(' | '));
  const bs = $$('#cm-sheet .sh .cm-phctl select').pop(); bs.value = 'dunitech'; bs.dispatchEvent(new h.w.Event('change')); await h.settle();
  console.log('brand now:', [...$$('#cm-sheet .meta')].map((m) => m.textContent).find((t) => /status:/.test(t)));
  $('#cm-sheet .sx').click(); await h.settle(); h.w.__cm2.openLog($('.cm-phtop')); await h.settle(); await new Promise((r) => setTimeout(r, 50));
  console.log('ctl removed on other sheet:', !$('#cm-sheet .cm-phctl'));
  console.log('errors', h.errors.length, h.errors.join('\n').slice(0, 400));
  process.exit(0);
})();
