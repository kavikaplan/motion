// ⚡ Qualify & enrich when Snov is out of credits: the run goes on, the email check is tried once and then skipped,
// qualified companies with an email still come out “ready” (emails marked “not checked — Snov credits used up”), with a warning on the results
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); await h.settle(); const W = h.w, D = h.d, X = W.__cm3; const bad = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const of = W.fetch; let verifies = 0; let leads = 0;
  const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s });
  W.fetch = async (u, o = {}) => { u = String(u);
    if (u.startsWith('/api/enrich')) return J({ items: [ { kind: 'email', value: 'info@zqxbiomed.tn', source: 'https://zqxbiomed.tn/' }, { kind: 'phone', value: '+216 71 000 111', source: 'https://zqxbiomed.tn/' } ].slice(0, u.includes('Zqx%20Two') ? 1 : 2), pages: [ 'https://zqxbiomed.tn/' ] });
    if (u.startsWith('/api/leads') && (o.method || 'GET') === 'GET') { leads++; return J({ domain: 'zqxbiomed.tn', people: [], emails: [ 'ventas@zqxbiomed.tn' ], snov: 'no_credits', errors: [ 'Snov credits are used up — Snov was skipped (Apollo and the website still ran). Add credits in Snov to look up and check emails again.' ] }); }
    if (u.startsWith('/api/leads') && o.method === 'POST') { verifies++; return J({ error: 'Snov credits are used up — Snov was skipped (Apollo and the website still ran). Add credits in Snov to look up and check emails again.', code: 'snov_credits', results: [] }); }
    return of(u, o); };
  const mk = (name) => ({ key: `tn|${name.toLowerCase().replace(/\W+/g, '')}`, name, iso: 'TN' });
  const rows = [ mk('Zqx Biomed Testco'), mk('Zqx Two Testco') ].map((e) => ({ e, iso: 'TN' }));
  rows.forEach((r) => X.RQ.set(r.e.key, { verdict: 'qualified', reason: 'sells trauma implants', website: 'https://zqxbiomed.tn', website_ownership: 'confirmed', at: Date.now() }));
  await X.richRun(rows, { ppl: true, verify: true }); await wait(300); await h.settle();
  const R = X.RR.last && X.RR.last.R; console.log('outcomes:', R && R.map((x) => `${x.e.name}: ${x.out} — ${x.why}`).join(' || '));
  console.log('email checks tried:', verifies, '| people lookups:', leads);
  if (!R || R.some((x) => x.out !== 'ready') || !R.some((x) => /not checked \(Snov credits used up\)/.test(x.why))) bad.push('ready with unchecked emails');
  if (verifies > 1) bad.push('verify retried after no credits'); // (0 when the people lookup already said Snov is out of credits)
  const warn = [ ...D.querySelectorAll('#cm-sheet .cm-aierr') ].map((x) => x.textContent).join(' '); console.log('results warning:', warn.slice(0, 120)); if (!/Snov credits were used up/.test(warn)) bad.push('results warning');
  W.fetch = of; console.log(`errors ${h.errors.length + bad.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
