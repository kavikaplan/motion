// Best partners sorted by status: a thin line in each status' colour where it starts (no text) — Negotiating above Promising ·
// 📣 Your campaigns: chips All · ▶ Active · 📝 Draft · ⏸ Paused · ✓ Finished (only those there are) · menus without description lines
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all', psort: 'status' } }); await h.settle(); await wait(2000); await h.settle(); const W = h.w, D = h.d, C = W.__cm;
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all', psort: 'status' }); await h.settle(); try { C.drawPartners(); } catch (_e) { /* */ }
  for (let k = 0; k < 40 && !D.querySelector('.cm-partner'); k++) await wait(200); await wait(300);
  const list = D.querySelector('.cm-partner').parentElement; const kids = [ ...list.children ].filter((x) => x.matches('.cm-stsep, .cm-partner'));
  const seps = kids.filter((x) => x.matches('.cm-stsep')); const groups = []; let cur = null; kids.forEach((x) => { if (x.matches('.cm-stsep')) { cur = { col: x.style.background, rows: 0, text: x.textContent }; groups.push(cur); } else if (cur) cur.rows++; });
  console.log('rows:', kids.length - seps.length, '| lines:', seps.length, '|', groups.map((g) => `${g.col}×${g.rows}`).join(' · '), '| text on lines:', JSON.stringify(seps.map((s) => s.textContent).join('')));
  if (!seps.length || !kids[0].matches('.cm-stsep') || seps.some((s) => s.textContent) || groups.some((g) => !g.rows)) bad.push('lines');
  W.dash.setParams({ psort: 'next' }); await h.settle(); try { C.drawPartners(); } catch (_e) { /* */ } await wait(200); console.log('other sorts → no lines:', !D.querySelector('.cm-stsep')); if (D.querySelector('.cm-stsep')) bad.push('only for status');
  console.log('Negotiating above Promising:', W.cmStatusRank('Negotiating') < W.cmStatusRank('Promising')); if (!(W.cmStatusRank('Negotiating') < W.cmStatusRank('Promising'))) bad.push('order');
  // campaigns
  const R0 = W.Response || globalThis.Response; const of0 = W.fetch; const camps = [ [ 'active', 'Chile nails' ], [ 'paused', 'Peru' ], [ 'draft', 'Unfinished' ], [ 'done', 'Old' ], [ 'active', 'Mexico' ] ].map(([status, name], i) => ({ id: `c${i}`, name, status, sender: 'export@duni-tech.com', mailbox: 'hi@kavikaplan.com', steps: [ {} ], created: Date.now() - i * 864e5, n: { companies: 3, total: 4, emails: 2 } }));
  W.fetch = async (u, o = {}) => { u = String(u); if (/gmail\/camp\/list/.test(u)) return new R0(JSON.stringify({ camps }), { status: 200 }); if (u.startsWith('/api/gmail/accounts')) return new R0(JSON.stringify({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [] } ] }), { status: 200 }); return of0(u, o); };
  await W.__cm3.openInbox(D.body); await wait(300); const cb = [ ...D.querySelectorAll('#cm-sheet button.cm-ibl') ].find((b) => /Campaign/.test(b.textContent)); cb && cb.click(); for (let k = 0; k < 20 && !D.querySelector('.cm-cpst'); k++) await wait(150);
  const chips = () => [ ...D.querySelectorAll('.cm-cpst .cm-chip') ].map((b) => b.textContent); const cards = () => [ ...D.querySelectorAll('.cm-cpcard .nm') ].map((x) => x.textContent);
  console.log('chips:', chips().join(' | '), '| cards:', cards().join(', ')); if (chips().join('|') !== 'All 5|▶ Active 2|📝 Draft 1|⏸ Paused 1|✓ Finished 1' || cards()[0] !== 'Chile nails' || cards()[2] !== 'Unfinished') bad.push('campaign chips');
  [ ...D.querySelectorAll('.cm-cpst .cm-chip') ].find((b) => /Paused/.test(b.textContent)).click(); for (let k = 0; k < 10 && cards().length !== 1; k++) await wait(150); console.log('⏸ Paused →', cards().join(', ')); if (cards().join() !== 'Peru') bad.push('filter');
  W.fetch = of0;
  // menus: no description lines
  const tb = D.querySelector('.cm-toolsbtn'); if (tb) { W.__cm.closeSheet(); tb.click(); await wait(100); const subs = [ ...D.querySelectorAll('.cm-menu .sub, #cm-menu .sub, .cm-menu small') ].filter((x) => x.textContent.trim()); console.log('🧰 Tools description lines:', subs.length); if (subs.length) bad.push('tools subs'); }
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
