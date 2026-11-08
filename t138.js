// Yaman's feedback: ✓ Check toggles (no stacked boxes) · Dunitech = nails only, Next = shoulder only, no X-ray leads · correct Arabic
// · rich email: paste/drag images & GIFs, align, editable visible signature, pictures go inline (cid) · after sending from Power hour → back there
// · campaign Tags never stuck on “Loading” (type a tag) · Power hour 🌐 website + ➕ Add info (sorted into NetHunt fields)
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // 1 ✓ Check: a second click closes the details instead of adding another box
  const an0 = D.createElement('button'); D.body.append(an0); let fitBtn = null;
  C.openSheet(an0, '⚡ 1 of 1 · test', (body) => { const w = C.el('div', 'cm-phwho'); const co = C.el('button', 'cm-co', 'Test Co'); co.dataset.openCompany = 'c1'; fitBtn = C.el('button', 'fitb', 'Check'); w.append(co, fitBtn); body.append(w); }, { center: true, wide: true });
  X.openFit(fitBtn, 'c1'); const n1 = D.querySelectorAll('#cm-sheet .cm-fitpan').length; X.openFit(fitBtn, 'c1'); const n2 = D.querySelectorAll('#cm-sheet .cm-fitpan').length; X.openFit(fitBtn, 'c1'); const n3 = D.querySelectorAll('#cm-sheet .cm-fitpan').length;
  console.log('check boxes after 1/2/3 clicks:', n1, n2, n3); if (n1 !== 1 || n2 !== 0 || n3 !== 1) bad.push('check toggle');
  // 2/3 brand scope + Arabic
  console.log('products:', W.cmBrandProd('Dunitech', 'en'), '|', W.cmBrandProd('Next Shoulder', 'es'), '|', W.cmBrandProd('Dunitech', 'ar'));
  if (W.cmBrandProd('Dunitech', 'en') !== 'intramedullary nails' || W.cmBrandProd('Next Shoulder', 'en') !== 'shoulder prostheses') bad.push('products');
  const sc = [ W.cmOffScope('dunitech', 'X-ray', 1), W.cmOffScope('next', 'X-Ray / imaging', 0), W.cmOffScope('dunitech', 'X-ray', 3), W.cmOffScope('motion', 'X-ray', 0), W.cmOffScope('dunitech', 'Ortho', 0) ]; console.log('off scope (X-ray dunitech, next, engaged, motion, ortho):', sc.join(' '));
  if (sc.join() !== 'true,true,true,false,false') bad.push('x-ray scope');
  const R0 = W.Response || globalThis.Response; const JJ = (o) => new R0(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); const of0 = W.fetch; const prompts = []; const posts = []; const ups = [];
  W.fetch = async (u, o = {}) => { u = String(u);
    if (u.startsWith('/api/summarize?engines')) return JJ({ engines: [ 'anthropic' ] });
    if (u.startsWith('/api/summarize')) { const b = JSON.parse(o.body); prompts.push(b.prompt); if (/Sort ONLY/.test(b.prompt)) return JJ({ text: '{"phones":["+216 71 222 333"],"emails":["sales@biomed.tn"],"website":"www.biomed.tn","brands":["Stryker"],"people":[{"name":"Ali Ben Salah","title":"Purchasing manager","email":"","phone":""}],"note":"Supplies 4 public hospitals in Tunis."}' }); return JJ({ text: 'مرحباً،\nنحن شركة Dunitech' }); }
    if (u.startsWith('/api/gmail/accounts')) return JJ({ role: 'House', accounts: [ { mailbox: 'hi@kavikaplan.com', aliases: [ { email: 'export@duni-tech.com', mailbox: 'hi@kavikaplan.com', name: 'Dunitech Nails', isDefault: true, signature: '<div style="color:#000">Kind regards,<br>Yaman<br><img src="https://example.com/logo.png"></div>' } ] } ] });
    if (u.startsWith('/api/gmail/send')) { posts.push(JSON.parse(o.body)); return JJ({ ok: true, id: 'm1', from: 'export@duni-tech.com' }); }
    if (u.startsWith('/api/files?inline=1')) { ups.push(u); return JJ({ ok: true, key: '_img-abc-pic.gif' }); }
    if (u.startsWith('/api/files/_templates')) return JJ([]);
    if (u.startsWith('/api/files')) return JJ({ files: [] });
    return of0(u, o); };
  W.confirm = () => true; C.uiFlags = { ...(C.uiFlags || {}), mailOn: true, aiDrafts: false };
  X.aiReply({ id: 'c9', name: 'STE Bio Medical' }, { lang: 'ar', brand: 'Dunitech', sender: 'Yaman', iso: 'TN', base: 'Hello, we look for a distributor.' }, () => {}); await wait(300);
  const pr = prompts.find((p) => /WhatsApp message/.test(p)) || ''; console.log('reply prompt says nails only:', /ONLY intramedullary nails/.test(pr), '| no X-ray:', /no X-ray/.test(pr), '| natural spoken Arabic:', /NOT formal textbook Arabic/.test(pr), '| name kept in Latin when not set:', /"Yaman" in Latin letters/.test(pr));
  if (!/ONLY intramedullary nails/.test(pr) || !/NOT formal textbook Arabic/.test(pr) || !/"Yaman" in Latin letters/.test(pr)) bad.push('AI draft scope/arabic');
  // 4/5/7 email from Power hour: rich editor, signature visible & editable, images inline, back to Power hour
  const inPH = D.querySelector('#cm-sheet .cm-co'); await X.openMail({ anchor: inPH, to: 'contact@datsmedical.com', subject: 'Dunitech – STE', company: 'STE', cid: '', brand: 'Dunitech' }); await h.settle(); await wait(200);
  const S = D.getElementById('cm-maildock') || D.getElementById('cm-sheet'); /* from Power hour the email is docked on the right */ const ed = S.querySelector('.cm-mlpaper .cm-mlbody[contenteditable="true"]'); const sg = S.querySelector('.cm-mlpaper .cm-mlsig[contenteditable="true"]'); const tools = [ ...S.querySelectorAll('.cm-mltool button') ].map((b) => b.title);
  console.log('rich editor:', !!ed, '| signature inside the white paper & editable:', !!sg, sg && sg.textContent.replace(/\s+/g, ' ').trim(), '| tools:', tools.join(', '));
  if (!ed || !sg || !/Yaman/.test(sg.textContent) || !tools.includes('Centre') || !tools.some((t) => /image/i.test(t))) bad.push('editor');
  // paste: formatting kept, scripts and handlers dropped
  const pe = new W.Event('paste', { bubbles: true, cancelable: true }); pe.clipboardData = { files: [], getData: (k) => (k === 'text/html' ? '<p onclick="x()">Hello <b>there</b></p><script>bad()</script>' : '') }; ed.dispatchEvent(pe); await wait(50);
  console.log('pasted:', ed.innerHTML); if (!/<b>there<\/b>/.test(ed.innerHTML) || /onclick|script/.test(ed.innerHTML)) bad.push('paste sanitize');
  // drop an image file → uploaded once, then sent inline
  const f = new W.File([ 'GIF89a' ], 'pic.gif', { type: 'image/gif' }); const de = new W.Event('drop', { bubbles: true, cancelable: true }); de.dataTransfer = { files: [ f ], types: [ 'Files' ] }; ed.dispatchEvent(de); await wait(200);
  ed.insertAdjacentHTML('beforeend', '<div style="text-align: center;">Centred line</div>'); ed.dispatchEvent(new W.Event('input')); sg.innerHTML = 'Best,<br>Yaman Hüseyin'; sg.dispatchEvent(new W.Event('input'));
  console.log('upload calls:', ups.length, '| img in box:', (ed.querySelector('img') || {}).getAttribute && ed.querySelector('img').getAttribute('src'), '| plain text value:', JSON.stringify(ed.value));
  if (ups.length !== 1 || !ed.querySelector('img[src*="_img-abc"]') || !/Hello there/.test(ed.value)) bad.push('drop image');
  [ ...S.querySelectorAll('button') ].find((b) => /Send/.test(b.textContent) && b.classList.contains('cm-btn')).click(); await wait(300); await h.settle();
  const P = posts[0] || {}; console.log('sent html has cid image:', /src="cid:mi0\./.test(P.html || ''), '| inline:', JSON.stringify(P.inline), '| centred kept:', /text-align: center/.test(P.html || ''), '| edited signature:', /Yaman Hüseyin/.test(P.html || ''), '| text sig:', /Yaman Hüseyin/.test(P.text || ''));
  if (!/src="cid:mi0\./.test(P.html || '') || !(P.inline || [])[0] || P.inline[0].key !== '_img-abc-pic.gif' || !/text-align: center/.test(P.html) || !/Yaman Hüseyin/.test(P.html) || /Kind regards/.test(P.html)) bad.push('send html');
  const t2 = (D.getElementById('cm-sheet-title') || {}).textContent; console.log('after sending, back in:', t2, '| open:', !D.getElementById('cm-sheet').hidden, '| same company row:', !!D.querySelector('#cm-sheet .cm-phwho .cm-co'));
  if (!/^⚡/.test(t2 || '') || D.getElementById('cm-sheet').hidden || !D.querySelector('#cm-sheet .cm-phwho .cm-co')) bad.push('back to power hour');
  // templates keep pictures
  const T = X.mlEditor({ body: '', html: '<p>Intro</p><img src="/api/files/_img-x.gif">' }, ''); console.log('template editor img:', !!T.ed.querySelector('img'), '| rich:', T.hasRich(), '| no signature area:', T.wrap.querySelector('.cm-mlsigw').hidden); if (!T.hasRich() || !T.wrap.querySelector('.cm-mlsigw').hidden) bad.push('template editor');
  // 6 campaign Tags: no endless “Loading”, you can type a tag
  const arr = []; const mm = X.caMulti('🏷 Tags', [], arr, null, { free: 'tag' }); D.body.append(mm); const inp = mm.querySelector('input.cm-cpin'); console.log('tags empty text:', mm.querySelector('.ls').textContent, '| input:', inp && inp.placeholder);
  if (/Loading/.test(mm.textContent) || !inp) bad.push('tags loading'); else { inp.value = 'WHX26'; inp.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); console.log('typed tag picked:', arr.join(), '|', mm.querySelector('summary').textContent); if (arr[0] !== 'WHX26' || !mm.querySelector('.ls input:checked')) bad.push('free tag'); }
  const ld = X.caMulti('🗂 Category', [], [], null, { loading: true }); console.log('while NetHunt loads:', ld.querySelector('.ls').textContent); if (!/Loading/.test(ld.textContent)) bad.push('loading text');
  // ➕ Add info: rules sort without AI, AI sorts, save writes the right fields
  const R = X.piRules('Tel: +216 71 123 456 / Mob 00216 98 765 432\nEmail: info@biomed.tn\nwww.biomed.tn\nDistributor of orthopaedic implants for 12 clinics'); console.log('rules:', R.map((x) => `${x.kind}=${x.value}`).join(' | '));
  if (R.filter((x) => x.kind === 'phone').length !== 2 || !R.some((x) => x.kind === 'email' && x.value === 'info@biomed.tn') || !R.some((x) => x.kind === 'website' && /biomed\.tn/.test(x.value)) || !R.some((x) => x.kind === 'note' && /12 clinics/.test(x.value)) || R.some((x) => x.kind === 'website' && /^https:\/\/info/.test(x.value))) bad.push('rules');
  const F = new Map([ [ 'Phone number', '+216 71 123 456' ], [ 'Email', '' ], [ 'Brand', '' ] ]); let closed = 0; const box = X.piBox('c77', 'Bio Medical', F, () => { closed++; }); D.body.append(box);
  const ta = box.querySelector('textarea'); ta.value = 'Tel: +216 71 123 456 / Mob 00216 98 765 432\nEmail: info@biomed.tn'; ta.dispatchEvent(new W.Event('input')); await wait(350);
  const rows = [ ...box.querySelectorAll('.cm-pirow') ].map((r) => r.textContent); console.log('preview rows:', rows.join(' || ')); if (!rows.some((r) => /already in NetHunt/.test(r) && /71 123 456/.test(r)) || rows.length < 3) bad.push('preview');
  [ ...box.querySelectorAll('button') ].find((b) => /Sort with AI/.test(b.textContent)).click(); await wait(300);
  const rows2 = [ ...box.querySelectorAll('.cm-pirow') ].map((r) => r.querySelector('.k').textContent + ':' + r.querySelector('.v').textContent); console.log('AI rows:', rows2.join(' | ')); if (!rows2.some((r) => /Brand.*Stryker/.test(r)) || !rows2.some((r) => /contact.*Ali Ben Salah/.test(r))) bad.push('ai sort');
  const before = h.calls.length; [ ...box.querySelectorAll('button') ].find((b) => /Save \d+ to NetHunt/.test(b.textContent)).click(); await wait(300);
  const nh = h.calls.slice(before).filter((c) => c[0] === 'nh'); const up = nh.find((c) => c[1] === 'update_record'); const cr = nh.find((c) => c[1] === 'create_record'); const cm = nh.find((c) => c[1] === 'create_record_comment');
  console.log('saved fields:', up && JSON.stringify(up[2].fields), '| contact:', cr && cr[2].fields.Name, '| comment:', cm && cm[2].text.replace(/\n/g, ' / '), '| box says:', (box.querySelector('.cm-piok') || {}).textContent);
  if (!up || !(up[2].fields['Phone number'] || []).includes('+216 71 222 333') || !(up[2].fields['Phone number'] || []).includes('+216 71 123 456') || !(up[2].fields.Email || []).includes('sales@biomed.tn') || !(up[2].fields.Brand || []).includes('Stryker') || up[2].fields.Website !== 'https://www.biomed.tn' || !cr || !cm || !/4 public hospitals/.test(cm[2].text)) bad.push('save');
  console.log('pending after save:', X.piPending('c77')); if (X.piPending('c77')) bad.push('pending');
  // Power hour itself: ➕ Add info sits with the outcomes, opens the box; Done still goes to the next company
  W.fetch = of0; C.closeSheet(); h.w.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'companies', csub: 'partners', psort: 'next' }); await h.settle(); await h.settle(); await wait(200); await h.settle();
  const phb = D.querySelector('.cm-phbtn'); if (!phb) bad.push('no power hour button'); else { phb.click(); await h.settle(); await h.settle();
    const who0 = (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent; const ai = [ ...D.querySelectorAll('#cm-sheet .outc button') ].find((b) => /Add info/.test(b.textContent)); console.log('PH company:', who0, '| ➕ Add info chip:', !!ai);
    if (!ai) bad.push('add info chip'); else { ai.click(); await h.settle(); const bx = D.querySelector('#cm-sheet .cm-phinfo'); console.log('info box open:', !!bx, '| placed before the notes:', !!(bx && bx.nextElementSibling && bx.nextElementSibling.classList.contains('cm-phnotes'))); if (!bx) bad.push('info box');
      const dn = [ ...D.querySelectorAll('#cm-sheet button') ].find((b) => /^Done/.test(b.textContent)); dn.click(); await wait(200); await h.settle(); for (let i = 0; i < 40 && D.querySelector('#cm-sheet .cm-phload'); i++) await h.settle(150); const who1 = (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent; console.log('after Done:', who1); if (!who1 || who1 === who0) bad.push('done next'); } }
  // 3 end-to-end: an X-ray company (never contacted) is not in the Dunitech Power hour or Best partners
  C.closeSheet(); h.w.dash.setParams({ ours: 'dunitech' }); await h.settle(); await wait(200); await h.settle();
  const P0 = C.rowsOf('partners'); let xr = P0.find((r) => !(r.stage_dunitech >= 3) && !(C.realContact(r.id) || {}).pending); if (!xr) bad.push('no partner to mark'); else {
    h.w.dash.setParams({ psort: 'score' }); await h.settle(); await wait(200); await h.settle(); const pq0 = W.__cm2x.powerQueue().list.map((x) => x.id); const names0 = [ ...D.querySelectorAll('.cm-partner .pn') ].map((b) => b.textContent.trim()); const ids0 = C.rowsOf('partners').filter((r) => names0.includes(String(r.company).trim())).map((r) => r.id); const xr2 = P0.find((r) => ids0.includes(r.id) && pq0.includes(r.id) && !(r.stage_dunitech >= 3) && !(C.realContact(r.id) || {}).pending) || xr; console.log('before: in list', ids0.includes(xr2.id), '| in queue', pq0.includes(xr2.id)); if (!ids0.includes(xr2.id) || !pq0.includes(xr2.id)) bad.push('control');
    xr = xr2; const od = h.w.dash.data; h.w.dash.data = (k) => { const r = od(k); [ 'partners', 'pipeline_stages', 'companies' ].includes(k) && 'ok' === r.status && r.data.forEach((x) => { if (x.id === xr.id) x.category = 'X-ray'; }); return r; }; // the company is X-ray in every dataset, even after reloads h.w.dash.setParams({ psort: 'next' }); await h.settle(); await wait(200); await h.settle();
    D.querySelector('.cm-phbtn').click(); await h.settle(); await h.settle(); const inList = [ ...D.querySelectorAll('.cm-partner .pn') ].some((b) => b.textContent.trim() === String(xr.company).trim());
    const q = W.__cm2x.powerQueue ? W.__cm2x.powerQueue().list.map((x) => x.id) : null; console.log('pn', [...D.querySelectorAll('.cm-partner .pn')].map((b) => b.textContent.trim()).filter((t) => /ARENYS/.test(t)), 'rows w/ name', [...D.querySelectorAll('.cm-partner')].filter((r) => r.textContent.includes(xr.company)).length, 'stage', xr.stage_dunitech, 'off', W.cmOffScope('dunitech', 'X-ray', xr.stage_dunitech), 'drawn cat', (h.w.dash.data('partners').data.find((r) => r.id === xr.id) || {}).category, '|', 'ours', C.oursKey(), '| cat now', (C.rowsOf('partners').find((r) => r.id === xr.id) || {}).category, '| X-ray company', xr.company, '| in Best partners:', inList, '| in Power hour queue:', q ? q.includes(xr.id) : 'n/a', '| queue size:', q && q.length);
    if (inList || (q && q.includes(xr.id))) bad.push('x-ray still listed'); }
  W.fetch = of0; console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 3).join(' | ')); process.exit(0); })();
