// ✉ from Power hour: the email opens docked on the right (Power hour stays open behind it), ⤢ bigger, Esc closes only the email ·
// ✔ review before sending: sender for the brand (Dunitech → @duni-tech.com / @oliga.com.tr), subject names the company, “attached” with no
// file → warning with ← Back to edit / ➤ Send anyway · no warning → sends at once · Inbox ＋ New campaign → the 📣 Campaigns page
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); const D = h.d, W = h.w;
  const R0 = W.Response || globalThis.Response; const JJ = (o) => new R0(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); const of0 = W.fetch; const sent = [];
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/gmail/accounts')) return JJ({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'hi@kavikaplan.com', mailbox: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true, signature: '' }, { email: 'export@duni-tech.com', mailbox: 'hi@kavikaplan.com', name: 'Dunitech', signature: '' } ] } ] }); if (u.startsWith('/api/gmail/send')) { sent.push(JSON.parse(o.body)); return JJ({ ok: true, id: 'm1', from: JSON.parse(o.body).from }); } if (u.startsWith('/api/files')) return JJ([]); return of0(u, o); };
  W.confirm = () => true; await wait(7000); await h.settle();
  const loaded = async () => { await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(300); };
  const sheetT = () => (D.getElementById('cm-sheet').hidden ? '(closed)' : (D.getElementById('cm-sheet-title') || {}).textContent.replace(/\s+/g, ' ').slice(0, 30));
  D.querySelector('.cm-phbtn').click(); await loaded(); const co = ((D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent || '').replace(/^\S+\s/, '').trim(); console.log('Power hour:', sheetT(), '·', co);
  const email = async () => { D.querySelector('#cm-sheet .cm-mailbtn').click(); await wait(300); const m = D.querySelector('.cm-menu, [role="menu"]'); m && m.querySelector('button, [role="menuitem"]').click(); for (let k = 0; k < 30 && !D.getElementById('cm-maildock'); k++) await wait(100); await h.settle(); return D.getElementById('cm-maildock'); };
  let dk = await email(); console.log('email docked:', !!dk, '| Power hour still open:', sheetT()); if (!dk || !/^⚡/.test(sheetT())) bad.push('dock');
  console.log('Power hour moved left:', D.body.classList.contains('cm-mdopen')); if (!D.body.classList.contains('cm-mdopen')) bad.push('shift');
  D.querySelector('#cm-sheet .cm-phwho').dispatchEvent(new W.MouseEvent('mousedown', { bubbles: !0 })); D.querySelector('#cm-sheet .cm-phwho').click(); await wait(100); console.log('click in Power hour → email still open:', !!D.getElementById('cm-maildock'), '| Power hour:', sheetT()); if (!D.getElementById('cm-maildock') || !/^⚡/.test(sheetT())) bad.push('click power hour');
  D.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: !0 })); await wait(100); console.log('Esc (focus in Power hour) → email closed:', !D.getElementById('cm-maildock'), '| Power hour still open:', sheetT(), '| moved back:', !D.body.classList.contains('cm-mdopen')); if (D.getElementById('cm-maildock') || !/^⚡/.test(sheetT()) || D.body.classList.contains('cm-mdopen')) bad.push('esc anywhere');
  dk = await email();
  dk.querySelector('.cm-mdhd button').click(); console.log('⤢ bigger:', dk.classList.contains('max')); if (!dk.classList.contains('max')) bad.push('max');
  dk.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: !0 })); await wait(100); console.log('Esc → email closed:', !D.getElementById('cm-maildock'), '| Power hour:', sheetT()); if (D.getElementById('cm-maildock') || !/^⚡/.test(sheetT())) bad.push('esc');
  // review: wrong sender + subject without the company + “attached” with no file
  dk = await email(); const fromSel = dk.querySelector('select'); const subj = [ ...dk.querySelectorAll('input') ].find((i) => /Subject/i.test(i.placeholder || i.getAttribute('aria-label') || ''));
  fromSel && (fromSel.value = [ ...fromSel.options ].find((o) => /hi@kavikaplan/.test(o.value || o.text)).value, fromSel.dispatchEvent(new W.Event('change')));
  subj.value = 'Hello from us'; subj.dispatchEvent(new W.Event('input')); const ed = dk.querySelector('[contenteditable], textarea.cm-mlta, textarea'); ed.innerHTML ? (ed.innerHTML = 'Please find attached our catalogue.') : (ed.value = 'Please find attached our catalogue.'); ed.dispatchEvent(new W.Event('input', { bubbles: !0 }));
  const sendB = () => [ ...D.querySelectorAll('#cm-maildock button') ].find((b) => /^➤ Send$|➤ Send$/.test(b.textContent.trim()));
  sendB().click(); await wait(300); const rev = D.querySelector('#cm-maildock .cm-mlrev'); console.log('review:', rev && [ ...rev.querySelectorAll('.cm-mlrevl') ].map((x) => x.textContent).join(' || '), '| sent:', sent.length);
  const rv = rev ? rev.textContent : ''; if (!rev || sent.length || !/Dunitech outreach/.test(rv) || !/subject doesn't name/.test(rv) || !/no file is attached/.test(rv)) bad.push('review');
  [ ...rev.querySelectorAll('button') ].find((b) => /Back to edit/.test(b.textContent)).click(); await wait(100); console.log('← Back to edit: review gone', !D.querySelector('#cm-maildock .cm-mlrev'), '· still not sent', !sent.length); if (D.querySelector('#cm-maildock .cm-mlrev') || sent.length) bad.push('back');
  sendB().click(); await wait(300); [ ...D.querySelectorAll('#cm-maildock .cm-mlrev button') ].find((b) => /Send anyway/.test(b.textContent)).click(); await wait(800); await h.settle();
  console.log('➤ Send anyway → sent:', sent.length, 'from', (sent[0] || {}).from, 'brand', W.__cm2x.miBrand(), '| email closed:', !D.getElementById('cm-maildock'), '| Power hour:', sheetT()); if (sent.length !== 1 || D.getElementById('cm-maildock') || !/^⚡/.test(sheetT())) bad.push('send anyway');
  // all fine → no review
  dk = await email(); const fs2 = dk.querySelector('select'); fs2 && (fs2.value = [ ...fs2.options ].find((o) => /duni-tech/.test(o.value || o.text)).value, fs2.dispatchEvent(new W.Event('change')));
  const sj2 = [ ...dk.querySelectorAll('input') ].find((i) => /Subject/i.test(i.placeholder || i.getAttribute('aria-label') || '')); sj2.value = `${co} — Dunitech trauma implants`; sj2.dispatchEvent(new W.Event('input'));
  const ed2 = dk.querySelector('[contenteditable], textarea'); ed2.innerHTML ? (ed2.innerHTML = 'Hello, we would like to meet.') : (ed2.value = 'Hello, we would like to meet.'); ed2.dispatchEvent(new W.Event('input', { bubbles: !0 }));
  sendB().click(); await wait(800); await h.settle(); console.log('all fine → sent without a review:', sent.length === 2, '| from', (sent[1] || {}).from); if (sent.length !== 2) bad.push('clean send');
  // Inbox → ＋ New campaign → the Campaigns page
  const X = W.__cm3; W.__cm.closeSheet(); await X.openInbox(D.body); await wait(400); await h.settle(); const cb = [ ...D.querySelectorAll('#cm-sheet button.cm-ibl') ].find((b) => /Campaign/.test(b.textContent)); cb && cb.click(); for (let k = 0; k < 20 && !D.querySelector('.cm-cpnew'); k++) await wait(150); const nw = D.querySelector('.cm-cpnew'); if (nw) { nw.click(); await wait(400); await h.settle(); console.log('＋ New campaign → Campaigns page:', !!D.getElementById('cm-cpg')); if (!D.getElementById('cm-cpg')) bad.push('new campaign'); } else bad.push('inbox campaigns');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
