// ✉ / 💬 next to each task and the 🧠 “Next step” / “Open requests”: an AI message that does that task — WhatsApp link or email composer; in Power hour straight into the message box
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, M = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const of = W.fetch; let prompts = []; const R = W.Response || globalThis.Response;
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { const b = JSON.parse(o.body || '{}'); prompts.push(JSON.stringify(b)); const email = /short email/.test(JSON.stringify(b)); return new R(JSON.stringify({ text: email ? 'Subject: Price list\n\nHola Ana,\nle envío la lista de precios.\nKavi' : 'Hola Ana, le envío la lista de precios hoy. Kavi' }), { status: 200 }); } if (u.startsWith('/api/gmail/accounts')) return new R(JSON.stringify({ role: 'House', accounts: [{ mailbox: 'hi@kavikaplan.com', aliases: [{ email: 'hi@kavikaplan.com', name: 'Kavi', signature: '', isDefault: true }] }] }), { status: 200 }); return of(u, o); };
  const co = C.rowsOf('companies').find((c) => c.iso && c.company) || { id: '6a7777777777777777777777', company: 'Msg Co' }; const cid = co.id;
  // task rows carry the buttons
  M.taskAdd({ cid, company: co.company, text: 'Send the price list', due: new Date().toISOString().slice(0, 10) });
  const t = M.myTasks(true).find((x) => x.cid === cid); const box = D.createElement('div'); D.body.append(box); M.mtHomeWatch(true); await h.settle();
  const tr = [...D.querySelectorAll('.cm-today .cm-tdrow')].find((r) => /Send the price list/.test(r.textContent)); console.log('today row buttons:', tr && [...tr.querySelectorAll('.cm-tmsg button')].map((b) => b.textContent).join(' ')); if (!tr || tr.querySelectorAll('.cm-tmsg button').length !== 2) bad.push('today buttons');
  // 🧠 Next step line
  C.uiFlags = { ...(C.uiFlags || {}), aiSum: { ...((C.uiFlags || {}).aiSum || {}), [cid]: { t: 'Where we stand: interested\nOpen requests: none\nNext step: Send the price list to Ana', at: Date.now() } } };
  const card = M.brainCard(cid, co.company); D.body.append(card); const lines = [...card.querySelectorAll('.ln')].map((l) => `${l.textContent.slice(0, 30)}[${l.querySelectorAll('.cm-tmsg').length}]`); console.log('brain lines:', lines.join(' | ')); if (!lines.some((l) => /^Next step.*\[1\]$/.test(l)) || lines.some((l) => /^Open requests.*\[1\]$/.test(l))) bad.push('brain next step buttons');
  const tk = card.querySelector('.cm-tkrow .cm-tmsg'); tk || bad.push('task row in brain card');
  // WhatsApp outside Power hour: a sheet with the draft, then the link
  // outside Power hour: Power hour opens on the company and the task's message lands in its message box
  { const wb0 = [...tr.querySelectorAll('.cm-tmsg button')].find((b) => b.textContent === '💬'); wb0.click(); await wait(1500); await h.settle(); await wait(800);
    const ti0 = D.getElementById('cm-sheet-title').textContent; const d0 = D.querySelector('#cm-sheet:not([hidden]) textarea.cm-phdraft:not(.cm-phnotes)'); console.log('→ Power hour:', ti0.slice(0, 40), '| draft:', d0 && JSON.stringify(d0.value.slice(0, 60)));
    if (!/^⚡/.test(ti0) || !d0 || !/le envío la lista/.test(d0.value)) bad.push('task → Power hour draft');
    const wr = D.querySelector('#cm-sheet:not([hidden]) .cm-reach .ln.write'); wr && bad.push('write-for row should be gone');
    const tw = [...D.querySelectorAll('#cm-sheet:not([hidden]) .cm-brain .cm-tmw')]; console.log('✍️ buttons in Medint AI:', tw.length); if (tw.length < 2) bad.push('✍️ in Medint AI card');
    const chip = D.querySelector('#cm-sheet:not([hidden]) .cm-tkchip, #cm-sheet:not([hidden]) .cm-tkc'); chip && bad.push('task pop-up chip in Power hour header');
    // ✍️ on a task rewrites the box
    const d9 = D.querySelector('#cm-sheet:not([hidden]) textarea.cm-phdraft:not(.cm-phnotes)'); d9.value = 'x'; tw[tw.length - 1].click(); await wait(400); console.log('after ✍️:', JSON.stringify(d9.value.slice(0, 40))); if (!/Hola Ana/.test(d9.value)) bad.push('✍️ writes');
    // completed tasks behind a small arrow
    const tid = M.myTasks(true).find((x) => x.cid === cid && /Send the price list/.test(x.text)).id; M.taskDone(tid, true); const card2 = M.brainCard(cid, co.company); D.body.append(card2); const dn = card2.querySelector('details.cm-tkdone'); console.log('done arrow:', dn && dn.querySelector('summary').textContent, '| open:', dn && dn.open); if (!dn || dn.open) bad.push('done arrow'); card2.remove(); M.taskDone(tid, false);
    const inPH = D.querySelector('#cm-sheet:not([hidden]) .cm-brain .cm-tmsg'); inPH && bad.push('message buttons duplicated inside Power hour');
    C.closeSheet(); await h.settle(); }
  M.tmOpen.sheet = true; M.mtHomeWatch(true); await h.settle(); const tr2 = [...D.querySelectorAll('.cm-today .cm-tdrow')].find((r) => /Send the price list/.test(r.textContent));
  const wb = [...tr2.querySelectorAll('.cm-tmsg button')].find((b) => b.textContent === '💬'); wb.click(); await wait(300); await h.settle();
  let sh = D.querySelector('#cm-sheet:not([hidden])'); console.log('sheet:', D.getElementById('cm-sheet-title').textContent, '|', sh.querySelector('.cm-mtta').value); if (!/le envío la lista/.test(sh.querySelector('.cm-mtta').value)) bad.push('wa draft');
  const p0 = prompts.find((p) => /Send the price list/.test(p)); console.log('prompt has task + rules:', !!p0, p0 && /WhatsApp/.test(p0)); if (!p0) bad.push('prompt');
  const inp = sh.querySelector('input.cm-lgstep'); inp.value = '+57 300 123 4567'; inp.dispatchEvent(new W.Event('input')); const a = [...sh.querySelectorAll('a.cm-btn')].find((x) => /WhatsApp/.test(x.textContent)); a.dispatchEvent(new W.MouseEvent('click', { bubbles: true, cancelable: true })); console.log('wa link:', a.href.slice(0, 90)); if (!/wa\.me\/573001234567\?text=Hola/.test(a.href)) bad.push('wa link');
  // email: switch and open the composer
  [...sh.querySelectorAll('.cm-chip')].find((b) => /Email/.test(b.textContent)).click(); await wait(300); await h.settle(); sh = D.querySelector('#cm-sheet:not([hidden])'); console.log('email draft:', JSON.stringify(sh.querySelector('.cm-mtta').value));
  const eb = [...sh.querySelectorAll('button')].find((b) => /Open in email/.test(b.textContent)); eb.click(); await wait(500); await h.settle(); const ti = D.getElementById('cm-sheet-title').textContent; const body = [...D.querySelectorAll('#cm-sheet textarea, #cm-sheet .cm-mlbody')].map((x) => x.value).join(' | '); const subj = [...D.querySelectorAll('#cm-sheet input')].map((x) => x.value).join(' | ');
  console.log('composer:', ti, '| subject/inputs:', subj.slice(0, 80), '| body:', body.slice(0, 80)); if (!/email/i.test(ti) || !/le envío/.test(body) || !/Price list/.test(subj)) bad.push('email composer');
  C.closeSheet();
  // Power hour: straight into the message box
  const ph = D.getElementById('cm-sheet'); ph.hidden = false; const keep = [...ph.childNodes]; ph.replaceChildren(); const bc = D.createElement('div'); bc.className = 'cm-brain'; bc.dataset.id = cid; const dr = D.createElement('textarea'); dr.className = 'cm-phdraft'; ph.append(bc, dr);
  const b2 = M.tmButtons(cid, co.company, 'Ask for their registration documents'); ph.append(b2); b2.querySelector('button').click(); await wait(300); console.log('PH draft:', JSON.stringify(dr.value)); if (!/Hola Ana/.test(dr.value)) bad.push('PH draft'); ph.replaceChildren(...keep); ph.hidden = true;
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
