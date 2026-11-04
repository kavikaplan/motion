// 📇 save to phone contacts: vCard content, Power hour menu, company-page button
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); const W = h.w; const bad = [];
  const v = W.__cm3.vcard({ name: 'Ana María Pérez', title: 'Gerente General', company: 'Promed, S.A.', phones: ['+507 6123-4567', '00 507 222 3333'], emails: ['ana@promed.pa'], country: 'Panama', website: 'promed.pa' });
  console.log(v.replace(/\r\n/g, ' ⏎ '));
  ['BEGIN:VCARD', 'FN:Ana María Pérez – Promed\\, S.A.', 'ORG:Promed\\, S.A.', 'TITLE:Gerente General', 'TEL;TYPE=CELL:+50761234567', 'TEL;TYPE=WORK:+5072223333', 'EMAIL;TYPE=WORK:ana@promed.pa', 'URL:https://promed.pa', 'END:VCARD'].forEach((x) => { if (!v.includes(x)) bad.push(`missing ${x}`); });
  if (!v.includes('N:María Pérez;Ana;;;')) bad.push('N field');
  let saved = null; const orig = W.__cm3.saveContacts; W.URL.createObjectURL = () => 'blob:x'; W.URL.revokeObjectURL = () => {};
  const anchor = h.d.createElement('button'); h.d.body.append(anchor);
  W.__cm3.vcardMenu(anchor, 'Promed', 'PA', 'promed.pa', [{ name: 'Ana Pérez', title: 'GM', phone: '+507 6123 4567', email: 'ana@promed.pa' }, { name: 'Luis Gómez', title: 'Sales', phone: '+507 6999 0000' }], ['+507 6123 4567', '+507 222 3333']); await h.settle();
  const items = [...h.d.querySelectorAll('[role="menuitemradio"]')].map((x) => x.textContent); console.log('menu:', items.join(' | ')); if (items.length !== 4 || !items.some((t) => /company number/.test(t)) || !items.some((t) => /All 3/.test(t))) bad.push('menu');
  try { W.__cm3.saveContacts([{ name: 'Ana', phones: ['+5071'] }], 'Ana'); await h.settle(); console.log('toast:', (h.d.querySelector('.cm-toast') || {}).textContent); } catch (e) { bad.push(`save: ${e.message}`); }
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
