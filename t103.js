// 🏭 manufacturer branches: names / email domains of the big makers, lead label, NetHunt review list and marking
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); const X = h.w.__cm3; const bad = [];
  const yes = [['STRYKER CORPORATION CHILE Y COMPANIA LIMITADA', 'Stryker'], ['JOHNSON Y JOHNSON DE CHILE S A', 'Johnson'], ['BIOMET CHILE S A', 'Zimmer'], ['ООО "СМИТ ЭНД НЕФЬЮ"', 'Smith'], ['AUXEIN MEXICO SA DE CV', 'Auxein'], ['GPC MEDICAL COLOMBIA SAS', 'GPC'], ['Narang Medical Ltd.', 'Narang'], ['DRAEGER D.O.O.', 'Dräger']];
  const no = ['Juan Zimmer', 'Maria Janssen', 'LINK MEDICAL SPA', 'GLOBALMED SpA', 'Narang Traders', 'Lima Medical SAC'];
  yes.forEach(([n, g]) => { const o = X.oemOf(n); if (!o || !o.g.includes(g)) bad.push(`missed ${n}`); }); no.forEach((n) => { const o = X.oemOf(n); if (o) bad.push(`false: ${n} → ${o.g}`); });
  const d = X.oemOf('Ortho Distribuidora', ['ventas@cl.stryker.com']); if (!d || d.how !== 'domain') bad.push('email domain not seen');
  const r = X.qlRules({ name: 'ARTHREX CHILE SPA', tender: { niche: 'Sports Med' } }); if (r[0] !== 'branch') bad.push(`lead label ${r[0]}`);
  const r2 = X.qlRules({ name: 'Ortopedia Andina SAC', sup: { email: 'compras@its.jnj.com', seg: 'Orthopedics', cat: 'Trauma' } }); if (r2[0] !== 'branch') bad.push(`lead by email ${r2[0]}`);
  console.log('matching:', bad.length ? bad.join(' | ') : 'all correct');
  h.w.dash.data('company_index'); h.w.dash.data('pipeline_stages'); await h.settle(); await new Promise((r0) => setTimeout(r0, 800)); const L = X.oemScan() || []; console.log('NetHunt companies to mark:', L.length, '| sure:', L.filter((x) => x.sure).length);
  X.openOemReview(h.d.body); await h.settle(); const S = h.d.getElementById('cm-sheet'); const mb = S && [...S.querySelectorAll('button')].find((b) => /^🏭 Mark$/.test(b.textContent.trim())); console.log('review rows:', S ? S.querySelectorAll('.cm-rnrow').length : 0);
  if (mb) { mb.click(); await new Promise((r0) => setTimeout(r0, 400)); await h.settle(); const up = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record').pop(); const f = up && up[2].fields || {}; console.log('marked with:', JSON.stringify(f)); if (f.Status !== 'Manufacture Branch' || f['NEXT Status'] !== 'Manufacturing Branch') bad.push('mark fields'); } else if (L.length) bad.push('no Mark button');
  // automatic daily marking: only sure + early ones, max 30
  h.w.performance.now = () => 1e6; h.w.__cm.uiFlags = { ...(h.w.__cm.uiFlags || {}), oemAt: '' }; const n0 = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record').length;
  await h.w.__cm3.oemAuto(); await new Promise((r0) => setTimeout(r0, 500)); const n1 = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'update_record').length; console.log('auto-marked:', n1 - n0, '| toast:', (h.d.querySelector('.cm-toast') || {}).textContent);
  if (n1 - n0 < 1 || n1 - n0 > 30) bad.push(`auto ${n1 - n0}`);
  console.log(`errors ${h.errors.length + bad.length}`); process.exit(0); })();
