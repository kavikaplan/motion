// 🤝 Meetings: calendar + NetHunt + Gemini notes → 📋 Today on Home, company line, notes sheet saves comment/fields/tasks/log, AI tidy parse, Gemini notes in the 🧠 prompt
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, M = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const now = Date.now();
  const L = C.rowsOf('company_index').filter((c) => c.company && c.domains); const A = L.find((c) => /\./.test(c.domains) && c.company.length > 6) || L[0]; const dom = String(A.domains).split(/[|,;\s]+/)[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  console.log('company A:', A.company, dom);
  const B = C.rowsOf('company_index').find((c) => c.id !== A.id && c.company && M.mtCompanyFor(c.company, []) && M.mtCompanyFor(c.company, []).id === c.id); console.log('company B (by title):', B && B.company);
  const of = W.fetch; let sumPrompt = ''; const R = W.Response || globalThis.Response;
  W.fetch = async (u, o = {}) => { u = String(u);
    if (u.startsWith('/api/calendar')) return new R(JSON.stringify({ events: [
      { id: 'ev1', summary: 'Intro call', start: { dateTime: new Date(now - 2 * 36e5).toISOString() }, attendees: [{ email: 'hi@kavikaplan.com' }, { email: `ana@${dom}` }], description: 'Join https://meet.google.com/abc-defg-hij' },
      { id: 'ev2', summary: `Visit ${B ? B.company : 'X'}`, start: { dateTime: new Date(now - 26 * 36e5).toISOString() }, attendees: [], location: 'Their office' },
      { id: 'ev3', summary: 'Dentist', start: { dateTime: new Date(now - 30 * 36e5).toISOString() }, attendees: [] },
      { id: 'ev4', summary: 'Meeting with Zorblax Medikal', start: { dateTime: new Date(now - 50 * 36e5).toISOString() }, attendees: [{ email: 'x@zorblaxmed.example' }] } ] }), { status: 200 });
    if (u.startsWith('/api/gmail/accounts')) return new R(JSON.stringify({ accounts: [{ email: 'hi@kavikaplan.com' }] }), { status: 200 });
    if (u.startsWith('/api/gmail/threads')) return new R(JSON.stringify({ threads: [{ id: 'g1', subject: 'Notes: “Intro call”', date: now - 36e5, people: [] }] }), { status: 200 });
    if (u.startsWith('/api/gmail/thread')) return new R(JSON.stringify({ messages: [{ text: 'Summary\nAna wants the price list and 2 demo sets. Next call in two weeks.\n\nYou should review Gemini\'s notes to make sure they\'re accurate.' }] }), { status: 200 });
    if (u.startsWith('/api/summarize')) { const b = JSON.parse(o.body || '{}'); sumPrompt = JSON.stringify(b);
      if (/tidy a salesperson/.test(sumPrompt)) return new R(JSON.stringify({ text: 'Summary: Good first meeting.\nThey need / asked:\n- price list\nDATA: {"next_step":"Send price list","followup_days":7,"stage":"interested","brands":[],"people":[{"name":"Ana Ruiz","title":"CEO","email":"ana@x.com","phone":""}],"tasks":[{"text":"Send price list to Ana","due_days":1}]}' }), { status: 200 }); }
    return of(u, o); };
  M.MT.calAt = 0; M.MT.gemAt = 0; await M.mtLoadCal(true); await M.mtLoadGem(true); await h.settle();
  console.log('cal', M.MT.cal && M.MT.cal.length, M.MT.calErr, 'gem', M.MT.gem && M.MT.gem.length, M.MT.gemErr); const { list, unmatched } = M.mtList(); console.log('meetings:', list.map((x) => `${x.name} [${x.src.join('+')}]${x.gem ? ' gem' : ''}`).join(' | ')); console.log('unmatched:', unmatched.map((u) => u.title).join(' | '));
  const a = list.find((x) => x.cid === A.id); if (!a) bad.push('domain match'); else { if (!a.gem) bad.push('gemini → event'); if (!a.online) bad.push('online flag'); }
  B && !list.find((x) => x.cid === B.id) && bad.push('title match'); list.some((x) => /Dentist/.test(x.title || '')) && bad.push('dentist matched'); unmatched.some((u) => /Zorblax/.test(u.title)) || bad.push('unmatched listed'); unmatched.some((u) => /Dentist/.test(u.title)) && bad.push('private event listed');
  console.log('gem title:', M.mtGemTitle('Notes: “Intro call” - 2026/10/27 10:00 GMT'), '|', M.mtGemTitle('Notas: Reunión con X')); if (M.mtGemTitle('Notes: “Intro call” - 2026/10/27 10:00 GMT') !== 'Intro call') bad.push('gem title');
  // home card
  C.closeSheet && C.closeSheet(); M.mtHomeWatch(true); await h.settle(); const hc = D.querySelector('#home-view .cm-today'); console.log('home card:', hc && hc.textContent.replace(/\s+/g, ' ').slice(0, 220)); if (!hc || !/📋 Today/.test(hc.textContent) || !/add notes/.test(hc.textContent)) bad.push('home card');
  // notes sheet: use Gemini notes, chip, tidy, save
  const btn = hc && hc.querySelector('.cm-mtnote'); btn && btn.click(); await h.settle(); let sh = D.querySelector('#cm-sheet:not([hidden])'); console.log('sheet:', sh && sh.querySelector('#cm-sheet-title').textContent);
  const ub = sh && [...sh.querySelectorAll('.cm-mtgem button')][0]; if (!ub) bad.push('use gemini btn'); else { ub.click(); await wait(300); await h.settle(); }
  sh = D.querySelector('#cm-sheet:not([hidden])'); let ta = sh.querySelector('.cm-mtta'); console.log('text after use:', JSON.stringify(ta.value.slice(0, 90))); if (!/price list and 2 demo/.test(ta.value) || /review Gemini/.test(ta.value)) bad.push('gemini text');
  [...sh.querySelectorAll('.cm-mtchips .cm-chip')].find((b) => /Send samples/.test(b.textContent)).click(); ta = sh.querySelector('.cm-mtta'); if (!/Send samples/.test(ta.value)) bad.push('chip');
  [...sh.querySelectorAll('button')].find((b) => /Tidy with AI/.test(b.textContent)).click(); await wait(400); await h.settle(); sh = D.querySelector('#cm-sheet:not([hidden])');
  console.log('after tidy:', sh.querySelector('.cm-vn') && sh.querySelector('.cm-vn').textContent.replace(/\s+/g, ' ').slice(0, 260)); if (!sh.querySelector('.cm-mtpre') || !/Send price list/.test(sh.textContent) || !/Ana Ruiz/.test(sh.textContent)) bad.push('tidy');
  const n0 = M.myTasks ? M.myTasks(true).length : 0; [...sh.querySelectorAll('button')].find((b) => /Save to NetHunt/.test(b.textContent)).click(); await wait(500); await h.settle();
  const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment').pop(); console.log('comment:', cm && JSON.stringify(cm[2].text.slice(0, 120))); if (!cm || cm[2].recordId !== A.id || !/🤝 Meeting notes/.test(cm[2].text) || !/— Tidied —/.test(cm[2].text)) bad.push('comment');
  const up = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record' && c[2].recordId === A.id).pop(); console.log('update:', up && JSON.stringify(up[2].fields)); if (!up || up[2].fields['Next step'] !== 'Send price list' || !up[2].fields['Next follow-up']) bad.push('update');
  const pc = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].fields && c[2].fields.Name === 'Ana Ruiz').pop(); pc || bad.push('contact');
  const n1 = M.myTasks ? M.myTasks(true).length : 0; console.log('tasks:', n0, '→', n1); M.myTasks && n1 <= n0 && bad.push('task');
  const lg = h.calls.filter((c) => c[0] === 'fetch' && /\/api\/medint/.test(c[1]) && c[2] === 'POST').length; console.log('log posts:', lg);
  console.log('marked:', JSON.stringify(M.MN.get(a && a.key))); if (!M.MN.get(a && a.key)) bad.push('mark noted');
  M.mtHomeWatch(true); await h.settle(); const hc2 = D.querySelector('#home-view .cm-today'); console.log('home after:', hc2 && hc2.textContent.replace(/\s+/g, ' ').slice(0, 160)); if (!hc2 || M.todayItems().some((x) => x.k === 'notes' && x.cid === A.id)) bad.push('home done state');
  // rules fallback without AI
  const r = M.mtRules('Met Dr. Pablo Gomez. They carry Zimmer. Next step: send catalogue next week'); console.log('rules:', JSON.stringify(r).slice(0, 200)); if (!r.next) bad.push('rules next');
  // Gemini notes reach the 🧠 summary prompt
  const g = await M.mtGemFor(A.id); console.log('gem for A:', g && g.text.slice(0, 60)); if (!g || !/demo sets/.test(g.text)) bad.push('gemFor');
  if (M.aiSummarize) { sumPrompt = ''; await M.aiSummarize(A.id, A.company).catch((e) => console.log('sum err', e.message)); console.log('brain prompt has meet notes:', /GOOGLE MEET NOTES/.test(sumPrompt)); /GOOGLE MEET NOTES/.test(sumPrompt) || bad.push('brain prompt'); }
  // link an unmatched meeting
  const z = unmatched.find((u) => /Zorblax/.test(u.title)); M.MN.set(`link|${z.id}`, { cid: B ? B.id : A.id }); const L2 = M.mtList(); console.log('after link, unmatched:', L2.unmatched.map((u) => u.title).join(' | ')); if (L2.unmatched.some((u) => /Zorblax/.test(u.title))) bad.push('link');
  // phone layout
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 3).join('\n')); process.exit(0); })();
