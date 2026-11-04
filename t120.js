// Simpler Medint: 📊 usage counted (sheets, pages, buttons) into the shared store · keyboard dictation only · one 📝 Log (call outcome → follow-up/status, saved as a call log; notes/visits as comments)
// · 📋 Today on Home (tasks tick off, replies, follow-ups) instead of tiles + Do now · ↩ chip hidden · hours + details found moved to “📈 My day” · Reach as one compact line
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, M = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Home
  M.mtHomeWatch(true); await h.settle(); const hv = D.getElementById('home-view');
  console.log('home blocks:', [...hv.querySelector('.cm-home').children].map((x) => x.className).join(' / '));
  hv.querySelector('.cm-goal') && bad.push('goal box on home'); hv.querySelector('.cm-foundbox') && bad.push('found box on home'); hv.querySelector('.cm-hmtiles') && bad.push('tiles on home');
  [...hv.querySelectorAll('.cm-hmcard h2')].some((x) => /Do now/.test(x.textContent)) && bad.push('Do now card');
  const td = hv.querySelector('.cm-today'); console.log('today:', td && td.textContent.replace(/\s+/g, ' ').slice(0, 200)); if (!td || !/📋 Today/.test(td.textContent)) bad.push('today card');
  if (!td || td.previousElementSibling !== hv.querySelector('.cm-cghd')) bad.push('today right under the greeting');
  const fl = td && td.querySelector('.cm-foundline'); console.log('my day line:', fl && fl.textContent); if (!fl) bad.push('found line');
  else { fl.click(); await h.settle(); const t = D.getElementById('cm-sheet-title').textContent; const b = D.querySelector('#cm-sheet:not([hidden]) .sb'); console.log('my day sheet:', t, '|', b && b.textContent.replace(/\s+/g, ' ').slice(0, 120)); if (!/My day/.test(t) || !b.querySelector('.cm-goal')) bad.push('my day sheet'); C.closeSheet(); }
  // a task shows in Today and ticks off
  const cid = '6a5555555555555555555555'; const id = M.taskAdd({ cid, company: 'Tick Co', text: 'Send the catalogue', due: new Date().toISOString().slice(0, 10) }); M.mtHomeWatch(true); await h.settle();
  const row = [...D.querySelectorAll('.cm-today .cm-tdrow')].find((r) => /Send the catalogue/.test(r.textContent)); console.log('task row:', row && row.textContent.replace(/\s+/g, ' ')); if (!row) bad.push('task in today');
  else { const cb = row.querySelector('.cm-tdcb'); cb.checked = true; cb.dispatchEvent(new W.Event('change')); await wait(500); await h.settle(); const still = [...D.querySelectorAll('.cm-today .cm-tdrow')].some((r) => /Send the catalogue/.test(r.textContent)); console.log('after tick, still there:', still); still && bad.push('tick'); }
  // ↩ chip hidden, ☑ stays
  const rn = D.querySelector('.cm-rnbtn'); console.log('↩ hidden:', !rn || rn.hidden, '| ☑:', !!D.querySelector('.cm-tkbtn')); if (rn && !rn.hidden) bad.push('↩ chip');
  // top bar Today panel = same list
  const tb = D.querySelector('.cm-tb-follow'); if (tb) { tb.click(); await h.settle(); console.log('top-bar today:', D.getElementById('cm-sheet-title').textContent); /📋 Today/.test(D.getElementById('cm-sheet-title').textContent) || bad.push('top bar today'); C.closeSheet(); }
  // 📝 Log: a call
  M.openLog(D.body, cid, 'Tick Co', { kind: 'Call', brand: 'next' }); await h.settle(); let sh = D.querySelector('#cm-sheet:not([hidden])');
  console.log('log title:', D.getElementById('cm-sheet-title').textContent, '| kinds:', [...sh.querySelectorAll('.cm-lgkind .cm-chip')].map((b) => b.textContent).join(' ')); if (sh.querySelectorAll('.cm-lgkind .cm-chip').length !== 5) bad.push('5 kinds');
  sh.querySelector('.cm-btn.ghost') && /Dictate/.test(sh.textContent) && bad.push('dictate button'); /Dictate/.test(sh.textContent) && bad.push('dictate still there');
  [...sh.querySelectorAll('.cm-lgout .cm-chip')].find((b) => b.textContent === 'Spoke').click(); await h.settle(); sh = D.querySelector('#cm-sheet:not([hidden])');
  const fu = sh.querySelector('.cm-lgfu .cm-date').value; const stv = sh.querySelectorAll('.cm-lgst select')[1].value; console.log('after Spoke: follow-up', fu, '| status', stv); if (!fu) bad.push('outcome → follow-up');
  const ta = sh.querySelector('.cm-mtta'); ta.value = 'Ana wants the price list'; ta.dispatchEvent(new W.Event('input')); const nx = sh.querySelector('.cm-lgstep'); nx.value = 'Send price list'; nx.dispatchEvent(new W.Event('input'));
  [...sh.querySelectorAll('button')].find((b) => /Save to NetHunt/.test(b.textContent)).click(); await wait(500); await h.settle();
  const cl = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_call_log').pop(); console.log('call log:', cl && JSON.stringify(cl[2].text)); if (!cl || cl[2].recordId !== cid || !/^Spoke — Ana wants/.test(cl[2].text)) bad.push('call log');
  const up = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record' && c[2].recordId === cid).pop(); console.log('fields:', up && JSON.stringify(up[2].fields)); if (!up || up[2].fields['Next step'] !== 'Send price list' || !up[2].fields['Next follow-up']) bad.push('call fields');
  // 📝 Log: a note is a comment
  M.openLog(D.body, cid, 'Tick Co', { kind: 'Note' }); await h.settle(); sh = D.querySelector('#cm-sheet:not([hidden])'); const ta2 = sh.querySelector('.cm-mtta'); ta2.value = 'Owner is a surgeon, decides fast'; ta2.dispatchEvent(new W.Event('input'));
  [...sh.querySelectorAll('button')].find((b) => /Save to NetHunt/.test(b.textContent)).click(); await wait(400); await h.settle();
  const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment' && c[2].recordId === cid).pop(); console.log('note:', cm && JSON.stringify(cm[2].text)); if (!cm || !cm[2].text.startsWith('Owner is a surgeon, decides fast')) bad.push('note comment');
  // old entry points open the same Log
  C.openLogCall(D.body, cid, 'Tick Co'); await h.settle(); console.log('openLogCall →', D.getElementById('cm-sheet-title').textContent); /^📝/.test(D.getElementById('cm-sheet-title').textContent) || bad.push('openLogCall redirect'); C.closeSheet();
  C.openVisitNotes(D.body, cid, 'Tick Co'); await h.settle(); const vk = D.querySelector('#cm-sheet:not([hidden]) .cm-lgkind [aria-pressed="true"]'); console.log('openVisitNotes →', vk && vk.textContent); if (!vk || !/Visit/.test(vk.textContent)) bad.push('visit redirect'); C.closeSheet();
  // 📊 usage: a sheet + a page view + a button, flushed into the shared store, shown in the usage sheet
  M.openLog(D.body, cid, 'Tick Co', { kind: 'Note' }); await h.settle(); await wait(1600); C.closeSheet(); W.dispatchEvent(new W.Event('pagehide')); await h.settle();
  const rows = M.useRows(Date.now() - 864e5); const ks = [...new Set(rows.map((r) => r.k))]; console.log('usage keys:', ks.join(' | ')); if (!ks.some((k) => /^Sheet: Log/.test(k))) bad.push('usage sheet'); if (!ks.some((k) => /^Page: Home/.test(k))) bad.push('usage page');
  const push = h.calls.filter((c) => c[0] === 'fetch' && /\/api\/leadstore/.test(c[1]) && c[2] === 'POST').length; console.log('leadstore posts so far:', push);
  // compact Reach
  const card = M.reachCard('6a2222222222222222222222', 'Reach Co', { iso: 'UY', brand: 'next', stage: 3, has: { email: true, chat: true, call: true, li: false } }); console.log('reach:', card.className, '|', card.textContent.replace(/\s+/g, ' ').slice(0, 160)); if (!card.classList.contains('compact') || card.querySelector('.h')) bad.push('compact reach');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
