// Power hour stays open around emails: Send → back on the same company (every time, not only the first) · ✕ on an email you
// don't send → back to Power hour · Done / Skip then go to the next company · ✕ on Power hour itself closes it
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); const D = h.d, W = h.w, C = W.__cm;
  const R0 = W.Response || globalThis.Response; const JJ = (o) => new R0(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); const of0 = W.fetch;
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/gmail/accounts')) return JJ({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'hi@kavikaplan.com', mailbox: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true, signature: '' } ] } ] }); if (u.startsWith('/api/gmail/send')) return JJ({ ok: true, id: 'm1', from: 'hi@kavikaplan.com' }); if (u.startsWith('/api/files')) return JJ([]); return of0(u, o); };
  W.confirm = () => true; await wait(7000); await h.settle();
  const loaded = async () => { await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(300); };
  const title = () => (D.getElementById('cm-sheet').hidden ? '(closed)' : (D.getElementById('cm-sheet-title') || {}).textContent.replace(/\s+/g, ' ').slice(0, 40));
  const co = () => ((D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent || '').trim();
  const email = async () => { D.querySelector('#cm-sheet .cm-mailbtn').click(); await wait(300); const m = D.querySelector('.cm-menu, [role="menu"]'); m && m.querySelector('button, [role="menuitem"]').click(); for (let k = 0; k < 20 && !D.getElementById('cm-maildock'); k++) await wait(100); await h.settle(); return D.getElementById('cm-maildock') ? `docked · ${title()}` : title(); }; // the email opens docked beside Power hour
  const send = async () => { const S = D.getElementById('cm-maildock') || D.getElementById('cm-sheet'); [ ...S.querySelectorAll('button') ].find((b) => /Send/.test(b.textContent) && b.classList.contains('cm-btn')).click(); await wait(500); await h.settle(); const sa = [ ...S.querySelectorAll('.cm-mlrev button') ].find((b) => /anyway/.test(b.textContent)); sa && (sa.click(), await wait(600), await h.settle()); };
  D.querySelector('.cm-phbtn').click(); await loaded(); const c0 = co(); console.log('Power hour:', title(), '·', c0);
  for (let n = 1; n <= 2; n++) { const t = await email(); await send(); console.log(`email ${n}: “${t}” → Send →`, title(), '·', co()); if (!/^⚡/.test(title()) || co() !== c0) bad.push(`back after email ${n}`); }
  const t3 = await email(); (D.querySelector('#cm-maildock .cm-mdhd button:last-child') || D.querySelector('#cm-sheet .sx')).click(); await wait(300); await h.settle(); console.log(`email 3: “${t3}” → ✕ (not sent) →`, title(), '·', co()); if (!/^⚡/.test(title()) || co() !== c0) bad.push('✕ back');
  const sk = [ ...D.querySelectorAll('#cm-sheet button') ].find((b) => /^Skip/.test(b.textContent.trim())); sk && sk.click(); await wait(3200); await loaded(); console.log('Skip → next company:', title(), '·', co()); if (!/^⚡/.test(title()) || co() === c0) bad.push('skip goes on');
  await email(); D.getElementById('cm-maildock').dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await wait(200); console.log('tap inside the docked email → Power hour stays:', title()); if (!/^⚡/.test(title())) bad.push('dock tap keeps power hour'); D.querySelector('#cm-maildock .cm-mdhd button:last-child').click();
  D.body.dispatchEvent(new W.MouseEvent('mousedown', { bubbles: true })); await wait(200); console.log('tap outside →', title()); if (title() !== '(closed)') bad.push('outside closes');
  D.querySelector('.cm-phbtn').click(); await loaded(); D.querySelector('#cm-sheet .sx').click(); await wait(200); console.log('Power hour ✕ →', title()); if (title() !== '(closed)') bad.push('✕ closes power hour');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
