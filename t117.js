// 🧠 Lead research skill in Medint: profile words in 7 languages, phone hygiene, people cleanup, skill results import, deep check
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2500)); await h.settle(); const W = h.w, D = h.d; const X = W.__cm3; const bad = [];
  // free gate
  const lab = (name, extra = {}) => X.qlRulesX({ name, key: name, ...extra })[0];
  const cases = [ [ 'Comercial Parafusos e Próteses Ltda', 'ortho' ], [ 'Медтехника Плюс ООО', 'maybe' ], [ 'Clinica Supplies Distribuidor SAC', 'maybe' ], [ 'Clínica San Felipe SAC', 'buyer' ], [ 'مستشفى الأمل', 'buyer' ], [ 'Kalça Protezi Ticaret', 'ortho' ] ];
  cases.forEach(([n, want]) => { const got = lab(n); console.log('gate:', n, '→', got); got !== want && bad.push(`gate ${n}`); });
  // phones
  const ph = [ [ '+56 2 2345 6789', true ], [ '76.316.504-3', false ], [ '30-71234567-9', false ], [ '18 19 20 21', false ], [ '12/10/2024', false ], [ '1111111', false ], [ '(01) 422-5555', true ] ];
  ph.forEach(([p, want]) => { const got = X.phoneOk(p); got !== want && (bad.push(`phone ${p}`), console.log('phone wrong:', p, got)); }); console.log('phones ok:', ph.every(([p, w]) => X.phoneOk(p) === w));
  // people
  const pc = X.pplClean([ { name: 'LUIS PEREZ', title: 'Jefe de Bodega', email: 'lperez@acme.cl' }, { name: 'Ana Ruiz', title: 'Gerente General', email: 'ana@acme.cl' }, { name: 'Luis Pa***', title: 'CEO' }, { name: 'Marta Gil', title: 'Compras', email: 'marta@othercorp.com' }, { name: '', email: 'ventas@acme.cl' }, { name: 'Pedro Soto', title: 'Ventas', email: 'hbalz.60zb95@acme.cl' }, { name: 'Rosa Diaz', title: 'Licitaciones', email: 'rosa@gmail.com' } ], 'acme.cl');
  console.log('people:', pc.people.map((p) => `${p.name}(${p.rank})`).join(', '), '| mailboxes:', pc.mailboxes.join(','));
  if (pc.people[0].name !== 'Ana Ruiz' || pc.people.some((p) => /\*/.test(p.name)) || pc.people.some((p) => p.name === 'Marta Gil') || !pc.mailboxes.includes('ventas@acme.cl') || !pc.people.some((p) => p.name === 'Luis Perez' && p.rank === 9) || pc.people.find((p) => p.name === 'Pedro Soto').email) bad.push('people');
  // skill results back into Medint
  const L = W.cmLeadsFor('CO', true) || []; const e = L[0]; console.log('lead to import:', e && e.name); const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const outcomes = csv([ [ 'Company', 'Input name', 'Country', 'Outcome', 'Label', 'Reason', 'Research category', 'Website', 'Email', 'Phone', 'Evidence', 'Evidence URL', 'Delivery readiness', 'Delivery blockers', 'Brand represented', 'Products', 'Gate', 'CRM screen', 'Row ID' ],
    [ e.name, e.name, 'Colombia', 'qualified_contactable', 'Qualified — contactable', 'Distributes trauma implants', 'qualified', 'https://acme.co', 'info@acme.co', '+57 1 555 1234; 76.316.504-3', 'Distribuidor de implantes de trauma', 'https://acme.co/productos', 'ready', '', 'Stryker; Arthrex', 'trauma plates', '', 'new', 'r001' ],
    [ 'Ghost SA', 'Ghost SA', 'Colombia', 'not_suitable', 'NON ICP', 'A clinic', 'not_a_fit', '', '', '', '', '', '', '', '', '', '', '', 'r002' ] ]);
  const contacts = csv([ [ 'Name', 'First name', 'Last name', 'Title', 'Email', 'Phone number', 'LinkedIn', 'Domains', 'Contact type', 'Source', 'Notes', 'company_name', 'domain', 'row_id', 'email_kind', 'email_status', 'level' ], [ 'Juan Gómez', 'Juan', 'Gómez', 'Gerente General', 'juan@acme.co', '', '', 'acme.co', 'Medical', 'Apollo', '', e.name, 'acme.co', 'r001', 'personal', 'juan@acme.co=deliverable', 'person' ] ]);
  const file = (name, text) => ({ name, text: async () => text });
  const r = await X.skImport([ file('company_outcomes.csv', outcomes), file('contacts_ready.csv', contacts) ]); console.log('import:', JSON.stringify(r));
  const rq = X.RQ ? X.RQ.get(e.key) : null; const q = W.__cm3.qlOf ? W.__cm3.qlOf(e) : null;
  const st = JSON.parse(W.localStorage.getItem('medint.rich') || '[]').find(([k]) => k === e.key); const ppl = JSON.parse(W.localStorage.getItem('medint.ppl') || '[]').find(([k]) => k === e.key); const lf = JSON.parse(W.localStorage.getItem('medint.leadfind') || '[]').find(([k]) => k === e.key); const vm = JSON.parse(W.localStorage.getItem('medint.vmail') || '[]').find(([k]) => k === 'juan@acme.co');
  console.log('stored: verdict', st && st[1].verdict, '| quote', st && st[1].quote, '| people', ppl && ppl[1].people.map((p) => p.name).join(','), '| phones', lf && JSON.stringify(lf[1].d.phones), '| email check', vm && vm[1].state);
  if (!r || r.matched !== 1 || r.missing[0] !== 'Ghost SA' || !st || st[1].verdict !== 'qualified' || !ppl || !/Juan/.test(ppl[1].people[0].name) || !lf || lf[1].d.phones.some((x) => /76\.316/.test(x)) || !vm || vm[1].state !== 'deliverable') bad.push('import');
  // deep check
  const of = W.fetch; let url = ''; W.fetch = async (u, o) => { if (String(u).startsWith('/api/research?deep=1')) { url = String(u); return new Response(JSON.stringify({ verdict: 'qualified', reason: 'LinkedIn page: distributor of orthopaedic implants', quote: 'distribuidor de implantes ortopédicos', quote_url: 'https://linkedin.com/company/x', deep: true })); } return of(u, o); };
  const e2 = L[1]; JSON.parse('[]'); X.RQ && X.RQ.set(e2.key, { verdict: 'insufficient_evidence', missing: 'what products they sell' }); const j = await X.leadDeep(e2, 'CO'); const s2 = JSON.parse(W.localStorage.getItem('medint.rich') || '[]').find(([k]) => k === e2.key);
  console.log('deep:', j.verdict, '| sent missing:', /missing=what%20products/.test(url), '| stored', s2 && s2[1].verdict, s2 && s2[1].deep); if (!s2 || s2[1].verdict !== 'qualified' || !s2[1].deep) bad.push('deep');
  console.log('prompt:', X.skPrompt({ file: 'x.csv', n: 10, isos: ['CO'] }).split('\n')[0]);
  console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
