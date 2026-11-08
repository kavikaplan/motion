// 📣 Campaigns page: only one filter dropdown open at a time (Countries / Status / NEXT status… never overlap); tapping outside or Esc closes it
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await wait(1500); await h.settle(); const W = h.w, D = h.d, X = W.__cm3; const bad = [];
  X.openCampPage('CL'); await h.settle(); await wait(800); await h.settle(); console.log('page', !!D.getElementById('cm-cpg'), D.querySelectorAll('details').length);
  const dd = () => [ ...D.querySelectorAll('#cm-cpg details.cm-cams') ].filter((x) => x.querySelector('summary')); const open = () => dd().filter((x) => x.open).map((x) => ((x.querySelector('summary') || {}).textContent || '?').trim());
  console.log('dropdowns:', dd().map((x) => ((x.querySelector('summary') || {}).textContent || '?').trim()).join(' | '));
  const tog = async (i) => { const d = dd()[i]; d.open = !d.open; d.dispatchEvent(new W.Event('toggle')); await wait(50); };
  await tog(0); console.log('open Countries →', open().join(', ')); await tog(1); console.log('then Status →', open().join(', ')); if (open().length !== 1 || !/Status/.test(open()[0])) bad.push('one at a time');
  await tog(2); await tog(3); console.log('then NEXT, Motion →', open().join(', ')); if (open().length !== 1) bad.push('others');
  dd()[3].querySelector('input[type=checkbox]') && dd()[3].querySelector('input[type=checkbox]').dispatchEvent(new W.Event('pointerdown', { bubbles: !0 })); console.log('tap inside →', open().join(', ')); if (open().length !== 1) bad.push('inside keeps');
  D.querySelector('#cm-cpg h1').dispatchEvent(new W.Event('pointerdown', { bubbles: !0 })); console.log('tap outside →', open().join(', ') || 'all closed'); if (open().length) bad.push('outside');
  await tog(1); D.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: !0 })); console.log('Esc →', open().join(', ') || 'all closed'); if (open().length) bad.push('esc');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', ')); process.exit(0); })();
