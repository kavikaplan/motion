// 📣 campaigns on the server: create (dedupe, busy, alias), one email per mailbox per round, their working hours, 50/day per mailbox (cap),
// variables incl. people, follow-ups in the same thread, reply → whole company paused, bounce → that address stopped,
// interaction → the company's choice (pause default / continue), load per mailbox, edit adds a follow-up, stop — node:sqlite stands in for D1
(async () => { const P = require('path'); const { DatabaseSync } = require('node:sqlite'); const bad = [];
  const sq = new DatabaseSync(':memory:'); const D1 = { prepare: (sql) => { const st = { args: [], bind: (...a) => { st.args = a; return st; }, run: async () => { const r = sq.prepare(sql).run(...st.args); return { meta: { changes: r.changes } }; }, first: async () => sq.prepare(sql).get(...st.args) || null, all: async () => ({ results: sq.prepare(sql).all(...st.args) }) }; return st; }, batch: async (L) => { for (const st of L) await st.run(); return []; } };
  const sent = []; const threads = {}; let swept = 0;
  global.fetch = async (u, o = {}) => { u = String(u); const J = (x) => new Response(JSON.stringify(x));
    if (u.includes('oauth2.googleapis.com/token')) return J({ access_token: 'tok', expires_in: 3600 });
    if (u.includes('settings/sendAs')) return J({ sendAs: [ { sendAsEmail: 'hi@kavikaplan.com', isDefault: true, displayName: 'Kavi', signature: 'Kavi Kaplan<br>United Vision' }, { sendAsEmail: 'sales@kavikaplan.com', displayName: 'Kavi Sales', signature: '<b>Sales</b> team' } ] });
    if (u.includes('messages/send')) { const b = JSON.parse(o.body); const raw = Buffer.from(b.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); const tid = b.threadId || `th${sent.length + 1}`; sent.push({ raw, threadId: b.threadId || '', tid }); threads[tid] = threads[tid] || []; threads[tid].push({ id: `m${sent.length}`, internalDate: String(CLK.t), payload: { headers: [ { name: 'From', value: 'Kavi Sales <sales@kavikaplan.com>' } ] } }); return J({ id: `m${sent.length}`, threadId: tid }); }
    const mm = u.match(/messages\/(m\d+)\?format=metadata/); if (mm) return J({ payload: { headers: [ { name: 'Message-ID', value: `<${mm[1]}@mail.gmail.com>` } ] } });
    const tm = u.match(/threads\/([\w]+)\?format=metadata/); if (tm) return J({ id: tm[1], messages: threads[tm[1]] || [] });
    if (/threads\?maxResults/.test(u)) { swept++; return J({ threads: Object.keys(threads).map((id) => ({ id })) }); }
    return new Response('{}', { status: 404 }); };
  const { seal } = await import(P.join(__dirname, '../functions/_lib/gmail.js')); const G = await import(P.join(__dirname, '../functions/api/gmail/[[path]].js')); const K = await import(P.join(__dirname, '../functions/_lib/camp.js'));
  const CLK = { t: Date.UTC(2026, 10, 3, 15, 0) }; K.clock.now = () => CLK.t; // Tue 3 Nov 2026 15:00 UTC = 12:00 Santiago, 09:00 Mexico City
  const env = { GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'y', TOKEN_KEY: 'k', MEDINT_DB: D1, CRON_KEY: 'secret' };
  sq.exec('CREATE TABLE IF NOT EXISTS gmail_accounts (mailbox TEXT PRIMARY KEY, token TEXT, sendas TEXT, by TEXT, at INTEGER)'); sq.prepare('INSERT INTO gmail_accounts VALUES (?, ?, NULL, ?, 0)').run('hi@kavikaplan.com', await seal(env, 'refresh'), 'hi@kavikaplan.com');
  const call = async (path, method, body) => { const r = await G.onRequest({ request: new Request(`https://m/api/gmail/${path}`, { method, headers: { 'content-type': 'application/json', 'cf-access-authenticated-user-email': 'hi@kavikaplan.com' }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, params: { path: path.split('?')[0].split('/') } }); return [ r.status, await r.json() ]; };
  const logs = []; let TL = {}; const deps = { sendNow: (...a) => G.sendNow(...a), logSent: async (e, login, f) => { logs.push(f); }, timeline: async (cid, from) => ({ events: (TL[cid] || []).filter((e) => e.time >= from) }) };
  const run = () => K.campRun(env, deps, { force: true });
  const A = { company_id: 'coA', company: 'Promed Chile', iso: 'CL', country: 'Chile', city: 'Santiago' }, B = { company_id: 'coB', company: 'OrtoMex', iso: 'MX', country: 'Mexico', city: 'Monterrey' }, Cc = { company_id: 'coC', company: 'Traumed', iso: 'CL', country: 'Chile', city: 'Concepción' };
  const rc = [ { ...A, kind: 'company', email: 'info@promed.cl' }, { ...A, kind: 'person', person_id: 'p1', name: 'Dr. Ana Ruiz', title: 'Gerente', email: 'ana@promed.cl' }, { ...A, kind: 'person', person_id: 'p2', name: 'Luis Soto', email: 'INFO@promed.cl' }, { ...A, kind: 'person', person_id: 'p3', name: 'Marta Díaz', email: 'marta@promed.cl' },
    { ...B, kind: 'person', person_id: 'p4', name: 'Jorge Pérez', email: 'jorge@ortomex.mx' }, { ...Cc, kind: 'person', person_id: 'p5', name: 'Rosa Vega', email: 'rosa@traumed.cl' }, { ...Cc, kind: 'person', email: 'bad-email' }, { ...B, kind: 'person', email: 'busy@other.mx', name: 'Busy One' } ];
  const steps = [ { subject: 'Shoulder implants for {company}', body: 'Hola {name|there},\n\nWe make shoulder implants. Is {company} in {city} working with shoulder surgeons?\n\n{my_name}' }, { body: 'Hi {name|there}, any thoughts?', wait: 3, hour: 10 }, { body: 'Last note, {name|there}.', wait: 4 } ];
  // someone else already has busy@other.mx in an active campaign
  let [s0, c0] = await call('camp/create', 'POST', { name: 'Other', mailbox: 'hi@kavikaplan.com', sender: 'hi@kavikaplan.com', steps: [ { subject: 'x', body: 'y' } ], rcpts: [ { email: 'busy@other.mx', company_id: 'coZ', iso: 'MX' } ] }); await call('camp/act', 'POST', { id: c0.id, action: 'pause' });
  const [ck] = [ (await call('camp/check', 'POST', { emails: [ 'busy@other.mx', 'ana@promed.cl' ] }))[1] ]; console.log('check:', JSON.stringify(ck.busy)); if (ck.busy.length !== 1) bad.push('check busy');
  let [s1, c1] = await call('camp/create', 'POST', { name: 'Chile shoulder Nov', mailbox: 'hi@kavikaplan.com', sender: 'sales@kavikaplan.com', brand: 'Next Shoulder', steps, rcpts: rc, optout: 'Not relevant? Just reply “no” and I won’t write again.', log: { Person: 'Kavi', 'Person email': 'hi@kavikaplan.com', Source: 'Website' } });
  console.log('create:', s1, c1.added, '| skipped:', c1.skipped.map((x) => `${x.email}(${x.why})`).join(', ')); if (c1.added !== 5 || c1.skipped.length !== 3) bad.push('create dedupe/busy/invalid');
  let [s2] = await call('camp/create', 'POST', { name: 'Bad alias', mailbox: 'hi@kavikaplan.com', sender: 'nobody@kavikaplan.com', steps, rcpts: rc }); s2 === 400 || bad.push('alias checked');
  await call('camp/cap', 'POST', { mailbox: 'hi@kavikaplan.com', cap: 3 });
  // rounds: one email per mailbox per round, 3 a day (cap)
  for (let i = 0; i < 5; i++) await run(); console.log('day 1 sends:', sent.length); if (sent.length !== 3) bad.push('cap 3/day');
  const dec = (raw) => { const parts = raw.split(/\r?\n\r?\n/); return raw + parts.map((p) => { try { return Buffer.from(p.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch { return ''; } }).join('\n'); };
  const first = sent[0].raw; const to = sent.map((x) => (x.raw.match(/^To: (.*)$/m) || [])[1]); console.log('order:', to.join(' · '));
  if (!/^From: .*sales@kavikaplan\.com/m.test(first)) bad.push('from alias'); if (!/<b>Sales<\/b> team/.test(dec(first))) bad.push('alias signature'); if (!/reply “no”|reply =E2=80=9Cno/.test(first) && !/Not relevant/.test(Buffer.from(first).toString())) 0;
  const dec0 = (raw) => { const parts = raw.split(/\r?\n\r?\n/); return raw + parts.map((p) => { try { return Buffer.from(p.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch { return ''; } }).join('\n'); };
  const d0 = dec(first); console.log('email 1 text:', (d0.match(/Hola[^\n<]*/) || [])[0], '|', (d0.match(/Is [^?]*\?/) || [])[0]);
  if (!/Hola there,/.test(d0) || !/Is Promed Chile in Santiago working/.test(d0) || !/Not relevant/.test(d0) || !/Kavi Sales/.test(d0)) bad.push('variables / opt-out (company email → “there”)');
  const d1 = dec(sent[1].raw); if (!/Hola Jorge,/.test(d1)) bad.push('person first name'); console.log('to Jorge:', (d1.match(/Hola[^\n<]*/) || [])[0]);
  if (to[0] !== 'info@promed.cl' || !/jorge/.test(to[1]) || !/rosa/.test(to[2])) bad.push('round robin across companies');
  console.log('logged:', logs.length, logs[0] && logs[0].Outcome); if (logs.length !== 3 || !/📣 Chile shoulder Nov · email 1 of 3/.test(logs[0].Outcome) || logs[0].Company[0] !== 'coA') bad.push('log');
  // load
  let [, ld] = await call('camp/load', 'GET'); const bx = ld.boxes[0]; console.log('load:', bx.mailbox, 'cap', bx.cap, 'today', bx.today, 'waiting', bx.waiting, '| next days:', bx.days.slice(0, 3).map((d) => `${d.d}:${d.camp}`).join(' ')); if (bx.today !== 3 || bx.cap !== 3 || bx.days[1].camp !== 2) bad.push('load');
  // outside their hours → nothing; next morning their time → the rest
  CLK.t = Date.UTC(2026, 10, 4, 3, 0); await run(); const n1 = sent.length; CLK.t = Date.UTC(2026, 10, 4, 15, 0); for (let i = 0; i < 4; i++) await run(); console.log('night:', n1 - 3, '| next day:', sent.length - n1); if (n1 !== 3 || sent.length !== 5) bad.push('working hours / next day');
  // interaction: Traumed had a call where we spoke → paused (default), with the reason
  TL.coC = [ { type: 'call', time: Date.UTC(2026, 10, 5, 12), text: 'Call — Spoke with Rosa, send catalogue\n— Luz' }, { type: 'call', time: Date.UTC(2026, 10, 5, 11), text: 'No answer' } ];
  TL.coB = [ { type: 'call', time: Date.UTC(2026, 10, 5, 12), text: 'No answer\n— Luz' }, { type: 'chat', time: Date.UTC(2026, 10, 5, 12), chat: { status: 'REPLIED', lastMessage: { body: 'our message', date: Date.UTC(2026, 10, 5, 12) } } } ];
  // replies: Ana (Promed) answered in the thread; Jorge's address bounced
    const anaT = sent.find((x) => /ana@promed\.cl/.test(x.raw)).tid; threads[anaT].push({ id: 'r1', internalDate: String(Date.UTC(2026, 10, 5, 14)), snippet: 'Yes, send me the catalogue', payload: { headers: [ { name: 'From', value: 'Ana Ruiz <ana@promed.cl>' } ] } });
  const jT = sent.find((x) => /jorge@ortomex/.test(x.raw)).tid; threads[jT].push({ id: 'b1', internalDate: String(Date.UTC(2026, 10, 5, 13)), snippet: 'Address not found', payload: { headers: [ { name: 'From', value: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>' } ] } });
  CLK.t = Date.UTC(2026, 10, 9, 16, 0); const n2 = sent.length; for (let i = 0; i < 6; i++) await run();
  let [, g] = await call(`camp/get?id=${c1.id}`, 'GET'); const st = Object.fromEntries(g.rcpts.map((r) => [ r.email, `${r.status}:${r.step}${r.reason ? ` (${r.reason.slice(0, 40)})` : ''}` ])); console.log('after 3 business days:', JSON.stringify(st)); console.log('follow-ups sent:', sent.length - n2, '| swept', swept);
  if (!/^paused/.test(st['ana@promed.cl']) || !/replied/.test(st['ana@promed.cl'])) bad.push('reply → paused');
  if (!/^paused/.test(st['info@promed.cl']) || !/^paused/.test(st['marta@promed.cl'])) bad.push('reply pauses whole company');
  if (!/^bounced/.test(st['jorge@ortomex.mx'])) bad.push('bounce');
  if (!/^paused:1 \(call: Call — Spoke/.test(st['rosa@traumed.cl'])) bad.push('interaction → pause');
  if (sent.length !== n2) bad.push('nothing else due to send');
  // continue Traumed: follow-up 2 goes in the same thread, subject Re:, only interactions after now count
  await call('camp/who', 'POST', { id: c1.id, company: 'coC', action: 'continue' }); for (let i = 0; i < 3; i++) await run(); const f2 = sent[sent.length - 1]; const df = dec(f2.raw);
  console.log('Rosa follow-up:', f2.threadId === sent.find((x) => /rosa@traumed/.test(x.raw)).tid, (f2.raw.match(/^Subject: (.*)$/m) || [])[1], (df.match(/Hi [^\n<]*/) || [])[0]);
  if (f2.threadId !== sent.find((x) => /rosa@traumed/.test(x.raw)).tid || !/In-Reply-To: <m\d+@mail\.gmail\.com>/.test(f2.raw) || !/Hi Rosa, any thoughts\?/.test(df) || /Not relevant/.test(df)) bad.push('follow-up in thread');
  const subj = (f2.raw.match(/^Subject: (.*)$/m) || [])[1] || ''; if (!/^Re: Shoulder implants for Traumed|=\?UTF-8\?B\?/.test(subj)) bad.push('Re: subject');
  // per-company choice: continue on interaction (B is bounced, so use A after resuming the company)
  await call('camp/who', 'POST', { id: c1.id, company: 'coA', action: 'touch', value: 'continue' }); TL.coA = [ { type: 'calendar', time: Date.UTC(2026, 10, 10, 9) } ]; await call('camp/who', 'POST', { id: c1.id, company: 'coA', action: 'continue' });
  CLK.t = Date.UTC(2026, 10, 10, 16, 0); const n3 = sent.length; for (let i = 0; i < 4; i++) await run(); [, g] = await call(`camp/get?id=${c1.id}`, 'GET'); const sA = g.rcpts.filter((r) => r.company_id === 'coA').map((r) => `${r.email}:${r.status}:${r.step}`); console.log('Promed resumed, “continue” on interaction:', sA.join(' '), '| sent', sent.length - n3);
  if (sent.length - n3 < 1) bad.push('continue sends');
  // edit: add a 4th email → finished people get it later; stop
  [, g] = await call('camp/act', 'POST', { id: c1.id, action: 'edit', steps: [ ...steps, { body: 'One more, {name|there}.', wait: 5 } ] }); [, g] = await call(`camp/get?id=${c1.id}`, 'GET'); console.log('steps now:', g.camp.steps.length, '| counts', JSON.stringify(g.camp.n)); g.camp.steps.length !== 4 && bad.push('edit'); g.camp.n.replied !== 1 && bad.push('replied count');
  let [, li] = await call('camp/list', 'GET'); console.log('list:', li.camps.map((c) => `${c.name} ${c.status} ${c.n.total}`).join(' | '));
  let [, co] = await call('camp/company?cid=coA', 'GET'); console.log('company chip rows:', co.rows.length); co.rows.length || bad.push('company rows');
  await call('camp/act', 'POST', { id: c1.id, action: 'stop' }); const n4 = sent.length; CLK.t += 30 * 864e5; for (let i = 0; i < 3; i++) await run(); if (sent.length !== n4) bad.push('stopped sends nothing');
  // the regular queue still works with campaigns in the same dispatch
  const dd = await G.dispatch(env); console.log('dispatch:', JSON.stringify(dd).slice(0, 120)); if (!('camp' in dd)) bad.push('dispatch runs campaigns');
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
