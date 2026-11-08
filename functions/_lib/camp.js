/**
 * 📣 Email campaigns with follow-ups (like Streak's mail merge): one email per person, sent from a chosen mailbox + “Send mail as” address,
 * follow-ups in the same Gmail thread after N business days (their time), only inside their working hours (Mon–Fri 9–17 their time),
 * at most `cap` campaign emails per mailbox per day (default 50), a few minutes apart.
 * Stops / pauses by themselves:
 *   · a reply to a campaign email (or any email from them in NetHunt) → the whole company is paused, in every campaign
 *   · a bounce → that address is stopped
 *   · a real interaction (call where you spoke, WhatsApp from them, meeting, status change) → the company's choice: pause (default) / continue / stop
 * Unanswered calls and WhatsApps you sent don't stop anything.
 * Tables live in Medint's D1 (MEDINT_DB) next to the scheduled-email queue; the existing scheduler (cron) and every open Medint drive sending.
 */
import { json, gapi, sendAsOf, allowedBoxes } from './gmail.js';
import { callTool } from '../api/nethunt.js';
import { F } from './access.js';
import { tzOf, local, nextOpen, afterDays, inWindow, fill, firstName, esc, okEmail, HOME_TZ, OPEN, CLOSE, HOL } from './camp_core.js';

const OURS = /@(kavikaplan\.com|duni-tech\.com|oliga\.com\.tr|d-xray\.com|next-shoulder\.com|motionmedical\.fi)$/i;
const STATUS_FIELDS = ['Status', 'NEXT Status', 'Motion Status'];
export const DEFAULT_CAP = 50;
const MAX_STEPS = 6, MAX_RCPT = 6000;
export const clock = { now: () => Date.now() }; // tests move time
const now = () => clock.now();
const uid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

// 🎉 public holidays (data/holidays_year.json, served with the site): loaded once per worker
let holP = null;
export function holidays(env) { if (!env.ASSETS) return Promise.resolve(); if (holP) return holP; holP = (async () => { try { const r = await env.ASSETS.fetch(new Request('https://assets.local/data/holidays_year.json')); if (!r.ok) return; const L = await r.json();
  [].concat(L || []).forEach((h) => { if (!h || !h.iso || !h.date || !h.pub) return; HOL.has(h.iso) || HOL.set(h.iso, new Set()); HOL.get(h.iso).add(String(h.date).slice(0, 10)); }); } catch { holP = null; } })(); return holP; }
let made = false;
export async function cdb(env) { await holidays(env); const d1 = env.MEDINT_DB; if (!d1) throw new Error('MEDINT_DB is not bound'); if (made) return d1;
  for (const sql of [
    'CREATE TABLE IF NOT EXISTS camp (id TEXT PRIMARY KEY, login TEXT, name TEXT, mailbox TEXT, sender TEXT, sender_name TEXT, brand TEXT, steps TEXT, on_touch TEXT, optout TEXT, status TEXT, created INTEGER, start_at INTEGER, log TEXT, fallbacks TEXT)',
    'CREATE TABLE IF NOT EXISTS camp_rcpt (id TEXT PRIMARY KEY, camp_id TEXT, seq INTEGER, company_id TEXT, company TEXT, person_id TEXT, kind TEXT, name TEXT, title TEXT, email TEXT, iso TEXT, country TEXT, city TEXT, tz TEXT, step INTEGER DEFAULT 0, next_at INTEGER, status TEXT, reason TEXT, reason_at INTEGER, on_touch TEXT, watch_from INTEGER, thread_id TEXT, msg_id TEXT, refs TEXT, subj TEXT, last_at INTEGER, claimed_at INTEGER, tries INTEGER DEFAULT 0, err TEXT, replied_at INTEGER)',
    'CREATE INDEX IF NOT EXISTS camp_rcpt_due ON camp_rcpt (status, next_at)',
    'CREATE INDEX IF NOT EXISTS camp_rcpt_camp ON camp_rcpt (camp_id)',
    'CREATE INDEX IF NOT EXISTS camp_rcpt_co ON camp_rcpt (company_id)',
    'CREATE TABLE IF NOT EXISTS camp_sent (id INTEGER PRIMARY KEY AUTOINCREMENT, mailbox TEXT, at INTEGER, day TEXT, camp_id TEXT, rcpt_id TEXT, step INTEGER)',
    'CREATE INDEX IF NOT EXISTS camp_sent_box ON camp_sent (mailbox, day)',
    'CREATE TABLE IF NOT EXISTS camp_box (mailbox TEXT PRIMARY KEY, cap INTEGER, next_ok INTEGER, swept INTEGER)',
  ]) await d1.prepare(sql).run();
  for (const col of [ 'camp ADD COLUMN fallbacks TEXT', 'camp_rcpt ADD COLUMN replied_at INTEGER', 'camp_box ADD COLUMN err TEXT', 'camp_box ADD COLUMN err_at INTEGER' ]) { try { await d1.prepare(`ALTER TABLE ${col}`).run(); } catch { /* already there */ } } // tables made by an earlier version
  made = true; return d1; }

const homeDay = (ts) => local(ts, HOME_TZ).day; // a mailbox's “day” for the daily limit: Istanbul time
const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const nh = (r) => { try { return JSON.parse(((r || {}).content || [])[0].text); } catch { return null; } };

// ---------- the email itself ----------
export function varsOf(c, r) { return { name: r.kind === 'person' ? firstName(r.name) : '', full_name: r.kind === 'person' ? r.name : '', company: r.company, country: r.country, city: r.city, title: r.title, brand: c.brand, my_name: c.sender_name }; }
export function build(c, r, k, sig) { const st = parse(c.steps, [])[k] || {}; const first = parse(c.steps, [])[0] || {}; const v = varsOf(c, r); const fb = parse(c.fallbacks, {});
  const subj0 = fill(first.subject, v, fb); const subject = k === 0 ? subj0 : (String(st.subject || '').trim() ? fill(st.subject, v, fb) : (r.subj ? (/^re:/i.test(r.subj) ? r.subj : `Re: ${r.subj}`) : `Re: ${subj0}`));
  const body = fill(st.body, v, fb); const opt = k === 0 && c.optout ? `\n\n${c.optout}` : ''; const plain = `${body}${opt}`;
  const imgs = [].concat(st.images || []).filter((x) => x && x.key).slice(0, 6); const inline = imgs.map((x, i) => ({ key: x.key, cid: `img${i}.${String(r.id || '').replace(/[^\w]/g, '')}@medint` }));
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px">${esc(body).replace(/\n/g, '<br>')}${inline.map((x, i) => `<br><img src="cid:${x.cid}" alt="${esc(imgs[i].name || 'image')}" style="max-width:100%;height:auto">`).join('')}${opt ? `<br><br>${esc(c.optout)}` : ''}</div>${sig ? `<br><div>${sig}</div>` : ''}`;
  const text = `${plain}${sig ? `\n\n${String(sig).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}` : ''}`;
  return { subject, text, html, body: plain, files: [].concat(st.files || []).map((x) => x && x.key).filter(Boolean).slice(0, 8), inline }; }

// ---------- what happened with this company since `from` (NetHunt timeline) ----------
export async function touchOf(env, cid, from, timeline) {
  if (!cid || (!timeline && !env.NETHUNT_MCP_URL)) return null;
  let p; try { p = timeline ? await timeline(cid, from) : nh(await callTool(env, 'list_record_timeline', { folderId: F.COMPANIES, recordId: cid, from: String(from), types: ['call', 'chat', 'calendar', 'record_updated', 'email'], fieldKeys: 'label', limit: 60 })); } catch { return null; }
  for (const e of (p && p.events) || []) { const t = Number(e.time) || Date.parse(e.timeISO || '') || 0; if (t < from) continue;
    if (e.type === 'calendar') return { why: 'meeting', at: t };
    if (e.type === 'call') { const x = String(e.text || ''); if (/\b(spoke|meeting set|not interested)\b/i.test(x) && !/^(call\s*[—-]\s*)?(no answer|left message)\b/i.test(x)) return { why: `call: ${x.split('\n')[0].slice(0, 80)}`, at: t }; continue; }
    if (e.type === 'chat') { const ch = e.chat || {}; const lt = Number((ch.lastMessage || {}).date) || t; if (ch.status === 'NOT_REPLIED' && lt >= from) return { why: `WhatsApp from them${ch.lastMessage && ch.lastMessage.body ? `: “${String(ch.lastMessage.body).slice(0, 60)}”` : ''}`, at: lt }; continue; }
    if (e.type === 'record_updated') { const ch = e.changes || {}; const k = STATUS_FIELDS.find((f) => ch[f]); if (k) { const nv = ch[k].new; return { why: `${k} → ${Array.isArray(nv) ? nv.join(', ') : nv || '—'}`, at: t }; } continue; }
    if (e.type === 'email') { const by = String((e.creator && e.creator.email) || '').toLowerCase(); if (by && !OURS.test(by)) return { why: `email from them${e.subject ? `: ${String(e.subject).slice(0, 60)}` : ''}`, at: t }; }
  }
  return null; }

// a reply or bounce in the campaign thread after our last email?
export async function threadNews(env, box, threadId, after, mine) {
  const th = await gapi(env, box, `threads/${encodeURIComponent(threadId)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`);
  for (const m of th.messages || []) { const t = Number(m.internalDate) || 0; if (t <= after) continue; const from = String((((m.payload || {}).headers || []).find((h) => /^from$/i.test(h.name)) || {}).value || '').toLowerCase();
    if (/mailer-daemon|postmaster|mail delivery/i.test(from)) return { kind: 'bounce', at: t, why: (m.snippet || 'bounced').slice(0, 120) };
    if (!mine.some((a) => from.includes(a))) return { kind: 'reply', at: t, why: `replied: “${String(m.snippet || '').slice(0, 80)}”` }; }
  return null; }

// ---------- state changes ----------
async function setCompany(d1, cid, status, reason, onlyCamp) { if (!cid) return;
  await d1.prepare(`UPDATE camp_rcpt SET status = ?, reason = ?, reason_at = ? WHERE company_id = ? AND status IN ('active', 'sending')${onlyCamp ? ' AND camp_id = ?' : ''}`).bind(...[status, reason, now(), cid, ...(onlyCamp ? [onlyCamp] : [])]).run(); }
async function finishCamps(d1) { await d1.prepare("UPDATE camp SET status = 'done' WHERE status = 'active' AND NOT EXISTS (SELECT 1 FROM camp_rcpt r WHERE r.camp_id = camp.id AND r.status IN ('active', 'sending', 'paused'))").run(); }

// ---------- sending: called by the scheduler and by every open Medint ----------
// Safe when several runs overlap (cron + open browsers): each mailbox is claimed with one atomic UPDATE, each recipient too, and a sent email is
// recorded straight after Gmail accepts it — later steps (Message-ID, log) can fail without the email ever going out twice.
const BOX_ERR = /invalid_grant|unauthori[sz]ed|\b401\b|\b403\b|\b429\b|rate ?limit|quota|userRateLimitExceeded|reconnect|token (has been )?(expired|revoked)|daily limit|too many/i;
export async function campRun(env, deps, opt = {}) {
  const d1 = await cdb(env); const t0 = now(); const out = { sent: 0, paused: 0, stopped: 0, errors: [] };
  // a send that was cut off half-way (claimed 10+ minutes ago): checked in Gmail's Sent before anything is sent again
  await d1.prepare("UPDATE camp_rcpt SET status = 'active', claimed_at = NULL, err = 'recovered' WHERE status = 'sending' AND claimed_at < ?").bind(t0 - 6e5).run();
  await sweep(env, d1, out).catch((e) => out.errors.push(`check replies: ${e.message}`));
  const boxes = ((await d1.prepare("SELECT DISTINCT c.mailbox AS box FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE r.status = 'active' AND c.status = 'active' AND r.next_at <= ?").bind(t0).all()).results || []).map((x) => x.box);
  const ctx = { allowed: new Map(), aliases: new Map() }; // per run: who may use which mailbox, its send-as addresses
  for (const box of boxes) {
    await d1.prepare('INSERT OR IGNORE INTO camp_box (mailbox, cap, next_ok, swept) VALUES (?, ?, 0, 0)').bind(box, DEFAULT_CAP).run();
    const b = (await d1.prepare('SELECT * FROM camp_box WHERE mailbox = ?').bind(box).first()) || { cap: DEFAULT_CAP, next_ok: 0 };
    const today = homeDay(now()); const n = ((await d1.prepare('SELECT COUNT(*) AS n FROM camp_sent WHERE mailbox = ? AND day = ?').bind(box, today).first()) || {}).n || 0;
    if (n >= (b.cap || DEFAULT_CAP)) continue; // today's limit reached — tomorrow
    // claim the mailbox for this run (another run that got it first sends its one email)
    const lock = await d1.prepare('UPDATE camp_box SET next_ok = ? WHERE mailbox = ? AND (next_ok IS NULL OR next_ok <= ?)').bind(now() + 2 * 6e4, box, opt.force ? now() + 3e6 : now()).run(); if (!lock.meta || !lock.meta.changes) continue;
    const list = (await d1.prepare("SELECT r.*, c.mailbox AS box FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.mailbox = ? AND r.status = 'active' AND c.status = 'active' AND r.next_at <= ? ORDER BY r.next_at, r.seq LIMIT 25").bind(box, now()).all()).results || [];
    let nextOk = now(); // released unless an email went out or the mailbox needs a rest
    for (const r of list) {
      if (!inWindow(now(), r.tz, r.iso)) { await d1.prepare("UPDATE camp_rcpt SET next_at = ? WHERE id = ? AND status = 'active'").bind(nextOpen(now(), r.tz, 45, r.iso), r.id).run(); continue; }
      const claim = await d1.prepare("UPDATE camp_rcpt SET status = 'sending', claimed_at = ? WHERE id = ? AND status = 'active' AND next_at <= ?").bind(now(), r.id, now()).run(); if (!claim.meta || !claim.meta.changes) continue;
      const res = await sendOne(env, d1, deps, r, ctx).catch((e) => ({ err: e }));
      if (res.err) { const m = String(res.err.message || res.err).slice(0, 300);
        if (BOX_ERR.test(m)) { // the mailbox, not this person: back to waiting, no try counted, the mailbox rests an hour
          await d1.prepare("UPDATE camp_rcpt SET status = CASE WHEN status = 'sending' THEN 'active' ELSE status END, claimed_at = NULL, err = ? WHERE id = ?").bind(`mailbox: ${m}`, r.id).run();
          await d1.prepare('UPDATE camp_box SET err = ?, err_at = ? WHERE mailbox = ?').bind(m, now(), box).run(); nextOk = now() + 60 * 6e4; out.errors.push(`${box}: ${m}`); break; }
        const tries = (r.tries || 0) + 1; await d1.prepare("UPDATE camp_rcpt SET status = CASE WHEN status = 'sending' THEN ? ELSE status END, err = ?, tries = ?, next_at = ?, claimed_at = NULL WHERE id = ?").bind(tries >= 3 ? 'failed' : 'active', m, tries, now() + 30 * 6e4, r.id).run(); out.errors.push(m); continue; }
      if (res.sent) { out.sent++; nextOk = now() + (3 + Math.floor(Math.random() * 5)) * 6e4; await d1.prepare('UPDATE camp_box SET err = NULL WHERE mailbox = ? AND err IS NOT NULL').bind(box).run(); break; } // one email per mailbox per round: a few minutes apart
      res.paused && out.paused++; res.stopped && out.stopped++;
    }
    await d1.prepare('UPDATE camp_box SET next_ok = ? WHERE mailbox = ?').bind(opt.force && nextOk > now() + 6e4 && !out.errors.length ? now() : nextOk, box).run();
  }
  await finishCamps(d1); return out; }

async function sendOne(env, d1, deps, r, ctx = { allowed: new Map(), aliases: new Map() }) {
  const c = await d1.prepare('SELECT * FROM camp WHERE id = ?').bind(r.camp_id).first(); const steps = parse(c.steps, []);
  const back = async (sql, ...a) => { await d1.prepare(sql).bind(...a).run(); };
  if (r.step >= steps.length) { await back("UPDATE camp_rcpt SET status = 'done' WHERE id = ? AND status = 'sending'", r.id); return {}; }
  if (!ctx.allowed.has(c.login)) ctx.allowed.set(c.login, (await allowedBoxes(env, c.login, { strict: !0 })).boxes); // a NetHunt hiccup throws (tried again next round), it doesn't pause anything
  if (!ctx.allowed.get(c.login).includes(c.mailbox)) { await back("UPDATE camp_rcpt SET status = 'paused', reason = ?, reason_at = ? WHERE id = ?", `${c.login} may no longer send from ${c.mailbox}`, now(), r.id); return { paused: 1 }; }
  const ex = (sql, ...a) => back(sql, ...a);
  // something happened with the company since we started watching?
  const tc = await touchOf(env, r.company_id, r.watch_from || c.created, deps.timeline);
  if (tc) { const how = r.on_touch || c.on_touch || 'pause';
    if (how === 'stop') { await setCompany(d1, r.company_id, 'stopped', `company: ${tc.why}`, r.camp_id); await ex("UPDATE camp_rcpt SET status = 'stopped', reason = ?, reason_at = ? WHERE id = ?", tc.why, now(), r.id); return { stopped: 1 }; }
    if (how === 'pause') { await setCompany(d1, r.company_id, 'paused', `company: ${tc.why}`, r.camp_id); await ex("UPDATE camp_rcpt SET status = 'paused', reason = ?, reason_at = ? WHERE id = ?", tc.why, now(), r.id); return { paused: 1 }; }
    await d1.prepare('UPDATE camp_rcpt SET watch_from = ? WHERE company_id = ? AND camp_id = ?').bind(now(), r.company_id, r.camp_id).run(); } // continue
  if (!ctx.aliases.has(c.mailbox)) ctx.aliases.set(c.mailbox, await sendAsOf(env, c.mailbox).catch(() => []));
  const aliases = ctx.aliases.get(c.mailbox); const al = aliases.find((a) => a.email === c.sender) || { email: c.sender, signature: '' };
  const mine = [ c.mailbox, c.sender, ...aliases.map((a) => a.email) ].filter(Boolean).map((x) => x.toLowerCase());
  if (r.step > 0 && r.thread_id) { const nw = await threadNews(env, c.mailbox, r.thread_id, Math.max(r.last_at || 0, r.watch_from || 0), mine);
    if (nw && nw.kind === 'bounce') { await ex("UPDATE camp_rcpt SET status = 'bounced', reason = ?, reason_at = ? WHERE id = ?", nw.why, nw.at, r.id); return { stopped: 1 }; }
    if (nw) { await setCompany(d1, r.company_id, 'paused', `company paused: ${r.name || r.email} ${nw.why}`); await ex("UPDATE camp_rcpt SET status = 'paused', reason = ?, reason_at = ?, replied_at = ? WHERE id = ?", nw.why, nw.at, nw.at, r.id); return { paused: 1 }; } }
  const m = build(c, r, r.step, al.signature || '');
  // a send that was cut off before it was recorded: if Gmail's Sent has it, record it instead of sending again
  let res = null; if (r.err === 'recovered' && r.claimed_at !== undefined) { try { const q = `in:sent to:${r.email} after:${Math.floor(Math.max((r.last_at || 0) + 6e4, now() - 2 * 864e5) / 1000)}`; const d = await gapi(env, c.mailbox, `messages?maxResults=5&q=${encodeURIComponent(q)}`); const hit = (d.messages || [])[0]; if (hit) res = { id: hit.id, threadId: hit.threadId, recovered: !0 }; } catch { /* send */ } }
  if (!res) res = await deps.sendNow(env, c.mailbox, { from: c.sender, to: r.email, subject: m.subject, text: m.text, html: m.html, files: m.files, inline: m.inline, ...(r.step > 0 && r.thread_id ? { threadId: r.thread_id, inReplyTo: r.msg_id || '', references: r.refs || '' } : {}) });
  // ✉ sent: recorded at once (a pause / stop that came in meanwhile is kept)
  const t = now(); const k = r.step + 1; const nx = steps[k];
  await d1.prepare("UPDATE camp_rcpt SET step = ?, thread_id = ?, subj = ?, last_at = ?, claimed_at = NULL, err = NULL, tries = 0, status = CASE WHEN status = 'sending' THEN ? ELSE status END, next_at = ? WHERE id = ?")
    .bind(k, res.threadId || r.thread_id || '', r.step === 0 ? m.subject : r.subj, t, nx ? 'active' : 'done', nx ? afterDays(t, r.tz, Number(nx.wait) || 3, Number(nx.hour) || OPEN, 40, r.iso) : null, r.id).run();
  try { await d1.prepare('INSERT INTO camp_sent (mailbox, at, day, camp_id, rcpt_id, step) VALUES (?, ?, ?, ?, ?, ?)').bind(c.mailbox, t, homeDay(t), c.id, r.id, r.step).run(); } catch { /* the count is a guide */ }
  try { const md = await gapi(env, c.mailbox, `messages/${encodeURIComponent(res.id)}?format=metadata&metadataHeaders=Message-ID`); const mid = ((((md.payload || {}).headers) || []).find((h) => /^message-id$/i.test(h.name)) || {}).value || '';
    if (mid) await d1.prepare('UPDATE camp_rcpt SET msg_id = ?, refs = ? WHERE id = ?').bind(mid, [ r.refs, mid ].filter(Boolean).join(' ').slice(-1800), r.id).run(); } catch { /* threading still works by threadId */ }
  try { const base = parse(c.log, {}); const who = r.kind === 'person' ? `${r.name} <${r.email}>` : r.email;
    if (deps.logSent && !res.recovered) await deps.logSent(env, c.login, { ...base, Name: `Email · ${base.Person || ''}${r.company ? ` · ${r.company}` : ''}`.slice(0, 200), Action: 'Email', Outcome: `📣 ${c.name} · email ${r.step + 1} of ${steps.length} sent from ${c.sender} to ${who}`.slice(0, 250), Text: `${m.subject}\n\n${m.body}`.slice(0, 4000), 'Company name': r.company || '', Country: r.country || '', ...(r.company_id ? { Company: [ r.company_id ] } : {}) }); } catch { /* the log is best effort */ }
  return { sent: 1 }; }

// replies and bounces show up within ~10 minutes even before the next step is due: one Gmail search per mailbox (up to 2 pages)
async function sweep(env, d1, out) {
  const boxes = (await d1.prepare("SELECT DISTINCT c.mailbox AS box FROM camp c JOIN camp_rcpt r ON r.camp_id = c.id WHERE r.status IN ('active', 'sending', 'done') AND r.replied_at IS NULL AND r.thread_id IS NOT NULL AND r.thread_id != '' AND r.last_at > ?").bind(now() - 30 * 864e5).all()).results || [];
  let budget = 40; // Gmail reads per run, all mailboxes together
  for (const { box } of boxes) { if (budget <= 0) break;
    const b = (await d1.prepare('SELECT * FROM camp_box WHERE mailbox = ?').bind(box).first()) || {}; if ((b.swept || 0) > now() - 10 * 6e4) continue;
    await d1.prepare('INSERT INTO camp_box (mailbox, cap, next_ok, swept) VALUES (?, ?, 0, ?) ON CONFLICT(mailbox) DO UPDATE SET swept = excluded.swept').bind(box, b.cap || DEFAULT_CAP, now()).run();
    const ids = []; let tok = ''; try { for (let pg = 0; pg < 2; pg++) { const d = await gapi(env, box, `threads?maxResults=100&q=${encodeURIComponent('newer_than:3d -from:me')}${tok ? `&pageToken=${encodeURIComponent(tok)}` : ''}`); budget--; (d.threads || []).forEach((t) => ids.push(t.id)); tok = d.nextPageToken || ''; if (!tok) break; } } catch (e) { out.errors.push(`${box}: ${e.message}`); continue; }
    if (!ids.length) continue; const rows = [];
    for (let i = 0; i < ids.length; i += 90) { const part = ids.slice(i, i + 90); rows.push(...(((await d1.prepare(`SELECT r.*, c.mailbox AS box, c.sender AS sender FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.mailbox = ? AND r.replied_at IS NULL AND r.thread_id IN (${part.map(() => '?').join(',')}) AND r.status IN ('active', 'sending', 'done')`).bind(box, ...part).all()).results) || [])); }
    if (!rows.length) continue; const aliases = await sendAsOf(env, box).catch(() => []); const mine = [ box, ...aliases.map((a) => a.email) ].map((x) => x.toLowerCase());
    for (const r of rows) { if (budget-- <= 0) break; const nw = await threadNews(env, box, r.thread_id, Math.max(r.last_at || 0, r.watch_from || 0), mine).catch(() => null); if (!nw) continue;
      if (nw.kind === 'bounce') { await d1.prepare("UPDATE camp_rcpt SET status = 'bounced', reason = ?, reason_at = ? WHERE id = ?").bind(nw.why, nw.at, r.id).run(); out.stopped++; continue; }
      await setCompany(d1, r.company_id, 'paused', `company paused: ${r.name || r.email} ${nw.why}`); await d1.prepare("UPDATE camp_rcpt SET status = CASE WHEN status = 'done' THEN 'done' ELSE 'paused' END, reason = ?, reason_at = ?, replied_at = ? WHERE id = ?").bind(nw.why, nw.at, nw.at, r.id).run(); out.paused++; }
  } }

// ---------- what each mailbox has to send, day by day (campaigns + single scheduled emails) ----------
export async function loadOf(env, boxes, days = 14) {
  const d1 = await cdb(env); const t0 = now(); const D = []; for (let i = 0; i < days; i++) D.push(homeDay(t0 + i * 864e5));
  const out = [];
  for (const box of boxes) {
    const b = (await d1.prepare('SELECT * FROM camp_box WHERE mailbox = ?').bind(box).first()) || {}; const cap = b.cap || DEFAULT_CAP;
    const sentToday = ((await d1.prepare('SELECT COUNT(*) AS n FROM camp_sent WHERE mailbox = ? AND day = ?').bind(box, D[0]).first()) || {}).n || 0;
    const plan = new Map(D.map((d) => [ d, { d, camp: 0, single: 0 } ])); plan.get(D[0]).sent = sentToday;
    const pend = (await d1.prepare("SELECT r.next_at, r.tz, r.iso FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.mailbox = ? AND c.status = 'active' AND r.status IN ('active', 'sending') ORDER BY r.next_at").bind(box).all()).results || [];
    let di = 0; let used = sentToday;
    for (const r of pend) { const want = homeDay(Math.max(t0, nextOpen(Math.max(t0, r.next_at || t0), r.tz, 0, r.iso)));
      let i = Math.max(di, D.indexOf(want) < 0 ? (want < D[0] ? 0 : D.length) : D.indexOf(want)); if (i !== di) { di = i; used = i === 0 ? sentToday : 0; }
      while (di < D.length && used >= cap) { di++; used = 0; } if (di >= D.length) break; plan.get(D[di]).camp++; used++; }
    try { const q = (await d1.prepare("SELECT send_at FROM mail_queue WHERE mailbox = ? AND status = 'pending'").bind(box).all()).results || []; q.forEach((x) => { const p = plan.get(homeDay(x.send_at)); p && p.single++; }); } catch { /* no queue table yet */ }
    const left = pend.length - [ ...plan.values() ].reduce((a, p) => a + p.camp, 0);
    out.push({ mailbox: box, cap, err: b.err && b.err_at > t0 - 864e5 ? b.err : '', err_at: b.err_at || 0, today: sentToday, waiting: pend.length, later: Math.max(0, left), days: [ ...plan.values() ] });
  }
  return out; }

// ---------- /api/gmail/camp/… ----------
const FILEREF = (L) => [].concat(L || []).filter((x) => x && typeof x.key === 'string' && x.key && !x.key.startsWith('_')).slice(0, 8).map((x) => ({ key: x.key.slice(0, 300), name: String(x.name || x.key).slice(0, 200), size: Number(x.size) || 0 }));
const SAFE_STEP = (s, i) => ({ subject: String(s.subject || '').slice(0, 300), body: String(s.body || '').slice(0, 20000), wait: i ? Math.max(1, Math.min(60, Math.round(Number(s.wait) || 3))) : 0, hour: Math.max(OPEN, Math.min(CLOSE - 1, Math.round(Number(s.hour) || OPEN))), files: FILEREF(s.files), images: FILEREF(s.images).slice(0, 6) });
const SAFE_FB = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => /^[a-z_]{2,20}$/.test(k)).map(([k, v]) => [ k, String(v ?? '').slice(0, 120) ]));
const TOUCH = new Set([ 'pause', 'continue', 'stop' ]);
async function counts(d1, id) { const rs = (await d1.prepare('SELECT status, COUNT(*) AS n, SUM(step) AS steps, COUNT(DISTINCT company_id) AS cos FROM camp_rcpt WHERE camp_id = ? GROUP BY status').bind(id).all()).results || [];
  const o = { total: 0, emails: 0 }; rs.forEach((x) => { o[x.status] = x.n; o.total += x.n; o.emails += x.steps || 0; }); o.replied = ((await d1.prepare('SELECT COUNT(*) AS n FROM camp_rcpt WHERE camp_id = ? AND replied_at IS NOT NULL').bind(id).first()) || {}).n || 0;
  o.companies = ((await d1.prepare('SELECT COUNT(DISTINCT company_id) AS n FROM camp_rcpt WHERE camp_id = ?').bind(id).first()) || {}).n || 0; return o; }

export async function campRoute(sub, request, env, ctx) {
  const { login, me, boxes } = ctx; const d1 = await cdb(env); const url = new URL(request.url); const house = me.role === 'House';
  const mineCamp = async (id) => { const c = await d1.prepare('SELECT * FROM camp WHERE id = ?').bind(String(id || '')).first(); if (!c) throw Object.assign(new Error('Campaign not found'), { status: 404 }); if (c.login !== login && !house) throw Object.assign(new Error('Not your campaign'), { status: 403 }); return c; };
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
  if (sub === 'list') { const rs = (await d1.prepare(`SELECT * FROM camp WHERE ${house ? '1 = 1' : 'login = ?'} ORDER BY created DESC LIMIT 200`).bind(...(house ? [] : [ login ])).all()).results || [];
    const L = []; for (const c of rs) L.push({ ...c, steps: parse(c.steps, []), fallbacks: parse(c.fallbacks, {}), log: undefined, n: await counts(d1, c.id) }); return json({ camps: L }); }
  if (sub === 'get') { const c = await mineCamp(url.searchParams.get('id')); const rs = (await d1.prepare('SELECT id, seq, company_id, company, person_id, kind, name, title, email, iso, country, city, tz, step, next_at, status, reason, reason_at, on_touch, last_at, thread_id, err, replied_at FROM camp_rcpt WHERE camp_id = ? ORDER BY seq').bind(c.id).all()).results || [];
    return json({ camp: { ...c, steps: parse(c.steps, []), fallbacks: parse(c.fallbacks, {}), log: undefined, n: await counts(d1, c.id) }, rcpts: rs }); }
  if (sub === 'load') return json({ boxes: await loadOf(env, boxes), cap: DEFAULT_CAP });
  if (sub === 'company') { const cid = String(url.searchParams.get('cid') || ''); const rs = (await d1.prepare("SELECT r.id, r.camp_id, r.name, r.email, r.step, r.status, r.next_at, r.reason, r.tz, c.name AS camp, c.steps AS steps, c.status AS cstatus, c.login AS login FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE r.company_id = ? AND c.status != 'stopped' AND r.status IN ('active', 'sending', 'paused') ORDER BY r.next_at").bind(cid).all()).results || [];
    return json({ rows: rs.filter((r) => house || r.login === login).map((r) => ({ ...r, login: undefined, steps: parse(r.steps, []).length })), others: rs.some((r) => !house && r.login !== login) }); }
  if (sub === 'busyco') { const rs = (await d1.prepare("SELECT DISTINCT r.company_id AS id, c.name AS camp, c.login AS login FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.status IN ('active', 'paused') AND r.status IN ('active', 'sending', 'paused')").all()).results || []; return json({ rows: rs.map((x) => ({ id: x.id, camp: house || x.login === login ? x.camp : 'a teammate’s campaign' })) }); }
  if (sub === 'check') { const em = [ ...new Set([].concat(body.emails || []).map((e) => String(e).toLowerCase().trim()).filter(okEmail)) ].slice(0, MAX_RCPT * 3); const busy = [], bounced = [];
    for (let i = 0; i < em.length; i += 80) { const part = em.slice(i, i + 80); const rs = (await d1.prepare(`SELECT r.email, c.name, c.login FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.status IN ('active', 'paused') AND r.status IN ('active', 'sending', 'paused') AND r.email IN (${part.map(() => '?').join(',')})`).bind(...part).all()).results || []; busy.push(...rs.map((x) => ({ email: x.email, camp: house || x.login === login ? x.name : 'a teammate’s campaign' })));
      const bb = (await d1.prepare(`SELECT DISTINCT email, reason FROM camp_rcpt WHERE status = 'bounced' AND email IN (${part.map(() => '?').join(',')})`).bind(...part).all()).results || []; bounced.push(...bb.map((x) => ({ email: x.email, why: x.reason || 'bounced' }))); }
    return json({ busy, bounced }); }
  if (sub === 'cap' && request.method === 'POST') { const box = String(body.mailbox || '').toLowerCase(); if (!boxes.includes(box)) return json({ error: `You can’t use ${box || 'that mailbox'}` }, 403); const cap = Math.max(1, Math.min(300, Math.round(Number(body.cap) || DEFAULT_CAP)));
    await d1.prepare('INSERT INTO camp_box (mailbox, cap, next_ok, swept) VALUES (?, ?, 0, 0) ON CONFLICT(mailbox) DO UPDATE SET cap = excluded.cap').bind(box, cap).run(); return json({ ok: true, cap }); }
  if (sub === 'create' && request.method === 'POST') {
    const box = String(body.mailbox || '').toLowerCase(); if (!boxes.includes(box)) return json({ error: `You can’t use ${box || 'that mailbox'} — ask House to add it to your Medint People record` }, 403);
    const aliases = await sendAsOf(env, box).catch(() => []); const sender = String(body.sender || box).toLowerCase(); const al = aliases.find((a) => a.email === sender); if (!al && sender !== box) return json({ error: `${sender} isn’t a “Send mail as” address of ${box}` }, 400);
    const steps = [].concat(body.steps || []).slice(0, MAX_STEPS).map(SAFE_STEP); if (!steps.length || !steps[0].subject.trim()) return json({ error: 'The first email needs a subject' }, 400); if (steps.some((s) => !s.body.trim())) return json({ error: 'Every email needs some text' }, 400);
    const seen = new Set(); const skipped = []; const rows = [];
    const busy = new Set(); if (!body.allowBusy) { const em = [ ...new Set([].concat(body.rcpts || []).map((r) => String(r.email || '').toLowerCase().trim())) ]; for (let i = 0; i < em.length; i += 80) { const part = em.slice(i, i + 80); if (!part.length) continue; ((await d1.prepare(`SELECT r.email FROM camp_rcpt r JOIN camp c ON c.id = r.camp_id WHERE c.status IN ('active', 'paused') AND r.status IN ('active', 'sending', 'paused') AND r.email IN (${part.map(() => '?').join(',')})`).bind(...part).all()).results || []).forEach((x) => busy.add(x.email)); } }
    for (const r of [].concat(body.rcpts || []).slice(0, MAX_RCPT)) { const e = String(r.email || '').toLowerCase().trim();
      if (!okEmail(e)) { skipped.push({ email: e, why: 'not a valid email' }); continue; } if (seen.has(e)) { skipped.push({ email: e, why: 'duplicate' }); continue; } if (busy.has(e)) { skipped.push({ email: e, why: 'already in another campaign' }); continue; }
      seen.add(e); rows.push({ ...r, email: e }); }
    [].concat(body.rcpts || []).length > MAX_RCPT && skipped.push({ email: '', why: `only the first ${MAX_RCPT} people fit in one campaign — make a second one for the rest` });
    if (!rows.length) return json({ error: 'No one to send to', skipped }, 400);
    const id = uid(); const t = now(); const start = Math.max(t, Number(body.start) || t); const on = TOUCH.has(body.on_touch) ? body.on_touch : 'pause';
    const optout = body.optout ? String(body.optout).slice(0, 300) : '';
    await d1.prepare('INSERT INTO camp (id, login, name, mailbox, sender, sender_name, brand, steps, on_touch, optout, status, created, start_at, log, fallbacks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, login, String(body.name || 'Campaign').slice(0, 120), box, sender, String(body.sender_name || (al && al.name) || '').slice(0, 120), String(body.brand || '').slice(0, 60), JSON.stringify(steps), on, optout, 'draft', t, start, JSON.stringify(body.log || {}), JSON.stringify(SAFE_FB(body.fallbacks))).run(); // 'draft' until every recipient is saved
    // round-robin across companies, so two people of one company don't get it back to back
    const coIdx = new Map(), within = new Map(); rows.forEach((r) => { const k = r.company_id || r.email; coIdx.has(k) || coIdx.set(k, coIdx.size); const w = within.get(k) || 0; within.set(k, w + 1); r.__w = w; r.__c = coIdx.get(k); });
    let i = 0; const stmts = []; for (const r of rows) { const tz = tzOf(r.iso); const seq = r.__w * 100000 + r.__c;
      stmts.push(d1.prepare('INSERT INTO camp_rcpt (id, camp_id, seq, company_id, company, person_id, kind, name, title, email, iso, country, city, tz, step, next_at, status, on_touch, watch_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)')
        .bind(`${id}:${i++}`, id, seq, String(r.company_id || ''), String(r.company || '').slice(0, 200), String(r.person_id || ''), r.kind === 'person' ? 'person' : 'company', String(r.name || '').slice(0, 200), String(r.title || '').slice(0, 200), r.email, String(r.iso || '').toUpperCase(), String(r.country || ''), String(r.city || ''), tz, nextOpen(start, tz, 45, String(r.iso || '').toUpperCase()), 'active', TOUCH.has(r.on_touch) ? r.on_touch : null, t)); }
    try { for (let k = 0; k < stmts.length; k += 50) { const part = stmts.slice(k, k + 50); if (d1.batch) await d1.batch(part); else for (const st of part) await st.run(); } } // one round trip per 50 people
    catch (e) { await d1.prepare('DELETE FROM camp_rcpt WHERE camp_id = ?').bind(id).run().catch(() => {}); await d1.prepare('DELETE FROM camp WHERE id = ?').bind(id).run().catch(() => {}); throw e; } // nothing half-made
    await d1.prepare("UPDATE camp SET status = 'active' WHERE id = ?").bind(id).run();
    return json({ ok: true, id, added: rows.length, skipped }); }
  if (sub === 'act' && request.method === 'POST') { const c = await mineCamp(body.id); const a = body.action;
    if (a === 'pause') await d1.prepare("UPDATE camp SET status = 'paused' WHERE id = ? AND status = 'active'").bind(c.id).run();
    else if (a === 'resume') { await d1.prepare("UPDATE camp SET status = 'active' WHERE id = ? AND status IN ('paused', 'done')").bind(c.id).run(); await reschedule(d1, c.id, ''); }
    else if (a === 'stop') { await d1.prepare("UPDATE camp SET status = 'stopped' WHERE id = ?").bind(c.id).run(); await d1.prepare("UPDATE camp_rcpt SET status = 'stopped', reason = 'campaign stopped', reason_at = ? WHERE camp_id = ? AND status IN ('active', 'sending', 'paused')").bind(now(), c.id).run(); }
    else if (a === 'edit') { const steps = [].concat(body.steps || []).slice(0, MAX_STEPS).map(SAFE_STEP); if (!steps.length || !steps[0].subject.trim() || steps.some((s) => !s.body.trim())) return json({ error: 'Every email needs text, and the first one a subject' }, 400);
      await d1.prepare('UPDATE camp SET steps = ?, name = ?, on_touch = ?, optout = ?, fallbacks = ? WHERE id = ?').bind(JSON.stringify(steps), String(body.name || c.name).slice(0, 120), TOUCH.has(body.on_touch) ? body.on_touch : c.on_touch, body.optout != null ? String(body.optout).slice(0, 300) : c.optout, body.fallbacks ? JSON.stringify(SAFE_FB(body.fallbacks)) : (c.fallbacks || '{}'), c.id).run();
      // follow-ups added → people who had finished get the new ones; removed → those already past the end are done
      const done = (await d1.prepare("SELECT id, step, last_at, tz FROM camp_rcpt WHERE camp_id = ? AND status = 'done'").bind(c.id).all()).results || [];
      for (const r of done) if (r.step < steps.length && r.last_at) await d1.prepare("UPDATE camp_rcpt SET status = 'active', next_at = ? WHERE id = ?").bind(afterDays(r.last_at, r.tz, steps[r.step].wait, steps[r.step].hour, 40, r.iso), r.id).run();
      await d1.prepare("UPDATE camp_rcpt SET status = 'done' WHERE camp_id = ? AND status = 'active' AND step >= ?").bind(c.id, steps.length).run();
      c.status === 'done' && await d1.prepare("UPDATE camp SET status = 'active' WHERE id = ? AND EXISTS (SELECT 1 FROM camp_rcpt r WHERE r.camp_id = camp.id AND r.status = 'active')").bind(c.id).run(); }
    else return json({ error: 'unknown action' }, 400);
    return json({ ok: true }); }
  if (sub === 'who' && request.method === 'POST') { const c = await mineCamp(body.id); const a = body.action; const where = body.company != null ? ['company_id = ?', String(body.company)] : ['id = ?', String(body.rcpt || '')];
    if (a === 'touch') { if (!TOUCH.has(body.value)) return json({ error: 'pause, continue or stop' }, 400); await d1.prepare(`UPDATE camp_rcpt SET on_touch = ? WHERE camp_id = ? AND ${where[0]}`).bind(body.value, c.id, where[1]).run(); return json({ ok: true }); }
    if (a === 'pause') await d1.prepare(`UPDATE camp_rcpt SET status = 'paused', reason = ?, reason_at = ? WHERE camp_id = ? AND ${where[0]} AND status IN ('active', 'sending')`).bind(`paused by ${me.name || login}`, now(), c.id, where[1]).run();
    else if (a === 'stop') await d1.prepare(`UPDATE camp_rcpt SET status = 'stopped', reason = ?, reason_at = ? WHERE camp_id = ? AND ${where[0]} AND status IN ('active', 'sending', 'paused')`).bind(`stopped by ${me.name || login}`, now(), c.id, where[1]).run();
    else if (a === 'continue') { await reschedule(d1, c.id, where); }
    else return json({ error: 'unknown action' }, 400);
    await finishCamps(d1); return json({ ok: true }); }
  return json({ error: 'unknown' }, 404); }

// paused → active again: from now on we watch for new interactions only; the next email keeps its place (or goes at the next working hour)
async function reschedule(d1, campId, where) { const steps = parse(((await d1.prepare('SELECT steps FROM camp WHERE id = ?').bind(campId).first()) || {}).steps, []);
  const rs = (await d1.prepare(`SELECT * FROM camp_rcpt WHERE camp_id = ? AND status = 'paused'${where ? ` AND ${where[0]}` : ''}`).bind(...[campId, ...(where ? [where[1]] : [])]).all()).results || [];
  for (const r of rs) { const nx = steps[r.step]; const t = now(); const when = !nx ? null : r.step === 0 || !r.last_at ? nextOpen(Math.max(t, r.next_at || t), r.tz, 45, r.iso) : Math.max(nextOpen(t, r.tz, 45, r.iso), afterDays(r.last_at, r.tz, nx.wait, nx.hour, 40, r.iso));
    await d1.prepare('UPDATE camp_rcpt SET status = ?, next_at = ?, watch_from = ?, reason = NULL, reason_at = NULL WHERE id = ?').bind(nx ? 'active' : 'done', when, t, r.id).run(); } }
