/**
 * Medint file library (Cloudflare R2, binding FILES): catalogues, price lists, brochures to attach to emails.
 * GET /api/files → list · GET /api/files/<key> → the file · POST /api/files (form: file) → upload · DELETE /api/files/<key> (House)
 * The shared email templates live here too, as _templates.json (GET / PUT /api/files/_templates.json).
 */
import { json, loginOf } from '../../_lib/gmail.js';
import { whoIs } from '../../_lib/access.js';
import { callTool } from '../nethunt.js';
export async function onRequest({ request, env, params }) {
  if (!env.FILES) return json({ error: 'The file library isn’t set up (R2 bucket medint-files).', code: 'not_configured' }, 501);
  const login = loginOf(request); if (!login) return json({ error: 'not signed in' }, 401);
  const key = [].concat(params.path || []).join('/'); const house = async () => { try { return (await whoIs(env, (n, a) => callTool(env, n, a), login)).role === 'House'; } catch { return false; } };
  if (request.method === 'GET' && !key) { const L = await env.FILES.list({ limit: 1000, include: ['customMetadata', 'httpMetadata'] }); return json({ files: (L.objects || []).filter((o) => !o.key.startsWith('_')).map((o) => ({ key: o.key, name: (o.customMetadata && o.customMetadata.name) || o.key, size: o.size, type: (o.httpMetadata && o.httpMetadata.contentType) || '', by: (o.customMetadata && o.customMetadata.by) || '', at: o.uploaded })) }); }
  if (request.method === 'GET') { const o = await env.FILES.get(key); if (!o) return json({ error: 'not found' }, 404); return new Response(o.body, { headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'application/octet-stream', 'content-disposition': `inline; filename="${encodeURIComponent((o.customMetadata && o.customMetadata.name) || key)}"`, 'cache-control': 'private, max-age=300' } }); }
  if (request.method === 'PUT' && key === '_templates.json') { const t = await request.text(); try { JSON.parse(t); } catch { return json({ error: 'not JSON' }, 400); } await env.FILES.put(key, t, { httpMetadata: { contentType: 'application/json' } }); return json({ ok: true }); }
  // a picture that sits on another website (pasted from Gmail, Google Docs or a web page) is copied here, so every account and every recipient sees it
  if (request.method === 'POST' && new URL(request.url).searchParams.get('copy') === '1') { let u = ''; try { u = String((await request.json()).url || ''); } catch { /* no body */ } if (!/^https?:\/\//i.test(u) || u.length > 4000) return json({ error: 'not a picture link' }, 400);
    let r; try { r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', accept: 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(12000) }); } catch (e) { return json({ error: `the picture’s website didn’t answer (${e.message || e})`, code: 'unreachable' }, 502); }
    const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(); if (!r.ok || !/^image\/(png|jpe?g|gif|webp)$/.test(ct)) return json({ error: r.ok ? 'the link doesn’t give a picture — it is probably only visible when signed in to that Google account' : `the picture’s website said ${r.status} — it is probably only visible when signed in`, code: 'private' }, 422);
    const buf = await r.arrayBuffer(); if (buf.byteLength > 5 * 1024 * 1024) return json({ error: 'Images up to 5 MB' }, 413); if (!buf.byteLength) return json({ error: 'empty picture', code: 'private' }, 422);
    const nm = `picture.${ct.split('/')[1].replace('jpeg', 'jpg')}`; const k = `_img-${Date.now().toString(36)}-${nm}`; await env.FILES.put(k, buf, { httpMetadata: { contentType: ct }, customMetadata: { name: nm, by: login, from: u.slice(0, 500) } }); return json({ ok: true, key: k, name: nm, size: buf.byteLength }); }
  if (request.method === 'POST') { const fd = await request.formData(); const f = fd.get('file'); if (!f || typeof f === 'string') return json({ error: 'no file' }, 400); if (f.size > 20 * 1024 * 1024) return json({ error: 'Files up to 20 MB' }, 413);
    const inl = new URL(request.url).searchParams.get('inline') === '1'; if (inl && !/^image\//.test(f.type || '')) return json({ error: 'Only images can go inside an email' }, 400); if (inl && f.size > 5 * 1024 * 1024) return json({ error: 'Images up to 5 MB' }, 413);
    const k = `${inl ? '_img-' : ''}${Date.now().toString(36)}-${String(f.name).replace(/[^\w.\- ]+/g, '_').slice(0, 120)}`; /* _img-: pictures pasted into an email — kept out of the file library list */ await env.FILES.put(k, f.stream(), { httpMetadata: { contentType: f.type || 'application/octet-stream' }, customMetadata: { name: f.name, by: login } }); return json({ ok: true, key: k, name: f.name, size: f.size }); }
  if (request.method === 'DELETE' && key) { const o0 = await env.FILES.head(key); if (!o0) return json({ ok: true }); if (((o0.customMetadata || {}).by || '') !== login && !(await house())) return json({ error: 'Only the person who uploaded it (or House) can delete it' }, 403); await env.FILES.delete(key); return json({ ok: true }); }
  return json({ error: 'not allowed' }, 405);
}
