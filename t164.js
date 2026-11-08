// Best partners sorted by Status: Kavi's order decides (Customer, Registration, Promising, Negotiating, Follow up, Awaiting, Meeting,
// Interested, Replied, Contacted, Drips, Enriched, Lead, To be qualified …) however hot the others are; manufacturers below Interested go
// down; No info / Not a fit / no status at the bottom · House: 🔴 hide the countries where Next already has a distributor
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'all', psort: 'status' } }); await h.settle(); await wait(2000); await h.settle(); const W = h.w, D = h.d;
  const R = W.cmStatusRankCo; const co = (category) => ({ category });
  const L = [ [ 'Not a fit', '' ], [ '', '' ], [ 'No info', '' ], [ 'Contacted', 'Manufacturer' ], [ 'Meeting', 'Manufacturer' ], [ 'To be qualified', '' ], [ 'Enriched Leads', '' ], [ 'Drip1', '' ], [ 'Contacted', '' ], [ 'Replied', '' ], [ 'Interested', '' ], [ 'Meeting', '' ], [ 'Awaiting response', '' ], [ 'Follow up', '' ], [ 'Negotiating', '' ], [ 'Promising', '' ], [ 'Customer', '' ], [ 'Lead', '' ], [ 'Some new status', '' ] ]
    .sort((a, b) => R(co(a[1]), a[0]) - R(co(b[1]), b[0])).map(([s, c]) => `${s || '(none)'}${c ? ' [maker]' : ''}`);
  console.log('order:', L.join(' > '));
  const want = 'Customer > Negotiating > Promising > Follow up > Awaiting response > Meeting [maker] > Meeting > Interested > Replied > Contacted > Drip1 > Enriched Leads > Lead > To be qualified > Some new status > Contacted [maker] > No info > Not a fit > (none)';
  if (L.join(' > ').replace('Meeting [maker] > Meeting', 'Meeting > Meeting [maker]') !== want.replace('Meeting [maker] > Meeting', 'Meeting > Meeting [maker]')) bad.push('order');
  // the list on the page follows the status order
  const rows = [ ...D.querySelectorAll('.cm-partner') ]; const ranks = rows.map((r) => r.__row || null); console.log('rows on the page:', rows.length);
  // 🔴 House filter
  const chip = D.querySelector('.cm-nexthide'); console.log('chip:', chip && chip.textContent, '| Chile a Next country?', W.__cm2.nextDist().has('CL'));
  if (!chip) bad.push('chip'); else { W.__cm2.nextDist().add('CL'); const h0 = W.__cm2.nextHide('CL', 'next', 'x1'); chip.click(); await wait(300); await h.settle(); const t1 = (D.querySelector('.cm-nexthide') || {}).textContent; const h1 = W.__cm2.nextHide('CL', 'next', 'x1'); const pq = W.__cm2x ? W.__cm2x.powerQueue().list.length : -1;
    D.querySelector('.cm-nexthide').click(); await wait(300); await h.settle(); const h2 = W.__cm2.nextHide('CL', 'next', 'x1'); console.log('Next company in Chile hidden for House: off', h0, '→ on', h1, `(${t1})`, '→ off', h2);
    if (h0 || !h1 || h2 || !/hidden/.test(t1)) bad.push('toggle'); }
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
