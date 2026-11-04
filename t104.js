// growth features: 🎯 distributor gap, 🔁 follow-up cadence, 🚀 moved forward in client reports, 📈 what converts
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); const W = h.w; const bad = [];
  ['tender_awards', 'tender_suppliers', 'company_index', 'pipeline_stages', 'moh_leads', 'congress_companies', 'registrations'].forEach((d) => W.dash.data(d)); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); await h.settle();
  // 🎯
  const G = W.__cm3.gapData(); const cl = G.find((r) => r.iso === 'CL'); console.log('gap countries:', G.length, '| top:', G.slice(0, 3).map((r) => `${r.iso} ${r.score}`).join(', '), '| Chile:', cl && `${Math.round(cl.share * 100)}% independent, ${cl.indep} winners, direct: ${cl.direct.slice(0, 2).join('/')}`);
  if (!G.length || !cl || !cl.direct.some((g) => /Stryker|Johnson|Zimmer/.test(g)) || G[0].score !== 100) bad.push('gap');
  ['market_intel', 'osteo_trade', 'competitor_footprint'].forEach((d) => W.dash.data(d)); await h.settle(); await new Promise((r) => setTimeout(r, 800)); const G2 = W.__cm3.gapData(); const cl2 = G2.find((r) => r.iso === 'CL'); const co2 = G2.find((r) => r.iso === 'CO');
  console.log('with market data:', G2.length, 'countries | top:', G2.slice(0, 15).map((r) => `${r.iso} ${r.score}`).join(', '), '| Colombia:', co2 && `$${Math.round(co2.size / 1e6)}M, growth ${Math.round((co2.growth || 0) * 100)}%, ${co2.trN} Turkish makers, tariff ${co2.tariff}`);
  if (!cl2 || !(cl2.size > 0) || !co2 || !(co2.trN > 0)) bad.push('gap market');
  // ⌨️ shortcuts
  W.__cm3.openShortcuts(h.d.body); await h.settle(); const SK = h.d.querySelectorAll('.cm-kbr').length; const mi = (W.__cm3.moreExtra() || []).some((x) => /Keyboard shortcuts/.test(x[0])); console.log('shortcuts:', SK, 'rows | in ⋯ menu:', mi); if (SK < 6 || !mi) bad.push('shortcuts'); W.__cm.closeSheet();
  // 🔁 cadence: we wrote 1× after their reply 4 working days ago → step 1 due; 2× → step 2 (email + catalogue); they wrote last → none
  const of = W.dash.data.bind(W.dash); const day = (n) => new Date(Date.now() - n * 864e5).toISOString(); let CH = [];
  W.dash.data = (k, ...a) => (k === 'contact_history' ? { status: 'ok', data: CH } : of(k, ...a));
  const cad = W.__cm2x.cadenceOf; CH = [{ record_id: 'A', type: 'email', dir: 'in', time: day(20) }, { record_id: 'A', type: 'chat', dir: 'out', time: day(8) }]; const c1 = cad('A');
  CH = [...CH, { record_id: 'A', type: 'chat', dir: 'out', time: day(7) }]; const c2 = cad('A');
  CH = [...CH, { record_id: 'A', type: 'chat', dir: 'in', time: day(1) }]; const c3 = cad('A'); W.dash.data = of;
  console.log('cadence:', c1 && `${c1.step}/3 ${c1.label} due=${c1.isDue}`, '|', c2 && `${c2.step}/3 ${c2.label}`, '| after their reply:', c3);
  if (!c1 || c1.step !== 1 || !c1.isDue || !c2 || c2.ch !== 'email' || c3) bad.push('cadence');
  // 📈
  const m = W.__cm3.convModel(); console.log('what converts:', m && `${m.N} contacted examples, ${m.K} replied`, '| lift for a Chile tender winner:', W.__cm3.convLift('STRYKER CORPORATION CHILE Y COMPANIA LIMITADA', 'CL').toFixed(2));
  if (!m) bad.push('model'); W.__cm3.openConverts(h.d.body); await h.settle(); const S = h.d.getElementById('cm-sheet'); console.log('sheet:', [...h.d.querySelectorAll('.cm-cvrow')].slice(0, 30).map((r) => r.textContent).join(' | '));
  // 🚀 moved forward: NetHunt change history → from / to
  const EV = [{ recordId: 'R1', time: Date.now() - 3 * 864e5, changes: { 'NEXT Status': { old: 'Contacted', new: 'Replied' } } }, { recordId: 'R1', time: Date.now() - 864e5, changes: { 'NEXT Status': { old: 'Replied', new: 'Interested' } } },
      { recordId: 'R2', time: Date.now() - 2 * 864e5, changes: { 'NEXT Status': { old: 'Interested', new: 'Not interested' } } }, { recordId: 'R3', time: Date.now() - 2 * 864e5, changes: { Status: { old: 'Contact 1', new: 'Interested' } } }];
  const use0 = W.claude.use; W.claude.use = async (k) => { const s0 = await use0(k); if (k !== 'mcp' || !s0) return s0; return { ...s0, callTool: (srv, tool, args) => (tool === 'list_folder_timeline' && (args.types || []).includes('record_updated') ? Promise.resolve({ content: [{ type: 'text', text: JSON.stringify({ events: EV }) }] }) : s0.callTool(srv, tool, args)) }; };
  const A0 = Date.now() - 7 * 864e5, B0 = Date.now(); W.__cm3.rptMoves('next', A0, B0); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const mv = W.__cm3.rptMoves('next', A0, B0) || []; W.claude.use = use0;
  console.log('moved forward (Next):', mv.map((x) => `${x.id}: ${x.from} → ${x.to}`).join(' | ')); if (mv.length !== 1 || mv[0].from !== 'Contacted' || mv[0].to !== 'Interested') bad.push('moves');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(',')); process.exit(0); })();
