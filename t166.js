// ⚙ Filter on Best partners (like NetHunt's view filter): conditions on any field — Category is …, Country is not …, Status is …,
// Name contains …, Email is empty, Days since last contact more than … — And / Or; kept in the address (saved views keep it); Power hour follows
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all' } }); await h.settle(); await wait(2000); await h.settle(); const W = h.w, D = h.d, C = W.__cm;
  const names = () => [ ...D.querySelectorAll('.cm-partner') ].map((b) => b.textContent.trim().slice(0, 30));
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all' }); await h.settle(); try { C.drawPartners(); } catch (_e) { /* */ }
  for (let k = 0; k < 60 && !D.querySelector('.cm-partner'); k++) { await wait(200); await h.settle(); } await wait(500);
  const all = names(); const cos = C.rowsOf('companies'); console.log('rows:', all.length, '| companies with a category:', [ ...new Set(cos.map((c) => c.category).filter(Boolean)) ].join(', '));
  const btn = D.querySelector('.cm-pflbtn'); if (!btn) { bad.push('button'); } else { btn.click(); await wait(200);
    let S = D.getElementById('cm-sheet'); console.log('editor:', D.getElementById('cm-sheet-title').textContent, '| fields:', S.querySelector('.cm-pflf').options.length);
    // Category is <the first category>
    const cat = 'Ortho'; const vs = S.querySelector('select.cm-pflv'); [ ...vs.options ].forEach((o) => { o.selected = o.value === cat; }); vs.dispatchEvent(new W.Event('change'));
    // + And · Name contains <the first row's first word>
    [ ...S.querySelectorAll('button') ].find((b) => /Add condition/.test(b.textContent)).click(); await wait(100); const r2 = D.getElementById('cm-sheet').querySelectorAll('.cm-pflrow')[1]; const fsel = r2.querySelector('.cm-pflf'); fsel.value = 'company'; fsel.dispatchEvent(new W.Event('change')); await wait(50);
    const word = all[0].replace(/^\d+\s*/, '').split(/\s+/)[0]; const inp = D.getElementById('cm-sheet').querySelectorAll('.cm-pflrow')[1].querySelector('input.cm-pflv'); inp.value = word; inp.dispatchEvent(new W.Event('input'));
    S = D.getElementById('cm-sheet'); [ ...S.querySelectorAll('button') ].find((b) => /Apply/.test(b.textContent)).click(); await wait(300); await h.settle();
    const f1 = names(); const want = cos.filter((c) => c.category === cat).map((c) => c.id); console.log(`Category is ${cat} and Name contains “${word}”:`, f1.length, 'rows · address:', W.dash.params().pfl);
    if (!(f1.length > 0 && f1.length < all.length)) bad.push('category');
    const chip = D.querySelector('.cm-pflbtn'); console.log('button:', chip.textContent, '| summary:', (D.querySelector('.cm-pflsum') || {}).textContent); if (!/Filter · 2/.test(chip.textContent)) bad.push('chip');
    // the Power hour queue follows
    const q = (W.__cm2x ? W.__cm2x.powerQueue().list : []).filter((x) => 'line_names' in x); /* the country's own Power hour (not the all-countries one) */ const bad2 = q.filter((x) => { const c = cos.find((y) => y.id === x.id); return c && (c.category !== cat || !String(c.company).toLowerCase().includes(word.toLowerCase())) && !x.elsewhere; }); console.log('view', C.curView(), '| Power hour:', q.length, 'companies ·', bad2.length, 'outside the filter', JSON.stringify(bad2.slice(0, 2))); if (bad2.length) bad.push('power hour');
    D.querySelector('.cm-pflsum button').click(); await wait(300); await h.settle(); console.log('✕ clear →', names().length, 'rows'); if (names().length !== all.length) bad.push('clear'); }
  // conditions by hand (the address): Or · text · empty · numbers
  const P = (o) => { W.dash.setParams({ pfl: JSON.stringify(o) }); };
  const _w = 0;
  const c0 = cos[0]; const ok = C.pflOk;
  P({ m: 'and', c: [ { f: 'company', o: 'has', v: String(c0.company).slice(0, 5) } ] }); console.log('Name contains:', ok({ id: c0.id }), '/ other:', ok({ id: cos.find((c) => !String(c.company).includes(String(c0.company).slice(0, 5))).id }));
  P({ m: 'and', c: [ { f: 'country', o: 'out', v: [ 'Chile' ] } ] }); const chOut = cos.filter((c) => ok(c)).length; console.log('Country is not Chile →', chOut, 'of', cos.length); if (chOut !== cos.filter((c) => !/Chile/i.test(c.country)).length) bad.push('is not');
  P({ m: 'or', c: [ { f: 'emails', o: 'empty' }, { f: 'emails', o: 'full' } ] }); const orAll = cos.every((c) => ok(c)); P({ m: 'and', c: [ { f: 'emails', o: 'empty' }, { f: 'emails', o: 'full' } ] }); const andNone = !cos.some((c) => ok(c)); console.log('Or (empty / not empty) → all:', orAll, '| And → none:', andNone); if (!orAll || !andNone) bad.push('and/or');
  P({ m: 'and', c: [ { f: 'people', o: 'gt', v: '0' } ] }); const ppl = cos.filter((c) => ok(c)).length; console.log('people more than 0 →', ppl, '(expected', cos.filter((c) => Number(c.people) > 0).length, ')'); if (ppl !== cos.filter((c) => Number(c.people) > 0).length) bad.push('number');
  W.dash.setParams({ pfl: '' });
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
