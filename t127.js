// 👯 merge: groups (3 copies = one group), “Merge all”, no empty phone/email lists sent to NetHunt (the old error) · 🎯 partner score editable (shared, NetHunt comment, Power hour mini chip)
// · 🌤 weather next to the company name · company page: brands on Main, Pipeline under People · ▾ fold any card, remembered per user
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  // ---- merge
  const ppl = [ { id: 'p1', name: 'Ana Ruiz', email: 'ana@x.co', title: 'Gerente', last_interaction: 1 }, { id: 'p2', name: 'Ana Ruiz' }, { id: 'p3', name: 'Ana Maria Ruiz', phone: '+57 300 1234567' }, { id: 'p4', name: 'Bob Lee' }, { id: 'p5', name: 'Bob Lee' }, { id: 'p6', name: 'Carla Diaz' } ];
  const G = X.dupGroups(ppl); console.log('groups:', G.map((g) => g.map((p) => p.id).join('+')).join(' | ')); if (G.length !== 2 || G[0].length !== 3 || G[0][0].id !== 'p1') bad.push('groups');
  const REC = { p1: { Name: 'Ana Ruiz', Email: [ 'ana@x.co' ], Title: 'Gerente' }, p2: { Name: 'Ana Ruiz' }, p3: { Name: 'Ana Maria Ruiz', Email: [ 'ANA@x.co' ], 'Phone number': [ '+57 300 1234567' ], LinkedIn: 'https://linkedin.com/in/ana', Notes: 'met at FIME' }, p4: { Name: 'Bob Lee' }, p5: { Name: 'Bob Lee' } };
  const MC = await W.claude.use('mcp'); const ct0 = MC.callTool; const ups = []; const txt = (o) => ({ content: [ { type: 'text', text: JSON.stringify(o) } ] }); MC.callTool = async (srv, tool, args) => { if (tool === 'get_record' && REC[args.recordId]) return txt({ id: args.recordId, fields: REC[args.recordId] }); if (tool === 'update_record' && REC[args.recordId]) { ups.push(args); const bad0 = Object.entries(args.fields).find(([, v]) => Array.isArray(v) && !v.length); if (bad0) return { isError: true, content: [ { type: 'text', text: `empty ${bad0[0]}` } ] }; return txt({ id: args.recordId }); } return ct0(srv, tool, args); };
  const ban = X.dupGroups && (() => { const host = D.createElement('div'); D.body.append(host); return host; })();
  const ok = await X.mergeAll(G, 'co1', null); console.log('merge all ok:', ok, '| updates:', ups.map((u) => `${u.recordId}:${Object.keys(u.fields).join('/')}`).join(' '));
  if (!ok) bad.push('merge all failed');
  const k1 = ups.find((u) => u.recordId === 'p1'); if (!k1 || !k1.fields['Phone number'] || k1.fields['Phone number'].length !== 1 || k1.fields.Email || k1.fields.LinkedIn !== 'https://linkedin.com/in/ana' || !/met at FIME/.test(k1.fields.Notes || '')) bad.push('keep combined');
  if (ups.some((u) => u.recordId === 'p4')) bad.push('nothing to add to Bob → no update');
  if (![ 'p2', 'p3', 'p5' ].every((id) => ups.some((u) => u.recordId === id && (u.fields.Label || []).includes('Merged duplicate')))) bad.push('others labelled');
  console.log('hidden at once:', [ ...X.MERGED ].join(','), '| groups now:', X.dupGroups(ppl).length); X.dupGroups(ppl).length && bad.push('merged hidden');
  MC.callTool = ct0; ban && ban.remove();
  // ---- score
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(300); await h.settle();
  const P = C.rowsOf('partners'); const r0 = P.find((r) => (r.score_all ?? null) != null && r.id) || P[0]; const p = (() => { const k = C.oursKey(); return C.OURS[k] && C.OURS[k].all ? 'all' : k; })(); const s0 = r0 && r0[`score_${p}`]; console.log('partner:', r0 && r0.company, '| brand key', p, '| score', s0);
  if (r0) { const nv = s0 === 77 ? 78 : 77; X.SCO.set(`${r0.id}|${p}`, { cid: r0.id, p, v: nv, was: s0, why: 'test', by: 'Kavi', at: Date.now() }); X.scoApply(); console.log('after edit:', r0[`score_${p}`], '| mini:', X.scoMini(r0.id).textContent); if (r0[`score_${p}`] !== nv || !/77|78/.test(X.scoMini(r0.id).textContent)) bad.push('override applied');
    const ss = X.scoOf(r0.id); if (!ss.ed || ss.orig !== s0) bad.push('original kept');
    X.SCO.set(`${r0.id}|${p}`, { ...X.SCO.get(`${r0.id}|${p}`), off: 1 }); X.scoApply(); console.log('after reset:', r0[`score_${p}`]); r0[`score_${p}`] !== s0 && bad.push('reset');
    // the editor: Save writes the shared store and a NetHunt comment
    const a = D.createElement('button'); D.body.append(a); X.scoEdit(a, r0.id); const pan = D.querySelector('.cm-scpan'); console.log('editor:', pan && pan.textContent.replace(/\s+/g, ' ').slice(0, 90)); if (!pan) bad.push('editor');
    else { const tp = [ ...pan.querySelectorAll('.cm-scpart') ].find((x) => /Tenders/.test(x.textContent)); [ ...tp.querySelectorAll('.cm-chip') ].find((b) => /Big tender winner/.test(b.textContent)).click(); const want = Number(pan.querySelector('.cm-sctot').textContent); pan.querySelector('.cm-scwhy').value = 'sells spine only'; [ ...pan.querySelectorAll('button') ].find((b) => b.textContent === 'Save').click(); await wait(100);
      const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment' && c[2].recordId === r0.id).pop(); console.log('NetHunt comment:', cm && cm[2].text); if (!cm || !new RegExp(`set to ${want}`).test(cm[2].text) || !/spine only/.test(cm[2].text) || !/Big tender winner/.test(cm[2].text)) bad.push('comment'); r0[`score_${p}`] !== want && bad.push('saved value'); }
    a.remove();
    // Power hour: 🎯 next to the weather in the title
    W.__cm2.openPowerHour(D.body, r0.id); await wait(1200); await h.settle(); const ttl = D.getElementById('cm-sheet-title'); for (let k = 0; k < 30 && !ttl.querySelector('.cm-scmini'); k++) await wait(100); const mini = ttl.querySelector('.cm-scmini'); console.log('PH title:', ttl.textContent.replace(/\s+/g, ' ').slice(0, 120), '| mini:', mini && mini.textContent);
    if (/^⚡/.test(ttl.textContent) && D.querySelectorAll('#cm-sheet .cm-phwho').length === 1 && D.querySelector('#cm-sheet .cm-phwho .cm-co').dataset.openCompany === r0.id && !mini) bad.push('PH mini score');
    if (mini) { mini.click(); await h.settle(); const pn = D.querySelector('#cm-sheet .cm-scpan'); console.log('PH editor inline, PH open:', !!pn, /⚡/.test(D.getElementById('cm-sheet-title').textContent)); pn || bad.push('PH editor'); }
    C.closeSheet(); X.SCO.set(`${r0.id}|${p}`, { ...X.SCO.get(`${r0.id}|${p}`), off: 1 }); X.scoApply(); }
  else bad.push('no partners');
  // ---- company page: weather, tabs layout, fold
  const of = W.fetch; let wx = 0; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/weather')) { wx++; return J({ icon: '☀️', temp: 21, feels: 20, text: 'Clear', wind: 8, place: 'Santiago', source: 'Open-Meteo', time: new Date().toISOString() }); } return of(u, o); };
  const co = C.rowsOf('company_index').find((c) => c.country === 'Chile' && c.city) || C.rowsOf('company_index').find((c) => c.country === 'Chile');
  W.cmCompanyIso = 'CL'; W.dash.setParams({ view: 'company', cid: co.id, iso: 'CL' }); await h.settle(); await wait(600); await h.settle(); await wait(100);
  const w0 = D.querySelector('#company-view .cm-cnamerow .cm-wx'); console.log('weather by the name:', w0 && w0.textContent, '| fetches', wx); if (!w0 || !/21°/.test(w0.textContent)) bad.push('company weather');
  const v = D.getElementById('company-view'); const br = v.querySelector('#company-brands'); const pl = v.querySelector('#company-pipeline'); console.log('brands on Main:', br && !br.classList.contains('cm-mkt'), '| pipeline in left column:', pl && pl.parentElement.classList.contains('cm-stack'));
  if (!br || br.classList.contains('cm-mkt') || !pl || !pl.parentElement.classList.contains('cm-stack')) bad.push('company layout');
  const pc = v.querySelector('#company-people'); const fb = pc && pc.querySelector('.cm-fold'); console.log('fold button on People:', !!fb); if (!fb) bad.push('fold button'); else { fb.click(); await h.settle(); console.log('folded:', pc.classList.contains('cm-folded'), '| saved:', JSON.stringify([ ...X.FOLD ].find(([k]) => /#company-people/.test(k))));
    if (!pc.classList.contains('cm-folded')) bad.push('folds'); pc.classList.remove('cm-folded'); X.foldWatch(); pc.classList.contains('cm-folded') || bad.push('stays folded'); fb.click(); pc.classList.contains('cm-folded') && bad.push('unfold'); }
  W.dash.setParams({ view: 'home' }); await h.settle(); await wait(300); W.__cm2.drawHome && W.__cm2.drawHome(); await h.settle(); X.foldWatch(); const hc = D.querySelectorAll('#home-view .cm-hmcard .cm-fold').length; console.log('home cards with ▾:', hc); hc || bad.push('home fold');
  W.fetch = of;
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
