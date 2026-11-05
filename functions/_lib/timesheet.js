/**
 * ⚡ Medint work → Task Timesheet (teamtasks, Supabase).
 * Sessions are made from the WORK itself — every call, WhatsApp, email, note, status change, meeting, catalogue, deal or found detail
 * Medint logged (D1 table `events`), wherever it was done (Power hour, company page, Inbox…). Opening and closing Power hour records nothing.
 *   · actions less than 20 minutes apart are one session; start = 5 min before the first action, end = 5 min after the last
 *   · a session is sent once nobody in it acted for 30 minutes (so it is complete), and only if it has 2+ actions and lasts 10+ minutes
 *   · each session becomes ONE finished timesheet block on that person's day: “⚡ Sales · Dunitech · 12 companies”, labelled Next / Dunitech
 *   · D1 table `ts_sent` remembers what went out — nothing is sent twice, and late actions that fall inside a sent session are not re-sent
 * Settings (Cloudflare secrets), either
 *   · TT_FUNCTION_URL (https://<project>.supabase.co/functions/v1/medint-sessions) + TT_FUNCTION_TOKEN — the timesheet's own small function
 *     (used when the database is managed by Lovable and its secret key can't be copied out), or
 *   · TT_SUPABASE_URL (https://<project>.supabase.co) + TT_SUPABASE_SERVICE_KEY (the service_role key) — straight to the database.
 * Runs from the 5-minute mail cron (/api/gmail/cron) and from House's ↻ in 🩺 API status (/api/timesheet).
 */
export const WORK = [ 'Call', 'WhatsApp', 'Email', 'Comment', 'Status', 'Meeting', 'Catalogue', 'Deal', 'Contact' ];
// “Other” lines that are real work too (research, data, notes) — the rest (👏, skips, exports, day plans…) is not
export const OTHER_WORK = [ [ /^⚡ lead research run/, 'lead research run' ], [ /^imported (lead list|Lead research)/i, 'list imported' ], [ /^added to NetHunt/, 'company added to NetHunt' ],
  [ /^KOL (search|added)/, 'KOL research' ], [ /^🎯 event researched/, 'event researched' ], [ /manufacturer branch/, 'company checked' ], [ /^client report/, 'client report' ],
  [ /^status →|follow ?up/i, 'status / follow-up set' ], [ /^task done/, 'task done' ], [ /^(manufacturer|country) note/, 'research note' ] ];
const otherKind = (o) => { const x = OTHER_WORK.find(([re]) => re.test(String(o || ''))); return x ? x[1] : ''; };
// sent by Medint on its own (📣 campaign steps, emails scheduled earlier) — not time someone spent at that moment
const AUTO = (o) => /^📣|\(scheduled\)/.test(String(o || ''));
// a line that covers time before it (a ⚡ lead research run says how long it took)
const durOf = (o) => { const m = String(o || '').match(/· (\d{1,3}) min$/); return m ? Math.min(240, Number(m[1])) * 6e4 : 0; };
const GAP = 20 * 60e3, IDLE = 30 * 60e3, PAD = 5 * 60e3, MIN_MS = 10 * 60e3, BACK = 36 * 36e5;
const ICON = { Call: 'call', WhatsApp: 'WhatsApp', Email: 'email', Comment: 'note', Status: 'status change', Meeting: 'meeting', Catalogue: 'catalogue', Deal: 'deal', Contact: 'detail found' };
const BRAND = { next: 'Next', dunitech: 'Dunitech', motion: 'Motion' };
const low = (v) => String(v ?? '').trim().toLowerCase();
const kid = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return `s${(h >>> 0).toString(36)}${k.length.toString(36)}`; }; // a short id for the session (no email in the timesheet)

// pure: events (sorted by time) of ONE person → sessions
export function sessionsOf(evs, now) {
  const out = []; let cur = null;
  for (const e of evs) {
    const st = e.epoch - (e.dur || 0);
    if (cur && st - cur.last <= GAP) { cur.last = Math.max(cur.last, e.epoch); cur.first = Math.min(cur.first, st); cur.evs.push(e); continue; }
    cur && out.push(cur); cur = { first: st, last: e.epoch, evs: [ e ] };
  }
  cur && out.push(cur);
  return out.map((s) => ({ ...s, start: s.first - PAD, end: s.last + PAD, open: now - s.last < IDLE }))
    .filter((s) => !s.open && (s.evs.length >= 2 || s.evs.some((e) => e.dur)) && s.end - s.start >= MIN_MS);
}
// pure: what the block says
export function describe(s) {
  const cos = new Map(); const acts = {}; const br = {};
  s.evs.forEach((e) => { e.company_id && cos.set(e.company_id, e.company || e.company_id); const a = e.action === 'Other' ? otherKind(e.outcome) || 'other' : e.action; acts[a] = (acts[a] || 0) + 1; const b = BRAND[low(e.brand)]; b && (br[b] = (br[b] || 0) + 1); });
  const sales = s.evs.some((e) => [ 'Call', 'WhatsApp', 'Email', 'Meeting', 'Status', 'Catalogue', 'Deal' ].includes(e.action));
  const brands = Object.entries(br).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  const n = cos.size; const mins = Math.round((s.end - s.start) / 6e4);
  const title = `${sales ? '⚡ Sales' : '🔬 Research & data'}${brands.length === 1 ? ` · ${brands[0]}` : brands.length > 1 ? ` · ${brands.join(' & ')}` : ''}${n ? ` · ${n} compan${n === 1 ? 'y' : 'ies'}` : ''}`;
  const parts = Object.entries(acts).sort((a, b) => b[1] - a[1]).map(([a, k]) => (ICON[a] ? `${k} ${ICON[a]}${k === 1 || /s$/.test(ICON[a]) ? '' : 's'}` : `${k} × ${a}`));
  const names = [ ...cos.values() ].slice(0, 20);
  const details = `${parts.join(' · ')}${names.length ? `\nCompanies: ${names.join(', ')}${cos.size > names.length ? ` and ${cos.size - names.length} more` : ''}` : ''}\n\nRecorded automatically by Medint from the real work (calls, WhatsApps, emails, notes, status changes, details found, research…), ${mins} min.`;
  return { title, details, brands, mins, n };
}
const local = (ms, tz) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms)).map((x) => [ x.type, x.value ])); return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }; };

async function sb(env, path, opt = {}) {
  const r = await fetch(`${String(env.TT_SUPABASE_URL).replace(/\/$/, '')}/rest/v1/${path}`, { ...opt, headers: { apikey: env.TT_SUPABASE_SERVICE_KEY, authorization: `Bearer ${env.TT_SUPABASE_SERVICE_KEY}`, 'content-type': 'application/json', ...(opt.headers || {}) }, signal: AbortSignal.timeout(15000) });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  if (!r.ok) throw new Error(`Timesheet (Supabase) ${r.status}: ${(j && (j.message || j.error || j.hint)) || String(t).slice(0, 160)}`);
  return j;
}
// the two ways in, behind the same three calls: people · labels · add (one finished block)
export const ttReady = (env) => !!((env.TT_FUNCTION_URL && env.TT_FUNCTION_TOKEN) || (env.TT_SUPABASE_URL && env.TT_SUPABASE_SERVICE_KEY));
export function ttClient(env) {
  if (env.TT_FUNCTION_URL && env.TT_FUNCTION_TOKEN) {
    const call = async (body) => { const r = await fetch(env.TT_FUNCTION_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-medint-token': env.TT_FUNCTION_TOKEN }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { j = t; } if (!r.ok) throw new Error(`Timesheet function ${r.status}: ${(j && j.error) || String(t).slice(0, 160)}`); return j; };
    return { people: () => call({ action: 'people' }), labels: () => call({ action: 'labels' }), add: (x) => call({ action: 'add_session', ...x }) };
  }
  return {
    people: () => sb(env, 'profiles?select=id,name,email,timezone'),
    labels: () => sb(env, 'task_labels?select=id,name'),
    add: async (x) => {
      const [ task ] = await sb(env, 'tasks', { method: 'POST', headers: { prefer: 'return=representation' }, body: JSON.stringify({ title: x.title, details: `${x.details}\n\nmedint:${x.key}`, priority: 'none', assignee: x.assignee, created_by: x.assignee, date: x.date, time: x.time, duration_min: x.duration_min, recurrence: { pattern: 'none' }, subtasks: [], created_in_app: true, needs_google_patch: false, sync_status: 'ok', mentions: [], shared_with: [] }) });
      await sb(env, 'task_overrides?on_conflict=instance_key', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ instance_key: `${task.id}@${x.date}`, task_id: task.id, done: true }) });
      (x.label_ids || []).length && await sb(env, 'task_label_assignments', { method: 'POST', body: JSON.stringify(x.label_ids.map((label_id) => ({ task_id: task.id, label_id }))) }).catch(() => {});
      return { id: task.id };
    },
  };
}
let made = false;
async function table(db) { if (made) return; await db.prepare('CREATE TABLE IF NOT EXISTS ts_sent (k TEXT PRIMARY KEY, who TEXT, start INTEGER, end INTEGER, task_id TEXT, title TEXT, at INTEGER, note TEXT)').run(); made = true; }

// one run: every finished, unsent session of the last 36 hours → the timesheet. Returns what happened.
export async function tsSync(env, opt = {}) {
  if (!ttReady(env)) return { ok: false, code: 'not_configured', note: 'add TT_FUNCTION_URL + TT_FUNCTION_TOKEN (or TT_SUPABASE_URL + TT_SUPABASE_SERVICE_KEY) in Cloudflare' };
  const TT = ttClient(env);
  const db = env.MEDINT_DB; if (!db) return { ok: false, code: 'no_db' };
  await table(db); const now = opt.now || Date.now();
  const R = await db.prepare(`SELECT epoch, person, email, login, action, outcome, company_id, company, ${opt.noBrand ? "'' AS brand" : 'brand'} FROM events WHERE voided = 0 AND epoch >= ? AND epoch <= ? AND action IN (${[ ...WORK, 'Other' ].map(() => '?').join(',')}) ORDER BY epoch`).bind(now - BACK, now, ...WORK, 'Other').all().catch(async (e) => { if (/no such column: brand/.test(String(e.message || e)) && !opt.noBrand) return { results: null }; throw e; });
  if (!R.results) return tsSync(env, { ...opt, noBrand: !0 });
  const sent = (await db.prepare('SELECT k, who, start, end FROM ts_sent WHERE end >= ?').bind(now - BACK - 864e5).all()).results || [];
  const rows = (R.results || []).filter((e) => !AUTO(e.outcome) && (e.action !== 'Other' || otherKind(e.outcome))).map((e) => ({ ...e, dur: e.action === 'Other' ? durOf(e.outcome) : 0 }));
  // a bulk status change (5+ companies changed within 2 minutes, nothing else done on them) is an edit, not work time with those companies
  { const sb0 = new Map(); rows.forEach((e) => { if (e.action !== 'Status') return; const k = low(e.email) || low(e.login) || low(e.person); sb0.has(k) || sb0.set(k, []); sb0.get(k).push(e); });
    const other = new Set(rows.filter((e) => e.action !== 'Status').map((e) => `${low(e.email) || low(e.login) || low(e.person)}|${e.company_id}`)); const drop = new Set();
    sb0.forEach((L, k) => { L.sort((a, b) => a.epoch - b.epoch); for (let i = 0; i < L.length;) { let j = i; while (j + 1 < L.length && L[j + 1].epoch - L[i].epoch <= 12e4) j++; const grp = L.slice(i, j + 1).filter((e) => !other.has(`${k}|${e.company_id}`)); if (new Set(grp.map((e) => e.company_id)).size >= 5) grp.forEach((e) => drop.add(e)); i = j + 1; } });
    drop.size && rows.splice(0, rows.length, ...rows.filter((e) => !drop.has(e))); }
  const byWho = new Map(); rows.forEach((e) => { const k = low(e.email) || low(e.login) || low(e.person); if (!k) return; byWho.has(k) || byWho.set(k, []); byWho.get(k).push(e); });
  let people = null, labels = null; const out = { ok: true, sent: [], skipped: [] };
  for (const [who, evs] of byWho) {
    for (const s of sessionsOf(evs, now)) {
      const key = `${who}|${s.first}`;
      if (sent.some((x) => x.k === key || (x.who === who && s.start < x.end && s.end > x.start))) continue; // already sent (or overlaps one that was)
      people = people || await TT.people();
      const nm = low(evs[0].person); const p = people.find((x) => low(x.email) === who || low(x.email) === low(evs[0].login)) || people.find((x) => low(x.name) === nm || low(x.name).split(' ')[0] === nm.split(' ')[0]);
      if (!p) { out.skipped.push(`${evs[0].person || who}: no matching person in the timesheet`); await db.prepare('INSERT OR IGNORE INTO ts_sent (k, who, start, end, task_id, title, at, note) VALUES (?,?,?,?,?,?,?,?)').bind(key, who, s.start, s.end, '', '', now, 'no person').run(); continue; }
      const d = describe(s); const L = local(s.start, p.timezone);
      let label_ids = []; if (d.brands.length) { labels = labels || await TT.labels().catch(() => []); label_ids = d.brands.map((b) => ((labels || []).find((l) => low(l.name) === low(b)) || {}).id).filter(Boolean); }
      const task = await TT.add({ key: kid(key), assignee: p.id, title: d.title, details: d.details, date: L.date, time: L.time, duration_min: Math.max(10, Math.round(d.mins / 5) * 5), label_ids });
      await db.prepare('INSERT OR IGNORE INTO ts_sent (k, who, start, end, task_id, title, at, note) VALUES (?,?,?,?,?,?,?,?)').bind(key, who, s.start, s.end, task.id, d.title, now, `${p.name} · ${L.date} ${L.time}`).run();
      sent.push({ k: key, who, start: s.start, end: s.end }); out.sent.push(`${p.name}: ${d.title} · ${L.date} ${L.time} · ${d.mins} min`);
    }
  }
  return out;
}
