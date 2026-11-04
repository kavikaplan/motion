const { run } = require('./harness');
const store = {};
const claude = (calls) => ({ use: async (n) => {
  if (n === 'user') return { id: async () => 'u1' };
  if (n === 'db') return { doc: (p) => ({ get: async () => ({ exists: !!store[p], data: () => store[p] }), set: async (d) => { store[p] = d; } }) };
  return null; } });
(async () => {
  const h = run({ params: { view: 'markets', ours: 'dunitech' }, claude });
  await h.settle();
  const $ = (s) => h.d.querySelector(s);
  console.log('markets errors', h.errors.length, h.errors.slice(0,2).join('\n').slice(0,600));
  console.log('tiles', [...h.d.querySelectorAll('.cm-action')].map((t) => t.textContent).join(' | '));
  // hover a tile
  const t = h.d.querySelector('.cm-action'); t.dispatchEvent(new h.w.MouseEvent('mouseenter')); await h.settle(200);
  console.log('pop:', $('#cm-pop').hidden, $('#cm-pop').textContent.slice(0, 200));
  // compare: add countries via param
  h.setParams({ cmp: ['CL', 'PE', 'CO', 'MX'] }); await h.settle();
  $('.cm-tb-cmp').click(); await h.settle();
  console.log('compare rows', h.d.querySelectorAll('#cm-sheet .cm-cmpt tbody tr').length, 'cols', h.d.querySelectorAll('#cm-sheet .cm-cmpt thead th').length, 'bold', h.d.querySelectorAll('#cm-sheet .best').length);
  console.log($('#cm-sheet .cm-cmpt').textContent.slice(0, 700));
  // add 5th via combo
  const inp = $('#cm-sheet .sbar input'); inp.value = 'ecu'; inp.dispatchEvent(new h.w.Event('input')); await h.settle();
  const li = h.d.querySelector('#cm-cmp-list li'); console.log('combo first:', li && li.textContent);
  if (li) li.dispatchEvent(new h.w.MouseEvent('mousedown')); await h.settle();
  console.log('cmp now', JSON.stringify(h.params().cmp));
  // Escape closes
  h.d.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape' })); await h.settle();
  console.log('after esc hidden', $('#cm-sheet').hidden);
  // views save
  $('.cm-tb-more').click(); await h.settle(); await h.settle();
  const nm = h.d.querySelector('#cm-sheet input[type=text]'); nm.value = 'LatAm compare';
  [...h.d.querySelectorAll('#cm-sheet .cm-btn')].find((b) => b.textContent === 'Save').click(); await h.settle();
  console.log('saved store', JSON.stringify(store).slice(0, 300));
  console.log('more text', $('#cm-sheet .sb').textContent.slice(0, 300));
  // change view and apply saved
  h.setParams({ view: 'tenders', cmp: [] }); await h.settle();
  $('.cm-tb-more').click(); await h.settle(); await h.settle();
  const go = [...h.d.querySelectorAll('#cm-sheet .cm-co')].find((b) => b.textContent === 'LatAm compare'); console.log('go exists', !!go);
  go && go.click(); await h.settle();
  console.log('params after apply', JSON.stringify(h.params()).slice(0, 300));
  // tenders/sources/brand/company views
  for (const p of [{ view: 'tenders' }, { view: 'sources' }, { view: 'brand', brand: 'Zimed', bq1: 'zimed', bq2: 'zimed' }, { view: 'company', cid: 'abc' }, { view: 'country', iso: 'PE', tags: ['peru'] }]) {
    h.setParams(p); await h.settle(); console.log('view', p.view, 'errors', h.errors.length);
  }
  console.log(h.errors.slice(0, 4).join('\n').slice(0, 1500));
  // hash link
  const enc = encodeURIComponent(JSON.stringify({ view: 'country', iso: 'MX', tags: ['mexico'], ours: 'motion' }));
  const h2 = run({ hash: '#v~' + enc }); await h2.settle();
  console.log('hash params', JSON.stringify(h2.params()), 'nav', h2.d.querySelector('.cm-goto-country').textContent, 'errs', h2.errors.length);
  process.exit(0);
})();
