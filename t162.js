// Power hour stays: an email sent from a pop-up that had replaced Power hour (smart draft, templates…) brings you back to the same
// company · tapping the “did you send it?” bar or the toast does not close Power hour
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const R0 = W.Response || globalThis.Response; const JJ = (o) => new R0(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); const of0 = W.fetch;
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/gmail/accounts')) return JJ({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'hi@kavikaplan.com', mailbox: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true, signature: '' } ] } ] }); if (u.startsWith('/api/gmail/send')) return JJ({ ok: true, id: 'm1', from: 'hi@kavikaplan.com' }); if (u.startsWith('/api/files')) return JJ([]); return of0(u, o); };
  W.confirm = () => true; C.uiFlags = { ...(C.uiFlags || {}), mailOn: true, aiDrafts: false };
  const an = D.createElement('button'); D.body.append(an);
  const ph = () => C.openSheet(an, '⚡ 3 of 20 · Best new lead', (body) => { const w = C.el('div', 'cm-phwho'); const co = C.el('button', 'cm-co', 'Intersalud'); co.dataset.openCompany = 'cX1'; w.append(co); body.append(w); }, { center: true, wide: true });
  const sent = async () => { const S = D.getElementById('cm-maildock') || D.getElementById('cm-sheet'); [ ...S.querySelectorAll('button') ].find((b) => /Send/.test(b.textContent) && b.classList.contains('cm-btn')).click(); await wait(400); await h.settle(); const sa = [ ...S.querySelectorAll('.cm-mlrev button') ].find((b) => /anyway/.test(b.textContent)); console.log('  (review:', !!sa, '| toast:', (D.querySelector('#cm-toast') || {}).textContent, ')'); sa && (sa.click(), await wait(400), await h.settle()); }; // ✔ the review may ask first
  const where = () => `${D.getElementById('cm-sheet').hidden ? '(closed)' : (D.getElementById('cm-sheet-title') || {}).textContent} · ${((D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent) || ''}`;
  // 1 · Power hour → a draft pop-up (replaces it) → ✉ email → Send → back in Power hour, same company
  ph(); const b2 = D.createElement('button'); D.body.append(b2); C.openSheet(b2, '✍ Smart draft', (body) => { const ob = C.el('button', 'cm-btn ob', '✉ Open in email'); body.append(ob); }); console.log('draft pop-up open:', where());
  await X.openMail({ anchor: D.querySelector('#cm-sheet .ob'), to: 'a@b.com', subject: 'Hello', cid: 'cX1', company: 'Intersalud' }); await h.settle(); await wait(200); console.log('mail sheet:', where(), [ ...D.querySelectorAll('#cm-sheet button') ].map((b) => b.textContent).slice(0, 12).join('|')); await sent(); console.log('after Send:', where());
  if (!/^⚡/.test(where()) || !/Intersalud/.test(where())) bad.push('back after a draft pop-up');
  // 2 · a later email for another company (from elsewhere) does not bring an old Power hour back
  C.closeSheet(); const b3 = D.createElement('button'); D.body.append(b3); await X.openMail({ anchor: b3, to: 'x@y.com', subject: 'Other', cid: 'cOTHER', company: 'Other' }); await h.settle(); await wait(200); await sent(); console.log('email for another company afterwards →', where()); if (/^⚡/.test(where())) bad.push('no stale return');
  // 3 · the “did you send it?” bar and the toast don't close Power hour
  ph(); const bar = D.createElement('div'); bar.id = 'cm-pobar'; const yb = D.createElement('button'); bar.append(yb); D.body.append(bar); yb.dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await wait(50);
  console.log('after tapping the bar:', where()); if (!/^⚡/.test(where())) bad.push('bar closes power hour');
  const out = D.createElement('div'); D.body.append(out); out.dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await wait(50); console.log('tap elsewhere on the page still closes it:', where()); if (!/closed/.test(where())) bad.push('outside click');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
