// 📊 client reports live in the ⋯ menu (no chip on the top bar); the sheet lists every client (Next, Dunitech, Motion) + other periods
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); const W = h.w;
  const chip = h.d.querySelector('.cm-wrbtn'); const items = (W.__cm3.moreExtra() || []).map((x) => x[0]); const has = items.find((t) => /Client reports/.test(t));
  W.__cm3.openReports(h.d.body); await h.settle(); const S = h.d.getElementById('cm-sheet'); const txt = S ? S.textContent : '';
  const want = ['Next Shoulder', 'Dunitech', 'Motion Medical', 'Weekly', '🗓']; const miss = want.filter((w) => !txt.includes(w));
  console.log('top-bar chip:', !!chip, '| ⋯ item:', has || 'missing', '| sheet:', miss.length ? `missing ${miss.join(', ')}` : 'all clients');
  console.log(`errors ${h.errors.length + (chip ? 1 : 0) + (has ? 0 : 1) + miss.length}`); process.exit(0); })();
