import { tsSync } from '../../_lib/timesheet.js';
/**
 * /api/gmail/connect · callback · accounts · send · threads · thread · find · disconnect
 * Sends and reads email through the connected Google Workspace mailboxes (see _lib/gmail.js).
 */
import { callTool } from '../nethunt.js';
import { F } from '../../_lib/access.js';
import { onRequestPost as logPost } from '../medint.js';
import { campRoute, campRun } from '../../_lib/camp.js';
import { json, loginOf, SCOPES, db, seal, sign, accessToken, gapi, sendAsOf, allowedBoxes, mime, toB64 } from '../../_lib/gmail.js';
const ORIGIN = (request) => new URL(request.url).origin;
const CONTACTS = new Map();
export async function onRequest(ctx) {
  const { request, env, params } = ctx; const path = [].concat(params.path || [])[0] || ''; const login = loginOf(request); const url = new URL(request.url);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.TOKEN_KEY) return json({ error: 'Gmail isn’t set up: add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and TOKEN_KEY in Cloudflare.', code: 'not_configured' }, 501);
  if (path === 'cron') { if (!env.CRON_KEY || request.headers.get('x-cron-key') !== env.CRON_KEY) return json({ error: 'forbidden' }, 403); const out = await dispatch(env); let ts = null; try { ts = await tsSync(env); } catch (e) { ts = { ok: false, error: e.message || String(e) }; } /* ⚡ finished work sessions → the Task Timesheet, on the same 5-minute beat */ return json(out && typeof out === 'object' && !Array.isArray(out) ? { ...out, timesheet: ts } : { result: out, timesheet: ts }); } // optional: a scheduler (Cloudflare Worker cron) calls this every few minutes
  if (!login) return json({ error: 'not signed in' }, 401);
  try {
    if (path === 'connect') { const st = `${login}|${Date.now()}`; const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${ORIGIN(request)}/api/gmail/callback`, response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent select_account', include_granted_scopes: 'true', state: `${btoa(st)}.${await sign(env, st)}`, ...(url.searchParams.get('hint') ? { login_hint: url.searchParams.get('hint') } : {}) }); return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, 302); }
    if (path === 'callback') {
      const [s64, sg] = String(url.searchParams.get('state') || '').split('.'); let st = ''; try { st = atob(s64); } catch { /* bad */ } if (!st || sg !== (await sign(env, st)) || st.split('|')[0] !== login || Date.now() - Number(st.split('|')[1]) > 15 * 60e3) return new Response('This sign-in link expired — go back to Medint and click Connect Gmail again.', { status: 400 });
      if (url.searchParams.get('error')) return Response.redirect(`${ORIGIN(request)}/#mail=cancelled`, 302);
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code') || '', client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${ORIGIN(request)}/api/gmail/callback`, grant_type: 'authorization_code' }) });
      const d = await r.json().catch(() => ({})); if (!r.ok || !d.refresh_token) return new Response(`Google didn’t return a connection (${d.error_description || d.error || r.status}). Try Connect Gmail again.`, { status: 400 });
      // the mailbox address: from Google's sign-in token (always there with the “email” permission), else from Gmail
      const granted = String(d.scope || ''); const need = ['gmail.send', 'gmail.settings.basic'].filter((x) => !granted.includes(x)); if (!granted.includes('gmail.readonly') && !granted.includes('gmail.modify')) need.push('gmail.readonly');
      if (need.length) return new Response(`Some permissions weren’t ticked on Google’s screen (${need.join(', ')}). Go back to Medint and click Connect Gmail again — on Google’s screen tick “Select all”, then Continue.`, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      let box = ''; try { const pl = JSON.parse(atob(String(d.id_token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); box = String(pl.email || '').toLowerCase(); } catch { /* try Gmail */ }
      if (!box) { const pr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { authorization: `Bearer ${d.access_token}` } }); const prof = await pr.json().catch(() => ({})); box = String(prof.emailAddress || '').toLowerCase(); if (!box) return new Response(`Could not read the mailbox address (${(prof.error && prof.error.message) || pr.status}). Check that the Gmail API is enabled in Google Cloud, then connect again.`, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
      await (await db(env)).prepare('INSERT INTO gmail_accounts (mailbox, token, sendas, by, at) VALUES (?, ?, NULL, ?, 0) ON CONFLICT(mailbox) DO UPDATE SET token = excluded.token, by = excluded.by, at = 0').bind(box, await seal(env, d.refresh_token), login).run();
      await sendAsOf(env, box, true).catch(() => []); return Response.redirect(`${ORIGIN(request)}/#mail=connected`, 302);
    }
    const { me, boxes } = await allowedBoxes(env, login);
    if (path === 'accounts') { const out = []; for (const b of boxes) { let aliases = []; let err = ''; try { aliases = await sendAsOf(env, b, url.searchParams.get('refresh') === '1'); } catch (e) { err = String(e.message || e); } out.push({ mailbox: b, aliases, error: err }); } return json({ role: me.role, accounts: out }); }
    const pick = (b) => { const m = String(b || '').toLowerCase(); if (!boxes.includes(m)) throw Object.assign(new Error(`You can’t use ${m || 'that mailbox'} — ask House to add it to your Medint People record`), { status: 403 }); return m; };
    if (path === 'disconnect' && request.method === 'POST') { if (me.role !== 'House') return json({ error: 'Only House can disconnect a mailbox' }, 403); const b = pick((await request.json()).mailbox); await (await db(env)).prepare('DELETE FROM gmail_accounts WHERE mailbox = ?').bind(b).run(); return json({ ok: true }); }
    if (path === 'send' && request.method === 'POST') {
      const q = await request.json(); const box = pick(q.mailbox); if (!String(q.to || '').includes('@')) return json({ error: 'Add who it goes to' }, 400);
      const at = Number(q.sendAt) || 0;
      if (at > Date.now() + 60e3) { // 🕒 schedule: kept in Medint's database and sent when due (see dispatch below)
        if (at > Date.now() + 120 * 864e5) return json({ error: 'Schedule at most 4 months ahead' }, 400);
        const payload = JSON.stringify({ ...q, mailbox: box, sendAt: undefined }); if (payload.length > 1.5e6) return json({ error: 'Attachments from your computer are too big to schedule — use files from the library, or send now' }, 413);
        const id = crypto.randomUUID(); await (await qdb(env)).prepare('INSERT INTO mail_queue (id, mailbox, login, payload, send_at, status, err, sent_id, created, subject, rcpt, iso) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)').bind(id, box, login, payload, at, 'pending', Date.now(), String(q.subject || '').slice(0, 200), String(q.to || '').slice(0, 300), String(q.iso || '').slice(0, 2)).run();
        return json({ ok: true, scheduled: true, id, sendAt: at });
      }
      return json(await sendNow(env, box, q));
    }
    if (path === 'scheduled') { const d1 = await qdb(env);
      if (request.method === 'POST') { const q = await request.json(); if (q.action === 'run') return json(await dispatch(env));
        const row = await d1.prepare('SELECT * FROM mail_queue WHERE id = ?').bind(String(q.id || '')).first(); if (!row) return json({ error: 'not found' }, 404); if (row.login !== login && me.role !== 'House') return json({ error: 'Not yours' }, 403); if (row.status !== 'pending') return json({ error: `Already ${row.status}` }, 409);
        if (q.action === 'cancel') { await d1.prepare("UPDATE mail_queue SET status = 'cancelled' WHERE id = ? AND status = 'pending'").bind(row.id).run(); return json({ ok: true }); }
        if (q.action === 'move') { const at = Number(q.sendAt) || 0; if (at < Date.now() - 60e3) return json({ error: 'Pick a time in the future' }, 400); await d1.prepare("UPDATE mail_queue SET send_at = ? WHERE id = ? AND status = 'pending'").bind(at, row.id).run(); return json({ ok: true }); }
        if (q.action === 'now') { await d1.prepare("UPDATE mail_queue SET send_at = ? WHERE id = ? AND status = 'pending'").bind(Date.now() - 1, row.id).run(); const r = await dispatch(env, row.id); return json(r.sent ? r : { ...r, error: r.errors[0] || 'It was already being sent — refresh in a minute' }, r.sent ? 200 : 409); }
        return json({ error: 'unknown action' }, 400); }
      const all = me.role === 'House' && url.searchParams.get('all') === '1'; const rs = await d1.prepare(`SELECT id, mailbox, login, send_at, status, err, subject, rcpt, created, iso FROM mail_queue WHERE ${all ? '1 = 1' : 'login = ?'} AND (status IN ('pending', 'sending', 'failed') OR send_at > ?) ORDER BY send_at LIMIT 100`).bind(...(all ? [] : [login]), Date.now() - 7 * 864e5).all();
      return json({ rows: rs.results || [] }); }
    if (path === 'camp') return await campRoute([].concat(params.path || [])[1] || '', request, env, { login, me, boxes }); // 📣 campaigns (functions/_lib/camp.js)
    const H = (m, n) => (((m.payload || {}).headers || []).find((h) => h.name.toLowerCase() === n.toLowerCase()) || {}).value || '';
    if (path === 'labels') { const box = pick(url.searchParams.get('mailbox') || boxes[0]); const ids = url.searchParams.get('only') ? [url.searchParams.get('only')] : ['INBOX', 'STARRED', 'IMPORTANT', 'SENT', 'DRAFT', 'SPAM', 'TRASH'];
      const out = await Promise.all(ids.map(async (id) => { try { const l = await gapi(env, box, `labels/${id}`); return { id, unread: l.threadsUnread || 0, total: l.threadsTotal || 0 }; } catch { return { id, unread: 0, total: 0 }; } })); return json({ mailbox: box, labels: out }); }
    if (path === 'threads') { const box = pick(url.searchParams.get('mailbox') || boxes[0]); const lab = url.searchParams.get('label') || 'INBOX'; const qq = url.searchParams.get('q') || '';
      const lp = lab === 'ALL' ? '' : `&labelIds=${encodeURIComponent(lab)}`; const d = await gapi(env, box, `threads?maxResults=${Math.min(50, Number(url.searchParams.get('n')) || 30)}${lp}${qq ? `&q=${encodeURIComponent(qq)}` : ''}${lab === 'SPAM' || lab === 'TRASH' ? '&includeSpamTrash=true' : ''}${url.searchParams.get('page') ? `&pageToken=${encodeURIComponent(url.searchParams.get('page'))}` : ''}`);
      const rows = await Promise.all((d.threads || []).map(async (t) => { try { const x = await gapi(env, box, `threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`); const ms = x.messages || []; const last = ms[ms.length - 1] || {}; const first = ms[0] || {}; const labs = [...new Set(ms.flatMap((m) => m.labelIds || []))];
        const lastIn = [...ms].reverse().find((m) => !(m.labelIds || []).includes('SENT')) || last;
        return { id: t.id, subject: H(first, 'Subject'), from: H(lastIn, 'From'), to: H(last, 'To'), date: Number(last.internalDate) || 0, snippet: last.snippet || t.snippet || '', count: ms.length, unread: labs.includes('UNREAD'), starred: labs.includes('STARRED'), important: labs.includes('IMPORTANT'), inbox: labs.includes('INBOX'), sent: (last.labelIds || []).includes('SENT'), files: ms.some((m) => (m.payload && /multipart\/mixed/i.test(m.payload.mimeType || ''))), people: [...new Set(ms.flatMap((m) => [H(m, 'From'), H(m, 'To'), H(m, 'Cc')]).join(',').match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])].map((e) => e.toLowerCase()) }; } catch { return null; } }));
      return json({ mailbox: box, threads: rows.filter(Boolean), next: d.nextPageToken || null, estimate: d.resultSizeEstimate || 0 }); }
    if (path === 'contacts') { const box = pick(url.searchParams.get('mailbox') || boxes[0]); const hit = CONTACTS.get(box); if (hit && Date.now() - hit.at < 6 * 3600e3) return json({ mailbox: box, contacts: hit.list });
      // who you email most: the To/Cc of your sent mail (last 4 months)
      const d = await gapi(env, box, `messages?maxResults=150&q=${encodeURIComponent('in:sent newer_than:120d')}`); const ids = (d.messages || []).map((m) => m.id); const own = new Set((await sendAsOf(env, box).catch(() => [])).map((a) => a.email)); own.add(box); const cnt = new Map();
      for (let i = 0; i < ids.length; i += 25) { await Promise.all(ids.slice(i, i + 25).map(async (id) => { try { const m = await gapi(env, box, `messages/${id}?format=metadata&metadataHeaders=To&metadataHeaders=Cc`); const at = Number(m.internalDate) || 0; ['To', 'Cc'].forEach((h) => String(H(m, h)).split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).forEach((part) => { const em = (part.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0]; if (!em) return; const e = em.toLowerCase(); if (own.has(e)) return; const nm = part.replace(/<.*>/, '').replace(/"/g, '').trim(); const c = cnt.get(e) || { email: e, name: '', n: 0, last: 0 }; c.n++; c.last = Math.max(c.last, at); if (nm && nm !== em && !c.name) c.name = nm; cnt.set(e, c); })); } catch { /* skip */ } })); }
      const list = [...cnt.values()].sort((a, b) => b.n - a.n || b.last - a.last).slice(0, 120); CONTACTS.set(box, { at: Date.now(), list }); return json({ mailbox: box, contacts: list }); }
    if (path === 'modify' && request.method === 'POST') { const q = await request.json(); const box = pick(q.mailbox); const ids = [].concat(q.ids || []).slice(0, 50);
      await Promise.all(ids.map((id) => q.action === 'trash' ? gapi(env, box, `threads/${id}/trash`, { method: 'POST' }) : q.action === 'untrash' ? gapi(env, box, `threads/${id}/untrash`, { method: 'POST' }) : gapi(env, box, `threads/${id}/modify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ addLabelIds: q.add || [], removeLabelIds: q.remove || [] }) })));
      return json({ ok: true, n: ids.length }); }
    if (path === 'attachment') { const box = pick(url.searchParams.get('mailbox') || boxes[0]); const a = await gapi(env, box, `messages/${encodeURIComponent(url.searchParams.get('msg') || '')}/attachments/${encodeURIComponent(url.searchParams.get('id') || '')}`);
      const bin = Uint8Array.from(atob(String(a.data || '').replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)); const nm = url.searchParams.get('name') || 'attachment';
      return new Response(bin, { headers: { 'content-type': url.searchParams.get('type') || 'application/octet-stream', 'content-disposition': `${url.searchParams.get('dl') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nm)}`, 'cache-control': 'private, max-age=600' } }); }
    if (path === 'thread') { const box = pick(url.searchParams.get('mailbox') || boxes[0]); const x = await gapi(env, box, `threads/${encodeURIComponent(url.searchParams.get('id') || '')}?format=full`);
      const d64 = (s0) => { try { const b = Uint8Array.from(atob(String(s0).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)); return new TextDecoder().decode(b); } catch { return ''; } };
      const walk = (p, out) => { if (!p) return out; const hh = (n) => ((p.headers || []).find((h) => h.name.toLowerCase() === n) || {}).value || ''; const cidH = hh('content-id').replace(/[<>]/g, '');
        if (p.body && p.body.attachmentId && (p.filename || cidH)) { if (cidH && /^image\//i.test(p.mimeType || '') && !p.filename) out.inline.push({ cid: cidH, id: p.body.attachmentId, type: p.mimeType, size: p.body.size || 0 }); else { if (cidH && /^image\//i.test(p.mimeType || '')) out.inline.push({ cid: cidH, id: p.body.attachmentId, type: p.mimeType, size: p.body.size || 0 }); if (p.filename && !(cidH && /inline/i.test(hh('content-disposition')))) out.files.push({ name: p.filename, id: p.body.attachmentId, type: p.mimeType, size: p.body.size || 0 }); } }
        else if (/^text\/plain/i.test(p.mimeType || '') && p.body && p.body.data && !out.text) out.text = d64(p.body.data); else if (/^text\/html/i.test(p.mimeType || '') && p.body && p.body.data && !out.html) out.html = d64(p.body.data); (p.parts || []).forEach((c) => walk(c, out)); return out; };
      const strip = (h0) => h0.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      let budget = 1.5e6;
      const msgs = await Promise.all((x.messages || []).map(async (m) => { const o = walk(m.payload, { text: '', html: '', files: [], inline: [] }); let html = o.html;
        if (html && o.inline.length) { for (const im of o.inline.slice(0, 8)) { if (!html.includes(`cid:${im.cid}`) || im.size > 600e3 || budget - im.size < 0) continue; try { const a = await gapi(env, box, `messages/${m.id}/attachments/${im.id}`); budget -= im.size; html = html.split(`cid:${im.cid}`).join(`data:${im.type};base64,${String(a.data || '').replace(/-/g, '+').replace(/_/g, '/')}`); } catch { /* skip */ } } }
        const txt = o.text || strip(o.html || '');
        return { id: m.id, from: H(m, 'From'), to: H(m, 'To'), cc: H(m, 'Cc'), subject: H(m, 'Subject'), date: Number(m.internalDate) || 0, messageId: H(m, 'Message-ID') || H(m, 'Message-Id'), references: H(m, 'References'), text: txt.replace(/\n{3,}/g, '\n\n').trim().slice(0, 20000), html: (html || '').slice(0, 400000), files: o.files, mine: (m.labelIds || []).includes('SENT'), unread: (m.labelIds || []).includes('UNREAD'), labels: m.labelIds || [] }; }));
      if (url.searchParams.get('read') === '1' && msgs.some((m) => m.unread)) { try { await gapi(env, box, `threads/${x.id}/modify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ removeLabelIds: ['UNREAD'] }) }); } catch { /* needs the modify permission */ } }
      return json({ mailbox: box, id: x.id, messages: msgs }); }
    if (path === 'find') { const qq = url.searchParams.get('q') || ''; for (const box of (url.searchParams.get('mailbox') ? [pick(url.searchParams.get('mailbox'))] : boxes)) { try { const d = await gapi(env, box, `messages?maxResults=1&q=${encodeURIComponent(qq)}`); const m = (d.messages || [])[0]; if (m) return json({ mailbox: box, threadId: m.threadId, id: m.id }); } catch { /* next mailbox */ } } return json({ mailbox: null }); }
    return json({ error: 'unknown action' }, 404);
  } catch (e) { return json({ error: String(e.message || e) }, e.status || 500); }
}

// ---- sending (now, or later from the queue) ----
export async function sendNow(env, box, q) {
  const aliases = await sendAsOf(env, box); const al = aliases.find((a) => a.email === String(q.from || '').toLowerCase()) || aliases.find((a) => a.isDefault) || { email: box, name: '' };
  const files = []; let total = 0;
  for (const k of [].concat(q.files || [])) { if (!env.FILES) break; const o = await env.FILES.get(k); if (!o) continue; const buf = await o.arrayBuffer(); total += buf.byteLength; files.push({ name: (o.customMetadata && o.customMetadata.name) || k.split('/').pop(), type: (o.httpMetadata && o.httpMetadata.contentType) || 'application/octet-stream', b64: toB64(buf) }); }
  { const inl = [].concat(q.inline || []); for (let i = 0; i < inl.length; i++) { const x = inl[i]; const k = typeof x === 'string' ? x : x && x.key; const o = env.FILES && k ? await env.FILES.get(k) : null; if (!o) continue; const buf = await o.arrayBuffer(); total += buf.byteLength; files.push({ name: (o.customMetadata && o.customMetadata.name) || k.split('/').pop(), type: (o.httpMetadata && o.httpMetadata.contentType) || 'image/png', b64: toB64(buf), cid: (x && x.cid) || `img${i}@medint` }); } } // 🖼 images shown inside the email (cid:)
  for (const u of [].concat(q.uploads || [])) { total += Math.round(String(u.data || '').length * 0.75); files.push({ name: u.name, type: u.type, b64: String(u.data || '') }); }
  if (total > 24 * 1024 * 1024) throw Object.assign(new Error('Attachments are over 24 MB — Gmail won’t send that much'), { status: 413 });
  const raw = mime({ from: al.email, fromName: al.name, to: q.to, cc: q.cc, bcc: q.bcc, subject: q.subject, text: q.text, html: q.html, inReplyTo: q.inReplyTo, references: q.references, files });
  let sent;
  if (raw.length < 4.5e6) sent = await gapi(env, box, 'messages/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ raw: btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), ...(q.threadId ? { threadId: q.threadId } : {}) }) });
  else { const r = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media', { method: 'POST', headers: { authorization: `Bearer ${await accessToken(env, box)}`, 'content-type': 'message/rfc822' }, body: raw }); sent = await r.json().catch(() => ({})); if (!r.ok) throw new Error((sent.error && sent.error.message) || `Gmail error ${r.status}`); }
  return { ok: true, id: sent.id, threadId: sent.threadId, from: al.email };
}
let qMade = false;
async function qdb(env) { const d1 = await db(env); if (!qMade) { await d1.prepare('CREATE TABLE IF NOT EXISTS mail_queue (id TEXT PRIMARY KEY, mailbox TEXT, login TEXT, payload TEXT, send_at INTEGER, status TEXT, err TEXT, sent_id TEXT, created INTEGER, subject TEXT, rcpt TEXT, claimed_at INTEGER, iso TEXT)').run();
  for (const col of ['claimed_at INTEGER', 'iso TEXT']) { try { await d1.prepare(`ALTER TABLE mail_queue ADD COLUMN ${col}`).run(); } catch { /* already there */ } }
  await d1.prepare('CREATE INDEX IF NOT EXISTS mail_queue_due ON mail_queue (status, send_at)').run(); qMade = true; } return d1; }
// send every email that is due. Each row is claimed with one atomic UPDATE (status pending → sending, claimed_at = now), so two open
// Medint tabs or the cron never send it twice; a send that crashed half-way (claimed 10+ minutes ago, still “sending”) is retried.
export async function dispatch(env, onlyId) { const d1 = await qdb(env); const now = Date.now(); const out = { sent: 0, failed: 0, errors: [] };
  await d1.prepare("UPDATE mail_queue SET status = 'pending', claimed_at = NULL WHERE status = 'sending' AND claimed_at IS NOT NULL AND claimed_at < ?").bind(now - 6e5).run();
  const due = onlyId ? [{ id: onlyId }] : ((await d1.prepare("SELECT id FROM mail_queue WHERE status = 'pending' AND send_at <= ? ORDER BY send_at LIMIT 10").bind(now).all()).results || []);
  for (const { id } of due) { const claim = await d1.prepare("UPDATE mail_queue SET status = 'sending', claimed_at = ? WHERE id = ? AND status = 'pending' AND send_at <= ?").bind(Date.now(), id, Date.now()).run(); if (!claim.meta || !claim.meta.changes) continue;
    const row = await d1.prepare('SELECT * FROM mail_queue WHERE id = ?').bind(id).first();
    try { const { boxes } = await allowedBoxes(env, row.login, { strict: !0 }); if (!boxes.includes(row.mailbox)) throw new Error(`${row.login} may no longer send from ${row.mailbox}`); // access can change while an email waits
      const pl = JSON.parse(row.payload); const r = await sendNow(env, row.mailbox, pl); await d1.prepare("UPDATE mail_queue SET status = 'sent', sent_id = ?, payload = '' WHERE id = ?").bind(r.id || '', id).run(); out.sent++; await logSent(env, row.login, pl.log).catch(() => {}); }
    catch (e) { const m = String(e.message || e).slice(0, 300); if (e.transient || /\b429\b|rate ?limit|quota|userRateLimitExceeded/i.test(m)) { await d1.prepare("UPDATE mail_queue SET status = 'pending', claimed_at = NULL, err = ?, send_at = ? WHERE id = ?").bind(m, Date.now() + 15 * 6e4, id).run(); out.errors.push(m); continue; } // try again in 15 minutes
      await d1.prepare("UPDATE mail_queue SET status = 'failed', err = ? WHERE id = ?").bind(m, id).run(); out.failed++; out.errors.push(m); } }
  if (!onlyId) { try { out.camp = await campRun(env, { sendNow, logSent }); } catch (e) { out.camp = { sent: 0, errors: [String(e.message || e)] }; } } // 📣 campaign emails that are due
  return out; }

// a scheduled email goes into the Medint Log (NetHunt + Medint's own copy) when it is actually sent, not when it was scheduled
async function logSent(env, login, fields) { if (!fields || !fields.Action) return; const now = new Date(); const f = { ...fields, Epoch: now.getTime(), Time: now.toISOString(), Day: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) };
  if (env.NETHUNT_MCP_URL && F.LOG) await callTool(env, 'create_record', { folderId: F.LOG, fieldKeys: 'label', fields: f }).catch(() => {});
  await logPost({ request: new Request('https://medint.local/api/medint', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-access-authenticated-user-email': login }, body: JSON.stringify({ ...f, Company: [].concat(f.Company || [])[0] || '' }) }), env }).catch(() => {}); }
