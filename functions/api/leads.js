import { quota } from '../_lib/quota.js';
import { discover } from '../_lib/discover.js';
/**
 * GET /api/leads?domain=&name=&country=   → company info + people + emails from Apollo and Snov (whichever keys are set)
 * POST /api/leads { source: 'apollo', id } | { source: 'snov', hash } → reveal one person's email (uses a credit)
 * Secrets: APOLLO_API_KEY · SNOV_CLIENT_ID + SNOV_CLIENT_SECRET
 */
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const T = (ms) => AbortSignal.timeout(ms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function apollo(env, path, body, method = 'POST') { const r = await fetch(`https://api.apollo.io/api/v1/${path}`, { method, headers: { 'content-type': 'application/json', 'cache-control': 'no-cache', 'x-api-key': env.APOLLO_API_KEY }, ...(body ? { body: JSON.stringify(body) } : {}), signal: T(15000) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`Apollo: ${d.error || d.message || r.status}`); return d; }
let snovTok = { t: '', exp: 0 };
// Snov out of credits: recognised, said plainly, and no more Snov calls for 30 minutes (each call would only fail again)
const SNOV_NOCREDIT = /credit|balance|limit (is )?(exceeded|reached)|not enough|insufficient|upgrade|payment required|no (more )?(searches|requests) left|quota/i;
export const SNOV_MSG = 'Snov credits are used up — Snov was skipped (Apollo and the website still ran). Add credits in Snov to look up and check emails again.';
let snovOutUntil = 0;
export const snovOut = () => Date.now() < snovOutUntil;
function snovErr(status, body) { const msg = String((body && (body.message || body.error || body.errors && JSON.stringify(body.errors) || body.error_description)) || '').slice(0, 200); if (status === 402 || SNOV_NOCREDIT.test(msg)) { snovOutUntil = Date.now() + 30 * 60e3; return Object.assign(new Error(SNOV_MSG), { code: 'snov_credits', raw: msg }); } return new Error(`Snov: ${msg || status}`); }
async function snovToken(env) { if (snovTok.exp > Date.now() + 60e3) return snovTok.t; const r = await fetch('https://api.snov.io/v1/oauth/access_token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SNOV_CLIENT_ID, client_secret: env.SNOV_CLIENT_SECRET }), signal: T(10000) }); const d = await r.json().catch(() => ({})); if (!d.access_token) throw new Error(`Snov: ${d.error_description || d.message || r.status}`); snovTok = { t: d.access_token, exp: Date.now() + (d.expires_in || 3000) * 1000 }; return d.access_token; }
async function snovTask(env, start, resultBase) { if (snovOut()) throw Object.assign(new Error(SNOV_MSG), { code: 'snov_credits' }); const tok = await snovToken(env); const r = await fetch(`https://api.snov.io/v2/${start}`, { method: 'POST', headers: { authorization: `Bearer ${tok}` }, signal: T(15000) }); const d = await r.json().catch(() => ({})); const h = d.task_hash || (d.meta && d.meta.task_hash) || (d.data && d.data.task_hash); if (!h) throw snovErr(r.status, d);
  for (let i = 0; i < 8; i++) { await sleep(i ? 1500 : 900); const g = await fetch(`https://api.snov.io/v2/${resultBase}/${h}`, { headers: { authorization: `Bearer ${tok}` }, signal: T(10000) }); const x = await g.json().catch(() => ({})); if (g.status === 402 || ((x.success === false || x.error || x.errors) && SNOV_NOCREDIT.test(JSON.stringify(x).slice(0, 600)))) throw snovErr(g.status, x); const st = String(x.status || (x.meta && x.meta.status) || '').toLowerCase(); if (st === 'completed' || (x.data && !/progress/.test(st))) return x; } return { data: [] }; }
const emailsOf = (o) => [...new Set(JSON.stringify(o || {}).match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])].map((e) => e.toLowerCase()).filter((e) => !/\.(png|jpg|gif)$/.test(e));
const host = (u) => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
export async function onRequestGet({ request, env }) {
  { const q = await quota(request, env, 'leads'); if (q) return q; }
  const u = new URL(request.url); let domain = host(u.searchParams.get('domain')); const name = u.searchParams.get('name') || ''; const country = u.searchParams.get('country') || '';
  const ready = { apollo: !!env.APOLLO_API_KEY, snov: !!(env.SNOV_CLIENT_ID && env.SNOV_CLIENT_SECRET) }; const out = { ready, domain, company: null, people: [], emails: [], errors: [] };
  if (!ready.apollo && !ready.snov) return json({ ...out, errors: ['Add APOLLO_API_KEY and/or SNOV_CLIENT_ID + SNOV_CLIENT_SECRET in Cloudflare to search Apollo and Snov.'] });
  // find the domain from the name when NetHunt has no website (Apollo company search)
  // no website: Richard's search by name first (the company's own site, confirmed on its page), then Apollo's company search
  if (!domain && name && (env.SERPER_API_KEY || env.FIRECRAWL_API_KEY || (env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_SERP_ZONE))) { try { const d = await discover(env, name, country, { instagram: false }); if (d.website) { domain = host(d.website); out.domain = domain; out.domain_from = 'search'; out.domain_ownership = d.website_ownership || ''; out.domain_note = d.website_evidence || ''; } else out.search_note = d.error || 'no website of theirs found by name'; } catch (e) { out.search_note = `search failed: ${e.message || e}`; } }
  if (!domain && ready.apollo && name) { out.domain_from = 'apollo'; try { const d = await apollo(env, 'mixed_companies/search', { q_organization_name: name, ...(country ? { organization_locations: [country] } : {}), per_page: 3 }); const o = (d.organizations || d.accounts || [])[0]; if (o) { domain = host(o.primary_domain || o.website_url); out.domain = domain; out.domainGuess = { name: o.name, domain }; } } catch (e) { out.errors.push(String(e.message || e)); } }
  const jobs = [];
  if (ready.apollo && domain) jobs.push((async () => { try { const d = await apollo(env, `organizations/enrich?domain=${encodeURIComponent(domain)}`, null, 'GET'); const o = d.organization || {}; out.company = { source: 'Apollo', name: o.name, website: o.website_url, linkedin: o.linkedin_url, facebook: o.facebook_url, phone: (o.primary_phone && (o.primary_phone.sanitized_number || o.primary_phone.number)) || o.phone || o.sanitized_phone, address: [o.street_address, o.city, o.state, o.country].filter(Boolean).join(', ') || o.raw_address, city: o.city, employees: o.estimated_num_employees, industry: o.industry, description: o.short_description, founded: o.founded_year }; } catch (e) { out.errors.push(String(e.message || e)); }
    try { const d = await apollo(env, 'mixed_people/api_search', { q_organization_domains_list: [domain], per_page: 15 }); (d.people || d.contacts || []).forEach((p) => out.people.push({ source: 'Apollo', id: p.id, name: [p.first_name, p.last_name || p.last_name_obfuscated].filter(Boolean).join(' '), title: p.title, linkedin: p.linkedin_url, email: p.email && !/not_unlocked|email_not/.test(p.email) ? p.email : '', canReveal: !!(p.has_email || p.id), city: p.city, country: p.country })); } catch (e) { out.errors.push(String(e.message || e)); } })());
  if (ready.snov && domain && snovOut()) out.snov = 'no_credits';
  if (ready.snov && domain && !snovOut()) jobs.push((async () => { try { const x = await snovTask(env, `domain-search/domain-emails/start?domain=${encodeURIComponent(domain)}`, 'domain-search/domain-emails/result'); emailsOf(x.data).forEach((e) => out.emails.push({ source: 'Snov', email: e })); } catch (e) { out.errors.push(String(e.message || e)); }
    try { const x = await snovTask(env, `domain-search/prospects/start?domain=${encodeURIComponent(domain)}`, 'domain-search/prospects/result'); [].concat(x.data || []).slice(0, 20).forEach((p) => out.people.push({ source: 'Snov', hash: (String(p.search_emails_start || '').match(/start\/([^/?]+)/) || [])[1] || p.prospect_hash || '', name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.name, title: p.position, linkedin: p.source_page && /linkedin/.test(p.source_page) ? p.source_page : '', email: '', canReveal: !!(p.search_emails_start || p.prospect_hash) })); } catch (e) { out.errors.push(String(e.message || e)); } })());
  await Promise.all(jobs); if (snovOut()) { out.snov = 'no_credits'; out.errors = [ ...new Set([ ...out.errors.filter((e) => e !== SNOV_MSG && !/^Snov:/.test(e)), SNOV_MSG ]) ]; }
  if (!domain) out.errors.push(`No website for this company${out.search_note ? ` — ${out.search_note}` : ''}${ready.apollo ? ' (Apollo found none by name either)' : ''} — add one to search Apollo and Snov by domain.`);
  return json(out);
}
export async function onRequestPost({ request, env }) {
  { const q = await quota(request, env, 'leads'); if (q) return q; }
  const q = await request.json().catch(() => ({}));
  if (q.action === 'verify') return json(await verify(env, [].concat(q.emails || []).map((e) => String(e).trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)).slice(0, 20)));
  try { if (q.source === 'apollo' && env.APOLLO_API_KEY) { const d = await apollo(env, 'people/match', { id: q.id, reveal_personal_emails: false }); const p = d.person || {}; return json({ email: p.email && !/not_unlocked/.test(p.email) ? p.email : '', phone: ((p.phone_numbers || [])[0] || {}).sanitized_number || '', linkedin: p.linkedin_url || '', title: p.title || '' }); }
    if (q.source === 'snov' && snovOut()) return json({ error: SNOV_MSG, code: 'snov_credits' }, 402);
    if (q.source === 'snov' && q.hash && env.SNOV_CLIENT_ID) { const x = await snovTask(env, `domain-search/prospects/search-emails/start/${encodeURIComponent(q.hash)}`, 'domain-search/prospects/search-emails/result'); return json({ email: emailsOf(x.data)[0] || '' }); }
    return json({ error: 'not available' }, 400); } catch (e) { return json({ error: String(e.message || e), code: e.code || '' }, e.code === 'snov_credits' ? 402 : 502); }
}

// email check with the mail server (Snov email verifier): deliverable · risky (catch-all, greylisting, unknown) · undeliverable
async function verify(env, emails) {
  if (!emails.length) return { results: [] }; if (!(env.SNOV_CLIENT_ID && env.SNOV_CLIENT_SECRET)) return { error: 'Email check needs SNOV_CLIENT_ID + SNOV_CLIENT_SECRET in Cloudflare', results: [] };
  if (snovOut()) return { error: SNOV_MSG, code: 'snov_credits', results: [] };
  const tok = await snovToken(env); const fd = new URLSearchParams(); emails.forEach((e) => fd.append('emails[]', e));
  const r = await fetch('https://api.snov.io/v2/email-verification/start', { method: 'POST', headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/x-www-form-urlencoded' }, body: fd, signal: T(15000) }); const j = await r.json().catch(() => ({}));
  const h = j.task_hash || (j.data && j.data.task_hash) || (j.meta && j.meta.task_hash); if (!h) { const er = snovErr(r.status, j); return { error: er.message, code: er.code || '', results: [] }; }
  for (let i = 0; i < 12; i++) { await sleep(i ? 2500 : 1500); const g = await fetch(`https://api.snov.io/v2/email-verification/result?task_hash=${encodeURIComponent(h)}`, { headers: { authorization: `Bearer ${tok}` }, signal: T(10000) }); const x = await g.json().catch(() => ({}));
    if (/progress|pending/i.test(String(x.status || (x.meta && x.meta.status) || ''))) continue; const rows = [].concat(x.data || []); if (!rows.length) continue;
    return { results: rows.map((o) => { const res = o.result || o; const s = String(res.smtp_status || res.status || '').toLowerCase(); const catchAll = !!(res.is_catchall || res.catch_all || /catch/.test(s));
      const state = /^(valid|deliverable)$/.test(s) && !catchAll ? 'deliverable' : /not_valid|invalid|undeliverable|bounce/.test(s) ? 'undeliverable' : 'risky';
      return { email: String(o.email || '').toLowerCase(), state, detail: [s, catchAll && 'catch-all', res.is_webmail && 'webmail', res.is_gibberish && 'gibberish'].filter(Boolean).join(' · ') }; }) }; }
  return { error: 'Snov is still checking — try again in a minute', results: [] };
}
