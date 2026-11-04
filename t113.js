// ☑ tasks: typing survives refreshes, Add button works, waiting replies become tasks (and tick off when answered), ☑ next to ↩ waiting, company chip in Power hour, no KOLs top button
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  console.log('KOLs top button:', !!D.querySelector('.cm-kolbtn')); D.querySelector('.cm-kolbtn') && bad.push('kol button');
  const g = D.querySelector('.cm-wtgrp'); console.log('group:', g && [...g.children].map((x) => x.className.replace('cm-chip ', '')).join(' + ')); if (!g || !g.querySelector('.cm-tkbtn')) bad.push('group');
  if (g && g.querySelector('.cm-rnbtn') && g.querySelector('.cm-rnbtn').nextElementSibling !== g.querySelector('.cm-tkbtn')) bad.push('order');
  // waiting replies → tasks
  const RW = W.__cm3.repliesWaiting(); const wt = W.__cm3.myTasks(true).filter((t) => t.src === 'wait'); console.log('waiting:', RW.length, '| wait tasks:', wt.length, wt[0] && wt[0].text.slice(0, 80)); if (RW.length && wt.length !== RW.length) bad.push('wait tasks');
  // panel: type, let the page refresh a few times, the text stays; Add works
  const btn = D.querySelector('.cm-tkbtn'); btn.click(); await h.settle(); let P = D.querySelector('.cm-tkpanel'); const inp = P.querySelector('.cm-tkadd'); inp.focus(); inp.value = 'Send catalogue to Ana';
  for (let i = 0; i < 4; i++) { W.__cm3.taskBadge ? W.__cm3.taskBadge() : 0; W.dash.setParams({ tick: i }); await h.settle(); await wait(250); }
  P = D.querySelector('.cm-tkpanel'); const inp2 = P && P.querySelector('.cm-tkadd'); console.log('typed text after refreshes:', inp2 && JSON.stringify(inp2.value)); if (!inp2 || inp2.value !== 'Send catalogue to Ana') bad.push('typing lost');
  const n0 = W.__cm3.myTasks(true).length; [...P.querySelectorAll('.cm-tkaddr button')].find((b) => /Add/.test(b.textContent)).click(); await h.settle(); const n1 = W.__cm3.myTasks(true).length; console.log('tasks before/after Add:', n0, n1); if (n1 !== n0 + 1) bad.push('add button');
  // company chip
  const cid = '6a4444444444444444444444'; W.__cm3.taskAdd ? 0 : 0; const chip0 = W.__cm3.taskChip(cid, 'Chip Co'); if (chip0) bad.push('chip without tasks');
  W.__cm3.myTasks; const T = W.__cm3; T.waitTasks(); const id = (W.__cm3.taskAddX || null); W.__cm3.brainAfter(cid, 'Chip Co', { tasks: [{ text: 'Call back Monday', due_days: 0 }] });
  const chip = W.__cm3.taskChip(cid, 'Chip Co'); console.log('chip:', chip && chip.textContent, '|', chip && chip.title); if (!chip || !/☑ 1/.test(chip.textContent)) bad.push('chip'); else { D.body.append(chip); chip.click(); await h.settle(); const P2 = D.querySelector('.cm-tkpanel'); console.log('company panel:', P2 && P2.textContent.slice(0, 120)); if (!P2 || !/Chip Co/.test(P2.textContent) || !/Call back Monday/.test(P2.textContent)) bad.push('company panel'); }
  { const co = W.__cm.rowsOf('pipeline_stages').find((r) => r.company && r.iso) || {}; const now = Date.now(); let H = [{ record_id: co.id, type: 'chat', dir: 'out', time: new Date(now - 5 * 864e5).toISOString() }, { record_id: co.id, type: 'chat', dir: 'in', time: new Date(now - 4 * 864e5).toISOString(), preview: 'Can you send the price list?' }, { record_id: 'zz1', type: 'email', dir: 'out', time: new Date(now - 9 * 864e5).toISOString() }, { record_id: 'zz2', type: 'email', dir: 'out', time: new Date(now - 8 * 864e5).toISOString() }];
    const od = W.dash.data.bind(W.dash); W.dash.data = (k, ...a) => (k === 'contact_history' ? { status: 'ok', data: H } : od(k, ...a));
    W.__cm3.waitTasks(); const t = W.__cm3.myTasks(true).find((x) => x.id === `w_${co.id}`); console.log('wait task:', t && t.text, '| due', t && t.due, '| waiting list', W.__cm3.repliesWaiting().length); if (!t || !/Reply to/.test(t.text)) bad.push('wait → task');
    H = [...H, { record_id: co.id, type: 'chat', dir: 'out', time: new Date(now - 864e5).toISOString() }]; W.__cm3.waitTasks(); const t2 = [...W.__cm3.myTasks(true)].find((x) => x.id === `w_${co.id}`); console.log('after we answered, still open:', !!t2); if (t2) bad.push('auto tick');
    W.dash.data = od; }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
