// 📋 copy for ChatGPT / Claude / Gemini: prompt content, the menu, opening the app prefilled, pasting the answer back
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1200)); const W = h.w, D = h.d; const bad = []; const opened = [];
  W.open = (u) => { opened.push(u); return {}; }; let clip = ''; Object.defineProperty(W.navigator, 'clipboard', { value: { writeText: async (t) => { clip = t; }, readText: async () => clip }, configurable: true });
  const p1 = W.__cm3.aiPrompt('email', 'thanks for call, sending catalogue + 2026 prices', { company: 'Promed', lang: 'Spanish', sender: 'Kavi', brand: 'Next Shoulder' }); const p2 = W.__cm3.aiPrompt('whatsapp', '', { company: 'Promed', thread: 'They: send the price list please' });
  console.log('prompt (rewrite):', p1.slice(0, 160).replace(/\n/g, ' ')); console.log('prompt (new):', p2.slice(0, 140).replace(/\n/g, ' '));
  if (!/Improve this business email/.test(p1) || !/Spanish/.test(p1) || !/2026 prices/.test(p1) || !/replying to their last message/.test(p2)) bad.push('prompts');
  let pasted = ''; const b = W.__cm3.aiCopyBtn('cm-chip', () => p1, (t) => { pasted = t; }); D.body.append(b); b.click(); await h.settle();
  const items = [...D.querySelectorAll('[role="menuitemradio"]')]; console.log('menu:', items.map((x) => x.textContent).join(' | ').slice(0, 220)); if (items.length !== 4) bad.push('menu');
  items[0].click(); await new Promise((r) => setTimeout(r, 100)); console.log('opened:', String(opened[0]).slice(0, 60), '| copied:', clip === p1, '| toast:', (D.querySelector('.cm-toast') || {}).textContent);
  if (!/^https:\/\/chatgpt\.com\/\?q=/.test(opened[0] || '') || clip !== p1) bad.push('open/copy');
  clip = 'Estimada Ana,\n\nGracias por la llamada.'; b.click(); await h.settle(); [...D.querySelectorAll('[role="menuitemradio"]')].pop().click(); await new Promise((r) => setTimeout(r, 100)); console.log('pasted:', JSON.stringify(pasted)); if (!/^Estimada Ana/.test(pasted)) bad.push('paste');
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
