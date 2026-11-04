// Med_intv V3: Power hour ← back to the previous company and ↩ back to the ones not worked · the country with its flag next to the weather
// · several countries: one country at a time (replies stay on top) · Next (light red) + Dunitech (light yellow) status side by side, for everyone
// (the server no longer hides the status / category choices from a Person) · sort by status in Kavi's order
const P = require('path');
(async () => { const bad = [];
  // server: a Person can read the Companies folder's field list (the status & category choices), still not other people's companies
  const NH = await import(P.join(__dirname, '../functions/api/nethunt.js'));
  const folder = { id: '6682e9b8b6386800f586c0b2', name: 'Companies', fields: [ { name: 'Status', presets: [ 'Lead', 'Contacted' ] } ] };
  const out = NH.filterContent([ { type: 'text', text: JSON.stringify(folder) } ], '6682e9b8b6386800f586c0b2', new Set([ 'c1' ]), { name: 'Yaman' }, 'team@kavikaplan.com');
  const rec = NH.filterContent([ { type: 'text', text: JSON.stringify({ id: 'c9', fields: { Name: 'Not his' } }) } ], '6682e9b8b6386800f586c0b2', new Set([ 'c1' ]), { name: 'Yaman' }, 'team@kavikaplan.com');
  console.log('Person reads field list:', JSON.parse(out[0].text).fields ? 'yes' : 'NO', '| someone else’s company:', JSON.parse(rec[0].text).error || 'shown');
  if (!JSON.parse(out[0].text).fields || !JSON.parse(rec[0].text).error) bad.push('server field list');
  const { run } = require('./harness'); const h = run({ site: true, params: { view: 'home', ours: 'dunitech' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d, C = W.__cm; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // status order
  const L = [ 'Unprocessed', 'Lost', 'Contacted', 'Negotiating', 'Registration', 'Interested', 'Follow Up', 'Meeting', 'Enriched Leads', 'Nurturing', 'Distributor', '' ].sort((a, b) => W.cmStatusRank(a) - W.cmStatusRank(b));
  console.log('status order:', L.join(' > ')); if (L.join('|') !== 'Registration|Negotiating|Follow Up|Meeting|Interested|Contacted|Enriched Leads|Nurturing|Distributor|Lost|Unprocessed|') bad.push('status order');
  // Power hour in a country
  W.dash.setParams({ view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', psort: 'next' }); await h.settle(); await wait(300); await h.settle();
  D.querySelector('.cm-phbtn').click(); await h.settle(); await wait(400); await h.settle();
  const ttl = () => D.getElementById('cm-sheet-title').textContent; const who = () => (D.querySelector('#cm-sheet .cm-phwho .cm-co') || {}).textContent;
  console.log('title:', ttl().slice(0, 120), '| no back on the first:', !D.querySelector('#cm-sheet .cm-phprev'));
  if (!/Chile/.test((D.querySelector('#cm-sheet-title .cm-phctry') || {}).textContent || '')) bad.push('country in title'); if (D.querySelector('#cm-sheet .cm-phprev')) bad.push('back on first');
  const sts = [ ...D.querySelectorAll('#cm-sheet select.cm-phstat-nm') ].map((s) => s.className); console.log('status menus:', sts.join(' | ')); if (!sts.some((c) => /cm-phst-next/.test(c)) || !sts.some((c) => /cm-phst-dunitech/.test(c))) bad.push('both statuses');
  const first = who(); [ ...D.querySelectorAll('#cm-sheet button') ].find((b) => b.textContent === 'Skip').click(); await wait(150); await h.settle(); await wait(400); await h.settle(); const second = who();
  const pb = D.querySelector('#cm-sheet .cm-phprev'); console.log('after Skip:', first, '→', second, '| back button:', pb && pb.textContent); if (!pb) bad.push('back button'); else { pb.click(); await h.settle(); await wait(300); await h.settle(); console.log('← back to:', who()); if (who() !== first) bad.push('back goes to previous'); }
  C.closeSheet();
  // several countries: grouped one country at a time (replies on top)
  W.dash.setParams({ view: 'home' }); await h.settle(); await wait(300); const q = W.__cm2x.powerQueue().list; const iso = (x) => x.iso || (C.companyById(x.id) || {}).iso || '?'; const rest = q.filter((x) => x.t !== 0).map(iso);
  const seen = new Set(); let ok = true; rest.forEach((c, k) => { if (k && c !== rest[k - 1] && seen.has(c)) ok = false; seen.add(c); });
  console.log('home Power hour countries in order:', rest.join(' '), '| grouped:', ok); if (!ok) bad.push('grouped by country');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
