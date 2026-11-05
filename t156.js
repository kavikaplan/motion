// WhatsApp / email link: only “opened” (not counted) until really sent — “How did it go?”, NetHunt live shows our message, or ✓ Sent on the bar · ✕ Not sent drops it
// + Days & goals: status-only = 📊 updated (not counted), bulk status changes as one line · timesheet ignores bulk status changes
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true }); await h.settle(); await wait(1500); await h.settle(); const W = h.w; const D = h.d;
  const posts = []; const of = W.fetch; W.fetch = async (u, o = {}) => { if (String(u) === '/api/medint' && o.method === 'POST') { posts.push(JSON.parse(o.body)); return new Response('{"ok":true}'); } return of(u, o); };
  try { W.localStorage.removeItem('medint.opened'); } catch (_e) { /* */ }
  // 1. tap a WhatsApp link on a company row → logged as Other “opened”, not WhatsApp
  const row = D.createElement('div'); row.className = 'cm-partner'; row.innerHTML = '<button data-open-company="cW1">Co W1</button><a data-direct="1" href="https://wa.me/56911112222?text=Hola">wa</a>'; D.body.append(row);
  W.addEventListener('click', (e) => e.preventDefault()); row.querySelector('a').click(); await wait(200);
  const p0 = posts.map((p) => `${p.Action}:${p.Outcome}`); console.log('logged on tap:', p0.join(' | '));
  if (!posts.some((p) => p.Action === 'Other' && /WhatsApp opened to \+56911112222/.test(p.Outcome)) || posts.some((p) => p.Action === 'WhatsApp')) bad.push('tap = opened only');
  const L0 = W.__cm3.poGet(); console.log('waiting to be confirmed:', L0.length, L0[0] && L0[0].cid); if (L0.length !== 1 || L0[0].cid !== 'cW1') bad.push('waiting list');
  // 2. NetHunt shows nothing yet → still waiting; then our message shows → WhatsApp logged (seen in NetHunt)
  const opened = L0[0].at; let chat = []; const NL = []; const f1 = W.fetch;
  const mcp = await W.claude.use('mcp'); const ct0 = mcp.callTool; mcp.callTool = async (srv, tool, a = {}) => { if (tool === 'list_record_timeline') { NL.push(a.recordId); return { content: [ { type: 'text', text: JSON.stringify({ events: [ 'pW1', 'cW1' ].includes(a.recordId) ? chat : [] }) } ] }; } return ct0(srv, tool, a); };
  await W.__cm3.poCheck(); console.log('NetHunt empty → logged WhatsApp:', posts.some((p) => p.Action === 'WhatsApp')); if (posts.some((p) => p.Action === 'WhatsApp')) bad.push('counted without NetHunt');
  chat = [ { id: 'ch1', time: opened + 6e4, chat: { status: 'NOT_REPLIED', totalMessageCount: 3, lastMessage: { date: opened + 6e4 } } } ];
  await W.__cm3.poCheck(); console.log('their message only (NOT_REPLIED) → logged:', posts.some((p) => p.Action === 'WhatsApp')); if (posts.some((p) => p.Action === 'WhatsApp')) bad.push('their message is not ours');
  chat = [ { id: 'ch1', time: opened + 9e4, chat: { status: 'REPLIED', totalMessageCount: 4, lastMessage: { date: opened + 9e4 } } } ];
  await W.__cm3.poCheck(); console.log('NetHunt records read:', [ ...new Set(NL) ].join(',')); const wa = posts.find((p) => p.Action === 'WhatsApp'); console.log('our message in NetHunt →', wa && wa.Outcome); if (!wa || !/seen in NetHunt/.test(wa.Outcome)) bad.push('NetHunt confirm');
  // 3. email draft → ✕ Not sent on the bar drops it (never counted)
  const row2 = D.createElement('div'); row2.className = 'cm-partner'; row2.innerHTML = '<button data-open-company="cE1">Co E1</button><a href="https://mail.google.com/mail/?view=cm&to=a@b.com&su=Hi">mail</a>'; D.body.append(row2);
  row2.querySelector('a').click(); await wait(200); const L1 = W.__cm3.poGet(); const em = L1.find((p) => p.cid === 'cE1'); em.at -= 6e4; W.localStorage.setItem('medint.opened', JSON.stringify(L1));
  W.document.dispatchEvent(new W.Event('visibilitychange')); await wait(500); const bar = D.getElementById('cm-pobar'); console.log('bar:', bar && bar.textContent);
  if (!bar || !/Did you send the email/.test(bar.textContent)) bad.push('bar'); else { [ ...bar.querySelectorAll('button') ].find((b) => /Not sent/.test(b.textContent)).click(); await wait(100); }
  console.log('after ✕ Not sent:', JSON.stringify(W.__cm3.poGet().find((p) => p.cid === 'cE1').done), '| email logged:', posts.some((p) => p.Action === 'Email')); if (posts.some((p) => p.Action === 'Email') || !/not sent/.test(W.__cm3.poGet().find((p) => p.cid === 'cE1').done)) bad.push('not sent');
  // 4. “How did it go?” answered → confirms
  W.__cm3.waOpened({ kind: 'wa', cid: 'cW2', to: '+1', text: 'x' }); W.__cm3.waConfirm('cW2', 'How did it go? answered'); const w2 = posts.filter((p) => p.Action === 'WhatsApp').pop(); console.log('answered →', w2 && w2.Outcome); if (!w2 || !/How did it go/.test(w2.Outcome)) bad.push('waConfirm');
  W.fetch = of; mcp.callTool = ct0;
  // 5. timesheet: a bulk status change (6 companies in a minute, nothing else done on them) is not a ⚡ Sales block
  const { DatabaseSync } = require('node:sqlite'); const sq = new DatabaseSync(':memory:');
  const stm = (sql) => { const st = { sql, a: [], bind: (...x) => { st.a = x; return st; }, run: async () => { const r = sq.prepare(sql).run(...st.a); return { meta: { changes: r.changes } }; }, first: async () => sq.prepare(sql).get(...st.a) || null, all: async () => ({ results: sq.prepare(sql).all(...st.a) }) }; return st; };
  const D1 = { prepare: stm, batch: async (L) => { const o = []; for (const s of L) o.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : await s.run()); return o; } };
  sq.exec('CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, epoch INTEGER, time TEXT, person TEXT, email TEXT, login TEXT, action TEXT, outcome TEXT, text TEXT, company_id TEXT, company TEXT, country TEXT, identity TEXT, source TEXT, voided INTEGER DEFAULT 0, nh_id TEXT, brand TEXT)');
  const T = await import(require('path').join(__dirname, '../functions/_lib/timesheet.js')); const m = 6e4; const now = Date.UTC(2026, 10, 5, 12, 0);
  const ins = (t, a, co) => sq.prepare("INSERT INTO events (epoch, person, email, login, action, company_id, company, brand, voided) VALUES (?,'Kavi','hi@kavikaplan.com','hi@kavikaplan.com',?,?,?,'dunitech',0)").run(now - t, a, co, `Co ${co}`);
  [ 0, 1, 2, 3, 4, 5 ].forEach((i) => ins(300 * m - i * 5e3, 'Status', `b${i}`)); // bulk at 07:00 UTC
  ins(200 * m, 'Call', 'r1'); ins(199 * m, 'Status', 'r1'); ins(185 * m, 'Call', 'r2'); // real work
  const adds = []; const ofG = global.fetch; global.fetch = async (u, o = {}) => { const b = JSON.parse(o.body || '{}'); if (b.action === 'people') return new Response(JSON.stringify([ { id: 'u1', name: 'Kavi Kaplan', email: 'hi@kavikaplan.com', timezone: 'Europe/Istanbul' } ]), { status: 200 }); if (b.action === 'labels') return new Response('[]', { status: 200 }); adds.push(b); return new Response(JSON.stringify({ id: 'T1' }), { status: 200 }); };
  const r = await T.tsSync({ MEDINT_DB: D1, TT_FUNCTION_URL: 'https://x.supabase.co/functions/v1/medint-sessions', TT_FUNCTION_TOKEN: 'pw' }, { now }); global.fetch = ofG;
  console.log('timesheet blocks:', JSON.stringify(r.sent)); if (adds.length !== 1 || !/2 companies/.test(adds[0].title) || adds[0].time !== '11:35') bad.push(`timesheet bulk (${adds.length})`);
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
