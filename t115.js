// 🇹🇷 Turkish client report: one AI read gives the Turkish note + contact person; report grouped by country (“Firma / Kişi” + note), Turkish summary, text for WhatsApp
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D0 = h.d; const bad = []; const prompts = [];
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { const p = JSON.parse(o.body).prompt; prompts.push(p);
      const text = /executive summary/.test(p) ? (/in Turkish/.test(p) ? '- Bu ay 31 firma ile görüştük, yanıtlar iki katına çıktı.\n- Şili’de Helico bayilik istiyor.' : '- We contacted 31 companies.') : 'NOW: Interested; price sent.\nLAST: They wrote on 20 Oct by WhatsApp asking for samples.\nNEXT: Online meeting next Wednesday.\nTR: Çok ilgili, fiyat gönderildi. Numune çanta talep ettiler; haftaya Çarşamba online toplantı var.\nKİŞİ: Lusha';
      return new Response(JSON.stringify({ text, engine: 'Claude' })); } return of(u, o); };
  for (let i = 0; i < 20 && !W.__cm2.rptData('next', 'lastmonth'); i++) { W.dash.data('contact_history'); W.dash.data('pipeline_stages'); await h.settle(); await new Promise((r) => setTimeout(r, 300)); }
  const D = W.__cm2.rptData('next', 'lastmonth'); const r0 = D.rows.find((r) => r.iso) || D.rows[0]; r0.stage = 4; r0.status = 'Interested';
  await W.__cm3.rptMakeAI({ ...D, rows: [r0], force: true }); const a = ((W.__cm.uiFlags || {}).rptAI || {})[`${D.brand}:${r0.id}`] || {}; console.log('tr note:', a.tr, '| person:', a.person); if (!/Numune/.test(a.tr || '') || a.person !== 'Lusha') bad.push('tr parse');
  if (!/TR: the same situation/.test(prompts[0] || '')) bad.push('prompt');
  await W.__cm3.rptExecMake(D, true, 'tr'); const ex = W.__cm3.rptExecGet(D, 'tr'); console.log('tr summary:', ex && ex.pts.join(' | ')); if (!ex || !/görüştük/.test(ex.pts[0])) bad.push('tr summary');
  const txt = W.__cm3.rptTextTr(D); const cname = new Intl.DisplayNames(['tr'], { type: 'region' }).of(r0.iso); console.log('text:\n' + txt.split('\n').slice(0, 9).join('\n'));
  if (!txt.includes(`${cname}:\n${r0.company} / Lusha\nÇok ilgili`)) bad.push('text format');
  const html = W.__cm3.rptHTMLtr(D, 'Kavi'); console.log('html: Özet', /📝 Özet/.test(html), '| aylık', /Aylık faaliyet raporu/.test(html), '| Lusha', /Lusha/.test(html)); if (!/📝 Özet/.test(html) || !/Aylık/.test(html) || !/Lusha/.test(html)) bad.push('html');
  // the sheet: language choice → Turkish preview, subject and copy button
  W.__cm3.openClientReport(D0.body, { brand: 'next', period: 'lastmonth' }); await h.settle(); await new Promise((r) => setTimeout(r, 400)); await h.settle(); const S = D0.getElementById('cm-sheet');
  const ls = [...S.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.value === 'tr')); ls.value = 'tr'; ls.dispatchEvent(new W.Event('change')); await h.settle(); await new Promise((r) => setTimeout(r, 400)); await h.settle();
  const pv = S.querySelector('.cm-rptpv'); const cp = [...S.querySelectorAll('.cm-btn')].find((b) => /Metni kopyala/.test(b.textContent)); const sub = (S.querySelector('p.mut') || {}).textContent || '';
  console.log('sheet: preview Turkish', /faaliyet raporu/.test(pv.textContent), '| copy', !!cp, '| subject', sub.slice(0, 70)); if (!/faaliyet raporu/.test(pv.textContent) || !cp || !/Aylık faaliyet raporu/.test(sub)) bad.push('sheet');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
