// 🧠 company brain: summary + reply meaning (status/follow-up) + tasks + objection answers; ☑ tasks panel; Power hour due tasks
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); const W = h.w, D = h.d; const bad = []; let prompt = '';
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { prompt = JSON.parse(o.body).prompt; return new Response(JSON.stringify({ engine: 'Gemini', text: 'Where we stand: Interested in the shoulder system.\nWhat they said last: Ana (12 Oct) says the price is too high vs Zimmer.\nOpen requests: Spanish catalogue.\nNext step: Call Ana.\nDATA: {"last_from":"them","intent":"price_request","stage":"interested","followup_days":2,"tasks":[{"text":"Send Spanish catalogue to Ana","due_days":0},{"text":"Prepare price comparison","due_days":3}],"objection":{"type":"price","quote":"your price is higher than Zimmer","answers":["Entiendo, Ana. ¿Podemos revisar juntos el costo total por caso?","Gracias por la franqueza. Le propongo una llamada corta esta semana."]}}' })); } return of(u, o); };
  let used = ''; const card = W.__cm3.brainCard('6a1111111111111111111111', 'Promed', { brand: 'next', status: 'Contacted', onUse: (t) => { used = t; } }); D.body.append(card);
  for (let i = 0; i < 30 && !card.querySelector('.cm-brobj'); i++) { await new Promise((r) => setTimeout(r, 200)); await h.settle(); }
  console.log('card:', card.textContent.replace(/\s+/g, ' ').slice(0, 420));
  if (!/Where we stand/.test(card.textContent) || /DATA:/.test(card.textContent)) bad.push('summary');
  if (!card.querySelector('.cm-brint') || !/asks for prices/.test(card.textContent)) bad.push('intent');
  if (!/follow up/.test(card.textContent)) bad.push('follow-up suggestion');
  const useB = [...card.querySelectorAll('.cm-brobj button')].find((b) => /Use/.test(b.textContent)); useB && useB.click(); if (!/Entiendo/.test(used)) bad.push('use answer');
  const T = W.__cm3.myTasks(true).filter((t) => t.cid === '6a1111111111111111111111'); console.log('tasks:', T.map((t) => `${t.text} (${t.due || 'no date'})`).join(' | ')); if (T.length !== 2 || T[0].src !== 'ai') bad.push('tasks');
  if (!W.__cm3.taskDue('6a1111111111111111111111')) bad.push('task due → Power hour');
  // no duplicates on a second read
  W.__cm3.brainAfter('6a1111111111111111111111', 'Promed', { tasks: [{ text: 'Send Spanish catalogue to Ana!', due_days: 1 }] }); if (W.__cm3.myTasks(true).filter((t) => t.cid === '6a1111111111111111111111').length !== 2) bad.push('duplicate task');
  if (!/Replies of ours that worked|objection/.test(prompt)) bad.push('prompt');
  // ☑ panel
  const btn = D.querySelector('.cm-tkbtn'); console.log('top-bar icon:', btn && btn.textContent, '|', btn && btn.title); if (!btn) bad.push('icon'); else { btn.click(); await h.settle(); const P = D.querySelector('.cm-tkpanel'); console.log('panel groups:', P && [...P.querySelectorAll('.gl')].map((x) => x.textContent).join(', ')); const cb = P && P.querySelector('.cm-tkrow input[type=checkbox]'); if (!cb) bad.push('panel'); else { cb.checked = true; cb.dispatchEvent(new W.Event('change')); await new Promise((r) => setTimeout(r, 600)); console.log('after tick:', W.__cm3.myTasks(true).filter((t) => t.cid === '6a1111111111111111111111').length, 'open'); if (W.__cm3.myTasks(true).filter((t) => t.cid === '6a1111111111111111111111').length !== 1) bad.push('tick'); } }
  { const od = W.dash.data.bind(W.dash); W.dash.data = (k, ...a) => (k === 'company_fields' ? { status: 'ok', data: ['Un Processed', 'Contacted', 'Replied', 'Interested', 'Meeting', 'Negotiating', 'Not Interested'].map((o, i) => ({ field: 'NEXT Status', option: o, idx: i })) } : od(k, ...a));
    const s1 = W.__cm3.statusFor('interested', 'next', 'Contacted'), s2 = W.__cm3.statusFor('replied', 'next', 'Interested'), s3 = W.__cm3.statusFor('not_interested', 'next', 'Interested'); W.dash.data = od;
    console.log('status suggestions:', JSON.stringify([s1, s2, s3])); if (s1 !== 'Interested' || s2 !== '' || s3 !== 'Not Interested') bad.push('statusFor'); }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
