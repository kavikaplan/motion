// Yaman REV2: ✍️ My Arabic (name exactly as he writes it + his own messages as the style; drafts sign with the person using Medint, not Kavi)
// · 🖼 pictures in the email box resize (S / M / L / full / original, drag the corner) and align · Power hour shows one loading card until the company is in
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const prompts = []; const of = W.fetch;
  W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { prompts.push(JSON.parse(o.body).prompt); return new Response(JSON.stringify({ text: 'مرحبا' })); } return of(u, o); };
  // ✍️ My Arabic
  C.uiFlags = { ...(C.uiFlags || {}), arName: 'يمان', arStyle: 'مرحبا أستاذ، معك يمان من شركة Dunitech. حابب أعرف إذا عندكم اهتمام بالمسامير النخاعية؟' };
  X.aiReply({ id: 'cAR1', name: 'Test' }, { lang: 'ar', brand: 'Dunitech', sender: 'Yaman', iso: 'TN', base: 'Hello' }, () => {}); await wait(300);
  const pr = prompts.find((p) => /WhatsApp message/.test(p)) || ''; console.log('name exactly:', /exactly "يمان"/.test(pr), '| his messages as style:', /حابب أعرف/.test(pr), '| spoken not textbook:', /NOT formal textbook Arabic/.test(pr));
  if (!/exactly "يمان"/.test(pr) || !/حابب أعرف/.test(pr)) bad.push('arabic settings in prompt');
  const p0 = X.arPanel(() => {}); D.body.append(p0); const ins = p0.querySelectorAll('input, textarea'); console.log('panel prefilled:', ins[0].value, '|', ins[1].value.slice(0, 20)); if (ins[0].value !== 'يمان') bad.push('panel');
  ins[0].value = 'يَمان'; [ ...p0.querySelectorAll('button') ].find((b) => b.textContent === 'Save').click(); console.log('saved name:', C.uiFlags.arName); if (C.uiFlags.arName !== 'يَمان') bad.push('panel save');
  // ready-made texts sign with the person using Medint (Arabic: the Arabic name), never “Kavi Kaplan” for someone else
  const rd = W.__cm2x.replyDraft || W.replyDraft; const me = W.__cm2.me().name;
  if (rd) { const ar = rd({ id: 'x' }, null, 'Ali', 'ar', 'Dunitech', [ 'gen' ]); const en = rd({ id: 'x' }, null, 'Ali', 'en', 'Dunitech', [ 'gen' ]); console.log('Arabic sign-off:', ar.split('\n').pop(), '| English sign-off:', en.split('\n').pop(), '| me:', me);
    if (!/يَمان/.test(ar) || /كافي كابلان/.test(ar) || !en.endsWith(me)) bad.push('sign-off'); } else bad.push('replyDraft not reachable');
  C.uiFlags = { ...(C.uiFlags || {}), arName: '', arStyle: '' };
  // 🖼 picture sizes
  const E = X.mlEditor({ body: '', html: '<p>Hi</p><img src="/api/files/_img-a.gif">' }, ''); D.body.append(E.wrap); const im = E.ed.querySelector('img');
  im.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); const bar = E.wrap.querySelector('.cm-mlimgbar'); const hd = E.wrap.querySelector('.cm-mlimgh'); console.log('picture toolbar shows:', !bar.hidden, '| handle:', !hd.hidden, '| buttons:', [ ...bar.querySelectorAll('button') ].map((b) => b.title).join(', '));
  if (bar.hidden || hd.hidden) bad.push('picture bar');
  const btn = (t) => [ ...bar.querySelectorAll('button') ].find((b) => b.title === t); btn('Medium').click(); const wM = im.getAttribute('width'); btn('Small').click(); const wS = im.getAttribute('width'); btn('Picture centre').click();
  console.log('medium/small width:', wM, wS, '| centred:', im.style.marginLeft, im.style.marginRight); if (wM !== '300' || wS !== '150' || im.style.marginLeft !== 'auto') bad.push('sizes');
  // drag the corner (+90 px)
  const PE = W.PointerEvent || W.MouseEvent; im.getBoundingClientRect = () => ({ width: 150, height: 100, top: 0, left: 0, right: 150, bottom: 100 }); hd.dispatchEvent(new PE('pointerdown', { bubbles: true, clientX: 100, pointerId: 1 })); hd.dispatchEvent(new PE('pointermove', { bubbles: true, clientX: 190, pointerId: 1 })); hd.dispatchEvent(new PE('pointerup', { bubbles: true, pointerId: 1 }));
  console.log('after drag:', im.getAttribute('width')); if (im.getAttribute('width') !== '240') bad.push('drag resize');
  const out = E.out(); console.log('sent html:', out.body.slice(0, 200)); if (!/width="240"/.test(out.body) || !/width: 240px/.test(out.body) || /class=/.test(out.body) || !/cid:/.test(out.body)) bad.push('size goes out');
  btn('Remove picture').click(); console.log('removed:', !E.ed.querySelector('img'), '| bar hidden:', bar.hidden); if (E.ed.querySelector('img')) bad.push('remove');
  // Power hour: a loading card while the company comes in, then the company
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', psort: 'next' }); await h.settle(); await wait(300); await h.settle();
  const od = W.dash.data; let slow = true; W.dash.data = (k) => (slow && k === 'company_record' ? { status: 'loading', data: [] } : od(k));
  D.querySelector('.cm-phbtn').click(); await wait(50); const sk = D.querySelector('#cm-sheet .cm-phload'); console.log('loading card:', !!sk, sk && sk.textContent.replace(/\s+/g, ' ').slice(0, 90), '| no half-drawn company:', !D.querySelector('#cm-sheet .cm-phwho'));
  if (!sk || D.querySelector('#cm-sheet .cm-phwho')) bad.push('loading card');
  slow = false; W.dash.data = od; await wait(400); await h.settle(); console.log('then the company:', !!D.querySelector('#cm-sheet .cm-phwho'), '| card gone:', !D.querySelector('#cm-sheet .cm-phload')); if (!D.querySelector('#cm-sheet .cm-phwho') || D.querySelector('#cm-sheet .cm-phload')) bad.push('after loading');
  W.fetch = of; console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
