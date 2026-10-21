// Part 2 of the dashboard (scripts run in separate scopes here: shared names come through window.__cm)
const __cm = window.__cm;
const SEQ_ON = !1; // 🔁 follow-up sequences are switched off for now — Medint stays focused on sales work (set to !0 to bring them back)
let tripStops = [],
  tripView = null;
const STAGE_COL = ['#8a8a8a', '#9b9b9b', '#4C8DF6', '#3FB6C6', '#D9A02B', '#E0703A', '#3fae7a'];
function hav(t, e) {
  const n = Math.PI / 180,
    a = (e.lat - t.lat) * n,
    o = (e.lng - t.lng) * n,
    s = Math.sin(a / 2) ** 2 + Math.cos(t.lat * n) * Math.cos(e.lat * n) * Math.sin(o / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(s));
}
function hashJ(t) {
  let e = 0;
  for (const n of String(t)) e = (31 * e + n.charCodeAt(0)) | 0;
  return (e % 1e3) / 1e3 - 0.5;
}
const slotText = (t, e) =>
  t.toLocaleDateString(e ? 'es-ES' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) +
  (e ? ' a las ' : ' at ') +
  t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function drawTripMap(t) {
  const e = (function () {
      const t = dash.params().iso,
        e = __cm.rowsOf('map_points'),
        n = new Map(e.filter((t) => 'company' === t.kind).map((t) => [t.id, t])),
        a = new Map(__cm.rowsOf('companies').map((t) => [t.id, t.country])),
        o = __cm.oursKey(),
        s = __cm.OURS[o].all ? 'all' : o,
        r = new Set(__cm.rowsOf('meetings').map((t) => t.company_id)),
        i = new Map(__cm.rowsOf('maps_places').map((t) => [t.id, t])),
        c = [];
      for (const d of __cm.rowsOf('partners')) {
        const l = n.get(d.id);
        let p,
          u,
          m = !0;
        if (l) ((p = l.lat), (u = l.lng));
        else {
          const n = (__cm.countryOfIso(__cm.isoOfCountry(a.get(d.id) || '') || t) || {}).country || '',
            o =
              e.find(
                (t) =>
                  'city' === t.kind &&
                  t.country === n &&
                  __cm.norm(t.city) ===
                    __cm.norm(
                      String(d.city || '')
                        .split(',')[0]
                        .trim(),
                    ),
              ) || e.find((t) => 'city' === t.kind && t.country === n && !t.city);
          if (!o) continue;
          ((m = !1), (p = o.lat + 0.03 * hashJ(d.id)), (u = o.lng + 0.03 * hashJ(`${d.id}x`)));
        }
        c.push({
          id: d.id,
          name: d.company,
          lat: p,
          lng: u,
          precise: m,
          stage: d[`stage_${s}`] || 0,
          status: d[`status_${o}`] || d.status_all || '',
          score: d[`score_${o}`] || 0,
          city: String(d.city || '')
            .split(',')[0]
            .trim(),
          meeting: r.has(d.id),
          days: d.days_since_contact,
          place: i.get(d.id),
        });
      }
      return c;
    })(),
    n = dash.params().pcity || '',
    a = dash.params().iso,
    o = __cm.multiIsos(),
    s = o ? dash.params().glabel || `${o.length} countries` : (__cm.countryOfIso(a) || {}).country || 'this country',
    r = n ? e.filter((t) => __cm.norm(t.city) === __cm.norm(n)) : e;
  if ('ok' !== dash.data('map_points').status || 'ok' !== dash.data('partners').status)
    return void t.append(__cm.el('div', 'hint', 'Loading map…'));
  if (!e.length) return void t.append(__cm.el('div', 'hint', `No mapped companies in ${s} yet.`));
  const c = __cm.el('div', 'cm-trip'),
    d = __cm.el('div', 'cm-chips');
  d.style.margin = '8px 6px';
  const p = d3
    .rollups(
      e.filter((t) => t.city),
      (t) => [
        t.length,
        d3.greatest(
          d3.rollups(
            t,
            (t) => t.length,
            (t) => t.city,
          ),
          (t) => t[1],
        )[0],
      ],
      (t) => __cm.norm(t.city),
    )
    .map(([, [t, e]]) => [e, t])
    .sort((t, e) => e[1] - t[1])
    .slice(0, 12);
  (d.append(
    ...__cm.chipRow([['', `All ${s}`], ...p.map(([t, e]) => [t, `${t} · ${e}`])], n, (t) => {
      ((tripView = null), dash.setParams({ pcity: t || null }));
    }),
  ),
    c.append(d));
  {
    const bb = __cm.el('div', 'cm-basebar'),
      cur = __cm.cmBaseGet();
    if (cur) {
      bb.append(__cm.el('span', 'cm-baselbl', `🏨 ${cur.label || 'Base'}`));
      const mv = __cm.el('button', 'cm-chip', __cm.cmBaseMode ? 'Click the map…' : 'Move');
      ((mv.type = 'button'),
        mv.addEventListener('click', () => {
          ((__cm.cmBaseMode = !__cm.cmBaseMode), __cm.sheetDraw());
        }));
      const cl = __cm.el('button', 'cm-chip', 'Clear');
      ((cl.type = 'button'), cl.addEventListener('click', () => __cm.cmBaseSet(null)), bb.append(mv, cl));
    } else {
      bb.append(
        __cm.el(
          'span',
          'hint',
          __cm.cmBaseMode ? 'Click the map where you are staying' : 'Set where you are staying and the day is planned around it',
        ),
      );
      const st = __cm.el('button', 'cm-chip', __cm.cmBaseMode ? 'Cancel' : '📍 Set base');
      ((st.type = 'button'),
        st.addEventListener('click', () => {
          ((__cm.cmBaseMode = !__cm.cmBaseMode), __cm.sheetDraw());
        }),
        bb.append(st));
    }
    const ip = __cm.el('input', 'cm-baseinp');
    ((ip.type = 'text'),
      (ip.placeholder = 'or paste a Google Maps link / -0.18, -78.47'),
      ip.addEventListener('change', () => {
        const p = __cm.cmBaseParse(ip.value);
        p
          ? ((__cm.cmBaseMode = !1), __cm.cmBaseSet({ ...p, label: dash.params().pcity || 'Base' }))
          : __cm.say('Couldn\u2019t read that \u2014 paste a Google Maps link or \u201clat, lng\u201d', !0);
      }),
      bb.append(ip),
      c.append(bb));
  }
  const bp = __cm.cmBaseGet();
  const u = Math.min(820, (window.innerWidth || 800) - 60),
    m = Math.round(0.62 * u),
    h = d3
      .create('svg')
      .attr('viewBox', `0 0 ${u} ${m}`)
      .attr('class', 'cm-tripsvg')
      .attr('role', 'img')
      .attr('aria-label', `Map of companies in ${n || s}`),
    uid = 'mg' + Math.random().toString(36).slice(2, 8),
    defs = h.append('defs'),
    sg = defs.append('linearGradient').attr('id', `${uid}-sea`).attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
  (sg.append('stop').attr('offset', '0%').attr('class', 'sea0'), sg.append('stop').attr('offset', '100%').attr('class', 'sea1'));
  h.append('rect')
    .attr('class', 'sea')
    .attr('width', u)
    .attr('height', m)
    .attr('fill', n ? 'var(--color-panel)' : `url(#${uid}-sea)`);
  const g = (function ([[t, e], [n, a]], o) {
      const s = Math.PI / 180,
        r = (t) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, t)) * s) / 2)),
        i = o.map((t) => t[0] * s),
        c = o.map((t) => r(t[1]));
      let l = Math.min(...i),
        d = Math.max(...i),
        p = Math.min(...c),
        u = Math.max(...c);
      const m = 0.004;
      (d - l < m && ((l -= m), (d += m)), u - p < m && ((p -= m), (u += m)));
      const h = Math.min((n - t) / (d - l), (a - e) / (u - p)),
        g = t + (n - t - h * (d - l)) / 2,
        f = e + (a - e - h * (u - p)) / 2,
        y = ([t, e]) => [g + (t * s - l) * h, f + (u - r(e)) * h];
      return ((y.invert = ([t, e]) => [((t - g) / h + l) / s, (2 * Math.atan(Math.exp(u - (e - f) / h)) - Math.PI / 2) / s]), y);
    })(
      [
        [34, 30],
        [u - 34, m - 38],
      ],
      (r.length ? r : e).map((t) => [t.lng, t.lat]).concat(bp ? [[bp.lng, bp.lat]] : []),
    ),
    cityMode = !!n,
    y = h.append('g'),
    b = __cm.rowsOf('map_outlines'),
    v = new Set(o || [a]),
    w = new Set([...v].map((t) => (__cm.countryOfIso(t) || {}).country)),
    dOf = (t) =>
      ((t) =>
        (function (t, e) {
          const n = (t) =>
            t
              .map((t, n) => {
                const [a, o] = e(t);
                return `${n ? 'L' : 'M'}${a.toFixed(2)},${o.toFixed(2)}`;
              })
              .join('') + 'Z';
          return t
            ? 'Polygon' === t.type
              ? t.coordinates.map(n).join('')
              : 'MultiPolygon' === t.type
                ? t.coordinates.map((t) => t.map(n).join('')).join('')
                : ''
            : '';
        })(t, g))(JSON.parse(t.geometry));
  if (!cityMode) {
    const [gw, gn] = g.invert([0, 0]),
      [ge2, gs] = g.invert([u, m]),
      sp = ge2 - gw > 40 ? 10 : ge2 - gw > 16 ? 5 : ge2 - gw > 6 ? 2 : 1,
      gg = y.append('g').attr('class', 'gr');
    for (let x = Math.ceil(gw / sp) * sp; x <= ge2; x += sp) {
      const p1 = g([x, gn]),
        p2 = g([x, gs]);
      gg.append('line').attr('x1', p1[0]).attr('y1', p1[1]).attr('x2', p2[0]).attr('y2', p2[1]);
    }
    for (let q = Math.ceil(gs / sp) * sp; q <= gn; q += sp) {
      const p1 = g([gw, q]),
        p2 = g([ge2, q]);
      gg.append('line').attr('x1', p1[0]).attr('y1', p1[1]).attr('x2', p2[0]).attr('y2', p2[1]);
    }
  }
  cityMode ||
    y
      .append('g')
      .attr('class', 'land')
      .selectAll('path')
      .data(b)
      .join('path')
      .attr('d', dOf)
      .attr('class', (t) => 'ol' + (v.has(t.iso) ? ' here' : ''));
  cityMode ||
    y
      .append('g')
      .attr('class', 'edge')
      .selectAll('path')
      .data(b.filter((t) => v.has(t.iso)))
      .join('path')
      .attr('d', dOf);
  const _ = cityMode ? [] : __cm.rowsOf('map_points').filter((t) => 'city' === t.kind && w.has(t.country) && (t.city || o)),
    cg = y.append('g').attr('class', 'cities');
  cg.selectAll('circle')
    .data(_)
    .join('circle')
    .attr('class', 'cd')
    .attr('cx', (t) => g([t.lng, t.lat])[0])
    .attr('cy', (t) => g([t.lng, t.lat])[1])
    .attr('r', 2);
  cg.selectAll('text')
    .data(_)
    .join('text')
    .attr('class', 'cl')
    .attr('x', (t) => g([t.lng, t.lat])[0])
    .attr('y', (t) => g([t.lng, t.lat])[1] - 7)
    .text((t) => t.city || { Chile: 'Santiago', Ecuador: 'Quito', Peru: 'Lima', Guatemala: 'Guatemala City' }[t.country] || '');
  if (cityMode) {
    const ctr =
      bp ||
      (() => {
        const cc = __cm.rowsOf('map_points').find((t) => 'city' === t.kind && __cm.norm(t.city || '') === __cm.norm(n));
        if (cc) return cc;
        if (!r.length) return null;
        return { lat: d3.mean(r, (t) => t.lat), lng: d3.mean(r, (t) => t.lng) };
      })();
    if (ctr) {
      const cxy = g([ctr.lng, ctr.lat]),
        kmPx = (k2) => {
          const p2 = g([ctr.lng + k2 / (111.32 * Math.cos((ctr.lat * Math.PI) / 180)), ctr.lat]);
          return Math.abs(p2[0] - cxy[0]);
        },
        far = Math.max(
          ...[
            [0, 0],
            [u, 0],
            [0, m],
            [u, m],
          ].map((p) => {
            const q = g.invert(p);
            return hav(ctr, { lat: q[1], lng: q[0] });
          }),
        ),
        steps = [0.5, 1, 2, 3, 5, 10, 15, 25, 50, 100].filter((k2) => kmPx(k2) > 26 && k2 <= 1.02 * far).slice(0, 5),
        rr = y.append('g').attr('class', 'rings');
      steps.forEach((k2) => {
        const px = kmPx(k2);
        (rr.append('circle').attr('cx', cxy[0]).attr('cy', cxy[1]).attr('r', px),
          rr
            .append('text')
            .attr('class', 'rk')
            .attr('x', cxy[0])
            .attr('y', cxy[1] - px - 4)
            .text(__cm.cmKm(k2)));
      });
      if (steps.length) {
        const px = kmPx(steps[steps.length - 1]);
        [
          [0, -1, 'N'],
          [1, 0, 'E'],
          [0, 1, 'S'],
          [-1, 0, 'W'],
        ].forEach(([dx, dy, lb]) => {
          (rr
            .append('line')
            .attr('x1', cxy[0])
            .attr('y1', cxy[1])
            .attr('x2', cxy[0] + dx * px)
            .attr('y2', cxy[1] + dy * px)
            .attr('class', 'rx'),
            rr
              .append('text')
              .attr('class', 'rc')
              .attr('x', cxy[0] + 1.06 * dx * px)
              .attr('y', cxy[1] + 1.06 * dy * px + 3.5)
              .text(lb));
        });
      }
    }
  }
  {
    const na = h
      .append('g')
      .attr('class', 'northa')
      .attr('transform', `translate(${u - 30},${38})`);
    (na.append('path').attr('d', 'M0,-13 L5.5,7 L0,2.5 L-5.5,7 Z'), na.append('text').attr('y', -16).text('N'));
  }
  const rg = y.append('g').attr('class', 'route');
  {
    const seq = (bp ? [bp] : []).concat(tripStops).concat(bp && tripStops.length ? [bp] : []);
    if (seq.length > 1) {
      const pp = seq.map((t) => g([t.lng, t.lat])),
        dd = 'M' + pp.map((t) => `${t[0].toFixed(2)},${t[1].toFixed(2)}`).join('L');
      (rg.append('path').attr('class', 'rh').attr('d', dd), rg.append('path').attr('class', 'rl').attr('d', dd));
    }
  }
  const $ = new Map(tripStops.map((t, e) => [t.id, e + 1])),
    rOf = (t) => 3 + Math.min(t.score, 100) / 26,
    k = y
      .append('g')
      .attr('class', 'pts')
      .selectAll('g')
      .data(e.slice().sort((t, e) => t.score - e.score))
      .join('g')
      .attr('class', 'pt')
      .attr('transform', (t) => `translate(${g([t.lng, t.lat])})`)
      .style('cursor', 'pointer');
  k.filter((t) => t.meeting)
    .append('circle')
    .attr('class', 'mt')
    .attr('r', (t) => rOf(t) + 3.5)
    .attr('fill', 'none');
  k.append('circle')
    .attr('class', 'hit')
    .attr('r', (t) => rOf(t) + 6)
    .attr('fill', 'transparent');
  k.append('circle')
    .attr('class', (t) => 'dot' + (t.precise ? '' : ' approx') + ($.has(t.id) ? ' sel' : ''))
    .attr('r', (t) => (t.precise ? rOf(t) : 0.62 * rOf(t)))
    .attr('fill', (t) => (t.precise ? STAGE_COL[t.stage] : 'none'))
    .attr('stroke', (t) => STAGE_COL[t.stage]);
  k.filter((t) => $.has(t.id))
    .append('text')
    .attr('class', 'no')
    .attr('dy', '0.35em')
    .text((t) => $.get(t.id));
  k.on('click', (ev, e) => {
    if (__cm.cmBaseMode) return;
    (clearTimeout(__cm.cmDotT),
      (__cm.cmDotT = setTimeout(() => {
        const n = tripStops.findIndex((t) => t.id === e.id);
        (n >= 0 ? tripStops.splice(n, 1) : tripStops.push(e), __cm.sheetDraw());
      }, 250)));
  });
  k.on('dblclick', (ev, e) => {
    (ev.stopPropagation(), ev.preventDefault(), clearTimeout(__cm.cmDotT), __cm.cmOpenUrl(__cm.cmMapsUrl(e)));
  });
  if (n) {
    const lg2 = y.append('g').attr('class', 'plabels'),
      put = [],
      hit = (b2) => put.some((q2) => !(b2.x + b2.w < q2.x || q2.x + q2.w < b2.x || b2.y + b2.h < q2.y || q2.y + q2.h < b2.y));
    r.slice()
      .sort((t, e) => e.score - t.score)
      .forEach((t2) => {
        if (put.length >= 12) return;
        const p = g([t2.lng, t2.lat]),
          tx = __cm.clip(t2.name, 22),
          wd = 5.55 * tx.length + 10;
        let x = p[0] + 10,
          an = 'start';
        x + wd > u - 10 && ((x = p[0] - 10), (an = 'end'));
        const b2 = { x: 'start' === an ? x : x - wd, y: p[1] - 6, w: wd, h: 13 };
        if (b2.x < 4 || b2.y < 4 || b2.y + b2.h > m - 4 || hit(b2)) return;
        (put.push(b2),
          lg2
            .append('text')
            .attr('class', 'pl')
            .attr('x', x)
            .attr('y', p[1] + 3.5)
            .attr('text-anchor', an)
            .text(tx));
      });
  }
  if (bp) {
    const bg2 = y
      .append('g')
      .attr('class', 'basept')
      .attr('transform', `translate(${g([bp.lng, bp.lat])})`);
    (bg2.append('circle').attr('class', 'bh').attr('r', 10),
      bg2.append('circle').attr('class', 'bc').attr('r', 3.6),
      bg2
        .append('text')
        .attr('class', 'bl')
        .attr('y', -14)
        .text(bp.label || 'Base'));
  }
  h.style('cursor', __cm.cmBaseMode ? 'crosshair' : null).on('click', function (ev) {
    if (!__cm.cmBaseMode) return;
    ev.stopPropagation();
    const pt = d3.pointer(ev, y.node()),
      ll = g.invert(pt);
    ((__cm.cmBaseMode = !1),
      __cm.cmBaseSet({ lat: ll[1], lng: ll[0], label: dash.params().pcity || (__cm.countryOfIso(dash.params().iso) || {}).country || 'Base' }));
  });
  const A = __cm.el('div', 'cm-tripmap');
  A.append(h.node());
  const tip = __cm.el('div', 'cm-maptip');
  ((tip.hidden = !0), A.append(tip));
  k.on('mouseenter', function () {
    d3.select(this).raise().classed('on', !0);
  })
    .on('mouseleave', function () {
      (d3.select(this).classed('on', !1), (tip.hidden = !0));
    })
    .on('mousemove', (ev, dd) => {
      tip.replaceChildren();
      const hd = __cm.el('div', 'tt', dd.name);
      tip.append(hd);
      const sub = [dd.city, dd.status || __cm.STAGE[dd.stage]].filter(Boolean).join(' · ');
      sub && tip.append(__cm.el('div', 'ts', sub));
      const bits = [`score ${dd.score}`];
      (null != dd.days && bits.push(`last contact ${dd.days}d ago`),
        dd.place && dd.place.rating && bits.push(`★ ${dd.place.rating} (${dd.place.reviews || 0})`),
        tip.append(__cm.el('div', 'tm', bits.join(' · '))));
      const fl = [
        dd.meeting ? '📅 meeting booked' : '',
        dd.precise ? '' : '≈ city only',
        $.has(dd.id) ? `stop ${$.get(dd.id)} — click to remove` : 'click to add as a stop',
        dd.place && dd.place.url ? 'double-click → its Google Maps page' : 'double-click → Google Maps',
      ].filter(Boolean);
      fl.length && tip.append(__cm.el('div', 'tf', fl.join(' · ')));
      tip.hidden = !1;
      const bx = A.getBoundingClientRect(),
        tw = tip.offsetWidth || 170,
        th = tip.offsetHeight || 48;
      let lx = ev.clientX - bx.left + 12,
        ly = ev.clientY - bx.top + 12;
      (lx + tw > bx.width - 6 && (lx = ev.clientX - bx.left - tw - 12),
        ly + th > bx.height - 6 && (ly = ev.clientY - bx.top - th - 12),
        (tip.style.left = Math.max(6, lx) + 'px'),
        (tip.style.top = Math.max(6, ly) + 'px'));
    });
  const [x, E] = g.invert([34, m - 22]),
    [S] = g.invert([144, m - 22]),
    L = hav({ lat: E, lng: x }, { lat: E, lng: S }),
    sb = h.append('g').attr('class', 'sbg');
  (sb
    .append('rect')
    .attr('x', 26)
    .attr('y', m - 34)
    .attr('width', 126)
    .attr('height', 24)
    .attr('rx', 5)
    .attr('class', 'sbbg'),
    sb
      .append('line')
      .attr('x1', 34)
      .attr('x2', 144)
      .attr('y1', m - 16)
      .attr('y2', m - 16)
      .attr('class', 'sb'),
    sb
      .append('line')
      .attr('x1', 34)
      .attr('x2', 34)
      .attr('y1', m - 19)
      .attr('y2', m - 13)
      .attr('class', 'sb'),
    sb
      .append('line')
      .attr('x1', 144)
      .attr('x2', 144)
      .attr('y1', m - 19)
      .attr('y2', m - 13)
      .attr('class', 'sb'));
  const sbt = sb
      .append('text')
      .attr('x', 34)
      .attr('y', m - 22)
      .attr('class', 'sbt'),
    sbkm = (t) => (t < 1 ? `${Math.round(1e3 * t)} m` : t < 10 ? `${t.toFixed(1)} km` : `${Math.round(t)} km`);
  sbt.text(sbkm(L));
  const C = d3
    .zoom()
    .scaleExtent([1, 40])
    .on('zoom', (t) => {
      ((tripView = t.transform),
        y.attr('transform', t.transform),
        y.selectAll('.pt').attr('transform', (e) => `translate(${g([e.lng, e.lat])}) scale(${1 / t.transform.k})`),
        y
          .selectAll('text.cl, text.pl, text.bl, text.rk, text.rc')
          .style('font-size', 11 / t.transform.k + 'px')
          .style('stroke-width', 3.2 / t.transform.k + 'px'),
        (() => {
          const b2 = __cm.cmBaseGet();
          b2 && y.selectAll('.basept').attr('transform', () => `translate(${g([b2.lng, b2.lat])}) scale(${1 / t.transform.k})`);
        })(),
        y.selectAll('circle.cd').attr('r', 2 / t.transform.k),
        sbt.text(sbkm(L / t.transform.k)));
    });
  (h.call(C), tripView && h.call(C.transform, tripView));
  const zc = __cm.el('div', 'cm-mapzoom');
  ([
    ['＋', 'Zoom in', () => h.transition().duration(220).call(C.scaleBy, 1.7)],
    [
      '－',
      'Zoom out',
      () =>
        h
          .transition()
          .duration(220)
          .call(C.scaleBy, 1 / 1.7),
    ],
    [
      '⟲',
      'Reset view',
      () => {
        ((tripView = null), h.transition().duration(260).call(C.transform, d3.zoomIdentity));
      },
    ],
  ].forEach(([lb, ti, fnc]) => {
    const bt = __cm.el('button', 'cm-mz', lb);
    ((bt.type = 'button'), (bt.title = ti), bt.setAttribute('aria-label', ti), bt.addEventListener('click', fnc), zc.append(bt));
  }),
    A.append(zc));
  c.append(A);
  const N = __cm.el('div', 'cm-triplg');
  {
    const r1 = __cm.el('div', 'lgr');
    ([
      [2, 'contacted'],
      [3, 'engaged'],
      [4, 'interested'],
      [5, 'negotiating'],
      [1, 'lead / none'],
    ].forEach(([t, e]) => {
      const n = __cm.el('span'),
        a = __cm.el('i');
      ((a.style.background = STAGE_COL[t]), n.append(a, e), r1.append(n));
    }),
      N.append(r1));
    const r2 = __cm.el('div', 'lgr mut');
    ([
      ['dot', 'filled = exact location'],
      ['ring', 'hollow = city only'],
      ['meet', 'dashed ring = meeting booked'],
      ['size', 'larger = higher score'],
    ].forEach(([cls, lab]) => {
      const n = __cm.el('span'),
        a = __cm.el('i', 'lg-' + cls);
      (n.append(a, lab), r2.append(n));
    }),
      r2.append(
        __cm.el('span', null, 'click a company to add it as a stop · double-click to open it in Google Maps · scroll or use + / − to zoom'),
      ),
      N.append(r2));
  }
  c.append(N);
  const M = __cm.el('div', 'cm-route'),
    T = __cm.el('div', 'cm-chips'),
    D = (t) => {
      (t.forEach((t) => {
        tripStops.some((e) => e.id === t.id) || tripStops.push(t);
      }),
        __cm.sheetDraw());
    },
    I = __cm.el('button', 'cm-chip', '＋ Meetings' + (n ? ` in ${n}` : ''));
  ((I.type = 'button'), I.addEventListener('click', () => D(r.filter((t) => t.meeting))));
  const P = __cm.el('button', 'cm-chip', '＋ Top 8 by score');
  ((P.type = 'button'),
    P.addEventListener('click', () =>
      D(
        r
          .filter((t) => t.precise)
          .sort((t, e) => e.score - t.score)
          .slice(0, 8),
      ),
    ));
  const B = __cm.el('button', 'cm-chip', 'Best order');
  ((B.type = 'button'),
    (B.disabled = tripStops.length < 3),
    (B.title = 'Shortest hop-by-hop order, starting from your first stop'),
    B.addEventListener('click', () => {
      ((tripStops = __cm.cmOrder(tripStops, bp)), __cm.sheetDraw());
    }));
  const O = __cm.el('button', 'cm-chip', 'Clear');
  if (
    ((O.type = 'button'),
    (O.disabled = !tripStops.length),
    O.addEventListener('click', () => {
      ((tripStops = []), __cm.sheetDraw());
    }),
    T.append(I, P, B, O),
    n)
  ) {
    const t = __cm.el('button', 'cm-chip', `📨 Invite all in ${n} (${r.length})`);
    ((t.type = 'button'),
      (t.title = 'One personal WhatsApp per company with your free time slots'),
      t.addEventListener('click', () =>
        (function (t, e, n) {
          const a = __cm.countryOfIso(dash.params().iso) || {},
            o = /spanish/i.test(a.languages || ''),
            s = new Set();
          let r = null;
          __cm.openSheet(
            t,
            `Invite companies in ${n}`,
            (t) => {
              const a = (function (t = 2, e = null) {
                const n = __cm.rowsOf('calendar_events')
                    .filter((t) => !t.all_day && t.start)
                    .map((t) => new Date(t.start).getTime()),
                  a = [],
                  o = e ? new Date(`${e}T00:00:00`) : new Date(),
                  s = e ? 0 : 1;
                for (let e = s; e <= s + 6 && a.length < t; e += 1) {
                  const t = new Date(o.getFullYear(), o.getMonth(), o.getDate() + e);
                  if (0 !== t.getDay() && 6 !== t.getDay())
                    for (const [e, o] of [
                      [10, 0],
                      [12, 0],
                      [15, 30],
                    ]) {
                      const s = new Date(t.getFullYear(), t.getMonth(), t.getDate(), e, o).getTime();
                      if (!n.some((t) => Math.abs(t - s) < 54e5)) {
                        a.push(new Date(s));
                        break;
                      }
                    }
                }
                return a;
              })(2, r);
              {
                const e = __cm.el('div', 'cm-mic');
                e.append(__cm.el('span', 'hint', `I’ll be in ${n} from`));
                const a = __cm.el('input');
                ((a.type = 'date'),
                  (a.className = 'cm-date'),
                  (a.value = r || ''),
                  a.addEventListener('change', () => {
                    ((r = a.value || null), __cm.sheetDraw());
                  }),
                  e.append(a),
                  t.append(e));
              }
              const c = __cm.oursKey(),
                d = __cm.OURS[c].all ? 'next' : c;
              (__cm.LINES[d],
                t.append(
                  __cm.el(
                    'div',
                    'hint',
                    `One personal WhatsApp per company, proposing your free slots (${a.map((t) => slotText(t, !1)).join(' or ')} — checked against your calendar). Tap each to open WhatsApp; it’s logged in NetHunt when you tap.`,
                  ),
                ));
              const p = new Map(__cm.rowsOf('companies').map((t) => [t.id, t]));
              e.forEach((e) => {
                const r = p.get(e.id) || {},
                  c = __cm.splitBar(r.phones).find(__cm.waOk),
                  l = __cm.el('div', 'cm-trow'),
                  d = __cm.el('button', 'cm-pi');
                if (
                  ((d.type = 'button'),
                  (d.dataset.openCompany = e.id),
                  d.append(
                    __cm.el('span', null, s.has(e.id) ? '✅' : '🏢'),
                    __cm.el('span', 't', e.name),
                    __cm.el('span', 's', c ? `${c} · ${e.status || __cm.STAGE[e.stage]}` : 'no WhatsApp number (needs +country code)'),
                  ),
                  l.append(d),
                  c && a.length)
                ) {
                  const t = String(e.name)
                      .replace(/\s+(S\.?A\.?S?|LTDA|SAC|SPA|S\.?R\.?L\.?|LIMITADA|CIA|LTD|INC|S A|S A C)\.?$/i, '')
                      .trim(),
                    r = o
                      ? `Hola, soy Kavi Kaplan, fabricante de implantes ortopédicos de Turquía (${__cm.LINES.dunitech[0]}: clavos intramedulares; ${__cm.LINES.next[0]}: prótesis de hombro). Estaré en ${n} y me gustaría visitar ${t} brevemente. ¿Les vendría bien el ${slotText(a[0], !0)}${a[1] ? ` o el ${slotText(a[1], !0)}` : ''}? ¡Gracias!`
                      : `Hello, this is Kavi Kaplan, manufacturer of orthopaedic implants from Türkiye (${__cm.LINES.dunitech[0]} IM nails, ${__cm.LINES.next[0]} shoulder prostheses). I will be in ${n} and would like to visit ${t} briefly. Would ${slotText(a[0], !1)}${a[1] ? ` or ${slotText(a[1], !1)}` : ''} suit you? Thank you!`,
                    d = __cm.el('a', 'cm-btn', s.has(e.id) ? 'Sent ✓' : 'WhatsApp');
                  ((d.href = `${__cm.waHref(c)}?text=${encodeURIComponent(r)}`),
                    (d.target = '_blank'),
                    (d.rel = 'noopener noreferrer'),
                    (d.style.textDecoration = 'none'),
                    d.addEventListener('click', () => {
                      s.has(e.id) ||
                        (s.add(e.id),
                        (d.textContent = 'Sent ✓'),
                        __cm.nhCall('create_record_comment', {
                          folderId: __cm.NH_FOLDER,
                          recordId: e.id,
                          text: `WhatsApp visit invite sent from the dashboard (${new Date().toLocaleDateString('en-GB')}) to ${c}, proposing ${a.map((t) => slotText(t, !1)).join(' or ')} in ${n}.`,
                        }).catch(() => {}));
                    }),
                    l.append(d));
                }
                t.append(l);
              });
            },
            { wide: !0 },
          );
        })(
          t,
          r.slice().sort((t, e) => e.score - t.score),
          n,
        ),
      ),
      T.append(t));
  }
  if (bp) {
    const near = r
      .filter((t) => !tripStops.some((z) => z.id === t.id))
      .map((t) => Object.assign({}, t, { km: hav(bp, t) }))
      .sort((x, y2) => x.km - y2.km)
      .slice(0, 8);
    if (near.length) {
      M.append(__cm.el('div', 'cm-sendgrp', `Nearest to ${__cm.cmBaseGet().label || 'your base'}`));
      near.forEach((t) => {
        const row = __cm.el('div', 'cm-trow'),
          bt = __cm.el('button', 'cm-pi');
        ((bt.type = 'button'),
          bt.append(
            __cm.el('span', null, t.km < 1.5 ? '🚶' : '🚗'),
            __cm.el('span', 't', t.name),
            __cm.el('span', 's', `${__cm.cmKm(t.km)} · ${t.status || __cm.STAGE[t.stage]}${t.precise ? '' : ' · ≈ city only'}`),
          ),
          bt.addEventListener('click', () => {
            (tripStops.push(t), __cm.sheetDraw());
          }),
          row.append(bt),
          M.append(row));
      });
    }
  }
  if ((M.append(T), tripStops.length)) {
    let t = bp ? hav(bp, tripStops[0]) : 0;
    tripStops.forEach((e, n) => {
      const a = n ? hav(tripStops[n - 1], e) : bp ? hav(bp, e) : 0;
      n && (t += a);
      const o = __cm.el('div', 'cm-trow'),
        s = __cm.el('button', 'cm-pi');
      ((s.type = 'button'),
        (s.dataset.openCompany = e.id),
        s.append(
          __cm.el('span', null, `${n + 1}`),
          __cm.el('span', 't', e.name),
          __cm.el(
            'span',
            's',
            `${n ? `${a < 10 ? a.toFixed(1) : Math.round(a)} km · ` : ''}${e.status || __cm.STAGE[e.stage]}${e.meeting ? ' · 📅' : ''}${e.precise ? '' : ' · ≈ city only'}`,
          ),
        ));
      const r = __cm.el('button', 'cm-mini', '↑');
      ((r.type = 'button'),
        (r.title = 'Move up'),
        (r.disabled = !n),
        r.addEventListener('click', () => {
          (([tripStops[n - 1], tripStops[n]] = [tripStops[n], tripStops[n - 1]]), __cm.sheetDraw());
        }));
      const c = __cm.el('button', 'cm-mini', '✕');
      ((c.type = 'button'),
        (c.title = 'Remove'),
        c.addEventListener('click', () => {
          (tripStops.splice(n, 1), __cm.sheetDraw());
        }),
        o.append(s, r, c),
        M.append(o));
    });
    const e = __cm.el('div', 'cm-chips');
    if (
      ((e.style.marginTop = '8px'),
      e.append(
        __cm.el(
          'span',
          'cm-prog',
          `${tripStops.length} stops · ${bp ? `${__cm.cmKm(1.3 * (t + hav(tripStops[tripStops.length - 1], bp)))} round trip from ${__cm.cmBaseGet().label || 'base'} · ~${Math.round((60 * 1.3 * (t + hav(tripStops[tripStops.length - 1], bp))) / 26)} min driving` : `about ${Math.round(1.3 * t)} km by road (straight-line × 1.3)`}`,
        ),
      ),
      tripStops.length >= 2)
    ) {
      const t = tripStops.length > 11,
        n = __cm.el('a', 'cm-btn', t ? 'Open first 11 stops in Google Maps ↗' : 'Open route in Google Maps ↗');
      ((n.href = (function (t) {
        const e = (t) => `${t.lat},${t.lng}`,
          n = (t) => (t.place && t.place.url.split('place_id:')[1]) || '',
          a = t[0],
          o = t[t.length - 1],
          s = t.slice(1, -1),
          r = new URLSearchParams({ api: '1', origin: e(a), destination: e(o), travelmode: 'driving' });
        return (
          n(a) && r.set('origin_place_id', n(a)),
          n(o) && r.set('destination_place_id', n(o)),
          s.length && (r.set('waypoints', s.map(e).join('|')), s.every(n) && r.set('waypoint_place_ids', s.map(n).join('|'))),
          `https://www.google.com/maps/dir/?${r}`
        );
      })((bp ? [Object.assign({}, bp)] : []).concat(tripStops).slice(0, 11))),
        (n.target = '_blank'),
        (n.rel = 'noopener noreferrer'),
        (n.style.textDecoration = 'none'),
        e.append(n),
        t && e.append(__cm.el('span', 'cm-prog', 'Google Maps takes up to 11 stops per route.')));
    }
    M.append(e);
  } else
    M.append(__cm.el('div', 'hint', 'Click companies on the map to add stops, or use the buttons above. Then open the route in Google Maps.'));
  (c.append(M), t.append(c));
}


// ---------- ⚡ Power hour: one company at a time, in the order that wins most deals ----------
// scope: a country or region page → its companies; anywhere else → all countries
// Power hour order — the most valuable call first:
// 0 they wrote (waiting for our reply) · 1 meeting today/tomorrow (confirm, prepare) · 2 follow-up due (most overdue first)
// 3 interested / negotiating but quiet 14+ days · 4 engaged / replied but quiet 21+ days · 5 best new leads never really contacted (score 40+)
// 6 keep warm (good score, no contact 30+ days). Inside each group: open for calls right now first, then the best-partner score.
// Left out: not ortho, already partners, not interested / lost, and anyone we contacted in the last 2 days (unless they wrote or a follow-up is due).
const PH_TARGET = 25; // one session ≈ an hour at 2–3 minutes per company
const PH_POOL = 200; // the full ordered list; sessions take 25 at a time
const PH_WHY = ['They wrote — reply', 'Meeting soon — confirm & prepare', 'Follow-up due', 'Interested, gone quiet — call now', 'Engaged, gone quiet', 'Best new lead', 'Keep warm', 'This company', 'Contacted recently — keep going', 'Manufacturing branch — last', 'Unprocessed — last'];
const phWorked = new Set(); // companies done or skipped in this session: the next Power hour continues after them
// meetings as Google Calendar has them now (follows reschedules), linked to companies where Medint knows the link
function googleMeetings() { const C = __cm; const cal = dash.data('calendar_events'); if ('ok' !== cal.status) return []; const linked = new Map(); C.rowsOf('meetings').forEach((m) => m.event_id && linked.set(m.event_id, m.company_id)); C.rowsOf('meeting_links').filter((m) => m.action === 'link').forEach((m) => linked.set(m.event_id, m.company_id)); return cal.data.filter((e) => !e.all_day && e.start && linked.get(e.id)).map((e) => ({ company_id: linked.get(e.id), start: e.start, summary: e.summary })); }
// 🙈 companies you don't need to work on: left out of Home, Today, Power hour and Hot (yours only; for a while or until you change it)
const IGN_FOLDER = '6ad6c66c23cd83301a3640da'; const ignLocal = new Map(); // what this screen just changed, until NetHunt confirms
let ignIdx = { src: null, m: new Map() };
function ignRows() { const d = dash.data('medint_ignore'); if ('ok' !== d.status) return new Map(); if (ignIdx.src !== d.data) { const m = new Map(); d.data.forEach((r) => m.set(r.cid, r)); ignIdx = { src: d.data, m }; } return ignIdx.m; }
function isIgnored(id) { const t0 = new Date().toISOString().slice(0, 10); if (ignLocal.has(id)) { const v = ignLocal.get(id); return v !== null && (!v || v >= t0); } const r = ignRows().get(id); return !!r && (!r.until || r.until >= t0); }
async function setIgnore(id, days, name) { // shared with everyone: saved in NetHunt “Medint Ignore”
  const C = __cm; const until = days ? new Date(Date.now() + days * 864e5).toISOString().slice(0, 10) : ''; ignLocal.set(id, days === null ? null : until); hmKey = ''; tpKey = ''; dash.setParams({ ign: Date.now() % 1e6 });
  C.say(days === null ? `${name || 'Company'} is back in everyone’s lists` : `🙈 ${name || 'Company'} hidden for everyone from Home, Today and Power hour${days ? ` for ${days} days` : ''}`);
  try { const cur = ignRows().get(id);
    if (days === null) { if (cur) await C.nhCall('update_record', { folderId: IGN_FOLDER, recordId: cur.id, fieldKeys: 'label', fields: { Active: 'Removed' } }); }
    else if (cur) await C.nhCall('update_record', { folderId: IGN_FOLDER, recordId: cur.id, fieldKeys: 'label', fields: { Until: until || null, By: me().name, Active: 'Active' } });
    else await C.nhCall('create_record', { folderId: IGN_FOLDER, fieldKeys: 'label', fields: { Name: name || id, Company: [id], 'Company ID': id, ...(until ? { Until: until } : {}), By: me().name, Active: 'Active' } });
    miLog({ action: 'Other', company_id: id, outcome: days === null ? 'stopped ignoring (for everyone)' : `ignored for everyone ${days ? `for ${days} days` : 'until changed'}` });
    dash.refresh('medint_ignore');
  } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); ignLocal.delete(id); dash.setParams({ ign: Date.now() % 1e6 }); }
}
// earlier personal ignores move to the shared list once
let ignMigrated = !1;
setInterval(() => { if (ignMigrated) return; const d = dash.data('medint_ignore'); const mine = __cm.ignoredCos || {}; if ('ok' !== d.status) return; ignMigrated = !0;
  Object.entries(mine).forEach(([id, x]) => { if (!ignRows().has(id) && (!x.until || x.until >= new Date().toISOString().slice(0, 10))) setIgnore(id, x.until ? Math.max(1, Math.round((new Date(x.until) - Date.now()) / 864e5)) : 0, x.name); }); __cm.ignoredCos = {}; }, 4000);
function ignoreBtn(id, name, after) { const b = __cm.el('button', 'cm-mini', isIgnored(id) ? '🙈 Ignored — show again' : '🙈 Ignore'); b.type = 'button'; b.title = 'Hide this company for everyone from Home, Today, Power hour and Hot companies'; { const r = ignRows().get(id); if (r && isIgnored(id)) b.title = `Ignored by ${r.by || 'someone'}${r.until ? ` until ${r.until}` : ''} — tap to show it again for everyone`; }
  b.addEventListener('click', (ev) => { ev.stopPropagation(); if (isIgnored(id)) return setIgnore(id, null, name); const go = (d) => () => { setIgnore(id, d, name); after && after(); }; __cm.openMenu(b, [{ icon: '🗓', label: 'For 1 month', act: go(30) }, { icon: '🗓', label: 'For 3 months', act: go(91) }, { icon: '🙈', label: 'Until I change it', act: go(0) }]); }); return b; }
let phFull = []; // the full Power hour order behind the current session (Best partners “Do next” uses it)
let phIdx = { src: null, m: new Map() }; const phMap = () => { powerQueue(); if (phIdx.src !== phFull) phIdx = { src: phFull, m: new Map(phFull.map((x, k) => [x.id, [k, x]])) }; return phIdx.m; };
// can we reach them? true = a phone, WhatsApp or email is known · false = we know there is none · null = not known yet (decided when Power hour opens it)
function reachable(id, co) { const C = __cm; const rc = C.realContact(id); if (rc && /chat|email|call/.test(rc.type || '')) return !0; const c = (co && co.get(id)) || C.rowsOf('companies').find((x) => x.id === id);
  if (c) return !!(String(c.phones || '').replace(/\D/g, '').length >= 7 || /@/.test(String(c.emails || '')) || Number(c.people) > 0); return null; }
function phRank(id) { const v = phMap().get(id); return v ? v[0] : 1e6; }
function phItem(id) { const v = phMap().get(id); return v ? v[1] : null; }
const tzCache = new Map(); setInterval(() => tzCache.clear(), 5 * 60e3); // office hours per country, worked out once every 5 minutes
let pqMemo = { key: '', at: 0, val: null };
// Next Shoulder already has a distributor here (Distribütor Listesi, 2025) — People don't get these companies for Next outreach; House still sees them
const NEXT_DIST = new Set(['LY', 'MA', 'LB', 'MX', 'AZ', 'EG', 'IR', 'MY', 'BR', 'UZ', 'RU', 'IQ', 'MV', 'UG', 'CO', 'PH', 'PL', 'PK', 'AR', 'SA', 'LK', 'GR', 'JO', 'CN', 'YE', 'MD', 'IT', 'PE', 'ID', 'PR', 'NI', 'UA', 'MU', 'PT']);
const NEXT_DIST_INFO = { LY: 'Titanium Medical · no contract', MA: 'ABC Syntese · exclusive (3 yrs)', LB: 'ZN-Medical Group · non-exclusive', MX: 'Intra/ICON · exclusive (5 yrs)', AZ: 'Med Line Group · non-exclusive', EG: 'ProMed · exclusive (5 yrs)', IR: 'Yasna Teb Zagros (ASA Group) · exclusive (5 yrs)', MY: 'Arah Tenang Sdn Bhd · exclusive (3 yrs)', BR: 'VOX Medical · exclusive (5 yrs)', UZ: 'PharmMed LLC · exclusive (3 yrs)', RU: 'CMT · exclusive (5 yrs)', IQ: 'Zahra · exclusive for Baghdad & Kirkuk (3 yrs)', MV: 'ADK Trade and Shipping · no contract', UG: 'IK Medical · no contract', CO: 'NAO Medical · exclusive (5 yrs)', PH: 'BJ Medical · exclusive (3 yrs)', PL: 'MASS Medica · exclusive (3 yrs)', PK: 'Rech International · exclusive (5 yrs)', AR: 'Osteolife SRL · contract in progress', SA: 'Golden Future Care · exclusive (5 yrs)', LK: 'Cileda Surgical · exclusive (3 yrs)', GR: 'Lanomer · contract in progress', JO: 'Panorama Medical · contract in progress', CN: 'Guorun Medical · Lecheng, Hainan', YE: 'Dr. Adel', MD: 'Triumf Motive', IT: 'RHS Medical SRL', PE: 'Grupo 24', ID: 'PT Bina Artha Semesta', PR: 'Medison Ortho Inc.', NI: 'Implornorte', UA: 'Bauers Synthes · Implant Style', MU: 'Vikram', PT: 'Criomove' };
function nextInfo(iso) { if (!iso || !nextDist().has(iso)) return null; return { iso, who: ((__cm.uiFlags || {}).nextDistInfo || {})[iso] || NEXT_DIST_INFO[iso] || 'Next Shoulder distributor' }; }
function nextTag(iso, small) { const n = nextInfo(iso); if (!n) return null; const t = __cm.el('div', `cm-nexttag${small ? ' sm' : ''}`); t.append(__cm.el('b', null, '🔴 Next already in market'), __cm.el('span', null, ` · ${n.who}`)); t.title = isHouse() ? 'Next Shoulder already has a distributor here — People don’t get these companies for Next outreach' : 'Next Shoulder already has a distributor in this country'; return t; }
const nextDist = () => { const o = (__cm.uiFlags || {}).nextDistIsos; return Array.isArray(o) && o.length ? new Set(o) : NEXT_DIST; };
function nextHide(iso, brand, id) { if (isHouse() || !iso || !nextDist().has(iso)) return !1; if (brand === 'next') return !0; if (brand === 'dunitech' || brand === 'motion') return !1; return bestBrand(id, null, 'next') === 'next'; }
function powerQueue() {
  const C0 = __cm; const key = [C0.curView(), C0.oursKey(), dash.params().iso, dash.params().pcity, dash.params().phfor, dash.params().pfit, dash.params().phide, dash.params().asg, phMode, phNoReach.size, (C0.curView() === 'country' ? C0.rowsOf('partners').length : 0), C0.rowsOf('pipeline_stages').length, dash.data('contact_history').status, (dash.data('contact_history').data || []).length, dash.data('calendar_events').status, phWorked.size, dash.params().ign].join('|');
  if (pqMemo.key === key && Date.now() - pqMemo.at < 20e3) return pqMemo.val; // the same answer for 20 s: Home and Power hour don't recompute it on every redraw
  const val = powerQueue0(); if (val && Array.isArray(val.list) && !isHouse()) { const isoOf = (x) => x.iso || ((__cm.companyById && __cm.companyById(x.id)) || {}).iso || (C0.curView() === 'country' ? dash.params().iso : ''); val.list = val.list.filter((x) => !nextHide(isoOf(x), val.key, x.id)); } pqMemo = { key, at: Date.now(), val }; return val;
}
function powerQueue0() {
  const C = __cm; const k = C.oursKey(); const key = C.OURS[k].all ? 'next' : k; const today = new Date().toISOString().slice(0, 10); const now = Date.now();
  const co = new Map(C.curView() === 'country' ? C.rowsOf('companies').map((c) => [c.id, c]) : []); /* the country's companies only matter on its page */ const pst = new Map(C.rowsOf('pipeline_stages').map((r) => [r.id, r]));
  const ch = dash.data('contact_history'); const soonMeet = new Map(); const gm = googleMeetings(); const gCos = new Set(gm.map((m) => m.company_id));
  gm.forEach((m) => { const d = (new Date(m.start) - now) / 864e5; if (d >= -0.1 && d <= 2 && (!soonMeet.has(m.company_id) || soonMeet.get(m.company_id) > d)) soonMeet.set(m.company_id, d); });
  ('ok' === ch.status ? ch.data : []).forEach((e) => { if (e.type !== 'calendar' || gCos.has(e.record_id)) return; const d = (new Date(e.time) - now) / 864e5; if (d >= -0.1 && d <= 2) soonMeet.set(e.record_id, d); });
  const tzOpen = (iso) => { if (tzCache.has(iso)) return tzCache.get(iso); const v = tzOpen0(iso); tzCache.set(iso, v); return v; }; const tzOpen0 = (iso) => { const z = C.TZ[iso]; if (!z) return 0; try { const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: z, hour: '2-digit', hour12: !1 }).format(new Date())); const wd = new Intl.DateTimeFormat('en-GB', { timeZone: z, weekday: 'short' }).format(new Date()); return !/Sat|Sun/.test(wd) && h >= 9 && h < 18 ? 1 : 0; } catch { return 0; } };
  const lost = (st) => /not interested|lost|rejected|no fit|not a fit|closed|doctor|surgeon|hospital|no info/i.test(String(st || '')); // never in Power hour
  // statuses that mean “not now”: Nurture (long-term, light touch) and Drip (an email sequence is already running) — they only come in when they wrote, a meeting is near, a follow-up is due, or (Nurture) after 90 quiet days
  const parked = (st) => /nurtur|exploring market entry/i.test(String(st || '')); // Nurturing and Exploring Market Entry: only when they wrote and are waiting for our answer
  const tierOf = (id, stage, status, score, nf) => { if (lost(status)) return -1; if (phMode === 'enrich') { const t0 = tierOf0(id, stage, status, score, nf); return t0 < 0 ? 5 : t0; } const t0 = tierOf0(id, stage, status, score, nf); if (!parked(status)) return t0; return t0 === 0 ? 0 : -1; };
  const tierOf0 = (id, stage, status, score, nf) => {
    const rc = C.realContact(id); const days = rc ? rc.days : null;
    if (rc && rc.pending) return 0;
    if (soonMeet.has(id)) return 1;
    if (nf && String(nf).slice(0, 10) <= today) return 2;
    if (lost(status) || stage >= 6) return -1;
    if (days != null && days < 2) return 8; // just contacted: after everything else
    if (stage >= 4 && (days == null || days >= 14)) return 3;
    if (stage === 3 && (days == null || days >= 21)) return 4;
    if (rc === null && score != null && score >= 40) return 5;
    if (score != null && score >= 50 && (days == null || days >= 30)) return 6;
    return -1;
  };
  const items = [];
  if (C.curView() === 'country') {
    const c0 = dash.params().pcity; const city = c0 && C.rowsOf('partners').some((r) => C.norm(String(r.city || '').split(',')[0].trim()) === C.norm(c0)) ? c0 : null; // ignore a city from another country
    const P = dash.params(); const fitOk = (r) => (P.pfit !== 'fit' || (r[`seg_brands_${key}`] || 0) > 0) && (key === 'motion' || r.cat_ok || r.ortho_rel || (r[`score_${key}`] || 0) >= 60 || (r[`stage_${key}`] || 0) >= 3 || (C.realContact(r.id) || {}).pending); /* Next & Dunitech: Ortho / Customer companies (others only if ortho-related or a high score) */ const ppOk = (r) => !(P.phide && C.isPerson && C.isPerson(r.company)); const asOk = (r) => passAssign(r.id); // the same filters as Best partners
    C.rowsOf('partners').filter((r) => r.ortho_verdict !== 'not_ortho' && fitOk(r) && ppOk(r) && asOk(r) && (!city || C.norm(String(r.city || '').split(',')[0].trim()) === C.norm(city))).forEach((r) => {
      const c = co.get(r.id) || {}; const score = r[`score_${key}`] ?? r.score_all; const t = tierOf(r.id, r[`stage_${key}`] || 0, r[`status_${key}`], score, c.next_followup);
      if (t >= 0) items.push({ id: r.id, name: r.company, city: r.city, iso: dash.params().iso, status: r[`status_${key}`], score, line_names: r.line_names, t, open: tzOpen(dash.params().iso), due: c.next_followup || '' });
    });
    // a Power hour is ~25 calls: when the urgent groups are short, add the best remaining companies (new leads first, then keep warm)
    if (items.length < PH_POOL) { const have = new Set(items.map((x) => x.id));
      C.rowsOf('partners').filter((r) => !have.has(r.id) && r.ortho_verdict !== 'not_ortho' && !isIgnored(r.id) && !parked(r[`status_${key}`]) && fitOk(r) && ppOk(r) && asOk(r) && (!city || C.norm(String(r.city || '').split(',')[0].trim()) === C.norm(city)) && (r[`stage_${key}`] || 0) < 6 && !lost(r[`status_${key}`]))
        .map((r) => { const rc = C.realContact(r.id); return { r, rc, score: r[`score_${key}`] ?? r.score_all ?? 0 }; })
        .sort((x, y) => (!x.rc ? 0 : 1) - (!y.rc ? 0 : 1) || y.score - x.score).slice(0, PH_POOL - items.length)
        .forEach(({ r, rc, score }) => items.push({ id: r.id, name: r.company, city: r.city, iso: dash.params().iso, status: r[`status_${key}`], score, line_names: r.line_names, t: !rc ? 5 : rc.days != null && rc.days < 7 ? 8 : 6, open: tzOpen(dash.params().iso), due: '' })); }
  } else {
    const ids = new Set(); ('ok' === ch.status ? ch.data : []).forEach((e) => ids.add(e.record_id)); C.todayData().due.forEach((p) => ids.add(p.id)); C.todayData().now.forEach(({ r: p }) => ids.add(p.id));
    pst.forEach((p, id) => { if ((p[`stage_${key}`] || 0) >= 3) ids.add(id); });
    ids.forEach((id) => { const p = pst.get(id) || {}; const name = p.company || (C.companyById(id) || {}).company; if (!name) return; const t = tierOf(id, p[`stage_${key}`] || 0, p[`status_${key}`], null, p.next_followup);
      if (t >= 0 && t <= 4) items.push({ id, name, city: p.city, iso: p.iso, status: p[`status_${key}`] || p.status_all, score: (p[`stage_${key}`] || 0) * 10, t, open: tzOpen(p.iso), due: p.next_followup || '' }); });
    if (items.length < PH_POOL) { const have = new Set(items.map((x) => x.id)); const iv = new Map(C.rowsOf('import_values').map((x) => [x.id, x.weighted_value_usd || x.import_value_usd || 0]));
      const pool = [...pst.values()].filter((p) => p.company && !have.has(p.id) && !isIgnored(p.id) && !parked(p[`status_${key}`]) && (key === 'motion' || /^(ortho|customers?)$/i.test(String(p.category || '').trim()) || (p[`stage_${key}`] || 0) >= 3) && (p[`stage_${key}`] || 0) < 6 && !lost(p[`status_${key}`]))
        .map((p) => ({ p, rc: C.realContact(p.id), v: iv.get(p.id) || 0, st: p[`stage_${key}`] || 0 }));
      const fresh = pool.filter(({ rc, st, v }) => rc === null && st < 3 && v > 0).sort((x, y) => y.v - x.v); const warm = pool.filter(({ rc, st }) => rc && rc.days >= 7 && st >= 2).sort((x, y) => (x.rc.days < 30) - (y.rc.days < 30) || y.st - x.st || y.v - x.v); const recent = pool.filter(({ rc, st }) => rc && rc.days < 7 && st >= 2 && st < 6).sort((x, y) => y.st - x.st);
      const picked = new Set([...fresh, ...warm, ...recent].map((x) => x.p.id)); // anything left (never contacted, no import data yet) still makes a full session: furthest along first, then those with a phone or email
      const rest = pool.filter((x) => !picked.has(x.p.id)).sort((x, y) => y.st - x.st || (x.rc === null ? 0 : 1) - (y.rc === null ? 0 : 1) || y.v - x.v || String(x.p.company).localeCompare(String(y.p.company)));
      [...fresh.slice(0, Math.ceil((PH_POOL - items.length) * 0.6)).map((x) => ({ ...x, t: 5 })), ...warm.map((x) => ({ ...x, t: 6 })), ...fresh.slice(Math.ceil((PH_POOL - items.length) * 0.6)).map((x) => ({ ...x, t: 5 })), ...rest.map((x) => ({ ...x, t: x.rc === null ? 5 : 6 })), ...recent.map((x) => ({ ...x, t: 8 }))].slice(0, PH_POOL - items.length)
        .forEach(({ p, v, t }) => items.push({ id: p.id, name: p.company, city: p.city, iso: p.iso, status: p[`status_${key}`] || p.status_all, score: Math.min(99, Math.round(Math.log10(1 + v) * 10)), t, open: tzOpen(p.iso), due: '' })); }
  }
  if (window.__m3 && SEQ_ON) { const today2 = isoDay(Date.now()); const have = new Map(items.map((x) => [x.id, x])); seqDue().forEach(({ s, st }) => { if (C.curView() === 'country' && s.d.iso !== dash.params().iso) return; const ex = have.get(s.cid); const seq = { i: st.i, n: (s.d.steps || []).length, ch: st.step[1], due: st.due, lang: s.d.lang };
    if (ex) { ex.seq = seq; if (ex.t > 2) ex.t = 2; ex.due = st.due; } else { const p = pst.get(s.cid) || {}; items.push({ id: s.cid, name: s.d.company || p.company || 'Company', city: p.city, iso: s.d.iso || p.iso, status: p[`status_${key}`] || p.status_all, score: 0, t: 2, open: tzOpen(s.d.iso || p.iso), due: st.due || today2, seq }); } }); }
  items.forEach((x) => { if (x.t !== 0 && /manufacturing branch/i.test(String(x.status || ''))) x.t = 9; if (x.t !== 0 && /unprocessed/i.test(String(x.status || ''))) x.t = 10; }); // manufacturers' branches, then unprocessed: at the very end (unless they wrote)
  { const ready = (x) => reachable(x.id, co); const enr = new Set([...phNoReach, ...((C.uiFlags || {}).enrichIds || [])].filter((id) => reachable(id, co) !== !0)); // once a number or email is added they leave the Enrich list // 🔎 Enrich queue: no phone, WhatsApp or email yet — Power hour: only the ones you can call or write to
    if (phMode === 'enrich') { const L = items.filter((x) => x.t !== 0 && (enr.has(x.id) || ready(x) === !1)); items.length = 0; items.push(...L); } else { const L = items.filter((x) => x.t === 0 || (!enr.has(x.id) && ready(x) !== !1)); items.length = 0; items.push(...L); } }
  const rcT = (id) => { const rc = C.realContact(id); return rc ? +new Date(rc.time) : 0; };
  items.sort((a, b) => a.t - b.t
    || (a.t === 0 ? rcT(a.id) - rcT(b.id) : 0) // longest-waiting reply first
    || (a.t === 1 ? (soonMeet.get(a.id) || 0) - (soonMeet.get(b.id) || 0) : 0) // the next meeting first
    || (a.t === 2 ? String(a.due).localeCompare(String(b.due)) : 0) // most overdue first
    || b.open - a.open // open for calls right now
    || (b.score || 0) - (a.score || 0));
  const pf = isHouse() ? phFor() : ''; if (pf) dash.data('medint_assign');
  const seen = new Set(); const list = items.filter((x) => !seen.has(x.id) && seen.add(x.id) && !isIgnored(x.id) && (!pf || (pf === '-' ? !assigneeOf(x.id) : assigneeOf(x.id) === pf)));
  const rest = list.filter((x) => !phWorked.has(x.id)); phFull = list; return { list: rest.slice(0, PH_TARGET), label: PH_WHY, key, total: rest.length };
}
function guessLang(text, fallback) {
  const t = ` ${String(text || '').toLowerCase()} `;
  if (/[çğışöü]| merhaba | teşekkür| iyi günler /.test(t) && !/[ãõ]/.test(t)) return /ə/.test(t) ? 'az' : 'tr';
  if (/[а-яё]/.test(t)) return 'ru';
  if (/[\u0600-\u06ff]/.test(t)) return 'ar';
  if (/[ãõ]| obrigad| você | não | olá |bom dia/.test(t)) return 'pt';
  if (/ bonjour | merci | vous /.test(t)) return 'fr';
  if (/[¿¡ñ]| hola | gracias | buenos | buenas | usted | cuándo | para | por favor /.test(t)) return 'es';
  if (/ hello | hi | thanks | thank you | please | dear | regards /.test(t)) return 'en';
  return fallback;
}
function replyDraft(it, rc, person, lang, brand, force) {
  const m = force ? '' : String((rc && rc.pending && rc.preview) || '').toLowerCase(); const first = String(person || '').split(/\s+/)[0];
  const es = 'es' === lang;
  const L = {
    tr: { hi: `Merhaba${first ? ` ${first}` : ''}, mesajınız için teşekkürler.`, visit: 'Bir toplantı ayarlamaktan memnuniyet duyarım: bu hafta veya gelecek hafta hangi gün ve saat size uygun? Ofisinize gelebilir ya da online görüşebiliriz.', price: 'Fiyat listesini ve distribütör koşullarını bugün gönderiyorum.', cat: 'Tüm ürün gamımızı içeren kataloğumuzu ekte bulabilirsiniz.', reg: 'Ruhsat konusunda: CE ve ISO 13485 sertifikalarımız var ve yerel ruhsat için teknik dosyayı hazırlıyoruz.', sample: 'Değerlendirme için numune ve set gönderebiliriz.', gen: `${brand} ürünlerini tanıtmak ve ürün gamınızı daha yakından tanımak isterim. Bu hafta kısa bir görüşme için zamanınız olur mu?`, bye: 'Saygılarımla,\nKavi Kaplan', hello: 'Merhaba' },
    fr: { hi: `Bonjour${first ? ` ${first}` : ''}, merci pour votre message.`, visit: 'Avec plaisir pour une réunion : quel jour et quelle heure vous conviennent cette semaine ou la suivante ? Je peux venir à votre bureau ou en ligne.', price: 'Je vous envoie aujourd’hui la liste de prix et les conditions distributeur.', cat: 'Veuillez trouver ci-joint notre catalogue complet.', reg: 'Concernant l’enregistrement : nous avons la certification CE et ISO 13485 et préparons le dossier technique.', sample: 'Nous pouvons envoyer des échantillons et un set d’instruments pour évaluation.', gen: `J’aimerais vous présenter ${brand} et mieux connaître votre gamme. Auriez-vous quelques minutes pour un appel cette semaine ?`, bye: 'Cordialement,\nKavi Kaplan', hello: 'Bonjour' },
    ru: { hi: `Здравствуйте${first ? `, ${first}` : ''}! Спасибо за ваше сообщение.`, visit: 'С удовольствием договоримся о встрече: какой день и время вам удобны на этой или следующей неделе? Могу приехать в ваш офис или встретиться онлайн.', price: 'Сегодня отправлю прайс-лист и условия для дистрибьюторов.', cat: 'Во вложении наш каталог со всей линейкой.', reg: 'По регистрации: у нас есть сертификаты CE и ISO 13485, мы готовим техническое досье для регистрации.', sample: 'Можем отправить образцы и набор инструментов для оценки.', gen: `Хотел бы представить ${brand} и лучше узнать ваш ассортимент. Найдётся ли у вас несколько минут для звонка на этой неделе?`, bye: 'С уважением,\nKavi Kaplan', hello: 'Здравствуйте' },
    az: { hi: `Salam${first ? ` ${first}` : ''}, mesajınız üçün təşəkkür edirəm.`, visit: 'Görüş təyin etməkdən məmnun olaram: bu və ya gələn həftə hansı gün və saat sizə uyğundur? Ofisinizə gələ və ya onlayn görüşə bilərik.', price: 'Qiymət siyahısını və distribütor şərtlərini bu gün göndərirəm.', cat: 'Bütün çeşidimizi əhatə edən kataloqumuz əlavədədir.', reg: 'Qeydiyyatla bağlı: CE və ISO 13485 sertifikatlarımız var, texniki sənədləri hazırlayırıq.', sample: 'Qiymətləndirmə üçün nümunə və alət dəsti göndərə bilərik.', gen: `${brand} məhsullarını təqdim etmək istərdim. Bu həftə qısa zəng üçün vaxtınız olarmı?`, bye: 'Hörmətlə,\nKavi Kaplan', hello: 'Salam' },
    ar: { hi: `مرحباً${first ? ` ${first}` : ''}، شكراً على رسالتكم.`, visit: 'يسعدني تحديد اجتماع: أي يوم ووقت يناسبكم هذا الأسبوع أو الأسبوع القادم؟ يمكنني زيارة مكتبكم أو الاجتماع عبر الإنترنت.', price: 'سأرسل لكم اليوم قائمة الأسعار وشروط التوزيع.', cat: 'تجدون مرفقاً كتالوجنا الكامل.', reg: 'بخصوص التسجيل: لدينا شهادات CE و ISO 13485 ونعدّ الملف الفني للتسجيل المحلي.', sample: 'يمكننا إرسال عينات ومجموعة أدوات للتقييم.', gen: `أود أن أقدم لكم ${brand} وأتعرف أكثر على منتجاتكم. هل لديكم بضع دقائق لمكالمة هذا الأسبوع؟`, bye: 'مع أطيب التحيات،\nكافي كابلان', hello: 'مرحباً' },
  };
  const S = L[lang] ? L[lang] : 'pt' === lang
    ? { hi: `Olá${first ? ` ${first}` : ''}, obrigado pela sua mensagem.`, visit: 'Com prazer marcamos uma reunião: que dia e horário lhe convém esta semana ou na próxima? Posso ir ao seu escritório ou fazer online.', price: 'Envio hoje a lista de preços e as condições para distribuidores.', cat: 'Segue em anexo o nosso catálogo com toda a linha.', reg: 'Sobre o registro: temos certificação CE e ISO 13485 e preparamos a documentação técnica para o registro local.', sample: 'Podemos enviar amostras e um set de instrumental para avaliação.', gen: `Gostaria de apresentar a ${brand} e conhecer melhor a sua linha de produtos. Teria alguns minutos para uma ligação esta semana?`, bye: 'Atenciosamente,\nKavi Kaplan' }
    : es
    ? { hi: `Hola${first ? ` ${first}` : ''}, gracias por su mensaje.`, visit: 'Con gusto coordinamos una reunión: ¿qué día y hora le conviene esta semana o la próxima? Puedo ir a su oficina o hacerla en línea.', price: 'Le envío hoy la lista de precios y las condiciones para distribuidores.', cat: 'Le adjunto nuestro catálogo con toda la línea.', reg: 'Sobre el registro sanitario: contamos con certificación CE e ISO 13485 y preparamos la documentación técnica para el registro.', sample: 'Podemos enviarle muestras y un set de instrumental para evaluación.', gen: `Me encantaría presentarle ${brand} y conocer mejor su línea de productos. ¿Tiene unos minutos para una llamada esta semana?`, bye: 'Saludos cordiales,\nKavi Kaplan' }
    : { hi: `Hello${first ? ` ${first}` : ''}, thank you for your message.`, visit: 'Happy to meet — which day and time suits you this week or next? I can visit your office or we can meet online.', price: 'I will send you our price list and distributor terms today.', cat: 'Please find our catalogue with the full range attached.', reg: 'On registration: we hold CE and ISO 13485 certification and prepare the technical file for the local registration.', sample: 'We can send samples and an instrument set for evaluation.', gen: `I would love to introduce ${brand} and learn more about your product range. Do you have a few minutes for a call this week?`, bye: 'Kind regards,\nKavi Kaplan' };
  const pending = !force && !!(rc && rc.pending);
  const parts = [pending ? S.hi : `${S.hello || { es: 'Hola', pt: 'Olá', en: 'Hello' }[lang] || 'Hello'}${first ? ` ${first}` : ''},`];
  if (/cu[aá]ndo|visit|reuni|meet|when|hora|fecha|agenda|cita/.test(m)) parts.push(S.visit);
  if (/precio|price|cotiza|quot|cost|valor|tarifa/.test(m)) parts.push(S.price);
  if (/cat[aá]log|informaci|info\b|brochure|ficha|portafolio/.test(m)) parts.push(S.cat);
  if (/registr|arcsa|digemid|invima|sanitari/.test(m)) parts.push(S.reg);
  if (/muestra|sample|demo/.test(m)) parts.push(S.sample);
  if (force) force.forEach((k) => parts.push(S[k]));
  else if (parts.length === 1) parts.push(S.gen);
  return `${parts.join('\n\n')}\n\n${S.bye}`;
}
// the brand this company is furthest along with — Power hour shows and edits that status (e.g. Next Shoulder for Bimar, Dunitech for Medifor)
const stageGuess = (v) => { const t = low(String(v || '').trim()); if (!t) return 0; if (/lost|not interested|no fit|not a fit|rejected|closed/.test(t)) return 0; if (/signed|order|purchas|customer|partner|distributo|exclusive|\bwon\b/.test(t)) return 6; if (/contract|sign|negotiat|proposal|quot|offer|price|registration|agreement|tender/.test(t)) return 5; if (/meeting|interest|promis|qualif|explor|demo|visit|sample|present/.test(t)) return 4; if (/repl|engag|follow|nurtur|await|respon/.test(t)) return 3; if (/contact|call|drip|\bwa\b|sent|email/.test(t)) return 2; return 1; };
function bestBrand(id, F, key) { const C = __cm; const pr = (C.curView() === 'country' ? C.rowsOf('partners') : []).find((r) => r.id === id) || C.rowsOf('pipeline_stages').find((r) => r.id === id) || {};
  return ['next', 'dunitech', 'motion'].map((b) => [b, Math.max(pr[`stage_${b}`] || 0, F && F.get ? stageGuess(F.get(C.STATUS_FIELD[b])) : 0)]).sort((x, y) => y[1] - x[1] || (x[0] === key ? -1 : y[0] === key ? 1 : 0))[0][0]; }
let phUndo = null; // the company you just skipped (↶ Undo for 5 seconds)
let phMode = ''; // '' = Power hour (ready to call) · 'enrich' = 🔎 Enrich queue (find numbers and emails)
const phNoReach = new Set(); // seen in Power hour with no phone, WhatsApp or email
const tlSeen = new Set(); // companies whose activity was re-read in this session
function openEnrich(anchor) { phMode = 'enrich'; pqMemo.key = ''; openPowerHour(anchor, null, 'enrich'); }
function openPowerHour(anchor, focusId, mode) { if (mode !== 'enrich') phMode = ''; pqMemo.key = '';
  const C = __cm; const el = C.el;
  { const sh = document.getElementById('cm-sheet'); const t = (document.getElementById('cm-sheet-title') || {}).textContent || ''; if (sh && !sh.hidden) { if (/^⚡/.test(t) && !focusId) return; C.closeSheet(); } } /* another pop-up open (Log, daily question…) → replace it; Power hour already open → keep it */
  let { list: queue, label: why, key } = powerQueue(); let i = 0; const done = [];
  if (focusId) { const r = (C.curView() === 'country' || C.curView() === 'company' ? C.rowsOf('partners') : []).find((x) => x.id === focusId) || {}; const p = C.rowsOf('pipeline_stages').find((x) => x.id === focusId) || C.companyById(focusId) || {};
    const it0 = queue.find((x) => x.id === focusId) || { id: focusId, name: r.company || p.company || 'Company', city: r.city || p.city, iso: p.iso || dash.params().iso, status: r[`status_${key}`] || p[`status_${key}`], score: r[`score_${key}`] ?? r.score_all, line_names: r.line_names, t: 7 };
    queue = [it0, ...queue.filter((x) => x.id !== focusId)]; }
  const scope = C.curView() === 'country' ? ((C.multiIsos() ? (dash.params().glabel || 'these countries') : (C.countryOfIso(dash.params().iso) || {}).country) + (dash.params().pcity && C.rowsOf('partners').some((r) => C.norm(String(r.city || '').split(',')[0].trim()) === C.norm(dash.params().pcity)) ? ` · ${dash.params().pcity}` : '')) : 'all countries';
  const focus = () => { const it = queue[i]; if (it && dash.params().cid !== it.id) dash.setParams({ cid: it.id }); it && (miCtx = it.id); dash.data('company_timeline'); if (it && !tlSeen.has(it.id)) { tlSeen.add(it.id); setTimeout(() => { if (dash.params().cid === it.id) dash.refresh('company_timeline'); }, 50); } }; // loads this company's people, brands and numbers
  focus();
  C.openSheet(anchor, `${phMode === 'enrich' ? '🔎 Enrich' : '⚡ Power hour'} · ${scope}`, (body) => {
    if (!queue.length) { body.append(el('div', 'hint', 'Nothing to work on right now — no replies waiting, no follow-ups due.')); if (isHouse()) { const fr = el('div', 'cm-chips'); [['', 'Everyone'], ['-', 'Unassigned'], ...miPeople().filter((p) => p.active).map((p) => [p.name, p.name])].forEach(([v, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(phFor() === v)); b.addEventListener('click', () => { dash.setParams({ phfor: v || null }); ({ list: queue } = powerQueue()); i = 0; focus(); C.sheetDraw(); }); fr.append(b); }); body.append(fr); } return; }
    if (i >= queue.length) { const ttl = document.getElementById('cm-sheet-title'); if (ttl) ttl.textContent = phMode === 'enrich' ? '🔎 Enrich · done' : '⚡ Power hour · done';
      const nx = powerQueue(); const d0 = el('div', 'cm-ph'); d0.append(el('div', 'who', `Done — ${done.length} compan${done.length === 1 ? 'y' : 'ies'} saved, ${queue.length - done.length} skipped. 🎉`), el('div', 'mut', nx.total ? `${nx.total} more in the list — the next ${Math.min(PH_TARGET, nx.total)} continue where you stopped (recently contacted ones come last).` : 'You’ve worked through the whole list.'));
      const r0 = el('div', 'big acts'); if (nx.total) { const nb = el('button', 'cm-btn', `▶ Next ${Math.min(PH_TARGET, nx.total)}`); nb.type = 'button'; nb.addEventListener('click', () => { queue = nx.list; i = 0; done.length = 0; focus(); C.sheetDraw(); }); r0.append(nb); }
      const cb = el('button', 'cm-btn ghost', 'Close'); cb.type = 'button'; cb.addEventListener('click', () => C.closeSheet()); r0.append(cb); d0.append(r0); body.append(d0); return; }
    const it = queue[i]; const rc = C.realContact(it.id);
    const rec = dash.data('company_record'); const F = new Map('ok' === rec.status && dash.params().cid === it.id ? rec.data.map((r) => [r.field, r.value]) : []);
    const lines = (v) => (Array.isArray(v) ? v : String(v || '').split(/\n| \| |, (?=[^ ]+@)/)).map((x) => String(x).trim()).filter(Boolean);
    const wrap = el('div', 'cm-ph2'); const box = el('div', 'cm-ph'); const side = el('div', 'side');
    const chooser = () => { const fr = el('div', 'cm-chips cm-phlang'); [['', 'Everyone'], ['-', 'Unassigned'], ...miPeople().filter((p) => p.active).map((p) => [p.name, p.name])].forEach(([v, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(phFor() === v)); b.addEventListener('click', () => { dash.setParams({ phfor: v || null }); ({ list: queue } = powerQueue()); i = 0; focus(); C.sheetDraw(); }); fr.append(b); }); const fm = el('div', 'meta'); fm.append('Whose companies:', fr); return fm; };
    { const sh = document.querySelector('#cm-sheet .sh'); let ctl = sh && sh.querySelector('.cm-phctl');
      if (sh && !ctl) { ctl = el('div', 'cm-phctl'); sh.insertBefore(ctl, sh.querySelector('.sx')); }
      if (ctl) { ctl.replaceChildren();
        if (isHouse()) { const ws = el('select', 'cm-phtpl'); ws.title = 'Whose companies'; [['', '👥 Everyone'], ['-', 'Unassigned'], ...miPeople().filter((p) => p.active).map((p) => [p.name, p.name])].forEach(([v, l]) => ws.append(new Option(l, v))); ws.value = phFor(); ws.addEventListener('change', () => { dash.setParams({ phfor: ws.value || null }); ({ list: queue } = powerQueue()); i = 0; focus(); C.sheetDraw(); }); ctl.append(ws); }
        const bs = el('select', 'cm-phtpl'); bs.title = 'Brand the message and status are for'; ['next', 'dunitech', 'motion'].forEach((b) => bs.append(new Option(C.OURS[b].label, b))); bs.value = it.__brand || key; bs.addEventListener('change', () => { it.__brand = bs.value; it.__brandMine = !0; if (String(it.__tpl || '').startsWith('my:')) it.__tpl = ''; it.__edited = !1; C.sheetDraw(); }); ctl.append(bs); } }
    { const ttl = document.getElementById('cm-sheet-title'); if (ttl) { ttl.textContent = phMode === 'enrich' ? `🔎 ${i + 1} of ${queue.length} · find a phone, WhatsApp or email` : `⚡ ${i + 1} of ${queue.length} · ${why[it.t]}`;
        const tz = C.TZ[it.iso || dash.params().iso]; if (tz) { try { const P = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value])); const hr = +P.hour; const work = !/Sat|Sun/.test(P.weekday) && hr >= 9 && hr < 18;
          const tm = el('span', `cm-phtime${work ? ' on' : ''}`, `🕑 ${P.hour}:${P.minute} there${work ? '' : ' · closed'}`); tm.title = work ? 'Working hours in that country' : 'Outside working hours there'; ttl.append(' ', tm); } catch { /* unknown zone */ } } } }
    const nm = el('div', 'who cm-phwho'); const nb = el('button', 'cm-co', `${C.flag(it.iso) || ''} ${it.name}`.trim()); nb.type = 'button'; nb.dataset.openCompany = it.id; nm.append(nb); box.append(nm); setTimeout(() => { const am = box.querySelector('.cm-addmiss'); if (am && am.parentElement !== nm) nm.append(am); }, 0); /* 🔎 Add missing sits at the end of the name line */
    if (!it.__brandMine) it.__brand = bestBrand(it.id, F, key);
    { const ntg = (it.__brand === 'next' || key === 'next') && nextTag(it.iso || dash.params().iso); ntg && box.append(ntg); }
    const meta = el('div', 'meta'); meta.append([String(it.city || F.get('City') || '').split(/,|\n/)[0], ].filter(Boolean).join(' · '), String(it.city || F.get('City') || '').split(/,|\n/)[0] ? ' · ' : '', (() => { const st = F.get(C.STATUS_FIELD[it.__brand]) || (it.__brand === key ? it.status : ''); const sp = el('span', 'cm-stpill', st ? `${C.OURS[it.__brand].label}: ${st}` : 'no status'); sp.dataset.st = !st ? 'none' : /lost|not interested|no fit|not a fit|rejected/i.test(st) ? 'lost' : String(stageGuess(st)); return sp; })(), rc ? ` · last contact ${rc.ago} ago (${rc.type})` : rc === null ? ' · never really contacted' : '');
    const sg = C.statusSuggestBtn(it.id, it.name, key, it.status); sg && meta.append(' ', sg); box.append(meta);
    const pc0 = dash.data('company_contacts'); if (it.t !== 0 && dash.params().cid === it.id && 'ok' === dash.data('company_record').status && 'ok' === pc0.status && !(pc0.data[0] && pc0.data[0].for_cid && pc0.data[0].for_cid !== it.id)) { const ph0 = [...lines(F.get('Phone number')), ...pc0.data.flatMap((p) => C.splitBar(p.phone))].filter((x) => String(x).replace(/\D/g, '').length >= 7); const em0 = [...lines(F.get('Email')), ...pc0.data.map((p) => p.email)].filter((x) => /@/.test(String(x)));
      if ((ph0.length || em0.length) && phMode === 'enrich' && (phNoReach.has(it.id) || ((C.uiFlags || {}).enrichIds || []).includes(it.id))) { phNoReach.delete(it.id); C.uiFlags = { ...(C.uiFlags || {}), enrichIds: ((C.uiFlags || {}).enrichIds || []).filter((x) => x !== it.id) }; } // found something: back to Power hour
      if (phMode !== 'enrich' && !ph0.length && !em0.length && !phNoReach.has(it.id)) { phNoReach.add(it.id); C.uiFlags = { ...(C.uiFlags || {}), enrichIds: [...new Set([...((C.uiFlags || {}).enrichIds || []), it.id])].slice(-300) }; setTimeout(() => { C.say(`${it.name}: no phone or email yet — moved to 🔎 Enrich`); queue = queue.filter((x) => x.id !== it.id); focus(); C.sheetDraw(); }, 0); } }
    if (phMode === 'enrich') { const bn = el('div', 'cm-enrban', '🔎 Enrich: find a phone, WhatsApp or email for this company — then Done → it joins Power hour.'); box.append(bn); setTimeout(() => { const am = document.querySelector('#cm-sheet .cm-addmiss'); if (am && !am.dataset.auto && !document.querySelector('#cm-sheet .cm-enrich')) { am.dataset.auto = '1'; am.click(); } }, 60); }
    if (rc && rc.preview && (rc.pending || rc.type === 'chat')) { const lm = window.__cm3 && window.__cm3.lastMsgs ? window.__cm3.lastMsgs(it.id) : null; const mg = el('div', 'msg', lm && lm.length ? '' : `“${String(rc.preview).replace(/@\d{6,}/g, '@…')}”`); if (lm && lm.length) lm.forEach((m) => mg.append(el('div', `cm-lm ${m.incoming ? 'in' : 'out'}`, `${m.incoming ? '' : 'Us: '}${m.body}`))); if (guessLang(rc.preview, 'en') !== 'en') mg.append(translateBtn(rc.preview, mg)); box.append(mg); }
    const nxs = F.get('Next step'), nxf = F.get('Next follow-up'); if (nxs || nxf) box.append(el('div', 'meta', `Next step: ${nxs || 'follow up'}${nxf ? ` · ${C.dueLabel(String(nxf).slice(0, 10))}` : ''}`));
    // people (same format as the list's people pop-up) — decision makers and the most reachable first
    const pc = dash.data('company_contacts'); const ppl = 'ok' === pc.status && dash.params().cid === it.id && !(pc.data[0] && pc.data[0].for_cid && pc.data[0].for_cid !== it.id) ? pc.data.slice().sort(personSort) : [];
    const phones = [...lines(F.get('Phone number')), ...ppl.flatMap((p) => C.splitBar(p.phone))].filter((x) => /\d{6,}/.test(String(x).replace(/\D/g, '')));
    const emails = [...new Set([...lines(F.get('Email')), ...ppl.flatMap((p) => String(p.email || '').split(/, | \| /))].map((x) => x.trim().toLowerCase()).filter((x) => /@/.test(x)))];
    if (!it.__brandMine) it.__brand = bestBrand(it.id, F, key);
    const bkey = it.__brand; const bname = C.OURS[bkey].label;
    const ctx = { ...C.tplCtx({ company: it.name, brands: F.get('Brand') || it.line_names, iso: it.iso || dash.params().iso }), brand: bname };
    if (!it.__lang) { const prev = rc && rc.preview ? guessLang(rc.preview, null) : null; if (prev) it.__lang = prev; }
    const LN = { spanish: 'es', portuguese: 'pt', french: 'fr', russian: 'ru', azerbaijani: 'az', arabic: 'ar', turkish: 'tr', english: 'en' };
    const local = String((C.countryOfIso(it.iso || dash.params().iso) || {}).languages || '').toLowerCase().split(/[,;/]| and /).map((x) => LN[x.trim()]).filter(Boolean);
    const lang = it.__lang || local[0] || 'en';
    const langs = [...new Set(['en', 'tr', ...local, lang])];
    const TPL = { brochure: ['📄 Send brochure', ['cat']], price: ['💲 Price list', ['price']], meeting: ['📅 Meeting request', ['visit']], faq: ['❓ FAQ: registration & samples', ['reg', 'sample']] };
    const mine = (C.phTemplates[bkey] || []);
    const fill = (txt) => String(txt).replace(/\{name\}/g, (ppl[0] && ppl[0].name.split(' ')[0]) || '').replace(/\{company\}/g, it.name).replace(/\{brand\}/g, bname);
    if (!it.__edited) it.__draft = it.__tpl && it.__tpl.startsWith('my:') ? fill((mine[+it.__tpl.slice(3)] || {}).text || '') : replyDraft(it, rc, ppl[0] && ppl[0].name, lang, bname, it.__tpl && TPL[it.__tpl] ? TPL[it.__tpl][1] : null); // smart draft follows new info until you edit it
    let aiOn = !1; if (!it.__edited && !it.__tpl && window.__cm3 && window.__cm3.aiReply) { const v = window.__cm3.aiReply(it, { lang, first: (ppl[0] && ppl[0].name.split(' ')[0]) || '', brand: bname, sender: me().name, iso: it.iso || dash.params().iso, base: it.__draft }, () => { if (!it.__edited) C.sheetDraw(); }); if (v) { it.__draft = v; aiOn = !0; } }
    if (!aiOn && lang === 'ar' && !it.__edited && !String(it.__tpl || '').startsWith('my:') && window.__cm3 && window.__cm3.arDraft) { const v = window.__cm3.arDraft(it, replyDraft(it, rc, ppl[0] && ppl[0].name, 'en', bname, it.__tpl && TPL[it.__tpl] ? TPL[it.__tpl][1] : null), (ppl[0] && ppl[0].name.split(' ')[0]) || '', bname, it.iso || dash.params().iso, me().name, () => { if (!it.__edited) C.sheetDraw(); }); if (v) it.__draft = v; }
    if (window.__m3 && SEQ_ON && it.seq && !it.__edited && !it.__tpl) { const s0 = seqActive(it.id); if (s0) it.__draft = seqDraft(s0, it.__lang || s0.d.lang || lang, (ppl[0] && ppl[0].name.split(' ')[0]) || String(s0.d.contact || '').split(' ')[0], bname, it.name); }
    const LNAME = { en: 'English', tr: 'Türkçe', es: 'Español', pt: 'Português', fr: 'Français', ru: 'Русский', az: 'Azərbaycan', ar: 'العربية' };
    const lg = el('div', 'cm-chips cm-phlang'); langs.map((c) => [c, LNAME[c] || c]).forEach(([c, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(c === lang)); b.addEventListener('click', () => { it.__lang = c; it.__edited = !1; C.sheetDraw(); }); lg.append(b); });
    const dr = el('textarea', 'cm-phdraft'); dr.value = it.__draft; dr.setAttribute('aria-label', 'Message draft'); const grow = () => { dr.style.height = 'auto'; dr.style.height = `${dr.scrollHeight + 2}px`; }; dr.addEventListener('input', () => { it.__draft = dr.value; it.__edited = !0; grow(); }); setTimeout(grow, 0); // grows with the text: no inner scroll bar
    const enc = (x) => encodeURIComponent(x); const subj = rc && rc.pending && rc.type === 'email' ? `Re: ${String(rc.preview || '').slice(0, 60)}` : ctx.es ? `${ctx.brand} – ${it.name}` : `${ctx.brand} – ${it.name}`;
    const phoneUI = window.matchMedia && window.matchMedia('(pointer: coarse)').matches; // phone: the Mail app opens directly
    const mailTo = (to, su, body) => `${C.gmailHref(to)}&su=${enc(su)}&body=${enc(body)}`; // Gmail; on the phone (website) it opens the Gmail app
    const live = (a, mk) => { a.addEventListener('click', () => { a.href = mk(); }); a.href = mk(); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
    const big = el('div', 'big');
    if (rc && rc.pending) { const to = rc.type === 'chat' && rc.chat_number ? `https://wa.me/${String(rc.chat_number).replace(/\D/g, '')}` : rc.by_email ? null : null;
      if (to) big.append(live((() => { const x = el('a', 'cm-btn hot', '↩ Reply'); x.append(el('span', 'lgx', ' on WhatsApp')); return x; })(), () => `${to}?text=${enc(it.__draft)}`));
      else if (rc.by_email) big.append(live((() => { const x = el('a', 'cm-btn hot', '↩ Reply'); x.append(el('span', 'lgx', ' by email')); return x; })(), () => mailTo(rc.by_email, subj, it.__draft))); }
    const wa = phones.find(C.waOk); if (wa) { const wb = el('a', 'cm-btn ghost cm-ico'); wb.innerHTML = C.ICON_WA; wb.title = `WhatsApp ${wa}`; wb.setAttribute('aria-label', 'WhatsApp'); big.append(live(wb, () => `${C.waHref(wa)}?text=${enc(it.__draft)}`)); }
    if (emails[0]) { const ico = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
      let eb; if (emails.length > 1) { eb = el('button', 'cm-btn ghost cm-mailbtn'); eb.type = 'button'; eb.innerHTML = `${ico}<span class="n">${emails.length}</span>`; eb.title = `Email — choose one of ${emails.length} addresses, or all`;
        eb.addEventListener('click', (ev) => { ev.preventDefault(); C.openMenu(eb, [{ icon: '✉', label: `All ${emails.length} emails`, sub: emails.join(', ').slice(0, 80), act: () => C.cmOpenUrl(mailTo(emails.join(','), subj, it.__draft)) }, ...emails.slice(0, 8).map((m) => ({ icon: '✉', label: m, act: () => C.cmOpenUrl(mailTo(m, subj, it.__draft)) }))]); }); }
      else { eb = live(el('a', 'cm-btn ghost cm-mailbtn'), () => mailTo(emails[0], subj, it.__draft)); eb.innerHTML = ico; eb.title = `Email ${emails[0]}`; }
      big.append(eb); }
    if (phones[0]) { const x = el('button', 'cm-btn ghost cm-mailbtn'); x.type = 'button'; x.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'; x.title = `${C.CAN_CALL ? 'Call' : 'Copy'} ${phones[0]}`; x.setAttribute('aria-label', x.title); x.addEventListener('click', () => C.cmCopyNum(phones[0])); big.append(x); }
    { const x = el('button', 'cm-btn ghost', '📎 Catalogue'); x.type = 'button'; x.addEventListener('click', () => C.sendCatalog(x, it.id, it.name)); big.append(x); }
    { const x = el('a', 'cm-btn ghost cm-ico'); x.href = C.nethuntUrl(it.id); x.target = '_blank'; x.rel = 'noopener noreferrer'; x.title = 'Open in NetHunt'; x.setAttribute('aria-label', 'Open in NetHunt'); const im = el('img'); im.src = window.cmBoot ? 'img/nethunt.png' : '/_blob/0c62dff4b8bf4e3202cc5dc168a1de5c'; im.alt = ''; im.width = 20; im.height = 20; x.append(im); big.append(x); }
    { const hd = el('div', 'meta'); hd.append(rc && rc.pending ? 'Reply draft, based on their last message:' : 'Message draft:', lg);
      // brand the message is for (starts with the brand where they are furthest along)
      const br = el('div', 'cm-chips cm-phlang'); ['next', 'dunitech', 'motion'].forEach((b) => { const x = el('button', 'cm-chip', C.OURS[b].label); x.type = 'button'; x.setAttribute('aria-pressed', String(b === bkey)); x.addEventListener('click', () => { it.__brand = b; if (String(it.__tpl || '').startsWith('my:')) it.__tpl = ''; it.__edited = !1; C.sheetDraw(); }); br.append(x); });
      const brow = el('span');
      // draft type: smart (default), ready templates, your own
      const sel = el('select', 'cm-phtpl'); sel.append(new Option('✨ Smart draft (auto)', ''));
      Object.entries(TPL).forEach(([k2, [l2]]) => sel.append(new Option(l2, k2))); mine.forEach((t2, n2) => sel.append(new Option(`★ ${t2.name}`, `my:${n2}`))); sel.append(new Option('＋ New template…', 'new'));
      sel.value = it.__tpl || '';
      sel.addEventListener('change', () => {
        if (sel.value === 'new') { it.__newTpl = !0; sel.value = it.__tpl || ''; C.sheetDraw(); return; }
        it.__tpl = sel.value; it.__edited = !1; C.sheetDraw();
      });
      hd.append(sel); box.append(brow, hd);
      if (it.__newTpl) { // your own template for this brand (kept with your settings)
        const f2 = el('div', 'cm-ph'); const n2 = el('input'); n2.placeholder = `Template name (for ${bname}), e.g. “After congress”`; n2.style.fontSize = '16px';
        const t2 = el('textarea', 'cm-phdraft cm-phnotes'); t2.value = it.__draft || ''; t2.placeholder = 'Text — you can use {name}, {company} and {brand}';
        const sv2 = el('button', 'cm-btn', 'Save template'); sv2.type = 'button'; const cx2 = el('button', 'cm-btn ghost', 'Cancel'); cx2.type = 'button';
        sv2.addEventListener('click', () => { if (!n2.value.trim() || !t2.value.trim()) return; C.phTemplates = { ...C.phTemplates, [bkey]: [...mine, { name: n2.value.trim(), text: t2.value.trim() }] }; it.__tpl = `my:${mine.length}`; it.__newTpl = !1; it.__edited = !1; C.say('✓ Template saved'); C.sheetDraw(); });
        cx2.addEventListener('click', () => { it.__newTpl = !1; C.sheetDraw(); });
        const r2 = el('div', 'big acts'); r2.append(sv2, cx2); f2.append(n2, t2, r2); box.append(f2);
      }
      if (window.__m3 && SEQ_ON) { const sb = seqBadge(it.id); if (sb) { const w = el('div', 'cm-seqline'); w.append(sb, el('span', 'mut', it.seq ? `today: ${SEQ_CH[it.seq.ch][1]} — the draft below is for this step` : '')); box.append(w); } else { const st = el('button', 'cm-mini cm-seqstart', '🔁 Start a follow-up sequence'); st.type = 'button'; st.addEventListener('click', (e) => openSequence(e.currentTarget, it.id, it.name)); box.append(st); } }
      box.append(dr, big);
      }
    // status: keep as is unless you pick another
    { const fld = C.STATUS_FIELD[bkey]; const cur = (bkey === key && it.status) || F.get(fld) || ''; const opts = C.rowsOf('company_fields').filter((r) => r.field === fld).map((r) => r.option);
      if (opts.length) { const sel = el('select', 'cm-phstat'); (opts.includes(cur) ? opts : [cur, ...opts]).forEach((o) => sel.append(new Option(o || '— no status —', o))); sel.value = cur; const stOf = () => { const v = sel.value; sel.dataset.st = !v ? 'none' : /lost|not interested|no fit|not a fit|rejected/i.test(v) ? 'lost' : String(stageGuess(v)); }; stOf(); sel.addEventListener('change', stOf);
        sel.addEventListener('change', async () => { try { await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: it.id, fieldKeys: 'label', fields: { [fld]: sel.value } }); it.status = sel.value; C.say(`✓ ${it.name}: ${C.OURS[key].label} → ${sel.value}`); dash.refresh('companies'); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); sel.value = cur; } });
        const sr = el('div', 'meta cm-phstatrow'); const am = el('button', 'cm-chip cm-addmiss', '🔎 Add missing'); am.type = 'button'; am.title = 'Find or paste a missing number, email, website or person'; let pan = null; am.addEventListener('click', () => { if (pan) { pan.remove(); pan = null; am.setAttribute('aria-pressed', 'false'); return; } pan = enrichPanel(it.id, it.name, F); sr.after(pan); am.setAttribute('aria-pressed', 'true'); });
        const cat0 = F.get('Category') || ''; const copts = C.rowsOf('company_fields').filter((r) => r.field === 'Category').map((r) => r.option); const cs = el('select', 'cm-phstat cm-phcat'); (copts.includes(cat0) ? copts : [cat0, ...copts]).forEach((o) => cs.append(new Option(o || '— no category —', o))); cs.value = cat0; cs.title = 'Category';
        cs.addEventListener('change', async () => { try { await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: it.id, fieldKeys: 'label', fields: { Category: cs.value } }); C.say(`✓ ${it.name}: category → ${cs.value}`); dash.refresh('companies'); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); cs.value = cat0; } });
        const nmRow = box.querySelector('.cm-phwho'); if (nmRow) { sel.classList.add('cm-phstat-nm'); sel.title = `${C.OURS[bkey].label} status — change it here`; nmRow.insertBefore(sel, nmRow.children[1] || null); sr.append(...(copts.length ? ['Category: ', cs] : []), am); } else sr.append(`${C.OURS[bkey].label} status: `, sel, ...(copts.length ? [' Category: ', cs] : []), am); box.append(sr); } }
    if (!box.querySelector('.cm-addmiss')) { const sr = el('div', 'meta cm-phstatrow'); const am = el('button', 'cm-chip cm-addmiss', '🔎 Add missing'); am.type = 'button'; let pan = null; am.addEventListener('click', () => { if (pan) { pan.remove(); pan = null; return; } pan = enrichPanel(it.id, it.name, F); sr.after(pan); }); sr.append(am); box.append(sr); }
    const msg = el('div', 'hint'); const oc = el('div', 'outc');
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
    const OUT = [['No answer', 2, null], ['Left message', 3, null], ['Spoke', 7, null], ['Meeting set', 0, 'Meeting'], ['Not interested', 0, bkey === 'dunitech' ? 'Lost' : bkey === 'motion' ? 'Other' : 'Not interested'], ['📝 Comment', 0, null]];
    OUT.forEach(([lbl]) => { const b = el('button', 'cm-chip', lbl); b.type = 'button'; b.setAttribute('aria-pressed', String(it.__out === lbl)); b.addEventListener('click', () => { it.__out = it.__out === lbl ? null : lbl; oc.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.textContent === it.__out))); nt.placeholder = it.__out === '📝 Comment' ? 'Why no outreach? (saved as a comment)' : PH; }); oc.append(b); });
    const PH = 'What happened? · Enter = done'; const nt = el('textarea', 'cm-phdraft cm-phnotes'); nt.rows = 2; nt.placeholder = it.__out === '📝 Comment' ? 'Why no outreach? — saved as a comment' : 'What happened? · Enter = done'; nt.value = it.__notes || ''; nt.addEventListener('input', () => { it.__notes = nt.value; });
    const editL = el('button', 'cm-mini cm-myentb', '🧾 Edit what I logged'); editL.type = 'button'; editL.title = 'Change an outcome you saved (e.g. No answer → Spoke) or add to a note'; editL.addEventListener('click', (e) => openMyEntries(e.currentTarget, it.id, it.name));
    const doneB = el('button', 'cm-btn', 'Done →'); doneB.type = 'button'; doneB.title = 'Saves the outcome and your notes to NetHunt, then opens the next company (or press Enter)';
    const undoOn = phUndo && phUndo.next === it.id && Date.now() - phUndo.at < 5e3; const skip = el('button', 'cm-btn ghost', undoOn ? '↶ Undo' : 'Skip'); skip.type = 'button'; if (undoOn) skip.title = `Back to ${phUndo.name}`;
    skip.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (undoOn) { phWorked.delete(phUndo.id); i = phUndo.idx; phUndo = null; focus(); C.sheetDraw(); return; } phUndo = { id: it.id, name: it.name, idx: i, next: (queue[i + 1] || {}).id, at: Date.now() }; phWorked.add(it.id); i += 1; focus(); C.sheetDraw(); const sb = document.querySelector('#cm-sheet .sb'); sb && (sb.scrollTop = 0); setTimeout(() => { if (phUndo && Date.now() - phUndo.at >= 5e3) { phUndo = null; C.sheetDraw(); } }, 5100); });
    doneB.addEventListener('click', async () => {
      const txt = nt.value.trim(); const o2 = OUT.find((x) => x[0] === it.__out);
      if (!o2 && !txt) { phWorked.add(it.id); i += 1; focus(); C.sheetDraw(); return; }
      doneB.disabled = !0; msg.textContent = 'Saving…';
      try {
        const f = {};
        if (o2 && o2[0] === '📝 Comment') await C.nhCall('create_record_comment', { folderId: C.NH_FOLDER, recordId: it.id, text: `Note — no outreach (${new Date().toLocaleDateString('en-GB')}): ${txt || 'no details'}` });
        else if (o2) { await C.nhCall('create_record_call_log', { folderId: C.NH_FOLDER, recordId: it.id, text: `${o2[0]}${txt ? ` — ${txt}` : ''} (Power hour)` }); if (txt) miLog({ action: 'Comment', company_id: it.id, outcome: `note with the call (${o2[0]})`, text: txt }); if (o2[1]) f['Next follow-up'] = day(o2[1]); if (o2[2]) f[C.STATUS_FIELD[bkey]] = o2[2]; }
        else if (txt) await C.nhCall('create_record_comment', { folderId: C.NH_FOLDER, recordId: it.id, text: `Notes (${new Date().toLocaleDateString('en-GB')}): ${txt}` });
        if (txt) {
          const pv = C.parseVisitNotes(txt, C.rowsOf('brand_profiles').map((b) => b.brand).filter(Boolean));
          if (pv.next) f['Next step'] = pv.next; if (pv.due) f['Next follow-up'] = pv.due.getTime();
          if (pv.brands.length) f.Brand = [...new Set([...lines(F.get('Brand')), ...pv.brands])];
          for (const [n2, p] of pv.people.entries()) { const w = p.name.split(/\s+/); await C.nhCall('create_record', { folderId: '6682e9b8b6386800f586c0b0', fieldKeys: 'label', fields: Object.fromEntries(Object.entries({ Name: p.name, 'First name': w[0], 'Last name': w.slice(1).join(' ') || undefined, Title: p.title || undefined, Company: [it.id], Email: n2 === 0 && pv.emails[0] ? [pv.emails[0]] : undefined, 'Phone number': n2 === 0 && pv.phones[0] ? [pv.phones[0]] : undefined }).filter(([, v]) => v != null)) }); }
        }
        if (Object.keys(f).length) await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: it.id, fieldKeys: 'label', fields: f });
        done.push(it.id); phWorked.add(it.id); dS.at = 0; C.say(`✓ ${it.name} saved`); dash.refresh('companies'); i += 1; focus(); C.sheetDraw();
      } catch (e) { msg.textContent = `Not saved — ${C.nhErr(e)}`; doneB.disabled = !1; }
    });
    nt.addEventListener('keydown', (ev) => { if ('Enter' === ev.key && !ev.shiftKey) { ev.preventDefault(); doneB.click(); } });
    box.addEventListener('keydown', (ev) => { if ('Enter' === ev.key && !ev.shiftKey && !/TEXTAREA|SELECT|INPUT|A|BUTTON/.test(ev.target.tagName)) { ev.preventDefault(); doneB.click(); } });
    const act = el('div', 'big acts'); const ig = ignoreBtn(it.id, it.name, () => { phWorked.add(it.id); queue = queue.filter((x) => x.id !== it.id); focus(); C.sheetDraw(); }); act.append(doneB, skip, ig);
    box.append(el('div', 'meta', 'How did it go?'), oc, nt, act, msg);
    // right side: people at the top, brands at the bottom
    const ph = el('div', 'cm-phppl'); { const k0 = el('div', 'k'); k0.append(`👥 People${ppl.length ? ` · ${ppl.length}` : ''} `); if (window.__m3) { const ad = el('button', 'cm-mini cm-padd', '＋ Add person'); ad.type = 'button'; ad.title = 'Add someone you found — name, title, phones, emails, LinkedIn, Facebook, Instagram'; ad.addEventListener('click', (e) => editPerson(e.currentTarget, null, it.id)); k0.append(ad); } ph.append(k0); }
    if ('loading' === pc.status || dash.params().cid !== it.id) ph.append(el('div', 'hint', 'Loading…'));
    else if (!ppl.length) ph.append(el('div', 'hint', 'No people linked in NetHunt yet.'));
    else ppl.slice(0, 6).forEach((p) => ph.append(C.contactLine(p.name, [p.title, C.cmRank(p.title) <= 1 ? 'decision maker' : ''].filter(Boolean).join(' · '), { linkedin: p.linkedin, phones: C.splitBar(p.phone), emails: String(p.email || '').split(/, | \| /).filter(Boolean) })));
    ph.querySelectorAll('a[href^="https://wa.me/"]').forEach((x) => { const base = x.href.split('?')[0]; x.addEventListener('click', () => { x.href = `${base}?text=${encodeURIComponent(it.__draft || '')}`; }); });
    ph.querySelectorAll('a[href*="mail.google.com"]').forEach((x) => { const base = x.href.split('&su=')[0]; x.addEventListener('click', () => { x.href = `${base}&su=${encodeURIComponent(it.name)}&body=${encodeURIComponent(it.__draft || '')}`; }); });
    side.append(ph);
    // brands they carry: on the right of Done / Skip (uses the empty space there)
    { const br = lines(F.get('Brand')); const bw = el('div', 'cm-phbrands'); bw.title = 'Brands they carry';
      if (br.length) { bw.append(el('span', 'k2', '🏷')); br.slice(0, 12).forEach((b) => bw.append(el('span', 'b', b))); if (br.length > 12) bw.append(el('span', 'mut', `+${br.length - 12}`)); }
      else bw.append(el('span', 'mut', 'loading' === rec.status ? '🏷 …' : '🏷 No brands recorded'));
      act.append(bw); }
    { const tw = C.rowsOf('tender_awards').filter((x) => x.nethunt_id === it.id); const iv = C.rowsOf('import_values').find((x) => x.id === it.id);
      if (tw.length || (iv && iv.import_value_usd)) { const fx = el('div', 'cm-phfacts');
        if (tw.length) { const tot = tw.reduce((a2, x) => a2 + (x.value_usd || 0), 0); const top = tw.slice().sort((x, y) => (y.value_usd || 0) - (x.value_usd || 0))[0];
          const r1 = el('div'); r1.append(el('b', null, `🏛 Tenders won ${C.money(tot)}`), el('span', 'mut', ` · ${tw.reduce((a2, x) => a2 + (x.awards || 0), 0)} awards${top.niche ? ` · ${top.niche}` : ''}${top.years ? ` · ${String(top.years).split(', ').slice(-1)[0]}` : ''}`)); fx.append(r1);
          if (top.top_buyers) fx.append(el('div', 'mut', String(top.top_buyers).split(';')[0].trim().slice(0, 70))); }
        if (iv && iv.import_value_usd) { const r2 = el('div'); r2.append(el('b', null, `📦 Imports ${C.money(iv.import_value_usd)}`), el('span', 'mut', ` · ${iv.import_entries || 1} entr${(iv.import_entries || 1) === 1 ? 'y' : 'ies'}${iv.last_logged ? ` · last ${String(iv.last_logged).slice(0, 7)}` : ''}`)); fx.append(r2); }
        side.append(fx); } }
    { const tl = dash.data('company_timeline'); const ra = el('div', 'cm-phact'); ra.append(el('div', 'k', '🕑 Recent activity'));
      const cc = companyChats(it.id); const pch = (cc || []).map((r) => ({ type: 'chat', time: r.time, by: '', provider: r.provider, title: r.person, detail: r.last, chat_status: r.status, __chat: { folder: CT_ID, rid: r.rid, id: r.id, who: r.person.split(' ')[0], n: r.count, name: r.name, status: r.status, provider: r.provider } }));
      const evs0 = 'ok' === tl.status && dash.params().cid === it.id ? [...tl.data.filter((x) => 'campaign_email' !== x.type || (x.replies || 0) > 0), ...pch.filter((p) => !tl.data.some((x) => x.type === 'chat' && Math.abs(new Date(x.time) - new Date(p.time)) < 6e4))].sort((x, y) => String(y.time).localeCompare(String(x.time))).slice(0, 40) : []; const evs2 = window.__cm3 && window.__cm3.actPost ? window.__cm3.actPost(evs0, actState).slice(0, 25) : evs0.slice(0, 25);
      const evs = evs2; if (!evs.length) ra.append(el('div', 'hint', 'loading' === tl.status ? 'Loading…' : 'Nothing logged yet.'));
      else { const u = el('ul', 'cm-sumev'); evs.forEach((x) => { const li = el('li', `t-${x.type}${x.type === 'chat' && (x.chat_status === 'NOT_REPLIED' || (x.__chat && x.__wait)) ? ' wait' : ''}`); const ic = el('span', 'i'); if (x.type === 'chat') ic.innerHTML = chatLogo(x); else ic.textContent = { call: '☎', email: '✉', calendar: '📅', comment: '📝', campaign_email: '📣' }[x.type] || '•'; if (x.type === 'chat') x = { ...x, title: chatWho(x.title) || 'WhatsApp group' }; const d = C.agoDays(x.time);
          const b = el('span', 'b'); { const hd = el('div', 'h'); const when = `${null == d ? '' : d < 0 ? (-1 === d ? 'tomorrow' : `in ${-d} days`) : 0 === d ? 'today' : 1 === d ? 'yesterday' : `${d} days ago`}`; hd.append(el('b', null, x.title || ({ call: 'Call', email: 'Email', calendar: 'Meeting', comment: 'Comment', campaign_email: 'Campaign', chat: 'WhatsApp' }[x.type] || x.type)), el('span', 'when', `${when}${x.by && x.type !== 'chat' ? ` · ${String(x.by).split(' ')[0]}` : ''}`)); b.append(hd); if (x.detail) b.append(el('div', 'd', String(x.detail).slice(0, 260))); } const ch0 = x.__chat || (x.type === 'chat' && x.id ? { folder: C.NH_FOLDER, rid: x.rid || it.id, id: x.id, who: '', n: x.chat_msgs, name: x.chat_name, status: x.chat_status } : null); if (ch0) b.append(chatActs({ folder: ch0.folder, rid: ch0.rid, id: ch0.id, person: ch0.who, chat_msgs: ch0.n, chat_name: ch0.name || '', chat_status: ch0.status || '', provider: ch0.provider || '', title: x.title })); else if (window.__m3) { const eb = actEdit(x, li); eb && b.append(eb); } if (x.type === 'email' && window.__cm3 && window.__cm3.mailActs) b.append(window.__cm3.mailActs(x)); li.append(ic, b); u.append(li); }); ra.append(u); }
      side.append(ra); }
    wrap.append(box, side); body.append(wrap);
  }, { wide: !0, center: !0 });
}
// redraw the open Power hour only when this company's data actually changed (steady screen, same scroll position)
let phSig = '';
dash.onData(() => {
  const sh = document.getElementById('cm-sheet'); if (!sh || sh.hidden || !sh.classList.contains('center') || !/Power hour|⚡/.test((document.getElementById('cm-sheet-title') || {}).textContent || '')) return;
  const ae = document.activeElement; if (ae && sh.contains(ae) && /TEXTAREA|SELECT|INPUT/.test(ae.tagName)) return;
  const sig = [dash.params().cid, ...['company_record', 'company_contacts', 'company_timeline', 'contact_history', 'company_fields', 'meetings'].map((n) => { const d = dash.data(n); return `${d.status}:${d.data ? d.data.length : 0}`; })].join('|');
  if (sig === phSig) return; phSig = sig;
  const sb = sh.querySelector('.sb'); const y = sb ? sb.scrollTop : 0;
  try { __cm.sheetDraw(); } catch { /* sheet changed */ }
  sb && (sb.scrollTop = y);
});

function openCommentContacts(anchor) {
  const C = __cm; const el = C.el; let state = 'loading';
  dash.setParams({ cscan_from: new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10) + 'T00:00:00Z' });
  C.openSheet(anchor, 'Contacts written in comments', (body) => {
    const d = dash.data('comment_scan');
    if ('ok' !== d.status) { body.append(el('div', 'hint', 'error' === d.status ? 'Couldn’t read comments from NetHunt.' : 'Reading the last 60 days of comments…')); return; }
    const scope = 'country' === C.curView() ? new Set(C.rowsOf('companies').map((c) => c.id)) : null;
    const name = (id) => (C.companyById(id) || {}).company || (C.rowsOf('pipeline_stages').find((r) => r.id === id) || {}).company || 'Company';
    const found = [];
    d.data.filter((c) => !scope || scope.has(c.record_id)).forEach((c) => {
      const t = String(c.text || ''); const emails = [...new Set(t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])].filter((e) => !C.OUR_DOMAINS.test(e));
      const phones = [...new Set((t.match(/\+\d[\d\s().-]{7,}\d|\b0\d[\d\s-]{7,}\d\b/g) || []).map((x) => x.trim()))];
      if (!emails.length && !phones.length) return;
      const nm = (t.match(/(?:contact(?:o)?|name|nombre|sr\.?|sra\.?|ing\.?|dr\.?|met|con|habl[eé] con|spoke (?:to|with))\s*:?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/) || [])[1] || '';
      found.push({ id: c.record_id, company: name(c.record_id), time: c.time, by: c.by, name: nm, email: emails[0] || '', phone: phones[0] || '', text: t.slice(0, 160) });
    });
    if (!found.length) { body.append(el('div', 'hint', 'No phone numbers or emails found in comments from the last 60 days.')); return; }
    body.append(el('p', 'mut', `${found.length} comment${found.length === 1 ? '' : 's'} with contact details. Check each one, fix the name if needed, and create the person in NetHunt (linked to the company). Existing contacts with the same email or number are not duplicated.`));
    found.slice(0, 40).forEach((f) => {
      const r = el('div', 'cm-ccrow'); r.append(el('div', 'k', `${f.company} · ${String(f.time || '').slice(0, 10)}${f.by ? ` · ${f.by}` : ''}`), el('div', 'mut', `“${f.text}”`));
      const ni = el('input'); ni.value = f.name; ni.placeholder = 'Name'; const ei = el('input'); ei.value = f.email; ei.placeholder = 'Email'; const pi = el('input'); pi.value = f.phone; pi.placeholder = 'Phone';
      const b = el('button', 'cm-btn', 'Create contact'); b.type = 'button'; const m = el('span', 'hint');
      b.addEventListener('click', async () => {
        if (!ni.value.trim()) { m.textContent = 'Add a name first.'; return; }
        b.disabled = !0; m.textContent = 'Checking…';
        try {
          for (const q of [ei.value.trim(), pi.value.trim()].filter(Boolean)) { const res = await C.nhCall('search_records', { folderId: '6682e9b8b6386800f586c0b0', text: q, limit: 3 }); const hit = Array.isArray(res) ? res.length : ((res && (res.records || res.results)) || []).length; if (hit) { m.textContent = `Already in NetHunt (matches ${q}).`; b.disabled = !1; return; } }
          const w = ni.value.trim().split(/\s+/);
          await C.nhCall('create_record', { folderId: '6682e9b8b6386800f586c0b0', fieldKeys: 'label', fields: Object.fromEntries(Object.entries({ Name: ni.value.trim(), 'First name': w[0], 'Last name': w.slice(1).join(' ') || undefined, Company: [f.id], Email: ei.value.trim() ? [ei.value.trim()] : undefined, 'Phone number': pi.value.trim() ? [pi.value.trim()] : undefined }).filter(([, v]) => v != null)) });
          m.textContent = '✓ Created and linked'; b.textContent = 'Created';
        } catch (e) { m.textContent = `Not saved — ${C.nhErr(e)}`; b.disabled = !1; }
      });
      const row = el('div', 'cm-ccin'); row.append(ni, ei, pi, b); r.append(row, m); body.append(r);
    });
  }, { wide: !0, center: !0 });
}
// ---- related companies (same owners / team): saved both ways in NetHunt “Related companies”; likely ones suggested ----
async function linkBoth(a, b, add = !0) {
  const C = __cm; const get = async (id) => { const r = await C.nhCall('get_record', { folderId: C.NH_FOLDER, recordId: id, fieldKeys: 'label' }); return [].concat((r && r.fields && r.fields['Related companies']) || []); };
  for (const [x, y] of [[a, b], [b, a]]) { const cur = await get(x); await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: x, fieldKeys: 'label', fields: { 'Related companies': add ? [...new Set([...cur, y])] : cur.filter((z) => z !== y) } }); }
}
function relatedPairs(companies, people) {
  const C = __cm; const free = /gmail|hotmail|yahoo|outlook|live\.|icloud|googlemail|aol\.|proton/;
  const dom = (x) => { const m = String(x || '').toLowerCase().match(/@([\w.-]+)|^(?:https?:\/\/)?(?:www\.)?([\w-]+\.[\w.-]+)/); const d = m && (m[1] || m[2]); return d && !free.test(d) ? d.replace(/\/.*$/, '') : null; };
  const ph8 = (p) => { const d = C.digits(p); return d.length >= 8 ? d.slice(-8) : null; };
  const keys = new Map(); const put = (k, id, why) => { if (!k) return; const m = keys.get(k) || new Map(); m.set(id, why); keys.set(k, m); };
  companies.forEach((c) => { C.splitBar(c.phones).forEach((p) => put(`p:${ph8(p)}`, c.id, `same phone ${p}`)); [c.website, ...C.splitBar(c.emails)].forEach((x) => { const d = dom(x); d && put(`d:${d}`, c.id, `same domain ${d}`); }); });
  people.forEach((p) => { const cs = String(p.company_ids || '').split('|').filter(Boolean);
    cs.forEach((id) => { put(`person:${p.id}`, id, `${p.name} is linked to both`); C.splitBar(p.phone).forEach((x) => put(`p:${ph8(x)}`, id, `${p.name}’s phone ${x}`)); String(p.email || '').split(/ \| |, /).forEach((e) => { const em = e.trim().toLowerCase(); em && put(`e:${em}`, id, `${p.name}’s email ${em}`); }); }); });
  const pairs = new Map();
  keys.forEach((m) => { const ids = [...m.keys()]; if (ids.length < 2 || ids.length > 6) return; // shared by many = switchboard / agency, not a relation
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const k = [ids[i], ids[j]].sort().join('~'); const r = pairs.get(k) || new Set(); r.add(m.get(ids[i])); pairs.set(k, r); } });
  return pairs;
}
function openRelatedCheck(anchor) {
  const C = __cm; const el = C.el; const cos = C.rowsOf('companies');
  dash.setParams({ rel_ids: cos.map((c) => c.id) });
  C.openSheet(anchor, '🔗 Related companies check', (body) => {
    const pc = dash.data('rel_contacts');
    if ('loading' === pc.status) { body.append(el('div', 'hint', 'Reading the people of this country’s companies…')); return; }
    const linked = new Set(); cos.forEach((c) => String(c.related_ids || '').split('|').filter(Boolean).forEach((o) => linked.add([c.id, o].sort().join('~'))));
    const pairs = [...relatedPairs(cos, 'ok' === pc.status ? pc.data : [])].filter(([k]) => !linked.has(k));
    const nm = (id) => (cos.find((c) => c.id === id) || {}).company || 'Company';
    if (!pairs.length) { body.append(el('div', 'hint', 'No new likely relations found — everything that shares a phone, a company domain or a person is already linked.')); return; }
    body.append(el('p', 'mut', `${pairs.length} pair${pairs.length === 1 ? '' : 's'} share a phone number, a company website/email domain (Gmail, Hotmail… ignored), a person, or a person’s phone/email. Link the ones that really belong together — the link is saved on both companies.`));
    pairs.slice(0, 60).forEach(([k, why]) => { const [x, y] = k.split('~'); const r = el('div', 'cm-relpair');
      const bx = el('button', 'cm-co', nm(x)); bx.type = 'button'; bx.dataset.openCompany = x; const by = el('button', 'cm-co', nm(y)); by.type = 'button'; by.dataset.openCompany = y;
      const b = el('button', 'cm-btn', 'Link'); b.type = 'button'; b.addEventListener('click', async () => { b.disabled = !0; b.textContent = 'Saving…'; try { await linkBoth(x, y); b.textContent = '✓ Linked'; dash.refresh('companies'); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); b.disabled = !1; b.textContent = 'Link'; } });
      r.append(bx, el('span', 'mut', '↔'), by, b, el('div', 'why', [...why].slice(0, 3).join(' · '))); body.append(r); });
  }, { wide: !0, center: !0 });
}
function relatedLine(cid, F) {
  const C = __cm; const el = C.el;
  const ids = String(F.get('Related companies') || '').split(/\n|,| \| /).map((x) => x.trim()).filter((x) => /^[0-9a-f]{24}$/.test(x));
  const name = (id) => { const c = C.companyById(id) || C.rowsOf('pipeline_stages').find((r) => r.id === id) || {}; return { n: c.company || 'Company', iso: c.iso || '' }; };
  const box = el('div', 'cm-related'); box.append(el('span', 'mut', '🔗 Related:'));
  const save = async (other, add) => { await linkBoth(cid, other, add); C.say(add ? `✓ Linked with ${name(other).n} (both ways)` : `✓ Unlinked ${name(other).n}`); dash.refresh('company_record'); dash.refresh('companies'); };
  ids.forEach((id) => { const nm = name(id); const b = el('button', 'cm-co cm-relco', `${C.flag(nm.iso) || ''} ${nm.n}`.trim()); b.type = 'button'; b.dataset.openCompany = id; b.title = 'Open the related company';
    const x = el('button', 'cm-nowa', '✕'); x.type = 'button'; x.title = 'Not related — remove the link'; x.addEventListener('click', async (ev) => { ev.stopPropagation(); try { await save(id, !1); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); } });
    const w = el('span', 'cm-relw'); w.append(b, x); box.append(w); });
  // likely related: same phone, company domain, a person linked to both, or a person's phone / email
  const pc = dash.data('company_contacts'); const sugg = new Map();
  [...relatedPairs(C.rowsOf('companies'), 'ok' === pc.status ? pc.data.map((p) => ({ ...p, email: p.email })) : [])].forEach(([k, why]) => { const [x, y] = k.split('~'); const o = x === cid ? y : y === cid ? x : null; if (o && !ids.includes(o)) sugg.set(o, [...why][0]); });
  [...sugg].slice(0, 4).forEach(([id, why]) => { const b = el('button', 'cm-relsug', `＋ ${name(id).n}?`); b.type = 'button'; b.title = `Possibly related (${why}) — tap to link both ways`; b.addEventListener('click', async () => { b.disabled = !0; try { await save(id, !0); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); b.disabled = !1; } }); box.append(b); });
  // link any company by name
  const add = el('button', 'cm-mini', ids.length || sugg.size ? '＋ link' : '＋ link a related company'); add.type = 'button';
  add.addEventListener('click', () => {
    const pool = [...C.rowsOf('companies'), ...C.rowsOf('pipeline_stages')].filter((c, i, all) => c.id !== cid && !ids.includes(c.id) && all.findIndex((y) => y.id === c.id) === i);
    C.openSheet(add, 'Link a related company', (body) => {
      const inp = el('input'); inp.placeholder = 'Type a company name…'; inp.style.width = '100%'; inp.style.fontSize = '16px'; const list = el('div', 'cm-chips');
      const draw = () => { list.replaceChildren(); const q = C.norm(inp.value); if (q.length < 2) return; pool.filter((c) => C.norm(c.company || '').includes(q)).slice(0, 12).forEach((c) => { const b = el('button', 'cm-chip', `${C.flag(c.iso) || ''} ${c.company}`.trim()); b.type = 'button'; b.addEventListener('click', async () => { b.disabled = !0; try { await save(c.id, !0); C.closeSheet(); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); b.disabled = !1; } }); list.append(b); }); };
      inp.addEventListener('input', draw); body.append(el('p', 'mut', 'Same owners, decision makers or team. The link is saved on both companies in NetHunt.'), inp, list); setTimeout(() => inp.focus(), 0);
    }, { static: !0 });
  });
  box.append(add);
  const wrap = __cm.el('div'); { const sc = scoreChip(cid); sc && wrap.append(sc); } wrap.append(box);
  { const nmEl = document.querySelector('#company .cm-cname'); if (nmEl) { document.querySelectorAll('#company .cm-cph').forEach((x) => x.remove()); const pb = __cm.el('button', 'cm-chip cm-cph', '⚡ Power hour'); pb.type = 'button'; pb.title = 'Open the outreach pop-up for this company (draft, WhatsApp, email, outcome), then continue with the next ones'; pb.addEventListener('click', () => openPowerHour(pb, cid)); nmEl.after(pb); } const ig = ignoreBtn(cid, F.get('Name') || ''); ig.className = 'cm-chip'; const row = __cm.el('div', 'cm-cacts'); row.append(ig); const myE = (() => { const b = __cm.el('button', 'cm-chip', '🧾 My entries'); b.type = 'button'; b.title = 'Change an outcome you saved or add to a note (last 14 days)'; b.addEventListener('click', (e) => openMyEntries(e.currentTarget, cid, F.get('Name') || '')); return b; })();   const sq = !window.__m3 || !SEQ_ON ? null : seqBadge(cid) || (() => { const b = __cm.el('button', 'cm-chip', '🔁 Sequence'); b.type = 'button'; b.title = 'Start a follow-up sequence: WhatsApp → email → call → last try, stops when they reply'; b.addEventListener('click', (e) => openSequence(e.currentTarget, cid, F.get('Name') || '')); return b; })(); sq && row.append(sq); wrap.append(row); }
  { const eb = __cm.el('button', 'cm-chip cm-addmiss', '🔎 Add missing details'); eb.title = 'Find or paste a number, email, website or person for this company — it counts in your Details found today'; eb.type = 'button'; let open = null; eb.addEventListener('click', () => { if (open) { open.remove(); open = null; return; } open = enrichPanel(cid, F.get('Name') || '', F); (wrap.querySelector('.cm-cacts') || wrap).after(open); }); (wrap.querySelector('.cm-cacts') || wrap).append(eb); } { dash.data('medint_assign'); const a = assigneeOf(cid); if (a) { const bn = __cm.el('div', 'cm-asgbar', `👥 Assigned to ${a}${a === me().name ? ' (you)' : ''}`); wrap.append(bn); } } wrap.append(identityLine(cid));
  return wrap;
}
// ---- Recent activity: show only some event types, newest or oldest first ----
const ACT_TYPES = [['email', '✉ Emails'], ['campaign_email', '📣 Email campaigns'], ['calendar', '📅 Meetings'], ['comment', '📝 Comments'], ['call', '☎ Calls'], ['chat', '💬 WhatsApp chats']];
const actState = { hide: new Set(), oldest: !1, allCamp: !1, sys: !1 };
function actView(rows, box) {
  const btn = document.querySelector('#company-activity .cm-actfilter');
  if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', () => actMenu(btn)); }
  if (btn) { const on = ACT_TYPES.filter(([k]) => !actState.hide.has(k)); btn.textContent = `☰ Show: ${on.length === ACT_TYPES.length ? 'all' : on.length ? on.map(([, l]) => l.split(' ')[0]).join(' ') : 'none'}${actState.oldest ? ' · oldest first' : ''}`; }
  if (window.__m3 && __cm.curView() === 'company') { const cid = dash.params().cid; const cc = companyChats(cid) || []; const have = new Set(rows.map((r) => r.id)); rows = [...rows, ...cc.filter((r) => !have.has(r.id)).map((r) => ({ id: r.id, rid: r.rid, folder: CT_ID, time: r.time, type: 'chat', by: '', title: r.person, detail: r.last, chat_msgs: r.count, chat_status: r.status, chat_name: r.name, provider: r.provider, person: r.person }))]; }
  rows = rows.map((r) => (r.type === 'chat' && /^(WhatsApp|LinkedIn)\s*·/i.test(r.title || '') ? { ...r, title: chatWho(r.title) || 'WhatsApp group' } : r));
  const out = rows.filter((r) => !actState.hide.has(r.type) && (r.type !== 'campaign_email' || actState.allCamp || (r.replies || 0) > 0)).slice().sort((x, y) => (actState.oldest ? 1 : -1) * String(x.time || '').localeCompare(String(y.time || '')));
  const out2 = window.__cm3 && window.__cm3.actPost ? window.__cm3.actPost(out, actState) : out;
  if (rows.length && !out2.length && box) box.append(__cm.el('div', 'hint', 'Nothing of the chosen types — change ☰ Show.'));
  return out2;
}
function actMenu(btn) {
  const C = __cm; const el = C.el;
  const redraw = () => { dash.setParams({ actv: (dash.params().actv || 0) + 1 }); C.sheetDraw && C.sheetDraw(); };
  C.openSheet(btn, 'Show in recent activity', (body) => {
    const list = el('div', 'cm-actlist');
    const row = (checked, label, onToggle, onOnly) => { const r = el('div', 'cm-actrow'); const lb = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = checked; cb.addEventListener('change', onToggle); lb.append(cb, ` ${label}`); r.append(lb);
      if (onOnly) { const o = el('button', 'cm-mini', 'only'); o.type = 'button'; o.title = `Show only ${label}`; o.addEventListener('click', onOnly); r.append(o); } list.append(r); };
    const all = actState.hide.size === 0;
    row(all, 'All events', () => { actState.hide = all ? new Set(ACT_TYPES.map(([k]) => k)) : new Set(); redraw(); });
    ACT_TYPES.forEach(([k, l]) => row(!actState.hide.has(k), l, () => { actState.hide.has(k) ? actState.hide.delete(k) : actState.hide.add(k); redraw(); }, () => { actState.hide = new Set(ACT_TYPES.map(([x]) => x).filter((x) => x !== k)); redraw(); }));
    row(actState.allCamp, 'Campaigns: all, not only replied', () => { actState.allCamp = !actState.allCamp; redraw(); });
    row(actState.sys, 'System notes (enrichment, merges, updates)', () => { actState.sys = !actState.sys; redraw(); });
    const ord = el('button', 'cm-mini', actState.oldest ? '⇅ Newest first' : '⇅ Oldest first'); ord.type = 'button'; ord.addEventListener('click', () => { actState.oldest = !actState.oldest; redraw(); });
    body.append(list, ord);
  }, { static: !0 });
}

// ===================== Medint log, people & sending identity (Release 1) =====================
const MI = { PEOPLE: '6ad610066a38c15893c9d431', LOG: '6ad6100defa2051dc4ad1ab7', ASSIGN: '6ad6101118904c2628e16827', CF: 'https://dash.cloudflare.com/ab7239021280422c3c5d832079c8972b/one/access-controls/policies/334b571e-fb14-4cc8-8507-37ac8bac2847/edit' };
const MI_FOLDERS = new Set([MI.PEOPLE, MI.LOG, MI.ASSIGN]);
const HOUSE_DEFAULT = ['hi@kavikaplan.com']; // Team (team@) is a Person since 21 Oct 2026
function miPeople() { return __cm.rowsOf('medint_people'); }
// website: the server says who is logged in and their role; inside Claude it's always House (Kavi)
let miWho = window.cmBoot ? null : { email: 'hi@kavikaplan.com', role: 'House', name: 'Kavi' };
// the log is always read from a fixed start (local midnight 15 days ago) — set before anything asks for it, so Home never pulls the whole log
const LOG_FROM = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 22); return +d; })(); // 3 weeks: today, this week, last week and the week before
let logNeedMin = LOG_FROM; // the oldest day anything has asked for in this session; the log is read from exactly there
const needLog = (from) => { logNeedMin = Math.min(logNeedMin, Number(from) || LOG_FROM); const cur = Number(dash.params().log_from); if (cur !== logNeedMin) dash.setParams({ log_from: String(logNeedMin) }); };
try { needLog(LOG_FROM); } catch { /* set again just below */ }
let logWait = 0; setInterval(() => { try { if (window.cmBoot && tStats.d1 !== !1 && dS.d1 !== !1) return; const d = dash.data('medint_log'); if (d.status === 'loading') { logWait += 1; if (logWait === 6) { dash.refresh('medint_log'); } } else { if (logWait) { logWait = 0; hmKey = ''; dS.at = 0; drawHome(); } } } catch { /* not ready */ } }, 2000); // a stuck load is retried after ~12 s
setTimeout(() => { try { needLog(LOG_FROM); dash.data('medint_people'); dash.data('medint_assign'); dash.data('medint_ignore'); if (!window.cmBoot) dash.data('medint_log'); } catch { /* datasets not ready yet */ } }, 0);
let homeFirst = !1; const goHomeFirst = () => { if (homeFirst) return; homeFirst = !0; if (!/^#v~/.test(location.hash || '') && dash.params().view !== 'home') dash.setParams({ view: 'home' }); };
let userMoved = !1; document.addEventListener('pointerdown', () => { userMoved = !0; }, { once: !0, capture: !0 }); document.addEventListener('keydown', () => { userMoved = !0; }, { once: !0, capture: !0 });
setTimeout(goHomeFirst, 300); setTimeout(() => { if (userMoved) return; homeFirst = !1; goHomeFirst(); }, 2500); // after saved settings are restored — but never pull someone back who already started clicking
if (window.cmBoot) fetch('/api/me', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { const em = String(j.email || '').toLowerCase(); miWho = { email: em, role: j.role === 'House' || (!j.role && HOUSE_DEFAULT.includes(em)) ? 'House' : j.role === 'Unknown' ? 'Unknown' : 'Person', name: j.name, active: j.active !== false, lookup: j.lookup }; dash.setParams({ who: miWho.role }); }).catch(() => { miWho = { email: '', role: 'Person' }; });
function me() {
  const w = miWho || { email: '', role: 'Person' }; const email = w.email || '';
  const p = miPeople().find((x) => x.email === email);
  return { name: (p && p.name) || w.name || ({ 'hi@kavikaplan.com': 'Kavi', 'team@kavikaplan.com': 'Team' })[email] || email.split('@')[0] || 'Kavi', email, role: w.role === 'House' ? 'House' : 'Person', mailbox: (p && p.mailbox) || email, whatsapp: (p && p.whatsapp) || '' };
}
function isHouse() { return me().role === 'House'; }
const miSource = () => (window.cmBoot ? 'Website' : 'Claude');
// the company's sending identity (kept the same once used), else the person's default
function identityFor(id) {
  const p = me(); // always the person using Medint: their own mailbox and WhatsApp
  return { mailbox: p.mailbox || p.email, whatsapp: (p.whatsapp || '').trim(), stored: !0, who: p.name };
}
function keepIdentity(id) { // first contact from Medint fixes the company's identity
  const c = __cm.rowsOf('companies').find((x) => x.id === id); if (!c || c.sending_identity) return;
  const p = me(); const v = [p.mailbox || p.email, p.whatsapp].filter(Boolean).join(' · ');
  c.sending_identity = v; __cm.nhCall('update_record', { folderId: __cm.NH_FOLDER, recordId: id, fieldKeys: 'label', fields: { 'Sending identity': v } }).catch(() => {});
}
// one log line: NetHunt “Medint Log” (+ the website's own copy)
function miLog(ev) {
  try { if (window.__m3 && SEQ_ON && ev.company_id && ['Call', 'WhatsApp', 'Email'].includes(ev.action)) seqTouched(ev.company_id, ev.action); } catch { /* the log comes first */ }
  const p = me(); const now = new Date(); const c = ev.company_id ? (__cm.rowsOf('companies').find((x) => x.id === ev.company_id) || __cm.companyById(ev.company_id) || {}) : {};
  const cname = ev.company || c.company || ''; const ctry = ev.country || String(c.country || '').split(' | ')[0] || '';
  const fields = { Name: `${ev.action} · ${p.name}${cname ? ` · ${cname}` : ''}`.slice(0, 200), Epoch: now.getTime(), Time: now.toISOString(), Day: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()), Person: p.name, 'Person email': p.email, Action: ev.action, Outcome: String(ev.outcome || '').slice(0, 250), Text: String(ev.text || '').slice(0, 20000), 'Company name': cname, Country: ctry, Identity: ev.identity || '', Source: miSource() };
  if (ev.company_id) fields.Company = [ev.company_id];
  Object.keys(fields).forEach((k) => (fields[k] === '' || fields[k] == null) && delete fields[k]);
  __cm.nhCall('create_record', { folderId: MI.LOG, fieldKeys: 'label', fields }).catch(() => {});
  if (window.cmBoot) fetch('/api/medint', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...fields, Company: ev.company_id || '' }) }).catch(() => {});
}
// before a NetHunt write: sign calls and comments with the person's name (one NetHunt seat for everyone)
function beforeWrite(tool, args) {
  if (!args || MI_FOLDERS.has(args.folderId)) return args;
  if ((tool === 'create_record_call_log' || tool === 'create_record_comment') && args.text && !/\n— [^\n]+$/.test(args.text)) return { ...args, text: `${args.text}\n— ${me().name}` };
  return args;
}
// after a NetHunt write: one log line describing it
const STATUS_FIELDS = new Set(['Status', 'NEXT Status', 'Motion Status']);
function onWrite(tool, args, res) {
  if (!args || MI_FOLDERS.has(args.folderId)) return;
  const f = args.fields || {}; const id = args.recordId; const CO = __cm.NH_FOLDER, CT = '6682e9b8b6386800f586c0b0', DL = '6682e9b8b6386800f586c0af', CN = '673c960008039266ccd2ead3';
  const strip = (t) => String(t || '').replace(/\n— [^\n]+$/, '');
  if (tool === 'create_record_call_log') return miLog({ action: 'Call', company_id: args.folderId === CO ? id : '', outcome: (strip(args.text).match(/^(No answer|Left message|Spoke|Meeting set|Not interested)/) || [])[1] || '', text: strip(args.text) });
  if (tool === 'create_record_comment' && /^✎ Update to /.test(args.text || '')) return miLog({ action: 'Other', company_id: args.folderId === CO ? id : '', outcome: 'entry updated', text: strip(args.text || '').slice(0, 500) });
  if (tool === 'create_record_comment') return miLog({ action: /^Catalogue sent/.test(args.text || '') ? 'Catalogue' : 'Comment', company_id: args.folderId === CO ? id : '', text: strip(args.text) });
  const DETAIL = { 'Phone number': 'phone', Email: 'email', Website: 'website', LinkedIn: 'linkedin', Facebook: 'facebook', Instagram: 'instagram', Address: 'address', Photo: 'photo' };
  if ((args.folderId === CO || args.folderId === CT) && tool === 'update_record') { const dk = Object.keys(f).filter((k) => DETAIL[k] && f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && !f[k].length));
    if (dk.length && dk.length === Object.keys(f).filter((k) => k !== 'Sending identity').length) { // only contact details changed: that's a detail found
      const co = args.folderId === CO ? id : String((__cm.rowsOf('company_contacts').find((x) => x.id === id) || {}).company_ids || '').split('|')[0] || dash.params().cid || '';
      dk.forEach((k) => miLog({ action: 'Contact', company_id: co, outcome: `${window.__cmAuto ? 'auto' : 'found'} ${DETAIL[k]}`, text: k === 'Photo' ? '' : String(Array.isArray(f[k]) ? f[k][f[k].length - 1] : f[k]).slice(0, 300) })); return; } }
  if (args.folderId === CO && tool === 'update_record') {
    const keys = Object.keys(f).filter((k) => k !== 'Sending identity'); if (!keys.length) return;
    const st = keys.filter((k) => STATUS_FIELDS.has(k)); const kind = st.length ? 'Status' : keys.some((k) => /Ortho evidence|Category/.test(k)) ? 'Ortho' : keys.includes('Related companies') ? 'Related' : keys.includes('Assigned to') ? 'Assignment' : 'Field change';
    return miLog({ action: kind, company_id: id, outcome: keys.map((k) => `${k} → ${Array.isArray(f[k]) ? f[k].join(', ') : k === 'Next follow-up' && f[k] ? new Date(f[k]).toISOString().slice(0, 10) : f[k]}`).join(' · ').slice(0, 250) });
  }
  if (args.folderId === CT && tool === 'create_record') return miLog({ action: 'Contact', company_id: [].concat(f.Company || [])[0] || '', outcome: window.__cmAuto ? 'auto person' : 'found person', text: [f.Name, f.Title, [].concat(f.Email || [])[0], [].concat(f['Phone number'] || [])[0]].filter(Boolean).join(' · ') });
  if (args.folderId === DL) return miLog({ action: 'Deal', company_id: [].concat(f.Company || [])[0] || '', outcome: `${tool === 'create_record' ? 'New deal' : 'Deal updated'}: ${[f.Name, f.Stage].filter(Boolean).join(' · ')}` });
  if (args.folderId === CN) return miLog({ action: 'Registration', outcome: Object.entries(f).map(([k, v]) => `${k} → ${v}`).join(' · ').slice(0, 250) });
}
// WhatsApp / Gmail opened from Medint: log it, keep the company's identity, open Gmail in the right mailbox
let miCtx = null; // the company Power hour is showing
function ctxCompany(el) {
  const row = el.closest('.cm-partner'); if (row) { const b = row.querySelector('[data-open-company]'); if (b) return b.dataset.openCompany; }
  if (el.closest('#cm-sheet') && miCtx) return miCtx;
  if (__cm.curView() === 'company') return dash.params().cid;
  return miCtx || dash.params().cid || '';
}
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  const wa = /^https:\/\/wa\.me\//.test(a.href); const gm = /^https:\/\/mail\.google\.com\/mail\/(u\/[^/]+\/)?\?view=cm/.test(a.href);
  if (!wa && !gm) return;
  const id = ctxCompany(a); const idn = id ? identityFor(id) : { mailbox: me().mailbox, whatsapp: me().whatsapp };
  if (gm && idn.mailbox) a.href = a.href.replace(/^https:\/\/mail\.google\.com\/mail\/(u\/[^/]+\/)?/, `https://mail.google.com/mail/u/${encodeURIComponent(idn.mailbox)}/`);
  const q = new URLSearchParams(a.href.split('?')[1] || '');
  miLog({ action: wa ? 'WhatsApp' : 'Email', company_id: id, outcome: wa ? `opened to +${(a.href.match(/wa\.me\/(\d+)/) || [])[1] || ''}` : `draft to ${q.get('to') || ''}`, text: wa ? q.get('text') || '' : [q.get('su'), q.get('body')].filter(Boolean).join('\n\n'), identity: wa ? `WhatsApp ${idn.whatsapp || '—'}` : idn.mailbox });
  id && keepIdentity(id);
}, !0);
// after the link's own handlers have set its address: open Gmail in the identity's mailbox
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]'); if (!a || !/^https:\/\/mail\.google\.com\/mail\/(u\/[^/]+\/)?\?view=cm/.test(a.href)) return;
  const id = ctxCompany(a); const mb = (id ? identityFor(id) : me()).mailbox; if (mb) a.href = a.href.replace(/^https:\/\/mail\.google\.com\/mail\/(u\/[^/]+\/)?/, `https://mail.google.com/mail/u/${encodeURIComponent(mb)}/`);
});
function identityLine(id) { const i = identityFor(id); const d = __cm.el('div', 'cm-idn'); d.append(`Send from: ✉ ${i.mailbox || '—'}${i.whatsapp ? ` · 💬 WhatsApp ${i.whatsapp}` : ''} · ${i.who}`); d.title = 'Your own mailbox and WhatsApp (set in 👥 People). For WhatsApp, use the phone / WhatsApp Desktop with this number.'; return d; }
// ----- People & access (House) -----
function openPeople(anchor) {
  const C = __cm; const el = C.el;
  C.openSheet(anchor, '👥 People & access', (body) => {
    const ppl = miPeople(); const st = dash.data('medint_people');
    const top = el('div', 'cm-ppltop'); const cf = el('a', 'cm-btn ghost', '🔐 Login access (Cloudflare)'); cf.href = MI.CF; cf.target = '_blank'; cf.rel = 'noopener noreferrer'; cf.title = 'Add or remove the email in the website login list'; const asb = el('button', 'cm-btn ghost', '🗂 Assignments'); asb.type = 'button'; asb.addEventListener('click', () => openAssignments(asb));
    top.append(cf, asb, el('span', 'mut', 'Adding someone here sets their role; they can log in once their email is also in the login list.')); body.append(top);
    if ('ok' !== st.status) { body.append(el('div', 'hint', 'error' === st.status ? 'Couldn’t read the people list from NetHunt.' : 'Loading…')); return; }
    const tbl = el('div', 'cm-ppl');
    const row = (p) => {
      const r = el('div', 'cm-pplrow'); const inp = (v, ph, w) => { const i = el('input'); i.value = v || ''; i.placeholder = ph; i.style.flex = w; return i; };
      const nm = inp(p.name, 'Name', '1 1 90px'), em = inp(p.email, 'Login email', '2 1 180px'), mb = inp(p.mailbox, 'Mailbox (Gmail)', '2 1 170px'), wa = inp(p.whatsapp, 'WhatsApp number', '1 1 130px'), om = inp(p.other, 'Other mailboxes, comma separated', '2 1 220px');
      const rl = el('select'); ['House', 'Person'].forEach((o) => rl.append(new Option(o, o))); rl.value = p.role || 'Person';
      const ac = el('select'); ['Active', 'Paused'].forEach((o) => ac.append(new Option(o, o))); ac.value = p.active === false ? 'Paused' : 'Active';
      const sv = el('button', 'cm-btn', p.id ? 'Save' : 'Add'); sv.type = 'button'; const msg = el('span', 'hint');
      sv.addEventListener('click', async () => { if (!nm.value.trim() || !/@/.test(em.value)) { msg.textContent = 'Name and email needed.'; return; } sv.disabled = !0;
        const fields = { Name: nm.value.trim(), Email: em.value.trim().toLowerCase(), Role: rl.value, Active: ac.value, 'Default mailbox': mb.value.trim(), 'Default WhatsApp': wa.value.trim(), 'Other mailboxes': om.value.trim() }; Object.keys(fields).forEach((k) => { if (fields[k] === '') { if (p.id) fields[k] = null; else delete fields[k]; } }); /* NetHunt rejects empty text — clear it instead */
        try { await C.nhCall(p.id ? 'update_record' : 'create_record', { folderId: MI.PEOPLE, ...(p.id ? { recordId: p.id } : {}), fieldKeys: 'label', fields }); miLog({ action: 'Other', outcome: `${p.id ? 'Updated' : 'Added'} person ${fields.Name} (${fields.Role}, ${fields.Active})` }); msg.textContent = '✓ Saved'; dash.refresh('medint_people'); } catch (e) { msg.textContent = `Not saved — ${C.nhErr(e)}`; } finally { sv.disabled = !1; } });
      r.append(nm, em, rl, ac, mb, wa, om, sv, msg); return r;
    };
    ppl.forEach((p) => tbl.append(row(p))); tbl.append(el('div', 'k', '＋ Add a person'), row({ role: 'Person', active: !0 }));
    body.append(tbl, el('p', 'mut', 'House sees all companies. A Person sees only the companies assigned to them (🗂 Assignments). Mailbox: the Gmail account their emails open in (shared mailboxes need Gmail delegation). WhatsApp: the number they send from.'));
  }, { wide: !0, center: !0 });
}
// ----- work done directly in NetHunt → Medint log (credited by the NetHunt login / mailbox) -----
let nhImportAt = 0, nhImporting = null;
function personByEmail(em) { const e = low(em); if (!e) return null; return miPeople().find((p) => p.email === e || low(p.mailbox) === e || String(p.other || '').split(/[,; ]+/).map(low).includes(e)) || null; }
async function importNetHunt(force) {
  if (!isHouse()) return 0; if (nhImporting) return nhImporting; if (!force && Date.now() - nhImportAt < 10 * 60e3) return 0;
  nhImporting = (async () => {
    const C = __cm; const since = Date.now() - 7 * 864e5; const parse = (r) => r || {};
    // what was already imported (by its NetHunt event id)
    const have = new Set(); let cur; let n = 0;
    do { const p = parse(await C.nhCall('filter_records', { folderId: MI.LOG, fieldKeys: 'label', filter: { Source: { _eq: 'NetHunt' }, Epoch: { _gte: since } }, limit: 1000, ...(cur ? { cursor: cur } : {}) })); (p.records || []).forEach((r) => r.fields && r.fields.Ref && have.add(r.fields.Ref)); cur = p.nextCursor; n++; } while (cur && n < 5);
    let added = 0; cur = null; n = 0;
    do {
      const p = parse(await C.nhCall('list_folder_timeline', { folderId: C.NH_FOLDER, from: new Date(since).toISOString(), limit: 500, types: ['call', 'comment', 'email', 'chat'], ...(cur ? { cursor: cur } : {}) }));
      for (const e of p.events || []) {
        if (!e.id || have.has(e.id) || e.origin === 'API') continue; // Medint's own writes are already in the log
        const co = C.companyById(e.recordId) || C.rowsOf('pipeline_stages').find((r) => r.id === e.recordId) || {};
        let who = null, action = 'Other', outcome = '', text = '', identity = '';
        if (e.type === 'call') { who = personByEmail(e.creator && e.creator.email); action = 'Call'; text = String(e.text || '').replace(/<[^>]+>/g, ''); outcome = (text.match(/^(No answer|Left message|Spoke|Meeting set|Not interested)/i) || [])[1] || (e.duration ? `${Math.round(e.duration / 60000)} min` : ''); }
        else if (e.type === 'comment') { who = personByEmail(e.creator && e.creator.email); action = 'Comment'; text = String(e.text || '').replace(/<[^>]+>/g, ''); }
        else if (e.type === 'email') { const from = e.creator && e.creator.email; const mine = personByEmail(from); identity = from || '';
          const ours = /@(kavikaplan\.com|duni-tech\.com|dunitech\.com|next-shoulder\.com|nextshoulder\.com|d-xray\.com|dynamicxray\.com|motionmedical\.fi)$/i.test(String(from || '')) || (C.OUR_DOMAINS && C.OUR_DOMAINS.test(String(from || '')));
          if (mine || ours) { who = mine || { name: `✉ ${from}`, email: from }; action = 'Email'; outcome = `sent: ${e.subject || ''}`.slice(0, 200); } else { const to = (e.participants || []).map((x) => personByEmail(x.email)).find(Boolean); who = to; action = 'Other'; outcome = `reply received: ${e.subject || ''}`.slice(0, 200); }
          text = String(e.snippet || '').slice(0, 1000); if (!who) who = { name: `✉ ${from || 'mailbox'}`, email: from || '' }; }
        else if (e.type === 'chat') { const a = (e.chat && e.chat.assignees || []).map((x) => personByEmail(x.email)).find(Boolean); who = a || { name: 'Team WhatsApp', email: '' }; action = 'WhatsApp'; outcome = `chat · ${(e.chat && e.chat.status) || ''}`.toLowerCase(); text = String((e.chat && e.chat.lastMessage && e.chat.lastMessage.body) || '').slice(0, 1000); identity = 'WhatsApp (NetHunt)'; }
        if (!who) who = { name: (e.creator && (e.creator.name || e.creator.email)) || 'NetHunt', email: (e.creator && e.creator.email) || '' };
        const t = Number(e.time) || Date.parse(e.timeISO); const d = new Date(t);
        const fields = { Name: `${action} · ${who.name}${co.company ? ` · ${co.company}` : ''}`.slice(0, 200), Epoch: t, Time: d.toISOString(), Day: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), Person: who.name, 'Person email': who.email || '', Action: action, Outcome: outcome, Text: text, 'Company name': co.company || '', Country: String(co.country || '').split(' | ')[0] || '', Identity: identity, Source: 'NetHunt', Ref: e.id };
        if (e.recordId) fields.Company = [e.recordId];
        Object.keys(fields).forEach((k) => (fields[k] === '' || fields[k] == null) && delete fields[k]);
        try { await C.nhCall('create_record', { folderId: MI.LOG, fieldKeys: 'label', fields }); have.add(e.id); added++; } catch { /* next time */ }
      }
      cur = p.nextCursor; n++;
    } while (cur && n < 6);
    nhImportAt = Date.now(); return added;
  })().finally(() => { nhImporting = null; });
  return nhImporting;
}
setInterval(() => { try { importNetHunt(); } catch { /* not ready */ } }, 5 * 60e3);
// ----- Medint log + scoreboard (House) -----
function periodRange(k) {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0); const day = 864e5; const wd = (d0.getDay() + 6) % 7; // Monday first
  const mStart = new Date(d0.getFullYear(), d0.getMonth(), 1); const lmStart = new Date(d0.getFullYear(), d0.getMonth() - 1, 1);
  return { today: [+d0, Infinity], yesterday: [+d0 - day, +d0], week: [+d0 - wd * day, Infinity], lastweek: [+d0 - (wd + 7) * day, +d0 - wd * day], month: [+mStart, Infinity], lastmonth: [+lmStart, +mStart], quarter: [+d0 - 90 * day, Infinity], year: [+new Date(d0.getFullYear(), 0, 1), Infinity], all: [0, Infinity] }[k];
}
function prevRange(k) { // the period to compare with, same length (this week so far ↔ last week up to the same weekday and hour)
  const [a0, a1] = periodRange(k); const now = Date.now(); const day = 864e5;
  if (k === 'all') return null; const d0 = new Date(a0);
  const start = { today: a0 - day, yesterday: a0 - day, week: a0 - 7 * day, lastweek: a0 - 7 * day, quarter: a0 - 90 * day, month: +new Date(d0.getFullYear(), d0.getMonth() - 1, 1), lastmonth: +new Date(d0.getFullYear(), d0.getMonth() - 1, 1), year: +new Date(d0.getFullYear() - 1, 0, 1) }[k];
  const len = (Number.isFinite(a1) ? a1 : now) - a0; return [start, Number.isFinite(a1) && k !== 'month' ? a0 : start + len];
}
const PREV_LBL = { today: 'yesterday (same time)', yesterday: 'the day before', week: 'last week (same days)', lastweek: 'the week before', month: 'last month (same days)', lastmonth: 'the month before', quarter: 'the 3 months before', year: 'last year (same dates)' };
function tally(rows) { // log lines → the same shape the website database returns
  const c = {}, co = {}, mt = {};
  rows.forEach((r) => { const k = `${r.person}|${r.action}`; c[k] = (c[k] || 0) + 1; if (r.company_id) (co[r.person] = co[r.person] || new Set()).add(r.company_id); if (r.action === 'Meeting' || /^Meeting set/.test(r.outcome || '')) mt[r.person] = (mt[r.person] || 0) + 1; });
  return { counts: Object.entries(c).map(([k, n]) => ({ person: k.split('|')[0], action: k.split('|')[1], n })), companies: Object.entries(co).map(([person, set]) => ({ person, n: set.size })), meetings: Object.entries(mt).map(([person, n]) => ({ person, n })) };
}
// the log read directly from NetHunt — used when the shared dataset hasn't answered within a few seconds
const dLog = { rows: null, busy: !1, at: 0, started: 0 };
function directLog() {
  if (dLog.rows && Date.now() - dLog.at < 120e3) return dLog.rows; if (dLog.busy) return dLog.rows; dLog.busy = !0;
  (async () => { const out = []; let cur = null; let n = 0;
    do { const p = await __cm.nhCall('filter_records', { folderId: MI.LOG, fieldKeys: 'label', filter: { Epoch: { _gte: LOG_FROM } }, limit: 1000, ...(cur ? { cursor: cur } : {}) }); (p.records || []).forEach((r) => { const f = r.fields || {}; out.push({ id: r.id, epoch: Number(f.Epoch) || 0, person: f.Person || '', action: f.Action || '', outcome: f.Outcome || '', text: f.Text || '', company_id: [].concat(f.Company || [])[0] || '', company: f['Company name'] || '', country: f.Country || '', voided: !!f.Voided, source: f.Source || '' }); }); cur = p.nextCursor; n++; } while (cur && n < 10);
    dLog.rows = out; dLog.at = Date.now(); })().catch((e) => { dS.err = __cm.nhErr ? __cm.nhErr(e) : String(e); }).finally(() => { dLog.busy = !1; dS.at = 0; tStats.at = 0; hmKey = ''; drawHome(); });
  return dLog.rows;
}
// the log rows for Home (Claude): the shared dataset, or the direct read if the dataset is slow
function homeLog() { const lg = dash.data('medint_log'); if ('ok' === lg.status) return lg.data; if (!dLog.started) dLog.started = Date.now(); if (Date.now() - dLog.started > 15000 || 'error' === lg.status) return directLog(); /* only if the normal read is really stuck */ return null; }
// Loading… — or, if the log can’t be read, say so with a retry
function loadingOrError() { const el = __cm.el; if (!dS.err) return el('div', 'hint', 'Loading your numbers…'); const x = el('div', 'hint'); x.append(`Couldn’t read the Medint log from NetHunt (${String(dS.err).slice(0, 80)}). `); const b = el('button', 'cm-mini', '↻ Try again'); b.type = 'button'; b.addEventListener('click', () => { dS.err = null; dS.at = 0; dash.refresh('medint_log'); }); x.append(b); return x; }
// 🔎 details found today (numbers, emails, people… added with Add missing), compared with yesterday
function foundBox(person) {
  const C = __cm; const el = C.el; const D = daysData(); const box = el('section', 'cm-foundbox'); const t0 = dayIdx(Date.now());
  const mine = D ? D.P.get(person) || new Map() : new Map(); const T = (mine.get(t0) || {}).found || {}; const Y = (mine.get(t0 - 1) || {}).found || {};
  const tot = Object.values(T).reduce((a, b) => a + b, 0); const ytot = Object.values(Y).reduce((a, b) => a + b, 0);
  const hd = el('div', 'cm-h2row'); const h2 = el('h2', null, `🔎 Details you found today · ${tot}`); if (tot !== ytot) { const dl = el('span', `cm-dlt ${tot > ytot ? 'up' : 'down'}`, tot > ytot ? `▲${tot - ytot}` : `▼${ytot - tot}`); dl.title = `${ytot} yesterday`; h2.append(' ', dl); } hd.append(h2); box.append(hd);
  const fd = el('div', 'cm-found'); FOUND_LBL.forEach(([k, ic, l]) => { const n = T[k] || 0, y = Y[k] || 0; const x = el('span', n ? '' : 'zero'); const b = el('b', null, `${ic} ${n}`); if (n !== y) { const d = el('em', `cm-dlt ${n > y ? 'up' : 'down'}`, n > y ? `▲${n - y}` : `▼${y - n}`); d.title = `${y} yesterday`; b.append(' ', d); } x.append(b, el('small', null, l)); fd.append(x); }); box.append(fd);
  box.append(el('div', 'mut', !D ? 'Loading…' : tot ? `👏 ${tot} new detail${tot === 1 ? '' : 's'} added to NetHunt today — every one saves the team time.` : 'Missing a number or email? 🔎 Add missing — everything you add counts here.'));
  return box;
}
// 📈 one person's progress: 14-day chart, streak, goals hit, and the details they found
const FOUND_LBL = [['email', '✉', 'emails'], ['phone', '☎', 'phone numbers'], ['person', '👤', 'people'], ['website', '🌐', 'websites'], ['linkedin', '💼', 'LinkedIn'], ['facebook', '📘', 'Facebook'], ['instagram', '📸', 'Instagram'], ['address', '📍', 'addresses'], ['photo', '📷', 'photos']];
function progressView(person) {
  const C = __cm; const el = C.el; const D = daysData(); const box = el('div', 'cm-prog'); if (!D) { box.append(loadingOrError()); return box; }
  const mine = D.P.get(person) || new Map(); const t0 = dayIdx(Date.now()); const days = [...Array(14).keys()].map((k) => t0 - 13 + k); const vals = days.map((d) => (mine.get(d) || { cos: new Set() }).cos.size);
  const goals = days.map((d, k) => { const x = mine.get(d); const h = x && x.plan != null ? x.plan : person === me().name && k === 13 && planToday() ? planToday().hours : null; return h ? goalFor(h) : null; });
  let streak = 0; for (let k = vals[13] ? 13 : 12; k >= 0 && vals[k] > 0; k--) streak++; const planned = goals.filter(Boolean).length; const hit = vals.filter((v, k) => goals[k] && v >= goals[k]).length; const worked = vals.filter(Boolean); const avg = worked.length ? Math.round(worked.reduce((a, b) => a + b, 0) / worked.length) : 0; const total = vals.reduce((a, b) => a + b, 0);
  const st = el('div', 'cm-mystats'); [[`🔥 ${streak}`, 'day streak'], [planned ? `${hit}/${planned}` : '–', '🎯 goals reached'], [avg, '📊 companies / working day'], [total, '🏢 companies in 2 weeks']].forEach(([n, l]) => { const x = el('div', 'ms'); x.append(el('b', null, String(n)), el('span', null, l)); st.append(x); }); box.append(st);
  const mx = Math.max(...vals, ...goals.filter(Boolean), 1); const ch = el('div', 'cm-mychart'); days.forEach((d, k) => { const v = vals[k]; const gl = goals[k]; const c = el('div', `col${k === 13 ? ' today' : ''}${gl && v >= gl ? ' hit' : ''}`); const bar = el('i'); bar.style.height = `${Math.max(v ? 6 : 2, (v / mx) * 100)}%`; c.title = `${new Date(`${dayDate(d)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}: ${v} compan${v === 1 ? 'y' : 'ies'}${gl ? ` of ${gl}` : ''}`; c.append(el('small', null, v ? String(v) : ''), bar, el('span', null, 'SMTWTFS'[new Date(`${dayDate(d)}T12:00:00`).getDay()])); ch.append(c); });
  box.append(el('div', 'cm-cgk', '📈 Companies worked per day · last 2 weeks (green = goal reached)'), ch);
  // details found (numbers, emails, people… added from Find / Paste)
  const F = {}; const Ft = {}; days.forEach((d) => { const x = mine.get(d); if (!x) return; Object.entries(x.found || {}).forEach(([k, n]) => { F[k] = (F[k] || 0) + n; if (d === t0) Ft[k] = (Ft[k] || 0) + n; }); }); const fTot = Object.values(F).reduce((a, b) => a + b, 0);
  box.append(el('div', 'cm-cgk', `🔎 Details you found · ${fTot} in 2 weeks${Object.values(Ft).reduce((a, b) => a + b, 0) ? ` · ${Object.values(Ft).reduce((a, b) => a + b, 0)} today` : ''}`));
  const fd = el('div', 'cm-found'); FOUND_LBL.forEach(([k, ic, l]) => { const n = F[k] || 0; const x = el('span', n ? '' : 'zero'); x.append(el('b', null, `${ic} ${n}`), el('small', null, l)); if (Ft[k]) x.append(el('i', null, `+${Ft[k]} today`)); fd.append(x); }); box.append(fd);
  if (!fTot) box.append(el('div', 'mut', 'Every number, email, person or link added with 🔎 Add missing counts here — it makes the whole team’s work easier.'));
  else box.append(el('div', 'mut', `👏 ${fTot} new detail${fTot === 1 ? '' : 's'} added to NetHunt — every one of them saves the team time.`));
  return box;
}
// 🎯 Days & goals: every person, every day — companies worked against their goal
function drawDays(body, f) {
  const C = __cm; const el = C.el; const D = daysData(); if (!D) { body.append(el('div', 'hint', 'Loading…')); return; }
  const t0 = dayIdx(Date.now()); const days = [...Array(14).keys()].map((k) => t0 - 13 + k);
  const ppl = (isHouse() ? [...new Set([...miPeople().filter((p) => p.active).map((p) => p.name), ...D.P.keys()])] : [me().name]).filter((p) => p && !/^✉ |^Team WhatsApp$/.test(p) || (D.P.get(p) && [...D.P.get(p).values()].some((x) => x.cos.size)));
  const cellOf = (p, d) => { const x = (D.P.get(p) || new Map()).get(d); const h = x && x.plan != null ? x.plan : p === me().name && d === t0 && planToday() ? planToday().hours : null; const n = x ? x.cos.size : 0; const goal = h ? goalFor(h) : null; return { x, n, h, goal, pct: goal ? Math.round((n / goal) * 100) : null }; };
  body.append(el('p', 'mut', `Companies worked per day — calls, WhatsApps, emails, notes or status changes on a company (first contacts and follow-ups both count). Goal = ${COMP_PER_HOUR} per planned hour. Saved daily in NetHunt “Medint Days”.`));
  const wrap = el('div', 'cm-tablewrap'); const t = el('table', 'cm-cmpt cm-daystbl'); const hr = el('tr'); hr.append(el('th', null, ''));
  days.forEach((d) => { const dt = new Date(`${dayDate(d)}T12:00:00`); const th = el('th', d === t0 ? 'today' : ''); th.append(el('span', null, 'SMTWTFS'[dt.getDay()]), el('b', null, String(dt.getDate()))); hr.append(th); });
  ['Days worked', 'Goal hit', 'Avg / day', 'Total'].forEach((x) => hr.append(el('th', 'sum', x))); const th0 = el('thead'); th0.append(hr); t.append(th0); const tb = el('tbody');
  ppl.forEach((p) => { const tr = el('tr'); const n0 = el('td', 'nm'); const pp = miPeople().find((x) => x.name === p) || {}; n0.append(avatarEl(p, pp.email, '', ''), el('span', null, p)); n0.style.cursor = 'pointer'; n0.title = 'Show this person’s progress'; n0.addEventListener('click', () => { f.pick = { p, d: dayIdx(Date.now()) }; C.sheetDraw(); }); tr.append(n0);
    let worked = 0, hit = 0, tot = 0, plannedDays = 0;
    days.forEach((d) => { const c = cellOf(p, d); const td = el('td', `dc ${c.h === 0 ? 'off' : c.pct == null ? (c.n ? 'nog' : 'none') : c.pct >= 100 ? 'hit' : c.pct >= 60 ? 'mid' : 'low'}${d === t0 ? ' today' : ''}`);
      td.textContent = c.h === 0 && !c.n ? '🌙' : c.n ? String(c.n) : ''; if (c.n) { worked++; tot += c.n; } if (c.goal) { plannedDays++; if (c.n >= c.goal) hit++; }
      td.title = `${p} · ${new Date(`${dayDate(d)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}: ${c.n} companies${c.goal ? ` of ${c.goal} (${c.pct}%) · ${c.h} h planned` : c.h === 0 ? ' · day off' : ' · no plan'}`;
      td.addEventListener('click', () => { f.pick = { p, d }; C.sheetDraw(); }); if (f.pick && f.pick.p === p && f.pick.d === d) td.classList.add('on'); tr.append(td); });
    tr.append(el('td', 'sum', String(worked)), el('td', 'sum', plannedDays ? `${hit}/${plannedDays}` : '–'), el('td', 'sum', worked ? String(Math.round(tot / worked)) : '–'), el('td', 'sum', String(tot))); tb.append(tr); });
  t.append(tb); wrap.append(t); body.append(wrap);
  body.append(el('div', 'cm-dayslegend', '🟩 goal reached · 🟨 60–99% · 🟧 under 60% · 🟦 worked, no plan · 🌙 day off — tap a day for details'));
  if (f.pick) { const c = cellOf(f.pick.p, f.pick.d); const x = c.x || { cos: new Set(), Call: 0, WhatsApp: 0, Email: 0, Comment: 0, Status: 0 }; const rr = splitReach(x.cos, new Date(`${dayDate(f.pick.d)}T00:00:00`).getTime());
    const det = el('div', 'cm-daydet'); det.append(el('b', null, `${f.pick.p} · ${new Date(`${dayDate(f.pick.d)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`));
    const nums = el('div', 'cm-mystats'); [[c.n, '🏢 companies worked'], [rr.fresh, '🆕 first contacts'], [rr.follow, '🔁 follow-ups'], [c.goal ? `${c.pct}%` : '–', c.goal ? `of goal (${c.goal}, ${c.h} h)` : 'no plan that day'], [x.Call, '☎ calls'], [x.WhatsApp, '💬 WhatsApps'], [x.Email, '✉ emails'], [x.Comment, '📝 notes']].forEach(([n, l]) => { const y = el('div', 'ms'); y.append(el('b', null, String(n)), el('span', null, l)); nums.append(y); }); det.append(nums); body.append(det); }
  { const who = (f.pick && f.pick.p) || me().name; const pv = el('section', 'cm-hmcard'); pv.append(el('h2', null, `📈 ${who === me().name ? 'My progress' : `${who}’s progress`}`), progressView(who)); body.append(pv); }
  const sv = el('button', 'cm-mini', '💾 Save these days to NetHunt now'); sv.type = 'button'; sv.addEventListener('click', async () => { daySaveAt = 0; sv.textContent = 'Saving…'; await saveDays(); sv.textContent = '✓ Saved'; }); body.append(sv);
}
function openLog(anchor) {
  const C = __cm; const el = C.el;
  importNetHunt(!0).then((n) => { if (n) { dash.refresh('medint_log'); key0 = ''; synced = !1; C.sheetDraw && C.sheetDraw(); } }).catch(() => {}); const PER = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['quarter', 'Last 3 months'], ['year', 'This year'], ['all', 'All time']];
  const COLS = [['Call', '☎ Calls'], ['WhatsApp', '💬 WhatsApp'], ['Email', '✉ Emails'], ['Comment', '📝 Comments'], ['Meeting', '📅 Meetings'], ['Status', '📈 Status moves'], ['*', '🏢 Companies']];
  const ACTIONS = ['Call', 'WhatsApp', 'Email', 'Comment', 'Status', 'Meeting', 'Catalogue', 'Deal', 'Contact', 'Ortho', 'Related', 'Assignment', 'Field change', 'Registration', 'Other'];
  const f = { span: 'today', who: '', what: '', ctry: '', src: '', q: '', cmp: !1, tab: 'days', pick: null };
  // NetHunt copy (Claude dashboard): load from the start of what's needed (only further back when asked)
  const needFrom = () => { const pr = f.cmp ? prevRange(f.span) : null; needLog(Math.min(periodRange(f.span)[0], pr ? pr[0] : Infinity)); };
  needLog(periodRange('lastmonth')[0]);
  // website: Medint's own database counts any period instantly (falls back to NetHunt when it isn't connected)
  let d1 = window.cmBoot ? 'try' : 'no', cur = null, prev = null, key0 = '', synced = !1;
  const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const d1load = () => { const [f0, t0] = periodRange(f.span); const pr = f.cmp ? prevRange(f.span) : null; const key = JSON.stringify({ ...f, q: '' }); if (key0 === key) return; key0 = key; cur = null; prev = null;
    const base = { country: f.ctry, source: f.src };
    const go = () => Promise.all([fetch(`/api/medint?summary=1&${qs({ ...base, from: f0, to: Number.isFinite(t0) ? t0 : 9e15, person: f.who, action: f.what === 'Meeting' || f.what === '*' ? '' : f.what })}`, { credentials: 'same-origin' }).then((r) => (r.status === 501 ? null : r.json())),
      pr ? fetch(`/api/medint?summary=1&counts=1&${qs({ ...base, from: pr[0], to: pr[1] })}`, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)) : null])
      .then(([j, p]) => { if (!j || !j.counts) d1 = 'no'; else { d1 = 'yes'; cur = j; prev = p; } C.sheetDraw(); }).catch(() => { d1 = 'no'; C.sheetDraw(); });
    if (!synced) { synced = !0; fetch('/api/medint?sync=1', { method: 'POST', credentials: 'same-origin' }).catch(() => {}).finally(go); } else go(); };
  C.openSheet(anchor, '🧾 Medint log & scoreboard', (body) => {
    const tb = el('div', 'cm-chips cm-cgtabs'); [['days', '🎯 Days & goals'], ['actions', '🧾 Actions']].forEach(([k, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(f.tab === k)); b.addEventListener('click', () => { f.tab = k; C.sheetDraw(); }); tb.append(b); }); body.append(tb);
    if (f.tab === 'days') { drawDays(body, f); return; }
    // period
    const bar = el('div', 'cm-chips'); PER.forEach(([k, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(k === f.span)); b.addEventListener('click', () => { f.span = k; d1 === 'no' && needFrom(); C.sheetDraw(); }); bar.append(b); }); body.append(bar);
    // the numbers for this period (and the one to compare with)
    let T, P = null, rows, countries; const [a0, a1] = periodRange(f.span); const pr = f.cmp ? prevRange(f.span) : null;
    if (d1 !== 'no') { d1load(); if (!cur) { body.append(el('div', 'hint', 'Loading…')); return; } T = cur; P = prev; rows = cur.rows; countries = (cur.countries || []).map((x) => x.country); }
    else { const d = dash.data('medint_log'); if ('ok' !== d.status) { body.append(el('div', 'hint', 'error' === d.status ? 'Couldn’t read the log from NetHunt.' : 'Loading…')); return; }
      const ok = (r) => !r.voided && (!f.ctry || r.country === f.ctry) && (!f.src || r.source === f.src);
      const inP = d.data.filter((r) => ok(r) && r.epoch >= a0 && r.epoch < a1); T = tally(inP); if (pr) P = tally(d.data.filter((r) => ok(r) && r.epoch >= pr[0] && r.epoch < pr[1]));
      rows = inP.filter((r) => (!f.who || r.person === f.who) && (!f.what || f.what === '*' || (f.what === 'Meeting' ? r.action === 'Meeting' || /^Meeting set/.test(r.outcome || '') : r.action === f.what))); countries = [...new Set(d.data.filter((r) => r.epoch >= a0 && r.epoch < a1).map((r) => r.country).filter(Boolean))].sort(); if (d.cut) T.cut = !0; }
    // filters
    const fl = el('div', 'cm-logfl'); const sel = (opts, v, on, title) => { const x = el('select', 'cm-phtpl'); x.title = title; opts.forEach(([a, l]) => x.append(new Option(l, a))); x.value = v; x.addEventListener('change', () => on(x.value)); return x; };
    const ppl = [...new Set([...miPeople().map((p) => p.name), ...T.counts.map((x) => x.person)])].filter(Boolean);
    fl.append(sel([['', '👥 Everyone'], ...ppl.map((p) => [p, p])], f.who, (v) => { f.who = v; C.sheetDraw(); }, 'Person'),
      sel([['', 'All actions'], ...ACTIONS.map((x) => [x, x])], f.what === '*' ? '' : f.what, (v) => { f.what = v; C.sheetDraw(); }, 'Action'),
      sel([['', '🌍 All countries'], ...countries.map((c) => [c, c])], f.ctry, (v) => { f.ctry = v; d1 === 'no' || (key0 = ''); C.sheetDraw(); }, 'Country'),
      sel([['', 'Website + Claude'], ['Website', 'Website only'], ['Claude', 'Claude only']], f.src, (v) => { f.src = v; C.sheetDraw(); }, 'Where it was done'));
    const cb = el('button', 'cm-chip', `⇄ Compare${pr ? ` with ${PREV_LBL[f.span] || 'before'}` : ''}`); cb.type = 'button'; cb.setAttribute('aria-pressed', String(f.cmp)); cb.disabled = f.span === 'all'; cb.title = f.span === 'all' ? 'Pick a period to compare' : 'Compare with the period before (same length)';
    cb.addEventListener('click', () => { f.cmp = !f.cmp; d1 === 'no' && needFrom(); C.sheetDraw(); }); fl.append(cb); body.append(fl);
    // helpers
    const val = (S, p, k) => !S ? 0 : k === '*' ? (S.companies.find((x) => x.person === p) || {}).n || 0 : k === 'Meeting' ? (S.meetings || []).filter((x) => x.person === p).reduce((a, x) => a + x.n, 0) : S.counts.filter((x) => x.person === p && x.action === k).reduce((a, x) => a + x.n, 0);
    const tot = (S, k) => (!S ? 0 : k === '*' ? S.companies.reduce((a, x) => a + x.n, 0) : ppl.reduce((a, p) => a + val(S, p, k), 0));
    const delta = (now, before) => { if (!P) return null; const dlt = now - before; const x = el('span', `cm-dlt ${dlt > 0 ? 'up' : dlt < 0 ? 'down' : 'eq'}`, dlt > 0 ? `▲${dlt}` : dlt < 0 ? `▼${-dlt}` : '='); x.title = `${before} in ${PREV_LBL[f.span]}`; return x; };
    const allOf = (S, p) => S ? S.counts.filter((x) => x.person === p).reduce((a, x) => a + x.n, 0) : 0;
    // totals
    const tiles = el('div', 'cm-logtiles'); COLS.forEach(([k, l]) => { const n = tot(T, k); const b = el('button', 'cm-logtile'); b.type = 'button'; b.setAttribute('aria-pressed', String(f.what === k)); const top = el('div', 'tv'); top.append(el('b', null, n.toLocaleString('en'))); const dl = delta(n, tot(P, k)); dl && top.append(dl); b.append(top, el('span', null, l)); b.disabled = !n && !(P && tot(P, k)); b.addEventListener('click', () => { f.what = f.what === k ? '' : k; C.sheetDraw(); }); tiles.append(b); }); body.append(tiles);
    // per person
    const busy = ppl.filter((p) => allOf(T, p) || allOf(P, p)); const idle = ppl.filter((p) => !busy.includes(p));
    if (!busy.length) body.append(el('div', 'cm-logempty', `No actions ${PER.find(([k]) => k === f.span)[1].toLowerCase()} yet${f.ctry ? ` in ${f.ctry}` : ''} — calls, WhatsApps, emails, comments and status changes made in Medint appear here as they happen.`));
    else {
      const wrap = el('div', 'cm-tablewrap'); const t = el('table', 'cm-cmpt cm-scoretbl'); const hr = el('tr'); hr.append(el('th', null, '')); COLS.forEach(([, l]) => hr.append(el('th', null, l))); P && hr.append(el('th', null, 'All actions')); const th = el('thead'); th.append(hr); t.append(th); const tb = el('tbody');
      const maxAll = Math.max(1, ...busy.map((p) => Math.max(allOf(T, p), allOf(P, p))));
      busy.sort((x, y) => allOf(T, y) - allOf(T, x)).forEach((p) => { const tr = el('tr'); const n = el('td'); const nb = el('button', 'cm-co', p); nb.type = 'button'; nb.addEventListener('click', () => { f.who = f.who === p ? '' : p; C.sheetDraw(); }); n.append(nb); tr.append(n);
        COLS.forEach(([k]) => { const v = val(T, p, k); const td = el('td'); const b = el('button', 'cm-co', v ? String(v) : '·'); b.type = 'button'; b.disabled = !v; b.addEventListener('click', () => { f.who = p; f.what = k; C.sheetDraw(); }); td.append(b); const dl = delta(v, val(P, p, k)); dl && td.append(dl); tr.append(td); });
        if (P) { const td = el('td', 'cm-cmpbar'); const a = allOf(T, p), bb = allOf(P, p); const w1 = el('i', 'now'); w1.style.width = `${(a / maxAll) * 100}%`; const w2 = el('i', 'was'); w2.style.width = `${(bb / maxAll) * 100}%`; td.title = `${a} now · ${bb} in ${PREV_LBL[f.span]}`; td.append(w1, w2, el('span', 'mut', `${a} vs ${bb}`)); tr.append(td); }
        if (f.who === p) tr.classList.add('on'); tb.append(tr); });
      t.append(tb); wrap.append(t); body.append(wrap); idle.length && body.append(el('div', 'mut cm-logidle', `No actions: ${idle.join(', ')}`));
      P && body.append(el('div', 'mut cm-logidle', `▲▼ compared with ${PREV_LBL[f.span]} · bars: dark = now, light = before`));
    }
    // the actions behind the numbers
    const ql = low(f.q); const shown = rows.filter((r) => !ql || low(`${r.company} ${r.outcome} ${r.text} ${r.person} ${r.country}`).includes(ql));
    const lf = el('div', 'cm-logfl'); const qi = el('input', 'cm-asearch'); qi.placeholder = '🔎 Search the actions (company, note, outcome…)'; qi.value = f.q; qi.addEventListener('input', () => { f.q = qi.value; const pos = qi.selectionStart; C.sheetDraw(); const q2 = document.querySelector('#cm-sheet .cm-logfl .cm-asearch'); q2 && (q2.focus(), q2.setSelectionRange(pos, pos)); });
    lf.append(qi, el('span', 'mut', `${shown.length}${d1 === 'yes' && rows.length === 300 ? '+' : ''} action${shown.length === 1 ? '' : 's'}${f.who ? ` · ${f.who}` : ''}${f.what ? ` · ${f.what === '*' ? 'companies' : f.what}` : ''}`));
    if (f.who || f.what || f.ctry || f.src || f.q) { const x = el('button', 'cm-mini', 'clear filters'); x.type = 'button'; x.addEventListener('click', () => { Object.assign(f, { who: '', what: '', ctry: '', src: '', q: '' }); key0 = ''; C.sheetDraw(); }); lf.append(x); }
    const csv = el('button', 'cm-mini', '⬇ CSV of this list'); csv.type = 'button'; csv.addEventListener('click', () => { const head = ['time', 'person', 'action', 'outcome', 'company', 'country', 'identity', 'source', 'text']; const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const blob = new Blob([[head.join(','), ...shown.map((r) => head.map((k) => q(r[k])).join(','))].join('\n')], { type: 'text/csv' }); const u = URL.createObjectURL(blob); const x = el('a'); x.href = u; x.download = `medint-log-${f.span}.csv`; document.body.append(x); x.click(); x.remove(); });
    lf.append(csv); body.append(lf);
    const ICON = { Call: '☎', WhatsApp: '💬', Email: '✉', Comment: '📝', Status: '📈', Meeting: '📅', Catalogue: '📎', Deal: '💼', Contact: '👤', Ortho: '🦴', Related: '🔗', Assignment: '👥', Registration: '🏛' };
    const list = el('div', 'cm-loglist'); shown.slice(0, 300).forEach((r) => { const li = el('div', 'cm-logrow'); const tm = new Date(r.epoch || r.time);
      li.append(el('span', 'i', ICON[r.action] || '•'), el('span', 'w', `${tm.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${tm.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`), el('b', null, r.person));
      const co = el('button', 'cm-co', r.company || ''); co.type = 'button'; if (r.company_id) co.dataset.openCompany = r.company_id; li.append(co, el('span', 'o', [r.country, r.outcome, r.identity && `via ${r.identity}`].filter(Boolean).join(' · ')));
      r.text && li.append(el('div', 'tx', r.text.slice(0, 280)));
      const nhId = d1 === 'yes' ? r.nh_id : r.id;
      if (nhId) { const vb = el('button', 'cm-mini', 'void'); vb.type = 'button'; vb.title = 'Mark this line as a mistake (kept, but not counted)'; vb.addEventListener('click', async () => { if (vb.dataset.sure !== '1') { vb.dataset.sure = '1'; vb.textContent = 'confirm void'; return; } try { await C.nhCall('update_record', { folderId: MI.LOG, recordId: nhId, fieldKeys: 'label', fields: { Voided: !0, 'Void reason': `voided by ${me().name}` } }); r.voided = !0; C.say('Voided'); key0 = ''; C.sheetDraw(); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); } }); li.append(vb); }
      list.append(li); });
    if (!shown.length && busy.length) list.append(el('div', 'hint', 'No actions match these filters.'));
    body.append(list);
    if (d1 === 'yes') { const cv = el('a', 'cm-mini', '⬇ Full CSV'); cv.href = `/api/medint?csv=1&from=${a0}&to=${Number.isFinite(a1) ? a1 : 9e15}`; const ft = el('div', 'cm-logfoot'); ft.append(el('span', 'mut', `🗄 ${Number(cur.stored || 0).toLocaleString('en')} actions stored permanently · counts cover the whole period, the list the latest 300`), cv); body.append(ft); }
    else if (T.cut) body.append(el('p', 'mut', 'Showing the latest 10,000 actions here; on the website, counts and the full CSV cover the whole history.'));
  }, { wide: !0, center: !0 });
}

// ---------- Release 2: assignment rules (same logic as the website server, functions/_lib/access.js) ----------
const SPEC = { Company: 5, Batch: 4, Status: 3, Tag: 3, Country: 2, Region: 1 };
let asgCache = { src: null, rs: [] };
function asgRules() { const d = dash.data('medint_assign'); if ('ok' !== d.status) return []; if (asgCache.src !== d.data) asgCache = { src: d.data, rs: d.data.filter((r) => r.active && r.person && SPEC[r.type]).map((r) => ({ ...r, tagl: r.tags.split(/\n|,/).map((x) => x.trim()).filter(Boolean), idl: String(r.ids || '').split('|').filter(Boolean) })) }; return asgCache.rs; }
const low = (v) => String(v ?? '').trim().toLowerCase();
const coIdx = { a: null, b: null, m: new Map() };
function coById(id) { const a = __cm.rowsOf('companies'), b = __cm.rowsOf('pipeline_stages'); if (coIdx.a !== a || coIdx.b !== b) { const m = new Map(); b.forEach((x) => m.set(x.id, x)); a.forEach((x) => m.set(x.id, x)); coIdx.a = a; coIdx.b = b; coIdx.m = m; } return coIdx.m.get(id) || {}; }
function assigneeOf(id) {
  const rs = asgRules(); if (!rs.length) return null;
  const c = coById(id);
  const ctry = String(c.country || '').split(/ \| |, /).map(low); const tags = String(c.tags || '').split(/ \| |\|/).map(low); const sts = [c.status, c.next_status, c.motion_status].map(low).filter(Boolean);
  let best = null;
  for (const r of rs) {
    let hit = false;
    if (r.type === 'Company' || r.type === 'Batch') hit = r.idl.includes(id);
    else if (r.type === 'Status') hit = sts.includes(low(r.value.replace(/^(next|motion)?\s*status:\s*/i, '')));
    else if (r.type === 'Tag') hit = tags.includes(low(r.value));
    else hit = ctry.some((x) => r.tagl.includes(x));
    if (hit && (!best || SPEC[r.type] > SPEC[best.type] || (SPEC[r.type] === SPEC[best.type] && r.created < best.created))) best = r;
  }
  return best ? best.person : null;
}
// House filter on lists: Everyone / Unassigned / a person
function passAssign(id) { const f = dash.params().asg; if (!f || !isHouse()) return !0; dash.data('medint_assign'); const a = assigneeOf(id); return f === '-' ? !a : a === f; }
const initials = (n) => String(n || '').slice(0, 2).toUpperCase();
// decorate the Best partners list: assignee initials on rows + the Assigned filter (House)
function partnerRow(id) { return __cm.rowsOf('partners').find((x) => x.id === id) || null; }
function scoreItems(o, k) {
  const all = __cm.OURS[k] && __cm.OURS[k].all; const p = all ? 'all' : k; const seg = all ? 'Orthopaedic' : __cm.OURS[k].seg || 'Segment';
  return [{ icon: o.ortho_verdict === 'ortho' ? '✅' : o.ortho_verdict === 'not_ortho' ? '⛔' : '🦴', label: 'Ortho evidence · 25%', sub: `${o.pts_ortho} / 25` }, { icon: '', label: o.ortho_why || '', sub: '' },
    { icon: '🏷️', label: `${seg} brands carried · 5%`, sub: `${all ? o.pts_brand_all : o[`pts_brand_${p}`]} / 5` },
    { icon: '📦', label: `Imports · 25% — ${o.imp_why || ''}`, sub: `${o.pts_imp} / 25` }, { icon: '🏛', label: `Tenders won · 25% — ${o.tender_why || ''}`, sub: `${o.pts_tender} / 25` },
    { icon: '🌐', label: `Presence · 20% — ${o.pres_why || ''}`, sub: `${o.pts_pres} / 20` }];
}
function scoreChip(id) {
  const o = partnerRow(id); if (!o) return null; const k = __cm.oursKey(); const sc = o[`score_${__cm.OURS[k] && __cm.OURS[k].all ? 'all' : k}`]; if (sc == null) return null;
  const b = __cm.el('span', 'cm-cscore'); b.tabIndex = 0; const bar = __cm.el('i'); const u = __cm.el('u'); u.style.width = `${Math.max(0, Math.min(100, sc))}%`; bar.append(u);
  b.append('Score ', __cm.el('b', null, String(sc)), bar); b.title = 'Best-partner score — hover for the breakdown';
  __cm.hoverList(b, () => ({ noCount: !0, title: `${o.company} · score ${sc}`, items: scoreItems(o, k) })); return b;
}
// Best partners: tenders next to brands and imports in each row's info line (everyone)
function ignoredInRows() { document.querySelectorAll('.cm-partner').forEach((row) => { const b = row.querySelector('[data-open-company]'); if (!b) return; const on = isIgnored(b.dataset.openCompany); row.classList.toggle('cm-ign', on); if (on && !row.querySelector('.cm-ignb')) { const t = __cm.el('span', 'cm-ignb', '🙈 Ignored'); t.title = 'Ignored for everyone — hidden from Home, Today and Power hour (open the company to show it again)'; b.after(t); } }); }
function tendersInRows() {
  document.querySelectorAll('.cm-partner').forEach((row) => { const w = row.querySelector('.why'); if (!w || w.dataset.tw) return; w.dataset.tw = '1'; const b = row.querySelector('[data-open-company]'); const o = b && partnerRow(b.dataset.openCompany); if (o && o.tender_short) w.append(` · ${o.tender_short}`); });
}
function decoratePartners() {
  tendersInRows(); ignoredInRows(); whyInRows(); attachRowOut();
  if (!isHouse()) return; dash.data('medint_assign');
  document.querySelectorAll('.cm-partner').forEach((row) => { if (row.querySelector('.cm-asg')) return; const b = row.querySelector('[data-open-company]'); if (!b) return; const a = assigneeOf(b.dataset.openCompany); if (a) { const t = __cm.el('span', 'cm-asg', initials(a)); t.title = `Assigned to ${a}`; b.after(t); } });
  const tools = document.querySelector('.cm-ptools'); if (!tools || tools.querySelector('.cm-asgchip')) return;
  const f = dash.params().asg; const ch = __cm.el('button', 'cm-chip cm-asgchip', `👥 ${f === '-' ? 'Unassigned' : f || 'Everyone'}`); ch.type = 'button'; ch.setAttribute('aria-pressed', String(!!f));
  ch.addEventListener('click', () => __cm.openMenu(ch, [{ label: 'Everyone', on: !f, act: () => dash.setParams({ asg: null }) }, { label: 'Unassigned', on: f === '-', act: () => dash.setParams({ asg: '-' }) }, ...miPeople().filter((p) => p.active).map((p) => ({ label: p.name, sub: p.role, on: f === p.name, act: () => dash.setParams({ asg: p.name }) }))]));
  tools.prepend(ch);
}

const WHY_TAG = ['💬 They wrote', '📅 Meeting soon', '⏰ Follow-up due', '🔥 Gone quiet', '💤 Engaged, quiet', '✨ New lead', '♨ Keep warm', '', '✓ Contacted recently', '🏭 Manufacturer branch', '⚪ Unprocessed'];
function whyInRows() { const P = dash.params(); const on = P.psort === 'next' || (!P.psort && !isHouse()); document.querySelectorAll('.cm-partner').forEach((row) => { const b = row.querySelector('[data-open-company]'); if (!b) return; let tg = row.querySelector('.cm-why');
  if (!on) { tg && tg.remove(); return; } const it = phItem(b.dataset.openCompany); const txt = !it ? '' : it.seq && SEQ_ON ? `🔁 Step ${it.seq.i + 1}/${it.seq.n} · ${{ whatsapp: 'WhatsApp', email: 'Email', call: 'Call' }[it.seq.ch] || ''}` : WHY_TAG[it.t] || '';
  if (!txt) { tg && tg.remove(); return; } if (!tg) { tg = __cm.el('span', `cm-why t${it.t}`); tg.title = 'Why it is here in the Power hour order'; b.after(tg); } if (tg.textContent !== txt) { tg.textContent = txt; tg.className = `cm-why t${it.t}`; } }); }
// ----- “How did it go?” after a call, WhatsApp or email from a Best partners row (same outcomes as Power hour) -----
let rowOut = null; let lastRow = { cid: '', at: 0 }; // the outcome bar survives the list redrawing
document.addEventListener('pointerdown', (e) => { const r = e.target.closest && e.target.closest('.cm-partner'); const b = r && r.querySelector('[data-open-company]'); if (b) lastRow = { cid: b.dataset.openCompany, at: Date.now() }; }, !0);
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me"], a[href*="mail.google.com"], a[href^="mailto:"]'); if (!a || a.closest('#cm-sheet')) return;
  const row = a.closest('.cm-partner'); const b = row && row.querySelector('[data-open-company]'); const cid = b ? b.dataset.openCompany : Date.now() - lastRow.at < 60e3 ? lastRow.cid : ''; if (!cid || __cm.curView() !== 'country') return;
  const ch = /^tel:/.test(a.href) ? 'Call' : /wa\.me/.test(a.href) ? 'WhatsApp' : 'Email';
  if (ch === 'Call') miLog({ action: 'Call', company_id: cid, outcome: `call to ${decodeURIComponent(a.href.replace(/^tel:/, ''))}` });
  rowOut = { cid, ch, at: Date.now() }; setTimeout(attachRowOut, 300); }, !0);
function attachRowOut() { if (!rowOut || Date.now() - rowOut.at > 20 * 60e3) { rowOut = null; return; } const { cid, ch } = rowOut; const row = [...document.querySelectorAll('.cm-partner')].find((r) => { const b = r.querySelector('[data-open-company]'); return b && b.dataset.openCompany === cid; }); if (!row || row.querySelector('.cm-rowout')) return;
  const el = __cm.el; const box = el('div', 'cm-rowout'); box.append(el('span', 'mut', `How did it go? (${ch})`));
  const note = el('input'); note.placeholder = 'Note · Enter = save';
  const save = (res) => { if (res) miLog({ action: 'Other', company_id: cid, outcome: `result: ${res} (${ch})` }); if (note.value.trim()) miLog({ action: 'Comment', company_id: cid, outcome: res ? `${res}: note` : 'note', text: note.value.trim() }); __cm.say(`Saved${res ? ` · ${res}` : ''}${res === 'Meeting set' ? ' — add it to the calendar from the company page' : ''}`); phWorked.add(cid); pqMemo.key = ''; rowOut = null; box.remove(); };
  ['No answer', 'Left message', 'Spoke', 'Meeting set', 'Not interested'].forEach((r) => { const c = el('button', 'cm-chip', r); c.type = 'button'; c.addEventListener('click', (ev) => { ev.stopPropagation(); save(r); }); box.append(c); });
  note.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); save(''); } }); note.addEventListener('click', (ev) => ev.stopPropagation()); note.addEventListener('input', () => { rowOut && (rowOut.note = note.value); }); if (rowOut.note) note.value = rowOut.note;
  const x = el('button', 'cm-mini', '✕'); x.type = 'button'; x.title = 'Skip'; x.addEventListener('click', (ev) => { ev.stopPropagation(); rowOut = null; box.remove(); }); box.append(note, x); row.append(box); }
// ----- Assignments (House) -----
function regionTags(kind, value) {
  const cs = __cm.rowsOf('countries'); const pick = kind === 'Region' ? cs.filter((c) => low(c.region) === low(value)) : String(value).split(/[, ]+/).map((v) => cs.find((c) => low(c.iso) === low(v) || low(c.country) === low(v))).filter(Boolean);
  return { tags: [...new Set(pick.flatMap((c) => String(c.crm_tags || c.country).split('|').map(low)))], names: pick.map((c) => c.country) };
}
const TAG_PRESETS = ['Email', 'Webforms', 'LinkedIn', 'Sample', 'Arab Health 23', 'Arab Health 24', 'MEDICA 23', 'MEDICA 24', 'Expomed 22', 'Alibaba', 'Medical Expo', 'Contacting', 'contacted', 'NEXT', 'Waybill', 'Global Trade Data', 'Xray', 'GOOGLE MAP', 'Whatsapp Contacted', 'WHX MIAMI', 'needs contact', 'no website', 'social evidence'];
const RULE_KINDS = [['Region', '🌍', 'A whole region'], ['Country', '🏳️', 'One or more countries'], ['Tag', '🏷', 'Companies with a tag'], ['Status', '📈', 'Companies at a stage'], ['Batch', '📋', 'Companies you ticked'], ['Company', '🏢', 'One company']];
function openAssignments(anchor) {
  const C = __cm; const el = C.el; const d0 = { person: '', type: 'Country', isos: new Set(), region: '', tag: '', status: '', company: null, batch: '', q: '' }; let dr = { ...d0, isos: new Set() };
  const cs = () => C.rowsOf('countries'); const pipe = () => C.rowsOf('pipeline_stages').length ? C.rowsOf('pipeline_stages') : C.rowsOf('companies'); const index = () => C.rowsOf('company_index');
  const isoOf = (() => { let m = null, src = null; return (name) => { const c0 = cs(); if (src !== c0) { m = new Map(); c0.forEach((c) => String(c.crm_tags || c.country).split('|').forEach((t) => m.set(low(t), c.iso))); m.set(low('türkiye'), 'TR'); src = c0; } return m.get(low(name)); }; })();
  const isoRow = (r) => r.iso || isoOf(String(r.country || '').split(/ \| |, /)[0]);
  const perIso = () => { const m = new Map(); (index().length ? index() : pipe()).forEach((r) => { const iso = isoRow(r); iso && m.set(iso, (m.get(iso) || 0) + 1); }); return m; };
  C.openSheet(anchor, '🗂 Assignments', (body) => {
    const ppl = miPeople().filter((p) => p.active); const st = dash.data('medint_assign'); const cnt = perIso();
    const sec = (n, t) => { const x = el('div', 'cm-asec'); x.append(el('div', 'k', `${n} · ${t}`)); body.append(x); return x; };
    // 1 who
    const s1 = sec(1, 'Who'); const pr = el('div', 'cm-chips');
    ppl.forEach((p) => { const b = el('button', 'cm-chip cm-pchip'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.person === p.name)); b.append(el('span', 'cm-asg', initials(p.name)), ` ${p.name}`, el('span', 'mut', ` · ${p.role}`)); b.addEventListener('click', () => { dr.person = p.name; C.sheetDraw(); }); pr.append(b); });
    s1.append(pr);
    // 2 what
    const s2 = sec(2, 'Assign by'); const tg = el('div', 'cm-atiles');
    RULE_KINDS.forEach(([k, ic, t]) => { const b = el('button', 'cm-atile'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.type === k)); b.append(el('span', 'i', ic), el('b', null, k === 'Country' ? 'Countries' : k), el('span', 'mut', t)); b.addEventListener('click', () => { dr = { ...d0, isos: new Set(), person: dr.person, type: k }; C.sheetDraw(); }); tg.append(b); });
    s2.append(tg);
    // 3 choose
    const s3 = sec(3, { Region: 'Pick a region', Country: 'Tick countries', Tag: 'Pick a tag', Status: 'Pick a stage', Batch: 'Name the batch', Company: 'Find the company' }[dr.type]);
    const regions = [...new Set(cs().map((c) => c.region).filter(Boolean))].sort();
    let covered = 0, label = '';
    if (dr.type === 'Region') {
      const g = el('div', 'cm-rgrid'); regions.forEach((rg) => { const list = cs().filter((c) => c.region === rg); const n = list.reduce((a, c) => a + (cnt.get(c.iso) || 0), 0);
        const b = el('button', 'cm-rcard'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.region === rg)); b.append(el('b', null, rg), el('div', 'fl', list.slice(0, 14).map((c) => C.flag(c.iso)).join('') + (list.length > 14 ? ' …' : '')), el('span', 'mut', `${list.length} countries · ${n.toLocaleString('en')} companies`));
        b.addEventListener('click', () => { dr.region = rg; C.sheetDraw(); }); g.append(b); if (dr.region === rg) { covered = n; label = rg; } });
      s3.append(g);
    } else if (dr.type === 'Country') {
      const q = el('input', 'cm-asearch'); q.placeholder = '🔎 Search a country…'; q.value = dr.q; q.addEventListener('input', () => { dr.q = q.value; const pos = q.selectionStart; C.sheetDraw(); const q2 = document.querySelector('#cm-sheet .cm-asearch'); if (q2) { q2.focus(); q2.setSelectionRange(pos, pos); } }); s3.append(q);
      const wrap = el('div', 'cm-cpick');
      regions.forEach((rg) => { const list = cs().filter((c) => c.region === rg && (!dr.q || low(c.country).includes(low(dr.q)) || low(c.iso) === low(dr.q))).sort((x, y) => (cnt.get(y.iso) || 0) - (cnt.get(x.iso) || 0)); if (!list.length) return;
        const hd = el('div', 'rh'); hd.append(el('b', null, rg)); const all = list.every((c) => dr.isos.has(c.iso)); const ab = el('button', 'cm-mini', all ? 'clear' : 'all'); ab.type = 'button'; ab.addEventListener('click', () => { list.forEach((c) => (all ? dr.isos.delete(c.iso) : dr.isos.add(c.iso))); C.sheetDraw(); }); hd.append(ab); wrap.append(hd);
        const row = el('div', 'cm-chips'); list.forEach((c) => { const b = el('button', 'cm-chip'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.isos.has(c.iso))); b.append(`${C.flag(c.iso)} ${c.country}`, el('span', 'mut', ` ${cnt.get(c.iso) || 0}`)); b.addEventListener('click', () => { dr.isos.has(c.iso) ? dr.isos.delete(c.iso) : dr.isos.add(c.iso); C.sheetDraw(); }); row.append(b); }); wrap.append(row); });
      s3.append(wrap); covered = [...dr.isos].reduce((a, iso) => a + (cnt.get(iso) || 0), 0); label = [...dr.isos].map((iso) => (cs().find((c) => c.iso === iso) || {}).country).filter(Boolean).join(', ');
    } else if (dr.type === 'Tag') {
      const seen = new Map(); C.rowsOf('companies').forEach((c) => String(c.tags || '').split(/ \| |\|/).filter(Boolean).forEach((t) => seen.set(t, (seen.get(t) || 0) + 1)));
      const row = el('div', 'cm-chips'); [...new Set([...TAG_PRESETS, ...seen.keys()])].forEach((t) => { const b = el('button', 'cm-chip'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.tag === t)); b.append(`🏷 ${t}`, seen.get(t) ? el('span', 'mut', ` ${seen.get(t)} here`) : ''); b.addEventListener('click', () => { dr.tag = t; C.sheetDraw(); }); row.append(b); });
      s3.append(row); label = dr.tag; covered = dr.tag ? null : 0;
    } else if (dr.type === 'Status') {
      const F2 = { Status: 'status', 'NEXT Status': 'next_status', 'Motion Status': 'motion_status' };
      Object.entries(F2).forEach(([fld, col]) => { const opts = C.rowsOf('company_fields').filter((r) => r.field === fld).map((r) => r.option); if (!opts.length) return; const n = new Map(); pipe().forEach((r) => r[col] && n.set(r[col], (n.get(r[col]) || 0) + 1));
        s3.append(el('div', 'rh', fld)); const row = el('div', 'cm-chips'); opts.forEach((o) => { const v = `${fld}: ${o}`; const b = el('button', 'cm-chip'); b.type = 'button'; b.setAttribute('aria-pressed', String(dr.status === v)); b.append(o, el('span', 'mut', ` ${n.get(o) || 0}`)); b.addEventListener('click', () => { dr.status = v; C.sheetDraw(); }); row.append(b); if (dr.status === v) { covered = n.get(o) || 0; } }); s3.append(row); });
      label = dr.status;
    } else if (dr.type === 'Batch') {
      const sel = [...(C.selIds || [])]; const shown = [...document.querySelectorAll('.cm-partner [data-open-company]')].map((b) => b.dataset.openCompany); dr.ids = sel.length ? sel : shown;
      const nm = el('input', 'cm-asearch'); nm.placeholder = 'Batch name, e.g. “Peru top 40”'; nm.value = dr.batch; nm.addEventListener('input', () => { dr.batch = nm.value; }); s3.append(nm);
      const names = dr.ids.map((id) => (pipe().find((r) => r.id === id) || C.companyById(id) || {}).company).filter(Boolean);
      s3.append(el('p', 'mut', dr.ids.length ? `${dr.ids.length} companies — ${sel.length ? 'the ones you ticked in Best partners' : 'the ones shown in Best partners now (tick some to choose exactly)'}: ${names.slice(0, 8).join(', ')}${names.length > 8 ? '…' : ''}` : 'Open a country, tick companies in Best partners (☐ at the top), then come back here.'));
      covered = dr.ids.length; label = dr.batch;
    } else {
      const q = el('input', 'cm-asearch'); q.placeholder = '🔎 Type a company name…'; q.value = dr.q; q.addEventListener('input', () => { dr.q = q.value; const pos = q.selectionStart; C.sheetDraw(); const q2 = document.querySelector('#cm-sheet .cm-asearch'); if (q2) { q2.focus(); q2.setSelectionRange(pos, pos); } }); s3.append(q);
      if (dr.company) s3.append(el('div', 'cm-asel', `✓ ${dr.company.name}`));
      if (low(dr.q).length >= 2) { const list = el('div', 'cm-alist'); (index().length ? index() : pipe()).filter((r) => low(r.company).includes(low(dr.q))).slice(0, 12).forEach((r) => { const iso = isoRow(r); const b = el('button', 'cm-co'); b.type = 'button'; b.textContent = `${iso ? C.flag(iso) : ''} ${r.company}${r.city ? ` · ${String(r.city).split(',')[0]}` : ''}`; b.addEventListener('click', () => { dr.company = { id: r.id, name: r.company }; dr.q = ''; C.sheetDraw(); }); list.append(b); }); s3.append(list); }
      covered = dr.company ? 1 : 0; label = dr.company ? dr.company.name : '';
    }
    // preview + add
    const pv = el('div', 'cm-apv'); const ok = dr.person && (dr.type === 'Region' ? dr.region : dr.type === 'Country' ? dr.isos.size : dr.type === 'Tag' ? dr.tag : dr.type === 'Status' ? dr.status : dr.type === 'Batch' ? dr.batch && dr.ids && dr.ids.length : dr.company);
    pv.append(el('span', null, ok ? `👥 ${dr.person} will work ${covered == null ? 'every company tagged' : `${covered.toLocaleString('en')} compan${covered === 1 ? 'y' : 'ies'}`} · ${dr.type === 'Country' ? 'Countries' : dr.type}: ${label}` : dr.person ? 'Choose what to assign above.' : 'Start by choosing who.'));
    const add = el('button', 'cm-btn', 'Add rule'); add.type = 'button'; add.disabled = !ok; const hint = el('span', 'hint');
    add.addEventListener('click', async () => {
      const fields = { Person: dr.person, 'Rule type': dr.type, Active: 'Active' };
      if (dr.type === 'Region' || dr.type === 'Country') { const t = regionTags(dr.type, dr.type === 'Region' ? dr.region : [...dr.isos].join(',')); fields.Value = dr.type === 'Region' ? dr.region : [...dr.isos].join(', '); fields['Country tags'] = t.tags.join('\n'); fields.Notes = t.names.join(', '); }
      else if (dr.type === 'Tag') fields.Value = dr.tag; else if (dr.type === 'Status') fields.Value = dr.status;
      else if (dr.type === 'Batch') { fields.Value = dr.batch; fields.Companies = dr.ids.slice(0, 500); } else { fields.Value = dr.company.name; fields.Companies = [dr.company.id]; }
      fields.Name = `${dr.type} · ${fields.Notes || fields.Value} → ${dr.person}`.slice(0, 200);
      add.disabled = !0; try { await C.nhCall('create_record', { folderId: MI.ASSIGN, fieldKeys: 'label', fields }); miLog({ action: 'Assignment', outcome: fields.Name }); C.say('✓ Rule added'); dr = { ...d0, isos: new Set(), person: dr.person, type: dr.type }; dash.refresh('medint_assign'); } catch (e) { hint.textContent = `Not saved — ${C.nhErr(e)}`; add.disabled = !1; }
    });
    pv.append(add, hint); body.append(pv);
    // rules by person
    const s4 = sec(4, 'Current rules');
    if ('ok' !== st.status) { s4.append(el('div', 'hint', 'error' === st.status ? 'Couldn’t read the rules from NetHunt.' : 'Loading…')); return; }
    if (!st.data.length) s4.append(el('div', 'hint', 'No rules yet — everything is unassigned and only House sees it.'));
    const dup = {}; st.data.filter((r) => r.active).forEach((r) => { const k = `${r.type}|${low(r.value)}`; dup[k] = (dup[k] || 0) + 1; });
    const ICON = Object.fromEntries(RULE_KINDS.map(([k, ic]) => [k, ic]));
    [...new Set(st.data.map((r) => r.person))].sort().forEach((p) => {
      const g = el('div', 'cm-rgroup'); const hd = el('div', 'rh'); hd.append(el('span', 'cm-asg', initials(p)), el('b', null, ` ${p}`)); g.append(hd);
      st.data.filter((r) => r.person === p).sort((x, y) => (y.active - x.active) || (SPEC[y.type] || 0) - (SPEC[x.type] || 0)).forEach((r) => {
        const row = el('div', 'cm-rule'); const t = el('div'); let txt = r.value;
        if (r.type === 'Country') txt = String(r.value).split(/[, ]+/).filter(Boolean).map((v) => { const c = cs().find((x) => low(x.iso) === low(v) || low(x.country) === low(v)); return c ? `${C.flag(c.iso)} ${c.country}` : v; }).join(', ');
        if (r.type === 'Region') { const fl = cs().filter((c) => c.region === r.value).slice(0, 10).map((c) => C.flag(c.iso)).join(''); txt = `${r.value} ${fl}`; }
        t.append(`${ICON[r.type] || ''} ${txt}`); if (r.ids) t.append(el('span', 'm', ` · ${r.ids.split('|').length} companies`));
        if (r.active && dup[`${r.type}|${low(r.value)}`] > 1) t.append(el('div', 'm', '⚠ The same rule exists for another person — the older one wins.'));
        const b = el('button', 'cm-mini', r.active ? 'Pause' : 'Resume'); b.type = 'button'; b.addEventListener('click', async () => { try { await C.nhCall('update_record', { folderId: MI.ASSIGN, recordId: r.id, fieldKeys: 'label', fields: { Active: r.active ? 'Paused' : 'Active' } }); miLog({ action: 'Assignment', outcome: `${r.active ? 'Paused' : 'Resumed'}: ${r.name}` }); dash.refresh('medint_assign'); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); } });
        if (!r.active) row.style.opacity = '.5'; row.append(t, b); g.append(row); });
      s4.append(g); });
    const w = el('button', 'cm-btn ghost', '↻ Write “Assigned to” in NetHunt for the companies open now'); w.type = 'button'; const wm = el('span', 'hint');
    w.addEventListener('click', async () => { const cos = C.rowsOf('companies'); let n = 0; w.disabled = !0; for (const c of cos) { const a = assigneeOf(c.id) || ''; if ((c.assigned_to || '') === a) continue; try { await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: c.id, fieldKeys: 'label', fields: { 'Assigned to': a || null } }); c.assigned_to = a; n += 1; wm.textContent = `${n} updated…`; } catch { /* keep going */ } } wm.textContent = `✓ ${n} companies updated`; w.disabled = !1; });
    s4.append(w, wm);
  }, { wide: !0, center: !0 });
}
// Power hour for House: choose whose companies
function phFor() { return dash.params().phfor || ''; }

// ---- translate a message in place (website: Medint's own translator; Claude: ask Claude, else Google Translate) ----
const trCache = new Map();
async function translateText(t) {
  if (trCache.has(t)) return trCache.get(t);
  let out = null;
  if (window.cmBoot) { const r = await fetch(`/api/translate?q=${encodeURIComponent(t.slice(0, 1500))}&from=${guessLang(t, 'en')}`, { credentials: 'same-origin' }); if (r.ok) out = (await r.json()).text || null; }
  else { try { const sm = window.claude && (await window.claude.use('sample')); if (sm) out = (await sm(`Translate this message to English. Reply with the translation only.\n\n${t.slice(0, 1500)}`, { modelTier: 'quick' })).text.trim(); } catch { /* not available here */ } }
  out && trCache.set(t, out); return out;
}
function translateBtn(text, holder) {
  const b = __cm.el('button', 'cm-mini cm-phtr', '🌐 Translate'); b.type = 'button'; let shown = !1; const orig = holder.firstChild ? holder.firstChild.textContent : `“${text}”`;
  b.addEventListener('click', async () => {
    const node = holder.firstChild;
    if (shown) { node.textContent = orig; b.textContent = '🌐 Translate'; shown = !1; return; }
    b.textContent = '…'; let tr = null; try { tr = await translateText(text); } catch { /* fall back below */ }
    if (!tr) { const w = 520, hh = 420; window.open(`https://translate.google.com/?sl=auto&tl=en&op=translate&text=${encodeURIComponent(text)}`, 'medint-translate', `popup=yes,width=${w},height=${hh},left=${Math.max(0, (screen.width - w) / 2)},top=${Math.max(0, (screen.height - hh) / 3)}`); b.textContent = '🌐 Translate'; return; }
    node.textContent = `“${tr}” `; b.textContent = 'Show original'; shown = !0;
  });
  return b;
}
// House: People & access and the Medint log in the top bar (where the build number was; it stays as a tooltip)
function meChip() {
  const v = document.querySelector('.cm-build'); if (!v || !miWho) return; let c = v.parentElement.querySelector('.cm-mechip'); const m = me(); const sig = `${m.name}|${m.role}|${m.email}`;
  if (c && c.dataset.sig === sig) return; c && c.remove();
  c = __cm.el('button', 'cm-chip cm-mechip'); c.type = 'button'; c.dataset.sig = sig; c.append(avatarEl(m.name, m.email, '', ''), el2('span', 'nm', m.name), el2('span', 'rl', m.role === 'House' ? 'House' : 'Person'));
  c.title = `Logged in as ${m.email || m.name} · ${m.role}`;
  c.addEventListener('click', () => __cm.openMenu(c, [{ icon: '👤', label: `${m.name} · ${m.role}`, sub: m.email || 'Claude dashboard' }, ...(m.role === 'House' ? [] : [{ icon: '🗂', label: 'Sees only the companies assigned to them', sub: 'set by House under 👥 People → 🗂 Assignments' }]), ...(window.cmBoot ? [{ icon: '🚪', label: 'Log out', act: () => { location.href = '/cdn-cgi/access/logout'; } }] : [])]));
  v.after(c);
}
const el2 = (t, c, x) => __cm.el(t, c, x);
function houseBar() {
  try { meChip(); } catch { /* top bar not ready */ }
  const v = document.querySelector('.cm-build'); if (!v) return;
  const has = v.parentElement.querySelector('.cm-housebar');
  if (!isHouse()) { has && has.remove(); v.hidden = !1; return; }
  if (has) return;
  const bar = __cm.el('span', 'cm-housebar'); bar.title = v.textContent;
  [['👥 People', 'People & access', openPeople], ['🧾 Log', 'Medint log & scoreboard', openLog]].forEach(([t, ti, fn]) => { const b = __cm.el('button', 'cm-chip', t); b.type = 'button'; b.title = `${ti} · ${v.textContent}`; b.addEventListener('click', () => fn(b)); bar.append(b); });
  v.hidden = !0; v.after(bar);
}

// the Power hour header controls belong to Power hour only
function accessNotice() {
  const bad = window.cmBoot && miWho && (miWho.role === 'Unknown' || miWho.active === false); const n = document.getElementById('cm-access');
  if (!bad) { n && n.remove(); return; } if (n) return;
  const d = __cm.el('div', 'cm-accessnote'); d.id = 'cm-access'; d.textContent = `🔒 ${miWho.email || 'This login'} ${miWho.role === 'Unknown' ? 'isn’t set up' : 'is paused'} in Medint yet — ask House to add you under 👥 People. Until then no companies are shown.`; document.body.prepend(d);
}
// a Person opening a company that isn't theirs (old link, shared link): say so instead of an empty page
function companyDenied() {
  const v = document.getElementById('company'); if (!v) return; const n = v.querySelector('.cm-denied');
  const d = __cm.curView() === 'company' ? dash.data('company_record') : null; const no = d && d.status === 'error' && /not assigned|isn’t active/i.test(String(d.message || (d.error && (d.error.message || d.error)) || ''));
  if (!no) { n && n.remove(); return; } if (n) return;
  const x = __cm.el('div', 'cm-accessnote cm-denied', '🔒 This company is assigned to someone else, so it isn’t shown to you. Ask House if you need it.'); v.prepend(x);
}
// company page: the 📍 address opens Google Maps (the app on phones)
function linkAddress() {
  if (__cm.curView() !== 'company') return; const ad = document.querySelector('#company-view .cm-caddr, .cm-caddr'); if (!ad || ad.querySelector('a')) return;
  const cid = dash.params().cid; const rec = dash.data('company_record'); const F = new Map('ok' === rec.status ? rec.data.map((r) => [r.field, r.value]) : []);
  const place = __cm.rowsOf('maps_places').find((p) => p.id === cid); const gm = String(F.get('Google Maps') || (place && place.url) || '').trim();
  const text = ad.textContent.replace(/^📍\s*/, ''); const name = F.get('Name') || (document.querySelector('.cm-cname') || {}).textContent || '';
  const url = /^https?:/i.test(gm) ? gm : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${text}`.trim())}`;
  const a = __cm.el('a', 'cm-maplink'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = 'Open in Google Maps'; a.textContent = `📍 ${text}`; ad.replaceChildren(a);
}
// company header: time card on the right; ⚡ Power hour and the score beside the name; statuses on the sub line; related · ignore · add missing · assigned on one line; Send from next to the icons
function companyLayout() {
  if (__cm.curView() !== 'company') return; const top = document.getElementById('company'); if (!top) return;
  const h1 = top.querySelector('.cm-cname'); if (!h1) return;
  let row = h1.parentElement.classList.contains('cm-cnamerow') ? h1.parentElement : null;
  if (!row) { row = __cm.el('div', 'cm-cnamerow'); h1.before(row); row.append(h1); }
  let side = top.querySelector(':scope > .cm-cside'); if (!side) { side = __cm.el('div', 'cm-cside'); top.append(side); } row.querySelectorAll('.cm-cside').forEach((x) => x !== side && x.remove());
  const cph = top.querySelector('.cm-cph'); if (cph && cph.parentElement !== side) side.prepend(cph);
  const fresh = [...top.querySelectorAll('.cm-cscore')].find((x) => x.parentElement !== side); if (fresh) { side.querySelectorAll('.cm-cscore').forEach((x) => x.remove()); const ph = side.querySelector('.cm-cph'); ph ? ph.after(fresh) : side.prepend(fresh); }
  { const iso = window.cmCompanyIso; const mi = dash.data('market_intel'); const sig = `${iso}|${mi.status}`; let tl = side.querySelector('.cm-trline'); if (!iso || iso === 'TR') { tl && tl.remove(); } else if (!tl || tl.dataset.sig !== sig) { tl && tl.remove(); tl = tradeLineEl(iso); tl.dataset.sig = sig; side.append(tl); } }
  { const ph = side.querySelector('.cm-cph'), sc = side.querySelector('.cm-cscore'); if (ph && sc && ph.nextElementSibling !== sc) ph.after(sc); const tl = side.querySelector('.cm-trline'); if (tl && tl !== side.lastElementChild) side.append(tl); }
  const sub = top.querySelector('.cm-csub'); const pills = top.querySelector('.cm-cpills');
  if (sub && pills) { const anchor = [...sub.children].find((x) => x.tagName === 'DIV'); [...pills.querySelectorAll('.cm-tag')].filter((t) => /^(NEXT |Motion )?Status:/.test(t.textContent)).forEach((t) => { t.classList.add('cm-stmoved'); anchor ? anchor.before(t) : sub.append(t); }); }
  const idn = top.querySelector('.cm-idn'); const qa = top.querySelector('.cm-cqa'); if (idn && qa && idn.parentElement !== qa) qa.append(idn);
  const wrap = sub && [...sub.children].find((x) => x.tagName === 'DIV' && x.querySelector('.cm-related')); if (wrap) wrap.classList.add('cm-cline');
}
// Power hour: the right column reaches exactly to the bottom of the pop-up; People keeps ~3 rows, Recent activity takes the rest and scrolls
function phFit() {
  const sh = document.getElementById('cm-sheet'); if (!sh || sh.hidden || !sh.classList.contains('center')) return; const side = sh.querySelector('.cm-ph2 > .side'); const sb = sh.querySelector('.sb'); if (!side || !sb) return;
  if (window.innerWidth <= 760) { if (side.style.maxHeight) side.style.maxHeight = ''; return; }
  const top = Math.max(side.getBoundingClientRect().top, sb.getBoundingClientRect().top); const h = Math.floor(sb.getBoundingClientRect().bottom - top - 12); const v = `${Math.max(240, h)}px`; if (side.style.maxHeight !== v) side.style.maxHeight = v;
}
window.addEventListener('resize', () => { try { phFit(); } catch { /* closed */ } });
function phCtlTidy() { const t = document.getElementById('cm-sheet-title'); const c = document.querySelector('#cm-sheet .cm-phctl'); if (c && (!t || !/⚡/.test(t.textContent) || document.getElementById('cm-sheet').hidden)) c.remove(); }
// one watcher for the page: at most once per frame, whatever changed
let pageT = 0; new MutationObserver(() => { if (pageT) return; pageT = requestAnimationFrame(() => { pageT = 0; for (const f of [decoratePartners, houseBar, phCtlTidy, accessNotice, companyDenied, drawCongress, drawCongressPage, linkAddress, avatarize, drawTripPage, drawHome, maybeAskPlan, phMini, companyLayout, brandsFromImports, compactCompany, countryTradeLine, phFit, ...(window.__m3 ? [personEditButtons, cgAugment, actLogKick] : []), ...(window.__cm3 && window.__cm3.watch ? window.__cm3.watch : []), ...(window.__cm3 ? [window.__cm3.countryRegChip] : [])]) { try { f(); } catch { /* part of the page redrawing */ } } }); }).observe(document.body, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ['hidden'] });
// ---- 🎪 Congresses per country (country Overview) ----
let cgKey = '';
function drawCongress() {
  const box = document.querySelector('#congress .cm-cg'); if (!box) return;
  const iso = dash.params().iso; if (__cm.curView() !== 'country' || !iso) return;
  const d = dash.data('congresses'); const key = `${iso}|${d.status}|${d.data ? d.data.length : 0}|${new Date().toDateString()}`; if (key === cgKey) return; cgKey = key;
  const el = __cm.el; box.replaceChildren(); const cnt = document.querySelector('#congress .cm-cg-count');
  if ('ok' !== d.status) { box.append(el('div', 'hint', 'error' === d.status ? 'Couldn’t load the congress list.' : 'Loading…')); return; }
  const logos = new Map(); d.data.forEach((r) => r.logo && logos.set(r.dom, r.logo));
  const mine = d.data.filter((r) => r.iso === iso); const today = new Date().toISOString().slice(0, 10);
  const series = [...new Set(mine.map((r) => r.event_id))]; cnt && (cnt.textContent = series.length ? `${series.length} series` : '');
  if (!mine.length) { box.append(el('div', 'hint', 'No congress recorded for this country yet (research is still incomplete here).')); return; }
  const fmt = (a, b) => { const o = { day: 'numeric', month: 'short' }; if (!a) return ''; const A = new Date(a), B = b ? new Date(b) : A; return A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear() ? `${A.getDate()}${b && b !== a ? `–${B.getDate()}` : ''} ${A.toLocaleDateString('en-GB', { month: 'short' })} ${A.getFullYear()}` : `${A.toLocaleDateString('en-GB', o)} – ${B.toLocaleDateString('en-GB', o)} ${B.getFullYear()}`; };
  const hue = (t) => { let x = 0; for (const c of String(t)) x = (x * 31 + c.charCodeAt(0)) % 360; return `hsl(${x} 45% 42%)`; };
  const row = (r, kind) => {
    const w = el('div', `cm-cgrow ${kind}`); const lg = el('span', 'lg'); const lo = logos.get(r.dom);
    if (lo) { const im = el('img'); im.src = lo; im.alt = ''; lg.style.background = '#fff'; lg.append(im); } else { lg.style.background = hue(r.series); lg.textContent = (r.series.match(/\b[A-Z]{2,6}\b/) || [r.series.slice(0, 2)])[0].slice(0, 4); }
    const nm = el('span', 'nm'); const a = el('a'); a.href = r.url || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = `${r.series}${r.edition ? ` · ${r.edition}` : ''}`; a.title = r.organizer || r.series; nm.append(a);
    const days = r.start ? Math.round((new Date(r.start) - new Date(today)) / 864e5) : null;
    const wh = el('span', `when ${kind === 'past' ? 'past' : days != null && days <= 120 ? 'soon' : 'later'}`, r.start ? `${fmt(r.start, r.end)}${kind !== 'past' && days != null ? ` · ${days <= 0 ? 'now' : `in ${days} d`}` : ''}` : (r.year ? String(r.year) : 'date tbc'));
    const sub = [r.city, r.venue, r.scope && r.scope !== 'National' ? `🌍 ${r.scope}` : '', r.size, /exhib|sponsor|stand|booth|expo/i.test(r.exhibition) && !/not mention|not found|none/i.test(r.exhibition) ? '🏪 exhibition / sponsors' : '', r.email ? `✉ ${r.email}` : ''].filter(Boolean).join(' · ');
    w.append(lg, nm, wh); sub && w.append(el('div', 'sub', sub)); return w;
  };
  const up = mine.filter((r) => r.start && (r.end || r.start) >= today).sort((x, y) => x.start.localeCompare(y.start));
  const past = mine.filter((r) => r.start && (r.end || r.start) < today).sort((x, y) => y.start.localeCompare(x.start));
  const lastPer = new Map(); past.forEach((r) => !lastPer.has(r.event_id) && lastPer.set(r.event_id, r));
  const tbc = series.filter((s) => !up.some((r) => r.event_id === s) && !lastPer.has(s)).map((s) => mine.find((r) => r.event_id === s));
  if (up.length) { box.append(el('div', 'cm-cgk', 'Next')); up.slice(0, 3).forEach((r) => box.append(row(r, 'next'))); }
  else { const l0 = past[0]; box.append(el('div', 'hint', l0 ? `No next date published yet — the last one was ${new Date(l0.start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}${/annual|yearly|every year/i.test(l0.frequency) || !l0.frequency || /not verified/i.test(l0.frequency) ? `, so expect around ${new Date(l0.start).toLocaleDateString('en-GB', { month: 'long' })} ${new Date(l0.start).getFullYear() + 1}` : ''}.` : 'No date recorded yet.')); }
  const lasts = [...lastPer.values()].slice(0, up.length ? 2 : 3); if (lasts.length) { box.append(el('div', 'cm-cgk', 'Last edition')); lasts.forEach((r) => box.append(row(r, 'past'))); }
  const rest = [...up.slice(3), ...[...lastPer.values()].slice(lasts.length), ...tbc];
  if (rest.length) { const m = el('details', 'cm-cgmore'); m.append(el('summary', null, `+ ${rest.length} more`)); rest.forEach((r) => m.append(row(r, r.start && (r.end || r.start) < today ? 'past' : 'next'))); box.append(m); }
}

// ===================== 🎪 Congresses & exhibitions page =====================
const CG_CATS = ['Trauma', 'Joints', 'Sports', 'Spine', 'Shoulder & elbow', 'Foot & ankle', 'Hand', 'Pediatric', 'Oncology', 'General'];
const CG_FOR = { dunitech: ['Trauma'], next: ['Shoulder & elbow', 'Joints'], motion: ['Trauma', 'Sports'] };
const CG_LV = { National: '#3fae7a', Regional: '#4f8cff', Global: '#e39b2d' };
const CG_LVL = { going: ['✈', 'Going'], maybe: ['🤔', 'Maybe'], follow: ['⭐', 'Following'] };
const cgStar = (id) => (__cm.cgStars || {})[id] || null;
function cgToggle(id, kind) { const st = { ...(__cm.cgStars || {}) }; if (st[id]) delete st[id]; else st[id] = { level: 'follow', kind, at: new Date().toISOString().slice(0, 10) }; __cm.cgStars = st; cgKey2 = ''; }
function cgSetLevel(id, level) { const st = { ...(__cm.cgStars || {}) }; if (st[id]) st[id] = { ...st[id], level }; __cm.cgStars = st; cgKey2 = ''; }
const cgS = { tab: 'events', level: '', cats: new Set(), brand: '', when: 'next12', q: '', iso: '', area: '', sort: 'date', exh: !1, more: 60 };
let cgKey2 = '';
function cgSeries(rows) { // one entry per congress series: next and last edition, how often
  const today = new Date().toISOString().slice(0, 10); const m = new Map();
  rows.forEach((r) => { const s = m.get(r.event_id) || { id: r.event_id, series: r.series, iso: r.iso, country: r.country, level: r.level, cats: r.cats.split('|'), organizer: r.organizer, org_type: r.org_type, frequency: r.frequency, email: r.email, dom: r.dom, url: r.url, scope: r.scope, exhibition: r.exhibition, eds: [] }; s.eds.push(r); m.set(r.event_id, s); });
  m.forEach((s) => { const dated = s.eds.filter((e) => e.start).sort((a, b) => a.start.localeCompare(b.start)); s.next = dated.find((e) => (e.end || e.start) >= today) || null; s.last = [...dated].reverse().find((e) => (e.end || e.start) < today) || null;
    const ys = [...new Set(dated.map((e) => Number(e.start.slice(0, 4))))]; const gaps = ys.slice(1).map((y, k) => y - ys[k]);
    s.often = /annual|yearly/i.test(s.frequency) ? 'Every year' : /bienn|every 2|two years/i.test(s.frequency) ? 'Every 2 years' : /trienn|every 3/i.test(s.frequency) ? 'Every 3 years' : gaps.length && gaps.every((g) => g === 1) ? 'Every year' : gaps.length && gaps.every((g) => g === 2) ? 'Every 2 years' : dated.length > 1 && dated.some((e, k) => k && e.start.slice(0, 4) === dated[k - 1].start.slice(0, 4)) ? 'Several a year' : '';
    const sz = s.eds.find((e) => e.participants || e.exhibitors) || {}; s.participants = sz.participants || null; s.exhibitors = sz.exhibitors || null; s.sizeText = (s.eds.find((e) => e.size) || {}).size || '';
    s.logo = (s.eds.find((e) => e.logo) || {}).logo || ''; });
  return [...m.values()];
}
function drawCongressPage() {
  const root = document.getElementById('congress-view'); if (!root || root.classList.contains('cm-hidden')) return;
  const d = dash.data('congresses'); const wd = dash.data('world_shapes');
  const key = `${d.status}|${wd.status}|${JSON.stringify({ ...cgS, cats: [...cgS.cats] })}|${JSON.stringify(__cm.cgStars || {})}`; if (key === cgKey2 && root.childNodes.length) return; cgKey2 = key;
  const C = __cm; const el = C.el; root.replaceChildren();
  const wrap = el('div', 'cm-cgp'); root.append(wrap);
  if ('ok' !== d.status) { wrap.append(el('div', 'hint', 'error' === d.status ? 'Couldn’t load the congress list.' : 'Loading congresses…')); return; }
  const logos = new Map(); d.data.forEach((r) => r.logo && logos.set(r.dom, r.logo));
  const all = cgSeries(d.data); const today = new Date(); const t0 = today.toISOString().slice(0, 10);
  const inDays = (dt) => Math.round((new Date(dt) - new Date(t0)) / 864e5);
  // header
  const hd = el('div', 'cm-cghd'); const up12 = all.filter((s) => s.next && inDays(s.next.start) <= 365).length;
  hd.append(el('h1', null, '🎪 Congresses & exhibitions'), el('div', 'mut', `${all.length} congress series · ${new Set(all.map((s) => s.iso)).size} countries · ${up12} in the next 12 months`)); wrap.append(hd);
  const tabs = el('div', 'cm-chips cm-cgtabs'); [['events', '📅 Congresses'], ['assoc', '🏛 Associations'], ['exh', '🏪 Exhibitors'], ['mine', `⭐ My list${Object.keys(__cm.cgStars || {}).length ? ` · ${Object.keys(__cm.cgStars || {}).length}` : ''}`]].forEach(([k, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(cgS.tab === k)); b.addEventListener('click', () => { cgS.tab = k; drawCongressPage(); }); tabs.append(b); }); wrap.append(tabs);
  // filters
  const fl = el('div', 'cm-cgfl');
  const sel = (opts, val, on, title) => { const x = el('select', 'cm-phtpl'); x.title = title; opts.forEach(([v, l]) => x.append(new Option(l, v))); x.value = val; x.addEventListener('change', () => on(x.value)); return x; };
  const q = el('input', 'cm-asearch'); q.placeholder = '🔎 Congress, association or city…'; q.value = cgS.q; q.addEventListener('input', () => { cgS.q = q.value; const pos = q.selectionStart; cgKey2 = ''; drawCongressPage(); const q2 = document.querySelector('#congress-view .cm-asearch'); q2 && (q2.focus(), q2.setSelectionRange(pos, pos)); });
  fl.append(q, sel([['', 'All levels'], ['National', '🟢 National'], ['Regional', '🔵 Regional'], ['Global', '🟠 Worldwide']], cgS.level, (v) => { cgS.level = v; drawCongressPage(); }, 'National, regional or worldwide'),
    sel([['next12', 'Next 12 months'], ['next3', 'Next 3 months'], ['past', 'Past'], ['all', 'All dates']], cgS.when, (v) => { cgS.when = v; drawCongressPage(); }, 'When'),
    sel([['', 'All our brands'], ['dunitech', 'For Dunitech (trauma)'], ['next', 'For Next Shoulder (shoulder, joints)'], ['motion', 'For Motion Medical']], cgS.brand, (v) => { cgS.brand = v; drawCongressPage(); }, 'Relevant for'));
  // where: a region, our trip, a saved group, or the countries where we already work
  const cs = C.rowsOf('countries'); const regions = [...new Set(cs.map((c) => c.region).filter(Boolean))].sort();
  const active = new Set(C.rowsOf('pipeline_stages').filter((r) => (r.stage_next || 0) >= 3 || (r.stage_dunitech || 0) >= 3 || (r.stage_motion || 0) >= 3).map((r) => r.iso).filter(Boolean));
  const areaOpts = [['', '🌍 All countries'], ['active', `⭐ Where companies replied or more (${active.size})`], ['trip', '🧳 My trip'], ...(C.savedGroups || []).map((g) => [`g:${g.label}`, `⭐ ${g.label}`]), ...regions.map((r) => [`r:${r}`, `🗺 ${r}`])];
  fl.append(sel(areaOpts, cgS.area, (v) => { cgS.area = v; cgS.iso = ''; drawCongressPage(); }, 'Region or group of countries'));
  fl.append(sel([['date', 'Sort: soonest'], ['size', 'Sort: biggest'], ['name', 'Sort: name'], ['country', 'Sort: country']], cgS.sort, (v) => { cgS.sort = v; drawCongressPage(); }, 'Sort'));
  { const x = el('button', 'cm-chip', '🏪 With exhibition'); x.type = 'button'; x.setAttribute('aria-pressed', String(cgS.exh)); x.title = 'Only congresses that mention an exhibition or sponsors'; x.addEventListener('click', () => { cgS.exh = !cgS.exh; drawCongressPage(); }); fl.append(x); }
  if (cgS.iso) { const x = el('button', 'cm-chip', `${C.flag(cgS.iso)} ${(C.rowsOf('countries').find((c) => c.iso === cgS.iso) || {}).country || cgS.isoName || cgS.iso} ✕`); x.type = 'button'; x.setAttribute('aria-pressed', 'true'); x.addEventListener('click', () => { cgS.iso = ''; drawCongressPage(); }); fl.append(x); }
  wrap.append(fl);
  const cc = el('div', 'cm-chips cm-cgcats'); CG_CATS.forEach((c) => { const b = el('button', 'cm-chip', c); b.type = 'button'; b.setAttribute('aria-pressed', String(cgS.cats.has(c))); b.addEventListener('click', () => { cgS.cats.has(c) ? cgS.cats.delete(c) : cgS.cats.add(c); drawCongressPage(); }); cc.append(b); }); wrap.append(cc);
  // which series pass the filters
  const need = cgS.brand ? CG_FOR[cgS.brand] : null; const ql = low(cgS.q);
  const areaSet = !cgS.area ? null : cgS.area === 'active' ? active : cgS.area === 'trip' ? new Set(C.TRIP_ISOS || []) : cgS.area.startsWith('g:') ? new Set(((C.savedGroups || []).find((g) => `g:${g.label}` === cgS.area) || {}).isos || []) : new Set(cs.filter((c) => `r:${c.region}` === cgS.area).map((c) => c.iso));
  const hasExh = (s) => !!s.exhibitors || (/exhib|sponsor|stand|booth|expo/i.test(s.exhibition) && !/not mention|not found|none/i.test(s.exhibition));
  const pass = (s, withIso = !0) => (!areaSet || areaSet.has(s.iso)) && (!cgS.exh || hasExh(s)) && (!cgS.level || s.level === cgS.level) && (!cgS.cats.size || s.cats.some((c) => cgS.cats.has(c))) && (!need || s.cats.some((c) => need.includes(c))) && (!withIso || !cgS.iso || s.iso === cgS.iso)
    && (!ql || low(`${s.series} ${s.organizer} ${s.country} ${s.eds.map((e) => e.city).join(' ')}`).includes(ql));
  const whenOk = (s) => cgS.when === 'all' ? !0 : cgS.when === 'past' ? !!s.last : s.next && inDays(s.next.start) <= (cgS.when === 'next3' ? 92 : 365);
  const mine = cgS.tab === 'mine'; const list = all.filter((s) => (mine ? !!cgStar(s.id) && pass(s) : pass(s) && (cgS.tab !== 'events' || whenOk(s))));
  // map: countries shaded by how many congresses match, dots for the upcoming ones
  if ('ok' === wd.status && window.d3) try {
    const W = 960, H = 430; const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('class', 'cm-cgmap');
    const feats = wd.data.filter((f) => f.iso !== 'AQ').map((f) => ({ type: 'Feature', properties: { iso: f.iso, name: f.name }, geometry: { type: f.type, coordinates: f.coords } }));
    const pr = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'FeatureCollection', features: feats }); const path = d3.geoPath(pr);
    const per = new Map(); all.filter((s) => (mine ? !!cgStar(s.id) : pass(s, !1) && (cgS.tab !== 'events' || whenOk(s)))).forEach((s) => per.set(s.iso, (per.get(s.iso) || 0) + 1)); const mx = Math.max(1, ...per.values());
    svg.append('g').selectAll('path').data(feats).join('path').attr('d', path).attr('class', (f) => `c${per.get(f.properties.iso) ? ' has' : ''}${cgS.iso === f.properties.iso ? ' on' : ''}`)
      .attr('style', (f) => per.get(f.properties.iso) ? `fill-opacity:${0.25 + 0.6 * (per.get(f.properties.iso) / mx)}` : null)
      .on('click', (ev, f) => { cgS.iso = cgS.iso === f.properties.iso ? '' : f.properties.iso; cgS.isoName = f.properties.name; drawCongressPage(); })
      .append('title').text((f) => `${f.properties.name}: ${per.get(f.properties.iso) || 0} congress${per.get(f.properties.iso) === 1 ? '' : 'es'}`);
    const cen = new Map(feats.map((f) => [f.properties.iso, pr(d3.geoCentroid(f))]));
    const dots = list.filter((s) => (s.next || (mine && s.last)) && cen.get(s.iso)); dots.forEach((s) => { if (!s.next && s.last) s.__past = !0; }); const seen = new Map();
    svg.append('g').selectAll('circle').data(dots).join('circle').attr('r', (s) => (s.level === 'Global' ? 6 : 4.5)).attr('fill', (s) => (mine && cgStar(s.id) && cgStar(s.id).level === 'going' ? '#e5733a' : CG_LV[s.level])).attr('opacity', (s) => (s.__past && !s.next ? 0.45 : 1))
      .attr('cx', (s) => { const k = seen.get(s.iso) || 0; seen.set(s.iso, k + 1); s.__dx = (k % 4) * 7 - 10; s.__dy = Math.floor(k / 4) * 7; return cen.get(s.iso)[0] + s.__dx; }).attr('cy', (s) => cen.get(s.iso)[1] + s.__dy)
      .attr('class', 'dot').on('click', (ev, s) => { const t = document.getElementById(`cg-${s.id}`); t && t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t && t.classList.add('flash'); setTimeout(() => t && t.classList.remove('flash'), 1400); })
      .append('title').text((s) => { const e = s.next || s.last; return `${s.series} · ${e.start}${e.city ? ` · ${e.city}` : ''}`; });
    const lg = el('div', 'cm-cglegend'); Object.entries(CG_LV).forEach(([k, c]) => { const x = el('span'); const dt = el('i'); dt.style.background = c; x.append(dt, k === 'Global' ? 'Worldwide' : k); lg.append(x); }); if (mine) { const x = el('span'); const dt = el('i'); dt.style.background = '#e5733a'; x.append(dt, '✈ Going'); lg.append(x); } lg.append(el('span', 'mut', 'Tap a country to filter'));
    const mw = el('div', 'cm-cgmapw'); mw.append(svg.node(), lg); wrap.append(mw);
  } catch { /* map unavailable; the list still shows */ }
  const fmt = (a, b) => { if (!a) return 'date tbc'; const A = new Date(a), B = b ? new Date(b) : A; return A.getMonth() === B.getMonth() ? `${A.getDate()}${b && b !== a ? `–${B.getDate()}` : ''} ${A.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : `${A.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${B.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`; };
  const hue = (t) => { let x = 0; for (const ch of String(t)) x = (x * 31 + ch.charCodeAt(0)) % 360; return `hsl(${x} 45% 42%)`; };
  const logoEl = (s) => { const lg = el('span', 'lg'); const lo = s.logo || logos.get(s.dom); if (lo) { const im = el('img'); im.src = lo; im.alt = ''; lg.style.background = '#fff'; lg.append(im); } else { lg.style.background = hue(s.series); lg.textContent = (s.series.match(/\b[A-ZÇĞİÖŞÜ]{2,6}\b/) || [s.series.slice(0, 2)])[0].slice(0, 4); } return lg; };
  const starBtn = (id, kind, label) => { const st = cgStar(id); const b = el('button', `cm-star${st ? ' on' : ''}`, st ? (CG_LVL[st.level] || CG_LVL.follow)[0] : '☆'); b.type = 'button'; b.title = st ? `${(CG_LVL[st.level] || CG_LVL.follow)[1]} — tap to remove from My list` : `Add ${label} to My list`; b.setAttribute('aria-pressed', String(!!st)); b.addEventListener('click', (ev) => { ev.stopPropagation(); cgToggle(id, kind); drawCongressPage(); }); return b; };
  const ctryBtn = (s) => { const b = el('button', 'cm-co', `${C.flag(s.iso)} ${s.country}`); b.type = 'button'; b.title = 'Open the country'; b.addEventListener('click', () => window.cmOpenCountry && window.cmOpenCountry(s.iso)); return b; };
  if (cgS.tab === 'mine') {
    const body = el('div', 'cm-cglist'); wrap.append(body);
    const ev = list.slice().sort((x, y) => String((x.next || {}).start || '9').localeCompare(String((y.next || {}).start || '9')));
    const assoc = Object.entries(__cm.cgStars || {}).filter(([k, v]) => v.kind === 'assoc').map(([k]) => k);
    if (!ev.length && !assoc.length) { body.append(el('div', 'cm-cgempty', '⭐ Tap the ☆ on any congress or association to add it here — the ones you’re going to, might go to, or want to follow. They show on the map above and in a timeline here.')); return; }
    // summary
    const nGo = ev.filter((s) => (cgStar(s.id) || {}).level === 'going').length; const next = ev.find((s) => s.next);
    const sm = el('div', 'cm-logtiles'); [[ev.length, '⭐ Congresses'], [nGo, '✈ Going'], [ev.filter((s) => s.next && inDays(s.next.start) <= 92).length, '📅 In the next 3 months'], [assoc.length, '🏛 Associations']].forEach(([n, l]) => { const t2 = el('div', 'cm-logtile'); t2.append(el('b', null, String(n)), el('span', null, l)); sm.append(t2); }); body.append(sm);
    if (next) body.append(el('div', 'mut', `Next: ${next.series} · ${fmt(next.next.start, next.next.end)} · ${next.next.city || next.country} — ${inDays(next.next.start) <= 0 ? 'happening now' : `in ${inDays(next.next.start)} days`}`));
    // timeline table
    const tw = el('div', 'cm-tablewrap'); const t = el('table', 'cm-cmpt cm-mytbl'); const hr = el('tr'); ['', 'Congress', 'When', 'Where', 'Level', 'My plan', ''].forEach((x) => hr.append(el('th', null, x))); const th = el('thead'); th.append(hr); t.append(th); const tb = el('tbody');
    ev.forEach((s) => { const e = s.next || s.last; const st = cgStar(s.id) || { level: 'follow' }; const tr = el('tr'); tr.id = `cg-${s.id}`;
      const c0 = el('td'); c0.append(logoEl(s)); const c1 = el('td'); const a = el('a', 'nm', s.series); a.href = (e && e.url) || s.url || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; c1.append(a); s.often && c1.append(el('div', 'mut', `↻ ${s.often}`));
      const c2 = el('td'); if (s.next) { const n = inDays(s.next.start); c2.append(el('div', `when ${n <= 120 ? 'soon' : 'later'}`, fmt(s.next.start, s.next.end)), el('div', 'mut', n <= 0 ? 'happening now' : `in ${n} days`)); } else c2.append(el('div', 'mut', s.last ? `last ${fmt(s.last.start, s.last.end)} · next not published` : 'date tbc'));
      const c3 = el('td'); c3.append(ctryBtn(s)); e && e.city && c3.append(el('div', 'mut', e.city));
      const c4 = el('td'); const lv = el('span', 'lv', s.level === 'Global' ? 'Worldwide' : s.level); lv.style.borderColor = CG_LV[s.level]; lv.style.color = CG_LV[s.level]; c4.append(lv);
      const c5 = el('td'); const ps = el('select', 'cm-phtpl'); Object.entries(CG_LVL).forEach(([k, [ic, l]]) => ps.append(new Option(`${ic} ${l}`, k))); ps.value = st.level; ps.addEventListener('change', () => { cgSetLevel(s.id, ps.value); drawCongressPage(); }); c5.append(ps);
      const c6 = el('td'); if (s.next) { const d0 = s.next.start.replace(/-/g, ''); const d1 = new Date(new Date(s.next.end || s.next.start).getTime() + 864e5).toISOString().slice(0, 10).replace(/-/g, ''); const g = el('a', 'cm-mini', '📅 Add'); g.title = 'Add to Google Calendar'; g.target = '_blank'; g.rel = 'noopener noreferrer'; g.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.series)}&dates=${d0}/${d1}&location=${encodeURIComponent([s.next.venue, s.next.city, s.country].filter(Boolean).join(', '))}&details=${encodeURIComponent(`${s.organizer || ''}\n${s.next.url || s.url || ''}`)}`; c6.append(g); }
      const x = el('button', 'cm-mini', '✕'); x.type = 'button'; x.title = 'Remove from My list'; x.addEventListener('click', () => { cgToggle(s.id); drawCongressPage(); }); c6.append(' ', x);
      tr.append(c0, c1, c2, c3, c4, c5, c6); tb.append(tr); });
    t.append(tb); tw.append(t); ev.length && body.append(tw);
    if (assoc.length) { body.append(el('div', 'cm-cgk', '🏛 Associations you follow')); const orgs = new Map(); all.forEach((s) => orgs.set(`A:${s.iso}|${s.organizer || '—'}`, s));
      assoc.forEach((k) => { const s = orgs.get(k); const [iso, nm] = k.slice(2).split('|'); const card = el('div', 'cm-cgcard'); card.append(logoEl({ series: nm, logo: s && s.logo, dom: s && s.dom })); const mid = el('div', 'mid'); const a = el('a', 'nm', nm); a.href = (s && s.url) || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; mid.append(a, el('div', 'meta', `${C.flag(iso)} ${s ? s.country : iso}${s && s.email ? ` · ✉ ${s.email}` : ''}`)); const rt = el('div', 'rt'); rt.append(starBtn(k, 'assoc', 'this association')); card.append(mid, rt); body.append(card); }); }
  } else if (cgS.tab === 'events') {
    const body = el('div', 'cm-cglist'); wrap.append(el('div', 'mut', `${list.length} congress${list.length === 1 ? '' : 'es'} match`), body);
    if (!list.length) { body.append(el('div', 'hint', 'No congress matches these filters.')); return; }
    const byDate = (x, y) => cgS.when === 'past' ? String((y.last || {}).start).localeCompare(String((x.last || {}).start)) : String((x.next || x.last || {}).start || '9').localeCompare(String((y.next || y.last || {}).start || '9'));
    const sorted = list.slice().sort(cgS.sort === 'size' ? (x, y) => (y.participants || 0) - (x.participants || 0) || (y.exhibitors || 0) - (x.exhibitors || 0) || ({ Global: 0, Regional: 1, National: 2 }[x.level] - { Global: 0, Regional: 1, National: 2 }[y.level]) || byDate(x, y)
      : cgS.sort === 'name' ? (x, y) => x.series.localeCompare(y.series) : cgS.sort === 'country' ? (x, y) => x.country.localeCompare(y.country) || byDate(x, y) : byDate);
    const groupBy = cgS.sort === 'date' ? 'month' : cgS.sort === 'country' ? 'country' : '';
    let month = '';
    sorted.slice(0, cgS.more).forEach((s) => {
      const e = cgS.when === 'past' ? s.last : s.next || s.last; const mo = groupBy === 'country' ? `${C.flag(s.iso)} ${s.country}` : groupBy === 'month' ? (e && e.start ? new Date(e.start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Date not published') : '';
      if (mo && mo !== month) { month = mo; body.append(el('div', 'cm-cgk', mo)); }
      const card = el('div', 'cm-cgcard'); card.id = `cg-${s.id}`; card.append(logoEl(s));
      const mid = el('div', 'mid'); const a = el('a', 'nm'); a.href = (e && e.url) || s.url || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = `${s.series}${e && e.edition ? ` · ${e.edition}` : ''}`; mid.append(a);
      const meta = el('div', 'meta'); meta.append(ctryBtn(s), e && e.city ? ` · ${e.city}${e.venue ? `, ${e.venue}` : ''}` : ''); mid.append(meta);
      const tags = el('div', 'tags'); const lv = el('span', 'lv', s.level === 'Global' ? 'Worldwide' : s.level); lv.style.borderColor = CG_LV[s.level]; lv.style.color = CG_LV[s.level]; tags.append(lv); s.cats.forEach((c) => tags.append(el('span', 'ct', c)));
      if (s.often) tags.append(el('span', 'mut', `↻ ${s.often}`)); if (s.participants) tags.append(el('span', 'mut', `👥 ${s.participants.toLocaleString('en')}+`)); if (s.exhibitors) tags.append(el('span', 'mut', `🏪 ${s.exhibitors}+ exhibitors`)); else if (/exhib|sponsor|stand|booth|expo/i.test(s.exhibition) && !/not mention|not found|none/i.test(s.exhibition)) tags.append(el('span', 'mut', '🏪 exhibition'));
      mid.append(tags);
      const ex = []; if (s.last && s.next) ex.push(`Last: ${fmt(s.last.start, s.last.end)}`); if (!s.next && s.last && cgS.when !== 'past') ex.push('Next date not published yet'); if (s.organizer) ex.push(s.organizer); if (s.email) ex.push(`✉ ${s.email}`);
      ex.length && mid.append(el('div', 'sub', ex.join(' · ')));
      const right = el('div', 'rt'); right.append(starBtn(s.id, 'event', 'this congress')); if (e && e.start) { const n = inDays(e.start); const live = n <= 0 && (e.end || e.start) >= t0; right.append(el('div', `when ${live ? 'soon' : n < 0 ? 'past' : n <= 120 ? 'soon' : 'later'}`, fmt(e.start, e.end)), el('div', 'mut', live ? 'happening now' : n < 0 ? `${-n} days ago` : n === 1 ? 'tomorrow' : `in ${n} days`)); } else right.append(el('div', 'when later', 'date tbc'));
      card.append(mid, right); body.append(card);
    });
    if (sorted.length > cgS.more) { const mb = el('button', 'cm-btn ghost', `Show ${Math.min(60, sorted.length - cgS.more)} more of ${sorted.length - cgS.more}`); mb.type = 'button'; mb.addEventListener('click', () => { cgS.more += 60; drawCongressPage(); }); body.append(mb); }
  } else if (cgS.tab === 'assoc') {
    const org = new Map(); all.filter((s) => pass(s)).forEach((s) => { const k = `${s.iso}|${s.organizer}`; const o = org.get(k) || { name: s.organizer || '—', type: s.org_type, iso: s.iso, country: s.country, series: [], cats: new Set(), email: s.email, url: s.url, dom: s.dom, logo: s.logo }; o.series.push(s); s.cats.forEach((c) => o.cats.add(c)); org.set(k, o); });
    const body = el('div', 'cm-cglist'); wrap.append(body); let ctry = '';
    [...org.values()].sort((x, y) => x.country.localeCompare(y.country) || y.series.length - x.series.length).slice(0, 400).forEach((o) => {
      if (o.country !== ctry) { ctry = o.country; body.append(el('div', 'cm-cgk', `${C.flag(o.iso)} ${o.country}`)); }
      const card = el('div', 'cm-cgcard'); card.append(logoEl({ series: o.name, logo: o.logo, dom: o.dom })); const mid = el('div', 'mid'); const a = el('a', 'nm', o.name); a.href = o.url || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; mid.append(a);
      mid.append(el('div', 'meta', [o.type, `${o.series.length} congress${o.series.length === 1 ? '' : 'es'}: ${o.series.map((s) => s.series).slice(0, 3).join(', ')}${o.series.length > 3 ? '…' : ''}`].filter(Boolean).join(' · ')));
      const tags = el('div', 'tags'); [...o.cats].forEach((c) => tags.append(el('span', 'ct', c))); o.email && tags.append(el('span', 'mut', `✉ ${o.email}`)); mid.append(tags);
      const rt = el('div', 'rt'); rt.append(starBtn(`A:${o.iso}|${o.name}`, 'assoc', 'this association')); card.append(mid, rt); body.append(card); });
  } else {
    const b = el('div', 'cm-cgempty'); b.append(el('h3', null, '🏪 Exhibitors — coming soon'), el('p', 'mut', 'This list will show the companies exhibiting at these congresses, linked to the congresses and to your NetHunt companies:'));
    const tbl = el('div', 'cm-cgschema'); [['Company', 'name, website, logo'], ['Country', 'where the company is based'], ['Type', 'manufacturer · local distributor · dealer · service'], ['Segments', 'trauma, joints, spine, sports, shoulder…'], ['Brands', 'brands they exhibit or represent'], ['Congresses', 'which congresses and years they exhibited at (booth size when known)'], ['In NetHunt?', 'matched to your companies, so they show on country, company and Best partners pages']].forEach(([k, v]) => { const r = el('div'); r.append(el('b', null, k), ` — ${v}`); tbl.append(r); });
    b.append(tbl, el('p', 'mut', 'Send the exhibitor files when they are ready and they will appear here, filtered the same way (level, category, brand, country, map).')); wrap.append(b);
  }
}

// ---- 🔥 Hot companies: talking now, recently met, or interested / promising / negotiating ----
let noHotInChanges = !1;
function hotList(box, skip, max = 40, only = null) {
  if (noHotInChanges) return 0;
  const C = __cm; const el = C.el; const ch = dash.data('contact_history'); const ps = C.rowsOf('pipeline_stages');
  if ('ok' !== ch.status && !ps.length) { box.append(el('div', 'hint', 'Loading hot companies…')); return; }
  const now = Date.now(); const met = new Map(); const soon = new Map();
  ('ok' === ch.status ? ch.data : []).forEach((e) => { if (e.type !== 'calendar') return; const t = +new Date(e.time); const d = (now - t) / 864e5;
    if (d >= 0 && d <= 21 && (!met.has(e.record_id) || met.get(e.record_id) > d)) met.set(e.record_id, d); if (d < 0 && d >= -45 && (!soon.has(e.record_id) || soon.get(e.record_id) < d)) soon.set(e.record_id, d); });
  const byId = new Map(ps.map((r) => [r.id, r])); const ids = new Set([...ps.filter((r) => Math.max(r.stage_next || 0, r.stage_dunitech || 0, r.stage_motion || 0) >= 4).map((r) => r.id), ...met.keys(), ...soon.keys()]);
  ('ok' === ch.status ? ch.data : []).forEach((e) => { if ((now - new Date(e.time)) / 864e5 <= 14 && e.type !== 'calendar') ids.add(e.record_id); });
  const hot = [];
  ids.forEach((id) => { if ((skip && skip.has(id)) || isIgnored(id)) return; const r = byId.get(id) || C.companyById(id) || {}; if (!r.company || (only && !only.has(r.iso))) return;
    const best = [['next', 'Next'], ['dunitech', 'Dunitech'], ['motion', 'Motion']].map(([k, l]) => [r[`stage_${k}`] || 0, l]).sort((x, y) => y[0] - x[0])[0];
    if (best[0] >= 6) return; // already a partner
    const st = C.convStats(id); const rc = C.realContact(id); const why = []; let sc = 0;
    if (best[0] >= 4) { why.push(`${best[1]}: ${C.STAGE[best[0]]}`); sc += best[0] * 10; }
    if (soon.has(id)) { why.push(`📅 meeting in ${Math.max(1, Math.round(-soon.get(id)))}d`); sc += 30; } else if (met.has(id)) { why.push(`📅 met ${Math.round(met.get(id)) || 0}d ago`); sc += 25 - met.get(id); }
    if (st.in14) { why.push(`💬 they wrote ${rc && rc.dir === 'in' ? rc.ago + ' ago' : 'recently'}`); sc += 20 + st.in14 * 4; } else if (st.n14) { why.push(`${st.n14} conversation${st.n14 === 1 ? '' : 's'} in 14 days`); sc += st.n14 * 4; }
    if (why.length) hot.push({ id, r, why, sc }); });
  hot.sort((x, y) => y.sc - x.sc);
  box.append(el('div', 'grp', `🔥 Hot companies · ${hot.length}`));
  if (!hot.length) { box.append(el('div', 'hint', 'No hot companies right now.')); return; }
  hot.slice(0, max).forEach(({ id, r, why }) => { const b = el('button', 'cm-pi'); b.type = 'button'; b.dataset.openCompany = id; b.append(el('span', null, C.flag(r.iso) || '🏢'), el('span', 't', r.company), el('span', 'tag', why.slice(0, 2).join(' · '))); b.title = why.join(' · '); box.append(b); });
  hot.length > max && box.append(el('div', 'hint', `+ ${hot.length - max} more`)); return hot.length;
}
// ===================== 👤 photos in circles =====================
const AV_COL = ['#c2410c', '#0f766e', '#7c3aed', '#be185d', '#1d4ed8', '#4d7c0f', '#a16207', '#0e7490'];
function avatarEl(name, email, photo, contactId) {
  const C = __cm; const el = C.el; const nm = String(name || '?').trim(); const ini = nm.split(/\s+/).filter((w) => /\w/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  let hsh = 0; for (const ch of nm) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; const a = el('span', 'cm-av'); a.style.background = AV_COL[hsh % AV_COL.length]; a.title = contactId ? 'Add or change the photo' : nm;
  const initials = () => { a.replaceChildren(ini); };
  if (photo) { const im = el('img'); im.src = photo; im.alt = ''; a.append(im); }
  else if (window.cmBoot && email) { const im = el('img'); im.alt = ''; im.loading = 'lazy'; im.addEventListener('error', initials); im.src = `/api/avatar?email=${encodeURIComponent(String(email).split(/[,|]/)[0].trim())}`; a.append(im); }
  else initials();
  if (contactId) a.addEventListener('click', (ev) => { ev.stopPropagation(); photoMenu(a, contactId, nm); });
  return a;
}
async function shrinkToDataUrl(blob) { // a small square copy (96 px) so it fits in the NetHunt record
  const url = URL.createObjectURL(blob); try { const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); const S = 96; const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const g = cv.getContext('2d'); const k = Math.min(im.width, im.height); g.drawImage(im, (im.width - k) / 2, (im.height - k) / 2, k, k, 0, 0, S, S); return cv.toDataURL('image/jpeg', 0.82); } finally { URL.revokeObjectURL(url); }
}
function photoMenu(anchor, contactId, name) {
  const C = __cm;
  const save = async (data) => { try { await C.nhCall('update_record', { folderId: '6682e9b8b6386800f586c0b0', recordId: contactId, fieldKeys: 'label', fields: { Photo: data || null } }); const r = C.rowsOf('company_contacts').find((x) => x.id === contactId); if (r) r.photo = data || ''; C.say(data ? `✓ Photo saved for ${name}` : 'Photo removed'); dash.refresh('company_contacts'); } catch (e) { C.say(`Not saved — ${C.nhErr(e)}`, !0); } };
  const pick = () => { const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.addEventListener('change', async () => { const b = f.files && f.files[0]; if (b) save(await shrinkToDataUrl(b)); }); f.click(); };
  const items = [{ icon: '📷', label: 'Upload a photo', sub: 'from your computer or phone', act: pick }];
  if (window.cmBoot) items.push({ icon: '🔗', label: 'Photo from a link', sub: 'paste an image address (e.g. their company’s team page)', act: async () => { const u = window.prompt('Image address (https://…)'); if (!u) return; try { const r = await fetch(`/api/avatar?url=${encodeURIComponent(u)}`, { credentials: 'same-origin' }); if (!r.ok) throw new Error('not an image'); save(await shrinkToDataUrl(await r.blob())); } catch { C.say('That link isn’t an image I can use.', !0); } } });
  items.push({ icon: '📋', label: 'Paste a copied image', sub: 'right-click a photo → Copy image, then choose this', act: async () => { try { const it = await navigator.clipboard.read(); for (const x of it) { const t = x.types.find((y) => y.startsWith('image/')); if (t) { save(await shrinkToDataUrl(await x.getType(t))); return; } } C.say('No image on the clipboard.', !0); } catch { C.say('The browser didn’t allow reading the clipboard — use Upload instead.', !0); } } });
  const r = C.rowsOf('company_contacts').find((x) => x.id === contactId); if (r && r.photo) items.push({ icon: '✕', label: 'Remove photo', act: () => save('') });
  C.openMenu(anchor, items);
}
function avatarize() { // company page People + Power hour people
  const C = __cm; if (!dash.params().cid || !(C.curView() === 'company' || document.querySelector('#cm-sheet:not([hidden]) .cm-phppl'))) return; const pc = C.rowsOf('company_contacts');
  document.querySelectorAll('.cm-person .cm-phead .pn[data-where^="id="]').forEach((pn) => { if (pn.previousElementSibling && pn.previousElementSibling.classList.contains('cm-av')) return; const id = pn.dataset.where.slice(3); const p = pc.find((x) => x.id === id) || {}; pn.before(avatarEl(pn.textContent, p.email, p.photo, id)); });
  document.querySelectorAll('.cm-phppl .cm-crow2 .t .nm').forEach((nm) => { if (nm.previousElementSibling && nm.previousElementSibling.classList.contains('cm-av')) return; const p = pc.find((x) => x.name === nm.textContent) || {}; nm.before(avatarEl(nm.textContent, p.email, p.photo, p.id)); });
}
// ===================== 🔎 find / 📋 paste missing company details =====================
function enrichPanel(cid, name, F, place) {
  const C = __cm; const el = C.el; const box = el('div', 'cm-enr'); const out = el('div');
  const have = { email: new Set(String(F.get('Email') || '').toLowerCase().split(/\n|, /).filter(Boolean)), phone: new Set(String(F.get('Phone number') || '').split(/\n|, /).map((p) => C.digits(p).slice(-8)).filter(Boolean)), site: String(F.get('Website') || '').toLowerCase(), linkedin: String(F.get('LinkedIn') || ''), facebook: String(F.get('Facebook') || ''), instagram: String(F.get('Instagram') || ''), address: String(F.get('Address') || '') };
  const field = { email: 'Email', phone: 'Phone number', whatsapp: 'Phone number', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram', address: 'Address', website: 'Website' };
  const known = (k, v) => (k === 'email' ? have.email.has(low(v)) : k === 'phone' || k === 'whatsapp' ? have.phone.has(C.digits(v).slice(-8)) : k === 'address' ? !!have.address && low(have.address).includes(low(v).slice(0, 12)) : have[k] && low(have[k]).includes(low(v).replace(/^https?:\/\/(www\.)?/, '').slice(0, 20)));
  const addTo = async (k, v, btn, auto) => { btn.disabled = !0; const f = field[k]; let val = v; window.__cmAuto = !!auto;
    if (f === 'Email' || f === 'Phone number') { const cur = String(F.get(f) || '').split(/\n|, /).map((x) => x.trim()).filter(Boolean); val = [...new Set([...cur, v])]; }
    try { await C.nhCall('update_record', { folderId: C.NH_FOLDER, recordId: cid, fieldKeys: 'label', fields: { [f]: val } }); btn.textContent = '✓ Added'; F.set(f, Array.isArray(val) ? val.join('\n') : val); dash.refresh('company_record'); } catch (e) { btn.disabled = !1; C.say(`Not saved — ${C.nhErr(e)}`, !0); } window.__cmAuto = !1; };
  const show = (items, note) => {
    out.replaceChildren(); if (note) out.append(el('div', 'hint', note));
    const ICON = { email: '✉', phone: '☎', whatsapp: '💬', linkedin: '💼', facebook: '📘', instagram: '📸', address: '📍', website: '🌐', person: '👤', result: '🔗' };
    const rows = items.filter((x) => x.kind !== 'phone' || C.digits(x.value).length >= 8);
    if (!rows.length) { out.append(el('div', 'hint', 'Nothing new found.')); return; }
    rows.forEach((x) => { const r = el('div', 'cm-enrow'); r.append(el('span', null, ICON[x.kind] || '•'));
      const v = el('div', 'v'); if (x.kind === 'result') { const a = el('a', null, x.value); a.href = x.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; v.append(a, el('div', 'mut', x.snippet || '')); } else v.append(x.kind === 'person' ? `${x.value}${x.title ? ` · ${x.title}` : ''}${x.email ? ` · ${x.email}` : ''}${x.phone ? ` · ${x.phone}` : ''}` : x.value);
      r.append(v);
      if (x.kind === 'result') r.append(el('span'));
      else if (x.kind === 'person') { const b = el('button', 'cm-mini', '＋ Add person'); b.type = 'button'; b.addEventListener('click', async () => { b.disabled = !0; window.__cmAuto = x.source !== 'pasted text'; setTimeout(() => { window.__cmAuto = !1; }, 8000); const w = x.value.split(/\s+/); try { await C.nhCall('create_record', { folderId: '6682e9b8b6386800f586c0b0', fieldKeys: 'label', fields: Object.fromEntries(Object.entries({ Name: x.value, 'First name': w[0], 'Last name': w.slice(1).join(' ') || undefined, Title: x.title || undefined, Company: [cid], Email: x.email ? [x.email] : undefined, 'Phone number': x.phone ? [x.phone] : undefined }).filter(([, y]) => y != null)) }); b.textContent = '✓ Added'; dash.refresh('company_contacts'); } catch (e) { b.disabled = !1; C.say(`Not saved — ${C.nhErr(e)}`, !0); } }); r.append(b); }
      else if (known(x.kind, x.value)) r.append(el('span', 'mut', 'already in NetHunt'));
      else { const b = el('button', 'cm-mini', '＋ Add'); b.type = 'button'; b.title = `Add to the company’s ${field[x.kind]}`; b.addEventListener('click', () => addTo(x.kind, x.value, b, x.source !== 'pasted text')); r.append(b); }
      x.source && x.kind !== 'result' && r.append(el('div', 'src', `from ${String(x.source).replace(/^https?:\/\/(www\.)?/, '').slice(0, 70)}`)); out.append(r); });
  };
  // 🔎 find on the web (website)
  const row = el('div', 'cm-chips');
  if (window.cmBoot) { const fb = el('button', 'cm-btn', '🔎 Find on the web'); fb.type = 'button';
    fb.addEventListener('click', async () => { fb.disabled = !0; fb.textContent = 'Searching…'; const q = `${name} ${String(F.get('City') || '').split(/\n|,/)[0]} ${String(F.get('Country') || '').split(/\n|\|/)[0]}`.trim();
      try { const r = await fetch(`/api/enrich?site=${encodeURIComponent(F.get('Website') || '')}&q=${encodeURIComponent(q)}`, { credentials: 'same-origin' }); const j = await r.json();
        show(j.items || [], `${j.pages && j.pages.length ? `Read ${j.pages.length} page${j.pages.length === 1 ? '' : 's'} of their website. ` : F.get('Website') ? 'Their website didn’t open. ' : 'No website in NetHunt. '}${j.search_ready ? '' : 'Web search is off — add a Brave Search key in Cloudflare to also search Google-style results.'}`); } catch { show([], 'Couldn’t search right now.'); }
      fb.disabled = !1; fb.textContent = '🔎 Find on the web'; }); row.append(fb); }
  const g = el('a', 'cm-btn ghost', '↗ Google'); g.href = `https://www.google.com/search?q=${encodeURIComponent(`${name} ${String(F.get('Country') || '').split(/\n|\|/)[0]} contacto teléfono email`)}`; g.target = '_blank'; g.rel = 'noopener noreferrer'; row.append(g);
  // 📋 paste whatever you found
  const ta = el('textarea'); ta.placeholder = '📋 Paste anything you found — a contact page, directory entry, email signature, LinkedIn “About”… Emails, phones, people and links are picked out for you to add.';
  const rb = el('button', 'cm-btn ghost', 'Read pasted text'); rb.type = 'button';
  rb.addEventListener('click', () => { const t = ta.value; if (!t.trim()) return; const it = []; const seen = new Set(); const add = (kind, value, extra = {}) => { const k = `${kind}|${low(value)}`; if (!value || seen.has(k)) return; seen.add(k); it.push({ kind, value: String(value).trim(), source: 'pasted text', ...extra }); };
    (t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).forEach((m) => add('email', m));
    (t.match(/(?:\+|00)?\d[\d\s().-]{7,}\d/g) || []).filter((m) => { const d = m.replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; }).forEach((m) => add('phone', m.trim()));
    [['linkedin', /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s<>"']+/gi], ['facebook', /https?:\/\/(?:www\.)?facebook\.com\/[^\s<>"']+/gi], ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/[^\s<>"']+/gi]].forEach(([k, re]) => (t.match(re) || []).forEach((m) => add(k, m)));
    (t.match(/https?:\/\/[^\s<>"']+/gi) || []).filter((u) => !/linkedin|facebook|instagram|google\./i.test(u)).slice(0, 2).forEach((u) => !have.site && add('website', u.replace(/[).,]+$/, '')));
    { const re = /(?:Ing\.|Ingeniero|Ingeniera|Dr\.|Dra\.|Lic\.|Sr\.|Sra\.|Mr\.|Ms\.|Mrs\.)\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})(?:,\s*([^.,\n·|]{3,40}))?/g; let m; let k2 = 0; while ((m = re.exec(t)) && k2 < 6) { k2++; add('person', m[1], { title: (m[2] || '').trim(), email: k2 === 1 ? (t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] : '', phone: k2 === 1 ? ((t.match(/(?:\+|00)?\d[\d\s().-]{7,}\d/) || [])[0] || '').trim() : '' }); } }
    try { const pv = C.parseVisitNotes(t, []); (pv.people || []).forEach((p, i) => add('person', p.name, { title: p.title, email: i === 0 ? (pv.emails || [])[0] : '', phone: i === 0 ? (pv.phones || [])[0] : '' })); } catch { /* names optional */ }
    show(it); });
  box.append(row, ta, rb, out);
  return box;
}

// 🧳 Trip planner lives in app3 — these forward to it
function drawTripPage(...a) { return window.__cm3 && window.__cm3.drawTripPage ? window.__cm3.drawTripPage(...a) : undefined; }
function tpSt(p) { return window.__cm3 && window.__cm3.tpSt ? window.__cm3.tpSt(p) : 'idea'; }
function tripInfo(p) { return window.__cm3 && window.__cm3.tripInfo ? window.__cm3.tripInfo(p) : { past: !0 }; }
const TP_ST = new Proxy({}, { get: (_, k) => ((window.__cm3 && window.__cm3.TP_ST) || {})[k] || ['', ''] });
// ===================== simplify & decide: Home inbox, data health, saved views, feature usage, one place per fact, short company page, weekly report =====================
// --- 🔖 saved views: one tap on Home (kept with your settings, works everywhere) ---
const VIEW_KEYS = ['view', 'iso', 'tags', 'isos', 'glabel', 'ctab', 'csub', 'ours', 'pcity', 'asg', 'cid', 'phfor'];
function savedViews() { return ((__cm.uiFlags || {}).views || []).filter((v) => v && v.name); }
function saveView() { const p = dash.params(); const nm = window.prompt('Name this view (e.g. “Peru · Dunitech follow-ups”)', `${(C0 => (C0.countryOfIso(p.iso) || {}).country || p.glabel || (p.view || 'Home'))(__cm)}${p.pcity ? ` · ${p.pcity}` : ''}`); if (!nm) return;
  const params = Object.fromEntries(VIEW_KEYS.filter((k) => p[k] != null && p[k] !== '').map((k) => [k, p[k]])); __cm.uiFlags = { ...(__cm.uiFlags || {}), views: [{ name: nm.trim().slice(0, 40), params }, ...savedViews().filter((v) => v.name !== nm.trim())].slice(0, 12) }; hmKey = ''; __cm.say(`🔖 “${nm.trim()}” saved — it's on Home`); }
function viewChips() { const el = __cm.el; const vs = savedViews(); if (!vs.length) return null; const row = el('div', 'cm-viewchips'); vs.forEach((v) => { const b = el('button', 'cm-chip', `🔖 ${v.name}`); b.type = 'button'; b.title = 'Open this saved view'; b.addEventListener('click', () => { const clear = Object.fromEntries(VIEW_KEYS.filter((k) => k !== 'cid').map((k) => [k, null])); dash.setParams({ ...clear, ...v.params }); window.scrollTo({ top: 0 }); }); const x = el('button', 'cm-mini', '✕'); x.type = 'button'; x.title = 'Remove'; x.addEventListener('click', (e) => { e.stopPropagation(); __cm.uiFlags = { ...(__cm.uiFlags || {}), views: savedViews().filter((y) => y !== v) }; hmKey = ''; drawHome(); }); const w = el('span', 'cm-vw'); w.append(b, x); row.append(w); }); return row; }
// --- 📊 feature usage: which parts of Medint people actually use (counted quietly, summed into the log every 15 minutes) ---
const FEAT = [['.cm-phtop, .cm-goalgo, .cm-cph', 'Power hour'], ['.cm-tb-follow', 'Today panel'], ['.cm-tb-new', 'Bell panel'], ['.cm-tb-cmp', 'Compare (top bar)'], ['.cm-tb-more', '⋯ menu'], ['.cm-addmiss', 'Add missing details'], ['.cm-star', 'Congress star'], ['.cm-av', 'Photo circles'], ['.cm-ob', 'Ortho check'], ['.cm-spill, .cm-cpills .cm-tag', 'Status change'], ['.cm-qi.cat', 'Catalogue'], ['.cm-qi.note', 'Summary'], ['.cm-phtr', 'Translate'], ['.cm-mtag', 'Meeting tag'], ['.cm-dtag', 'Deals'], ['.cm-relsug, .cm-related .cm-mini', 'Related companies'], ['.cm-asgchip', 'Assignments filter'], ['.cm-psort, .cm-ptools select', 'Best partners sort/filter'], ['.cm-tlbar, .cm-tpchip', 'Trip calendar'], ['.cm-cgcard, .cm-cgmap', 'Congress list/map'], ['.cm-viewchips .cm-chip', 'Saved views'], ['.cm-gbtn', 'Goal: change/new session'], ['.cm-mechip', 'Who am I'], ['.cm-cacts .cm-chip', 'Ignore'], ['.cm-mailbtn', 'Email (Power hour)'], ['a[href*="wa.me"]', 'WhatsApp'], ['a[href*="mail.google.com"]', 'Email'], ['.cm-maplink, .cm-qi.gmap', 'Google Maps'], ['.cm-histnav', 'Back/forward']];
const featCount = {}; let featLastView = '';
document.addEventListener('click', (e) => { if (!e.target.closest) return; for (const [sel, name] of FEAT) { if (e.target.closest(sel)) { featCount[name] = (featCount[name] || 0) + 1; break; } } }, !0);
setInterval(() => { try { const v = dash.params().view || 'home'; if (v !== featLastView) { featLastView = v; const nm = `Page: ${{ home: 'Home', markets: 'Markets', country: 'Country', company: 'Company', congresses: 'Congresses', trips: 'Trip planner', tenders: 'Tenders', sources: 'Sources', brand: 'Brand' }[v] || v}`; featCount[nm] = (featCount[nm] || 0) + 1; } } catch { /* not ready */ } }, 2000);
setInterval(() => { const keys = Object.keys(featCount); if (!keys.length || !miWho) return; const snap = { ...featCount }; keys.forEach((k) => delete featCount[k]); miLog({ action: 'Other', outcome: 'usage', text: JSON.stringify(snap) }); }, 15 * 60e3);
function openUsage(anchor) { const C = __cm; const el = C.el; const from = Date.now() - 30 * 864e5; needLog(from);
  C.openSheet(anchor, '📊 Feature usage · last 30 days', (body) => { const rows = homeLog() || []; const use = rows.filter((r) => r.action === 'Other' && r.outcome === 'usage' && r.epoch >= from);
    const tot = {}; const by = {}; use.forEach((r) => { let o = {}; try { o = JSON.parse(r.text || '{}'); } catch { /* bad line */ } Object.entries(o).forEach(([k, n]) => { tot[k] = (tot[k] || 0) + n; (by[k] = by[k] || new Set()).add(r.person); }); });
    const acts = {}; rows.filter((r) => r.epoch >= from && r.action !== 'Other').forEach((r) => { acts[r.action] = (acts[r.action] || 0) + 1; });
    body.append(el('p', 'mut', 'Counted quietly as people click (saved every 15 minutes), plus the actions in the log. Features nobody uses are candidates to remove, so Medint gets simpler.'));
    const list = Object.entries(tot).sort((a, b) => b[1] - a[1]); const mx = Math.max(1, ...list.map((x) => x[1]));
    if (!list.length) body.append(el('div', 'hint', 'No usage recorded yet — it starts counting now and fills in over the next days.'));
    list.forEach(([k, n]) => { const r = el('div', 'cm-usrow'); const bar = el('i'); bar.style.width = `${(n / mx) * 100}%`; r.append(el('span', null, k), el('span', 'bw', bar), el('b', null, String(n)), el('span', 'mut', [...by[k]].join(', '))); body.append(r); });
    const never = [...new Set(FEAT.map((x) => x[1]))].filter((k) => !tot[k]); if (list.length && never.length) body.append(el('div', 'cm-cgk', '💤 Not used in 30 days'), el('div', 'mut', never.join(' · ')));
    body.append(el('div', 'cm-cgk', '🧾 Actions in the log (30 days)'), el('div', 'mut', Object.entries(acts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'));
  }, { wide: !0, center: !0 }); }
// --- 🩺 data health, all countries: what makes scores, maps and goals wrong ---
function openHealth(anchor) { const C = __cm; const el = C.el; const ps = C.rowsOf('pipeline_stages');
  C.openSheet(anchor, '🩺 Data health · all countries', (body) => {
    if (!ps.length) { body.append(el('div', 'hint', 'Loading…')); return; }
    const norm2 = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(s\.?a\.?s?|s\.?r\.?l|ltda|sac|spa|inc|llc|ltd|co|cia|corp|gmbh|e\.?i\.?r\.?l|s\.?a\.?c|company|limited|private)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const st = (r) => Math.max(r.stage_next || 0, r.stage_dunitech || 0, r.stage_motion || 0);
    const issues = [['🌍 No country', ps.filter((r) => !r.iso), 'Country decides the market, map, time zone and assignment.'], ['🏙 No city (nice to have)', ps.filter((r) => r.iso && !String(r.city || '').trim()), 'City is needed for trips and the map — fill it in when you speak to them.'],
      ['👯 Possible duplicates (same name, same country)', (() => { const g = new Map(); ps.forEach((r) => { const k = `${r.iso}|${norm2(r.company)}`; if (norm2(r.company).length < 4) return; (g.get(k) || g.set(k, []).get(k)).push(r); }); return [...g.values()].filter((x) => x.length > 1).flat(); })(), 'Merge them in NetHunt so history and scores add up.'],
      ['🧊 Interested or negotiating, but no contact in 30+ days', ps.filter((r) => st(r) >= 4 && st(r) < 6 && !isIgnored(r.id) && (() => { const rc = C.realContact(r.id); return rc === null || (rc && rc.days >= 30); })()), 'The status says hot, the history says cold — call them or move the status back.'],
      ['❓ Placeholder names', ps.filter((r) => /^(test|company|unknown|n\/?a|-+|\?+|empresa|new company)$/i.test(String(r.company || '').trim()) || String(r.company || '').trim().length < 3), 'Give them a real name or delete them.']];
    const total = ps.length; const bad = new Set(issues.filter((x) => !/No city/.test(x[0])).flatMap((x) => x[1].map((r) => r.id))).size; // a missing city is worth fixing but doesn't count against the score const score = Math.round(((total - bad) / Math.max(1, total)) * 100);
    const top = el('div', 'cm-health'); top.append(el('b', null, `${score}%`), el('span', 'mut', `of ${total.toLocaleString('en')} companies have no issue found here · ${bad} need a look`)); body.append(top);
    issues.forEach(([t, rows, why]) => { const d = el('details', 'cm-hissue'); d.append(el('summary', null, `${t} · ${rows.length}`)); d.append(el('div', 'mut', why)); rows.slice(0, 80).forEach((r) => { const b = el('button', 'cm-pi'); b.type = 'button'; b.dataset.openCompany = r.id; b.append(el('span', null, C.flag(r.iso) || '🏢'), el('span', 't', r.company || '(no name)'), el('span', 'tag', [r.city, r[`status_${'next'}`] || r.status_all].filter(Boolean).join(' · '))); d.append(b); }); if (rows.length > 80) d.append(el('div', 'hint', `+ ${rows.length - 80} more`)); body.append(d); });
    body.append(el('p', 'mut', 'Inside a country, ⋯ → 🧹 Data quality also checks phone formats, websites and more for that country.'));
  }, { wide: !0, center: !0 }); }
// --- 📰 weekly report: last week (Mon–Sun) for everyone, ready to read or email ---
function weekBounds(offset = 1) { const d = new Date(); d.setHours(0, 0, 0, 0); const wd = (d.getDay() + 6) % 7; const mon = new Date(d); mon.setDate(d.getDate() - wd - 7 * offset); const sun = new Date(mon); sun.setDate(mon.getDate() + 7); return [+mon, +sun]; }
function weeklyData() { const C = __cm; const D = daysData(); if (!D) return null; const [a, b] = weekBounds(1); const [pa, pb] = weekBounds(2); const di = (t) => dayIdx(t); const people = [...D.P.keys()].filter((p) => !/^✉ |^Team WhatsApp$/.test(p));
  const sumP = (p, s, e) => { const m = D.P.get(p) || new Map(); const out = { cos: new Set(), Call: 0, WhatsApp: 0, Email: 0, Comment: 0, Status: 0, found: 0, days: 0, hit: 0, planned: 0 }; for (let d = di(s); d < di(e); d++) { const x = m.get(d); if (!x) continue; x.cos.forEach((c) => out.cos.add(c)); ['Call', 'WhatsApp', 'Email', 'Comment', 'Status'].forEach((k) => { out[k] += x[k] || 0; }); out.found += Object.values(x.found || {}).reduce((q, n) => q + n, 0); if (x.cos.size) out.days++; if (x.plan) { out.planned++; if (x.cos.size >= goalFor(x.plan)) out.hit++; } } return out; };
  const rows = people.map((p) => ({ p, w: sumP(p, a, b), pw: sumP(p, pa, pb) })).filter((r) => r.w.cos.size || r.pw.cos.size || r.w.found).sort((x, y) => y.w.cos.size - x.w.cos.size);
  const ps = C.rowsOf('pipeline_stages'); const st = (r) => Math.max(r.stage_next || 0, r.stage_dunitech || 0, r.stage_motion || 0);
  const cold = ps.filter((r) => st(r) >= 4 && st(r) < 6 && !isIgnored(r.id) && (() => { const rc = C.realContact(r.id); return rc && rc.days >= 14; })()).slice(0, 12);
  const nowT = Date.now(); const cal = dash.data('calendar_events'); const nextMeet = ('ok' === cal.status ? cal.data : []).filter((e) => !e.all_day && !e.from_gmail && e.start && +new Date(e.start) >= nowT && +new Date(e.start) - nowT <= 7 * 864e5).sort((x, y) => String(x.start).localeCompare(String(y.start)));
  return { a, b, rows, cold, nextMeet, hot: (() => { const box = document.createElement('div'); try { hotList(box, null, 8); } catch { /* none */ } return [...box.querySelectorAll('.cm-pi')].map((x) => x.textContent); })() };
}
function weeklyText(W) { const f = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); const L = [`MEDINT WEEKLY REPORT · ${f(W.a)} – ${f(W.b - 1)}`, '', 'TEAM'];
  W.rows.forEach(({ p, w, pw }) => L.push(`• ${p}: ${w.cos.size} companies (${w.cos.size >= pw.cos.size ? '▲' : '▼'}${Math.abs(w.cos.size - pw.cos.size)} vs week before) · ☎${w.Call} 💬${w.WhatsApp} ✉${w.Email} 📝${w.Comment} 📈${w.Status} · goals ${w.hit}/${w.planned} · ${w.found} details found · ${w.days} days worked`));
  L.push('', 'MEETINGS THIS WEEK'); W.nextMeet.forEach((e) => L.push(`• ${new Date(e.start).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${e.summary}`)); if (!W.nextMeet.length) L.push('• none in the calendar');
  L.push('', 'GOING COLD (interested / negotiating, no contact 14+ days)'); W.cold.forEach((r) => L.push(`• ${r.company} (${r.iso || '—'})`)); if (!W.cold.length) L.push('• none');
  L.push('', 'HOT NOW'); W.hot.forEach((t) => L.push(`• ${t}`)); return L.join('\n'); }
function openWeekly(anchor) { const C = __cm; const el = C.el;
  C.openSheet(anchor, '📰 Weekly report', (body) => { const W = weeklyData(); if (!W) { body.append(loadingOrError()); return; } const f = (t) => new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    body.append(el('div', 'mut', `Last week: ${f(W.a)} – ${f(W.b - 1)} · compared with the week before`));
    const t = el('div', 'cm-tablewrap'); const tb = el('table', 'cm-cmpt cm-wktbl'); const hr = el('tr'); ['', '🏢 Companies', '☎', '💬', '✉', '📝', '📈', '🎯 Goals', '🔎 Found', 'Days'].forEach((x) => hr.append(el('th', null, x))); const th = el('thead'); th.append(hr); tb.append(th); const bd = el('tbody');
    W.rows.forEach(({ p, w, pw }) => { const tr = el('tr'); const n0 = el('td'); n0.append(avatarEl(p, (miPeople().find((x) => x.name === p) || {}).email, '', ''), ` ${p}`); const c1 = el('td'); c1.append(el('b', null, String(w.cos.size)), ' ', el('span', `cm-dlt ${w.cos.size > pw.cos.size ? 'up' : w.cos.size < pw.cos.size ? 'down' : 'eq'}`, w.cos.size > pw.cos.size ? `▲${w.cos.size - pw.cos.size}` : w.cos.size < pw.cos.size ? `▼${pw.cos.size - w.cos.size}` : '='));
      tr.append(n0, c1, el('td', null, String(w.Call)), el('td', null, String(w.WhatsApp)), el('td', null, String(w.Email)), el('td', null, String(w.Comment)), el('td', null, String(w.Status)), el('td', null, w.planned ? `${w.hit}/${w.planned}` : '–'), el('td', null, String(w.found)), el('td', null, String(w.days))); bd.append(tr); });
    tb.append(bd); t.append(tb); body.append(W.rows.length ? t : el('div', 'hint', 'No work logged last week.'));
    const sec = (title, items) => { body.append(el('div', 'cm-cgk', title)); if (!items.length) body.append(el('div', 'hint', 'None.')); items.forEach((x) => body.append(x)); };
    sec('📅 Meetings this week', W.nextMeet.map((e) => { const a = el('a', 'cm-pi'); a.href = e.link || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(el('span', null, '📅'), el('span', 't', e.summary || 'Meeting'), el('span', 'tag', new Date(e.start).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))); return a; }));
    sec('🧊 Going cold — interested / negotiating, no contact for 14+ days', W.cold.map((r) => { const b = el('button', 'cm-pi'); b.type = 'button'; b.dataset.openCompany = r.id; b.append(el('span', null, C.flag(r.iso) || '🏢'), el('span', 't', r.company), el('span', 'tag', r.city || '')); return b; }));
    { body.append(el('div', 'cm-cgk', '🔥 Hot now')); const hb = el('div'); hotList(hb, null, 8); const g = hb.querySelector('.grp'); g && g.remove(); body.append(hb); }
    const row = el('div', 'cm-chips'); const em = el('a', 'cm-btn', '✉ Email this report'); em.target = '_blank'; em.rel = 'noopener noreferrer'; em.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('hi@kavikaplan.com')}&su=${encodeURIComponent(`Medint weekly report · ${new Date(W.a).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)}&body=${encodeURIComponent(weeklyText(W))}`;
    const cp = el('button', 'cm-btn ghost', '⧉ Copy as text'); cp.type = 'button'; cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(weeklyText(W)); cp.textContent = '✓ Copied'; } catch { C.say('Copy not allowed here', !0); } }); row.append(em, cp); body.append(row);
  }, { wide: !0, center: !0 }); }
// --- extra items in the ⋯ menu ---
function moreItems() { return [...(window.__cm3 && window.__cm3.moreExtra ? window.__cm3.moreExtra() : []),...(window.__m3 ? [...(SEQ_ON ? [['🔁 Follow-up sequences', (ev) => openSequences(ev.currentTarget)]] : []), ...(window.__cm3 ? [['🧾 Registrations', (ev) => window.__cm3.openRegistrations(ev.currentTarget)]] : [])] : []), ['📰 Weekly report', (ev) => openWeekly(ev.currentTarget)], ['🩺 Data health (all countries)', (ev) => openHealth(ev.currentTarget)], ['🔖 Save this view to Home', () => { __cm.closeSheet(); saveView(); }], ...(window.cmBoot ? [['🚪 Log out', () => { try { localStorage.removeItem('cmAskedPlan'); } catch { /* storage off */ } location.href = '/cdn-cgi/access/logout'; }]] : []), ...(isHouse() ? [['📤 Client report (weekly / monthly)', (ev) => window.__cm3 && window.__cm3.openClientReport(ev.currentTarget)], ['📊 Feature usage', (ev) => openUsage(ev.currentTarget)]] : [])]; }
// --- one place for each fact: brands seen in import records but missing from NetHunt's Brand field → add in one tap ---
function brandsFromImports() {
  if (__cm.curView() !== 'company') return; const card = document.getElementById('company-brands'); if (!card) return; const cid = dash.params().cid; const iv = __cm.rowsOf('import_values').find((x) => x.id === cid);
  const old = card.querySelector('.cm-impbrands'); const sig = `${cid}|${iv ? iv.suppliers : ''}|${(card.querySelector('.cm-cbrands') || {}).textContent || ''}`.slice(0, 600); if (old && old.dataset.sig === sig) return; old && old.remove(); if (!iv || !iv.suppliers) return;
  const have = low(card.querySelector('.cm-cbrands') ? card.querySelector('.cm-cbrands').textContent : ''); const sup = String(iv.suppliers).split(/,\s*/).map((x) => x.trim()).filter((x) => x.length > 2);
  const missing = sup.filter((x) => !have.includes(low(x).split(/\s+/)[0])); if (!missing.length) return;
  const box = __cm.el('div', 'cm-impbrands'); box.dataset.sig = sig; box.append(__cm.el('span', 'mut', '📦 In their import records, not in NetHunt yet:'));
  missing.slice(0, 8).forEach((m) => { const b = __cm.el('button', 'cm-chip', `＋ ${m}`); b.type = 'button'; b.title = 'Add to the company’s brands in NetHunt — one place for brands'; b.addEventListener('click', async () => { b.disabled = !0; try { const rec = dash.data('company_record'); const F = new Map('ok' === rec.status ? rec.data.map((r) => [r.field, r.value]) : []); const cur = String(F.get('Brand') || '').split('\n').map((x) => x.trim()).filter(Boolean); await __cm.nhCall('update_record', { folderId: __cm.NH_FOLDER, recordId: cid, fieldKeys: 'label', fields: { Brand: [...new Set([...cur, m])] } }); b.textContent = `✓ ${m}`; dash.refresh('company_record'); } catch (e) { b.disabled = !1; __cm.say(`Not saved — ${__cm.nhErr(e)}`, !0); } }); box.append(b); });
  card.append(box);
}
// --- shorter company page: the everyday parts first, the rest one tap away ---
function compactCompany() {
  if (__cm.curView() !== 'company') return; const v = document.getElementById('company-view'); if (!v) return; const full = !!(__cm.uiFlags || {}).fullCompany; v.classList.toggle('cm-compact', !full);
  const grid = v.querySelector('.cm-grid2'); if (!grid) return; let t = v.querySelector('.cm-moretoggle'); if (!t) { t = __cm.el('button', 'cm-btn ghost cm-moretoggle'); t.type = 'button'; t.addEventListener('click', () => { __cm.uiFlags = { ...(__cm.uiFlags || {}), fullCompany: !(__cm.uiFlags || {}).fullCompany }; compactCompany(); }); grid.after(t); }
  const lbl = full ? '▴ Show less' : '▾ More about this company — key numbers, business profile, registrations, market, all NetHunt fields'; if (t.textContent !== lbl) t.textContent = lbl; if (t.previousElementSibling !== grid) grid.after(t);
}

// ===================== 🇹🇷 trade terms with Türkiye, on every country page =====================
// FTAs in force (Türkiye Ministry of Trade list, 2026), the EU Customs Union, and preferential trade agreements (PTAs)
const TR_FTA = { AL: 2008, BA: 2003, CL: 2011, EG: 2007, CH: 1992, NO: 1992, IS: 1992, LI: 1992, FO: 2017, GE: 2008, IL: 1997, XK: 2019, MY: 2015, MU: 2013, MD: 2016, ME: 2010, MA: 2006, MK: 2000, PS: 2005, QA: 2025, RS: 2010, SG: 2017, KR: 2013, TN: 2005, GB: 2021, AE: 2023, VE: 2020 };
const TR_EU = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);
const TR_PTA = { PK: 'Trade in Goods Agreement (2023)', AZ: 'Preferential Trade Agreement (2021)', IR: 'Preferential Trade Agreement (2015)' };
function tradeTerms(iso) { const mi = __cm.rowsOf('market_intel').find((x) => x.iso === iso) || {}; const t = mi.tariff_vs_tr;
  const deal = TR_EU.has(iso) ? { k: 'cu', l: '🇪🇺 EU–Türkiye Customs Union', d: 'Industrial goods move duty-free under the EU–Türkiye Customs Union' } : TR_FTA[iso] ? { k: 'fta', l: `🤝 Free trade agreement (${TR_FTA[iso]})`, d: `Türkiye–${(__cm.countryOfIso(iso) || {}).country || iso} FTA in force since ${TR_FTA[iso]}: Turkish-origin goods get reduced or zero duty with a certificate of origin (EUR.1 / origin declaration)` } : TR_PTA[iso] ? { k: 'pta', l: `🤝 ${TR_PTA[iso]}`, d: 'Preferential (partial) agreement — lower duties on listed goods; check the product list' } : { k: 'none', l: 'No trade agreement', d: 'No FTA with Türkiye — the normal (MFN) import duty applies' };
  return { t, deal }; }
function countryTradeLine() {
  if (__cm.curView() !== 'country') return; const iso = dash.params().iso; const tabs = document.querySelector('#country-view .cm-tabs'); if (!tabs) return; let line = tabs.querySelector('.cm-trline');
  if (!iso || __cm.multiIsos() || iso === 'TR') { line && line.remove(); return; }
  const mi = dash.data('market_intel'); const sig = `${iso}|${mi.status}`; if (line && line.dataset.sig === sig) return; line && line.remove();
  line = tradeLineEl(iso); line.dataset.sig = sig; tabs.append(line);
}
function tradeLineEl(iso) { const mi = dash.data('market_intel'); const { t, deal } = tradeTerms(iso); const line = __cm.el('span', 'cm-trline');
  const tar = __cm.el('span', `cm-trtar ${t == null ? '' : t === 0 ? 'zero' : t <= 0.05 ? 'low' : 'high'}`, `🇹🇷 Tariff on Türkiye: ${t == null ? ('ok' === mi.status ? 'not known' : '…') : `${(t * 100).toFixed(t * 100 % 1 ? 1 : 0)}%`}`); tar.title = 'Import duty this country applies to Turkish orthopaedic implants (joints, HS 9021.31) — ITC Market Access Map, from the Next Shoulder market report';
  const dl = __cm.el('span', `cm-trdeal ${deal.k}`, deal.l); dl.title = deal.d; line.append(tar, dl); return line; }

// ===================== people order for outreach: decision makers → people we talk to / referred → most relevant =====================
let talkMemo = { src: null, emails: new Set(), phones: new Set() };
function talkedTo() { const ch = dash.data('contact_history'); if ('ok' !== ch.status) return talkMemo; if (talkMemo.src !== ch.data) { const em = new Set(), ph = new Set(); ch.data.forEach((e) => { if (e.by_email) em.add(String(e.by_email).toLowerCase()); if (e.chat_number) ph.add(String(e.chat_number).replace(/\D/g, '').slice(-9)); }); talkMemo = { src: ch.data, emails: em, phones: ph }; } return talkMemo; }
function personGroup(p) { const C = __cm; const chatty = (chatS.get(dash.params().cid) || {}).rows; const hasChat = !!(chatty && chatty.some((r) => r.rid === p.id)); if (C.cmRank(p.title) <= 1) return 0; if (hasChat) return 1; const T = talkedTo(); const ems = String(p.email || p.emails || '').toLowerCase().split(/, | \| |\n/).filter(Boolean); const phs = C.splitBar(p.phone || p.phones || '').map((x) => String(x).replace(/\D/g, '').slice(-9)).filter((x) => x.length >= 7);
  const recent = p.last_interaction && Date.now() - new Date(p.last_interaction) < 365 * 864e5; if (recent || ems.some((e) => T.emails.has(e)) || phs.some((x) => T.phones.has(x)) || /refer|recommend|introduc/i.test(`${p.contact_type || ''} ${p.source || ''} ${p.notes || ''}`)) return 1; return 2; }
function personSort(a, b) { const C = __cm; const ch = (p) => { const r = (chatS.get(dash.params().cid) || {}).rows; return r ? r.filter((x) => x.rid === p.id).reduce((m, x) => (x.time > m ? x.time : m), '') : ''; }; return personGroup(a) - personGroup(b) || String(ch(b)).localeCompare(String(ch(a))) || C.cmRank(a.title) - C.cmRank(b.title) || String(b.last_interaction || '').localeCompare(String(a.last_interaction || '')) || C.cmReach(b) - C.cmReach(a); }
// ===================== a Person's countries (assignment rules + the companies they can see) =====================
let isoMemo = { key: '', val: null };
function allowedIsos() {
  if (isHouse()) return null; const C = __cm; const as = dash.data('medint_assign'); const ps = dash.data('pipeline_stages'); const nm = low(me().name);
  const key = `${nm}|${as.status}:${(as.data || []).length}|${ps.status}:${(ps.data || []).length}`; if (isoMemo.key === key) return isoMemo.val;
  const cs = C.rowsOf('countries'); const out = new Set();
  ('ok' === as.status ? as.data : []).filter((r) => r.active && low(r.person) === nm).forEach((r) => {
    if (r.type === 'Country') String(r.value).split(/[,;|]+/).map((v) => v.trim()).filter(Boolean).forEach((v) => { const c = cs.find((x) => low(x.iso) === low(v) || low(x.country) === low(v)); c && out.add(c.iso); });
    if (r.type === 'Region') cs.filter((c) => low(c.region) === low(r.value)).forEach((c) => out.add(c.iso)); });
  if (window.cmBoot && 'ok' === ps.status) ps.data.forEach((r) => r.iso && out.add(r.iso)); // on the website a Person only receives their own companies
  const val = out.size ? out : null; isoMemo = { key, val }; return val; // nothing known yet → don't hide anything
}
// ===================== shared Medint items in NetHunt (the “Medint Ignore” folder, Kind = Sequence / Registration) =====================
const itemsS = { at: 0, busy: !1, rows: null, err: null };
function loadItems(force) {
  if (itemsS.busy || (!force && (itemsS.rows || itemsS.err) && Date.now() - itemsS.at < 90e3)) return itemsS.rows; itemsS.busy = !0; // a failed read waits too (no retry storm)
  (async () => { const out = []; let cur = null; let n = 0;
    do { const p = await __cm.nhCall('filter_records', { folderId: IGN_FOLDER, fieldKeys: 'label', filter: { Kind: { _exists: !0 } }, limit: 500, ...(cur ? { cursor: cur } : {}) });
      (p.records || []).forEach((r) => { const f = r.fields || {}; let d = {}; try { d = JSON.parse(f.Data || '{}'); } catch { /* bad row */ } out.push({ id: r.id, kind: f.Kind, name: f.Name || '', cid: f['Company ID'] || [].concat(f.Company || [])[0] || '', by: f.By || '', d }); });
      cur = p.nextCursor; n++; } while (cur && n < 6);
    itemsS.rows = out; itemsS.at = Date.now(); itemsS.err = null; })().catch((e) => { itemsS.err = __cm.nhErr ? __cm.nhErr(e) : String(e); itemsS.at = Date.now(); }).finally(() => { itemsS.busy = !1; if (itemsS.err && !itemsS.rows) return; seqCheckReplies(); pqMemo.key = ''; hmKey = ''; try { const t = (document.getElementById('cm-sheet-title') || {}).textContent || ''; if (/^(🔁|🧾|⚡)/.test(t)) __cm.sheetDraw && __cm.sheetDraw(); drawHome(); } catch { /* closed */ } });
  return itemsS.rows;
}
setTimeout(() => { try { loadItems(); } catch { /* not ready */ } }, 10e3); setInterval(() => { try { loadItems(!0); } catch { /* offline */ } }, 5 * 60e3);
const items = (kind) => (loadItems() || []).filter((x) => x.kind === kind);
async function saveItem(kind, it, d, nm) {
  const C = __cm; const fields = { Kind: kind, Data: JSON.stringify(d), By: me().name, ...(nm ? { Name: nm.slice(0, 200) } : {}) };
  if (d.cid) { fields.Company = [d.cid]; fields['Company ID'] = d.cid; }
  const r = it ? await C.nhCall('update_record', { folderId: IGN_FOLDER, recordId: it.id, fieldKeys: 'label', fields }) : await C.nhCall('create_record', { folderId: IGN_FOLDER, fieldKeys: 'label', fields: { Name: nm || kind, ...fields } });
  const row = { id: (r && r.id) || (it && it.id), kind, name: nm || (it && it.name) || kind, cid: d.cid || '', by: me().name, d };
  itemsS.rows = [...(itemsS.rows || []).filter((x) => x.id !== row.id), row]; pqMemo.key = ''; hmKey = ''; return row;
}
const isoDay = (t) => new Date(t).toISOString().slice(0, 10); const addDays = (iso, n) => isoDay(new Date(`${iso}T12:00:00Z`).getTime() + n * 864e5);
// ===================== 🔁 follow-up sequences =====================
const SEQ_TPL = { standard: ['Standard · day 0 / 3 / 7 / 14', [[0, 'whatsapp'], [3, 'email'], [7, 'call'], [14, 'whatsapp']]], gentle: ['Gentle · day 0 / 5 / 12 / 21', [[0, 'email'], [5, 'whatsapp'], [12, 'call'], [21, 'email']]], quick: ['Quick · day 0 / 2 / 5 / 9', [[0, 'whatsapp'], [2, 'call'], [5, 'email'], [9, 'whatsapp']]] };
const SEQ_CH = { whatsapp: ['💬', 'WhatsApp', 'WhatsApp'], email: ['✉', 'Email', 'Email'], call: ['☎', 'Call', 'Call'] };
function seqState(s) { const d = s.d; const steps = d.steps || []; const done = d.done || []; const i = done.length; if (d.status !== 'Active' || i >= steps.length) return { i, due: null, step: null };
  const prevDone = done[i - 1]; const planned = addDays(d.start, steps[i][0]); const gap = i ? steps[i][0] - steps[i - 1][0] : 0; const due = prevDone && addDays(prevDone, gap) > planned ? addDays(prevDone, gap) : planned; return { i, due, step: steps[i] }; }
const seqFor = (cid) => items('Sequence').filter((s) => s.cid === cid).sort((a, b) => String(b.d.start).localeCompare(String(a.d.start)))[0] || null;
const seqActive = (cid) => { const s = seqFor(cid); return s && s.d.status === 'Active' ? s : null; };
function seqDraft(s, lang, first, brand, company) { const i = (s.d.done || []).length; const n = (s.d.steps || []).length; const last = i === n - 1; const ch = ((s.d.steps || [])[i] || [])[1] || 'whatsapp'; const nm = first ? ` ${first}` : '';
  const T = {
    en: [`Hello${nm}, I'm reaching out from ${brand}. We make orthopaedic implants and are looking for a strong distribution partner in your market. Could we have a short call this week?`, `Dear${nm},\n\nFollowing up on my message about ${brand}. I've attached our catalogue — I'd be glad to hear which product lines fit ${company}'s portfolio and to arrange a short call.\n\nKind regards`, `Call: introduce ${brand}, ask who handles new product lines, which brands they carry today, and agree a next step (catalogue, prices or a meeting).`, `Hello${nm}, one last note from ${brand}: if partnering isn't a priority right now, no problem — just let me know and I won't follow up. If it is, I'd be happy to send prices and samples.`],
    es: [`Hola${nm}, le escribo de ${brand}. Fabricamos implantes ortopédicos y buscamos un distribuidor sólido en su mercado. ¿Podríamos tener una llamada breve esta semana?`, `Estimado/a${nm}:\n\nLe escribo como seguimiento a mi mensaje sobre ${brand}. Adjunto nuestro catálogo; me encantaría saber qué líneas encajan con el portafolio de ${company} y coordinar una breve llamada.\n\nSaludos cordiales`, `Llamada: presentar ${brand}, preguntar quién decide nuevas líneas, qué marcas manejan hoy y acordar un siguiente paso (catálogo, precios o reunión).`, `Hola${nm}, un último mensaje de ${brand}: si ahora no es prioridad, no hay problema — avíseme y no insistiré. Si le interesa, con gusto le envío precios y muestras.`],
    pt: [`Olá${nm}, escrevo da ${brand}. Fabricamos implantes ortopédicos e procuramos um distribuidor forte no seu mercado. Podemos falar rapidamente esta semana?`, `Prezado(a)${nm},\n\nDando seguimento à minha mensagem sobre a ${brand}, envio o nosso catálogo. Gostaria de saber quais linhas se encaixam no portfólio da ${company} e marcar uma conversa curta.\n\nAtenciosamente`, `Ligação: apresentar a ${brand}, perguntar quem decide novas linhas, quais marcas trabalham hoje e combinar o próximo passo.`, `Olá${nm}, uma última mensagem da ${brand}: se não for prioridade agora, sem problema — é só avisar. Se for, envio preços e amostras com prazer.`],
    fr: [`Bonjour${nm}, je vous contacte de la part de ${brand}. Nous fabriquons des implants orthopédiques et cherchons un distributeur solide sur votre marché. Pourrions-nous échanger brièvement cette semaine ?`, `Bonjour${nm},\n\nJe reviens vers vous au sujet de ${brand}. Vous trouverez notre catalogue ci-joint ; je serais ravi de savoir quelles gammes conviennent à ${company} et d'organiser un court appel.\n\nCordialement`, `Appel : présenter ${brand}, demander qui décide des nouvelles gammes, quelles marques ils distribuent et convenir d'une prochaine étape.`, `Bonjour${nm}, un dernier message de ${brand} : si ce n'est pas une priorité, aucun souci — dites-le-moi et je n'insisterai pas. Sinon, je vous envoie volontiers prix et échantillons.`],
    tr: [`Merhaba${nm}, ${brand} adına yazıyorum. Ortopedik implant üretiyoruz ve pazarınızda güçlü bir distribütör arıyoruz. Bu hafta kısa bir görüşme yapabilir miyiz?`, `Sayın${nm},\n\n${brand} ile ilgili mesajımın devamı olarak kataloğumuzu ekte gönderiyorum. ${company} portföyüne hangi ürün gruplarının uyduğunu duymak ve kısa bir görüşme ayarlamak isterim.\n\nSaygılarımla`, `Arama: ${brand}'ı tanıt, yeni ürün gruplarına kimin karar verdiğini ve bugün hangi markaları taşıdıklarını sor, bir sonraki adımı kararlaştır.`, `Merhaba${nm}, ${brand}'tan son bir not: şu an öncelik değilse sorun değil — haber verin, tekrar yazmayayım. İlgilenirseniz fiyat ve numune göndermekten memnuniyet duyarım.`],
    it: [`Buongiorno${nm}, la contatto da parte di ${brand}. Produciamo impianti ortopedici e cerchiamo un distributore solido nel suo mercato. Possiamo fare una breve chiamata questa settimana?`, `Gentile${nm},\n\nfaccio seguito al mio messaggio su ${brand} e le allego il nostro catalogo. Sarei felice di sapere quali linee si adattano al portafoglio di ${company} e di fissare una breve chiamata.\n\nCordiali saluti`, `Chiamata: presentare ${brand}, chiedere chi decide le nuove linee, quali marchi trattano oggi e concordare il prossimo passo.`, `Buongiorno${nm}, un ultimo messaggio da ${brand}: se ora non è una priorità, nessun problema — me lo dica e non insisterò. Altrimenti le invio volentieri prezzi e campioni.`],
  };
  const L = T[lang] || T.en; const k = last && n > 1 ? 3 : ch === 'call' ? 2 : ch === 'email' && i > 0 ? 1 : i === 0 ? 0 : ch === 'email' ? 1 : 0; return L[k];
}
async function seqTouched(cid, action) { // a call / WhatsApp / email on a company with a due step → that step is done
  const s = seqActive(cid); if (!s) return; const st = seqState(s); if (!st.step) return; const want = { whatsapp: 'WhatsApp', email: 'Email', call: 'Call' }[st.step[1]];
  if (action !== want && !(st.step[1] === 'call' && action === 'WhatsApp')) return; if (st.due > addDays(isoDay(Date.now()), 1)) return;
  const done = [...(s.d.done || []), isoDay(Date.now())]; const d = { ...s.d, done, status: done.length >= (s.d.steps || []).length ? 'Done' : 'Active' };
  try { await saveItem('Sequence', s, d); __cm.say(d.status === 'Done' ? '🔁 Sequence finished — all steps done' : `🔁 Step ${done.length} of ${d.steps.length} done · next: ${SEQ_CH[d.steps[done.length][1]][1]} on ${new Date(`${seqState({ d }).due}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`); } catch { /* retried next time */ }
}
let seqChecked = 0;
function seqCheckReplies() { // they wrote back → the sequence stops by itself
  if (Date.now() - seqChecked < 60e3) return; const ch = dash.data('contact_history'); if ('ok' !== ch.status) return; seqChecked = Date.now();
  items('Sequence').filter((s) => s.d.status === 'Active').forEach((s) => { const from = s.d.startAt || Date.parse(`${s.d.start}T00:00:00`); const hit = ch.data.find((e) => e.record_id === s.cid && e.dir === 'in' && +new Date(e.time) > from); /* a message after the sequence began */ if (hit) saveItem('Sequence', s, { ...s.d, status: 'Replied', replied: String(hit.time).slice(0, 10) }).then(() => __cm.say(`🔁 ${s.d.company || 'A company'} replied — its sequence stopped`)).catch(() => {}); });
}
function seqDue() { const today = isoDay(Date.now()); return items('Sequence').filter((s) => s.d.status === 'Active').map((s) => ({ s, st: seqState(s) })).filter((x) => x.st.due && x.st.due <= today); }
function seqBadge(cid) { const s = seqFor(cid); if (!s) return null; const st = seqState(s); const el = __cm.el; const n = (s.d.steps || []).length;
  const b = el('button', `cm-chip cm-seqchip ${s.d.status === 'Active' ? (st.due && st.due <= isoDay(Date.now()) ? 'due' : 'on') : 'off'}`, s.d.status === 'Active' ? `🔁 Step ${st.i + 1}/${n} · ${SEQ_CH[st.step[1]][0]} ${st.due <= isoDay(Date.now()) ? 'due now' : new Date(`${st.due}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : `🔁 ${s.d.status}`); b.type = 'button'; b.addEventListener('click', (e) => openSequence(e.currentTarget, cid)); return b; }
function openSequence(anchor, cid, name0) {
  const C = __cm; const el = C.el; const p = C.rowsOf('pipeline_stages').find((x) => x.id === cid) || C.companyById(cid) || {}; const name = name0 || p.company || 'Company';
  C.openSheet(anchor, `🔁 Follow-up sequence · ${name}`, (body) => {
    const s = seqFor(cid);
    if (s && s.d.status === 'Active') { const st = seqState(s); const steps = s.d.steps || [];
      body.append(el('p', 'mut', `Started ${new Date(`${s.d.start}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} by ${s.by || s.d.owner || '—'} · ${s.d.contact ? `to ${s.d.contact} · ` : ''}${(s.d.lang || 'en').toUpperCase()} · stops by itself when they reply`));
      const ol = el('ol', 'cm-seqsteps'); steps.forEach(([day, ch], k) => { const li = el('li', k < (s.d.done || []).length ? 'done' : k === st.i ? 'cur' : ''); const when = k < (s.d.done || []).length ? `✓ ${new Date(`${s.d.done[k]}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : k === st.i ? `due ${new Date(`${st.due}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : `day ${day}`; li.append(el('b', null, `${SEQ_CH[ch][0]} ${SEQ_CH[ch][1]}${k === steps.length - 1 ? ' · last try' : ''}`), el('span', 'mut', when)); ol.append(li); }); body.append(ol);
      const draft = el('textarea', 'cm-phdraft'); draft.value = seqDraft(s, s.d.lang, String(s.d.contact || '').split(' ')[0], C.OURS[s.d.brand] ? C.OURS[s.d.brand].label : 'Next Shoulder', name); draft.rows = 6; body.append(el('div', 'k', `Draft for step ${st.i + 1}`), draft);
      const row = el('div', 'cm-chips'); const go = el('button', 'cm-btn', '⚡ Do it in Power hour'); go.type = 'button'; go.addEventListener('click', () => { C.closeSheet(); openPowerHour(document.querySelector('.cm-phtop'), cid); });
      const dn = el('button', 'cm-btn ghost', '✓ Mark this step done'); dn.type = 'button'; dn.addEventListener('click', async () => { const done = [...(s.d.done || []), isoDay(Date.now())]; await saveItem('Sequence', s, { ...s.d, done, status: done.length >= steps.length ? 'Done' : 'Active' }); C.sheetDraw(); });
      const stp = el('button', 'cm-btn ghost', '⏹ Stop'); stp.type = 'button'; stp.addEventListener('click', async () => { await saveItem('Sequence', s, { ...s.d, status: 'Stopped', stopped: isoDay(Date.now()) }); C.sheetDraw(); });
      const cp = el('button', 'cm-btn ghost', '⧉ Copy draft'); cp.type = 'button'; cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(draft.value); cp.textContent = '✓ Copied'; } catch { /* not allowed */ } });
      row.append(go, dn, cp, stp); body.append(row); return; }
    if (s) body.append(el('div', 'hint', `Last sequence: ${s.d.status}${s.d.replied ? ` (they replied ${s.d.replied})` : ''}. Start a new one below.`));
    body.append(el('p', 'mut', 'Medint schedules each step, shows it in Power hour on the day (with a draft in their language), marks it done when you call, WhatsApp or email them, and stops by itself when they reply.'));
    const f = { tpl: 'standard', lang: (C.langsFor ? C.langsFor(p.iso) : [])[0] || ({ ES: 'es', MX: 'es', CO: 'es', PE: 'es', EC: 'es', CL: 'es', AR: 'es', GT: 'es', PA: 'es', BO: 'es', PY: 'es', UY: 'es', VE: 'es', CR: 'es', DO: 'es', HN: 'es', SV: 'es', NI: 'es', BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', FR: 'fr', MA: 'fr', DZ: 'fr', TN: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', TR: 'tr', IT: 'it' }[p.iso] || 'en'), start: isoDay(Date.now()), contact: '' };
    const sel = (opts, v, on) => { const x = el('select', 'cm-phtpl'); opts.forEach(([a, l]) => x.append(new Option(l, a))); x.value = v; x.addEventListener('change', () => on(x.value)); return x; };
    const ppl = dash.params().cid === cid ? C.rowsOf('company_contacts').slice().sort(personSort) : [];
    const g = el('div', 'cm-regform');
    g.append(el('label', null, 'Steps'), sel(Object.entries(SEQ_TPL).map(([k, [l]]) => [k, l]), f.tpl, (v) => { f.tpl = v; }), el('label', null, 'Language'), sel([['en', 'English'], ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'], ['tr', 'Türkçe'], ['it', 'Italiano']], f.lang, (v) => { f.lang = v; }));
    if (ppl.length) { f.contact = ppl[0].name; g.append(el('label', null, 'To'), sel(ppl.map((x) => [x.name, `${x.name}${x.title ? ` · ${x.title}` : ''}`]), f.contact, (v) => { f.contact = v; })); }
    const sd = el('input'); sd.type = 'date'; sd.value = f.start; sd.addEventListener('change', () => { f.start = sd.value || f.start; }); g.append(el('label', null, 'Start'), sd); body.append(g);
    const b = el('button', 'cm-btn', '🔁 Start sequence'); b.type = 'button'; b.addEventListener('click', async () => { b.disabled = !0; try { const k = C.oursKey(); const brand = C.OURS[k] && !C.OURS[k].all ? k : 'next'; await saveItem('Sequence', null, { cid, company: name, iso: p.iso, brand, lang: f.lang, contact: f.contact, owner: me().name, start: f.start, startAt: f.start === isoDay(Date.now()) ? Date.now() : Date.parse(`${f.start}T00:00:00`), steps: SEQ_TPL[f.tpl][1], done: [], status: 'Active' }, `Sequence · ${name}`); miLog({ action: 'Other', company_id: cid, outcome: `sequence started: ${f.tpl}` }); C.sheetDraw(); } catch (e) { b.disabled = !1; C.say(`Not saved — ${C.nhErr(e)}`, !0); } }); body.append(b);
  }, { center: !0 });
}
function openSequences(anchor) { const C = __cm; const el = C.el;
  C.openSheet(anchor, '🔁 Follow-up sequences', (body) => { const all = loadItems(); if (!all) { body.append(el('div', 'hint', itemsS.err ? `Couldn’t read them: ${itemsS.err}` : 'Loading…')); return; }
    const S = items('Sequence').map((s) => ({ s, st: seqState(s) })); const today = isoDay(Date.now());
    const grp = [['⏰ Due today or overdue', S.filter((x) => x.s.d.status === 'Active' && x.st.due && x.st.due <= today)], ['▶ Active, coming up', S.filter((x) => x.s.d.status === 'Active' && x.st.due > today).sort((a, b) => a.st.due.localeCompare(b.st.due))], ['💬 Replied — sequence stopped by itself', S.filter((x) => x.s.d.status === 'Replied')], ['✓ Finished or stopped', S.filter((x) => ['Done', 'Stopped'].includes(x.s.d.status))]];
    if (!S.length) body.append(el('p', 'mut', 'No sequences yet. Start one from a company page (🔁 Sequence) or from Power hour.'));
    grp.forEach(([t, L]) => { if (!L.length) return; body.append(el('div', 'cm-cgk', `${t} · ${L.length}`)); L.forEach(({ s }) => { const r = el('div', 'cm-pi cm-seqrow'); const nm = el('button', 'cm-co', `${C.flag(s.d.iso) || ''} ${s.d.company || s.name}`); nm.type = 'button'; nm.dataset.openCompany = s.cid; r.append(nm, el('span', 'mut', s.d.owner || s.by || '')); const bd = seqBadge(s.cid); bd && r.append(bd); body.append(r); }); });
  }, { wide: !0, center: !0 }); }
// ===================== ✎ edit a person (name, title, phones, emails, LinkedIn) =====================
function editPerson(anchor, p, companyId) { const C = __cm; const el = C.el; const isNew = !p || !p.id; p = p || {};
  C.openSheet(anchor, isNew ? '＋ Add a person' : `✎ ${p.name || 'Person'}`, (body) => { const g = el('div', 'cm-regform'); const v = { name: p.name || '', title: p.title || '', phones: C.splitBar(p.phone || p.phones || '').join('\n'), emails: String(p.email || p.emails || '').split(/, | \| |\n/).filter(Boolean).join('\n'), linkedin: p.linkedin || '', facebook: p.facebook || '', instagram: p.instagram || '' };
    const inp = (k, ph, multi) => { const x = el(multi ? 'textarea' : 'input'); if (multi) x.rows = 3; x.value = v[k]; x.placeholder = ph; x.addEventListener('input', () => { v[k] = x.value; }); return x; };
    g.append(el('label', null, 'Name'), inp('name', 'Full name'), el('label', null, 'Title'), inp('title', 'e.g. Gerente general'), el('label', null, 'Phones'), inp('phones', 'One per line — the first one is used for WhatsApp, e.g. +39 347 843 4464', !0), el('label', null, 'Emails'), inp('emails', 'One per line', !0), el('label', null, 'LinkedIn'), inp('linkedin', 'https://www.linkedin.com/in/…'), el('label', null, 'Facebook'), inp('facebook', 'https://facebook.com/…'), el('label', null, 'Instagram'), inp('instagram', '@name or link'));
    body.append(g, el('div', 'mut', isNew ? 'Saved as a contact on this company in NetHunt — it counts in “Details you found today”.' : 'Tip: put the working WhatsApp number first. A number that isn’t on WhatsApp can stay for calls — mark it with × next to the WhatsApp icon.'));
    const row = el('div', 'cm-chips'); const sv = el('button', 'cm-btn', isNew ? '＋ Add to NetHunt' : '💾 Save to NetHunt'); sv.type = 'button';
    sv.addEventListener('click', async () => { const nm = v.name.trim(); if (isNew && !nm) { C.say('Add a name', !0); return; } sv.disabled = !0; const fields = {};
      if (nm && nm !== p.name) { fields.Name = nm; const [a, ...b] = nm.split(' '); fields['First name'] = a; fields['Last name'] = b.join(' '); } if (v.title.trim() !== (p.title || '')) fields.Title = v.title.trim();
      const ph = v.phones.split(/\n|,|;/).map((x) => x.trim()).filter(Boolean); const em = v.emails.split(/\n|,|;|\s/).map((x) => x.trim()).filter((x) => /@/.test(x)); if (ph.length || !isNew) fields['Phone number'] = ph; if (em.length || !isNew) fields.Email = em;
      ['linkedin', 'facebook', 'instagram'].forEach((k) => { if (v[k].trim() !== (p[k] || '')) fields[{ linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram' }[k]] = v[k].trim(); });
      try { if (isNew) await C.nhCall('create_record', { folderId: CT_ID, fieldKeys: 'label', fields: { ...fields, Company: [companyId || dash.params().cid] } }); else await C.nhCall('update_record', { folderId: CT_ID, recordId: p.id, fieldKeys: 'label', fields });
        C.say(`✓ ${nm || p.name} ${isNew ? 'added' : 'saved'}`); dash.refresh('company_contacts'); C.closeSheet(); } catch (e) { sv.disabled = !1; C.say(`Not saved — ${C.nhErr(e)}`, !0); } });
    if (!isNew) { const del = el('button', 'cm-mini cm-pdel', '🗑 Delete this contact'); del.type = 'button'; del.title = 'Moves the contact to NetHunt’s trash (it can be restored there)';
      del.addEventListener('click', async () => { if (!window.confirm(`Delete ${p.name || 'this contact'}? It goes to NetHunt’s trash and can be restored there.`)) return; del.disabled = !0;
        try { await C.nhCall('delete_record', { folderId: CT_ID, recordId: p.id }); miLog({ action: 'Other', company_id: companyId || dash.params().cid, outcome: 'contact deleted', text: p.name || '' }); C.say(`🗑 ${p.name || 'Contact'} deleted`); dash.refresh('company_contacts'); C.closeSheet(); } catch (e) { del.disabled = !1; C.say(`Not deleted — ${C.nhErr(e)}`, !0); } });
      row.append(del); }
    row.append(sv); body.append(row); }, { center: !0 }); }
// a ✎ on every person row (company page People and Power hour People)
function personEditButtons() { const C = __cm; const pc = dash.data('company_contacts'); if ('ok' !== pc.status) return; const byName = new Map(pc.data.map((p) => [low(p.name), p]));
  document.querySelectorAll('#company-people .cm-person, #cm-sheet:not([hidden]) .cm-phppl .cm-crow2').forEach((row) => { if (row.querySelector('.cm-pedit')) return; const nmEl = row.querySelector('.pn, .nm'); if (!nmEl) return; const p = byName.get(low(nmEl.textContent.trim())); if (!p) return;
    const b = C.el('button', 'cm-mini cm-pedit', '✎'); b.type = 'button'; b.title = 'Edit name, title, phones, emails, LinkedIn'; b.addEventListener('click', (e) => { e.stopPropagation(); editPerson(e.currentTarget, p); }); nmEl.append(b); }); }

// ===================== congresses: an expected next edition when the next date isn't announced yet =====================
// yearly series whose last edition was in the past 12 months get a clearly marked “≈ expected” edition one year later, so planning isn't blind; it disappears once the real date is in the data
function cgAugment() { const d = dash.data('congresses'); if ('ok' !== d.status || !Array.isArray(d.data) || d.data.__aug) return; const rows = d.data; const today = isoDay(Date.now()); const by = new Map();
  rows.forEach((r) => { if (!r.event_id) return; (by.get(r.event_id) || by.set(r.event_id, []).get(r.event_id)).push(r); });
  let n = 0; by.forEach((v) => { if (v.some((x) => x.start && x.start >= today)) return; const last = v.filter((x) => x.start).sort((a, b) => String(b.start).localeCompare(String(a.start)))[0]; if (!last) return;
    if (last.start < addDays(today, -365)) return; const fq = String(last.frequency || ''); const sc = String(last.scope || '');
    const yearly = /annual|yearly|every year|each year/i.test(fq) || (/not verified/i.test(fq) && /national|regional|state|subnational/i.test(sc) && !/global|world/i.test(sc)); if (!yearly || /cancel/i.test(last.status || '')) return;
    const st = addDays(last.start, 364); const en = last.end ? addDays(last.end, 364) : ''; if (st < today) return;
    rows.push({ ...last, id: `${last.event_id}-X`, start: st, end: en, year: +st.slice(0, 4), edition: '≈ expected — date not announced yet', status: 'Expected (yearly pattern) — check the official site', expected: !0 }); n++; });
  Object.defineProperty(rows, '__aug', { value: n || 1, enumerable: !1 }); if (n) { cgKey = ''; hmKey = ''; }
}
// ===================== 💬 WhatsApp chats linked to a PERSON count for their company =====================
// NetHunt often links a chat to the contact (the person), not the company. Medint reads the Contacts timeline, finds each person's company and adds those chats to the
// company's history — so “last contact”, “they wrote”, Power hour, sequences (stop on reply), Recent activity and the AI summaries all see them.
const CT_ID = '6682e9b8b6386800f586c0b0';
const pcS = { at: 0, busy: !1, rows: [], map: (() => { try { return JSON.parse(localStorage.getItem('cmPersonCo') || '{}'); } catch { return {}; } })() };
function personChats(force) {
  const ch = dash.data('contact_history'); if ('ok' !== ch.status || pcS.busy || (!force && Date.now() - pcS.at < 10 * 60e3)) return; pcS.busy = !0;
  (async () => { const from = dash.params().hist_from || new Date(Date.now() - 90 * 864e5).toISOString(); const ev = []; let cur = null; let n = 0;
    do { const p = await __cm.nhCall('list_folder_timeline', { folderId: CT_ID, from, limit: 1000, types: ['chat'], ...(cur ? { cursor: cur } : {}) }); ev.push(...(p.events || [])); cur = p.nextCursor; n++; } while (cur && n < 3);
    const need = [...new Set(ev.map((e) => e.recordId))].filter((id) => !(id in pcS.map)).slice(0, 30); // a few at a time — the rest on the next round
    const q = need.slice(); await Promise.all([0, 1].map(async () => { while (q.length) { const id = q.shift(); try { const r = await __cm.nhCall('get_record', { folderId: CT_ID, recordId: id, fieldKeys: 'label' }); pcS.map[id] = { c: [].concat((r.fields || {}).Company || []).map((x) => (x && x.id) || x).filter(Boolean), n: (r.fields || {}).Name || [(r.fields || {})['First name'], (r.fields || {})['Last name']].filter(Boolean).join(' ') }; } catch { pcS.map[id] = { c: [], n: '' }; } } }));
    try { localStorage.setItem('cmPersonCo', JSON.stringify(pcS.map)); } catch { /* storage off */ }
    const rows = []; ev.forEach((e) => { const m = pcS.map[e.recordId]; if (!m || !m.c.length) return; m.c.forEach((co) => rows.push({ record_id: co, time: e.timeISO || new Date(Number(e.time)).toISOString(), type: 'chat', dir: e.chat && e.chat.status === 'NOT_REPLIED' ? 'in' : 'out', by: m.n || '', by_email: '', chat_number: e.chat ? String(e.chat.name || '') : '', preview: String((e.chat && e.chat.lastMessage && e.chat.lastMessage.body) || '').slice(0, 140), via: 'person', person_id: e.recordId, person: m.n || '' })); });
    pcS.rows = rows; pcS.at = Date.now();
    const d = dash.data('contact_history'); if ('ok' === d.status && Array.isArray(d.data)) { const have = new Set(d.data.map((x) => `${x.record_id}|${x.time}|${x.chat_number}`)); rows.forEach((r) => { const k = `${r.record_id}|${r.time}|${r.chat_number}`; if (!have.has(k)) { have.add(k); d.data.push(r); } }); }
    pqMemo.key = ''; hmKey = ''; seqChecked = 0; seqCheckReplies(); try { drawHome(); } catch { /* not on Home */ }
  })().catch(() => { pcS.at = Date.now() - 8 * 60e3; /* try again in ~2 minutes */ }).finally(() => { pcS.busy = !1; });
}
window.__m3 = !0; // the second half of Medint (sequences, registrations, report, people chats) is loaded
setTimeout(() => { try { personChats(); } catch { /* not ready */ } }, 45e3); setInterval(() => { try { personChats(); } catch { /* offline */ } }, 5 * 60e3); // background: after the page has settled, then every 5 minutes
// ===================== 🧾 what I logged — change an outcome or add to a note later =====================
// NetHunt doesn't let other apps edit a call or comment once saved, so Medint corrects its own log and adds a short “✎ Update” comment under it in NetHunt
const EDIT_ACTS = new Set(['Call', 'WhatsApp', 'Email', 'Comment', 'Meeting', 'Other']);
function myEntries(cid) { const rows = homeLog() || []; const nm = me().name; const from = Date.now() - 14 * 864e5; return rows.filter((r) => r.company_id === cid && r.person === nm && r.epoch >= from && !r.voided && EDIT_ACTS.has(r.action) && !(r.action === 'Other' && !/^result:|^plan:/.test(r.outcome || '') ) && !/^plan:|^usage|^sequence|^registration|^client report/.test(r.outcome || '')).sort((a, b) => b.epoch - a.epoch); }
function openMyEntries(anchor, cid, name) { const C = __cm; const el = C.el; needLog(Date.now() - 14 * 864e5);
  C.openSheet(anchor, `🧾 What I logged · ${name || 'company'}`, (body) => { const L = myEntries(cid); if (!homeLog()) { body.append(loadingOrError()); return; }
    body.append(el('p', 'mut', 'Your calls, messages and notes on this company in the last 14 days. Change the outcome (e.g. “No answer” → “Spoke”) or add to what you wrote — Medint updates its log and adds an “✎ Update” note in NetHunt.'));
    if (!L.length) { body.append(el('div', 'hint', 'Nothing logged by you here in the last 14 days.')); return; }
    L.forEach((r) => { const card = el('div', 'cm-myent'); const when = new Date(r.epoch).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const ic = { Call: '☎', WhatsApp: '💬', Email: '✉', Comment: '📝', Meeting: '📅', Other: '•' }[r.action] || '•';
      const head = el('div', 'h'); head.append(el('b', null, `${ic} ${r.action === 'Other' ? 'Result' : r.action}`), el('span', 'mut', ` · ${when}`), r.edited ? el('span', 'cm-edited', '✎ edited') : ''); card.append(head);
      const out = String(r.outcome || '').replace(/^result:\s*/, ''); if (out) card.append(el('div', 'o', out)); if (r.text) card.append(el('div', 'mut t', String(r.text).slice(0, 400)));
      const ed = el('button', 'cm-mini', '✎ Edit'); ed.type = 'button'; card.append(ed);
      ed.addEventListener('click', () => { ed.remove(); const f = el('div', 'cm-myedit'); const res = { v: (out.match(/^(No answer|Left message|Spoke|Meeting set|Not interested)/) || [])[1] || '' };
        const chips = el('div', 'cm-chips'); ['No answer', 'Left message', 'Spoke', 'Meeting set', 'Not interested'].forEach((x) => { const b = el('button', 'cm-chip', x); b.type = 'button'; b.setAttribute('aria-pressed', String(res.v === x)); b.addEventListener('click', () => { res.v = res.v === x ? '' : x; chips.querySelectorAll('.cm-chip').forEach((y) => y.setAttribute('aria-pressed', String(y.textContent === res.v))); }); chips.append(b); });
        const ta = el('textarea', 'cm-phdraft'); ta.rows = 3; ta.value = r.text || ''; ta.placeholder = 'Add what happened';
        const sv = el('button', 'cm-btn', '💾 Save change'); sv.type = 'button';
        sv.addEventListener('click', async () => { sv.disabled = !0; const newOut = res.v ? (r.action === 'Other' ? `result: ${res.v}` : res.v) : r.outcome || ''; const newText = ta.value.trim();
          if (newOut === (r.outcome || '') && newText === (r.text || '')) { C.say('Nothing changed'); sv.disabled = !1; return; }
          try { await C.nhCall('update_record', { folderId: MI.LOG, recordId: r.id, fieldKeys: 'label', fields: { Outcome: String(newOut).slice(0, 250), Text: newText.slice(0, 5000) } });
            const diff = [newOut !== (r.outcome || '') ? `${String(r.outcome || '—').replace(/^result:\s*/, '')} → ${String(newOut).replace(/^result:\s*/, '')}` : '', newText && newText !== (r.text || '') ? newText : ''].filter(Boolean).join(' — ');
            await C.nhCall('create_record_comment', { folderId: C.NH_FOLDER, recordId: cid, text: `✎ Update to the ${r.action === 'Other' ? 'result' : r.action.toLowerCase()} of ${when}: ${diff}` });
            r.outcome = newOut; r.text = newText; r.edited = !0; dS.at = 0; hmKey = ''; C.say('✓ Updated'); C.sheetDraw(); } catch (e) { sv.disabled = !1; C.say(`Not saved — ${C.nhErr(e)}`, !0); } });
        const cx = el('button', 'cm-btn ghost', 'Cancel'); cx.type = 'button'; cx.addEventListener('click', () => C.sheetDraw()); const r2 = el('div', 'cm-chips'); r2.append(sv, cx); f.append(chips, ta, r2); card.append(f); ta.focus(); });
      body.append(card); }); }, { center: !0 }); }
// ===================== 💬 full chats: the company's own chats + every chat with its people (WhatsApp, LinkedIn…) =====================
const chatS = new Map(); const trS = new Map();
function companyChats(cid) { // read right away for the open company: each person's chat list (Contacts timeline)
  const st = chatS.get(cid); if (st && (st.busy || Date.now() - st.at < 5 * 60e3)) return st.rows;
  const pc = dash.data('company_contacts'); if (dash.params().cid !== cid || 'ok' !== pc.status || (pc.data[0] && pc.data[0].for_cid && pc.data[0].for_cid !== cid)) return st ? st.rows : null;
  const ppl = pc.data.slice().sort(personSort).slice(0, 8); const S = { rows: st ? st.rows : null, busy: !0, at: Date.now() }; chatS.set(cid, S);
  (async () => { const out = []; const q = ppl.slice(); await Promise.all([0, 1, 2].map(async () => { while (q.length) { const p = q.shift(); await (async () => { try { const r = await __cm.nhCall('list_record_timeline', { folderId: CT_ID, recordId: p.id, limit: 6, types: ['chat'] });
    ((r && r.events) || []).forEach((e) => out.push({ folder: CT_ID, rid: p.id, person: p.name, id: e.id, time: e.timeISO || new Date(Number(e.time)).toISOString(), provider: (e.chat && e.chat.provider) || '', name: (e.chat && e.chat.name) || '', last: String((e.chat && e.chat.lastMessage && e.chat.lastMessage.body) || ''), count: (e.chat && e.chat.totalMessageCount) || 0, status: (e.chat && e.chat.status) || '' })); } catch { /* person not readable */ } })(); } })); // three at a time
    S.rows = out.sort((a, b) => String(b.time).localeCompare(String(a.time))); })().finally(() => { S.busy = !1; S.at = Date.now(); phSig = ''; try { if (__cm.curView() === 'company' && dash.params().cid === cid) dash.setParams({ actv: (dash.params().actv || 0) + 1 }); const t = (document.getElementById('cm-sheet-title') || {}).textContent || ''; if (/^⚡/.test(t)) __cm.sheetDraw(); } catch { /* closed */ } });
  return S.rows;
}
function chatTranscript(folder, rid, id, onDone) { const k = `${rid}|${id}`; const t = trS.get(k); if (t && (t.busy || t.msgs)) return t.msgs || null; trS.set(k, { busy: !0 });
  __cm.nhCall('get_record_timeline_item', { folderId: folder, recordId: rid, timelineId: id }).then((r) => { trS.set(k, { msgs: (r && r.messages) || [] }); }).catch((e) => { trS.set(k, { msgs: [], err: __cm.nhErr(e) }); }).finally(() => { onDone && onDone(); }); return null; }
function chatView(folder, rid, id, label, count) { const el = __cm.el; const box = el('div', 'cm-chatbox'); const b = el('button', 'cm-mini cm-chatopen', `▸ Full chat${count ? ` · ${count} messages` : ''}`); b.type = 'button';
  const area = el('div', 'cm-chatmsgs'); area.hidden = !0;
  const draw = () => { const k = `${rid}|${id}`; const t = trS.get(k) || {}; area.replaceChildren(); if (!t.msgs) { area.append(el('div', 'hint', 'Loading the chat…')); return; } if (t.err) { area.append(el('div', 'hint', `Couldn’t open it: ${t.err}`)); return; }
    let day = ''; t.msgs.forEach((m) => { const d = new Date(Number(m.time) || m.time || m.date); const dd = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); if (dd !== day) { day = dd; area.append(el('div', 'cm-chatday', dd)); }
      const bub = el('div', `cm-bub ${m.incoming ? 'in' : 'out'}`); bub.append(el('div', 'tx', String(m.body || (m.type && m.type !== 'text' ? `[${m.type}]` : '')).slice(0, 3000)), el('div', 'tm', `${m.incoming ? (label || 'They') : 'Us'} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`)); area.append(bub); });
    setTimeout(() => { area.scrollTop = area.scrollHeight; }, 0); };
  b.addEventListener('click', (e) => { e.stopPropagation(); area.hidden = !area.hidden; b.textContent = `${area.hidden ? '▸' : '▾'} Full chat${count ? ` · ${count} messages` : ''}`; if (!area.hidden) { chatTranscript(folder, rid, id, draw); draw(); } });
  box.append(b, area); return box; }
const LOGO_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#25D366" d="M16 2.7C8.7 2.7 2.8 8.5 2.8 15.7c0 2.5.7 4.9 2 6.9L2.7 29.3l6.9-2.1c2 1.1 4.2 1.6 6.4 1.6 7.3 0 13.2-5.8 13.2-13S23.3 2.7 16 2.7z"/><path fill="#fff" d="M22.9 19.3c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.1-2-2.5-.2-.4 0-.6.2-.7.2-.2.4-.4.6-.7.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-1 .5-.3.4-1.3 1.2-1.3 3s1.3 3.4 1.5 3.7c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.2-.7-.4z"/></svg>'; const LOGO_LI = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0A66C2"/><path fill="#fff" d="M9.2 12.5h3.5V23.4H9.2zM11 7.1a2 2 0 1 1 0 4.1 2 2 0 0 1 0-4.1zM14.9 12.5h3.3v1.5h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.2 2.3 4.2 5.4v5.8h-3.5v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.2h-3.5z"/></svg>'; // brand marks, transparent background
const chatLogo = (t) => (/linkedin/i.test(`${t.provider || ''} ${t.title || ''}`) ? LOGO_LI : LOGO_WA);
const chatWho = (title) => String(title || '').replace(/^(WhatsApp|LinkedIn|Telegram|Instagram)\s*·\s*/i, '');
const PROV = (p) => (/linkedin/i.test(p) ? 'LinkedIn' : /telegram/i.test(p) ? 'Telegram' : /instagram/i.test(p) ? 'Instagram' : 'WhatsApp');
// company page: a “💬 Chats” card next to Recent activity — one tidy row per chat, the whole conversation one tap away
const chatUi = { all: new Set() };
function chatCard() { const old = document.getElementById('company-chats'); old && old.remove(); return; }
function chatCardOld() { if (__cm.curView() !== 'company') return; const cid = dash.params().cid; const act = document.getElementById('company-activity'); if (!act || !cid) return;
  const rows = companyChats(cid); let card = document.getElementById('company-chats'); const sig = `${cid}|${chatUi.all.has(cid)}|${rows ? rows.map((r) => r.id + r.count + r.status).join(',') : 'x'}`; if (card && card.dataset.sig === sig) return;
  if (!rows || !rows.length) { if (card) card.remove(); return; } const el = __cm.el; const C = __cm;
  if (!card) { card = el('section', 'cm-card cm-chats'); card.id = 'company-chats'; act.before(card); } card.dataset.sig = sig;
  const waiting = rows.filter((r) => r.status === 'NOT_REPLIED').length; const hd = el('div', 'cm-chatshd'); hd.append(el('h2', null, '💬 Chats'), el('span', 'cm-chatcount', String(rows.length))); if (waiting) hd.append(el('span', 'cm-chatwait', `⏳ ${waiting} waiting for us`)); card.replaceChildren(hd);
  const showAll = chatUi.all.has(cid); const list = showAll ? rows : rows.slice(0, 3);
  list.forEach((r) => { const li = PROV(r.provider) === 'LinkedIn'; const row = el('div', `cm-chatrow ${li ? 'li' : 'wa'}${r.status === 'NOT_REPLIED' ? ' wait' : ''}`);
    const av = avatarEl(r.person, '', '', r.rid); const top = el('div', 'top'); const who = el('div', 'who'); who.append(el('b', null, r.person));
    const ch = el('span', `cm-chan ${li ? 'li' : 'wa'}`); ch.innerHTML = li ? (C.ICON_LI || '') : (C.ICON_WA || ''); ch.append(` ${li ? 'LinkedIn' : 'WhatsApp'}`); who.append(ch);
    if (!li && /^\d{8,}$/.test(r.name)) who.append(el('span', 'cm-chatnum', `+${r.name}`));
    const d = C.agoDays(r.time); const when = el('span', 'cm-chatwhen', d == null ? '' : d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(r.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d > 300 ? 'numeric' : undefined }));
    top.append(who, when); const bub = el('div', 'cm-chatlast'); bub.textContent = r.last.replace(/\s+\n/g, '\n').slice(0, 260); if (r.status === 'NOT_REPLIED') bub.prepend(el('span', 'cm-chatpill', 'They wrote · waiting for us'));
    const acts = el('div', 'acts'); const cv = chatView(r.folder, r.rid, r.id, r.person.split(' ')[0], r.count); const ob = cv.querySelector('.cm-chatopen'); const msgs = cv.querySelector('.cm-chatmsgs'); ob.className = 'cm-chip cm-chatopen'; ob.textContent = `💬 Open chat · ${r.count} message${r.count === 1 ? '' : 's'}`; ob.addEventListener('click', () => { ob.textContent = `${msgs.hidden ? '💬 Open chat' : '✕ Close chat'} · ${r.count} message${r.count === 1 ? '' : 's'}`; });
    acts.append(ob); if (!li && /^\d{8,}$/.test(r.name)) { const rp = el('a', `cm-chip cm-chatreply${r.status === 'NOT_REPLIED' ? ' hot' : ''}`); rp.href = `https://wa.me/${r.name}`; rp.target = '_blank'; rp.rel = 'noopener noreferrer'; rp.innerHTML = C.ICON_WA || ''; rp.append(r.status === 'NOT_REPLIED' ? ' Reply' : ' Message'); acts.append(rp); }
    const body = el('div', 'body'); body.append(top, bub, acts, msgs); row.append(av, body); card.append(row); });
  if (rows.length > 3) { const mb = el('button', 'cm-chip cm-chatmore', showAll ? '▴ Show fewer' : `▾ Show all ${rows.length} chats`); mb.type = 'button'; mb.addEventListener('click', () => { showAll ? chatUi.all.delete(cid) : chatUi.all.add(cid); chatCard(); }); card.append(mb); }
}
// a NetHunt call/comment you made ↔ your Medint log line (same company, same kind, within 3 minutes)
function logRowFor(t, cid) { if (!t || !['call', 'comment'].includes(t.type)) return null; const rows = homeLog() || []; const nm = me().name; const tt = +new Date(t.time); if (Date.now() - tt > 14 * 864e5) return null;
  const want = t.type === 'call' ? ['Call'] : ['Comment', 'Catalogue']; return rows.filter((r) => r.company_id === cid && r.person === nm && want.includes(r.action) && Math.abs(r.epoch - tt) < 3 * 60e3).sort((x, y) => Math.abs(x.epoch - tt) - Math.abs(y.epoch - tt))[0] || null; }
function actEdit(t, host) { const C = __cm; const el = C.el; const cid = dash.params().cid; const r = logRowFor(t, cid); if (!r) return null; const b = el('button', 'cm-mini cm-evedit', r.edited ? '✎ edited · edit' : '✎ Edit'); b.type = 'button'; b.title = 'Change the outcome or add to what you wrote';
  b.addEventListener('click', (ev) => { ev.stopPropagation(); const row = host || b.closest('.cm-ev, li'); if (!row || row.querySelector('.cm-myedit')) return; const out = String(r.outcome || '').replace(/^result:\s*/, ''); const f = el('div', 'cm-myedit'); const res = { v: (out.match(/^(No answer|Left message|Spoke|Meeting set|Not interested)/) || [])[1] || '' };
    const chips = el('div', 'cm-chips'); if (r.action === 'Call') ['No answer', 'Left message', 'Spoke', 'Meeting set', 'Not interested'].forEach((x) => { const c = el('button', 'cm-chip', x); c.type = 'button'; c.setAttribute('aria-pressed', String(res.v === x)); c.addEventListener('click', () => { res.v = res.v === x ? '' : x; chips.querySelectorAll('.cm-chip').forEach((y) => y.setAttribute('aria-pressed', String(y.textContent === res.v))); }); chips.append(c); });
    const ta = el('textarea', 'cm-phdraft'); ta.rows = 3; ta.value = r.text || (r.action === 'Call' ? '' : String(t.detail || '')); ta.placeholder = 'Add what happened';
    const sv = el('button', 'cm-btn', '💾 Save'); sv.type = 'button'; const cx = el('button', 'cm-btn ghost', 'Cancel'); cx.type = 'button'; cx.addEventListener('click', () => f.remove());
    sv.addEventListener('click', async () => { sv.disabled = !0; const newOut = res.v || r.outcome || ''; const newText = ta.value.trim(); if (newOut === (r.outcome || '') && newText === (r.text || '')) { f.remove(); return; }
      const when = new Date(r.epoch).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      try { await C.nhCall('update_record', { folderId: MI.LOG, recordId: r.id, fieldKeys: 'label', fields: { Outcome: String(newOut).slice(0, 250), Text: newText.slice(0, 5000) } });
        const diff = [newOut !== (r.outcome || '') ? `${r.outcome || '—'} → ${newOut}` : '', newText && newText !== (r.text || '') ? newText : ''].filter(Boolean).join(' — ');
        await C.nhCall('create_record_comment', { folderId: C.NH_FOLDER, recordId: cid, text: `✎ Update to the ${r.action.toLowerCase()} of ${when}: ${diff}` });
        r.outcome = newOut; r.text = newText; r.edited = !0; dS.at = 0; hmKey = ''; C.say('✓ Updated'); f.remove(); b.textContent = '✎ edited · edit'; dash.refresh('company_timeline'); } catch (e2) { sv.disabled = !1; C.say(`Not saved — ${C.nhErr(e2)}`, !0); } });
    const r2 = el('div', 'cm-chips'); r2.append(sv, cx); f.append(chips, ta, r2); row.append(f); ta.focus(); });
  return b; }
function chatActs(t) { const C = __cm; const el = C.el; const box = el('div', 'cm-evacts'); const li = PROV(t.provider || '') === 'LinkedIn' || /linkedin/i.test(t.title || '');
  if (t.chat_status === 'NOT_REPLIED') box.append(el('span', 'cm-chatpill', '⏳ They wrote · waiting for us'));
  const cv = chatView(t.folder || C.NH_FOLDER, t.rid || dash.params().cid, t.id, String(t.person || '').split(' ')[0], t.chat_msgs); const ob = cv.querySelector('.cm-chatopen'); const msgs = cv.querySelector('.cm-chatmsgs'); ob.className = 'cm-chip cm-chatopen';
  const lab = () => `${msgs.hidden ? '💬 Open chat' : '✕ Close chat'}${t.chat_msgs ? ` · ${t.chat_msgs}` : ''}`; ob.textContent = lab(); ob.addEventListener('click', () => { ob.textContent = lab(); }); box.append(ob);
  const num = String(t.chat_name || '').replace(/\D/g, ''); if (!li && num.length >= 8) { const rp = el('a', `cm-chip cm-chatreply${t.chat_status === 'NOT_REPLIED' ? ' hot' : ''}`); rp.href = `https://wa.me/${num}`; rp.target = '_blank'; rp.rel = 'noopener noreferrer'; rp.innerHTML = C.ICON_WA || ''; rp.append(t.chat_status === 'NOT_REPLIED' ? ' Reply' : ' Message'); box.append(rp); }
  const frag = el('div', 'cm-evchat'); frag.append(box, msgs); return frag; }
const logKick = new Set(); function actLogKick() { if (__cm.curView() !== 'company') return; const cid = dash.params().cid; if (logKick.has(cid)) return; needLog(Date.now() - 14 * 864e5); if (!homeLog()) return; logKick.add(cid); dash.setParams({ actv: (dash.params().actv || 0) + 1 }); } // redraw Recent activity once the log is in, so ✎ appears on your own entries

// ===================== 🎯 daily goals + fast team numbers =====================
const tStats = { at: 0, key: '', data: null, busy: !1 };
// today, this week and last week (same days) per person — from Medint's own database on the website (instant), else from NetHunt
function teamStats() {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0); const today = +d0; const w = periodRange('week'); const p = prevRange('week'); const key = `${today}`;
  if (tStats.data && tStats.key === key && Date.now() - tStats.at < 120e3) return tStats.data;
  if (window.cmBoot && !tStats.busy && tStats.d1 !== !1) { tStats.busy = !0;
    const get = (f0, t0) => fetch(`/api/medint?summary=1&counts=1&from=${f0}&to=${t0}`, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null));
    Promise.all([get(today, 9e15), get(w[0], 9e15), get(p[0], p[1]), get(today - 864e5, Date.now() - 864e5)]).then(([a, b, c, y]) => { if (a && a.counts) { tStats.data = { today: a, week: b, prev: c, yday: y && y.counts ? y : { counts: [], meetings: [] }, src: 'db' }; tStats.at = Date.now(); tStats.key = key; } else tStats.d1 = !1; }).catch(() => { tStats.d1 = !1; }).finally(() => { tStats.busy = !1; hmKey = ''; drawHome(); });
    if (tStats.data) return tStats.data; }
  if (!window.cmBoot || tStats.d1 === !1) { needLog(p[0]); const lgRows = homeLog(); if (!lgRows) return null;
    const rows = lgRows.filter((r) => !r.voided); return { today: tally(rows.filter((r) => r.epoch >= today)), week: tally(rows.filter((r) => r.epoch >= w[0])), prev: tally(rows.filter((r) => r.epoch >= p[0] && r.epoch < p[1])), yday: tally(rows.filter((r) => r.epoch >= today - 864e5 && r.epoch < Date.now() - 864e5)), src: 'nethunt' }; }
  return tStats.data;
}
const statOf = (S, person, a) => !S ? 0 : a === 'touch' ? ['Call', 'WhatsApp', 'Email'].reduce((x, k) => x + statOf(S, person, k), 0) : a === 'note' ? statOf(S, person, 'Comment') : a === 'meet' ? ((S.meetings || []).find((x) => x.person === person) || {}).n || 0 : a === 'all' ? S.counts.filter((x) => x.person === person && WORK_ACTIONS.has(x.action)).reduce((x, c) => x + c.n, 0) : S.counts.filter((x) => x.person === person && x.action === (a === 'status' ? 'Status' : a)).reduce((x, c) => x + c.n, 0);
// each person's own day: their device's local date and time zone (works the same in Istanbul, Lima or Panama)
// ONE target: companies worked (any call, WhatsApp, email, note or status change on a company) — first contacts and follow-ups both count
const COMP_PER_HOUR = 6; const goalFor = (h) => Math.max(1, Math.round(h * COMP_PER_HOUR));
const DAYS_FOLDER = '6ad6cf34adab0048f0a964a5'; const WORK_ACTIONS = new Set(['Call', 'WhatsApp', 'Email', 'Comment', 'Status', 'Meeting', 'Catalogue', 'Deal', 'Contact']);
const localDay = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA');
const TZOFF = () => new Date().getTimezoneOffset() * 60000; const dayIdx = (t) => Math.floor((t - TZOFF()) / 864e5); const dayDate = (d) => localDay(d * 864e5 + TZOFF() + 12 * 36e5);
function planToday() { const p = __cm.dayPlan || {}; return p.date === localDay() ? p : null; }
function setPlan(hours, fresh) { const prev = planToday(); const cur = myToday(); const session = fresh ? ((prev && prev.session) || 1) + 1 : (prev && prev.session) || 1;
  __cm.dayPlan = { date: localDay(), hours, session, base: fresh ? (cur ? cur.cos.size : 0) : (prev && prev.base) || 0 }; hmKey = ''; dS.at = 0;
  miLog({ action: 'Other', outcome: hours ? `plan: ${hours} h${session > 1 ? ` (session ${session})` : ''}` : 'plan: day off' }); drawHome(); }
// per person, per day (last 15 days): companies worked + the actions behind them — website: Medint's database; Claude: the NetHunt log
const dS = { at: 0, data: null, busy: !1, d1: null };
function daysData() {
  if (dS.data && Date.now() - dS.at < 90e3) return dS.data; const from = LOG_FROM; const nm = me().name; const house = isHouse();
  const build = (rows, plans, found = []) => { const P = new Map(); const get = (p, d) => { const m = P.get(p) || new Map(); P.set(p, m); const x = m.get(d) || { cos: new Set(), Call: 0, WhatsApp: 0, Email: 0, Comment: 0, Status: 0, plan: null, found: {} }; m.set(d, x); return x; };
    found.forEach((r) => { const k = String(r.outcome || '').replace(/^found\s*/, '').trim() || 'detail'; const x = get(r.person, r.d); x.found[k] = (x.found[k] || 0) + (r.n || 1); });
    rows.forEach((r) => { if (!WORK_ACTIONS.has(r.action)) return; const x = get(r.person, r.d); if (r.company_id) x.cos.add(r.company_id); if (x[r.action] != null) x[r.action] += r.n || 1; });
    plans.forEach((r) => { const m = String(r.outcome || '').match(/plan:\s*(\d+)\s*h/); get(r.person, r.d).plan = m ? Number(m[1]) : /day off/.test(r.outcome) ? 0 : null; }); return P; };
  if (window.cmBoot && dS.d1 !== !1 && !dS.busy) { dS.busy = !0;
    fetch(`/api/medint?daily=1&${house ? 'all=1' : `person=${encodeURIComponent(nm)}`}&tz=${new Date().getTimezoneOffset()}&from=${from}&to=9e15`, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && j.rows) { dS.data = { P: build(j.rows.map((r) => ({ ...r, person: r.person || nm })), (j.plans || []).map((r) => ({ ...r, person: r.person || nm })), (j.found || []).map((r) => ({ ...r, person: r.person || nm }))), src: 'db' }; dS.at = Date.now(); } else dS.d1 = !1; }).catch(() => { dS.d1 = !1; }).finally(() => { dS.busy = !1; hmKey = ''; drawHome(); phMini(); });
    if (dS.data) return dS.data; if (dS.d1 !== !1) return null; }
  if (window.cmBoot && dS.d1 !== !1) return dS.data;
  needLog(from); const lgRows = homeLog(); if (!lgRows) { setTimeout(() => { hmKey = ''; drawHome(); }, 5500); return dS.data; } const lg = { data: lgRows };
  const rows = lg.data.filter((r) => !r.voided && r.epoch >= from && (house || r.person === nm)).map((r) => ({ person: r.person, d: dayIdx(r.epoch), action: r.action, company_id: r.company_id, n: 1 }));
  const plans = lg.data.filter((r) => !r.voided && r.action === 'Other' && /^plan:/.test(r.outcome || '') && r.epoch >= from).sort((a, b) => a.epoch - b.epoch).map((r) => ({ person: r.person, d: dayIdx(r.epoch), outcome: r.outcome }));
  const found = lg.data.filter((r) => !r.voided && r.action === 'Contact' && /^found/.test(r.outcome || '') && r.epoch >= from && (house || r.person === nm)).map((r) => ({ person: r.person, d: dayIdx(r.epoch), outcome: r.outcome, n: 1 }));
  dS.data = { P: build(rows, plans, found), src: 'nethunt' }; dS.at = Date.now(); return dS.data;
}
function myToday() { const D = daysData(); if (!D) return null; const x = (D.P.get(me().name) || new Map()).get(dayIdx(Date.now())); return x || { cos: new Set(), Call: 0, WhatsApp: 0, Email: 0, Comment: 0, Status: 0 }; }
function splitReach(cos, dayStart) { const ch = dash.data('contact_history'); const t0 = dayStart || new Date().setHours(0, 0, 0, 0); const before = new Set(('ok' === ch.status ? ch.data : []).filter((e) => e.type !== 'calendar' && new Date(e.time) < t0).map((e) => e.record_id)); let fresh = 0, follow = 0; cos.forEach((id) => (before.has(id) ? follow++ : fresh++)); return { fresh, follow }; }
function goalProgress() { const p = planToday(); if (!p || !p.hours) return null; const goal = goalFor(p.hours); const T = myToday(); const worked = T ? Math.max(0, T.cos.size - (p.base || 0)) : 0; return { goal, T, worked, pct: Math.round((worked / goal) * 100) }; }
const cheer = (pct, left, best) => pct >= 100 ? '🎉 Goal reached — every company from here is a bonus!' : pct >= 75 ? `💪 Almost there — ${left} more compan${left === 1 ? 'y' : 'ies'}.` : pct >= 40 ? `🚀 Good pace — ${left} to go.${best ? ` Your best day: ${best}.` : ''}` : pct > 0 ? `☕ On your way — ${left} to go. One company at a time.` : '⚡ Start with Power hour — the first company is the hardest.';
// save each day (one record per person per day in NetHunt “Medint Days”) so everyone can look back
const daySaved = new Map(); let daySaveAt = 0;
async function saveDays() {
  if (Date.now() - daySaveAt < 5 * 60e3) return; const D = daysData(); if (!D) return; daySaveAt = Date.now(); const C = __cm;
  const existing = new Map(); try { const r = await C.nhCall('filter_records', { folderId: DAYS_FOLDER, fieldKeys: 'label', filter: { Date: { _gte: localDay(Date.now() - 15 * 864e5) } }, limit: 1000 }); (r.records || []).forEach((x) => existing.set(`${x.fields.Person}|${x.fields.Date}`, x)); } catch { return; }
  const ppl = isHouse() ? [...D.P.keys()] : [me().name];
  for (const p of ppl) for (const [d, x] of D.P.get(p) || []) { if (!x.cos.size && x.plan == null) continue; const date = dayDate(d); const rr = splitReach(x.cos, new Date(`${date}T00:00:00`).getTime()); const h = x.plan ?? (p === me().name && date === localDay() && planToday() ? planToday().hours : null); const goal = h ? goalFor(h) : null;
    const f = { Name: `${p} · ${date}`, Date: date, Person: p, Hours: h ?? null, Goal: goal, 'Companies worked': x.cos.size, 'First contacts': rr.fresh, 'Follow-ups': rr.follow, Calls: x.Call, WhatsApps: x.WhatsApp, Emails: x.Email, Notes: x.Comment, Percent: goal ? Math.round((x.cos.size / goal) * 100) : null };
    Object.keys(f).forEach((k) => f[k] == null && delete f[k]); const key = `${p}|${date}`; const ex = existing.get(key); const sig = JSON.stringify(f); if (daySaved.get(key) === sig) continue;
    if (ex && ['Companies worked', 'Hours', 'Notes', 'Calls', 'WhatsApps', 'Emails'].every((k) => (ex.fields[k] ?? null) === (f[k] ?? null))) { daySaved.set(key, sig); continue; }
    try { if (ex) await C.nhCall('update_record', { folderId: DAYS_FOLDER, recordId: ex.id, fieldKeys: 'label', fields: f }); else await C.nhCall('create_record', { folderId: DAYS_FOLDER, fieldKeys: 'label', fields: f }); daySaved.set(key, sig); } catch { /* next time */ } }
}
setInterval(() => { try { saveDays(); } catch { /* not ready */ } }, 6 * 60e3);
// ask once a day (first visit of the day, on any device)
let askedFor = (() => { try { return localStorage.getItem('cmAskedPlan') || ''; } catch { return ''; } })();
function maybeAskPlan() {
  if (!miWho || (window.cmBoot && miWho.role === 'Unknown') || planToday() || askedFor === localDay() || (__cm.uiFlags || {}).askedOn === localDay()) return; const sh = document.getElementById('cm-sheet'); if (!sh || !sh.hidden) return; askedFor = localDay(); try { localStorage.setItem('cmAskedPlan', askedFor); } catch { /* storage off */ } __cm.uiFlags = { ...(__cm.uiFlags || {}), askedOn: askedFor };
  const C = __cm; const el = C.el; const a = document.querySelector('.cm-tb-more') || document.body;
  C.openSheet(a, `🎯 Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${me().name}`, (body) => {
    const box = el('div', 'cm-askbox'); body.append(box); body = box;
    body.append(el('h2', 'cm-askh', 'How many hours will you work today?'), el('p', 'mut', `Your target is simple: companies worked — about ${COMP_PER_HOUR} per hour (calls, WhatsApps, emails or notes; first contacts and follow-ups both count).`));
    const row = el('div', 'cm-chips cm-askrow'); [1, 2, 3, 4, 5, 6, 7, 8].forEach((hh) => { const b = el('button', 'cm-chip', `${hh} h`); b.type = 'button'; b.addEventListener('click', () => { setPlan(hh); C.closeSheet(); }); row.append(b); });
    const off = el('button', 'cm-chip', '🌙 Day off'); off.type = 'button'; off.addEventListener('click', () => { setPlan(0); C.closeSheet(); }); row.append(off); body.append(row);
    const later = el('button', 'cm-mini cm-asklater', 'Ask me later'); later.type = 'button'; later.addEventListener('click', () => C.closeSheet()); body.append(later);
  }, { center: !0 });
}
// small goal bar in Power hour’s header
function phMini() { const ctl = document.querySelector('#cm-sheet .cm-phctl'); if (!ctl) return; let m = ctl.querySelector('.cm-phgoal'); const gp = goalProgress(); if (!gp) { m && m.remove(); return; }
  const sig = `${gp.worked}/${gp.goal}`; if (m && m.dataset.sig === sig) return; if (!m) { m = __cm.el('div', 'cm-phgoal'); ctl.prepend(m); } m.dataset.sig = sig; m.replaceChildren(); m.title = 'Companies worked today / your goal';
  m.append(__cm.el('span', null, `🎯 ${gp.worked}/${gp.goal}`)); const bar = __cm.el('i'); const f = __cm.el('u'); f.style.width = `${Math.min(100, (gp.worked / gp.goal) * 100)}%`; if (gp.worked >= gp.goal) f.classList.add('ok'); bar.append(f); m.append(bar); }
const ringSvg = (pct, size = 118) => { const R = 44, Cc = 2 * Math.PI * R; return `<svg viewBox="0 0 110 110" width="${size}" height="${size}"><circle cx="55" cy="55" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="10"/><circle cx="55" cy="55" r="${R}" fill="none" stroke="${pct >= 100 ? '#3fae7a' : '#4f8cff'}" stroke-width="10" stroke-linecap="round" stroke-opacity="${pct ? 1 : 0}" stroke-dasharray="${(Math.min(100, pct) / 100) * Cc} ${Cc}" transform="rotate(-90 55 55)"/></svg>`; };
function goalBox() {
  const C = __cm; const el = C.el; const box = el('section', 'cm-goal'); const p = planToday(); const nm = me().name;
  if (!p) { box.classList.add('ask'); box.append(el('h2', null, `🎯 How many hours will you work today, ${nm}?`), el('div', 'mut', `One target: companies worked — about ${COMP_PER_HOUR} per hour.`));
    const row = el('div', 'cm-chips'); [1, 2, 3, 4, 5, 6, 7, 8].forEach((hh) => { const b = el('button', 'cm-chip', `${hh} h`); b.type = 'button'; b.addEventListener('click', () => setPlan(hh)); row.append(b); }); const no = el('button', 'cm-chip', '🌙 Day off'); no.type = 'button'; no.addEventListener('click', () => setPlan(0)); row.append(no); box.append(row); return box; }
  if (!p.hours) { box.append(el('h2', null, '🌙 Day off — enjoy it'), (() => { const b = el('button', 'cm-mini', 'I’m working after all'); b.type = 'button'; b.addEventListener('click', () => { __cm.dayPlan = {}; hmKey = ''; drawHome(); }); return b; })()); return box; }
  const gp = goalProgress(); const T = gp.T;
  const hd = el('div', 'cm-h2row'); hd.append(el('h2', null, `🎯 Today · ${p.hours} h${p.session > 1 ? ` · session ${p.session}` : ''}`));
  const acts = el('span', 'cm-goalacts'); const ch = el('button', 'cm-btn ghost cm-gbtn', '⏱ Change hours'); ch.type = 'button'; ch.addEventListener('click', () => { __cm.dayPlan = { ...p, date: '' }; askedFor = ''; hmKey = ''; drawHome(); }); const ns = el('button', 'cm-btn ghost cm-gbtn', '↻ New session'); ns.type = 'button'; ns.title = 'Start a fresh target from now (e.g. a second shift)'; ns.addEventListener('click', () => C.openMenu(ns, [1, 2, 3, 4, 5, 6, 7, 8].map((x) => ({ icon: '🎯', label: `${x} h from now`, on: x === p.hours, act: () => setPlan(x, !0) })))); acts.append(ch, ns); hd.append(acts); box.append(hd);
  // the one number
  const left = Math.max(0, gp.goal - gp.worked);
  const main = el('div', 'cm-goalmain'); const ring = el('div', 'cm-goalpct'); ring.innerHTML = ringSvg(gp.pct); ring.append(el('b', null, String(gp.worked)), el('span', 'mut', `of ${gp.goal} companies`));
  const side = el('div', 'cm-goalside'); side.append(el('div', 'cm-goalbig', `${gp.pct}%`), el('div', 'cm-cheer', T ? cheer(gp.pct, left, '') : 'loading…'));
  const cnt = el('div', 'cm-todaycnt'); [['☎', 'Call', 'calls'], ['💬', 'WhatsApp', 'WhatsApp'], ['✉', 'Email', 'emails'], ['📝', 'Comment', 'notes'], ['📈', 'Status', 'status']].forEach(([ic, k, l]) => { const v = T ? T[k] || 0 : 0; const x = el('span', v ? '' : 'zero'); x.append(el('b', null, `${ic} ${v}`), el('small', null, l)); cnt.append(x); }); side.append(cnt);
  const go = el('button', 'cm-btn cm-goalgo', '⚡ Start Power hour'); go.type = 'button'; go.addEventListener('click', () => openPowerHour(document.querySelector('.cm-phtop'))); const crow = el('div', 'cm-goalrow'); side.lastChild.remove(); crow.append(cnt, go); side.append(crow);
  main.append(ring, side); box.append(main);
  setTimeout(() => saveDays(), 1500);
  return box;
}

// ===================== 🏠 Home: what to do now and what’s coming =====================
const hmS = { area: '', lvl: '' }; let hmKey = '';
function drawHome() {
  const root = document.getElementById('home-view'); if (!root || root.classList.contains('cm-hidden')) return;
  const C = __cm; const el = C.el; const ch = dash.data('contact_history'); const cg = dash.data('congresses'); const ps = C.rowsOf('pipeline_stages'); const cs = C.rowsOf('countries'); const iv = C.rowsOf('import_values'); const lg = window.cmBoot && tStats.d1 !== !1 ? { status: 'skip', data: [] } : dash.data('medint_log');
  const k = C.oursKey(); const key = C.OURS[k].all ? 'next' : k;
  const sig = `${ch.status}|${cg.status}|${ps.length}|${cs.length}|${iv.length}|${lg.status}|${(lg.data || []).length}|${k}|${hmS.area}|${hmS.lvl}|${JSON.stringify(C.cgStars || {})}|${JSON.stringify(C.tripPlans || [])}|${new Date().getHours()}|${tStats.at}|${dS.at}|${dLog.at}|${dash.data('calendar_events').status}|${JSON.stringify(__cm.uiFlags || {})}|${JSON.stringify(__cm.dayPlan || {})}`; if (sig === hmKey && root.childNodes.length) return; hmKey = sig;
  root.replaceChildren(); const wrap = el('div', 'cm-cgp cm-home'); root.append(wrap);
  const now = Date.now(); const t0 = new Date().toISOString().slice(0, 10); const inD = (d) => Math.round((new Date(d) - new Date(t0)) / 864e5);
  // where: all / where we work / my trip / a region
  const st = (r) => Math.max(r.stage_next || 0, r.stage_dunitech || 0, r.stage_motion || 0);
  const AI0 = allowedIsos(); const active = new Set(ps.filter((r) => st(r) >= 3).map((r) => r.iso).filter(Boolean)); const regions = [...new Set(cs.filter((c) => !AI0 || AI0.has(c.iso)).map((c) => c.region).filter(Boolean))].sort();
  const area = !hmS.area ? null : hmS.area === 'active' ? active : hmS.area === 'trip' ? new Set(C.TRIP_ISOS || [])  : hmS.area.startsWith('c:') ? new Set([hmS.area.slice(2)]) : hmS.area.startsWith('g:') ? new Set(((C.savedGroups || []).find((g) => `g:${g.label}` === hmS.area) || {}).isos || []) : new Set(cs.filter((c) => `r:${c.region}` === hmS.area).map((c) => c.iso));
  const inArea = (iso) => !area || area.has(iso);
  // header
  const hr = new Date().getHours(); const nm = me().name || 'Kavi';
  const hd = el('div', 'cm-cghd'); hd.append(el('h1', null, `${isHouse() ? (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') : 'Welcome'}, ${nm}`), el('div', 'mut', new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })));
  if (!isHouse()) { // a Person: their markets, from the assignment rules
    const rs = ('ok' === dash.data('medint_assign').status ? dash.data('medint_assign').data : []).filter((r) => r.active && low(r.person) === low(nm)); const mk = el('div', 'cm-mymk');
    const chips = rs.flatMap((r) => (r.type === 'Country' ? String(r.value).split(/[, ]+/).filter(Boolean).map((v) => { const c = cs.find((x) => low(x.iso) === low(v) || low(x.country) === low(v)); return c ? [c.iso, `${C.flag(c.iso)} ${c.country}`] : [null, v]; }) : r.type === 'Region' ? [[null, `🗺 ${r.value}`]] : [[null, `${r.type === 'Tag' ? '🏷' : r.type === 'Status' ? '📈' : r.type === 'Batch' ? '📋' : '🏢'} ${r.value}`]]));
    if (chips.length) { mk.append(el('span', 'mut', 'Your markets:')); chips.forEach(([iso, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; if (iso) b.addEventListener('click', () => window.cmOpenCountry && window.cmOpenCountry(iso)); mk.append(b); }); }
    else mk.append(el('span', 'mut', 'No markets assigned to you yet — ask House to assign countries to you.'));
    hd.append(mk); }
  const fl = el('div', 'cm-cgfl'); const sel = (opts, v, on, title) => { const x = el('select', 'cm-phtpl'); x.title = title; opts.forEach(([a2, l]) => x.append(new Option(l, a2))); x.value = v; x.addEventListener('change', () => on(x.value)); return x; };
  fl.append(sel([['', isHouse() ? '🌍 All countries' : '🌍 All my companies'], ['active', `⭐ Where we work (${active.size})`], ['trip', '🧳 My trip'], ...(C.savedGroups || []).map((g) => [`g:${g.label}`, `⭐ ${g.label}`]), ...(AI0 ? cs.filter((c) => AI0.has(c.iso)).sort((x, y) => x.country.localeCompare(y.country)).map((c) => [`c:${c.iso}`, `${C.flag(c.iso)} ${c.country}`]) : []), ...regions.map((r) => [`r:${r}`, `🗺 ${r}`])], hmS.area, (v) => { hmS.area = v; drawHome(); }, 'Where'),
    sel([['next', 'Next Shoulder'], ['dunitech', 'Dunitech'], ['motion', 'Motion Medical'], ['all', 'All brands']], k, (v) => dash.setParams({ ours: v }), 'Brand'));
  hd.append(fl); { const vc = viewChips(); vc && hd.append(vc); } wrap.append(hd);
  try { wrap.append(goalBox()); } catch { /* goals optional */ }
  try { const fb = foundBox(nm); fb && wrap.append(fb); } catch { /* optional */ }
  // numbers that matter today
  const hist = 'ok' === ch.status ? ch.data : []; const name = (id) => { const p = ps.find((x) => x.id === id) || C.companyById(id) || {}; return p; };
  const waiting = [...new Set(hist.map((e) => e.record_id))].filter((id) => { const rc = C.realContact(id); return rc && rc.pending && inArea(name(id).iso); });
  const due = ps.filter((r) => r.next_followup && String(r.next_followup).slice(0, 10) <= t0 && inArea(r.iso) && st(r) < 6);
  const meet = (() => { const out = []; const seen = new Set(); const inWin = (t) => { const x = +new Date(t); return x >= now - 36e5 && (x - now) / 864e5 <= 7; };
    const linked = new Map(); C.rowsOf('meetings').forEach((m) => m.event_id && linked.set(m.event_id, m.company_id)); C.rowsOf('meeting_links').filter((m) => m.action === 'link').forEach((m) => linked.set(m.event_id, m.company_id));
    const cal = dash.data('calendar_events'); ('ok' === cal.status ? cal.data : []).filter((e) => !e.all_day && !e.from_gmail && e.start && inWin(e.start)).forEach((e) => { const cid = linked.get(e.id) || null; if (cid && !inArea(name(cid).iso)) return; const k = `${String(e.start).slice(0, 16)}|${low(e.summary)}`; if (seen.has(k)) return; seen.add(k); out.push({ time: e.start, record_id: cid, title: e.summary, link: e.link, proposed: /graphite|^8$/i.test(String(e.color || '')) }); });
    const gCos = new Set(googleMeetings().map((m) => m.company_id)); // companies whose meeting Google Calendar knows: its time wins (rescheduled meetings)
    hist.filter((e) => e.type === 'calendar' && inWin(e.time) && inArea(name(e.record_id).iso) && !gCos.has(e.record_id)).forEach((e) => { if (out.some((x) => x.record_id === e.record_id && Math.abs(new Date(x.time) - new Date(e.time)) < 36e5)) return; const nm2 = low((name(e.record_id) || {}).company || '').split(/\s+/)[0]; if (nm2 && nm2.length > 3 && out.some((x) => low(x.title).includes(nm2))) return; out.push({ time: e.time, record_id: e.record_id, title: (name(e.record_id) || {}).company || 'Meeting' }); });
    return out.sort((x, y) => String(x.time).localeCompare(String(y.time))); })();
  const cgs = ('ok' === cg.status ? cg.data : []).filter((x) => x.start && (x.end || x.start) >= t0 && inD(x.start) <= 90 && inArea(x.iso) && (!hmS.lvl || x.level === hmS.lvl));
  const trips = (C.tripPlans || []).filter((p) => p.legs && p.legs.length).map((p) => ({ ...p, ...tripInfo(p) })).filter((p) => !p.past).sort((x, y) => (y.now - x.now) || (({ confirmed: 2, planned: 1 }[y.status] || 0) - ({ confirmed: 2, planned: 1 }[x.status] || 0)) || x.start.localeCompare(y.start));
  const go = (fn) => (ev) => { ev && ev.preventDefault && ev.preventDefault(); fn(); };
  const tiles = el('div', 'cm-logtiles cm-hmtiles');
  [[waiting.length, '💬 Replies waiting', () => openPowerHour(document.querySelector('.cm-phtop'))], [due.length, '⏰ Follow-ups due', () => openPowerHour(document.querySelector('.cm-phtop'))], [meet.length, '📅 Meetings · 7 days', () => document.querySelector('.cm-tb-follow') && document.querySelector('.cm-tb-follow').click()],
    [cgs.length, '🎪 Congresses · 90 days', () => dash.setParams({ view: 'congresses' })], [trips.length ? (trips[0].now ? `Day ${trips[0].day}` : `${Math.max(0, inD(trips[0].start))}d`) : '—', trips.length ? (trips[0].now ? `🧳 on ${trips[0].name}` : `🧳 to ${trips[0].name}`) : '🧳 No trip planned', () => dash.setParams({ view: 'trips' })]]
    .forEach(([n, l, fn]) => { const b = el('button', 'cm-logtile'); b.type = 'button'; b.append(el('b', null, String(n)), el('span', null, l)); b.addEventListener('click', go(fn)); tiles.append(b); });
  wrap.append(tiles);
  const grid = el('div', 'cm-hmgrid'); wrap.append(grid);
  const card = (title, more, onMore) => { const c = el('section', 'cm-hmcard'); const h2 = el('div', 'cm-h2row'); h2.append(el('h2', null, title)); if (more) { const m = el('button', 'cm-mini', more); m.type = 'button'; m.addEventListener('click', onMore); h2.append(m); } c.append(h2); grid.append(c); return c; };
  const coBtn = (id, label, tag) => { const b = el('button', 'cm-pi'); b.type = 'button'; b.dataset.openCompany = id; const p = name(id); b.append(el('span', null, C.flag(p.iso) || '🏢'), el('span', 't', label || p.company || 'Company'), el('span', 'tag', tag || '')); return b; };
  // ⚡ do now
  { const c = card('⚡ Do now', '⚡ Start Power hour', () => openPowerHour(document.querySelector('.cm-phtop'))); const q = powerQueue().list.filter((x) => inArea(x.iso)).slice(0, 10);
    if (!q.length) c.append(el('div', 'hint', 'Nothing urgent — no replies waiting or follow-ups due.')); const SHORT = ['💬 reply', '📅 meeting soon', '⏰ follow-up due', '🔥 gone quiet', 'engaged · quiet', '⭐ new lead', 'keep warm']; q.forEach((x) => { const b = coBtn(x.id, x.name, SHORT[x.t]); b.title = PH_WHY[x.t]; c.append(b); }); }
  // 🔥 hot
  { const c = card('🔥 Hot companies', 'All →', () => document.querySelector('.cm-tb-new') && document.querySelector('.cm-tb-new').click()); const box = el('div'); hotList(box, null, 10, area); const g2 = box.querySelector('.grp'); g2 && g2.remove(); c.append(box); }
  // 📅 meetings
  { const c = card('📅 Meetings · next 7 days'); if (!meet.length) c.append(el('div', 'hint', 'No meetings in the next 7 days.'));
    meet.slice(0, 10).forEach((e) => { const t = new Date(e.time); const when = `${inD(localDay(+t)) === 0 ? 'today' : inD(localDay(+t)) === 1 ? 'tomorrow' : t.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${e.proposed ? ' · proposed' : ''}`;
      if (e.record_id) { const b = coBtn(e.record_id, null, when); if (e.title) b.title = e.title; c.append(b); }
      else { const a = el('a', 'cm-pi'); a.href = e.link || 'https://calendar.google.com'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(el('span', null, '📅'), el('span', 't', e.title || 'Meeting'), el('span', 'tag', when)); c.append(a); } }); }
  // 🎪 congresses
  { const c = card('🎪 Coming congresses', 'All congresses →', () => dash.setParams({ view: 'congresses' })); const lv = el('div', 'cm-chips'); [['', 'All'], ['National', 'National'], ['Regional', 'Regional'], ['Global', 'Worldwide']].forEach(([v, l]) => { const b = el('button', 'cm-chip', l); b.type = 'button'; b.setAttribute('aria-pressed', String(hmS.lvl === v)); b.addEventListener('click', () => { hmS.lvl = v; drawHome(); }); lv.append(b); }); c.append(lv);
    const star = C.cgStars || {}; const seen = new Set(); const list = cgs.filter((x) => !seen.has(x.event_id) && seen.add(x.event_id)).sort((x, y) => (star[y.event_id] ? 1 : 0) - (star[x.event_id] ? 1 : 0) || x.start.localeCompare(y.start)).slice(0, 10);
    if (!list.length) c.append(el('div', 'hint', 'No congress in the next 90 days here.'));
    list.forEach((x) => { const r = el('a', 'cm-pi'); r.href = x.url || '#'; r.target = '_blank'; r.rel = 'noopener noreferrer'; const n = inD(x.start); r.append(el('span', null, star[x.event_id] ? '⭐' : C.flag(x.iso) || '🎪'), el('span', 't', x.series), el('span', 'tag', `${new Date(x.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${x.city || x.country}${n <= 0 ? ' · now' : ` · ${n}d`}`)); c.append(r); }); }
  // 🧳 next trip
  { const c = card(trips.length && trips[0].now ? '🧳 On the road' : '🧳 Next trip', 'Trips →', () => dash.setParams({ view: 'trips' }));
    if (!trips.length) c.append(el('div', 'hint', 'No trip planned. Open the trip planner to see potential, holidays and congresses for each stop.'));
    else { const p = trips[0]; if (p.now && p.here) c.append(el('div', 'cm-tpnow', `Day ${p.day} of ${p.n} · today in ${C.flag(p.here.iso)} ${(cs.find((x) => x.iso === p.here.iso) || {}).country || p.here.iso}${p.here.cities && p.here.cities.length ? ` (${p.here.cities.join(', ')})` : ''}`)); c.append(el('div', 'mut', `${TP_ST[tpSt(p)][0]} ${TP_ST[tpSt(p)][1]} · ${p.name} · ${new Date(`${p.start}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(`${p.end}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · from ${p.from || 'Ankara'}`));
      let k2 = 0; p.legs.forEach((l) => { const a2 = new Date(`${p.start}T12:00:00`); a2.setDate(a2.getDate() + k2); k2 += Number(l.days) || 0; const P = ps.filter((r) => r.iso === l.iso); const b = el('button', 'cm-pi'); b.type = 'button'; b.addEventListener('click', () => window.cmOpenCountry && window.cmOpenCountry(l.iso)); b.append(el('span', null, C.flag(l.iso)), el('span', 't', `${(cs.find((x) => x.iso === l.iso) || {}).country || l.iso}${l.cities && l.cities.length ? ` · ${l.cities.join(', ')}` : ''}`), el('span', 'tag', `${a2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${l.days}d · 🔥${P.filter((r) => st(r) >= 4 && st(r) < 6).length}`)); c.append(b); }); } }
  // 📦 best importers we haven't engaged yet
  { const c = card('📦 Big importers not engaged yet'); const byId = new Map(ps.map((r) => [r.id, r]));
    const list = iv.filter((x) => (x.weighted_value_usd || x.import_value_usd) > 0).map((x) => ({ x, p: byId.get(x.id) })).filter(({ p }) => p && inArea(p.iso) && (p[`stage_${key}`] || 0) < 3 && !isIgnored(p.id)).sort((a2, b) => (b.x.weighted_value_usd || 0) - (a2.x.weighted_value_usd || 0)).slice(0, 10);
    if (!list.length) c.append(el('div', 'hint', 'No import data for these countries.'));
    list.forEach(({ x, p }) => c.append(coBtn(p.id, p.company, `${C.money(x.import_value_usd)}${x.last_year ? ` · ${x.last_year}` : ''} · ${p[`status_${key}`] || 'not contacted'}`))); }
  // 🌍 markets by momentum
  { const c = card('🌍 Markets by momentum', 'Markets →', () => dash.setParams({ view: 'markets' })); const m = new Map();
    ps.filter((r) => r.iso && inArea(r.iso)).forEach((r) => { const o = m.get(r.iso) || { n: 0, eng: 0, hot: 0 }; o.n++; if (st(r) >= 3) o.eng++; if (st(r) >= 4 && st(r) < 6) o.hot++; m.set(r.iso, o); });
    [...m.entries()].sort((a2, b) => b[1].hot * 3 + b[1].eng - (a2[1].hot * 3 + a2[1].eng)).slice(0, 10).forEach(([iso, o]) => { const b = el('button', 'cm-pi'); b.type = 'button'; b.addEventListener('click', () => window.cmOpenCountry && window.cmOpenCountry(iso)); b.append(el('span', null, C.flag(iso)), el('span', 't', (cs.find((x) => x.iso === iso) || {}).country || iso), el('span', 'tag', `🔥${o.hot} · 💬${o.eng} · ${o.n} companies`)); c.append(b); }); }
  // 📊 team this week
  { const c = card('🔔 Changes since your last visit'); c.classList.add('cm-hmwide'); const box = el('div', 'cm-hmchanges'); try { noHotInChanges = !0; __cm.drawChanges(box); } catch { box.append(el('div', 'hint', 'Nothing new.')); } finally { noHotInChanges = !1; } c.append(box); }
  { const [wa] = weekBounds(1); if (new Date().getDay() === 1 || new Date().getDay() === 2) { const c = card('📰 Last week’s report is ready', 'Open →', (ev) => openWeekly(ev.currentTarget)); c.classList.add('cm-hmwide'); c.append(el('div', 'mut', `Team results for the week of ${new Date(wa).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, meetings this week and companies going cold — open it, or email it from there.`)); } }
  { const c = card('📈 My progress', 'More in Log →', (ev) => openLog((ev && ev.currentTarget) || document.querySelector('.cm-housebar .cm-chip') || document.body)); c.classList.add('cm-hmwide'); c.append(progressView(nm)); }
  { const tDay = (__cm.uiFlags || {}).teamView === 'day'; const c = card(isHouse() ? (tDay ? '📊 Team today' : '📊 Team this week') : (tDay ? '📊 My day' : '📊 My week'), isHouse() ? '🧾 Log →' : null, (ev) => openLog((ev && ev.currentTarget) || document.querySelector('.cm-housebar .cm-chip') || document.body)); c.classList.add('cm-hmteam', 'cm-hmwide');
    { const h2r = c.querySelector('.cm-h2row'); const sw = el('div', 'cm-seg cm-tmsw'); [['day', 'Today'], ['week', 'This week']].forEach(([k, l]) => { const b = el('button', null, l); b.type = 'button'; b.setAttribute('aria-pressed', String(tDay === (k === 'day'))); b.addEventListener('click', () => { __cm.uiFlags = { ...(__cm.uiFlags || {}), teamView: k }; hmKey = ''; drawHome(); }); sw.append(b); }); h2r && h2r.querySelector('h2') ? h2r.querySelector('h2').after(sw) : c.append(sw); }
    const S0 = teamStats(); const S = S0 && tDay ? { ...S0, week: S0.today, prev: S0.yday || { counts: [], meetings: [] } } : S0; if (!S) { daysData(); c.append(loadingOrError()); }
    else { const ppl = [...new Set([...S.week.counts.map((x) => x.person), ...S.prev.counts.map((x) => x.person), ...(isHouse() ? miPeople().filter((p) => p.active).map((p) => p.name) : [nm])])].filter(Boolean).filter((p) => isHouse() || p === nm);
      const mx = Math.max(1, ...ppl.map((p) => statOf(S.week, p, 'all'))); const plans = new Map(); ('ok' === lg.status ? lg.data : []).filter((r) => r.action === 'Other' && /^plan:/.test(r.outcome || '') && r.epoch >= new Date().setHours(0, 0, 0, 0)).forEach((r) => plans.set(r.person, r.outcome.replace(/^plan:\s*/, '')));
      ppl.sort((x, y) => statOf(S.week, y, 'all') - statOf(S.week, x, 'all')).forEach((p) => { const n = statOf(S.week, p, 'all'), b = statOf(S.prev, p, 'all'); const r = el('div', 'cm-tmrow');
        const head = el('div', 'h'); const mine = miPeople().find((x) => x.name === p) || {}; const DD = daysData(); const td = DD && (DD.P.get(p) || new Map()).get(dayIdx(Date.now())); const hh = td && td.plan != null ? td.plan : plans.get(p) ? Number(String(plans.get(p)).match(/\d+/) || 0) : null;
        head.append(avatarEl(p, mine.email, '', ''), el('b', null, p), el('span', 'cm-tmtoday', td || hh != null ? `today: ${td ? td.cos.size : 0}${hh ? ` / ${goalFor(hh)}` : ''} companies${hh ? ` · ${hh} h` : hh === 0 ? ' · day off' : ''}` : ''));
        const tot = el('div', 'tot'); tot.append(el('b', null, String(n)), el('span', `cm-dlt ${n > b ? 'up' : n < b ? 'down' : 'eq'}`, n > b ? `▲${n - b}` : n < b ? `▼${b - n}` : '=')); tot.title = `${n} work actions ${tDay ? "today" : "this week"} (calls, WhatsApps, emails, notes, status changes, meetings, catalogues, deals, details found) · ${b} ${tDay ? "yesterday" : "last week"} by this time`; head.append(tot); r.append(head);
        if ((__cm.uiFlags || {}).teamBar) { const bar = el('div', 'gbar'); const f = el('i'); f.style.width = `${(n / mx) * 100}%`; bar.append(f); r.append(bar); }
        const nums = el('div', 'nums'); [['☎', 'Call', 'calls'], ['💬', 'WhatsApp', 'WhatsApp'], ['✉', 'Email', 'emails'], ['📝', 'Comment', 'notes'], ['📈', 'status', 'status']].forEach(([ic, k, l]) => { const v = statOf(S.week, p, k); const x = el('span', v ? '' : 'zero'); x.append(el('b', null, `${ic} ${v}`), el('small', null, l)); nums.append(x); }); r.append(nums);
        c.append(r); });
      const ft = el('div', 'mut cm-logidle'); ft.append(`▲▼ vs ${tDay ? 'yesterday' : 'last week'} by this time · ${S.src === 'db' ? 'from Medint’s own database' : 'from NetHunt'}`); if (isHouse()) { const tb = el('button', 'cm-mini', (__cm.uiFlags || {}).teamBar ? ' · hide comparison bars' : ' · show comparison bars'); tb.type = 'button'; tb.addEventListener('click', () => { __cm.uiFlags = { ...(__cm.uiFlags || {}), teamBar: !(__cm.uiFlags || {}).teamBar }; hmKey = ''; drawHome(); }); ft.append(tb); } c.append(ft); } }
}

// 🌍 Medint (website title) → Home
document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('.cmd-bar .t'); if (!t) return; e.preventDefault(); __cm.closeSheet && __cm.closeSheet(); dash.setParams({ view: 'home' }); window.scrollTo({ top: 0, behavior: 'smooth' }); });
// pop-ups close with the phone's back gesture / back button, a swipe down on the header, or a swipe right from the left edge
(() => {
  let pushed = !1, skipPop = !1; const sheet = () => document.getElementById('cm-sheet'); const open = () => { const s0 = sheet(); return s0 && !s0.hidden; };
  const closeIt = () => { const x = sheet() && sheet().querySelector('.sx'); x && x.click(); };
  new MutationObserver(() => { const o = open(); if (o && !pushed) { try { history.pushState({ ...(history.state || {}), cmSheet: 1 }, ''); pushed = !0; } catch { /* no history here */ } } else if (!o && pushed) { pushed = !1; if (history.state && history.state.cmSheet) { skipPop = !0; try { history.back(); } catch { skipPop = !1; } } } })
    .observe(document.body, { attributes: !0, subtree: !0, attributeFilter: ['hidden'] });
  window.addEventListener('popstate', () => { if (skipPop) { skipPop = !1; return; } if (open()) { pushed = !1; closeIt(); } });
  let sx = 0, sy = 0, fromHead = !1, fromEdge = !1;
  document.addEventListener('touchstart', (e) => { if (!open()) return; const t = e.touches[0]; sx = t.clientX; sy = t.clientY; fromHead = !!(e.target.closest && e.target.closest('#cm-sheet .sh')); fromEdge = sx < 28; }, { passive: !0 });
  document.addEventListener('touchend', (e) => { if (!open() || (!fromHead && !fromEdge)) return; const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy; if ((fromHead && dy > 90 && Math.abs(dx) < 80) || (fromEdge && dx > 90 && Math.abs(dy) < 80)) closeIt(); }, { passive: !0 });
  // a small grab handle on the phone shows the header can be pulled down
  new MutationObserver(() => { const sh = document.querySelector('#cm-sheet .sh'); if (sh && !sh.querySelector('.cm-sheet-grab')) { const g = document.createElement('div'); g.className = 'cm-sheet-grab'; sh.prepend(g); } }).observe(document.body, { childList: !0, subtree: !0 });
})();
window.__cm2 = { nextHide, nextInfo, nextTag, editPerson: (a, p, cid) => editPerson(a, p, cid), rowOut: (cid, ch) => { rowOut = { cid, ch, at: Date.now() }; setTimeout(attachRowOut, 300); }, openEnrich: (a) => (window.__cm3 && window.__cm3.openEnrichQ ? window.__cm3.openEnrichQ(a) : openEnrich(a)), chatLogo: (t) => chatLogo(t), chatActs: (t) => chatActs(t), actEdit: (t) => actEdit(t), phRank, hav, drawTripMap, openPowerHour, openCommentContacts, relatedLine, openRelatedCheck, actView, beforeWrite, onWrite, isHouse, openPeople, openLog, identityLine, me, setPhCtx: (id) => { miCtx = id; }, passAssign, assigneeOf, openAssignments, drawCongressPage, hotList, drawTripPage, drawHome, isIgnored, moreItems, openWeekly, get rptData() { return window.__cm3 && window.__cm3.rptData; }, get rptHTML() { return window.__cm3 && window.__cm3.rptHTML; }, get rptMakeAI() { return window.__cm3 && window.__cm3.rptMakeAI; }, personSort, allowedIsos };
window.__cm.flush();
window.__cm2x = { companyChats, enrichPanel, allowedIsos, isIgnored, openAssignments, stageGuess, openEnrich, localDay, personSort, phRank, googleMeetings, needLog, homeLog, me, miLog, items, saveItem, loadItems, itemsS, isoDay, addDays, miPeople, low, pcS, CT_ID, loadingOrError, isHouse, setIgnore }; // what app3 uses (set last, after everything above exists)
