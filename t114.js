// 📊 client report: AI now / last conversation / next per company + executive summary + latest conversations; weekly & monthly in one sheet
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D0 = h.d; const bad = []; const prompts = [];
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { const p = JSON.parse(o.body).prompt; prompts.push(p);
      const text = /executive summary/.test(p) ? '- We contacted more distributors than last month.\n- Ortomed is closest to a contract after the 14 Oct meeting.\n- Focus next month: price list follow-ups.' : 'NOW: Interested in the reverse shoulder; waiting for our price list.\nLAST: They wrote on 20 Oct by WhatsApp asking for the reverse shoulder price list.\nNEXT: Send the price list by 28 Oct.';
      return new Response(JSON.stringify({ text, engine: 'Claude' })); } return of(u, o); };
  for (let i = 0; i < 20 && !W.__cm2.rptData('next', 'lastmonth'); i++) { W.dash.data('contact_history'); W.dash.data('pipeline_stages'); await h.settle(); await new Promise((r) => setTimeout(r, 300)); }
  const D = W.__cm2.rptData('next', 'lastmonth'); console.log('report rows:', D && D.rows.length); if (!D || !D.rows.length) { bad.push('no rows'); } else {
    D.rows[0].stage = 4; D.rows[0].status = 'Interested'; await W.__cm3.rptMakeAI({ ...D, rows: [D.rows[0]], force: true }); const ai = (W.__cm.uiFlags || {}).rptAI || {}; const a = ai[`${D.brand}:${D.rows[0].id}`] || {};
    console.log('company AI:', JSON.stringify(a).slice(0, 300)); if (!/reverse shoulder/.test(a.now || '') || !/20 Oct/.test(a.last || '') || !/28 Oct/.test(a.next || '')) bad.push('now/last/next');
    if (!/NOW:/.test(prompts[0] || '') || !/LAST:/.test(prompts[0] || '')) bad.push('prompt');
    await W.__cm3.rptExecMake(D, true); const ex = W.__cm3.rptExecGet(D); console.log('exec:', ex && ex.pts.join(' | ')); if (!ex || ex.pts.length !== 3) bad.push('exec');
    const html = W.__cm2.rptHTML(D, 'Kavi'); const has = (re) => re.test(html); console.log('html has: summary', has(/📝 Summary/), '| latest conversations', has(/Latest conversations/), '| Now:', has(/<b>Now:<\/b>/), '| Last conversation', has(/Last conversation:/));
    if (!has(/📝 Summary/) || !has(/<b>Now:<\/b>/) || !has(/Last conversation:/)) bad.push('html'); }
  // one list, weekly + monthly; the old weekly entry opens the same report
  W.__cm3.openReports(D0.body); await h.settle(); const S = D0.getElementById('cm-sheet'); const btns = [...S.querySelectorAll('.cm-rnrow button')].map((b) => b.textContent); console.log('report buttons:', btns.slice(0, 4).join(' | ')); if (!btns.some((t) => /Weekly/.test(t)) || btns.filter((t) => /🗓/.test(t)).length !== 3) bad.push('list');
  S.querySelector('.cm-rnrow button').click(); await h.settle(); await new Promise((r) => setTimeout(r, 600)); await h.settle(); const t1 = D0.getElementById('cm-sheet-title').textContent; const per = [...S.querySelectorAll('select')].map((x) => x.value).join(','); console.log('opened:', t1, '| selects:', per, '| send button:', !![...S.querySelectorAll('.cm-btn')].find((b) => /Send weekly report/.test(b.textContent)));
  if (!/Client report/.test(t1) || !/week/.test(per)) bad.push('weekly opens report');
  const sel = [...S.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.value === 'lastmonth')); sel.value = 'lastmonth'; sel.dispatchEvent(new W.Event('change')); await h.settle(); await new Promise((r) => setTimeout(r, 500)); await h.settle();
  console.log('monthly send button:', !![...S.querySelectorAll('.cm-btn')].find((b) => /Send monthly report/.test(b.textContent))); if (![...S.querySelectorAll('.cm-btn')].find((b) => /Send monthly report/.test(b.textContent))) bad.push('monthly');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
