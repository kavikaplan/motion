const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await h.settle();
  // a Person with few companies: keep only 40 pipeline rows with no contact and no import data
  const ps = h.w.dash.data('pipeline_stages'); ps.data.splice(40); ps.data.forEach((r) => { r.stage_next = 1; r.next_status = 'Enriched'; });
  const iv = h.w.dash.data('import_values'); if (iv.data) iv.data.length = 0; const ch = h.w.dash.data('contact_history'); if (ch.data) ch.data.length = 0;
  h.d.querySelector('.cm-phtop').click(); await h.settle(); await h.settle();
  console.log('title:', (h.d.getElementById('cm-sheet-title') || {}).textContent.slice(0, 60)); console.log('errors', h.errors.length); process.exit(0); })();
