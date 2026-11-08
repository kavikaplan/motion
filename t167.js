// Not in NetHunt ⬇ CSV: only the companies matching the filters (chips, search); the button shows how many
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await wait(1200); const W = h.w, D = h.d; const bad = [];
  let blob = null; W.URL.createObjectURL = (b) => { blob = b; return 'blob:x'; }; W.URL.revokeObjectURL = () => {};
  W.__cm3.openLeadsPage(''); await h.settle(); await wait(1500); await h.settle(); const P = () => D.getElementById('cm-lp');
  const shown = () => +P().querySelector('.cm-lpbar b').textContent.split(' shown')[0].replace(/\D/g, '');
  const btn = () => [ ...P().querySelectorAll('.cm-lpbar button') ].find((b) => /CSV/.test(b.textContent));
  const csv = async () => { blob = null; btn().click(); await wait(150); const t = await new Promise((res) => { const fr = new W.FileReader(); fr.onload = () => res(fr.result); fr.readAsText(blob); }); const rows = []; let q = !1, n = 0; for (const ch of t) { if (ch === '"') q = !q; else if (ch === '\n' && !q) n++; } return n; };
  const du = [ ...P().querySelectorAll('.cm-lpfl .cm-chip') ].find((b) => /Dunitech/.test(b.textContent)); du.click(); await h.settle(); await wait(200);
  const n1 = shown(), c1 = await csv(); console.log('filter Dunitech:', n1, 'shown · button', btn().textContent, '· CSV rows', c1); if (c1 !== n1 || !btn().textContent.includes(String(n1))) bad.push('filter');
  const qi = P().querySelector('.cm-ibq'); qi.value = 'med'; qi.dispatchEvent(new W.Event('input')); await wait(500); await h.settle();
  const n2 = shown(), c2 = await csv(); console.log('+ search “med”:', n2, 'shown · CSV rows', c2); if (c2 !== n2) bad.push('search');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', ')); process.exit(0); })();
