const { run } = require('./harness');
(async () => {
  const cl = { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next' };
  const h = run({ params: cl });
  await h.settle();
  const $ = (s) => h.d.querySelector(s);
  console.log('errors after load:', h.errors.length); h.errors.slice(0,5).forEach((e) => console.log(e.slice(0, 600)));
  console.log('follow badge', $('.cm-tb-follow .cm-badge').textContent, '| new badge', $('.cm-tb-new .cm-badge').textContent, '| leads', $('.cm-newleads').textContent);
  console.log('ourpos rows', h.d.querySelectorAll('.cm-pos').length, h.d.querySelector('.cm-ourpos') && h.d.querySelector('.cm-ourpos').textContent.slice(0, 300));
  const open = async (sel, label) => { $(sel).click(); await h.settle(); const sh = $('#cm-sheet'); console.log(`\n== ${label}: hidden=${sh.hidden} title=${$('#cm-sheet-title').textContent}`); console.log($('.sb', sh) && $('#cm-sheet .sb').textContent.slice(0, 500)); console.log('items', h.d.querySelectorAll('#cm-sheet .cm-pi, #cm-sheet .cm-lead, #cm-sheet tr').length); };
  await open('.cm-tb-follow', 'follow');
  await open('.cm-tb-new', 'changes');
  await open('.cm-tb-cmp', 'compare');
  await open('.cm-tb-more', 'more');
  await open('.cm-funnel-btn', 'funnel');
  await open('.cm-newleads', 'leads');
  console.log('\nerrors total:', h.errors.length); h.errors.slice(0,8).forEach((e) => console.log(e.slice(0, 800)));
  process.exit(0);
})();
