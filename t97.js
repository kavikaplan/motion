// 🔍 lead research panel: opens from a lead row, shows what we know + the 6 steps, research/people/verify/add work (website mode, faked APIs)
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000));
  const W = h.w, D = h.d; const calls = h.calls; const of = W.fetch;
  W.fetch = async (u, o = {}) => { u = String(u); if (String(u) === '/api/research' && o && o.body) u = '/api/research?' + Object.entries(JSON.parse(o.body)).filter(([k]) => k !== 'own').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&'); /* POST → the same names as an address */
    if (u.startsWith('/api/research')) { calls.push(['fetch', u]); return new Response(JSON.stringify({ verdict: 'qualified', role: 'distributor', segments: ['trauma'], reason: 'Distributor of trauma implants', quote: 'Somos distribuidores de implantes de trauma', quote_url: 'https://x.pa', website: 'https://x.pa', pages: ['https://x.pa'] })); }
    if (u.startsWith('/api/leads') && (o.method || 'GET') === 'GET') return new Response(JSON.stringify({ people: [{ source: 'Apollo', id: 'a1', name: 'Ana Pérez', title: 'Gerente General', email: 'ana@x.pa' }, { source: 'Snov', hash: 'h', name: 'Luis Gómez', title: 'Analyst', email: '' , canReveal: true }], emails: ['info@x.pa'], company: { employees: 40, industry: 'Medical devices' } }));
    if (u.startsWith('/api/leads')) { const b = JSON.parse(o.body); if (b.action === 'verify') return new Response(JSON.stringify({ results: b.emails.map((m, i) => ({ email: m, state: ['deliverable', 'risky', 'undeliverable'][i % 3], detail: 'test' })) })); }
    return of(u, o); };
  ['tender_awards', 'registrations', 'tender_suppliers', 'moh_leads', 'congress_companies', 'company_index'].forEach((d) => W.dash.data(d)); await h.settle(); await new Promise((r) => setTimeout(r, 800));
  W.__cm3.openLeadsPage('PA'); await h.settle(); await new Promise((r) => setTimeout(r, 600)); await h.settle();
  const nm = D.querySelector('#cm-lp .cm-lpname'); console.log('lead names clickable:', D.querySelectorAll('#cm-lp .cm-lpname').length, '| first:', nm && nm.textContent);
  nm.click(); await h.settle(); const P = () => D.getElementById('cm-lead'); console.log('panel:', !!P(), '| steps:', [...P().querySelectorAll('.cm-lsec h3')].map((x) => x.textContent.slice(0, 22)).join(' | '));
  const click = async (re) => { const b = [...P().querySelectorAll('button')].find((x) => re.test(x.textContent)); if (!b) return console.log('no button', re); b.click(); await new Promise((r) => setTimeout(r, 300)); await h.settle(); };
  await click(/Read their website/); await new Promise((r) => setTimeout(r, 800)); console.log('research calls:', calls.filter((c) => /research/.test(c[1])).length, '| toast:', (D.querySelector('.cm-toast') || {}).textContent, '| busy btn:', [...P().querySelectorAll('button')].map((b)=>b.textContent).join('/').slice(0,300)); console.log('verdict:', (P().querySelector('.cm-rvbox') || {}).textContent?.slice(0, 90));
  await click(/Find people/); console.log('people rows:', P().querySelectorAll('.cm-lppl').length);
  W.confirm = () => true; await click(/^✉ Check/); console.log('emails:', [...P().querySelectorAll('.cm-vm')].map((x) => x.className.split(' ')[1] + ':' + x.textContent.slice(2, 22)).join(' | '));
  const before = calls.filter((c) => c[1] === 'create_record').length; await click(/Add to NetHunt/); await new Promise((r) => setTimeout(r, 400));
  const cr = calls.filter((c) => c[0] === 'nh' && c[1] === 'create_record'); const co = cr.find((c) => c[2].folderId !== '6682e9b8b6386800f586c0b0'); const ppl = cr.filter((c) => c[2].folderId === '6682e9b8b6386800f586c0b0');
  console.log('created company:', co && co[2].fields.Name, '| category:', co && co[2].fields.Category, '| emails:', co && JSON.stringify(co[2].fields.Email), '| notes start:', co && co[2].fields.Notes.split('\n')[0]); console.log('people added:', ppl.map((c) => c[2].fields.Name + '/' + JSON.stringify(c[2].fields.Email || [])).join(' ; '));
  console.log('done banner:', !!P().querySelector('.cm-ldone'));
  const links = cr.filter((c) => c[2].folderId === '6ad6c66c23cd83301a3640da').map((c) => JSON.parse(c[2].fields.Data || '{}').type); console.log('saved records:', links.join(','));
  const undeliv = (co && co[2].fields.Email || []).includes('ana@x.pa'); console.log('undeliverable kept?', undeliv);
  D.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); console.log('Escape closes:', !P());
  const ok = co && co[2].fields.Category === 'Ortho' && ppl.length === 1 && !undeliv && links.includes('link') && links.includes('batch') && !P(); console.log(`errors ${h.errors.length + (ok ? 0 : 1)}`, h.errors.join('').slice(0, 300)); process.exit(0); })();
