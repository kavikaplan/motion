/**
 * /api/nethunt — the only place that holds the NetHunt key.
 *
 * The browser sends {tool, args}. This function forwards it to NetHunt's MCP server
 * (the same tools the dashboard uses inside Claude) and returns NetHunt's answer.
 *
 * Secrets / settings (Cloudflare Pages → Settings → Variables and Secrets):
 *   NETHUNT_MCP_URL   (secret, required)  your personal NetHunt MCP server URL
 *   NETHUNT_MCP_TOKEN (secret, optional)  only if NetHunt gave you a separate token: sent as "Authorization: Bearer …"
 *   ALLOW_WRITES      (plain, optional)   "true" lets the site add companies and write fields; anything else = read-only
 *
 * Put Cloudflare Access in front of the whole site (this function included) so only your team can call it.
 */

import { F, whoIs, allowedSet, clearAccessCache } from '../_lib/access.js';

const READ_TOOLS = new Set(['filter_records', 'get_record', 'list_records', 'search_records', 'list_record_timeline', 'list_folder_timeline', 'get_record_timeline_item', 'get_folder', 'list_folders']);
const WRITE_TOOLS = new Set(['create_record', 'update_record', 'add_folder_field', 'create_record_comment', 'create_record_call_log']);
// Only the Companies and Contacts folders may be touched from the site.
const FOLDERS = new Set(['6682e9b8b6386800f586c0b2', '6682e9b8b6386800f586c0b0', '6682e9b8b6386800f586c0af', '673c960008039266ccd2ead3', '6ad610066a38c15893c9d431', '6ad6100defa2051dc4ad1ab7', '6ad6101118904c2628e16827', '6ad6c66c23cd83301a3640da', '6ad6cf34adab0048f0a964a5']); // Companies, Contacts, Deals, Countries, Medint People / Log / Assignments

let session = null; // reused while this worker instance is warm
let protocol = '2025-03-26'; // the MCP version NetHunt agrees to in initialize

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function headers(env, sid) {
  const h = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': protocol };
  if (env.NETHUNT_MCP_TOKEN) h.authorization = `Bearer ${env.NETHUNT_MCP_TOKEN}`;
  if (sid) h['mcp-session-id'] = sid;
  return h;
}

// An MCP reply is either plain JSON or a server-sent-events stream; return the JSON-RPC message with our id.
async function readReply(res, id) {
  const type = res.headers.get('content-type') || '';
  const text = await res.text();
  if (type.includes('text/event-stream')) {
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      if (!data) continue;
      try { const m = JSON.parse(data); if (m.id === id || (m.result || m.error)) return m; } catch { /* keep looking */ }
    }
    throw new Error('NetHunt sent an empty stream');
  }
  return text ? JSON.parse(text) : {};
}

async function rpc(env, method, params, sid) {
  const id = crypto.randomUUID();
  let res;
  try { res = await fetch(env.NETHUNT_MCP_URL, { method: 'POST', headers: headers(env, sid), body: JSON.stringify({ jsonrpc: '2.0', id, method, params }), signal: AbortSignal.timeout(25000) }); }
  catch (err) { const e = new Error(err && err.name === 'TimeoutError' ? 'NetHunt took too long to answer' : 'Could not reach NetHunt'); e.status = 502; throw e; }
  if (res.status === 401 || res.status === 403) { const e = new Error('NetHunt refused the key — check NETHUNT_MCP_URL / NETHUNT_MCP_TOKEN'); e.status = 401; throw e; }
  if (res.status === 404 && sid) { const e = new Error('session expired'); e.expired = true; throw e; }
  if (!res.ok) { const e = new Error(`NetHunt answered ${res.status}`); e.status = 502; throw e; }
  const msg = await readReply(res, id);
  return { msg, sid: res.headers.get('mcp-session-id') || sid };
}

async function connect(env) {
  const { msg, sid } = await rpc(env, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'country-market-dashboard', version: '1.0' } });
  if (msg.error) throw new Error(`NetHunt MCP: ${msg.error.message}`);
  if (msg.result && msg.result.protocolVersion) protocol = msg.result.protocolVersion;
  // tell the server we're ready (a notification: no reply expected)
  await fetch(env.NETHUNT_MCP_URL, { method: 'POST', headers: headers(env, sid), body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
  session = sid || '';
  return session;
}

export async function callTool(env, name, args) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const sid = session ?? await connect(env);
    try {
      const { msg } = await rpc(env, 'tools/call', { name, arguments: args }, sid || undefined);
      if (msg.error) { const e = new Error(msg.error.message || 'NetHunt error'); e.status = 502; throw e; }
      return msg.result;
    } catch (e) {
      if (e.expired && attempt === 0) { session = null; continue; }
      throw e;
    }
  }
  throw new Error('NetHunt session could not be opened');
}

export async function onRequestPost({ request, env }) {
  if (!env.NETHUNT_MCP_URL) return json({ error: 'The server has no NetHunt key yet (set NETHUNT_MCP_URL).', code: 'server_not_connected' }, 500);
  // only this website may call it (blocks other sites posting with a logged-in visitor's cookie)
  const origin = request.headers.get('origin'); const host = new URL(request.url).host;
  if (origin && new URL(origin).host !== host) return json({ error: 'Not allowed from another site', code: 'forbidden' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 512 * 1024) return json({ error: 'Request too large', code: 'bad_request' }, 413);
  let body; try { body = await request.json(); } catch { return json({ error: 'Bad request', code: 'bad_request' }, 400); }
  const tool = String(body.tool || ''); const args = body.args && typeof body.args === 'object' ? body.args : {};
  const write = WRITE_TOOLS.has(tool);
  if (!READ_TOOLS.has(tool) && !write) return json({ error: `Tool “${tool}” isn’t allowed from the website.`, code: 'not_in_manifest' }, 403);
  if (write && String(env.ALLOW_WRITES).toLowerCase() !== 'true') return json({ error: 'Writing to NetHunt is switched off on this website.', code: 'not_in_manifest' }, 403);
  if (tool !== 'list_folders' && !args.folderId) return json({ error: 'folderId is required', code: 'bad_request' }, 400);
  if (args.folderId && !FOLDERS.has(String(args.folderId))) return json({ error: 'That NetHunt folder isn’t available from the website.', code: 'not_in_manifest' }, 403);
  if (tool === 'update_record' && !args.folderId) return json({ error: 'folderId is required', code: 'bad_request' }, 400);
  // who is asking: House sees everything; a Person only the companies assigned to them
  const login = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  const nh = (n, a) => callTool(env, n, a);
  let me = { role: 'House' }; let allow = null;
  if (login) {
    try { me = await whoIs(env, nh, login); } catch { return json({ error: 'Couldn’t check your access — try again.', code: 'server_unavailable' }, 502); }
    if (me.role === 'Unknown' || !me.active) return json({ error: 'Your login isn’t active in Medint — ask House to add you under People.', code: 'forbidden' }, 403);
    if (me.role !== 'House') {
      const deny = () => json({ error: 'Not assigned to you.', code: 'forbidden' }, 403);
      const fid = String(args.folderId || '');
      if (write && (fid === F.PEOPLE || fid === F.ASSIGN)) return json({ error: 'Only House can change people and assignments.', code: 'forbidden' }, 403);
      allow = await allowedSet(nh, me.name);
      const ownsCompanyOf = async (folder, id) => { const g = JSON.parse(((await callTool(env, 'get_record', { folderId: folder, recordId: id, fieldKeys: 'label' })).content || []).map((c) => c.text || '').join('') || '{}'); return [].concat((g.fields && g.fields.Company) || []).some((x) => allow.has(x && x.id ? x.id : x)); };
      if (fid === F.COMPANIES && args.recordId && !allow.has(String(args.recordId))) return deny();
      if ((fid === F.CONTACTS || fid === F.DEALS) && args.recordId && !(await ownsCompanyOf(fid, String(args.recordId)))) return deny();
      if ((fid === F.CONTACTS || fid === F.DEALS) && tool === 'create_record' && ![].concat((args.fields && args.fields.Company) || []).some((x) => allow.has(String(x)))) return deny();
      if (fid === F.LOG && write && args.fields) args.fields = { ...args.fields, Person: me.name, 'Person email': login }; // the log always names the real person
    }
  }
  try {
    const result = await callTool(env, tool, args);
    if (allow && result && !result.isError) result.content = filterContent(result.content, String(args.folderId || ''), allow, me, login);
    if (!allow && login && (String(args.folderId) === F.PEOPLE || String(args.folderId) === F.ASSIGN) && write) clearAccessCache();
    if (allow && tool === 'create_record' && String(args.folderId) === F.COMPANIES && result && !result.isError) { // a company a Person adds is theirs
      try { const rec = JSON.parse((result.content || []).map((c) => c.text || '').join('')); if (rec && rec.id) { await callTool(env, 'create_record', { folderId: F.ASSIGN, fieldKeys: 'label', fields: { Name: `Company · ${rec.fields && rec.fields.Name || rec.id} → ${me.name}`, Person: me.name, 'Rule type': 'Company', Value: (rec.fields && rec.fields.Name) || '', Companies: [rec.id], Active: 'Active', Notes: 'Added by this person in Medint' } }); clearAccessCache(); } } catch { /* rule can be added by House */ }
    }
    if (result && result.isError) {
      const text = (result.content || []).map((c) => c.text || '').join(' ').slice(0, 500);
      return json({ error: text || 'NetHunt reported an error', code: 'tool_error' }, 422);
    }
    return json({ content: (result && result.content) || [] });
  } catch (e) {
    return json({ error: e.message || 'NetHunt didn’t answer', code: e.status === 401 ? 'needs_reauth' : 'server_unavailable' }, e.status === 401 ? 401 : 502);
  }
}

// keep only what a Person may see in a NetHunt answer
function filterContent(content, folder, allow, me, login) {
  return (content || []).map((c) => {
    if (!c || c.type !== 'text') return c;
    let d; try { d = JSON.parse(c.text); } catch { return c; }
    const okRec = (r) => {
      if (!r || typeof r !== 'object') return true;
      if (folder === F.COMPANIES) return allow.has(r.id);
      if (folder === F.CONTACTS || folder === F.DEALS) return [].concat((r.fields && r.fields.Company) || []).some((x) => allow.has(x && x.id ? x.id : x));
      if (folder === F.LOG) return String((r.fields && r.fields['Person email']) || '').toLowerCase() === login || (r.fields && r.fields.Person) === me.name;
      if (folder === '6ad6cf34adab0048f0a964a5') return (r.fields && r.fields.Person) === me.name;
      return true;
    };
    const okEv = (e) => !e || !e.recordId || folder !== F.COMPANIES || allow.has(e.recordId);
    if (Array.isArray(d)) d = d.filter(okRec);
    else if (d && Array.isArray(d.records)) d = { ...d, records: d.records.filter(okRec) };
    else if (d && Array.isArray(d.events)) d = { ...d, events: d.events.filter(okEv) };
    else if (d && d.id && d.fields && !okRec(d)) d = { error: 'Not assigned to you.' };
    return { ...c, text: JSON.stringify(d) };
  });
}

// GET /api/nethunt → quick health check (no data returned)
export async function onRequestGet({ env }) {
  if (!env.NETHUNT_MCP_URL) return json({ ok: false, error: 'NETHUNT_MCP_URL is not set' }, 500);
  try {
    const r = await callTool(env, 'list_folders', {});
    const t = (r.content || []).map((c) => c.text || '').join('');
    let n = null; try { n = JSON.parse(t).length; } catch { /* fine */ }
    return json({ ok: !r.isError, folders: n, writes: String(env.ALLOW_WRITES).toLowerCase() === 'true' });
  } catch (e) { return json({ ok: false, error: e.message }, 502); }
}
