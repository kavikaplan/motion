// Power hour for several countries (a region): each company keeps its own country (flag, local time, weather, grouping) — not the first
// country of the selection · Power hour no longer waits for the 🧠 summary or the chats: the company shows at once and they fill in inside it
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home', ours: 'dunitech' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = []; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  W.dash.setParams({ view: 'country', iso: 'CL', isos: [ 'CL', 'PE', 'AR' ], tags: [ 'chile', 'peru', 'argentina' ], ctab: 'companies', csub: 'partners', psort: 'next' }); await h.settle(); await wait(800); await h.settle();
  const q = W.__cm2x.powerQueue().list; const isos = q.map((x) => x.iso); console.log('countries in the session:', isos.join(' '));
  if (new Set(isos).size < 2) bad.push('every company got the same country');
  const wrong = q.filter((x) => { const c = C.companyById(x.id) || {}; const L = String(c.country || '').split(' | ').map((n) => C.isoOfCountry(n)).filter(Boolean); return L.length && !L.includes(x.iso); }); console.log('companies shown in a country they are not in:', wrong.length); if (wrong.length) bad.push('wrong country');
  const seen = new Set(); let grouped = true; isos.forEach((c, k) => { if (k && c !== isos[k - 1] && seen.has(c)) grouped = false; seen.add(c); }); if (!grouped) bad.push('not grouped');
  // loading card waits for the 🧠 summary
  let busy = true; const ob = X.brainBusy, op = X.brainPrefetch; let started = 0; X.brainBusy = () => busy; X.brainPrefetch = () => { started++; };
  D.querySelector('.cm-phbtn').click(); await wait(500); await h.settle(); await wait(400);
  for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150);
  const sk = D.querySelector('#cm-sheet .cm-phload'); console.log('while the summary is written — loading card:', !!sk, '| company shown:', !!D.querySelector('#cm-sheet .cm-phwho'), '| summaries started (this one + the next):', started);
  if (sk || !D.querySelector('#cm-sheet .cm-phwho') || started < 2) bad.push('opens without waiting for the summary');
  const ttlIso = (D.querySelector('#cm-sheet .cm-phload b') || {}).textContent || ''; console.log('loading card company:', ttlIso);
  busy = false; await wait(500); await h.settle(); const title = D.getElementById('cm-sheet-title'); const ctry = (title.querySelector('.cm-phctry') || {}).textContent || '';
  console.log('then:', !!D.querySelector('#cm-sheet .cm-phwho'), '| title country:', ctry, '| company:', (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent);
  if (!D.querySelector('#cm-sheet .cm-phwho')) bad.push('company after summary');
  const first = q[0]; const want = (C.countryOfIso(first.iso) || {}).country; if (want && ctry && !ctry.includes(want)) bad.push('title country');
  X.brainBusy = ob; X.brainPrefetch = op;
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
