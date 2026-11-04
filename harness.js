const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const DATA = process.env.DATA || path.join(__dirname, '..', 'public', 'data'); // the website's own data files
const SRC = process.env.SRC || path.join(__dirname, '..', 'source');
const FILES = { kols: 'kols', moh_leads: '8a310ff001b902b118bf9cde57c5c5c8', congress_companies: 'bfa13ec21a89c816a10ae73f6b71303c', tender_suppliers: 'e11eda27c904db8c5211a0caf7f7a79b', congresses: '1c185762c1d2a3898a2f0cf642f4f825', exhibitions: 'c957dad10f95fb08c773aa442f46371a', trade_exhibitors: '509f201a6d2daf252f2fca21d62d41f9', brand_profiles: '089713c479c11942f44ea74ef2079bcd', competitor_footprint: '2aa24bf3bc4526b41720c9579e3cbc12', countries: 'be82ec4fc9b833576ac078ae7b27b304', import_values: '43e08a44caf307736fe75f519b54bc3a', market_intel: 'badcf154259c5fe6279c37b79b7da377', osteo_trade: '9ede02a9c2f136a95aa9f789458e7fc6', source_directory: '03145b171d774d6d0bc7beccd2981249', sources_used: '7b1da5ae2a4166de670b2e8d36ae68a7', tender_awards: 'bfc6d5ac61b14db2e161a44b48bf85fb', registrations: '3e6acfe8edac7a02a539522df7713d8b' };
const file = {};
for (const k of Object.keys(FILES)) file[k] = JSON.parse(fs.readFileSync(path.join(DATA, k + '.json'), 'utf8'));
file.company_index = JSON.parse(fs.readFileSync(path.join(DATA, 'company_index.json'), 'utf8'));
file.ortho_check = JSON.parse(fs.readFileSync(path.join(DATA, 'ortho_check.json'), 'utf8'));
file.registration_rules = JSON.parse(fs.readFileSync(path.join(DATA, 'registration_rules.json'), 'utf8'));
file.map_points = JSON.parse(fs.readFileSync(path.join(DATA, 'map_points.json'), 'utf8'));
file.map_outlines = JSON.parse(fs.readFileSync(path.join(DATA, 'map_outlines.json'), 'utf8'));
file.maps_places = JSON.parse(fs.readFileSync(path.join(DATA, 'maps_places.json'), 'utf8'));
file.meeting_links = [{ event_id: 'evX', action: 'link', company_id: '69baa1176e258122f263b32d' }, { event_id: 'ev1', action: 'ignore' }];
file.pipeline = JSON.parse(fs.readFileSync(path.join(DATA, 'pipeline.json'), 'utf8'));
const SNAP = '2026-10-12T13:20:00Z';
// fake NetHunt record from a snapshot row
const toRec = (r, extra = {}) => ({ id: r.id, createdAt: Date.parse('2025-01-01'), updatedAt: Date.now(), fields: { ...(r.company === 'IMPORTADORA HELICO LTDA' ? { 'Next follow-up': Date.UTC(2026, 9, 11), 'Next step': 'Send catalogue' } : {}), 'Phone number': [r.company === 'GEMCO MMQ S A' ? '22 345 6789' : '+56 2 2345 6789'], Email: ['info@co.cl'], 'Related records': ['p1', 'p2'], ...(r.company === 'IMPORTADORA HELICO LTDA' ? { 'Google Maps': 'https://www.google.com/maps/place/?q=place_id:ChIJ2RHRyIbFYpYR3OzmzJakDRc' } : {}), Website: 'https://co.cl', LinkedIn: 'https://www.linkedin.com/company/co', Facebook: 'https://www.linkedin.com/company/co/about/', Instagram: 'https://instagram.com/co', Twitter: '@co_cl', Notes: 'Distributor of trauma implants in Santiago.\n\nSecond para.', Update: 'Old.\n\n2026-10-12: Enriched via Snov; GM confirmed.', 'Total Calls': 2, 'Total Emails': 12, 'Total Emails Sent': 8, Name: r.company, Country: r.country ? r.country.split(' | ') : undefined, City: r.city ? r.city.split(', ') : undefined, Category: r.category || undefined, Status: r.status || undefined, 'NEXT Status': r.next_status || undefined, 'Motion Status': r.motion_status || undefined, Brand: r.brands ? r.brands.split('\n') : undefined, 'Last Interaction Date': r.last_interaction ? Date.parse(r.last_interaction) : undefined, ...extra } });

function run(opts = {}) {
  const html = (opts.html || fs.readFileSync(process.env.HTML || path.join(SRC, 'index.html'), 'utf8')).replace('<script src="app.js"></script>', () => '<script>' + fs.readFileSync(process.env.APPJS || path.join(SRC, 'app.js'), 'utf8') + '</script>').replace('<script src="app2.js"></script>', () => '<script>' + fs.readFileSync(process.env.APPJS2 || path.join(SRC, 'app2.js'), 'utf8') + '</script>').replace('<script src="app3.js"></script>', () => '<script>' + fs.readFileSync(process.env.APPJS3 || path.join(SRC, 'app3.js'), 'utf8') + '</script>');
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="dash-root"></div></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://x.test/' + (opts.hash || '') });
  const w = dom.window; const errors = [];
  w.addEventListener('error', (e) => errors.push('window: ' + (e.error && e.error.stack || e.message)));
  w.eval(fs.readFileSync(__dirname + '/node_modules/d3/dist/d3.min.js', 'utf8'));
  w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = function () {};
  const loaders = {}; const calcs = {}; const cbs = []; const state = {}; let params = { ...(opts.params || {}) };
  const calls = [];
  const fire = () => { for (const f of cbs) { try { f(); } catch (e) { errors.push('onData: ' + e.stack); } } };
  let pending = 0; let fireT = null;
  const schedule = () => { clearTimeout(fireT); fireT = setTimeout(fire, 0); };
  const answers = {
    companies: (args) => { const tags = (params.tags || []).map((t) => String(t).toLowerCase()); const rows = file.pipeline.filter((r) => r.country.toLowerCase().split(' | ').some((t) => tags.includes(t))); return { records: rows.map((r) => toRec(r)), total: rows.length }; },
    brand_companies: () => { const rows = file.pipeline.filter((r) => /zimed/i.test(r.brands)); return { records: rows.map((r) => toRec(r)), total: rows.length }; },
    pipeline_changes: () => { const a = file.pipeline.filter((r) => r.country === 'Chile').slice(0, 3); return { records: [toRec(a[0], { Status: 'Interested' }), toRec(a[1], { 'NEXT Status': 'Contacted' }), { ...toRec({ id: 'newrec1', company: 'Brand New SA', country: 'Chile', brands: 'Zimed' }), createdAt: Date.parse('2026-10-12T14:00:00Z') }], total: 3 }; },
    company_record: () => ({ id: params.cid, createdAt: 1, updatedAt: 2, fields: { Name: 'Test Co', Country: ['Chile'], Status: 'Lead', Brand: ['Zimed', 'Stryker'], 'Phone number': ['+56 2 2345 6789', '22 111 2222'], Email: ['info@test.cl'], Website: 'https://test.cl', LinkedIn: 'https://www.linkedin.com/company/test', Instagram: 'https://instagram.com/test' } }),
    company_contacts: () => ({ records: [{ id: 'c1', fields: { Name: 'Ariel Viani', Title: 'Sales Manager', 'Contact type': 'Ortho Lead', Email: ['ariel@helico.cl'], 'Phone number': ['+56 9 1234 5678', '22 345 6789'], LinkedIn: 'https://www.linkedin.com/in/ariel', 'Last interaction date': 1783000000000 } }, { id: 'c2', fields: { Name: 'No Link', LinkedIn: '0', 'Phone number': ['n/a'] } }], total: 2 }),
    company_timeline: () => ({ events: [{ id: 'e1', timeISO: '2026-10-10T10:00:00Z', type: 'comment', text: 'First comment line\nSecond line\nThird line\nFourth line' }, { id: 'e2', timeISO: '2026-10-12T10:00:00Z', type: 'call', call: { text: 'Spoke' } }, { id: 'e3', timeISO: '2026-10-13T10:00:00Z', type: 'campaign_email', campaignName: 'C1', replyMsgsCount: 0 }, { id: 'e4', timeISO: '2026-10-14T10:00:00Z', type: 'campaign_email', campaignName: 'C2', replyMsgsCount: 1 }] }),
    company_fields: () => ({ fields: [{ name: 'Status', presets: ['Lead', 'Contacted', 'Interested'] }, { name: 'NEXT Status', presets: ['Enriched', 'Contacted', 'Promising'] }, { name: 'Motion Status', presets: ['Target', 'Contacted'] }, { name: 'Category', presets: ['Ortho', 'Not Ortho'] }, { name: 'Tags', presets: ['Contacting', 'Whatsapp Contacted'] }] }),
    medint_assign: () => ({ records: [{ id: 'ra', createdAt: 1, fields: { Person: 'Luz', 'Rule type': 'Country', Value: 'CL', 'Country tags': 'chile', Active: 'Active', Notes: 'Chile' } }, { id: 'rb', createdAt: 2, fields: { Person: 'Kavi', 'Rule type': 'Company', Value: 'Helico', Companies: ['6908ae29847fe001cd52bfef'], Active: 'Active' } }] }),
    medint_people: () => ({ records: [{ id: 'pp1', fields: { Name: 'Kavi', Email: 'hi@kavikaplan.com', Role: 'House', Active: 'Active', 'Default mailbox': 'hi@kavikaplan.com', 'Default WhatsApp': '+507 8215514' } }, { id: 'pp2', fields: { Name: 'Luz', Email: 'export@kavikaplan.com', Role: 'Person', Active: 'Active', 'Default mailbox': 'export@kavikaplan.com', 'Default WhatsApp': '+507 8215514' } }] }),
    medint_log: () => ({ records: [{ id: 'l2', fields: { Epoch: Date.now() - 864e5 - 3600e3, Time: new Date().toISOString(), Person: 'Luz', Action: 'Call', Outcome: 'No answer', 'Company name': 'ENFISA', Country: 'Chile', Text: 'no answer' } }, { id: 'l3', fields: { Epoch: Date.now() - 1800e3, Person: 'Kavi', Action: 'WhatsApp', 'Company name': 'ARENYS', Country: 'Peru', Text: 'hola' } }, { id: 'l1', fields: { Epoch: Date.now() - 3600e3, Time: new Date().toISOString(), Person: 'Luz', Action: 'Call', Outcome: 'Spoke', 'Company name': 'IMPORTADORA HELICO LTDA', Company: ['6908ae29847fe001cd52bfef'], Text: 'Interested in nails' } }] }),
    rel_contacts: () => ({ records: [{ id: 'p1', fields: { Name: 'Rafael González', Company: ['6908ae29847fe001cd52bfef', '69cfb441584e67381950c14f'], Email: ['rafa@x.com'] } }] }),
    comment_scan: () => ({ events: [{ recordId: '6908ae29847fe001cd52bfef', timeISO: '2026-10-12T10:00:00Z', type: 'comment', creator: { name: 'Hasan Ram' }, text: 'Called, spoke with contacto: Juan Pérez, compras, +56 9 8765 4321, juan@helico.cl' }, { recordId: '6908ae29847fe001cd52bfef', timeISO: '2026-10-11T10:00:00Z', type: 'comment', text: 'No answer' }] }),
    contact_history: () => ({ events: [{ recordId: '6908ae29847fe001cd52bfef', time: Date.now() - 3 * 3600e3, timeISO: new Date(Date.now() - 3 * 3600e3).toISOString(), type: 'chat', chat: { status: 'NOT_REPLIED', name: '56911112222', lastMessage: { body: 'Hola, ¿cuándo nos visitan?' } } }, { recordId: '669d24fc5eef3e6da0609ccb', time: Date.now() - 5 * 864e5, timeISO: new Date(Date.now() - 5 * 864e5).toISOString(), type: 'call', creator: { name: 'Hasan', email: 'export1@next-shoulder.com' } }] }),
    country_regs: () => ({ records: [{ id: 'c1', fields: { Name: 'Chile', 'Registration Dunitech': 'Collecting documents', 'Registration holder': ['6908ae29847fe001cd52bfef'], 'Registration notes': 'Sent CE + ISO' } }] }),
    deals: () => ({ records: [{ id: 'd1', fields: { Name: 'Helico – Next Shoulder', Company: ['6908ae29847fe001cd52bfef'], Stage: 'Negotiating', 'Deal amount': 20000, Probability: 0.5, 'Close date': Date.UTC(2026, 10, 30), Catagory: 'NEXT', 'Next Steps': 'Send price list' } }, { id: 'd2', fields: { Name: 'Old won', Company: ['6908ae29847fe001cd52bfef'], Stage: 'Won', 'Deal amount': 5000 } }] }),
    activity_2w: () => ({ events: [{ id: 'a1', timeISO: new Date(Date.now() - 2 * 864e5).toISOString(), type: 'call', recordId: '6908ae29847fe001cd52bfef', creator: { name: 'Hasan Ram', email: 'export@kavikaplan.com' } }, { id: 'a2', timeISO: new Date(Date.now() - 3 * 864e5).toISOString(), type: 'email', recordId: '6908ae29847fe001cd52bfef', creator: { name: 'Kavi Kaplan', email: 'hi@kavikaplan.com' } }, { id: 'a3', timeISO: new Date(Date.now() - 9 * 864e5).toISOString(), type: 'email', recordId: 'x', creator: { email: 'buyer@co.cl' } }, { id: 'a4', timeISO: new Date(Date.now() - 1 * 864e5).toISOString(), type: 'calendar', recordId: 'x', creator: { name: 'Kavi Kaplan', email: 'hi@kavikaplan.com' } }] }),
    company_schema: () => ({ fields: [{ name: 'Name', type: 'singleLineText' }, { name: 'City', type: 'tag', multiValue: true }, { name: 'Category', type: 'dropdown', presets: ['Ortho', 'Not Ortho'] }, { name: 'Brand', type: 'tag', multiValue: true, presets: ['Zimed'] }, { name: 'Phone number', type: 'phoneNumber', multiValue: true }, { name: 'Email', type: 'email', multiValue: true }, { name: 'Website', type: 'website' }, { name: 'Products', type: 'singleLineText' }, { name: 'Foundation Year', type: 'number' }, { name: 'Notes', type: 'multiLineText' }, { name: 'Total Calls', type: 'totalCallLogsCount' }, { name: 'Next follow-up', type: 'date' }, { name: 'Start drip', type: 'checkbox' }, { name: 'Tags', type: 'tag', multiValue: true, presets: ['Contacting'] }] }),
    holidays: () => ({ events: [{ id: 'h1', summary: 'Columbus Day', description: 'Public holiday', start: { date: '2026-10-12' } }, { id: 'h2', summary: 'Halloween', description: 'Observance', start: { date: '2026-10-31' } }, { id: 'h3', summary: 'All Saints Day', description: 'Public holiday', start: { date: '2026-11-01' } }] }),
    calendar_events: () => ({ events: [{ id: 'ev1', summary: 'Helico Miguel 9 am', start: { dateTime: '2026-10-27T07:00:00-05:00' }, eventType: 'DEFAULT', htmlLink: 'https://calendar.google.com/x' }, { id: 'ev2', summary: 'Gemco', colorId: '8', start: { dateTime: '2026-10-28T10:00:00-05:00' }, eventType: 'DEFAULT' }, { id: 'evX', summary: 'Fanny 2:30pm', start: { dateTime: '2026-10-26T12:30:00-05:00' }, eventType: 'DEFAULT' }, { id: 'ev3', summary: 'Flight to Lima', eventType: 'FROM_GMAIL', start: { dateTime: '2026-10-15T10:00:00-05:00' } }] }),
    partner_timeline: () => ({ events: [{ id: 'e1', timeISO: '2026-10-01T10:00:00Z', type: 'comment', creator: { name: 'Kavi Kaplan' }, text: 'Asked for the trauma catalogue; follow up next week.' }, { id: 'e2', timeISO: '2026-09-20T10:00:00Z', type: 'call', creator: { name: 'Kavi Kaplan' }, call: { direction: 'outgoing', text: 'Spoke with GM' } }] }),
    partner_contacts: () => ({ records: (params.pcids || []).slice(0, 3).map((cid, i) => ({ id: 'p' + i, fields: { 'First name': 'Ana', 'Last name': 'Person' + i, Title: 'GM', Company: [cid], Email: ['ana' + i + '@x.cl'], 'Phone number': ['+56 9 1111 222' + i], LinkedIn: 'https://linkedin.com/in/ana' + i } })), total: 3 }),
    company_trade: () => ({ events: [] }),
  };
  const ds = (id) => {
    if (file[id]) return { status: 'ok', data: file[id], columns: Object.keys(file[id][0] || {}), meta: [] };
    if (calcs[id]) {
      const ins = calcs[id].inputs.map((i) => ds(i));
      if (ins.some((x) => x.status === 'error')) return { status: 'error', data: [], message: 'input failed' };
      if (ins.some((x) => x.status !== 'ok')) return { status: 'loading', data: [] };
      const key = JSON.stringify(calcs[id].inputs.map((i) => (state[i] && state[i].v) || 0)) + JSON.stringify(params);
      if (state[id] && state[id].key === key) return state[id].r;
      try { const out = calcs[id].fn(...ins.map((x) => x.data)); const r = { status: 'ok', data: out, columns: Array.isArray(out) && out[0] ? Object.keys(out[0]) : [], meta: [] }; state[id] = { key, r, v: (state[id] ? state[id].v : 0) + 1 }; return r; }
      catch (e) { errors.push(`calc ${id}: ${e.stack}`); return { status: 'error', data: [] }; }
    }
    if (answers[id]) {
      const k = JSON.stringify([params.tags, params.cid, params.brand, params.pcids, params.ncid, params.hol_cc]);
      if (state[id] && state[id].k === k) return state[id].r;
      if (state[id] && state[id].loading === k) return { status: 'loading', data: [] };
      state[id] = { loading: k, v: (state[id] ? state[id].v : 0) };
      pending++;
      (async () => {
        let r;
        try {
          const answer = answers[id]({});
          const args = id === 'pipeline_changes' ? { since: SNAP, folderId: 'x' } : {};
          const out = loaders[id] ? await loaders[id].fn({ answer: JSON.stringify(answer), call: async () => JSON.stringify({ records: [] }), args, read: {} }) : answer;
          const data = Array.isArray(out) ? out : out.data || out.rows;
          r = { status: 'ok', data, columns: out.columns || [], meta: out.meta || [], cut: out.cut };
        } catch (e) { errors.push(`loader ${id}: ${e.stack}`); r = { status: 'error', data: [], message: e.message }; }
        state[id] = { k, r, v: state[id].v + 1 }; pending--; schedule();
      })();
      return { status: 'loading', data: [] };
    }
    return { status: 'missing', data: [] };
  };
  w.dash = {
    data: (id) => ds(id), onData: (f) => { cbs.push(f); try { f(); } catch (e) { errors.push('onData first: ' + e.stack); } },
    calc: (id, def) => { calcs[id] = def; }, loader: (id, def) => { loaders[id] = def; },
    params: () => ({ ...params }), setParams: (p) => { params = { ...params, ...p }; for (const k of Object.keys(p)) if (p[k] === null) delete params[k]; schedule(); }, resetParams: () => { params = {}; schedule(); },
    setLink: (l) => { calls.push(['link', l]); }, refresh: () => {}, colors: ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8'],
  };
  const SITE = opts.site != null ? opts.site : process.env.SITE === '1';
  if (SITE) { // website mode: the app sees the website's boot, connector shim and /api endpoints (all faked here)
    w.cmBoot = async () => {};
    const store = {}; const txt = (o) => ({ content: [{ type: 'text', text: JSON.stringify(o) }] });
    const fakeNH = async (tool, args) => { calls.push(['nh', tool, args]); if (tool === 'get_record') return txt({ id: args.recordId, createdAt: 1, updatedAt: 2, fields: { Name: 'Test Co' } }); if (/timeline/.test(tool)) return txt({ events: [] }); if (/^(create|update)_record/.test(tool)) return txt({ id: 'new' + calls.length, fields: args.fields || {} }); return txt({ records: [], total: 0 }); };
    const site = { mcp: { callTool: (srv, tool, args) => fakeNH(tool, args || {}) }, db: { doc: (p) => ({ get: async () => store[p], set: async (v) => { store[p] = v; } }) }, user: { id: async () => 'this-browser', isOwner: () => true, canEdit: () => true }, downloads: { save: async () => {} } };
    w.claude = { use: async (k) => site[k] || null };
    const J = (o, st = 200) => Promise.resolve(new (w.Response || globalThis.Response)(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json' } }));
    w.fetch = async (u, o = {}) => { u = String(u); calls.push(['fetch', u, o.method || 'GET']);
      if (u.startsWith('/api/me')) return J({ email: 'hi@kavikaplan.com', name: 'Kavi', role: 'House', active: true });
      if (u.startsWith('/api/medint')) return (o.method || 'GET') !== 'GET' ? J({ ok: true }) : /daily=1/.test(u) ? J({ rows: [], plans: [], found: [] }) : J({ counts: [], companies: [], meetings: [], list: [], rows: [], countries: [] });
      if (u.startsWith('/api/gmail/accounts')) return J({ accounts: [], role: 'House' });
      if (u.startsWith('/api/gmail')) return J({ messages: [], threads: [], labels: [] });
      if (u.startsWith('/api/files/_templates')) return J([]);
      if (u.startsWith('/api/files')) return J({ files: [] });
      if (u.startsWith('/api/prefs')) return J({ exists: false });
      if (u.startsWith('/api/avatar')) return J({ error: 'none' }, 404);
      if (u.startsWith('/api/summarize')) return J({ text: 'Short summary.' });
      if (u.startsWith('/api/enrich')) return J({ items: [], search_ready: true });
      if (u.startsWith('/api/qualify')) return J({ verdict: 'maybe', reason: 'test' });
      if (u.startsWith('/api/leads')) return J({ people: [], companies: [] });
      if (u.startsWith('/api/health')) return J({ services: [] });
      if (u.startsWith('/api/nethunt')) { const b = JSON.parse(o.body || '{}'); return J(await fakeNH(b.tool, b.args || {})); }
      return J({ error: 'not faked' }, 404); };
    if (opts.claude) { const own = opts.claude(calls); w.claude = { use: async (k) => (k === 'mcp' ? (await own.use('mcp')) || site.mcp : site[k] || (await own.use(k))) }; }
  } else if (opts.claude) w.claude = opts.claude(calls);
  const root = w.document.getElementById('dash-root');
  // split scripts out
  const scripts = []; const body = html.replace(/<script>([\s\S]*?)<\/script>/g, (m, t) => { scripts.push(t); return ''; });
  root.innerHTML = body;
  for (const t of scripts) { try { w.eval('(function(){' + t + '\n})()'); } catch (e) { errors.push('script: ' + e.stack); } }
  const settle = async (ms = 60) => { for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, ms)); if (!pending) break; } await new Promise((r) => setTimeout(r, ms)); };
  return { w, d: w.document, errors, calls, settle, params: () => params, setParams: w.dash.setParams };
}
module.exports = { run, file };
