/**
 * Gmail for Medint: each Workspace mailbox is connected once (Google sign-in); its refresh token is stored encrypted (TOKEN_KEY) in D1.
 * Sending goes through the Gmail API as the connected mailbox, using any of its verified “Send mail as” addresses and their signatures.
 */
import { whoIs } from './access.js';
import { callTool } from '../api/nethunt.js';
export const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export const loginOf = (request) => (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
export const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.settings.basic', 'openid', 'email'];
let made = false;
export async function db(env) { if (!env.MEDINT_DB) throw new Error('MEDINT_DB is not bound'); if (!made) { await env.MEDINT_DB.prepare('CREATE TABLE IF NOT EXISTS gmail_accounts (mailbox TEXT PRIMARY KEY, token TEXT, sendas TEXT, by TEXT, at INTEGER)').run(); made = true; } return env.MEDINT_DB; }
const enc = new TextEncoder(); const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))); const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function key(env) { if (!env.TOKEN_KEY) throw new Error('TOKEN_KEY secret is missing'); const h = await crypto.subtle.digest('SHA-256', enc.encode(env.TOKEN_KEY)); return crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt']); }
export async function seal(env, text) { const iv = crypto.getRandomValues(new Uint8Array(12)); const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), enc.encode(text)); return `${b64(iv)}.${b64(c)}`; }
export async function unseal(env, s) { const [iv, c] = String(s).split('.'); return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(env), unb64(c))); }
export async function sign(env, text) { const k = await crypto.subtle.importKey('raw', enc.encode(`${env.TOKEN_KEY}|state`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64(await crypto.subtle.sign('HMAC', k, enc.encode(text))).replace(/[+/=]/g, ''); }
const tokCache = new Map();
export async function accessToken(env, mailbox) {
  const c = tokCache.get(mailbox); if (c && c.exp > Date.now() + 60e3) return c.tok;
  const row = await (await db(env)).prepare('SELECT token FROM gmail_accounts WHERE mailbox = ?').bind(mailbox).first(); if (!row) throw new Error(`${mailbox} is not connected`);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: await unseal(env, row.token), grant_type: 'refresh_token' }), signal: AbortSignal.timeout(10000) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`Google refused the connection for ${mailbox} (${d.error || r.status}) — connect it again`);
  tokCache.set(mailbox, { tok: d.access_token, exp: Date.now() + (d.expires_in || 3000) * 1000 }); return d.access_token;
}
export async function gapi(env, mailbox, path, opt = {}) { const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { ...opt, headers: { authorization: `Bearer ${await accessToken(env, mailbox)}`, ...(opt.headers || {}) }, signal: AbortSignal.timeout(20000) }); const d = await r.json().catch(() => ({})); if (!r.ok) { const m = (d.error && d.error.message) || `Gmail error ${r.status}`; throw Object.assign(new Error(/insufficient|scope/i.test(m) ? `${mailbox} needs to be connected again to allow this (⋯ → 📧 Email accounts → Connect) — Google asks for one more permission` : m), { status: r.status === 403 ? 403 : 500 }); } return d; }
export async function sendAsOf(env, mailbox, refresh) {
  const D = await db(env); const row = await D.prepare('SELECT sendas, at FROM gmail_accounts WHERE mailbox = ?').bind(mailbox).first(); if (!row) return [];
  if (!refresh && row.sendas && Date.now() - row.at < 6 * 3600e3) { try { return JSON.parse(row.sendas); } catch { /* refresh */ } }
  const d = await gapi(env, mailbox, 'settings/sendAs'); const list = (d.sendAs || []).filter((s) => !s.verificationStatus || s.verificationStatus === 'accepted').map((s) => ({ email: s.sendAsEmail.toLowerCase(), name: s.displayName || '', signature: s.signature || '', isDefault: !!s.isDefault, primary: !!s.isPrimary }));
  await D.prepare('UPDATE gmail_accounts SET sendas = ?, at = ? WHERE mailbox = ?').bind(JSON.stringify(list), Date.now(), mailbox).run(); return list;
}
// which connected mailboxes this login may use: House → all; a Person → the mailboxes on their Medint People record
export async function allowedBoxes(env, login) {
  const D = await db(env); const all = ((await D.prepare('SELECT mailbox FROM gmail_accounts').all()).results || []).map((r) => r.mailbox);
  let me = { role: 'Person', mailboxes: [login] }; try { me = await whoIs(env, (n, a) => callTool(env, n, a), login); } catch { /* fall back to their own login */ }
  if (me.role === 'House') return { me, boxes: all }; const mine = new Set([login, ...(me.mailboxes || [])]); return { me, boxes: all.filter((m) => mine.has(m)) };
}
// RFC 2822 message with attachments (base64, 76-char lines), UTF-8 headers
const hdr = (v) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${btoa(unescape(encodeURIComponent(v)))}?=`);
const wrap = (s) => s.replace(/.{1,76}/g, '$&\r\n');
const u8b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
export function mime({ from, fromName, to, cc, bcc, subject, text, html, inReplyTo, references, files }) {
  const B = `mx${crypto.randomUUID().replace(/-/g, '')}`; const A = `al${crypto.randomUUID().replace(/-/g, '')}`; const u = (s) => u8b64(enc.encode(s));
  const head = [`From: ${fromName ? `${hdr(fromName)} <${from}>` : from}`, `To: ${to}`, cc && `Cc: ${cc}`, bcc && `Bcc: ${bcc}`, `Subject: ${hdr(subject || '')}`, 'MIME-Version: 1.0', inReplyTo && `In-Reply-To: ${inReplyTo}`, (references || inReplyTo) && `References: ${references || inReplyTo}`, `Content-Type: multipart/mixed; boundary="${B}"`].filter(Boolean).join('\r\n');
  let body = `--${B}\r\nContent-Type: multipart/alternative; boundary="${A}"\r\n\r\n--${A}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(u(text || ''))}\r\n--${A}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(u(html || ''))}\r\n--${A}--\r\n`;
  (files || []).forEach((f) => { body += `--${B}\r\nContent-Type: ${f.type || 'application/octet-stream'}; name="${hdr(f.name)}"\r\nContent-Disposition: attachment; filename="${hdr(f.name)}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(f.b64)}\r\n`; });
  return `${head}\r\n\r\n${body}--${B}--\r\n`;
}
export const toB64 = (buf) => u8b64(new Uint8Array(buf));
const b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export { b64url };
