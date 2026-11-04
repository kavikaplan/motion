// 🔎 one Find contacts panel (Power hour, company page, Enrich queue): ① know ② website ③ people ④ check emails ⑤ by hand
// · Home: 🏛 Coming exhibitions; 📦 importers + 🌍 momentum on the Markets page · company page tabs: 🏢 Main / 📊 Market
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  // Home cards
  await wait(400); W.__cm2.drawHome && W.__cm2.drawHome(); await h.settle(); const h2 = [...D.querySelectorAll('#home-view .cm-hmcard h2')].map((x) => x.textContent); console.log('home:', h2.join(' | '));
  if (!h2.some((t) => /Coming exhibitions/.test(t)) || !h2.some((t) => /Coming congresses/.test(t)) || h2.some((t) => /Big importers|Markets by momentum/.test(t))) bad.push('home cards');
  const exRows = [...D.querySelectorAll('#home-view .cm-hmcard')].find((c) => /Coming exhibitions/.test(c.textContent)); console.log('exhibitions card:', exRows && exRows.textContent.replace(/\s+/g, ' ').slice(0, 160));
  // Markets page
  W.dash.setParams({ view: 'markets' }); await h.settle(); await wait(600); await h.settle(); const mk = D.querySelector('#markets-view .cm-mkx'); console.log('markets extra:', mk && [...mk.querySelectorAll('h2')].map((x) => x.textContent).join(' | ')); if (!mk || !/Big importers/.test(mk.textContent) || !/Markets by momentum/.test(mk.textContent)) bad.push('markets cards');
  // 🔎 Find contacts panel on its own
  const co = C.rowsOf('companies').find((c) => c.iso && c.company) || { id: '6a8888888888888888888888', company: 'FC Co', iso: 'CO' };
  let verify = 0; const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/leads') && (o.method || 'GET') === 'POST') { verify++; const b = JSON.parse(o.body || '{}'); return J({ results: (b.emails || []).map((em) => ({ email: em, state: 'risky' })) }); } if (u.startsWith('/api/leads')) return J({ people: [ { name: 'Ana Ruiz', title: 'Gerente General', email: 'ana@fc-test.co' } ], emails: [ { source: 'Snov', email: 'ventas@fc-test.co' } ] }); return of(u, o); };
  const F = new Map([ [ 'Name', co.company ], [ 'Website', 'https://fc-test.co' ], [ 'Email', 'info@fc-test.co' ] ]); const P = X.findContacts(co.id, co.company, F, { iso: co.iso }); D.body.append(P); await wait(600); await h.settle();
  const steps = [...P.querySelectorAll('.cm-fch')].map((x) => x.textContent); console.log('steps:', steps.join(' | ')); if (steps.length !== 5) bad.push('5 steps');
  console.log('people step:', P.querySelector('.cm-fcs.ppl').textContent.replace(/\s+/g, ' ').slice(0, 140)); if (!/Ana Ruiz/.test(P.textContent)) bad.push('people found');
  const mb = [...P.querySelectorAll('.cm-fcs.mail button')].find((b) => /Check/.test(b.textContent)); console.log('mail step:', P.querySelector('.cm-fcs.mail').textContent.replace(/\s+/g, ' ').slice(0, 160)); if (!mb) bad.push('check button'); else { mb.click(); await wait(300); console.log('after check:', P.querySelector('.cm-fcs.mail').textContent.replace(/\s+/g, ' ').slice(0, 160), '| verify calls', verify); if (!/risky/.test(P.querySelector('.cm-fcs.mail').textContent)) bad.push('emails checked'); }
  P.remove(); W.fetch = of;
  // Power hour: 🔎 Find contacts opens the same panel
  W.dash.setParams({ view: 'country', iso: 'CO', tags: ['colombia'], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(400); W.__cm2.openPowerHour(D.body); await wait(1000); await h.settle();
  const am = D.querySelector('#cm-sheet .cm-addmiss'); console.log('PH button:', am && am.textContent); if (!am || !/Find contacts/.test(am.textContent)) bad.push('PH button'); else { am.click(); await h.settle(); const fc = D.querySelector('.cm-fcside .cm-fc'); console.log('PH panel steps:', fc && fc.querySelectorAll('.cm-fch').length); if (!fc) bad.push('PH panel'); }
  C.closeSheet();
  // company tabs
  W.dash.setParams({ view: 'company', cid: co.id, iso: co.iso }); await h.settle(); await wait(800); await h.settle(); const v = D.getElementById('company-view'); const tb = v.querySelector('.cm-cotabs'); console.log('tabs:', tb && tb.textContent, '| state:', v.dataset.cotab);
  if (!tb || v.dataset.cotab !== 'main') bad.push('tabs'); else { const tr = v.querySelector('#company-trade'); const ppl = v.querySelector('#company-people'); console.log('trade is market:', tr && tr.classList.contains('cm-mkt'), '| people is main:', ppl && !ppl.classList.contains('cm-mkt'));
    if (!tr || !tr.classList.contains('cm-mkt') || !ppl || ppl.classList.contains('cm-mkt')) bad.push('tab sections');
    tb.querySelector('[data-cotab="market"]').click(); await h.settle(); console.log('after tap:', v.dataset.cotab); v.dataset.cotab !== 'market' && bad.push('switch'); }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
