// the site's own runtime (dash-runtime.js): ↻ a NetHunt list keeps its rows while it reloads (the company page doesn't go blank and jump
// to the top after ＋ Add) · a data file that answers 503 (busy server / slow phone line) is tried again before it counts as failed
const { JSDOM } = require('jsdom'); const fs = require('fs');
(async () => { const bad = []; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://medint.test/' }); const W = dom.window;
  let n = 0; let fileTries = 0; let hold = null;
  W.fetch = async (u, o = {}) => { u = String(u);
    const J = (x, s = 200) => new Response(JSON.stringify(x), { status: s, headers: { 'content-type': 'application/json' } });
    if (u === 'datasets.json') return J({ company_record: { title: 'Company', source: { kind: 'query', tool: 'get_record', args: { recordId: 'c1' } } }, pipeline: { title: 'Pipeline', source: { kind: 'file', url: 'x/pipeline' } } });
    if (u === 'params.json') return J({});
    if (u.startsWith('data/pipeline.json')) { fileTries++; return fileTries < 3 ? J({ error: 'assignments are loading' }, 503) : J([ { id: 'a' }, { id: 'b' } ]); }
    if (u === '/api/nethunt') { n++; if (n > 1) await new Promise((r) => { hold = r; }); return J({ content: [ { type: 'text', text: JSON.stringify([ { field: 'Name', value: `Acme v${n}` } ]) } ] }); }
    return J({}, 404); };
  W.Response = Response; W.AbortSignal = AbortSignal;
  try { W.eval(fs.readFileSync(__dirname + '/../source/dash-runtime.js', 'utf8')); } catch (e) { bad.push('load ' + e.message); }
  await W.cmBoot([]); const d = W.dash; for (let k = 0; k < 40 && d.data('company_record').status === 'missing'; k++) await wait(100); d.data('pipeline'); await wait(300);
  const a = d.data('company_record'); console.log('loaded:', a.status, JSON.stringify(a.data));
  d.refresh('company_record'); const b = d.data('company_record'); await wait(50);
  console.log('while reloading:', b.status, '| rows kept:', JSON.stringify(b.data), '| refreshing:', b.refreshing); if (b.status !== 'ok' || !b.data.length || !b.refreshing) bad.push('rows kept while reloading');
  hold && hold(); await wait(100); const c = d.data('company_record'); console.log('after:', c.status, JSON.stringify(c.data)); if (!/v2/.test(JSON.stringify(c.data))) bad.push('new rows arrive');
  for (let k = 0; k < 30 && d.data('pipeline').status === 'loading'; k++) await wait(300);
  const p = d.data('pipeline'); console.log('data file after two 503s:', p.status, p.data.length, 'rows,', fileTries, 'tries'); if (p.status !== 'ok' || fileTries !== 3) bad.push('file retried');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
