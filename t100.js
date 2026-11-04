// replies waiting: thanks / ok / emoji / "let me check" need no reply; no anonymous "Company" rows
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); const X = h.w.__cm3;
  const no = ['Okok e', '🥰', 'Okay, thanks', 'ok, let me check', 'Confirmed with thanks', 'SPAM 01No. 1000-1200 MA', 'Gracias!', 'Teşekkürler', '👍🏽'], yes = ['Hello, we would kindly appreciate your confirmation regarding the visit', 'Could you send the price list?', 'Özbekistan Kazakistan Kırgızistan // ENDLOG', '¿cuándo nos visitan?'];
  const bad = [...no.filter((s) => !X.rnNoReply(s)).map((s) => `should skip: ${s}`), ...yes.filter((s) => X.rnNoReply(s)).map((s) => `should keep: ${s}`)]; console.log('message rules:', bad.length ? bad.join(' | ') : 'all correct');
  X.openReplies(h.d.body); await h.settle(); const S = h.d.getElementById('cm-sheet'); const anon = [...S.querySelectorAll('.cm-rnrow .cm-co')].filter((b) => /^\s*Company\s*$/.test(b.textContent)).length; console.log('rows:', S.querySelectorAll('.cm-rnrow').length, '| anonymous "Company" rows:', anon, '|', (S.querySelector('p.mut') || {}).textContent.slice(0, 120));
  console.log(`errors ${h.errors.length + bad.length + anon}`); process.exit(0); })();
