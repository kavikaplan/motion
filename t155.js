// ⚡ Medint work → Task Timesheet (teamtasks / Supabase): sessions from real actions (20-min gaps), sent 30 min after the last action,
// one finished block per session on the right person, labelled by brand · nothing twice · open / tiny sessions wait · runs from the mail cron
const P = require('path');
(async () => { const bad = [];
  const { DatabaseSync } = require('node:sqlite'); const sq = new DatabaseSync(':memory:');
  const stm = (sql) => { const st = { sql, a: [], bind: (...x) => { st.a = x; return st; }, run: async () => { const r = sq.prepare(sql).run(...st.a); return { meta: { changes: r.changes } }; }, first: async () => sq.prepare(sql).get(...st.a) || null, all: async () => ({ results: sq.prepare(sql).all(...st.a) }) }; return st; };
  const D1 = { prepare: stm, batch: async (L) => { const o = []; for (const s of L) o.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : await s.run()); return o; } };
  const T = await import(P.join(__dirname, '../functions/_lib/timesheet.js'));
  // pure: sessions
  const m = 6e4; const now = Date.UTC(2026, 10, 5, 12, 0);
  const E = (t, a, co, brand = 'dunitech') => ({ epoch: now - t * m, action: a, company_id: co, company: `Co ${co}`, brand });
  const evs = [ E(200, 'Call', 'a'), E(190, 'WhatsApp', 'a'), E(175, 'Status', 'b'), E(160, 'Call', 'c'), /* 15-min gaps → one session */ E(100, 'Comment', 'd'), /* alone → skipped */ E(40, 'Call', 'e'), E(25, 'Email', 'f') /* still open (25 min ago) */ ].sort((x, y) => x.epoch - y.epoch);
  const S = T.sessionsOf(evs, now); console.log('sessions ready to send:', S.length, '|', S.map((s) => `${(now - s.start) / m}→${(now - s.end) / m} min ago, ${s.evs.length} actions`).join(' ; '));
  if (S.length !== 1 || S[0].evs.length !== 4 || (S[0].end - S[0].start) / m !== 50) bad.push('sessions');
  const d = T.describe(S[0]); console.log('block:', d.title, '|', d.details.split('\n')[0], '|', d.mins, 'min'); if (d.title !== '⚡ Sales · Dunitech · 3 companies' || !/2 calls/.test(d.details) || !/1 WhatsApp\b/.test(d.details)) bad.push('describe');
  const mixed = T.describe({ ...S[0], evs: [ ...S[0].evs, E(150, 'Call', 'x', 'next') ] }); console.log('mixed brands:', mixed.title); if (!/Dunitech & Next/.test(mixed.title)) bad.push('mixed');
  // the whole run against D1 + a fake Supabase
  sq.exec('CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, epoch INTEGER, time TEXT, person TEXT, email TEXT, login TEXT, action TEXT, outcome TEXT, text TEXT, company_id TEXT, company TEXT, country TEXT, identity TEXT, source TEXT, voided INTEGER DEFAULT 0, nh_id TEXT, brand TEXT)');
  const ins = (who, email, e) => sq.prepare('INSERT INTO events (epoch, person, email, login, action, company_id, company, brand, voided) VALUES (?,?,?,?,?,?,?,?,0)').run(e.epoch, who, email, email, e.action, e.company_id, e.company, e.brand);
  evs.forEach((e) => ins('Yaman', 'team@kavikaplan.com', e));
  [ E(300, 'Call', 'n1', 'next'), E(290, 'Email', 'n2', 'next'), E(280, 'WhatsApp', 'n3', 'next') ].forEach((e) => ins('Luz', 'export@kavikaplan.com', e)); // Luz: not in the timesheet
  ins('Yaman', 'team@kavikaplan.com', { ...E(185, 'Other', 'zz'), action: 'Other' }); // not work
  const calls = []; const ofG = global.fetch;
  global.fetch = async (u, o = {}) => { u = String(u); const b = o.body ? JSON.parse(o.body) : null; calls.push([ o.method || 'GET', u.replace(/^.*\/rest\/v1\//, ''), b ]);
    if (u.includes('/profiles')) return new Response(JSON.stringify([ { id: 'u-kavi', name: 'Kavi Kaplan', email: 'hi@kavikaplan.com', timezone: 'Europe/Istanbul' }, { id: 'u-yaman', name: 'Yaman', email: 'yamanhussin@gmail.com', timezone: null } ]), { status: 200 });
    if (u.includes('/task_labels')) return new Response(JSON.stringify([ { id: 'L-next', name: 'Next' }, { id: 'L-duni', name: 'Dunitech' } ]), { status: 200 });
    if (/\/tasks$/.test(u)) return new Response(JSON.stringify([ { id: 'T1', ...b } ]), { status: 201 });
    return new Response('', { status: 201 }); };
  const env = { MEDINT_DB: D1, TT_SUPABASE_URL: 'https://abc.supabase.co', TT_SUPABASE_SERVICE_KEY: 'sk' };
  const r1 = await T.tsSync(env, { now }); console.log('run 1:', JSON.stringify(r1));
  const task = (calls.find((c) => c[0] === 'POST' && c[1] === 'tasks') || [])[2] || {}; const ov = (calls.find((c) => c[1].startsWith('task_overrides')) || [])[2] || {}; const lab = (calls.find((c) => c[1] === 'task_label_assignments') || [])[2] || [];
  console.log('block written:', task.title, '| for', task.assignee, '| on', task.date, task.time, '|', task.duration_min, 'min | ticked done:', ov.done, ov.instance_key, '| label:', JSON.stringify(lab));
  if (r1.sent.length !== 1 || task.assignee !== 'u-yaman' || task.created_by !== 'u-yaman' || task.date !== '2026-11-05' || task.time !== '11:35' || task.duration_min !== 50 || ov.done !== true || ov.instance_key !== 'T1@2026-11-05' || !(lab[0] && lab[0].label_id === 'L-duni')) bad.push('written');
  if (!r1.skipped.some((x) => /Luz/.test(x))) bad.push('unknown person reported');
  const n1 = calls.filter((c) => c[1] === 'tasks').length; const r2 = await T.tsSync(env, { now: now + 2 * m }); console.log('run 2 (nothing new):', JSON.stringify(r2)); if (calls.filter((c) => c[1] === 'tasks').length !== n1 || r2.sent.length) bad.push('not twice');
  // a late action (sent from a phone's outbox) inside the session already sent → no second block
  ins('Yaman', 'team@kavikaplan.com', E(170, 'Email', 'c')); const r3 = await T.tsSync(env, { now: now + 4 * m }); console.log('late action inside a sent session → sent:', r3.sent.length); if (r3.sent.length) bad.push('overlap');
  // the open session goes out once it is 30 min quiet
  const r4 = await T.tsSync(env, { now: now + 10 * m }); console.log('10 min later (the 2-action session now quiet 35 min):', JSON.stringify(r4.sent)); if (r4.sent.length !== 1) bad.push('open session later');
  // not set up
  const r5 = await T.tsSync({ MEDINT_DB: D1 }, { now }); console.log('without keys:', r5.code); if (r5.code !== 'not_configured') bad.push('not configured');
  // the timesheet's own function (Lovable-managed database): the same session goes in through medint-sessions with the shared password
  sq.exec('DELETE FROM ts_sent'); const fcalls = [];
  global.fetch = async (u, o = {}) => { const b = JSON.parse(o.body || '{}'); fcalls.push([ String(u), o.headers && o.headers['x-medint-token'], b ]);
    if (b.action === 'people') return new Response(JSON.stringify([ { id: '6f1c0a52-9a51-4c7b-9a2e-1d2f3a4b5c6d', name: 'Yaman', email: 'yamanhussin@gmail.com', timezone: null } ]), { status: 200 });
    if (b.action === 'labels') return new Response(JSON.stringify([ { id: '7a1c0a52-9a51-4c7b-9a2e-1d2f3a4b5c6d', name: 'Dunitech' } ]), { status: 200 });
    if (b.action === 'add_session') return new Response(JSON.stringify({ id: 'T9' }), { status: 200 }); return new Response('{}', { status: 400 }); };
  const rF = await T.tsSync({ MEDINT_DB: D1, TT_FUNCTION_URL: 'https://abc.supabase.co/functions/v1/medint-sessions', TT_FUNCTION_TOKEN: 'pw' }, { now: now + 10 * m }); const add = fcalls.find((c) => c[2].action === 'add_session');
  console.log('via the function:', JSON.stringify(rF.sent), '| password sent:', add && add[1], '| session:', add && JSON.stringify({ key: add[2].key, assignee: add[2].assignee, date: add[2].date, time: add[2].time, labels: add[2].label_ids }));
  if (!add || add[1] !== 'pw' || add[2].assignee !== '6f1c0a52-9a51-4c7b-9a2e-1d2f3a4b5c6d' || !add[2].key || add[2].label_ids[0] !== '7a1c0a52-9a51-4c7b-9a2e-1d2f3a4b5c6d' || rF.sent.length !== 2) bad.push('function route');
  // other work counts too (research, data, enrichment) · automatic sends (📣 campaigns, scheduled emails) and small talk (👏, skips) don't
  const k0 = now + 60 * m; const K = (t, action, outcome, co = '') => sq.prepare('INSERT INTO events (epoch, person, email, login, action, outcome, company_id, company, brand, voided) VALUES (?,?,?,?,?,?,?,?,?,0)').run(k0 - t * m, 'Kavi', 'hi@kavikaplan.com', 'hi@kavikaplan.com', action, outcome, co, co ? `Co ${co}` : '', '');
  K(120, 'Other', '⚡ lead research run · Medint · Peru · 5 Nov 2026 · 40 min'); K(115, 'Other', 'added to NetHunt · ORTOPERU SAC', 'p1'); K(112, 'Contact', 'found email', 'p1'); K(110, 'Other', '👏 for 123');
  K(300, 'Email', '📣 Dunitech intro · email 1 of 3 sent from export@duni-tech.com to x@y.com', 'q1'); K(299, 'Email', '📣 Dunitech intro · email 1 of 3 sent from export@duni-tech.com to z@y.com', 'q2'); K(298, 'Email', 'sent from a@b.com to c@d.com (scheduled)', 'q3');
  global.fetch = async (u, o = {}) => { const b = JSON.parse(o.body || '{}'); if (b.action === 'people') return new Response(JSON.stringify([ { id: '1f1c0a52-9a51-4c7b-9a2e-1d2f3a4b5c6d', name: 'Kavi Kaplan', email: 'hi@kavikaplan.com', timezone: 'Europe/Istanbul' } ]), { status: 200 }); if (b.action === 'labels') return new Response('[]', { status: 200 }); fcalls.push([ 'K', '', b ]); return new Response(JSON.stringify({ id: 'T10' }), { status: 200 }); };
  const rK = await T.tsSync({ MEDINT_DB: D1, TT_FUNCTION_URL: 'https://abc.supabase.co/functions/v1/medint-sessions', TT_FUNCTION_TOKEN: 'pw' }, { now: k0 }); const kAdds = fcalls.filter((c) => c[0] === 'K').map((c) => c[2]);
  console.log('Kavi (research + enrichment, campaigns ignored):', JSON.stringify(rK.sent), '|', kAdds[0] && kAdds[0].details.split('\n')[0]);
  if (kAdds.length !== 1 || !/^🔬 Research & data · 1 company$/.test(kAdds[0].title) || kAdds[0].time !== '13:15' || kAdds[0].duration_min !== 60 || !/lead research run/.test(kAdds[0].details) || /👏|other/.test(kAdds[0].details.split('\n')[0])) bad.push('other work / automatic sends');
  // the mail cron runs it too
  const G = require('fs').readFileSync(P.join(__dirname, '../functions/api/gmail/[[path]].js'), 'utf8'); if (!/tsSync\(env\)/.test(G)) bad.push('cron hook'); console.log('runs from the 5-minute cron:', /tsSync\(env\)/.test(G));
  global.fetch = ofG; console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })().catch((e) => { console.log('errors 1', e.stack); process.exit(0); });
