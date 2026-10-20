/* Country Market Dashboard — stand-alone runtime.
   Replaces the claude.ai dashboard host: loads saved data files, runs live NetHunt
   queries through /api/nethunt (the server keeps the NetHunt key), computes the
   page's calculations and keeps filters in this browser. */
(function () {
  'use strict';
  const API = '/api/nethunt';
  const LS = 'cmd:';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  let DEFS = {}; let DEFAULTS = {};
  const loaders = {}; const calcs = {}; const cbs = [];
  const cache = new Map();      // id -> {key, status, data, columns, meta, cut, message, v}
  let params = {};
  let ready = false; let fireQueued = false;
  let holidaysFile = null;

  async function api(tool, args) {
    let res;
    try { res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool, args }), credentials: 'same-origin' }); }
    catch (e) { const er = new Error('Could not reach the server'); er.code = 'server_unavailable'; er.retryable = true; throw er; }
    let body = null; try { body = await res.json(); } catch { /* not JSON */ }
    if (!res.ok) { const er = new Error((body && body.error) || `Server error ${res.status}`); er.code = (body && body.code) || (res.status === 403 ? 'not_in_manifest' : res.status === 401 ? 'needs_reauth' : 'server_unavailable'); throw er; }
    return body; // {content:[{type:'text', text}]}
  }

  // {{name}} as a whole string -> typed value; inside text -> plain text
  function fill(v) {
    if (typeof v === 'string') {
      const whole = v.match(/^\{\{(\w+)\}\}$/);
      if (whole) return params[whole[1]] ?? null;
      return v.replace(/\{\{(\w+)\}\}/g, (m, k) => (params[k] == null ? '' : String(params[k])));
    }
    if (Array.isArray(v)) return v.map(fill);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
    return v;
  }
  const names = (v, out = new Set()) => { if (typeof v === 'string') (v.match(/\{\{(\w+)\}\}/g) || []).forEach((m) => out.add(m.slice(2, -2))); else if (Array.isArray(v)) v.forEach((x) => names(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => names(x, out)); return out; };

  const asRows = (out) => {
    if (Array.isArray(out)) return { data: out, columns: out[0] ? Object.keys(out[0]) : [] };
    if (out && Array.isArray(out.rows)) return { data: out.rows, columns: out.columns || (out.rows[0] ? Object.keys(out.rows[0]) : []), cut: out.cut, meta: out.meta };
    if (out && out.data !== undefined) return { data: out.data, columns: out.columns || (Array.isArray(out.data) && out.data[0] ? Object.keys(out.data[0]) : []), cut: out.cut, meta: out.meta };
    return { data: out, columns: [] };
  };

  function schedule() { if (fireQueued) return; fireQueued = true; requestAnimationFrame(() => { fireQueued = false; fire(); }); }
  function fire() { if (!ready) return; for (const f of cbs) { try { f(); } catch (e) { console.error(e); } } }

  function loadFile(id, def) {
    const key = 'file';
    const c = cache.get(id);
    if (c && c.key === key) return c;
    const entry = { key, status: 'loading', data: [], columns: [], meta: [], v: (c ? c.v : 0) + 1 };
    cache.set(id, entry);
    fetch(`data/${id}.json`, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { const rows = Array.isArray(json) ? json : json.rows || json.data || json.results || json; Object.assign(entry, asRows(rows), { status: 'ok' }); })
      .catch((e) => Object.assign(entry, { status: 'error', message: `Couldn’t load ${def.title || id}: ${e.message}` }))
      .finally(() => { entry.v += 1; schedule(); });
    return entry;
  }

  function loadQuery(id, def) {
    const args = fill(def.source.args || {});
    const key = JSON.stringify(args);
    const c = cache.get(id);
    if (c && c.key === key) return c;
    const entry = { key, status: 'loading', data: c && c.status === 'ok' ? c.data : [], columns: [], meta: [], v: (c ? c.v : 0) + 1, refreshing: !!(c && c.status === 'ok') };
    if (entry.refreshing) entry.status = 'ok';
    cache.set(id, entry);
    const tool = def.source.tool;
    (async () => {
      try {
        let answer;
        if (tool === 'list_events' && /#holiday@group\.v\.calendar\.google\.com$/.test(String(args.calendarId || ''))) {
          // public holidays: from the saved file (all countries, 2026–2027); beyond that, live from Google's public feed via /api/holidays
          const from = String(args.startTime || '').slice(0, 10); const to = String(args.endTime || '').slice(0, 10);
          holidaysFile = holidaysFile || fetch('data/holidays_all.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
          const saved = await holidaysFile; const c = saved && saved.calendars && saved.calendars[args.calendarId];
          const covered = saved && to <= '2028-01-01';
          if (c && covered) {
            const events = c.events.filter((e) => (!from || e.date >= from) && (!to || e.date < to)).map((e) => ({ id: `${e.date}-${e.name}`, summary: e.name, description: e.public ? 'Public holiday' : 'Observance', start: { date: e.date }, eventType: 'DEFAULT' }));
            answer = { content: [{ type: 'text', text: JSON.stringify({ events }) }] };
          } else {
            const q = new URLSearchParams({ cal: args.calendarId, from, to });
            const r = await fetch(`/api/holidays?${q}`, { credentials: 'same-origin' });
            answer = await r.json(); if (!r.ok) throw new Error(answer.error || `Holidays: ${r.status}`);
          }
        } else if (tool === 'list_events') {
          const q = new URLSearchParams({ from: String(args.startTime || '').slice(0, 10), to: String(args.endTime || '').slice(0, 10) });
          const r = await fetch(`/api/calendar?${q}`, { credentials: 'same-origin' });
          answer = await r.json();
          if (!r.ok && answer.code === 'not_configured') answer = { events: [] }; // NetHunt-linked meetings still show
          else if (!r.ok) throw new Error(answer.error || `Calendar: ${r.status}`);
        } else answer = await api(tool, args);
        let out;
        if (loaders[id]) out = await loaders[id].fn({ answer, args, call: async (t, a) => api(t, a), read: {} });
        else { const t = (answer.content || []).map((p) => p.text || '').join(''); let j; try { j = JSON.parse(t); } catch { j = t; } out = j; }
        if (cache.get(id) !== entry) return; // superseded by a newer filter
        Object.assign(entry, asRows(out), { status: 'ok', refreshing: false, message: undefined });
      } catch (e) {
        if (cache.get(id) !== entry) return;
        Object.assign(entry, { status: 'error', refreshing: false, message: e.message || String(e) });
      } finally { entry.v += 1; schedule(); }
    })();
    return entry;
  }

  function computeCalc(id) {
    const def = calcs[id];
    const ins = def.inputs.map((i) => data(i));
    if (ins.some((x) => x.status === 'error')) return { status: 'error', data: [], message: 'An input didn’t load', columns: [], meta: [] };
    if (ins.some((x) => x.status !== 'ok')) return { status: 'loading', data: [], columns: [], meta: [] };
    const key = def.inputs.map((i) => { const c = cache.get(i); return c ? `${c.v}:${c.key}` : '?'; }).join('|');
    const c = cache.get(id);
    if (c && c.key === key) return c;
    let entry;
    try { const out = def.fn(...ins.map((x) => x.data)); entry = { key, status: 'ok', ...asRows(out), meta: [], v: (c ? c.v : 0) + 1 }; }
    catch (e) { console.error(`calc ${id}`, e); entry = { key, status: 'error', data: [], columns: [], meta: [], message: e.message, v: (c ? c.v : 0) + 1 }; }
    cache.set(id, entry);
    return entry;
  }

  function data(id) {
    let e;
    if (calcs[id]) e = computeCalc(id);
    else if (DEFS[id]) e = DEFS[id].source.kind === 'file' ? loadFile(id, DEFS[id]) : loadQuery(id, DEFS[id]);
    else e = { status: 'missing', data: [], columns: [], meta: [] };
    return { status: e.status, data: e.data, columns: e.columns || [], meta: e.meta || [], cut: e.cut, message: e.message, refreshing: !!e.refreshing, rows: e.data, value: e.data };
  }

  const clean = (p) => { const o = {}; for (const [k, v] of Object.entries(p || {})) { if (v === undefined) continue; if (v === null || ['string', 'number', 'boolean'].includes(typeof v) || (Array.isArray(v) && v.every((x) => x === null || ['string', 'number', 'boolean'].includes(typeof x)))) o[k] = v; } return o; };

  window.dash = {
    data,
    onData(fn) { cbs.push(fn); if (ready) { try { fn(); } catch (e) { console.error(e); } } },
    calc(id, def) { calcs[id] = def; },
    loader(id, def) { loaders[id] = def; },
    params: () => ({ ...params }),
    setParams(p) { const c = clean(p); for (const [k, v] of Object.entries(c)) { if (v === null) delete params[k]; else params[k] = v; } store.set('params', params); schedule(); },
    resetParams() { params = { ...DEFAULTS }; store.set('params', params); schedule(); },
    setLink(l) { if (typeof l === 'string') history.replaceState(history.state, '', '#' + l); },
    refresh(id) { cache.delete(id); schedule(); },
    refreshAll() { for (const [id, d] of Object.entries(DEFS)) if (d.source.kind === 'query') cache.delete(id); for (const id of Object.keys(calcs)) cache.delete(id); schedule(); },
    colors: ['#4C8DF6', '#E0703A', '#3FAE7A', '#D9A02B', '#D45C8C', '#8D74E8', '#4BB3C4', '#9AA0A6'],
  };

  // ---- the page's "claude" capabilities, served by this site ----
  const mcp = {
    async callTool(server, tool, input) { return api(tool, input || {}); },
  };
  const db = {
    doc(path) {
      return {
        async get() { const v = store.get('db:' + path, undefined); return { exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; },
        async set(d) { store.set('db:' + path, d); },
      };
    },
  };
  const user = { id: async () => 'this-browser', isOwner: () => true, canEdit: () => true };
  const downloads = {
    async save({ filename, data: body }) {
      const blob = body instanceof Blob ? body : new Blob([body], { type: /\.csv$/i.test(filename) ? 'text/csv' : 'application/octet-stream' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { outcome: 'saved' };
    },
  };
  window.claude = { use: async (name) => ({ mcp, db, user, downloads }[name] || null) };

  // ---- boot: definitions first, then the page's scripts ----
  let lastW = 0;
  window.addEventListener('resize', () => { const w = document.documentElement.clientWidth; if (w !== lastW) { lastW = w; schedule(); } });
  window.cmBoot = async function (scripts) {
    const [defs, defaults] = await Promise.all([fetch('datasets.json').then((r) => r.json()), fetch('params.json').then((r) => r.json()).catch(() => ({}))]);
    DEFS = defs; DEFAULTS = defaults;
    params = { ...defaults, ...store.get('params', {}) };
    for (const src of scripts) {
      await new Promise((resolve) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => { console.error('failed to load', src); resolve(); }; document.body.append(s); });
    }
    ready = true; fire();
    const btn = document.getElementById('cmd-refresh');
    if (btn) btn.addEventListener('click', () => window.dash.refreshAll());
  };
})();
