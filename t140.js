// Oct 31: who did what · reading a country no longer writes “Registration” log lines · Days & goals puts a renamed login under today's name
// (team@ was “Team”, now “Yaman”) and old junk lines are hidden · 🏢 companies worked opens the list of companies with what was done
// · windows opened from ✨ Not in NetHunt / 📣 Campaigns (📂 Import) show in front of the page
const P = require('path'); const fs = require('fs');
(async () => { const bad = [];
  // ---- server: /api/medint?daily=1 (node:sqlite stands in for D1)
  const { DatabaseSync } = require('node:sqlite'); const sq = new DatabaseSync(':memory:');
  const stm = (sql) => { const st = { a: [], bind: (...x) => { st.a = x; return st; }, run: async () => { const r = sq.prepare(sql).run(...st.a); return { meta: { changes: r.changes } }; }, first: async () => sq.prepare(sql).get(...st.a) || null, all: async () => ({ results: sq.prepare(sql).all(...st.a) }) }; return st; };
  const D1 = { prepare: stm, batch: async (L) => { const out = []; for (const s of L) out.push(/^\s*SELECT/i.test(s.sql || '') ? await s.all() : await s.run()); return out; } };
  const prep = D1.prepare; D1.prepare = (sql) => { const s = prep(sql); s.sql = sql; return s; };
  sq.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, at INTEGER)');
  sq.prepare('INSERT INTO kv (k, v, at) VALUES (?, ?, ?)').run('people', JSON.stringify([ { id: 'p1', fields: { Name: 'Kavi', Email: 'hi@kavikaplan.com', Role: 'House' } }, { id: 'p2', fields: { Name: 'Yaman', Email: 'team@kavikaplan.com', Role: 'Person' } }, { id: 'p3', fields: { Name: 'Yaman', Email: 'yamanhussin@gmail.com', Role: 'Person' } } ]), Date.now());
  const M = await import(P.join(__dirname, '../functions/api/medint.js')); const env = { MEDINT_DB: D1, NETHUNT_MCP_URL: 'x' };
  const req = (login, url, body) => new Request(`https://m.local/api/medint${url}`, { method: body ? 'POST' : 'GET', headers: { 'cf-access-authenticated-user-email': login, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const day = Date.UTC(2026, 9, 20, 10); const ev = (person, email, action, co, t, extra = {}) => ({ Epoch: t, Time: new Date(t).toISOString(), Person: person, 'Person email': email, Action: action, Company: co, 'Company name': co ? `Co ${co}` : '', Source: 'Website', ...extra });
  // lines as they were written: team@ under its old name “Team”, and the Registration junk
  const ins = (b, person, login) => sq.prepare('INSERT INTO events (epoch, time, person, email, login, action, outcome, text, company_id, company, country, identity, source, voided, nh_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(b.Epoch, b.Time, person, b['Person email'], login, b.Action, b.Outcome || '', '', b.Company || '', b['Company name'] || '', '', '', 'Website', 0, '');
  await M.onRequestPost({ request: req('hi@kavikaplan.com', '', ev('Kavi', 'hi@kavikaplan.com', 'Status', 'c1', day)), env }); // creates the table
  ins(ev('Team', 'team@kavikaplan.com', 'Call', 'c2', day + 1000), 'Team', 'team@kavikaplan.com');
  ins(ev('Team', 'team@kavikaplan.com', 'Email', 'c3', day + 2000), 'Team', 'team@kavikaplan.com');
  ins(ev('Yaman', 'team@kavikaplan.com', 'Email', 'c3', day + 3000), 'Yaman', 'team@kavikaplan.com');
  for (let k = 0; k < 6; k++) ins(ev('Kavi', 'hi@kavikaplan.com', 'Registration', '', day + 5000 + k), 'Kavi', 'hi@kavikaplan.com');
  ins(ev('Kavi', 'hi@kavikaplan.com', 'Registration', '', day + 9000, { Outcome: 'Registration Dunitech → Submitted' }), 'Kavi', 'hi@kavikaplan.com');
  // a fresh worker start runs the clean-up (hide the empty Registration lines)
  const M2 = await import(P.join(__dirname, '../functions/api/medint.js') + '?fresh'); await M2.onRequestPost({ request: req('team@kavikaplan.com', '', ev('', '', 'WhatsApp', 'c4', day + 4000)), env });
  const hid = sq.prepare("SELECT COUNT(*) AS n FROM events WHERE action = 'Registration' AND voided = 1").get().n; const kept = sq.prepare("SELECT COUNT(*) AS n FROM events WHERE action = 'Registration' AND voided = 0").get().n;
  const posted = sq.prepare("SELECT person FROM events WHERE action = 'WhatsApp'").get(); console.log('empty Registration lines hidden:', hid, '| real one kept:', kept, '| new line from team@ saved as:', posted && posted.person);
  if (hid !== 6 || kept !== 1 || !posted || posted.person !== 'Yaman') bad.push('registration junk / person from login');
  const all = await (await M2.onRequestGet({ request: req('hi@kavikaplan.com', `?daily=1&all=1&tz=0&from=${day - 864e5}&to=9e15`), env })).json();
  const people = [ ...new Set(all.rows.map((r) => r.person)) ]; const y = all.rows.filter((r) => r.person === 'Yaman'); const c3 = y.find((r) => r.company_id === 'c3' && r.action === 'Email');
  console.log('House view people:', people.join(', '), '| Yaman rows:', y.map((r) => `${r.action}:${r.company_id}×${r.n}`).join(' '), '| company name kept:', c3 && c3.company);
  if (people.includes('Team') || !c3 || c3.n !== 2 || !y.some((r) => r.company_id === 'c2') || c3.company !== 'Co c3') bad.push('renamed person merged');
  const own = await (await M2.onRequestGet({ request: req('team@kavikaplan.com', `?daily=1&person=Yaman&tz=0&from=${day - 864e5}&to=9e15`), env })).json();
  console.log('Yaman’s own view:', (own.rows || []).map((r) => `${r.person}/${r.action}:${r.company_id}`).join(' '), own.error || '');
  if (!own.rows || !own.rows.some((r) => r.company_id === 'c2') || own.rows.some((r) => r.person !== 'Yaman' || r.company_id === 'c1')) bad.push('own view');

  // ---- browser: reads don't log, the 🏢 list, the window in front
  const { run } = require('./harness');
  const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); await h.settle(); const W = h.w, D = h.d, C = W.__cm; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const logW = () => h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].folderId === '6ad6100defa2051dc4ad1ab7' && c[2].fields.Action === 'Registration').length;
  const before = logW(); await C.nhCall('get_record', { folderId: '673c960008039266ccd2ead3', recordId: 'r1' }); await C.nhCall('list_record_timeline', { folderId: '673c960008039266ccd2ead3', recordId: 'r1', types: [ 'comment' ] }); await wait(100);
  const afterRead = logW(); await C.nhCall('update_record', { folderId: '673c960008039266ccd2ead3', recordId: 'r1', fieldKeys: 'label', fields: { 'Registration Dunitech': 'Submitted' } }); await wait(100); const afterWrite = logW();
  console.log('Registration log lines — after reading a country:', afterRead - before, '| after changing its registration:', afterWrite - afterRead); if (afterRead !== before || afterWrite - afterRead !== 1) bad.push('reads logged');
  // 🏢 companies worked → list (data as the server sends it)
  const X2 = W.__cm2x; const t0 = X2.dayIdx(Date.now()); const of = W.fetch; const today = Date.now();
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/medint?daily=1')) return new Response(JSON.stringify({ rows: [ { person: 'Kavi', d: t0, action: 'Call', company_id: 'cA', company: 'Alpha Medical', at: today - 36e5, n: 2 }, { person: 'Kavi', d: t0, action: 'Email', company_id: 'cA', company: 'Alpha Medical', at: today - 35e5, n: 1 }, { person: 'Kavi', d: t0, action: 'Status', company_id: 'cB', company: 'Beta Ortho', at: today - 2e6, n: 1 } ], plans: [], found: [] })); return of(u, o); };
  W.__cm2x.daysReset(); const an = D.createElement('button'); D.body.append(an);
  W.__cm2.openLog(an, 'days'); await h.settle(); await wait(400); await h.settle(); await wait(300); await h.settle();
  const cell = [ ...D.querySelectorAll('#cm-sheet .cm-daystbl td button, #cm-sheet .cm-daystbl td') ].find((x) => x.textContent.trim() === '2'); console.log('days table:', !!D.querySelector('#cm-sheet .cm-daystbl'), '| a cell with 2:', !!cell);
  if (cell) { cell.click(); await h.settle(); await wait(100); }
  const tile = D.querySelector('#cm-sheet .cm-daycos'); console.log('🏢 tile is a button:', !!tile, tile && tile.textContent);
  if (!tile) bad.push('tile'); else { tile.click(); await h.settle(); await wait(100); const rows = [ ...D.querySelectorAll('#cm-sheet .cm-dayco') ].map((r) => r.textContent.replace(/\s+/g, ' ').trim()); console.log('companies:', rows.join(' || '));
    const link = D.querySelector('#cm-sheet .cm-dayco .cm-co[data-open-company="cA"]'); if (rows.length !== 2 || !/Beta Ortho/.test(rows[0]) || !/📊/.test(rows[0]) || !/Alpha Medical/.test(rows[1]) || !/☎ 2/.test(rows[1]) || !/✉/.test(rows[1]) || !link) /* newest first */ bad.push('company list'); }
  W.fetch = of;
  // the window in front of the full-page screens
  const css = [ ...D.querySelectorAll('style') ].map((s) => s.textContent).join('\n'); const ok = /body\.cm-lp-on \.cm-sheet \{ z-index: 45; \}/.test(css) && /\.cm-lp \{ position: fixed; inset: 0; z-index: 44;/.test(css); console.log('sheet above Not in NetHunt / Campaigns:', ok); ok || bad.push('z-index');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
