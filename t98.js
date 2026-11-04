// ☁ research made in one browser shows up in another (shared store), and older browser-only research is shared once
const { run } = require('./harness');
const SRV = new Map(); let clock = 1000;
const hook = (W) => { const of = W.fetch; W.fetch = async (u, o = {}) => { u = String(u); if (!u.startsWith('/api/leadstore')) return of(u, o);
  if ((o.method || 'GET') === 'POST') { JSON.parse(o.body).rows.forEach((x) => SRV.set(`${x.kind}|${x.k}`, { ...x, at: ++clock })); return new Response(JSON.stringify({ ok: true })); }
  const since = Number(new URL('http://x' + u).searchParams.get('since')) || 0; return new Response(JSON.stringify({ rows: [...SRV.values()].filter((x) => x.at > since), now: clock })); }; };
(async () => {
  const A = run({ site: true, params: { view: 'home' } }); hook(A.w); await A.settle(); await new Promise((r) => setTimeout(r, 300));
  A.w.__cm3.RQ.set('kendall', { verdict: 'qualified', reason: 'trauma distributor', quote: 'Somos distribuidores', at: 1 }); A.w.__cm3.RQ.save(); await new Promise((r) => setTimeout(r, 2600)); await A.settle();
  console.log('A state:', JSON.stringify({ ok: A.w.__cm3.LS.ok, dirty: [...A.w.__cm3.LS.dirty], busy: A.w.__cm3.LS.busy })); await A.w.__cm3.lsPush(); console.log('A pushed:', [...SRV.keys()].join(', ') || 'nothing');
  try { A.w.localStorage.clear(); } catch (_e) { /* separate storage */ } // B must get it from the server, not from a shared browser copy
  const B = run({ site: true, params: { view: 'home' } }); hook(B.w); await B.settle(); await new Promise((r) => setTimeout(r, 2800)); await B.settle();
  const got = B.w.__cm3.RQ.get('kendall'); console.log('B sees A’s research:', got ? `${got.verdict} — “${got.quote}”` : 'no');
  B.w.__cm3.VM.set('ana@x.pa', { state: 'deliverable', at: 2 }); B.w.__cm3.VM.save(); await new Promise((r) => setTimeout(r, 2600));
  await A.w.__cm3.lsPull(false); console.log('A sees B’s email check:', (A.w.__cm3.VM.get('ana@x.pa') || {}).state || 'no');
  const ok = got && got.verdict === 'qualified' && (A.w.__cm3.VM.get('ana@x.pa') || {}).state === 'deliverable';
  console.log(`errors ${A.errors.length + B.errors.length + (ok ? 0 : 1)}`); process.exit(0); })();
