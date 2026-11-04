// ✨ smart draft: a failed AI draft (e.g. Spanish, the first one asked) is not kept empty — it shows ⚠ retry and works on ↻; the prompt asks for simple, direct language
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { iso: 'CL', view: 'country', tags: ['chile'], ours: 'next', ctab: 'companies', csub: 'partners' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d; const bad = [];
  let fail = true; const P = []; const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (u.startsWith('/api/summarize')) { const p = JSON.parse(o.body).prompt; if (!/Language:/.test(p)) return new Response(JSON.stringify({ text: 'x' })); P.push(p); if (fail) { fail = false; return new Response(JSON.stringify({ error: 'AI failed: busy' }), { status: 502 }); } return new Response(JSON.stringify({ text: `Hola, AI DRAFT in ${(p.match(/Language: (\w+)/) || [])[1]}` })); } return of(u, o); };
  W.__cm2.openPowerHour(D.body); await new Promise((r) => setTimeout(r, 1500)); await h.settle();
  const dr = () => D.querySelector('#cm-sheet textarea.cm-phdraft:not(.cm-phnotes)'); const st = () => D.querySelector('#cm-sheet .cm-aist');
  console.log('after a failed Spanish draft:', st() && st().textContent, '| draft:', JSON.stringify(dr().value.slice(0, 60))); if (!st() || !/retry/.test(st().textContent)) bad.push('error shown');
  st().click(); await h.settle(); await new Promise((r) => setTimeout(r, 800)); await h.settle(); console.log('after ↻:', JSON.stringify(dr().value.slice(0, 60)), '| status', st() && st().textContent); if (!/AI DRAFT in Spanish/.test(dr().value)) bad.push('retry');
  const p = P[P.length - 1] || ''; console.log('style rules:', /Very simple words/.test(p), /Be direct/.test(p), /No filler/.test(p)); if (!/Very simple words/.test(p) || !/Be direct/.test(p)) bad.push('style');
  const tpl = W.__cm2.replyDraft ? W.__cm2.replyDraft({}, null, 'Ana Pérez', 'es', 'Next Shoulder') : ''; tpl && console.log('template es:', JSON.stringify(tpl));
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
