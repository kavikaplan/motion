// 📇 save to phone: iPhone gets a real .vcf address (/api/vcard, text/vcard) instead of a data: link; Android gets its “Create contact” screen
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); const W = h.w; const bad = [];
  const c = { name: 'Ana María Pérez', title: 'Gerente General', company: 'Promed, S.A.', phones: ['+507 6123-4567', '00 507 222 3333'], emails: ['ana@promed.pa'], country: 'Panamá', website: 'promed.pa' };
  const txt = W.__cm3.vcard(c); const url = W.__cm3.vcUrl(txt, 'Ana María Pérez'); console.log('url:', url.slice(0, 90), '…', url.length, 'chars');
  if (!/\/api\/vcard\?n=Ana%20Mar%C3%ADa%20P%C3%A9rez&d=/.test(url) || /data:/.test(url)) bad.push('url');
  const { onRequestGet } = await import('../functions/api/vcard.js'); const r = await onRequestGet({ request: new Request(`https://medint.example${url.slice(url.indexOf('/api'))}`) }); const body = await r.text();
  console.log('server:', r.status, r.headers.get('content-type'), '|', r.headers.get('content-disposition'), '| same card:', body === txt, '| accents kept:', /María Pérez/.test(body)); if (r.status !== 200 || !/text\/vcard/.test(r.headers.get('content-type')) || body !== txt) bad.push('server');
  const r2 = await onRequestGet({ request: new Request('https://medint.example/api/vcard?d=PHNjcmlwdD4=') }); console.log('junk refused:', r2.status); r2.status === 400 || bad.push('junk');
  const it = W.__cm3.vcIntent(c, url); console.log('android:', it.slice(0, 160)); const dec = decodeURIComponent(it);
  if (!/^intent:\/\/contacts\/#Intent;action=android\.intent\.action\.INSERT;type=vnd\.android\.cursor\.dir\/raw_contact;/.test(it) || !/;end$/.test(it) || !dec.includes('S.name=Ana María Pérez') || !dec.includes('S.phone=+50761234567') || !dec.includes('S.secondary_phone=+5072223333') || !dec.includes('S.email=ana@promed.pa') || !dec.includes('S.company=Promed, S.A.') || !/S\.browser_fallback_url=https?%3A/.test(it)) bad.push('intent');
  if (/;[^;=]*;[^;=]*=/.test(it.replace(/%3B/g, ''))) 0;
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
