// 📣 campaigns in the page: tick companies → 📣 Email campaign → company emails + related people (duplicates merged, people already in a campaign
// unticked, “Merged duplicate” people left out) → pick mailbox + send-as address → emails with variables + follow-ups → preview → confirm → created;
// the campaign page (stats, steps, people by company, company menu); mailbox load; 📣 chip on the company page
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o, s = 200) => new R(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(400); await h.settle();
  const P = C.rowsOf('partners').filter((r) => r.id); const c1 = P[0].id, c2 = P[1].id; console.log('companies:', P[0].company, '|', P[1].company);
  const MC = await W.claude.use('mcp'); const ct0 = MC.callTool; const txt = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] });
  MC.callTool = async (srv, tool, a) => { h.calls.push([ 'nh', tool, a ]);
    if (tool === 'get_record' && a.recordId === c1) return txt({ id: c1, fields: { Name: 'Promed Chile', Email: [ 'info@promed.cl', 'ana@promed.cl' ], 'Related records': [ { id: 'aaaaaaaaaaaaaaaaaaaaaaa1' } ] } });
    if (tool === 'get_record' && a.recordId === c2) return txt({ id: c2, fields: { Name: 'Traumed', Email: [ 'contacto@traumed.cl' ] } });
    if (tool === 'get_record' && a.recordId === 'aaaaaaaaaaaaaaaaaaaaaaa1') return txt({ id: 'aaaaaaaaaaaaaaaaaaaaaaa1', fields: { Name: 'Luis Soto', Title: 'Compras', Email: [ 'luis@promed.cl' ] } });
    if (tool === 'filter_records') return txt({ records: [ { id: 'p1', fields: { Name: 'Dr. Ana Ruiz', Title: 'Gerente', Email: [ 'ana@promed.cl' ], Company: [ c1 ] } }, { id: 'p2', fields: { Name: 'Bo Diaz', Company: [ c2 ] } }, { id: 'p3', fields: { Name: 'Old copy', Email: [ 'old@promed.cl' ], Company: [ c1 ], Label: [ 'Merged duplicate' ] } } ] });
    return ct0(srv, tool, a); };
  const posts = []; const of = W.fetch; const ACC = { role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true, signature: 'Kavi Kaplan' } ] }, { mailbox: 'team@kavikaplan.com', aliases: [ { email: 'team@kavikaplan.com', name: 'Team', isDefault: true }, { email: 'sales@kavikaplan.com', name: 'Kavi Sales', signature: '<b>Sales</b>' } ] } ] };
  const LOAD = { boxes: [ { mailbox: 'hi@kavikaplan.com', cap: 50, today: 12, waiting: 30, later: 0, days: Array.from({ length: 14 }, (_, i) => ({ d: new Date(Date.now() + i * 864e5).toISOString().slice(0, 10), camp: i < 2 ? 15 : 0, single: i === 1 ? 2 : 0, ...(i ? {} : { sent: 12 }) })) }, { mailbox: 'team@kavikaplan.com', cap: 50, today: 0, waiting: 0, later: 0, days: Array.from({ length: 14 }, (_, i) => ({ d: new Date(Date.now() + i * 864e5).toISOString().slice(0, 10), camp: 0, single: 0 })) } ] };
  let CAMP = null; let cochip = [];
  W.fetch = async (u, o = {}) => { u = String(u); if (!u.startsWith('/api/gmail/')) return of(u, o); const b = o.body ? JSON.parse(o.body) : null; b && posts.push([ u, b ]);
    if (u.startsWith('/api/gmail/accounts')) return J(ACC); if (u.startsWith('/api/gmail/labels')) return J({ labels: [] }); if (u.startsWith('/api/gmail/threads')) return J({ threads: [] }); if (u.startsWith('/api/gmail/scheduled')) return J({ rows: [] });
    if (u.startsWith('/api/gmail/camp/load')) return J(LOAD); if (u.startsWith('/api/gmail/camp/list')) return J({ camps: CAMP ? [ CAMP.camp ] : [] });
    if (u.startsWith('/api/gmail/camp/check')) return J({ busy: [ { email: 'contacto@traumed.cl', camp: 'Traumed Oct' } ] });
    if (u.startsWith('/api/gmail/camp/create')) { CAMP = { camp: { id: 'C1', name: b.name, mailbox: b.mailbox, sender: b.sender, status: 'active', steps: b.steps, on_touch: b.on_touch, created: Date.now(), brand: b.brand, login: 'hi@kavikaplan.com', n: { total: b.rcpts.length, companies: 1, emails: 1, active: 2, paused: 1, replied: 1 } },
        rcpts: b.rcpts.map((r, i) => ({ id: `C1:${i}`, company_id: r.company_id, company: r.company, kind: r.kind, name: r.name, email: r.email, iso: r.iso, tz: 'America/Santiago', step: i ? 0 : 1, next_at: Date.now() + 864e5, status: i === 1 ? 'paused' : 'active', reason: i === 1 ? 'company: WhatsApp from them' : '', thread_id: i ? '' : 'th1', replied_at: i === 1 ? Date.now() : null })) }; return J({ ok: true, id: 'C1', added: b.rcpts.length, skipped: [] }); }
    if (u.startsWith('/api/gmail/camp/get')) return J(CAMP); if (u.startsWith('/api/gmail/camp/who') || u.startsWith('/api/gmail/camp/act')) return J({ ok: true });
    if (u.startsWith('/api/gmail/camp/company')) return J({ rows: cochip });
    return J({}); };
  // the bulk bar: tick two companies → 📣 Email campaign
  const all = D.querySelector('.cm-selall'); all && all.click(); await h.settle(); C.selIds.clear(); C.selIds.add(c1); C.selIds.add(c2);
  const bb = [ ...D.querySelectorAll('.cm-bulk .cm-chip') ].find((b) => /Email campaign/.test(b.textContent)); console.log('bulk bar button:', !!bb, '| enabled:', bb && !bb.disabled); if (!bb) bad.push('bulk bar button');
  bb.disabled = !1; bb.click(); await wait(400); await h.settle(); await wait(300); await h.settle(); await wait(200); await h.settle();
  const sh = () => D.getElementById('cm-sheet'); console.log('sheet:', D.getElementById('cm-sheet-title').textContent, '| view', X.CP.draft && 'new');
  const rows = [ ...sh().querySelectorAll('.cm-cpwho .rr') ].map((r) => `${r.querySelector('input').checked ? '☑' : '☐'} ${r.textContent.replace(/\s+/g, ' ').trim()}`); console.log('who:\n  ' + rows.join('\n  '));
  const has = (re, on) => rows.some((r) => re.test(r) && (on == null || r.startsWith(on ? '☑' : '☐')));
  if (!has(/info@promed\.cl/, !0) || !has(/Dr\. Ana Ruiz.*ana@promed\.cl/, !0) || !has(/Company email.*ana@promed\.cl.*dup/, !1) || !has(/Luis Soto.*luis@promed\.cl/, !0) || has(/old@promed/) || !has(/contacto@traumed\.cl.*busy/, !1) || !has(/Bo Diaz.*no email/, !1)) bad.push('recipients: company + people, merged, busy, no email');
  const hd1 = sh().querySelector('.cm-cpbox .cm-cpbh').textContent; console.log('summary:', hd1); /3 emails/.test(hd1) || bad.push('summary count');
  // ② mailbox + exact address
  [ ...sh().querySelectorAll('.cm-cpbox .cm-chip') ].find((b) => /team@kavikaplan\.com/.test(b.textContent)).click(); await h.settle(); [ ...sh().querySelectorAll('.cm-cpals .cm-chip') ].find((b) => /sales@kavikaplan\.com/.test(b.textContent)).click(); await h.settle();
  console.log('from:', X.CP.draft.mailbox, X.CP.draft.sender, '| load row for it:', sh().querySelectorAll('.cm-cpbox .cm-cplrow').length); if (X.CP.draft.mailbox !== 'team@kavikaplan.com' || X.CP.draft.sender !== 'sales@kavikaplan.com') bad.push('mailbox + alias');
  // ③ emails: subject with a variable, add a follow-up, wait days
  const su = sh().querySelector('.cm-cpsubj'); su.value = 'Shoulder implants for '; su.dispatchEvent(new W.Event('input')); su.dispatchEvent(new W.Event('focus')); su.selectionStart = su.selectionEnd = su.value.length;
  [ ...sh().querySelector('.cm-cpstep .cm-cpvars').querySelectorAll('.cm-cpvar') ].find((b) => b.textContent === '{company}').click(); console.log('subject:', X.CP.draft.steps[0].subject); X.CP.draft.steps[0].subject !== 'Shoulder implants for {company}' && bad.push('insert variable');
  const n0 = X.CP.draft.steps.length; sh().querySelector('.cm-cpadd').click(); await h.settle(); console.log('steps:', n0, '→', X.CP.draft.steps.length, '| wait rows:', sh().querySelectorAll('.cm-cpwait').length); X.CP.draft.steps.length !== n0 + 1 && bad.push('add follow-up');
  const w1 = sh().querySelector('.cm-cpwait'); [ ...w1.querySelectorAll('.cm-mini') ].find((b) => b.textContent === '+').click(); console.log('wait 1:', X.CP.draft.steps[1].wait); X.CP.draft.steps[1].wait !== 4 && bad.push('wait +');
  X.CP.draft.steps[0].body = 'Hi {name|there},\n\nIs {company} in {city} working with shoulder surgeons? {brand} {oops}\n\n{my_name}'; X.CP.draft.brand = 'Next Shoulder'; W.__cm.sheetDraw(); await h.settle();
  // ⑤ preview (Ana)
  const ps = sh().querySelector('.cm-cpbox:nth-of-type(5) select, .cm-cpprev') && [ ...sh().querySelectorAll('.cm-cpbox select.cm-cpin') ].pop(); const ai = [ ...ps.options ].findIndex((o) => /Ana Ruiz/.test(o.text)); ps.value = String(ai); ps.dispatchEvent(new W.Event('change')); await h.settle();
  const pv = sh().querySelector('.cm-cpprev'); console.log('preview:', pv.textContent.replace(/\s+/g, ' ').slice(0, 260)); if (!/From: Kavi Sales <sales@kavikaplan\.com>/.test(pv.textContent) || !/Subject: Shoulder implants for Promed Chile/.test(pv.textContent) || !/Hi Ana,/.test(pv.textContent) || !/Next Shoulder/.test(pv.textContent) || !/reply “no”/.test(pv.textContent) || !/Unknown: \{oops\}/.test(pv.textContent) || !/Sales/.test(pv.textContent)) bad.push('preview');
  // remove Luis, then start (confirm first)
  const lr = [ ...sh().querySelectorAll('.cm-cpwho .rr') ].find((r) => /luis@/.test(r.textContent)); lr.querySelector('input').click(); await h.settle();
  const go = () => [ ...sh().querySelectorAll('.cm-cpgo .cm-btn') ].pop(); console.log('go:', go().textContent); go().click(); await h.settle(); console.log('confirm:', go().textContent); /Yes — send to 2 people/.test(go().textContent) || bad.push('confirm step');
  go().click(); await wait(300); await h.settle(); await wait(200); await h.settle();
  const cr = posts.find(([u]) => /camp\/create/.test(u)); const cb = cr && cr[1]; console.log('create:', cb && JSON.stringify({ mailbox: cb.mailbox, sender: cb.sender, steps: cb.steps.length, on: cb.on_touch, rc: cb.rcpts.map((r) => `${r.kind}:${r.email}`), log: cb.log, optout: !!cb.optout }));
  if (!cb || cb.mailbox !== 'team@kavikaplan.com' || cb.sender !== 'sales@kavikaplan.com' || cb.rcpts.length !== 2 || !cb.rcpts.some((r) => r.kind === 'person' && r.name === 'Dr. Ana Ruiz' && r.title === 'Gerente' && r.company === 'Promed Chile') || cb.rcpts.some((r) => /luis|traumed|old@/.test(r.email)) || cb.on_touch !== 'pause' || !cb.log.Person) bad.push('create body');
  // the campaign page
  const tt = sh().querySelector('.cm-cptitle'); console.log('campaign page:', tt && tt.textContent, '| stats:', [ ...sh().querySelectorAll('.cm-cpstat') ].map((s) => s.textContent).join(' · '));
  if (!tt || sh().querySelectorAll('.cm-cpco').length !== 1 || !sh().querySelector('.cm-cpco .dots i.on') || !sh().querySelector('.cm-cppill.s-rp') || !/WhatsApp from them/.test(sh().textContent)) bad.push('campaign page');
  const mn = sh().querySelector('.cm-cpco .gh .cm-mini'); mn.click(); await h.settle(); const items = [ ...D.querySelectorAll('.cm-menu button, [role=menu] button, .cm-menu [role=menuitem]') ].map((b) => b.textContent.replace(/\s+/g, ' ')); console.log('company menu:', items.slice(0, 6).join(' | '));
  const cont = [ ...D.querySelectorAll('.cm-menu button, [role=menu] button') ].find((b) => /On interaction: Continue/.test(b.textContent)); cont && cont.click(); await wait(100); const wp = posts.filter(([u]) => /camp\/who/.test(u)).pop(); console.log('who post:', wp && JSON.stringify(wp[1])); (!wp || wp[1].action !== 'touch' || wp[1].value !== 'continue') && bad.push('company on-interaction choice');
  const pz = [ ...sh().querySelectorAll('.cm-cpacts .cm-chip') ].find((b) => /Pause all/.test(b.textContent)); pz.click(); await wait(100); const ap = posts.filter(([u]) => /camp\/act/.test(u)).pop(); (!ap || ap[1].action !== 'pause') && bad.push('pause all');
  // 📥 open a thread from the campaign, and back
  const ob = [ ...sh().querySelectorAll('.cm-cpco .rr .a .cm-mini') ].find((b) => b.textContent === '📥'); ob.click(); await h.settle(); await wait(100); const rb = sh().querySelector('.cm-ibret'); console.log('thread + back button:', rb && rb.textContent); rb || bad.push('back to campaign'); rb && rb.click(); await h.settle(); sh().querySelector('.cm-cptitle') || bad.push('back shows campaign');
  // the list + load panel
  [ ...sh().querySelectorAll('.cm-ibl') ].find((b) => /Campaigns/.test(b.textContent)).click(); await wait(200); await h.settle(); await wait(100); await h.settle(); console.log('list:', sh().querySelectorAll('.cm-cpcard').length, 'card(s) | load rows:', sh().querySelectorAll('.cm-cplrow').length, '| today bar:', (sh().querySelector('.cm-cplrow .n') || {}).textContent, '| day columns:', sh().querySelectorAll('.cm-cplrow:first-child .cm-cpdays .d').length);
  if (sh().querySelectorAll('.cm-cpcard').length !== 1 || sh().querySelectorAll('.cm-cplrow').length !== 2 || !/12 \/ 50 today/.test(sh().textContent) || sh().querySelectorAll('.cm-cpdays .d').length !== 28) bad.push('list + load');
  C.closeSheet();
  // 📣 chip on the company page
  cochip = [ { camp_id: 'C1', camp: 'Chile Nov', step: 1, steps: 3, status: 'active', next_at: Date.now() + 864e5, tz: 'America/Santiago' } ];
  W.cmCompanyIso = 'CL'; W.dash.setParams({ view: 'company', cid: c1, iso: 'CL' }); await h.settle(); await wait(400); X.cpCoWatch(); await wait(100); X.cpCoWatch(); await h.settle(); const chip = D.querySelector('#company-view .cm-cnamerow .cm-cpcochip'); console.log('company chip:', chip && chip.textContent); (!chip || !/Chile Nov · 2\/3/.test(chip.textContent)) && bad.push('company chip');
  W.fetch = of; MC.callTool = ct0;
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
