// 📣 campaign sending is safe: overlapping runs send once per mailbox, a busy mailbox doesn't block the others, Gmail 429 / revoked token rests the
// mailbox (no tries burned), a pause that comes in during a send is kept, a send cut off half-way is found in Sent (not sent twice), a failed create
// leaves nothing behind; leadstore pages without losing rows; MIME with quotes in file names and accents in To — node:sqlite stands in for D1
(async () => { const P = require('path'); const { DatabaseSync } = require('node:sqlite'); const bad = [];
  const sq = new DatabaseSync(':memory:'); let failBatch = 0;
  const mk = () => ({ prepare: (sql) => { const st = { args: [], sql, bind: (...a) => { st.args = a; return st; }, run: async () => { const r = sq.prepare(sql).run(...st.args); return { meta: { changes: r.changes } }; }, first: async () => sq.prepare(sql).get(...st.args) || null, all: async () => ({ results: sq.prepare(sql).all(...st.args) }) }; return st; },
    batch: async (L) => { if (failBatch && --failBatch === 0) throw new Error('D1 batch failed'); for (const st of L) await st.run(); return []; } });
  const D1 = mk();
  let sentHit = null; const sends = [];
  global.fetch = async (u, o = {}) => { u = String(u); const J = (x, s = 200) => new Response(JSON.stringify(x), { status: s });
    if (u.includes('oauth2.googleapis.com/token')) return J({ access_token: 'tok', expires_in: 3600 });
    if (u.includes('settings/sendAs')) return J({ sendAs: [ { sendAsEmail: 'hi@kavikaplan.com', isDefault: true, displayName: 'A' }, { sendAsEmail: 'b@kavikaplan.com', displayName: 'B' } ] });
    if (/messages\?maxResults=5&q=/.test(u)) return J(sentHit ? { messages: [ sentHit ] } : {});
    if (/messages\/[\w]+\?format=metadata/.test(u)) return J({ payload: { headers: [ { name: 'Message-ID', value: '<x@mail>' } ] } });
    if (/threads\?maxResults/.test(u)) return J({ threads: [] }); if (/threads\/[\w]+\?format=metadata/.test(u)) return J({ messages: [] });
    return J({}, 404); };
  const { seal } = await import(P.join(__dirname, '../functions/_lib/gmail.js')); const G = await import(P.join(__dirname, '../functions/_lib/gmail.js')); const K = await import(P.join(__dirname, '../functions/_lib/camp.js')); const R = await import(P.join(__dirname, '../functions/api/gmail/[[path]].js'));
  const CLK = { t: Date.UTC(2026, 10, 3, 15, 0) }; K.clock.now = () => CLK.t;
  const env = { GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'y', TOKEN_KEY: 'k', MEDINT_DB: D1 };
  sq.exec('CREATE TABLE IF NOT EXISTS gmail_accounts (mailbox TEXT PRIMARY KEY, token TEXT, sendas TEXT, by TEXT, at INTEGER)');
  for (const b of [ 'hi@kavikaplan.com', 'b@kavikaplan.com' ]) sq.prepare('INSERT INTO gmail_accounts VALUES (?, ?, NULL, ?, 0)').run(b, await seal(env, 'refresh'), 'hi@kavikaplan.com');
  const call = async (path, method, body, who = 'hi@kavikaplan.com') => { const r = await R.onRequest({ request: new Request(`https://m/api/gmail/${path}`, { method, headers: { 'content-type': 'application/json', 'cf-access-authenticated-user-email': who }, ...(body ? { body: JSON.stringify(body) } : {}) }), env: { ...env, MEDINT_HOUSE: 'hi@kavikaplan.com' }, params: { path: path.split('?')[0].split('/') } }); return [ r.status, await r.json() ]; };
  let mode = 'ok'; let onSend = null;
  const deps = { sendNow: async (e, box, q) => { if (mode === '429') throw new Error('Gmail: 429 Too Many Requests — userRateLimitExceeded'); onSend && await onSend(); sends.push([ box, q.to ]); return { id: `m${sends.length}`, threadId: `t${sends.length}` }; }, logSent: async () => {}, timeline: async () => ({ events: [] }) };
  const steps = [ { subject: 'Hi {company}', body: 'Hello {name|there}' }, { body: 'Follow up', wait: 3 } ];
  const mkRc = (n, dom) => Array.from({ length: n }, (_, i) => ({ company_id: `${dom}${i}`, company: `${dom} ${i}`, iso: 'CL', kind: 'company', email: `info${i}@${dom}.cl` }));
  // a big campaign on mailbox A, a small one on B
  const [sA, cA] = await call('camp/create', 'POST', { name: 'A big', mailbox: 'hi@kavikaplan.com', sender: 'hi@kavikaplan.com', steps, rcpts: mkRc(40, 'aa') }); const [, cB] = await call('camp/create', 'POST', { name: 'B small', mailbox: 'b@kavikaplan.com', sender: 'b@kavikaplan.com', steps, rcpts: mkRc(1, 'bb') }, 'b@kavikaplan.com');
  console.log('created:', sA, cA.added, cB.added);
  // three runs at the same moment (cron + two open browsers)
  await Promise.all([ K.campRun(env, deps), K.campRun(env, deps), K.campRun(env, deps) ]); const byBox = sends.reduce((m, [b]) => (m[b] = (m[b] || 0) + 1, m), {}); console.log('overlapping runs → sends per mailbox:', JSON.stringify(byBox));
  if (byBox['hi@kavikaplan.com'] !== 1 || byBox['b@kavikaplan.com'] !== 1) bad.push('one per mailbox per round, and B not blocked by A');
  const nextOk = sq.prepare('SELECT next_ok FROM camp_box WHERE mailbox = ?').get('hi@kavikaplan.com').next_ok; console.log('A rests:', Math.round((nextOk - CLK.t) / 6e4), 'min'); if (nextOk - CLK.t < 3 * 6e4) bad.push('spacing after a send');
  // Gmail says “too many”: nobody fails, the mailbox rests an hour
  CLK.t += 10 * 6e4; mode = '429'; const o4 = await K.campRun(env, deps); mode = 'ok'; const r429 = sq.prepare("SELECT status, tries, err FROM camp_rcpt WHERE camp_id = ? AND err LIKE 'mailbox:%'").get(cA.id); const b429 = sq.prepare('SELECT next_ok, err FROM camp_box WHERE mailbox = ?').get('hi@kavikaplan.com');
  console.log('429:', JSON.stringify(r429), '| mailbox rests', Math.round((b429.next_ok - CLK.t) / 6e4), 'min |', (b429.err || '').slice(0, 50)); if (!r429 || r429.status !== 'active' || r429.tries !== 0 || b429.next_ok - CLK.t < 50 * 6e4) bad.push('429 backs off the mailbox');
  const failed = sq.prepare("SELECT COUNT(*) AS n FROM camp_rcpt WHERE status = 'failed'").get().n; failed && bad.push('no one failed by a mailbox error');
  const [, ld] = await call('camp/load', 'GET'); const la = ld.boxes.find((b) => b.mailbox === 'hi@kavikaplan.com'); console.log('load shows the error:', !!(la && la.err)); (!la || !la.err) && bad.push('load panel error');
  // a pause that arrives while the email is being sent is kept
  CLK.t += 61 * 6e4; const target = sq.prepare("SELECT id, company_id FROM camp_rcpt WHERE camp_id = ? AND status = 'active' ORDER BY next_at, seq LIMIT 1").get(cA.id);
  onSend = async () => { await call('camp/who', 'POST', { id: cA.id, company: target.company_id, action: 'pause' }); }; const n0 = sends.length; await K.campRun(env, deps); onSend = null;
  const tr = sq.prepare('SELECT status, step FROM camp_rcpt WHERE id = ?').get(target.id); console.log('pause during the send:', JSON.stringify(tr), '| sent', sends.length - n0); if (sends.length - n0 !== 1 || tr.status !== 'paused' || tr.step !== 1) bad.push('pause kept, step recorded');
  // a send cut off half-way: found in Gmail's Sent, not sent again
  CLK.t += 10 * 6e4; const t2 = sq.prepare("SELECT id FROM camp_rcpt WHERE camp_id = ? AND status = 'active' ORDER BY next_at, seq LIMIT 1").get(cA.id); sq.prepare("UPDATE camp_rcpt SET status = 'sending', claimed_at = ? WHERE id = ?").run(CLK.t - 11 * 6e4, t2.id); sq.prepare('UPDATE camp_box SET next_ok = 0').run();
  sentHit = { id: 'mX', threadId: 'tX' }; const n1 = sends.length; await K.campRun(env, deps); sentHit = null; const r2 = sq.prepare('SELECT status, step, thread_id, err FROM camp_rcpt WHERE id = ?').get(t2.id); console.log('recovered:', JSON.stringify(r2), '| new sends', sends.length - n1);
  if (r2.step !== 1 || r2.thread_id !== 'tX' || sends.length - n1 !== 0) bad.push('cut-off send not repeated');
  // a create that fails half-way leaves nothing
  failBatch = 2; const before = sq.prepare('SELECT COUNT(*) AS n FROM camp').get().n; const [sF] = await call('camp/create', 'POST', { name: 'Broken', mailbox: 'hi@kavikaplan.com', sender: 'hi@kavikaplan.com', steps, rcpts: mkRc(120, 'cc') }); failBatch = 0;
  const after = sq.prepare('SELECT COUNT(*) AS n FROM camp').get().n; const orphans = sq.prepare("SELECT COUNT(*) AS n FROM camp_rcpt WHERE email LIKE '%@cc.cl'").get().n; console.log('failed create:', sF, '| campaigns', before, '→', after, '| leftover people', orphans); (after !== before || orphans) && bad.push('atomic create');
  // leadstore: rows with the same time are not lost between pages
  const LSm = await import(P.join(__dirname, '../functions/api/leadstore.js')); const envL = { MEDINT_DB: mk() };
  await LSm.onRequestGet({ request: new Request('https://m/api/leadstore?since=0'), env: envL }); const at = Date.now(); const ins = sq.prepare('INSERT INTO leadstore (kind, k, v, by, at) VALUES (?, ?, ?, ?, ?)'); for (let i = 0; i < 4100; i++) ins.run('qual', `k${String(i).padStart(5, '0')}`, '{"label":"ortho"}', 'x', at);
  let since = 0, ck = '', got = 0, pages = 0, more = !0; while (more && pages < 5) { const r = await LSm.onRequestGet({ request: new Request(`https://m/api/leadstore?since=${since}&ck=${encodeURIComponent(ck)}`), env: envL }); const j = await r.json(); got += j.rows.length; since = j.now; ck = j.ck; more = j.more; pages++; }
  console.log('leadstore pages:', pages, '| rows', got); got !== 4100 && bad.push('leadstore paging');
  // MIME: quotes in a file name, accents in To
  const raw = G.mime({ from: 'a@kavikaplan.com', to: 'María Pérez <maria@x.cl>, bob@y.cl', subject: 'Hola', text: 't', html: 'h', files: [ { name: 'Price "2026".pdf', type: 'application/pdf', b64: 'JVBERi0=' } ] });
  const okM = /^To: =\?UTF-8\?B\?[^?]+\?= <maria@x\.cl>, bob@y\.cl$/m.test(raw) && /filename="Price _2026_.pdf"/.test(raw); let b64ok = !0; try { btoa(raw); } catch { b64ok = !1; } console.log('MIME To / file name / ascii:', okM, b64ok); (!okM || !b64ok) && bad.push('mime headers');
  // 🎉 their public holiday: no campaign email that day (holidays come from the site's data file)
  const KC = await import(P.join(__dirname, '../functions/_lib/camp_core.js')); const envH = { MEDINT_DB: mk(), ASSETS: { fetch: async () => new Response(JSON.stringify([ { iso: 'CL', date: '2026-11-04', name: 'Test day', pub: 1 }, { iso: 'CL', date: '2026-11-05', name: 'Not public', pub: 0 } ])) } };
  KC.HOL.clear(); const Kh = await import(P.join(__dirname, '../functions/_lib/camp.js')); await Kh.holidays(envH);
  const a1 = KC.afterDays(Date.UTC(2026, 10, 3, 15), 'America/Santiago', 1, 10, 0, 'CL'); const nh1 = KC.nextOpen(Date.UTC(2026, 10, 4, 15), 'America/Santiago', 0, 'CL'); const n2 = KC.nextOpen(Date.UTC(2026, 10, 4, 15), 'America/Santiago', 0, 'PE');
  console.log('holiday 4 Nov in Chile → follow-up on', new Date(a1).toISOString().slice(0, 10), '| opens', new Date(nh1).toISOString().slice(0, 16), '| Peru not affected:', new Date(n2).toISOString().slice(0, 16));
  if (new Date(a1).toISOString().slice(0, 10) !== '2026-11-05' || new Date(nh1).toISOString().slice(0, 10) !== '2026-11-05' || n2 !== Date.UTC(2026, 10, 4, 15)) bad.push('holidays');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
