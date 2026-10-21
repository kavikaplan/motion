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
  if (request.method === 'POST') { const fd = await request.formData(); const f = fd.get('file'); if (!f || typeof f === 'string') return json({ error: 'no file' }, 400); if (f.size > 20 * 1024 * 1024) return json({ error: 'Files up to 20 MB' }, 413);
    const k = `${Date.now().toString(36)}-${String(f.name).replace(/[^\w.\- ]+/g, '_').slice(0, 120)}`; await env.FILES.put(k, f.stream(), { httpMetadata: { contentType: f.type || 'application/octet-stream' }, customMetadata: { name: f.name, by: login } }); return json({ ok: true, key: k, name: f.name, size: f.size }); }
  if (request.method === 'DELETE' && key) { const o0 = await env.FILES.head(key); if (!o0) return json({ ok: true }); if (((o0.customMetadata || {}).by || '') !== login && !(await house())) return json({ error: 'Only the person who uploaded it (or House) can delete it' }, 403); await env.FILES.delete(key); return json({ ok: true }); }
  return json({ error: 'not allowed' }, 405);
}
