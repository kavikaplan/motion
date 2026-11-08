// compose: ✍️ write from my notes (chosen AI engine), 🕒 schedule menu in their time zone, Inbox → Scheduled; Power hour weather chip
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); const W = h.w, D = h.d; const bad = []; let aiBody = null; const posts = [];
  const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u);
    if (u.startsWith('/api/gmail/accounts')) return new Response(JSON.stringify({ accounts: [{ mailbox: 'hi@kavikaplan.com', aliases: [{ email: 'hi@kavikaplan.com', name: 'Kavi', isDefault: true, signature: '' }] }], role: 'House' }));
    if (u.startsWith('/api/summarize?engines=1')) return new Response(JSON.stringify({ engines: ['anthropic', 'gemini'] }));
    if (u.startsWith('/api/summarize')) { aiBody = JSON.parse(o.body); return new Response(JSON.stringify({ text: 'Subject: Catalogue and prices\n\nDear Ana,\n\nThank you for the call today. As promised, I attach our trauma catalogue and the 2026 price list.\n\nBest regards,\nKavi', engine: 'Gemini' })); }
    if (u.startsWith('/api/gmail/scheduled')) return new Response(JSON.stringify({ rows: [{ id: 'q1', subject: 'Catalogue', rcpt: 'ana@promed.pa', status: 'pending', send_at: Date.now() + 36e5, mailbox: 'hi@kavikaplan.com' }] }));
    if (u.startsWith('/api/gmail/send')) { posts.push(JSON.parse(o.body)); return new Response(JSON.stringify({ ok: true, scheduled: true, id: 'q2', sendAt: JSON.parse(o.body).sendAt })); }
    if (u.startsWith('/api/weather')) return new Response(JSON.stringify({ icon: '⛅', text: 'Partly cloudy', temp: 19, feels: 19, wind: 7, precip: 0, place: 'Bogotá', time: new Date().toISOString(), source: 'SKBO airport report, 13 km away' }));
    return of(u, o); };
  W.confirm = () => true; W.__cm.uiFlags = { ...(W.__cm.uiFlags || {}), mailOn: true, aiDrafts: false, aiEngine: 'gemini' };
  const X = W.__cm3; if (!X.openMail) { console.log('no openMail export'); }
  await (X.openMail || (() => {}))({ anchor: D.body, to: 'ana@promed.pa', company: 'Promed', cid: '' }); await h.settle(); await new Promise((r) => setTimeout(r, 300));
  const S = D.getElementById('cm-sheet'); const ta = S && S.querySelector('.cm-mlbody'); const wn = S && [...S.querySelectorAll('button')].find((b) => /Write from my notes/.test(b.textContent)); const sch = S && S.querySelector('.cm-mlsch');
  console.log('compose:', !!ta, '| notes button:', !!wn, '| schedule button:', !!sch, '| engines:', S && [...S.querySelectorAll('.cm-mleng option')].map((x) => x.textContent).join(', '));
  if (!ta || !wn || !sch) bad.push('controls'); else {
    ta.value = 'thanks for call, sending trauma catalogue + 2026 price list'; ta.dispatchEvent(new W.Event('input')); wn.click(); await new Promise((r) => setTimeout(r, 300)); await h.settle();
    console.log('AI asked with engine:', aiBody && aiBody.engine, '| notes in prompt:', !!(aiBody && /2026 price list/.test(aiBody.prompt)), '| body now:', ta.value.slice(0, 50).replace(/\n/g, ' '), '| subject:', (S.querySelector('input[placeholder*="ubject"]') || {}).value);
    if (!aiBody || aiBody.engine !== 'gemini' || !/Dear Ana/.test(ta.value)) bad.push('notes');
    sch.click(); await h.settle(); const items = [...D.querySelectorAll('[role="menuitemradio"]')].map((x) => x.textContent); console.log('schedule menu:', items.join(' | ').slice(0, 300)); if (items.length < 3) bad.push('schedule menu');
    const first = D.querySelector('[role="menuitemradio"]'); first && first.click(); await new Promise((r) => setTimeout(r, 300)); await h.settle(); { const sa = [ ...D.querySelectorAll('.cm-mlrev button') ].find((b) => /anyway/.test(b.textContent)); sa && (console.log('review before scheduling:', D.querySelector('.cm-mlrev').textContent.slice(0, 120)), sa.click(), await new Promise((r) => setTimeout(r, 300)), await h.settle()); } console.log('scheduled post sendAt in future:', posts[0] && posts[0].sendAt > Date.now(), '| toast:', (D.querySelector('.cm-toast') || {}).textContent);
    if (!posts[0] || !(posts[0].sendAt > Date.now())) bad.push('schedule post'); }
  // schedule menu in the company's time zone: no repeated time/city, weekday only when needed
  W.__cm.TZ = { ...(W.__cm.TZ || {}), AZ: 'Asia/Baku' }; const an = D.createElement('button'); D.body.append(an); W.__cm3.scheduleMenu(an, 'AZ', () => {}, () => {}); await h.settle();
  const its = [...D.querySelectorAll('[role="menuitemradio"]')].map((x) => x.textContent); console.log('Baku menu:', its.join(' | '));
  if (!its.some((t) => /Their next working morning/.test(t) && /09:00 Baku/.test(t) && /your time/.test(t)) || its.some((t) => /9:00 their time/.test(t))) bad.push('baku menu');
  // weather chip
  const chip = X.wxChip('CO', 'Bogotá'); await new Promise((r) => setTimeout(r, 200)); console.log('weather chip:', chip.textContent, '|', chip.title.replace(/\n/g, ' · ')); if (!/19°/.test(chip.textContent)) bad.push('weather');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
