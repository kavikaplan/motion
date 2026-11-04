// 🎯 Reach: 5 tried + next channel/time · 3 reasons to answer now (trip, congress, offer, easy yes) inserted into the message · 7 park advice, park, wake on reply · 6 meet list on a trip stop · Power hour shows the card
const { run } = require('./harness');
(async () => { const h = run({ params: { iso: 'UY', view: 'country', tags: ['uruguay'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d; const bad = [];
  // Power hour carries the card
  W.__cm2.openPowerHour(D.body); await new Promise((r) => setTimeout(r, 900)); await h.settle();
  const rc0 = D.querySelector('#cm-sheet .cm-reach'); console.log('power hour card:', rc0 && rc0.textContent.replace(/\s+/g, ' ').slice(0, 200)); rc0 || bad.push('power hour');
  { const dr = D.querySelector('#cm-sheet:not([hidden]) textarea.cm-phdraft:not(.cm-phnotes)'); const ez = rc0 && [...rc0.querySelectorAll('.cm-hook')].find((b) => /Easy yes/.test(b.textContent)); const before = dr ? dr.value : ''; ez && ez.click(); await h.settle(); console.log('PH draft after hook:', dr && JSON.stringify(dr.value.slice(0, 160))); if (!dr || dr.value === before || !/(yes|sí|sim|evet|oui)/.test(dr.value)) bad.push('PH insert'); }
  W.__cm.closeSheet && W.__cm.closeSheet();
  // a company with 5 tries on 2 channels over 5 weeks, no reply
  const cid = '6a2222222222222222222222'; const day = 864e5; const now = Date.now();
  const hist = [ [38, 'email'], [33, 'email'], [26, 'chat'], [19, 'email'], [12, 'chat'] ].map(([d, type]) => ({ record_id: cid, type, dir: 'out', time: new Date(now - d * day).toISOString() }));
  const od = W.dash.data.bind(W.dash); let H = hist; W.dash.data = (k, ...a) => (k === 'contact_history' ? { status: 'ok', data: H } : od(k, ...a));
  const T = W.__cm3.reachTouches(cid); console.log('tried:', JSON.stringify(T.n), 'total', T.total, 'chans', T.chans); if (T.total !== 5 || T.chans !== 2) bad.push('touches');
  const nx = W.__cm3.reachNext(cid, { email: true, chat: true, call: true, li: false }, 'UY', T); const sd = nx && nx.slot && new Date(`${nx.slot.ds}T12:00:00Z`).getUTCDay();
  console.log('next:', nx && nx.ch, '| slot', nx && nx.slot && nx.slot.ds, new Date(nx.slot.a).toISOString()); if (!nx || nx.ch !== 'call') bad.push('next channel'); if (!nx.slot || sd === 0 || sd === 6) bad.push('slot on a working day');
  const adv = W.__cm3.parkAdvice(T, 3); console.log('park advice:', JSON.stringify(adv)); if (!adv || adv.days !== 91) bad.push('advice');
  // reasons: a planned trip to UY, an offer
  W.__cm.tripPlans = [{ id: 'tp1', name: 'LatAm', status: 'planned', start: new Date(now + 20 * day).toISOString().slice(0, 10), legs: [{ iso: 'UY', days: 3, cities: ['Montevideo'] }] }];
  W.__cm3.OFR.set('o1', { id: 'o1', text: 'Free demo set for the first 3 distributors until 30 Nov', until: new Date(now + 30 * day).toISOString().slice(0, 10), brand: 'next', isos: [], by: 'Kavi', at: now });
  const hooks = W.__cm3.reachHooks(cid, { iso: 'UY', city: 'Montevideo', brand: 'next' }); console.log('hooks:', hooks.map((x) => `${x.k}:${x.lbl}`).join(' | ')); ['trip', 'offer', 'easy'].forEach((k) => hooks.some((x) => x.k === k) || bad.push(`hook ${k}`));
  console.log('trip ES:', hooks.find((x) => x.k === 'trip').make('es')); if (!/Estaré en Montevideo/.test(hooks.find((x) => x.k === 'trip').make('es'))) bad.push('spanish');
  // the card: chips insert into the open message after the greeting
  const sh = D.getElementById('cm-sheet'); sh.hidden = false; const keep = [...sh.childNodes]; sh.replaceChildren(); const ta = D.createElement('textarea'); ta.className = 'cm-phdraft'; ta.value = 'Hola Ana,\n\nLe escribo de Next Shoulder.\n\nSaludos'; sh.append(ta);
  const card = W.__cm3.reachCard(cid, 'Test Co', { iso: 'UY', city: 'Montevideo', brand: 'next', stage: 3, has: { email: true, chat: true, call: true, li: false }, lang: () => 'es' }); D.body.append(card);
  console.log('card:', card.textContent.replace(/\s+/g, ' ').slice(0, 400));
  const tb = [...card.querySelectorAll('.cm-hook')].find((b) => /You're in/.test(b.textContent)); tb.click(); console.log('draft:', JSON.stringify(ta.value)); if (!/^Hola Ana,\n\nEstaré en Montevideo/.test(ta.value)) bad.push('insert after greeting');
  if (!card.querySelector('.cm-rpark.adv')) bad.push('advice line'); if (!/☎ Call/.test(card.textContent)) bad.push('next in card');
  sh.replaceChildren(...keep); sh.hidden = true;
  // park → hidden for everyone (shared ignore) → they write → back
  await W.__cm3.parkSet(cid, 'Test Co', 91, { iso: 'UY' }); await h.settle(); const ign = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record' && c[2].fields && c[2].fields['Company ID'] === cid).pop(); console.log('ignore record:', ign && JSON.stringify(ign[2].fields)); if (!ign) bad.push('park → ignore');
  console.log('parked:', W.__cm3.isParked(cid), W.__cm2.isIgnored(cid)); if (!W.__cm3.isParked(cid)) bad.push('isParked');
  W.__cm3.PK.set(cid, { ...W.__cm3.PK.get(cid), at: now - 2 * day }); // parked two days ago
  H = [...hist, { record_id: cid, type: 'email', dir: 'in', time: new Date(now - 3600e3).toISOString() }]; W.__cm3.parkWatch(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
  console.log('after reply:', JSON.stringify(W.__cm3.PK.get(cid).woke), '| ignored', W.__cm2.isIgnored(cid)); if (!(W.__cm3.PK.get(cid).woke || {}).why || W.__cm2.isIgnored(cid)) bad.push('wake on reply');
  // trip wake: another parked company in UY, planned trip in 20 days
  const cid2 = '6a3333333333333333333333'; H = hist.map((e) => ({ ...e, record_id: cid2 })); W.__cm3.PK.set(cid2, { cid: cid2, name: 'Second Co', iso: 'UY', at: now - day, by: 'Kavi', until: new Date(now + 60 * day).toISOString().slice(0, 10), days: 61, tries: 5, wake: ['reply', 'trip', 'congress'] });
  W.__cm3.parkWatch(); await h.settle(); console.log('trip wake:', JSON.stringify(W.__cm3.PK.get(cid2).woke)); if (!/Montevideo/.test((W.__cm3.PK.get(cid2).woke || {}).why || '')) bad.push('wake on trip');
  // 6 · meet list on the trip stop
  W.dash.data = od; const leg = { iso: 'UY', days: 3, cities: [], from: W.__cm.tripPlans[0].start, to: W.__cm.tripPlans[0].start }; const mb = W.__cm3.meetBlock(leg, W.__cm.tripPlans[0]); console.log('meet:', mb.textContent.replace(/\s+/g, ' ').slice(0, 300)); if (!/Worth meeting/.test(mb.textContent)) bad.push('meet block');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
