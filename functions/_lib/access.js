/**
 * Medint access: who is logged in (Cloudflare Access email) → House sees everything,
 * a Person sees only the companies assigned to them by the rules in NetHunt “Medint Assignments”.
 * The same rules run in the app (app2.js → assigneeOf) so both agree.
 */
export const F = { COMPANIES: '6682e9b8b6386800f586c0b2', CONTACTS: '6682e9b8b6386800f586c0b0', DEALS: '6682e9b8b6386800f586c0af', COUNTRIES: '673c960008039266ccd2ead3', PEOPLE: '6ad610066a38c15893c9d431', LOG: '6ad6100defa2051dc4ad1ab7', ASSIGN: '6ad6101118904c2628e16827' };
const TTL = 5 * 60 * 1000;
const cache = new Map(); // key → { at, value }
const cached = (key, fn) => { const c = cache.get(key); if (c && Date.now() - c.at < TTL) return c.value; const value = Promise.resolve().then(fn); cache.set(key, { at: Date.now(), value }); value.catch(() => { if (cache.get(key) && cache.get(key).value === value) cache.delete(key); }); return value; };
export const clearAccessCache = (env) => { cache.clear(); try { env && env.MEDINT_DB && env.MEDINT_DB.prepare("DELETE FROM kv WHERE k IN ('people', 'rules') OR k LIKE 'allow:%'").run().catch(() => {}); } catch { /* none */ } };
// survives cold starts: the people list is kept in D1 for 10 minutes, so most requests skip the NetHunt call
let kvMade = false;
async function dbCached(env, key, ttl, fn, bg) { const db = env && env.MEDINT_DB; if (!db) return fn(); let old = null; try { if (!kvMade) { await db.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, at INTEGER)').run(); kvMade = true; } const r = await db.prepare('SELECT v, at FROM kv WHERE k = ?').bind(key).first(); if (r) { old = JSON.parse(r.v); if (Date.now() - r.at < ttl) return old; if (bg && Date.now() - r.at < 24 * 36e5) { /* older than ttl: answer with it now, refresh after the answer has gone out */ bg((async () => { try { const v = await fn(); await db.prepare('INSERT INTO kv (k, v, at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at').bind(key, JSON.stringify(v), Date.now()).run(); } catch { /* keep the old one */ } })()); return old; } } } catch { /* no cache */ }
  let v; try { v = await fn(); } catch (e) { if (old != null) return old; throw e; } try { await db.prepare('INSERT INTO kv (k, v, at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at').bind(key, JSON.stringify(v), Date.now()).run(); } catch { /* fine */ } return v; }
const parse = (r) => { const t = ((r && r.content) || []).map((c) => c.text || '').join(''); try { return JSON.parse(t); } catch { return null; } };
const low = (v) => String(v ?? '').trim().toLowerCase();
const list = (v) => [].concat(v ?? []).flatMap((x) => (typeof x === 'string' ? x.split(/\n| \| /) : [x])).map((x) => (x && x.id ? x.id : x)).filter((x) => x !== '' && x != null);
const SPEC = { Company: 5, Batch: 4, Status: 3, Tag: 3, Country: 2, Region: 1 };

async function all(callTool, args, pages = 10) {
  const out = []; let cursor; let n = 0;
  do { const p = parse(await callTool('filter_records', { ...args, ...(cursor ? { cursor } : {}) })) || {}; out.push(...(p.records || [])); cursor = p.nextCursor; n += 1; } while (cursor && n < pages);
  return out;
}
export async function whoIs(env, callTool, email) {
  const e = low(email); const house = low(env.MEDINT_HOUSE || 'hi@kavikaplan.com').split(',').map((x) => x.trim());
  const people = await cached('people', () => dbCached(env, 'people', 10 * 60e3, () => all(callTool, { folderId: F.PEOPLE, fieldKeys: 'label', filter: {}, limit: 200 }, 2)));
  const rec = people.find((r) => low(r.fields && r.fields.Email) === e);
  if (!rec) return { email: e, name: e.split('@')[0], role: house.includes(e) ? 'House' : 'Unknown', active: house.includes(e) };
  const f = rec.fields || {};
  const boxes = [f['Default mailbox'], ...String(f['Other mailboxes'] || '').split(/[\s,;|]+/)].map(low).filter((x) => /@/.test(x));
  return { email: e, name: f.Name || e, role: f.Role ? (f.Role === 'House' ? 'House' : 'Person') : house.includes(e) ? 'House' : 'Person', active: f.Active !== 'Paused', mailboxes: [...new Set(boxes)] };
}
// login email → the person's name today (a renamed person keeps their history: e.g. team@ was “Team” before it became “Yaman”)
export async function peopleNames(env, callTool) {
  const people = await cached('people', () => dbCached(env, 'people', 10 * 60e3, () => all(callTool, { folderId: F.PEOPLE, fieldKeys: 'label', filter: {}, limit: 200 }, 2)));
  const m = new Map(); people.forEach((r) => { const f = r.fields || {}; const e = low(f.Email); e && f.Name && m.set(e, String(f.Name)); }); return m;
}
export async function rules(callTool, env) {
  return cached('rules', async () => (await dbCached(env, 'rules', 10 * 60e3, () => all(callTool, { folderId: F.ASSIGN, fieldKeys: 'label', filter: {}, limit: 500 }, 2)))
    .map((r) => ({ id: r.id, created: r.createdAt || 0, ...(r.fields || {}) }))
    .filter((r) => r.Active !== 'Paused' && r.Person && SPEC[r['Rule type']])
    .map((r) => ({ id: r.id, created: r.created, person: r.Person, type: r['Rule type'], value: r.Value || '', tags: low(r['Country tags']).split(/\n|,/).map((x) => x.trim()).filter(Boolean), ids: list(r.Companies) })));
}
// the person a company belongs to: the most specific matching rule wins (ties: the older rule)
export function assigneeOf(id, f, rs) {
  let best = null;
  const ctry = list(f.Country).map(low); const tags = list(f.Tags).map(low); const sts = ['Status', 'NEXT Status', 'Motion Status'].map((k) => low(f[k])).filter(Boolean);
  for (const r of rs) {
    let hit = false;
    if (r.type === 'Company' || r.type === 'Batch') hit = r.ids.includes(id);
    else if (r.type === 'Status') { const v = low(r.value.replace(/^(next|motion)?\s*status:\s*/i, '')); hit = sts.includes(v); }
    else if (r.type === 'Tag') hit = tags.includes(low(r.value));
    else hit = ctry.some((c) => r.tags.includes(c));
    if (hit && (!best || SPEC[r.type] > SPEC[best.type] || (SPEC[r.type] === SPEC[best.type] && r.created < best.created))) best = r;
  }
  return best ? best.person : null;
}
// every company id this person works on (re-computed every few minutes; an older answer is used at once while a fresh one is made)
// opt: { origin, waitUntil } — origin lets the server read the site's own data/assign_index.json; waitUntil refreshes after answering
export async function allowedSet(callTool, person, env, opt = {}) {
  const bg = opt.waitUntil ? (p) => { try { opt.waitUntil(p); } catch { /* fine */ } } : null;
  return cached(`allow:${low(person)}`, async () => new Set(await dbCached(env, `allow:${low(person)}`, 15 * 60e3, async () => [...(await allowedSet0(callTool, person, env, opt))], bg))); }
// every company with its NetHunt Country, built with the site (build.py → data/assign_index.json: [{ id, c: 'iraq-erbil|…' }]):
// country and region rules are matched against it without asking NetHunt for thousands of full records
let snapMemo = null;
export async function assignSnapshot(env, origin) {
  if (snapMemo && Date.now() - snapMemo.at < 30 * 60e3) return snapMemo.rows;
  if (!env || !env.ASSETS || !origin) return null;
  try { const r = await env.ASSETS.fetch(new Request(`${origin}/data/assign_index.json`)); if (!r.ok) return null; const rows = await r.json(); if (!Array.isArray(rows) || !rows.length) return null; snapMemo = { at: Date.now(), rows }; return rows; } catch { return null; }
}
async function allowedSet0(callTool, person, env, opt = {}) {
  const rs = await rules(callTool, env); const mine = rs.filter((r) => low(r.person) === low(person)); const cand = new Map();
  const merge = (id, f) => cand.set(id, { ...(cand.get(id) || {}), ...f });
  const snap = mine.some((r) => !(r.type === 'Company' || r.type === 'Batch' || r.type === 'Tag' || r.type === 'Status') && r.tags.length) ? await assignSnapshot(env, opt.origin) : null;
  // tag and status rules (anyone's — they can win over a country rule): the companies they match, with their fields
  const extra = new Map();
  if (snap) for (const r of rs.filter((x) => x.type === 'Tag' || x.type === 'Status')) {
    if (r.type === 'Tag') (await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { Tags: { _any: [r.value] } }, limit: 1000 }, 3)).forEach((x) => extra.set(x.id, x.fields || {}));
    else { const v = r.value.replace(/^(next|motion)?\s*status:\s*/i, ''); for (const k of ['Status', 'NEXT Status', 'Motion Status']) (await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { [k]: { _eq: v } }, limit: 1000 }, 3)).forEach((x) => extra.set(x.id, x.fields || {})); }
  }
  for (const r of mine) {
    if (r.type === 'Company' || r.type === 'Batch') r.ids.slice(0, 2000).forEach((id) => merge(id, {})); // only another Company / Batch rule can beat these: no fields needed
    else if (r.type === 'Tag') { if (snap) extra.forEach((f, id) => list(f.Tags).map(low).includes(low(r.value)) && merge(id, f)); else (await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { Tags: { _any: [r.value] } }, limit: 1000 })).forEach((x) => merge(x.id, x.fields || {})); }
    else if (r.type === 'Status') { const v = r.value.replace(/^(next|motion)?\s*status:\s*/i, ''); if (snap) extra.forEach((f, id) => ['Status', 'NEXT Status', 'Motion Status'].some((k) => low(f[k]) === low(v)) && merge(id, f)); else for (const k of ['Status', 'NEXT Status', 'Motion Status']) (await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { [k]: { _eq: v } }, limit: 1000 })).forEach((x) => merge(x.id, x.fields || {})); }
    else if (r.tags.length) {
      if (snap) snap.forEach((x) => { const cs = String(x.c || '').split('|').filter(Boolean); if (cs.some((c) => r.tags.includes(c))) merge(x.id, { Country: cs, ...(extra.get(x.id) || {}) }); });
      else (await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { Country: { _any: r.tags } }, limit: 1000 })).forEach((x) => merge(x.id, x.fields || {}));
    }
  }
  const set = new Set(); cand.forEach((f, id) => { if (low(assigneeOf(id, f, rs)) === low(person)) set.add(id); });
  return set;
}
