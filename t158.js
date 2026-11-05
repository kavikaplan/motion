// 🟢 WhatsApp check adds the 💬 button too: numbers written without +country code (company and its people) are checked with the
// company's country code; on WhatsApp → the button shows (with the full number), not on WhatsApp → none
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = []; const asked = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners' } });
  { const W0 = h.w; const of = W0.fetch; W0.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/wacheck')) { const b = JSON.parse(o.body); asked.push(...b.numbers); const res = {}; b.numbers.forEach((n) => { res[n] = n === '56221112222' || n === '56912345678' || n === '56223456789' ? n !== '56223456789' : false; }); return new (W0.Response || globalThis.Response)(JSON.stringify({ results: res })); } return of(u, o); }; }
  await h.settle(); await wait(800); await h.settle(); const W = h.w, D = h.d, C = W.__cm;
  // before any check: a local number has no WhatsApp button
  console.log('before the check — “22 111 2222” WhatsApp?', C.waOk('22 111 2222')); if (C.waOk('22 111 2222')) bad.push('no button before the check');
  const co = C.rowsOf('company_index').find((c) => c.country === 'Chile') || {};
  W.cmCompanyIso = 'CL'; W.dash.setParams({ view: 'company', cid: co.id || 'cX', iso: 'CL' }); await h.settle(); await wait(1500); await h.settle(); await wait(500); await h.settle();
  console.log('numbers checked:', [ ...new Set(asked) ].join(', '));
  if (!asked.includes('56221112222') || !asked.includes('56223456789')) bad.push('local numbers checked with +56');
  console.log('after — company “22 111 2222”:', C.waOk('22 111 2222'), C.waHref('22 111 2222'), '| person “22 345 6789” (not on WhatsApp):', C.waOk('22 345 6789'));
  if (!C.waOk('22 111 2222') || C.waHref('22 111 2222') !== 'https://wa.me/56221112222' || C.waOk('22 345 6789')) bad.push('button from the answer');
  // the person and company lines (same drawing as the People list): 💬 only on the number that is on WhatsApp
  const line = (ph) => [ ...C.contactLine('Ariel', 'Sales', { linkedin: '', phones: [ ph ], emails: [] }).querySelectorAll('a[href^="https://wa.me/"]') ].map((a) => a.getAttribute('href'));
  const l1 = line('22 111 2222'), l2 = line('22 345 6789'); console.log('💬 on “22 111 2222”:', l1.join(',') || 'none', '| on “22 345 6789”:', l2.join(',') || 'none');
  if (l1[0] !== 'https://wa.me/56221112222' || l2.length) bad.push('buttons');
  // an international number still works as before; 0-prefixed local numbers too
  C.waLocal.set('912345678', '56912345678'); C.waKnown.set('56912345678', true); console.log('“09 1234 5678” →', C.waOk('09 1234 5678'), C.waHref('09 1234 5678')); if (!C.waOk('09 1234 5678') || C.waHref('09 1234 5678') !== 'https://wa.me/56912345678') bad.push('leading 0');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
