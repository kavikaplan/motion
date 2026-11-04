// (1) X-ray companies never show for Dunitech / Next — not even when they wrote or have a status — but stay under All companies
// (2) the address bar follows Power hour (#power/<id>) and the company page (#company/<id>); opening such a link brings it back
// (3) pictures from other websites in an email / template are copied into Medint; ones that can't be copied get a red frame + a warning
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  { const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d, C = W.__cm;
    // (1)
    const q0 = W.__cm2x.powerQueue().list; const pick = q0.find((x) => x.t === 0) || q0[0]; console.log('company that wrote:', pick && pick.name, '| t', pick && pick.t);
    if (!pick) bad.push('no company'); else {
      const od = W.dash.data; W.dash.data = (k) => { const r = od(k); [ 'partners', 'pipeline_stages', 'companies' ].includes(k) && 'ok' === r.status && r.data.forEach((x) => { if (x.id === pick.id) { x.category = 'X-ray'; x.stage_dunitech = 4; x.stage_next = 4; } }); return r; }; [ 'partners', 'pipeline_stages', 'companies' ].forEach((k) => W.dash.data(k)); /* the rows are live: changed once here */
      W.dash.setParams({ psort: 'score', ours: 'motion' }); await h.settle(); await wait(300); await h.settle(); W.__cm2x.powerQueue(); W.dash.setParams({ ours: 'dunitech' }); await h.settle(); await wait(300); await h.settle(); /* a fresh queue (it is remembered per brand) */
      W.dash.setParams({ psort: 'next' }); await h.settle(); await wait(300); W.dash.setParams({ psort: 'score' }); await h.settle(); await wait(300); await h.settle(); /* the list drawn again with the changed data */ C.drawPartners(); await h.settle(); await wait(200);
      const inQ = W.__cm2x.powerQueue().list.some((x) => x.id === pick.id); const inL = [ ...D.querySelectorAll('.cm-partner') ].some((r) => r.textContent.includes(String(pick.name).trim()));
      console.log('Dunitech — in Power hour:', inQ, '| in Best partners:', inL); if (inQ || inL) bad.push('x-ray shown for Dunitech');
      W.dash.setParams({ ours: 'next' }); await h.settle(); await wait(300); await h.settle(); const inN = W.__cm2x.powerQueue().list.some((x) => x.id === pick.id); console.log('Next — in Power hour:', inN); if (inN) bad.push('x-ray shown for Next');
      W.dash.setParams({ ours: 'all' }); await h.settle(); await wait(300); await h.settle(); const inA = W.__cm2x.powerQueue().list.some((x) => x.id === pick.id); console.log('All companies — in Power hour:', inA); if (!inA) bad.push('x-ray missing from All');
      W.dash.data = od; W.dash.setParams({ ours: 'dunitech', psort: 'next' }); await h.settle(); await wait(300); await h.settle(); }
    // (2) Power hour in the address bar
    const h0 = W.location.hash; D.querySelector('.cm-phbtn').click(); await h.settle(); for (let i = 0; i < 40 && D.querySelector('#cm-sheet .cm-phload'); i++) await h.settle(150); await wait(100);
    const cid1 = W.dash.params().cid; console.log('before:', h0, '| Power hour open:', W.location.hash, '| company', cid1); if (W.location.hash !== `#power/${encodeURIComponent(cid1)}`) bad.push('power hash');
    const nx = [ ...D.querySelectorAll('#cm-sheet button') ].find((b) => /^(Skip|Next)\b/.test(b.textContent.trim())); if (nx) { nx.click(); await h.settle(); for (let i = 0; i < 40 && D.querySelector('#cm-sheet .cm-phload'); i++) await h.settle(150); await wait(100); console.log('after', nx.textContent.trim().slice(0, 12), ':', W.location.hash); if (W.location.hash !== `#power/${encodeURIComponent(W.dash.params().cid)}` || W.dash.params().cid === cid1) bad.push('hash follows next'); }
    D.querySelector('#cm-sheet .sx').click(); await wait(700); await h.settle(); console.log('closed:', W.location.hash); if (/^#power/.test(W.location.hash)) bad.push('hash after close');
    W.cmOpenCompany(cid1); await h.settle(); const lk = h.calls.filter((c) => c[0] === 'link').pop(); console.log('company page link:', lk && lk[1]); if (!lk || lk[1] !== `company/${encodeURIComponent(cid1)}`) bad.push('company hash');
    // (3) pictures from other websites
    const of = W.fetch; const R0 = W.Response || globalThis.Response; const J = (o, s = 200) => new R0(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } }); const copies = [];
    W.fetch = async (u, o = {}) => { u = String(u); if (/^https:\/\/(pub|priv)\.example/.test(u)) throw new TypeError('Failed to fetch (CORS)'); if (/\/api\/files\?inline=1&copy=1/.test(u)) { const b = JSON.parse(o.body); copies.push(b.url); return /pub\.example/.test(b.url) ? J({ ok: true, key: '_img-abc-picture.gif' }) : J({ error: 'the link doesn’t give a picture — it is probably only visible when signed in to that Google account', code: 'private' }, 422); } return of(u, o); };
    const says = []; const os = C.say; C.say = (m, x) => { says.push(m); return os && os(m, x); };
    const E = W.__cm3.mlEditor({ body: '', html: 'Hello<br><img src="https://pub.example/claw.gif"><img src="https://priv.example/x?view=fimg">' }, ''); D.body.append(E.wrap); await wait(400);
    const ims = [ ...E.ed.querySelectorAll('img') ]; console.log('copied:', copies.length, '| srcs:', ims.map((i) => i.getAttribute('src')).join(' , '), '| red frame:', ims.map((i) => i.classList.contains('cm-mlbad')).join(','));
    if (ims[0].getAttribute('src') !== '/api/files/_img-abc-picture.gif' || ims[0].classList.contains('cm-mlbad') || !ims[1].classList.contains('cm-mlbad')) bad.push('copy pictures');
    const tw = (D.getElementById('cm-toast') || {}).textContent || ''; console.log('warning:', tw.slice(0, 140)); if (!/red frame/.test(tw)) bad.push('warning');
    const out = E.out(); console.log('goes out as:', out.inline.length, 'inline picture'); if (out.inline.length !== 1) bad.push('cid');
    C.say = os; W.fetch = of; bad.push(...h.errors.map((e) => 'err ' + String(e).slice(0, 160))); }
  // reopening the links
  { const h = run({ site: true, hash: '#company/', params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech' } }); await h.settle(); await wait(2500); await h.settle(); const W = h.w;
    const q = W.__cm2x.powerQueue().list; const id = (q[3] || q[0]).id; W.history.replaceState(null, '', `#company/${encodeURIComponent(id)}`); 
    const h2 = run({ site: true, hash: `#company/${encodeURIComponent(id)}`, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech' } }); await h2.settle(); await wait(3200); await h2.settle();
    console.log('opened #company link → view', h2.w.dash.params().view, '| company', h2.w.dash.params().cid === id); if (h2.w.dash.params().view !== 'company' || h2.w.dash.params().cid !== id) bad.push('company link');
    const h3 = run({ site: true, hash: `#power/${encodeURIComponent(id)}`, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech' } }); await h3.settle(); await wait(3500); await h3.settle(); for (let i = 0; i < 40 && h3.d.querySelector('#cm-sheet .cm-phload'); i++) await h3.settle(150);
    const sh = h3.d.getElementById('cm-sheet'); const who = (h3.d.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent || ''; const nm = (q.find((x) => x.id === id) || {}).name || '';
    console.log('opened #power link → Power hour open:', !sh.hidden, '| on', who, '| expected', nm, '| view still', h3.w.dash.params().view, '| hash', h3.w.location.hash); if (sh.hidden || !who.includes(String(nm).trim()) || h3.w.dash.params().view !== 'country') bad.push('power link'); }
  console.log(`errors ${bad.length}`, bad.join(', ')); process.exit(0); })();
