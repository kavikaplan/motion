/**
 * Medint access: who is logged in (Cloudflare Access email) → House sees everything,
 * a Person sees only the companies assigned to them by the rules in NetHunt “Medint Assignments”.
 * The same rules run in the app (app2.js → assigneeOf) so both agree.
 */
export const F = { COMPANIES: '6682e9b8b6386800f586c0b2', CONTACTS: '6682e9b8b6386800f586c0b0', DEALS: '6682e9b8b6386800f586c0af', COUNTRIES: '673c960008039266ccd2ead3', PEOPLE: '6ad610066a38c15893c9d431', LOG: '6ad6100defa2051dc4ad1ab7', ASSIGN: '6ad6101118904c2628e16827' };
const TTL = 5 * 60 * 1000;
const cache = new Map(); // key → { at, value }
const cached = async (key, fn) => { const c = cache.get(key); if (c && Date.now() - c.at < TTL) return c.value; const value = await fn(); cache.set(key, { at: Date.now(), value }); return value; };
export const clearAccessCache = () => cache.clear();
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
  const people = await cached('people', () => all(callTool, { folderId: F.PEOPLE, fieldKeys: 'label', filter: {}, limit: 200 }, 2));
  const rec = people.find((r) => low(r.fields && r.fields.Email) === e);
  if (!rec) return { email: e, name: e.split('@')[0], role: house.includes(e) ? 'House' : 'Unknown', active: house.includes(e) };
  const f = rec.fields || {};
  const boxes = [f['Default mailbox'], ...String(f['Other mailboxes'] || '').split(/[\s,;|]+/)].map(low).filter((x) => /@/.test(x));
  return { email: e, name: f.Name || e, role: f.Role === 'House' || house.includes(e) ? 'House' : 'Person', active: f.Active !== 'Paused', mailboxes: [...new Set(boxes)] };
}
export async function rules(callTool) {
  return cached('rules', async () => (await all(callTool, { folderId: F.ASSIGN, fieldKeys: 'label', filter: {}, limit: 500 }, 2))
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
// every company id this person works on (re-computed every few minutes)
export async function allowedSet(callTool, person) {
  return cached(`allow:${low(person)}`, async () => {
    const rs = await rules(callTool); const mine = rs.filter((r) => low(r.person) === low(person)); const cand = new Map();
    const add = (recs) => recs.forEach((r) => cand.set(r.id, r.fields || {}));
    for (const r of mine) {
      if (r.type === 'Company' || r.type === 'Batch') { const todo = r.ids.slice(0, 500).filter((id) => !cand.has(id)); for (let k = 0; k < todo.length; k += 10) { const got = await Promise.all(todo.slice(k, k + 10).map((id) => callTool('get_record', { folderId: F.COMPANIES, recordId: id, fieldKeys: 'label' }).then(parse).catch(() => null))); got.forEach((g) => g && g.id && cand.set(g.id, g.fields || {})); } } // 10 at a time
      else if (r.type === 'Tag') add(await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { Tags: { _any: [r.value] } }, limit: 1000 }));
      else if (r.type === 'Status') { const v = r.value.replace(/^(next|motion)?\s*status:\s*/i, ''); for (const k of ['Status', 'NEXT Status', 'Motion Status']) add(await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { [k]: { _eq: v } }, limit: 1000 })); }
      else if (r.tags.length) add(await all(callTool, { folderId: F.COMPANIES, fieldKeys: 'label', filter: { Country: { _any: r.tags } }, limit: 1000 }));
    }
    const set = new Set(); cand.forEach((f, id) => { if (low(assigneeOf(id, f, rs)) === low(person)) set.add(id); });
    return set;
  });
}
