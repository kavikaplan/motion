// 📈 tap any day on the progress chart → that day's companies and details · Power hour leaves out companies contacted today or yesterday
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } });
  { // Days & goals numbers as the server sends them: Kavi worked 2 companies 3 days ago, 1 today
    const W0 = h.w; const of = W0.fetch; const R0 = W0.Response || globalThis.Response; const now = Date.now(); const t0 = Math.floor((now - new Date().getTimezoneOffset() * -6e4) / 864e5);
    W0.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/medint?daily=1')) { const t = W0.__cm2x ? W0.__cm2x.dayIdx(now) : t0; return new R0(JSON.stringify({ rows: [ { person: 'Kavi', d: t, action: 'Call', company_id: 'cA', company: 'Alpha Medical', at: now - 36e5, n: 1 }, { person: 'Kavi', d: t - 3, action: 'WhatsApp', company_id: 'cB', company: 'Beta Ortho', at: now - 3 * 864e5, n: 2 }, { person: 'Kavi', d: t - 3, action: 'Email', company_id: 'cC', company: 'Gamma Trauma', at: now - 3 * 864e5 + 6e5, n: 1 } ], plans: [], found: [ { person: 'Kavi', d: t - 3, outcome: 'found email', n: 2 }, { person: 'Kavi', d: t, outcome: 'found phone', n: 1 } ] }), { status: 200 }); } return of(u, o); }; }
  await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d, X2 = W.__cm2x;
  // (1) the chart
  const t0 = X2.dayIdx(Date.now()); for (let k = 0; k < 15 && !X2.daysData(); k++) { await wait(300); await h.settle(); }
  const host = D.createElement('div'); D.body.append(host); host.append(X2.progressView('Kavi'));
  const cols = () => [ ...host.querySelectorAll('.cm-mychart .col') ]; console.log('days on the chart:', cols().length, '| buttons:', cols().every((c) => c.tagName === 'BUTTON'), '| a day open before tapping:', !!host.querySelector('.cm-progday'));
  if (cols().length !== 14 || !cols().every((c) => c.tagName === 'BUTTON') || host.querySelector('.cm-progday')) bad.push('chart');
  const tile = () => [ ...host.querySelectorAll('.cm-found span') ].map((s) => s.textContent.replace(/\s+/g, ' ').trim()).filter((t) => /\+/.test(t)).join(' | ');
  console.log('details for today:', tile()); if (!/\+1 today/.test(tile())) bad.push('today tile');
  cols()[10].click(); await wait(50);
  const day = host.querySelector('.cm-progday'); const rows = [ ...host.querySelectorAll('.cm-progday .cm-dayco') ].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
  console.log('after tapping 3 days ago — picked:', cols()[10].classList.contains('sel'), '| header:', day && day.querySelector('.h').textContent.replace(/\s+/g, ' ').trim(), '| companies:', rows.join(' || '), '| details:', tile());
  if (!day || !cols()[10].classList.contains('sel') || rows.length !== 2 || !rows.some((r) => /Beta Ortho/.test(r) && /💬 2/.test(r)) || !/\+2 /.test(tile()) || /today/.test(tile())) bad.push('picked day');
  [ ...host.querySelectorAll('.cm-progday button') ].find((b) => b.textContent === '›').click(); await wait(50); console.log('› next day:', host.querySelector('.cm-progday .h b').textContent, '|', (host.querySelector('.cm-progday .mut') || {}).textContent);
  if (!cols()[11].classList.contains('sel')) bad.push('next day');
  host.querySelector('.cm-progday .x').click(); await wait(50); console.log('✕ closes:', !host.querySelector('.cm-progday'), '|', tile()); if (host.querySelector('.cm-progday') || !/today/.test(tile())) bad.push('close');
  // (2) Power hour: contacted today / yesterday → left out (unless they wrote back since)
  const q0 = X2.powerQueue().list; const cand = q0.filter((x) => x.t !== 0); console.log('queue before:', q0.length);
  const [ a, b, c ] = cand; const ch = W.dash.data('contact_history').data; const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(10, 0, 0, 0); const d3 = new Date(Date.now() - 3 * 864e5);
  ch.push({ record_id: a.id, time: new Date(Date.now() - 2 * 36e5).toISOString(), dir: 'out', type: 'call', who: 'Yaman' }, { record_id: b.id, time: y.toISOString(), dir: 'out', type: 'whatsapp', who: 'Luz' }, { record_id: c.id, time: d3.toISOString(), dir: 'out', type: 'email', who: 'Luz' });
  W.dash.setParams({ ours: 'motion' }); await h.settle(); X2.powerQueue(); W.dash.setParams({ ours: 'dunitech' }); await h.settle(); await wait(200);
  const q1 = X2.powerQueue().list.map((x) => x.id); const gone = q0.filter((x) => !q1.includes(x.id)).map((x) => x.name);
  console.log('called 2 h ago (', a.t, '):', q1.includes(a.id), '| WhatsApp yesterday (', b.t, '):', q1.includes(b.id), '| they wrote (kept):', q0.filter((x) => x.t === 0).every((x) => q1.includes(x.id)), '| left out:', gone.join(', '));
  if (q1.includes(a.id) || q1.includes(b.id) || !q0.filter((x) => x.t === 0).every((x) => q1.includes(x.id)) || q0.filter((x) => x.id !== c.id && !q1.includes(x.id)).length !== 2) bad.push('recent contacts');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
