// 📍 several cities at once in Companies (menu stays open to tick more; list, Power hour and Compare follow) · 🔎 Add missing in Power hour survives redraws
const { run } = require('./harness');
(async () => { const h = run({ params: { iso: 'CO', view: 'country', tags: ['colombia'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm; const bad = []; W.dash.setParams({ view: 'country', iso: 'CO', ctab: 'companies', csub: 'partners' }); await h.settle(); await new Promise((r) => setTimeout(r, 800)); await h.settle();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const P = C.rowsOf('partners'); const cnt = new Map(); P.forEach((r) => { const c = String(r.city || '').split(',')[0].trim(); c && cnt.set(c, (cnt.get(c) || 0) + 1); });
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]); console.log('partners', P.length, '| top cities', JSON.stringify(top), [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[1]));
  if (top.length < 2) { console.log('not enough cities in test data'); bad.push('data'); }
  else {
    // menu: tick two cities, the menu stays open
    const btn = D.querySelector('.cm-pcity'); btn.click(); await h.settle(); let items = [...D.querySelectorAll('#cm-menu button, .cm-menu button')]; if (!items.length) items = [...D.querySelectorAll('[role=menuitemcheckbox], [role=menuitemradio]')];
    const i1 = items.find((b) => b.textContent.includes(top[0])); i1.click(); await h.settle(); const stillOpen = !!(i1.isConnected && i1.closest('[hidden]') === null); console.log('menu open after first tick:', stillOpen, '| pcity', W.dash.params().pcity); if (!stillOpen) bad.push('menu stays open');
    const i2 = [...D.querySelectorAll('[role=menuitemcheckbox]')].find((b) => b.textContent.includes(top[1])); i2.click(); await h.settle(); await wait(200); await h.settle();
    console.log('pcity now:', W.dash.params().pcity); if (W.dash.params().pcity !== `${top[0]}|${top[1]}`) bad.push('two cities saved');
    const lab = D.querySelector('.cm-pcity'); console.log('chip:', lab && lab.textContent); if (!lab || !lab.textContent.includes(top[0]) || !lab.textContent.includes(top[1])) bad.push('chip label');
    const S = C.cityPick(P); const want = P.filter((r) => C.cityIn(r, S)).length; console.log('rows in the 2 cities:', want, '=', cnt.get(top[0]) + cnt.get(top[1])); if (want !== cnt.get(top[0]) + cnt.get(top[1])) bad.push('cityIn');
    // untick one
    W.dash.setParams({ pcity: top[1] }); await h.settle(); console.log('one city:', C.pcityL());
    // a city from another country is ignored
    W.dash.setParams({ pcity: `Atlantis|${top[0]}` }); await h.settle(); const S2 = C.cityPick(P); console.log('with a foreign city:', S2 && [...S2]); if (!S2 || S2.size !== 1) bad.push('foreign city');
    W.dash.setParams({ pcity: 'Atlantis' }); await h.settle(); if (C.cityPick(P) !== null) bad.push('only foreign city → all');
    W.dash.setParams({ pcity: `${top[0]}|${top[1]}` }); await h.settle();
    // Power hour scope follows
    W.__cm2.openPowerHour(D.body); await wait(900); await h.settle(); const ti = D.getElementById('cm-sheet-title').textContent; console.log('PH title:', ti);
    // 🔎 Add missing: open, then the sheet redraws → still open, same panel
    const am = D.querySelector('#cm-sheet:not([hidden]) .cm-addmiss'); if (!am) bad.push('add missing button'); else { am.click(); await h.settle(); const p1 = D.querySelector('.cm-fcside .cm-enr'); console.log('panel after click:', !!p1); if (!p1) bad.push('panel opens');
      const inp = p1 && p1.querySelector('input'); inp && (inp.value = '+57 300 000 0000');
      C.sheetDraw(); await h.settle(); await wait(50); const p2 = D.querySelector('.cm-fcside .cm-enr'); console.log('panel after redraw:', !!p2, '| same element:', p1 === p2, '| typed kept:', inp && p2 && p2.contains(inp) && inp.value);
      if (!p2 || p1 !== p2) bad.push('panel survives redraw');
      const am2 = D.querySelector('#cm-sheet:not([hidden]) .cm-addmiss'); am2.click(); await h.settle(); console.log('closed:', !D.querySelector('.cm-fcside .cm-enr')); if (D.querySelector('.cm-fcside .cm-enr')) bad.push('toggle closes'); }
  }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
