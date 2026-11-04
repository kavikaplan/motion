// 📌 What we know about a country: paste a link / note → page read → AI sorts → saved as a comment on the NetHunt Countries record → shown on the Overview (tender portals also under tenders)
// · Power hour people: ✎ edits a person inline, Power hour stays open
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  // parsing what Medint writes
  const p1 = X.cnParse({ id: 'e1', text: '📌 Tender portal · LicitaLab — https://www.licitalab.cl/<br>Summary: Search engine for Chilean public tenders.<br>How we use it: Find hospitals buying trauma implants.<br>Access: paid<br>Added by: Kavi via Medint', timeISO: '2026-10-27T10:00:00Z' });
  console.log('parsed:', JSON.stringify(p1)); if (p1.cat !== 'tender' || p1.url !== 'https://www.licitalab.cl/' || !/Chilean public tenders/.test(p1.summary) || p1.access !== 'paid') bad.push('parse');
  const p2 = X.cnParse({ id: 'e2', text: 'MOH changed the registration rules in 2026', creator: { name: 'Luz' } }); console.log('plain:', p2.cat, p2.title, p2.by); if (p2.cat !== 'note' || p2.by !== 'Luz') bad.push('plain comment');
  // add one on Chile's Overview
  let ask = ''; const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u);
    if (u.startsWith('/api/pageinfo')) return J({ url: 'https://www.licitalab.cl/', title: 'LicitaLab | Licitaciones Chile', description: 'Encuentra licitaciones públicas', text: 'LicitaLab te ayuda a encontrar licitaciones de Mercado Público...' });
    if (u.startsWith('/api/summarize')) { ask = JSON.stringify(JSON.parse(o.body || '{}')); return J({ text: '{"category":"tender","title":"LicitaLab","summary":"A search tool for Chilean public tenders (Mercado Público).","use":"Find hospitals tendering for trauma implants and the companies that win.","access":"paid"}' }); }
    return of(u, o); };
  W.dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'overview' }); await h.settle(); await wait(1200); await h.settle();
  let card = D.querySelector('#ctry-notes'); console.log('card:', card && card.querySelector('h2').textContent); if (!card) bad.push('card');
  const ta = card.querySelector('textarea'); ta.value = 'https://www.licitalab.cl/ locals use it to find tenders'; ta.dispatchEvent(new W.Event('input')); [...card.querySelectorAll('button')].find((b) => /Add/.test(b.textContent)).click(); await wait(800); await h.settle();
  const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment' && c[2].folderId === '673c960008039266ccd2ead3').pop(); console.log('NetHunt comment:', cm && JSON.stringify(cm[2].text));
  if (!cm || !/^📌 Tender portal · LicitaLab — https:\/\/www\.licitalab\.cl/.test(cm[2].text) || !/Our note: locals use it to find tenders/.test(cm[2].text)) bad.push('saved to NetHunt');
  console.log('AI saw the page:', /Mercado Público/.test(ask)); /Mercado P/.test(ask) || bad.push('page read');
  card = D.querySelector('#ctry-notes'); console.log('shown:', card.textContent.replace(/\s+/g, ' ').slice(0, 260)); if (!/LicitaLab/.test(card.textContent) || !/Tender portal/.test(card.textContent)) bad.push('shown');
  for (let i = 0; i < 20 && !D.querySelector('.cm-tportals .cm-myportal'); i++) { await new Promise((r) => setTimeout(r, 150)); await h.settle(); }
  const tp = D.querySelector('.cm-tportals .cm-myportal'); console.log('in tender portals:', tp && tp.textContent); tp || bad.push('tender portals');
  W.fetch = of;
  // ✎ person inline in Power hour
  W.dash.setParams({ view: 'country', iso: 'CO', tags: ['colombia'], ctab: 'companies', csub: 'partners' }); await h.settle(); await wait(400); W.__cm2.openPowerHour(D.body); await wait(1500); await h.settle();
  const pe = D.querySelector('#cm-sheet .cm-phppl .cm-pedit'); console.log('✎ in Power hour people:', !!pe, pe && pe.parentElement.className);
  if (pe) { pe.click(); await h.settle(); const il = D.querySelector('#cm-sheet .cm-pinline'); console.log('inline form:', !!il, '| Power hour still open:', /⚡/.test(D.getElementById('cm-sheet-title').textContent)); if (!il || !/⚡/.test(D.getElementById('cm-sheet-title').textContent)) bad.push('inline edit');
    if (il) { const inp = il.querySelectorAll('input, textarea'); const t = [...inp].find((x) => /Gerente|title/i.test(x.placeholder || '')); t && (t.value = 'Gerente de compras', t.dispatchEvent(new W.Event('input'))); [...il.querySelectorAll('button')].find((b) => /Save/.test(b.textContent)).click(); await wait(300); await h.settle();
      const up = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record' && c[2].folderId === '6682e9b8b6386800f586c0b0').pop(); console.log('saved person:', up && JSON.stringify(up[2].fields)); if (!up || up[2].fields.Title !== 'Gerente de compras') bad.push('person saved'); console.log('form closed, Power hour open:', !D.querySelector('#cm-sheet .cm-pinline'), /⚡/.test(D.getElementById('cm-sheet-title').textContent)); } }
  else console.log('(no people loaded in this test data — inline edit not checked)');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
