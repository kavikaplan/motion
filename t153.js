// company page: 🔎 Find contacts stays open (same panel, same results) when the page is drawn again after ＋ Add
// Power hour: no 📋 in the draft line; “Reply draft … languages … ✨ Smart draft” in one compact row
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d, C = W.__cm;
  const cid = C.rowsOf('partners')[0].id; W.cmOpenCompany(cid); await h.settle(); await wait(800); await h.settle();
  const fb = () => [ ...D.querySelectorAll('#company-view .cm-addmiss') ].find((b) => /Find contacts/.test(b.textContent)); console.log('Find contacts button on the company page:', !!fb());
  if (!fb()) bad.push('button'); else {
    fb().click(); await h.settle(); const p0 = D.querySelector('#company-view .cm-fc, #company-view .cm-enrich, #company-view [class*="cm-fc"]'); const n0 = fb().parentElement.parentElement.nextElementSibling || p0;
    const panel = (fb().closest('.cm-cacts') || {}).nextElementSibling; console.log('panel open:', !!panel, panel && panel.className);
    if (!panel) bad.push('panel opens'); else {
      panel.dataset.mark = 'same'; const row0 = fb().closest('.cm-cacts'); W.scrollTo(0, 900);
      W.dash.setParams({ actv: (W.dash.params().actv || 0) + 1 }); await h.settle(); await wait(300); await h.settle(); // the page drawn again (as after a reload of the company)
      console.log('the buttons row was drawn again:', fb().closest('.cm-cacts') !== row0); if (fb().closest('.cm-cacts') === row0) bad.push('no redraw happened (test)');
      const again = D.querySelector('#company-view [data-mark="same"]'); console.log('after the page is drawn again — same panel still there:', !!again, '| still under the buttons:', !!(again && again.previousElementSibling && again.previousElementSibling.classList.contains('cm-cacts')));
      if (!again) bad.push('panel survives a redraw');
      fb().click(); await h.settle(); console.log('tap again closes it:', !D.querySelector('#company-view [data-mark="same"]')); if (D.querySelector('#company-view [data-mark="same"]')) bad.push('close');
    } }
  // Power hour draft line
  W.dash.setParams({ view: 'country' }); await h.settle(); await wait(300); D.querySelector('.cm-phbtn').click(); await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(200);
  const hd = D.querySelector('#cm-sheet .cm-phdrafthd'); console.log('draft line:', hd && hd.textContent.replace(/\s+/g, ' ').slice(0, 120), '| 📋:', !!(hd && /📋/.test(hd.textContent)), '| draft-type box in it:', !!(hd && hd.querySelector('select.cm-phtpl')));
  if (!hd || /📋/.test(hd.textContent) || D.querySelector('#cm-sheet .cm-phcopy') || !hd.querySelector('select.cm-phtpl')) bad.push('draft line');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
