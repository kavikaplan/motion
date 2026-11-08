// simpler top bar: 🧰 Tools ▾ (Not in NetHunt · Enrich · Campaigns · Compare countries · Browser button), no version / shortcut hint ·
// Power hour: Skip · ⋯ · 🙈 Ignore in the top bar next to the fit badge, and they still work
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); await wait(2000); await h.settle(); const W = h.w, D = h.d;
  const vis = (q) => { const x = D.querySelector(q); return !!x && W.getComputedStyle(x).display !== 'none'; };
  console.log('shown in the top bar → version:', vis('.cm-build'), '| shortcut hint:', vis('.cm-kbd'), '| Not in NetHunt:', vis('.cm-nhbtn'), '| Campaigns:', vis('.cm-cpgbtn'), '| Tools:', vis('.cm-toolsbtn'));
  if (vis('.cm-build') || vis('.cm-kbd') || vis('.cm-nhbtn') || vis('.cm-cpgbtn') || !vis('.cm-toolsbtn')) bad.push('top bar');
  const menu = async () => { D.querySelector('.cm-toolsbtn').click(); await wait(100); return [ ...D.querySelectorAll('#cm-menu button, .cm-menu button') ].filter((b) => b.offsetParent !== null || 1); };
  const items = (await menu()).map((b) => b.textContent.replace(/\s+/g, ' ').trim()); console.log('🧰 Tools:', items.join(' | ')); if (![ 'Not in NetHunt', 'Enrich', 'Campaigns', 'Compare countries' ].every((x) => items.some((i) => i.includes(x)))) bad.push('menu items');
  const pick = async (name) => { const b = (await menu()).find((x) => x.textContent.includes(name)); b.click(); await wait(400); await h.settle(); };
  await pick('Not in NetHunt'); console.log('→ Not in NetHunt page:', !!D.getElementById('cm-lp')); if (!D.getElementById('cm-lp')) bad.push('nin'); D.getElementById('cm-lp') && D.getElementById('cm-lp').querySelector('.cm-lphd button').click(); await wait(200);
  await pick('Campaigns'); console.log('→ Campaigns page:', !!D.getElementById('cm-cpg')); if (!D.getElementById('cm-cpg')) bad.push('campaigns'); D.getElementById('cm-cpg') && D.getElementById('cm-cpg').querySelector('.cm-lphd button').click(); await wait(200);
  await pick('Enrich'); const t1 = D.getElementById('cm-sheet').hidden ? '(closed)' : D.getElementById('cm-sheet-title').textContent; console.log('→ Enrich:', t1); if (!/Enrich/.test(t1)) bad.push('enrich'); D.querySelector('#cm-sheet .sx').click(); await wait(200);
  await pick('Compare'); const t2 = D.getElementById('cm-sheet').hidden ? '(closed)' : D.getElementById('cm-sheet-title').textContent; console.log('→ Compare:', t2); if (!/Compare/.test(t2)) bad.push('compare'); D.querySelector('#cm-sheet .sx').click(); await wait(200);
  // Power hour
  D.querySelector('.cm-phbtn').click(); await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(600); await h.settle();
  const tt = D.getElementById('cm-sheet-title'); const co0 = (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent; const ta = tt.querySelector('.cm-phtacts'); console.log('Power hour top bar:', ta && [ ...ta.children ].map((b) => b.textContent.trim()).join(' · '), '| in the body:', !!D.querySelector('#cm-sheet .sb .acts .cm-phskip'));
  if (!ta || !/Skip/.test(ta.textContent) || !/Ignore/.test(ta.textContent) || D.querySelector('#cm-sheet .sb .acts .cm-phskip')) bad.push('ph top acts');
  ta && ta.querySelector('.cm-phskip').click(); await wait(3300); await h.settle(); await wait(500); await h.settle(); const co1 = (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent; const ta2 = D.getElementById('cm-sheet-title').querySelector('.cm-phtacts');
  console.log('Skip:', co0, '→', co1, '| buttons still on top:', !!(ta2 && /Skip|Undo/.test(ta2.textContent))); if (co1 === co0 || !ta2) bad.push('skip works');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
