/**
 * Profile photos for Medint people (website only — the page may only show images from its own address).
 *   GET /api/avatar?email=…  → the person's public Gravatar photo, or 404 when they have none
 *   GET /api/avatar?url=…    → an image from a link you pasted (e.g. a company "team" page), so the page can save a small copy
 */
const ok = (r) => new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'private, max-age=604800' } });
const none = () => new Response('', { status: 404, headers: { 'cache-control': 'private, max-age=86400' } });
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestGet({ request }) {
  const u = new URL(request.url); const email = (u.searchParams.get('email') || '').trim().toLowerCase(); const link = u.searchParams.get('url') || '';
  try {
    if (email && /@/.test(email)) { const r = await fetch(`https://www.gravatar.com/avatar/${await sha256(email)}?s=96&d=404`, { cf: { cacheTtl: 604800 }, signal: AbortSignal.timeout(8000) }); return r.ok ? ok(r) : none(); }
    if (/^https:\/\//i.test(link)) { const r = await fetch(link, { headers: { 'user-agent': 'Mozilla/5.0 (Medint)' }, signal: AbortSignal.timeout(8000) }); const ct = r.headers.get('content-type') || ''; const n = Number(r.headers.get('content-length') || 0);
      if (!r.ok || !/^image\//.test(ct) || n > 3e6) return none(); return ok(r); }
  } catch { /* fall through */ }
  return none();
}
