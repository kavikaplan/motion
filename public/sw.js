/* Medint service worker — the app works without internet and when the Cloudflare sign-in has expired.
   · the app itself (page, scripts, styles, icons) and the data files are kept on this device
   · NetHunt answers and other reads (/api/…) come from the network when possible; offline or signed out, the last saved answer is used
   · changes made offline are NOT handled here: the page keeps them in its outbox and sends them later (dash-runtime.js)
   Version is stamped by build.py so each deploy refreshes the saved app. */
const V = 'd606c7dd71d0eed2fccd';
const SHELL = `medint-shell-${V}`;
const DATA = 'medint-data';   // data files: kept across deploys, refreshed in the background
const API = 'medint-api';     // last answers of reads, kept across deploys
const CORE = ['/', '/dash-runtime.js', '/theme.css', '/manifest.webmanifest', '/icon-192.png', '/apple-touch-icon.png', '/datasets.json', '/params.json', '/d3.min.js', '/page.d606c7dd71.js', '/app.d0eed2fccd.js'];
const NH_WRITE = /^(update_record|create_record|create_record_comment|create_record_call_log|delete_record|update_folder|update_folder_field|add_folder_field|create_folder)$/;
const API_MAX = 600;

self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // one by one: a file that fails (signed out, offline) doesn't stop the rest
    await Promise.all(CORE.filter((u) => u && !u.startsWith('__')).map(async (u) => { try { const r = await fetch(u, { cache: 'no-cache', credentials: 'same-origin', redirect: 'manual' }); if (r.ok && r.type === 'basic') await c.put(u, r); } catch (_e) { /* next time */ } }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('medint-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

// after the first visit the page sends the list of data files: the ones not saved yet are fetched quietly, one by one, so every page works offline
self.addEventListener('message', (ev) => {
  const m = ev.data || {}; if (m.type !== 'medint-warm' || !Array.isArray(m.urls)) return;
  ev.waitUntil((async () => { const c = await caches.open(DATA); for (const u of m.urls.slice(0, 80)) { if (!/^\/data\/[\w-]+\.json$/.test(u) || await c.match(u, { ignoreSearch: true })) continue; try { const r = await fetch(u, { redirect: 'manual' }); if (r.ok && r.type === 'basic') await c.put(u, r); else if (signedOut(r)) return; } catch (_e) { return; } } })());
});
const tell = async (msg) => { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); };
const signedOut = (r) => r.type === 'opaqueredirect' || (r.redirected && !new URL(r.url).origin.startsWith(self.location.origin));
const json = (o, status, extra) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', ...(extra || {}) } });
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + s.length.toString(36); }
async function trim(c) { const ks = await c.keys(); for (let i = 0; i < ks.length - API_MAX; i++) await c.delete(ks[i]); }
const saved = (r, how) => { const h = new Headers(r.headers); h.set('x-medint-saved', how); return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); };

self.addEventListener('fetch', (ev) => {
  const req = ev.request; const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                       // other sites: the browser as usual
  if (url.searchParams.has('ping') || url.pathname.startsWith('/cdn-cgi/')) return; // sign-in checks and Cloudflare's own pages
  if (req.mode === 'navigate') return ev.respondWith(page(req, url));
  if (req.method === 'GET' && /^\/app\.[0-9a-f]+\.js$|^\/page\.[0-9a-f]+\.js$/.test(url.pathname)) return ev.respondWith(immutable(req)); // never change once deployed
  if (req.method === 'GET' && (url.pathname.startsWith('/data/') || /^\/(datasets|params)\.json$|^\/(dash-runtime\.js|theme\.css|d3\.min\.js|xlsx\.full\.min\.js|manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)$/.test(url.pathname))) return ev.respondWith(fresh(req, url.pathname.startsWith('/data/') ? DATA : SHELL));
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'GET') return ev.respondWith(read(req, req.url));
    if (req.method === 'POST' && url.pathname === '/api/nethunt') return ev.respondWith(nethunt(req));
  }
});

// the page: from the network when it can (a new deploy shows at once); offline or signed out → the saved app, which then offers “Sign in again”
async function page(req, url) {
  const c = await caches.open(SHELL);
  try {
    const r = await fetch(req);
    if (signedOut(r) && !url.searchParams.has('signin')) { const s = await c.match('/'); if (s) { tell({ type: 'medint-signin' }); return s; } }
    if (r.ok && r.type === 'basic' && url.pathname === '/') c.put('/', r.clone());
    return r;
  } catch (_e) { return (await c.match('/')) || (await c.match(req)) || new Response('<!doctype html><meta name=viewport content="width=device-width"><body style="font:16px system-ui;padding:24px;background:#111;color:#eee">📴 Medint isn’t saved on this device yet. Open it once with internet, then it works offline.</body>', { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }); }
}
async function immutable(req) {
  const c = await caches.open(SHELL); const hit = await c.match(req); if (hit) return hit;
  const r = await fetch(req); if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r;
}
// stale-while-revalidate: the saved copy at once, a fresh one saved for next time
async function fresh(req, name) {
  const c = await caches.open(name); const hit = await c.match(req, { ignoreSearch: name === DATA });
  const net = fetch(req, { redirect: 'manual' }).then((r) => { if (r.ok && r.type === 'basic') { c.put(req, r.clone()); return r; } if (signedOut(r)) tell({ type: 'medint-signin' }); return null; }).catch(() => null);
  if (hit) { net.catch(() => {}); return hit; }
  return (await net) || new Response('', { status: 504 });
}
// reads: network first; offline or signed out → the last saved answer
async function read(req, key) {
  const c = await caches.open(API);
  try {
    const r = await fetch(req, { redirect: 'manual' });
    if (signedOut(r)) { tell({ type: 'medint-signin' }); const hit = await c.match(key); return hit ? saved(hit, 'signin') : json({ error: 'Sign in again to load this', code: 'signin' }, 401, { 'x-medint-signin': '1' }); }
    if (r.ok) { c.put(key, r.clone()).then(() => trim(c)).catch(() => {}); }
    return r;
  } catch (_e) {
    const hit = await c.match(key); return hit ? saved(hit, 'offline') : json({ error: 'You’re offline and this wasn’t saved on this device yet', code: 'offline' }, 503, { 'x-medint-offline': '1' });
  }
}
// NetHunt: reads are saved per question; changes go straight to the network (the page queues them when that fails)
async function nethunt(req) {
  const body = await req.clone().text(); let tool = ''; try { tool = JSON.parse(body).tool || ''; } catch (_e) { /* not JSON */ }
  if (NH_WRITE.test(tool)) return fetch(req);
  const key = `/__nethunt/${hash(body)}`; const c = await caches.open(API);
  try {
    const r = await fetch(req, { redirect: 'manual' });
    if (signedOut(r)) { tell({ type: 'medint-signin' }); const hit = await c.match(key); return hit ? saved(hit, 'signin') : json({ error: 'Sign in again to load this', code: 'signin' }, 401, { 'x-medint-signin': '1' }); }
    if (r.ok) c.put(key, r.clone()).then(() => trim(c)).catch(() => {});
    else if (r.status >= 500) { const hit = await c.match(key); if (hit) return saved(hit, 'busy'); } // NetHunt busy or slow: the last saved answer rather than nothing
    return r;
  } catch (_e) {
    const hit = await c.match(key); return hit ? saved(hit, 'offline') : json({ error: 'You’re offline and this wasn’t saved on this device yet', code: 'offline' }, 503, { 'x-medint-offline': '1' });
  }
}
