// 🏭 one manufacturer database (brand profiles + exhibitors + congress lists + NetHunt + big makers' branches): names joined, near-duplicates suggested, merge, profile page, intel
// · 🏫 Associations in their own card next to Congresses (with dates) · 🗺 trade-fair map with filters · 🏪 exhibitors → their manufacturer page
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const R = W.Response || globalThis.Response; const J = (o) => new R(JSON.stringify(o), { status: 200 });
  [ 'trade_exhibitors', 'congress_companies', 'company_index', 'competitor_footprint', 'brand_profiles', 'exhibitions', 'world_shapes' ].forEach((k) => W.dash.data(k)); await h.settle(); await wait(600);
  // names → one key
  [ [ 'Zimed Medikal San. Ve Tic. Ltd. Sti.', 'zimed' ], [ 'Normmed Medikal San. ve Tic. A.Ş.', 'normmed' ], [ 'Stryker Thailand Limited', 'stryker' ], [ 'Z Medical', 'z' ] ].forEach(([n, k]) => { const got = X.mfKey(n).key; console.log('key:', n, '→', got); got !== k && bad.push(`key ${n}`); });
  const Z = X.mfFind('Zimed'); console.log('Zimed:', Z && Z.names.join(' | '), '| NetHunt:', Z && Z.nh.map((x) => x.company).join(', '), '| fairs', Z && Z.fairs.length);
  if (!Z || X.mfFind('Zimed Medikal San. Ve Tic. Ltd. Sti.') !== Z || !Z.nh.length || !Z.fairs.length) bad.push('Zimed joined');
  const ZM = X.mfFind('Z Medical'); console.log('Z Medical separate:', ZM && ZM !== Z, '| suggested as same:', X.mfDupFor(Z).map((x) => `${x.o.name} (${x.why})`).join(', '));
  if (!ZM || ZM === Z || !X.mfDupFor(Z).some((x) => x.o === ZM)) bad.push('Z Medical suggested');
  if (ZM && ZM.names.length > 1) bad.push('Z Medical must not catch other “… Medical” names');
  const S = X.mfFind('Stryker'); const br = S && S.nh.filter((x) => !/usa/i.test(x.country || '')); console.log('Stryker branches in NetHunt:', br && br.map((x) => `${x.company} (${x.country})`).slice(0, 4).join(', ')); (!br || !br.length) && bad.push('branches');
  // merge Z Medical into Zimed → one page; shared in NetHunt (Medint Ignore, Kind = Brand)
  await X.mfMerge(Z, ZM); await wait(50); const sv = h.calls.filter((c) => c[0] === 'nh' && /create_record|update_record/.test(c[1]) && c[2].fields && c[2].fields.Kind === 'Brand').pop(); console.log('saved:', sv && sv[2].fields.Data);
  if (!sv || !/"mergedInto":"Zimed"/.test(sv[2].fields.Data)) bad.push('merge saved');
  const Z2 = X.mfFind('Z Medical'); console.log('after merge, Z Medical opens:', Z2 && Z2.name); (!Z2 || Z2.name !== 'Zimed') && bad.push('merged');
  // the manufacturer page (brand page + 🏭 profile)
  W.cmOpenBrand('Zimed'); await h.settle(); await wait(400); await h.settle(); const card = D.getElementById('brand-mf'); console.log('profile:', card && card.textContent.replace(/\s+/g, ' ').slice(0, 260));
  if (!card || !/Also known as/.test(card.textContent) || !/Trade fairs/.test(card.textContent) || !/Z Medical/.test(card.textContent)) bad.push('profile card');
  D.querySelector('#brand-view .cm-brprof') && bad.push('old brand form still there');
  // 📌 intel: link → page read → AI → kept on the brand and on its NetHunt record
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/pageinfo')) return J({ url: 'https://zimed.com/catalog', title: 'Zimed Catalogue', text: 'Locking plates, intramedullary nails, external fixators. CE certified.' }); if (u.startsWith('/api/summarize')) return J({ text: '{"category":"product","title":"Zimed 2026 catalogue","summary":"Locking plates, nails and external fixators, CE marked.","use":"Compare with Dunitech nails before pricing."}' }); return of(u, o); };
  const ta = card.querySelector('.cm-mfintel textarea'); ta.value = 'https://zimed.com/catalog new catalogue'; ta.dispatchEvent(new W.Event('input')); [ ...card.querySelectorAll('.cm-mfintel button') ].find((b) => /Add/.test(b.textContent)).click(); await wait(400); await h.settle(); await wait(100); await h.settle();
  const sv2 = h.calls.filter((c) => c[0] === 'nh' && c[2] && c[2].fields && c[2].fields.Kind === 'Brand').pop(); console.log('intel saved:', sv2 && /Zimed 2026 catalogue/.test(sv2[2].fields.Data)); (!sv2 || !/"intel":\[\{/.test(sv2[2].fields.Data)) && bad.push('intel saved');
  const cm = h.calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record_comment').pop(); console.log('NetHunt comment on their record:', cm && cm[2].text.split('\n')[0]); (!cm || !/Zimed 2026 catalogue/.test(cm[2].text)) && bad.push('intel on NetHunt');
  await h.settle(); const card2 = D.getElementById('brand-mf'); console.log('intel shown:', /Zimed 2026 catalogue/.test(card2.textContent)); /Zimed 2026 catalogue/.test(card2.textContent) || bad.push('intel shown'); W.fetch = of;
  // 🏭 Manufacturers list
  X.openMakers(D.body); await h.settle(); const sh = D.getElementById('cm-sheet'); const rows = sh.querySelectorAll('.cm-mfrow').length; console.log('Manufacturers:', D.getElementById('cm-sheet-title').textContent, '| rows', rows, '|', sh.querySelector('.cm-cgtabs').textContent); rows || bad.push('list');
  X.MFS.tab = 'dup'; C.sheetDraw(); await h.settle(); console.log('duplicates tab rows:', sh.querySelectorAll('.cm-mfdup').length); X.MFS.tab = 'all'; C.closeSheet();
  // 🏫 Associations card next to Congresses
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'overview' }); await h.settle(); await wait(500); await h.settle(); const as = D.getElementById('ctry-assoc'); const cg = D.getElementById('congress');
  console.log('associations card:', as && as.textContent.replace(/\s+/g, ' ').slice(0, 160), '| right after Congresses:', as && cg && cg.nextElementSibling === as, '| date pills:', as && as.querySelectorAll('.when').length);
  if (!as || cg.nextElementSibling !== as || !as.querySelector('.when') || cg.querySelector('.cm-assoc')) bad.push('associations card');
  // 🗺 trade fairs: map + filters
  W.dash.setParams({ view: 'congresses' }); await h.settle(); await wait(300); W.cmCongressTab && W.cmCongressTab('fairs'); await h.settle(); await wait(300); await h.settle();
  const mp = D.querySelector('#congress-view .cm-fxmap'); const sels = [ ...D.querySelectorAll('#congress-view .cm-cgfl select') ].map((x) => x.options[x.selectedIndex].text); console.log('fairs map:', !!mp, '| dots:', mp && mp.querySelectorAll('circle').length, '| filters:', sels.join(' | '));
  const wsOk = W.dash.data('world_shapes').status === 'ok'; if ((wsOk && (!mp || !mp.querySelector('circle'))) || !sels.some((t) => /Sort/.test(t)) || !sels.some((t) => /Upcoming/.test(t))) bad.push('fairs map / filters'); wsOk || console.log('(no world map data in the test harness — the map is checked in the browser)');
  const cs = mp && [ ...mp.querySelectorAll('path.has') ][0]; if (cs) { cs.dispatchEvent(new W.MouseEvent('click', { bubbles: true })); await h.settle(); const chip = [ ...D.querySelectorAll('#congress-view .cm-cgfl .cm-chip') ].find((b) => /✕/.test(b.textContent)); console.log('tap a country → filter:', chip && chip.textContent); chip || bad.push('country filter'); }
  W.cmCongressTab && W.cmCongressTab('exh'); await h.settle(); await wait(300); const ml = D.querySelectorAll('#congress-view .cm-mflink').length; console.log('exhibitor rows → manufacturer page:', ml); ml || bad.push('exhibitor link');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join('\n')); process.exit(0); })();
