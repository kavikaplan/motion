const { run } = require('./harness');
const CO = '6908ae29847fe001cd52bfef';
(async () => { const h = run({ params: { iso: 'CL', view: 'company', cid: CO, tags: ['chile'], ours: 'next' } }); h.d.dispatchEvent(new h.w.Event('pointerdown')); await new Promise((r) => setTimeout(r, 450)); h.w.dash.setParams({ view: 'company', cid: CO, iso: 'CL', tags: ['chile'] }); await h.settle(); await h.settle();
  h.w.cmBoot = { x: 1 }; const calls = [];
  const R = (o, s = 200) => Promise.resolve({ ok: s < 400, status: s, json: async () => o, text: async () => JSON.stringify(o) });
  h.w.fetch = (u, opt = {}) => { u = String(u); calls.push(u + ' ' + (opt.body || '').slice(0, 120));
    if (u.startsWith('/api/gmail/accounts')) return R({ role: 'House', accounts: [{ mailbox: 'hi@kavikaplan.com', aliases: [{ email: 'hi@kavikaplan.com', name: 'Kavi', signature: '<img src="https://x/y.png">', isDefault: true }] }] });
    if (u.startsWith('/api/gmail/labels')) return R({ labels: [{ id: 'INBOX', unread: 3, total: 50 }, { id: 'STARRED', unread: 0, total: 2 }] });
    if (u.startsWith('/api/gmail/threads')) return R({ mailbox: 'hi@kavikaplan.com', threads: [
      { id: 't1', subject: 'Price list request', from: 'Jackie <jbalz@ortogua.com>', to: 'hi@kavikaplan.com', date: Date.now() - 3600e3, snippet: 'Could you send prices?', count: 2, unread: true, starred: false, people: ['jbalz@ortogua.com', 'hi@kavikaplan.com'], files: true },
      { id: 't2', subject: 'Don’t miss conversations', from: 'LinkedIn <messages-noreply@linkedin.com>', to: 'hi@kavikaplan.com', date: Date.now() - 7200e3, snippet: 'View posts', count: 1, unread: false, people: ['messages-noreply@linkedin.com'] },
      { id: 't3', subject: 'Hazır Ofisiniz', from: 'bilgi@eofis.com.tr', to: 'hi@kavikaplan.com', date: Date.now() - 9200e3, snippet: 'Size', count: 1, unread: false, people: ['bilgi@eofis.com.tr'] }], next: 'p2' });
    if (u.startsWith('/api/gmail/thread')) return R({ mailbox: 'hi@kavikaplan.com', id: 't1', messages: [{ id: 'm1', from: 'Jackie <jbalz@ortogua.com>', to: 'hi@kavikaplan.com', cc: 'ana@ortogua.com', subject: 'Price list request', date: Date.now() - 3600e3, messageId: '<x1@mail>', references: '', text: 'Could you send prices?', html: '<p>Could you send <b>prices</b>?</p><img src="https://x/sig.png">', files: [{ name: 'RFQ.pdf', id: 'a1', type: 'application/pdf', size: 120000 }], mine: false, unread: true }] });
    if (u.startsWith('/api/gmail/modify')) return R({ ok: true });
    if (u === '/api/files') return R({ files: [] }); if (u.startsWith('/api/files/_templates')) return R([]);
    return R({}); };
  await h.w.__cm3.openInbox(h.d.body); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  const S = () => h.d.getElementById('cm-sheet');
  console.log('labels:', [...S().querySelectorAll('.cm-ibl')].map((b) => b.textContent).join(' | '));
  console.log('rows:', [...S().querySelectorAll('.cm-ibr')].map((r) => `${r.querySelector('.who').textContent}→${(r.querySelector('.cm-ibco') || {}).textContent || 'no company'}`).join(' ; '));
  S().querySelectorAll('.cm-ibr input[type=checkbox]')[1].click(); await h.settle(); console.log('toolbar with selection:', [...S().querySelectorAll('.cm-ibtb .cm-ibtool')].map((b) => b.textContent).join(' '));
  [...S().querySelectorAll('.cm-ibtb .cm-ibtool')].find((b) => b.title.startsWith('Delete')).click(); await new Promise((r) => setTimeout(r, 100)); await h.settle(); console.log('after delete rows:', S().querySelectorAll('.cm-ibr').length, '| modify call:', calls.filter((c) => c.includes('modify')).pop());
  S().querySelector('.cm-ibr').click(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  console.log('thread:', S().querySelector('.cm-ibsubj').textContent, '| company:', (S().querySelector('.cm-ibcobar') || {}).textContent, '| iframe:', !!S().querySelector('.cm-ibframe'), '| file:', (S().querySelector('.cm-ibfile') || {}).textContent, '| tools:', [...S().querySelectorAll('.cm-ibtb .cm-ibtool')].map((b) => b.textContent).join(' '));
  [...S().querySelectorAll('.cm-ibreply .cm-btn')].find((b) => /all/.test(b.textContent)).click(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  console.log('reply all:', h.d.getElementById('cm-sheet-title').textContent, '| to:', S().querySelectorAll('.cm-mlform input')[0].value, '| cc:', S().querySelectorAll('.cm-mlform input')[1].value);
  console.log('step A'); h.w.__cm.closeSheet(); await h.settle(); console.log('step B'); await h.w.__cm3.openInbox(h.d.querySelector('#company-activity') || h.d.body); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  // link LinkedIn row to a company with the picker
  console.log('step C', S().querySelectorAll('.cm-ibr').length); const rows = [...S().querySelectorAll('.cm-ibr')]; const li = rows.find((r) => /eofis/.test(r.textContent)); li.click(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  const lk = [...S().querySelectorAll('.cm-ibcobar .cm-chip')].find((b) => /Link/.test(b.textContent)); console.log('link button:', lk && lk.textContent); if (lk) { lk.click(); await h.settle(); const inp = S().querySelector('.cm-cpick input:not([type])'); inp.value = 'ortog'; inp.dispatchEvent(new h.w.Event('input')); console.log('picker:', [...S().querySelectorAll('.cm-cpick-row')].map((r) => r.textContent).slice(0, 3).join(' | ')); }
  console.log('inbox button:', (h.d.querySelector('.cm-ibbtn') || {}).textContent);
  console.log('errors', h.errors.length, h.errors.join('').slice(0, 300)); process.exit(0); })();
