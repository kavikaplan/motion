const qs = (t, e = document) => e.querySelector(t),
  fmt = d3.format(','),
  compact = (t) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(t),
  money = (t) => (null == t ? '—' : `$${compact(t)}`),
  pct = (t) => (null == t ? '—' : d3.format('+.0%')(t)),
  flag = (t) => (t && /^[A-Z]{2}$/.test(t) && 'XK' !== t ? String.fromCodePoint(...[...t].map((t) => 127462 + t.charCodeAt(0) - 65)) : ''),
  enc = encodeURIComponent,
  el = (t, e, n) => {
    const a = document.createElement(t);
    return (e && (a.className = e), null != n && (a.textContent = n), a);
  },
  mark = (t, e, n, a) => ((t.dataset.source = e), n && (t.dataset.field = n), a && (t.dataset.where = a), t),
  rowsOf = (t) => {
    const e = dash.data(t);
    return 'ok' === e.status ? e.data : [];
  },
  failLine = (t) => {
    t.replaceChildren(el('div', 'cm-fail', 'Failed to load'));
  },
  pendingOnData = [];
let onDataReady = !1;
function onData(t) {
  onDataReady ? dash.onData(t) : pendingOnData.push(t);
}
let savedGroups = [];
function safeHref(t) {
  const e = String(t || '').trim();
  return /^https:\/\//i.test(e) || /^http:\/\//i.test(e) ? e : '';
}
function multiIsos() {
  const t = dash.params().isos;
  return Array.isArray(t) && t.length > 1 ? t : null;
}
const localISO = (t = new Date()) =>
    `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`,
  addDays = (t, e) => {
    const n = new Date(`${t}T12:00:00`);
    return (n.setDate(n.getDate() + e), localISO(n));
  },
  dueLabel = (t) => {
    if (!t) return '';
    const e = Math.round((new Date(`${t}T12:00:00`) - new Date(`${localISO()}T12:00:00`)) / 864e5);
    return e < 0
      ? `${-e} day${-1 === e ? '' : 's'} overdue`
      : 0 === e
        ? 'due today'
        : 1 === e
          ? 'tomorrow'
          : new Date(`${t}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
let selMode = !1;
const selIds = new Set(),
  sel = qs('#cm-country') || el('input');
if (!qs('#cm-country-list')) {
  const t = el('ul');
  ((t.id = 'cm-country-list'), (t.hidden = !0));
}
const moreBtn = qs('.cm-more'),
  search = qs('.cm-search');
let showAllBrands = !1;
window.cmOpenBrand = (e) => {
  const n = rowsOf('brand_profiles').find((t) => t.brand === e),
    a = n ? n.crm_q1 : e.toLowerCase(),
    o = n ? n.crm_q2 : a;
  (ensureBrandView(), (qs('.cm-bsearch').value = ''));
  const s = dash.params();
  (dash.setParams({
    view: 'brand',
    brand: e,
    bq1: a,
    bq2: o,
    bcountry: 'brand' === s.view ? s.bcountry || null : 'company' === s.view ? window.cmCompanyIso || null : s.iso,
  }),
    dash.setLink('brand'),
    window.scrollTo({ top: 0 }));
};
let companyBuilt = !1;
function ensureCompanyView() {
  if (companyBuilt) return;
  companyBuilt = !0;
  const e = qs('#company-view');
  (e.append(qs('#tpl-company').content.cloneNode(!0)),
    qs('.cm-cback', e).addEventListener('click', () => {
      const t = dash.params().from;
      (dash.setParams({ view: 'brand' === t ? 'brand' : 'country' }), dash.setLink('brand' === t ? 'brand' : 'overview'));
    }),
    qs('.cm-crefresh', e).addEventListener('click', () => {
      ['company_record', 'company_contacts', 'company_timeline', 'company_trade'].forEach((t) => dash.refresh(t));
    }));
}
((window.cmOpenCompany = (t) => {
  ensureCompanyView();
  const e = dash.params();
  (dash.setParams({ view: 'company', cid: t, from: 'company' === e.view ? e.from : 'brand' === e.view ? 'brand' : 'country' }),
    dash.setLink('company'),
    window.scrollTo({ top: 0 }));
}),
  (window.cmOpenGroup = (t, e) => {
    const n = rowsOf('countries'),
      a = t.map((t) => n.find((e) => e.iso === t)).filter(Boolean);
    if (!a.length) return;
    if (1 === a.length) return void window.cmOpenCountry(a[0].iso);
    ((showAllBrands = !1), (search.value = ''), window.cmResetFilters && window.cmResetFilters());
    const o = [...new Set(a.flatMap((t) => String(t.crm_tags).split('|')))];
    (dash.setParams({
      view: 'country',
      iso: a[0].iso,
      isos: a.map((t) => t.iso),
      glabel: e || `${a.length} countries`,
      tags: o,
      origin: 'all',
      seg: 'all',
      ctab: 'companies',
      csub: 'partners',
      pcity: null,
    }),
      dash.setLink('partners'),
      window.scrollTo({ top: 0 }));
  }),
  (window.cmOpenCountry = (t) => {
    const e = rowsOf('countries').find((e) => e.iso === t);
    if (e && !allowIso(t)) return void say(`${e.country} isn’t one of your markets`, !0);
    e &&
      ((showAllBrands = !1),
      (search.value = ''),
      window.cmResetFilters && window.cmResetFilters(),
      dash.setParams({
        view: 'country',
        iso: e.iso,
        isos: null,
        glabel: null,
        tags: String(e.crm_tags).split('|'),
        origin: 'all',
        seg: 'all',
        ctab: 'companies',
        csub: 'partners',
        pcity: null,
      }),
      dash.setLink('partners'),
      window.scrollTo({ top: 0 }));
  }));
let brandBuilt = !1;
function ensureBrandView() {
  if (brandBuilt) return;
  brandBuilt = !0;
  const e = qs('#brand-view');
  (e.append(qs('#tpl-brand').content.cloneNode(!0)),
    qs('.cm-back', e).addEventListener('click', () => {
      (dash.setParams({ view: 'country' }), dash.setLink('overview'));
    }),
    qs('.cm-bsearch', e).addEventListener('input', drawBrandTable),
    qs('.cm-bcsel', e).addEventListener('change', (t) => dash.setParams({ bcountry: t.target.value || null })));
}
function barList(t, n, a, o) {
  t.replaceChildren();
  const l = d3.max(n, (t) => t.companies) || 1;
  n.forEach((n, d) => {
    const p = el('div', 'cm-row'),
      u = o.flag ? flag(n.origin) : '',
      m = el('span', 'f' + (u ? '' : ' dot'), u);
    let h;
    (o.link ? ((h = el('button', 'cm-blink', n[a])), (h.type = 'button'), (h.dataset.openBrand = n[a])) : (h = el('span', 'nm', n[a])),
      (h.title = n[a]),
      o.src && mark(h, o.src, a, `${a}=${enc(n[a])}`));
    const g = el('span', 'ct', fmt(n.companies));
    o.src && mark(g, o.src, 'companies', `${a}=${enc(n[a])}`);
    const f = el('div', 'bar'),
      y = el('i');
    ((y.style.width = (n.companies / l) * 100 + '%'),
      (y.style.background = 0 === d ? dash.colors[0] : o.color || 'var(--cds-chart-muted)'),
      f.append(y),
      p.append(m, h, g, f),
      t.append(p));
  });
}
(moreBtn.addEventListener('click', () => {
  ((showAllBrands = !showAllBrands), drawCountry());
}),
  qs('.cm-pmore').addEventListener('click', () => {
    ((partnersAll = !partnersAll), drawPartners());
  }),
  search.addEventListener('input', () => drawTable()),
  document.addEventListener('click', (t) => {
    const e = t.target.closest('[data-open-brand]');
    if (e) return void window.cmOpenBrand(e.dataset.openBrand);
    const n = t.target.closest('[data-open-company]');
    if (n) return void window.cmOpenCompany(n.dataset.openCompany);
    const a = t.target.closest('[data-buyers-iso]');
    if (a && !t.target.closest('[data-open-iso]'))
      return (
        dash.setParams({ bcountry: a.dataset.buyersIso }),
        void document.getElementById('brand-buyers').scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    const o = t.target.closest('[data-open-iso]');
    o && window.cmOpenCountry(o.dataset.openIso);
  }));
let brandRules = null;
const brandNames = (t) => {
    if (!brandRules) {
      const t = rowsOf('brand_profiles');
      if (!t.length) return [];
      brandRules = t.map((t) => [new RegExp(t.match, 'i'), t.brand]);
    }
    const e = new Set();
    for (const n of String(t || '').split(/\n|\s+\/\s+|\s+-\s+(?=[A-Z])/)) {
      const t = n.trim().replace(/\s+/g, ' ');
      if (t.length < 3 || /^(ltd|ltd\.|inc|inc\.|co\.|limited|ooo|ortho)$/i.test(t)) continue;
      const a = brandRules.find(([e]) => e.test(t));
      e.add(a ? a[1] : t.replace(/\b\w+/g, (t) => (t.length > 3 && t === t.toUpperCase() ? t[0] + t.slice(1).toLowerCase() : t)));
    }
    return [...e];
  },
  filt = { cat: '', stat: '', brand: '' },
  bcache = new WeakMap(),
  fCat = qs('.cm-f-cat'),
  fStat = qs('.cm-f-stat'),
  fBrand = qs('.cm-f-brand'),
  fClear = qs('.cm-f-clear');
(fCat.addEventListener('change', () => {
  ((filt.cat = fCat.value), drawTable());
}),
  fStat.addEventListener('change', () => {
    ((filt.stat = fStat.value), drawTable());
  }),
  fBrand.addEventListener('change', () => {
    ((filt.brand = fBrand.value), drawTable());
  }));
const fDist = qs('.cm-f-dist');
(qs('.cm-sortimp').addEventListener('click', () => {
  ((filt.sortImp = !1 === filt.sortImp), drawTable());
}),
  fDist.addEventListener('click', () => {
    ((filt.dist = !filt.dist), drawTable());
  }),
  fClear.addEventListener('click', () => {
    ((filt.cat = filt.stat = filt.brand = ''), (filt.dist = !1), (search.value = ''), drawTable());
  }),
  (window.cmSetTableFilter = (t) => {
    (Object.assign(filt, t), drawTable());
  }),
  (window.cmResetFilters = () => {
    filt.brand = '';
  }));
const fillSel = (t, n, a, o) => {
  const s = [...a].sort((t, e) => e[1] - t[1] || String(t[0]).localeCompare(String(e[0])));
  (t.replaceChildren(new Option(`All ${n}`, ''), ...s.map(([t, n]) => new Option(`${t} (${fmt(n)})`, t))),
    (t.value = s.some(([t]) => t === o) ? o : ''),
    t.classList.toggle('on', !!t.value));
};
function drawTable() {
  const n = qs('.cm-ctable tbody'),
    o = dash.data('companies');
  if ((n.replaceChildren(), 'ok' !== o.status)) return void (qs('.cm-fcount').textContent = '');
  const s = o.data.map((t) => {
      if (!bcache.has(t)) {
        const e = brandNames(t.brands);
        if (!brandRules) return { r: t, _b: e, ...t };
        bcache.set(t, e);
      }
      return { r: t, _b: bcache.get(t), ...t };
    }),
    r = search.value.trim().toLowerCase(),
    c = OURS[oursKey()].field;
  if ('best_status' === c) {
    const t = new Map(rowsOf('partners').map((t) => [t.id, t.status_all || '']));
    s.forEach((e) => {
      e.best_status = t.get(e.id) || '';
    });
  }
  const d = qs(
    '.cm-ctable th[data-field="status"], .cm-ctable th[data-field="next_status"], .cm-ctable th[data-field="motion_status"], .cm-ctable th[data-field="best_status"]',
  );
  ((d.dataset.field = c), (d.textContent = `Status · ${OURS[oursKey()].label}`), filt.sf !== c && ((filt.sf = c), (filt.stat = '')));
  const p = (t, e) =>
    (!r || [t.company, t.city, t.brands, t.category, t.status].join(' ').toLowerCase().includes(r)) &&
    ('cat' === e || !filt.cat || (t.category || 'No category') === filt.cat) &&
    ('stat' === e || !filt.stat || (t[c] || 'No status') === filt.stat) &&
    ('brand' === e || !filt.brand || t._b.includes(filt.brand)) &&
    (!filt.dist || t._b.length > 0);
  (fillSel(
    fCat,
    'categories',
    d3.rollup(
      s.filter((t) => p(t, 'cat')),
      (t) => t.length,
      (t) => t.category || 'No category',
    ),
    filt.cat,
  ),
    fillSel(
      fStat,
      `${OURS[oursKey()].label} statuses`,
      d3.rollup(
        s.filter((t) => p(t, 'stat')),
        (t) => t.length,
        (t) => t[c] || 'No status',
      ),
      filt.stat,
    ));
  const u = new Map();
  (s.filter((t) => p(t, 'brand')).forEach((t) => t._b.forEach((t) => u.set(t, (u.get(t) || 0) + 1))),
    fillSel(fBrand, 'brands', u, filt.brand),
    (filt.cat = fCat.value),
    (filt.stat = fStat.value),
    (filt.brand = fBrand.value));
  const m = s.filter((t) => p(t));
  fDist.setAttribute('aria-pressed', String(!!filt.dist));
  const h = !!(r || filt.cat || filt.stat || filt.brand || filt.dist);
  ((fClear.hidden = !h),
    (qs('.cm-fcount').textContent = h ? `Showing ${fmt(m.length)} of ${fmt(s.length)} companies` : `${fmt(s.length)} companies`));
  const g = new Map(rowsOf('company_imports').map((t) => [t.id, t.import_value_usd])),
    f = !1 !== filt.sortImp;
  qs('.cm-sortimp').textContent = f ? 'Imports ↓' : 'Imports';
  for (const t of m
    .slice()
    .sort((t, e) => (f ? (g.get(e.id) || 0) - (g.get(t.id) || 0) : 0) || String(t.company).localeCompare(String(e.company)))) {
    const e = el('tr');
    e.dataset.key = t.id;
    const o = el('td');
    t[c] && o.append(el('span', 'cm-pill', t[c]));
    const s = el('td'),
      r = el('button', 'cm-co', t.company);
    ((r.type = 'button'), (r.dataset.openCompany = t.id), s.append(r));
    const l = meetingTag(t.id);
    l && ((l.style.marginLeft = '8px'), s.append(l));
    const d = g.get(t.id);
    (e.append(
      s,
      el('td', 'cm-hide-sm', t.city),
      el('td', 'cm-hide-sm', t.category),
      o,
      el('td', 'b cm-hide-sm', t.brands),
      el('td', 'cm-num', null != d ? money(d) : ''),
    ),
      n.append(e));
  }
}
function drawCountry() {
  const n = dash.data('countries'),
    p = dash.params().iso,
    u = 'ok' === n.status ? n.data : [],
    m = u.find((t) => t.iso === p);
  (document.activeElement !== sel && (sel.value = m ? `${flag(m.iso)} ${m.country}`.trim() : ''),
    document
      .querySelectorAll(
        '#country-view [data-source="countries"][data-field], #country-view [data-source="market_intel"][data-field], #country-view [data-source="osteo_trade"][data-field]',
      )
      .forEach((t) => t.setAttribute('data-where', `iso=${enc(p)}`)));
  const h = flag(p);
  ((qs('#country-view .cm-flag').textContent = h),
    (qs('#country-view .cm-iso').textContent = p),
    (qs('#country-view .cm-iso').style.display = h ? 'none' : 'inline-block'));
  const g = (e, n, a) => {
    const o = qs(`#country-view ${e}`) || qs(e);
    ((o.textContent = n ?? '—'), o.classList.toggle('dash-skeleton', 'loading' === a));
  };
  (g('.cm-name', m && m.country, n.status), g('.cm-region', m && m.region, n.status), g('.cm-capital', m && m.capital, n.status));
  const y = dash.data('market_intel'),
    b = ('ok' === y.status ? y.data : []).find((t) => t.iso === p) || {};
  ((qs('#market').hidden = 'ok' === y.status && null == b.market_size_usd && null == b.target_score),
    g('.cm-tscore', null != b.target_score ? Math.round(b.target_score) : '—', y.status),
    (qs('.cm-ttier').textContent =
      b.target_tier ||
      (b.next_status && 'New target market' !== b.next_status ? 'Not scored: ' + b.next_status.toLowerCase() : 'Not scored')),
    (qs('.cm-trank').textContent = null != b.target_rank ? `#${b.target_rank} of 97 new markets` : ''),
    g('.cm-g1', pct(b.import_growth_21_25), y.status),
    g('.cm-g2', pct(b.growth_24_25), y.status),
    g('.cm-tar', null != b.tariff_vs_tr ? d3.format('.1%')(b.tariff_vs_tr) : '—', y.status),
    g('.cm-trx', money(b.tr_exports_2025), y.status),
    g('.cm-trm', null != b.tr_makers_present ? `${b.tr_makers_present} of 12` : '—', y.status),
    g('.cm-peer', b.peer_sales_usd ? money(b.peer_sales_usd) : '—', y.status),
    g('.cm-hs', null != b.health_spend_pc ? `$${fmt(b.health_spend_pc)}` : '—', y.status),
    g('.cm-inc', b.income_group, y.status),
    (qs('.cm-why').hidden = !b.why_market),
    (qs('.cm-why .t').textContent = b.why_market || ''),
    (qs('.cm-watch').hidden = !b.watch_out),
    (qs('.cm-watch .t').textContent = b.watch_out || ''));
  const v = dash.data('osteo_trade'),
    w = ('ok' === v.status ? v.data : []).find((t) => t.iso === p) || {};
  ((qs('#osteo').hidden = 'ok' === v.status && null == w.osteo_imports_usd && null == w.osteo_exports_usd),
    g('.cm-o-imp', null != w.osteo_imports_usd ? money(w.osteo_imports_usd) : '—', v.status),
    (qs('.cm-o-rank').textContent = w.osteo_import_rank
      ? `#${w.osteo_import_rank} of ${w.osteo_importers_ranked} importers`
      : 'No import data'),
    (qs('.cm-o-share').textContent =
      null != w.osteo_import_share_world ? `${d3.format('.2%')(w.osteo_import_share_world)} of world imports` : ''),
    g('.cm-o-g5', pct(w.osteo_import_growth_5y), v.status),
    g('.cm-o-g2', pct(w.osteo_import_growth_2y), v.status),
    g('.cm-o-exp', null != w.osteo_exports_usd ? money(w.osteo_exports_usd) : '—', v.status),
    g('.cm-o-eg', pct(w.osteo_export_growth_5y), v.status),
    g(
      '.cm-o-bal',
      null != w.osteo_trade_balance_usd
        ? `${w.osteo_trade_balance_usd < 0 ? '−' : '+'}${money(Math.abs(w.osteo_trade_balance_usd))} ${w.osteo_trade_balance_usd < 0 ? 'net importer' : 'net exporter'}`
        : '—',
      v.status,
    ),
    g('.cm-o-erank', w.osteo_export_rank ? `#${w.osteo_export_rank} of ${w.osteo_exporters_ranked}` : '—', v.status));
  const _ = qs('.cm-o-vs');
  ((_.hidden = !(w.osteo_imports_usd && b.market_size_usd)),
    _.hidden ||
      (qs('.cm-o-vs .t').textContent =
        `${money(w.osteo_imports_usd)} osteosynthesis against ${money(b.market_size_usd)} joints: osteosynthesis is ${d3.format('.1f')(w.osteo_imports_usd / b.market_size_usd)}× the joints import market here.`));
  const C = dash.data('country_kpis'),
    E = 'ok' === C.status && C.data[0] ? C.data[0] : null,
    S = qs('#takeaway');
  if ((S.replaceChildren(), E && m)) {
    const t = `iso=${enc(p)}`,
      n = [],
      s = el('span');
    (s.append(mark(el('b', null, fmt(E.companies)), 'country_kpis', 'companies'), ' companies in NetHunt'),
      (s.firstChild.dataset.row = '0'),
      n.push(s));
    const l = el('span');
    if (
      (l.append(mark(el('b', null, fmt(E.brands)), 'country_kpis', 'brands'), ' brands'),
      (l.firstChild.dataset.row = '0'),
      n.push(l),
      null != b.market_size_usd)
    ) {
      const e = el('span');
      (e.append(
        'joints ',
        mark(el('b', null, money(b.market_size_usd)), 'market_intel', 'market_size_usd', t),
        null != b.import_growth_21_25 ? ` (${pct(b.import_growth_21_25)}/yr)` : '',
      ),
        n.push(e));
    }
    if (null != w.osteo_imports_usd) {
      const e = el('span');
      (e.append(
        'osteosynthesis ',
        mark(el('b', null, money(w.osteo_imports_usd)), 'osteo_trade', 'osteo_imports_usd', t),
        null != w.osteo_import_growth_5y ? ` (${pct(w.osteo_import_growth_5y)} in 5 yrs)` : '',
      ),
        n.push(e));
    }
    n.forEach((t, e) => S.append(e ? ' · ' : '', t));
  }
  const L = multiIsos();
  document.querySelectorAll('[data-ctab="overview"], [data-ctab="competitors"]').forEach((t) => {
    t.hidden = !!L;
  });
  {
    const e = qs('#takeaway');
    e && (e.hidden = !!L);
  }
  qs('#country-view').classList.toggle('is-group', !!L);
  if (L) {
    'companies' !== dash.params().ctab && dash.setParams({ ctab: 'companies' });
    const e = L.map((t) => u.find((e) => e.iso === t)).filter(Boolean);
    ((qs('#country-view .cm-flag').textContent = e.length > 3 ? ('My trip' === dash.params().glabel ? '🧳' : '🌍') : e.map((t) => flag(t.iso)).join('')),
      document.querySelectorAll('#country-view .cm-name, #country .cm-name').forEach((t) => {
        t.textContent = dash.params().glabel || `${e.length} countries`;
      }));
    const n0 = qs('#country-view .cm-gsub'); n0.replaceChildren();
    let n = n0; if (e.length > 8) { const d = el('details', 'cm-gfold'); d.append(el('summary', null, `${e.length} countries — show list`)); n0.append(d); n = el('div'); d.append(n); }
    (e.forEach((t, e) => {
        e && n.append(' · ');
        const a = el('button', 'cm-co', `${flag(t.iso)} ${t.country}`);
        ((a.type = 'button'),
          (a.title = `Open ${t.country} on its own`),
          a.addEventListener('click', () => window.cmOpenCountry(t.iso)),
          n.append(a));
      }));
  }
  {
    const e = qs('#country-view .cm-sub:not(.cm-gsub)'),
      n = qs('#country-view .cm-gsub');
    (e && (e.hidden = !!L), n && (n.hidden = !L));
  }
  (!(function () {
    const t = TABS.includes(dash.params().ctab) ? dash.params().ctab : 'overview';
    (document.querySelectorAll('[data-ctab]').forEach((e) => {
      const n = e.dataset.ctab === t;
      (e.setAttribute('aria-selected', String(n)), (e.tabIndex = n ? 0 : -1));
    }),
      document.querySelectorAll('[data-pane]').forEach((e) => e.classList.toggle('cm-hidden', e.dataset.pane !== t)));
  })(),
    (function (n) {
      const a = qs('#tenders'),
        o = qs('.cm-tenders', a),
        s = dash.data('tender_awards');
      if ((o.classList.toggle('dash-skeleton', 'loading' === s.status), portalLinks(qs('.cm-tportals'), n), 'error' === s.status))
        return ((a.hidden = !1), failLine(o));
      const l = ('ok' === s.status ? s.data : [])
        .filter((t) => t.country_iso === n)
        .sort((t, e) => (e.value_usd ?? e.value_local ?? 0) - (t.value_usd ?? t.value_local ?? 0));
      if (((a.hidden = 'ok' === s.status && !l.length && !PORTALS[n]), o.replaceChildren(), 'ok' !== s.status)) return;
      if (!l.length)
        return void o.append(
          el('div', 'cm-empty', 'No tender data loaded for this country yet. Use the portal below, or send me an export and I’ll add it.'),
        );
      const p = l.filter((t) => t.nethunt_id).length;
      ((qs('.cm-tenders-hint').textContent =
        `${fmt(l.length)} public tender winners found (${l[0].period}), ${fmt(p)} already in NetHunt. Source: ${l[0].source}.`),
        l.slice(0, 12).forEach((t, n) => {
          const a = `id=${enc(t.id)}`,
            s = el('div', 'cm-tw');
          let l;
          (t.nethunt_id
            ? ((l = el('button', 'cm-co nm', t.company)), (l.type = 'button'), (l.dataset.openCompany = t.nethunt_id))
            : (l = el('span', 'nm', t.company)),
            mark(l, 'tender_awards', 'company', a));
          const d = el('span', 'v');
          d.append(mark(el('span', null, tenderVal(t)), 'tender_awards', null != t.value_usd ? 'value_usd' : 'value_local', a));
          const p = [
              null != t.share_pct ? `${d3.format('.1f')(t.share_pct)}% of public spend` : null,
              t.awards ? `${fmt(t.awards)} awards` : null,
              t.niche,
              t.company_type && !/distributor/i.test(t.company_type) ? t.company_type : null,
            ]
              .filter(Boolean)
              .join(' · '),
            u = el('div', 'sub');
          (u.append(p),
            t.nethunt_id || (u.append(' '), u.append(el('span', 'new', 'Not in NetHunt'))),
            s.append(el('span', 'rk', String(n + 1)), l, d, u),
            o.append(s));
        }),
        l.length > 12 && o.append(el('div', 'cm-fcount', `+${fmt(l.length - 12)} more winners in the data`)));
    })(p),
    (function (n, o) {
      const s = qs('.cm-ourpos'),
        p = dash.data('partners');
      if ((s.classList.toggle('dash-skeleton', 'loading' === p.status), 'error' === p.status)) return failLine(s);
      const u = 'ok' === p.status ? p.data : [],
        m = oursKey();
      s.replaceChildren();
      for (const [t, d] of OUR3()) {
        const h = u.map((e) => e[`stage_${t}`]);
        let g = d3.max(h) || 0,
          f = '';
        'next' === t &&
          o &&
          ((g = Math.max(g, nextReportStage(o))),
          (f = [
            o.next_agreement && '-' !== o.next_agreement ? o.next_agreement : null,
            o.next_registration && '-' !== o.next_registration ? `registration ${String(o.next_registration).toLowerCase()}` : null,
            o.next_exports_2020_25 ? `${money(o.next_exports_2020_25)} shipped 2020–25` : null,
            o.next_price_reverse_cementless ? `reverse cementless ${fmt(o.next_price_reverse_cementless)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')));
        const y = el('div', 'cm-pos' + (t === m ? ' on' : '')),
          b = el('span', 'cm-dot');
        b.style.background = stageColor(g);
        const v = el('button', 'cm-co pn');
        (v.append(withLogo(t, d.label)), (v.type = 'button'), v.addEventListener('click', () => dash.setParams({ ours: t, mseg: d.seg })));
        const w = [2, 3, 4].map((t) => [t, h.filter((e) => e >= t).length]),
          _ = (rowsOf('countries').find((t) => t.iso === n) || {}).country || 'this country',
          $ = mark(el('span', 'ps', STAGE[g]), 'partners', `stage_${t}`);
        'ok' === p.status &&
          hoverList($, () => ({
            title: `${d.label} · ${STAGE[g].toLowerCase()} in ${_}`,
            items: u
              .filter((e) => e[`stage_${t}`] === g && g > 0)
              .sort(byStage(t))
              .map(coItem(t)),
            empty: g > 0 ? 'Furthest stage comes from the Next Shoulder report, not a NetHunt company.' : 'No one contacted here yet.',
          }));
        const k = el('span', 'pm');
        ([
          [2, 'contacted'],
          [3, 'engaged'],
          [4, 'interested+'],
        ].forEach(([e, n], a) => {
          a && k.append(' · ');
          const o = w[a][1],
            s = el('button', null, `${o} ${n}`);
          ((s.type = 'button'),
            'ok' === p.status &&
              hoverList(s, () => ({
                title: `${d.label} · ${n} in ${_}`,
                items: u
                  .filter((n) => n[`stage_${t}`] >= e)
                  .sort(byStage(t))
                  .map(coItem(t)),
              })),
            k.append(s));
        }),
          y.append(b, v, $, k),
          f && y.append(mark(el('span', 'pm', f), 'market_intel', 'next_agreement', `iso=${enc(n)}`)),
          s.append(y));
      }
    })(p, 'ok' === y.status ? b : null),
    drawPartners(),
    (function (n) {
      const o = qs('.cm-brandlist'),
        p = qs('.cm-origin'),
        u = dash.data('brands_in_country'),
        m = dash.data('competitor_footprint'),
        h = rowsOf('brand_profiles');
      if ((o.classList.toggle('dash-skeleton', 'loading' === u.status), 'error' === u.status))
        return (failLine(o), (moreBtn.hidden = !0), void p.replaceChildren());
      const g = new Map();
      for (const t of 'ok' === u.status ? u.data : [])
        g.set(t.brand, { brand: t.brand, origin: t.origin, companies: t.companies, company_ids: t.company_ids, trade: null });
      for (const t of ('ok' === m.status ? m.data : []).filter((t) => t.iso === n && 'Next Shoulder' !== t.group)) {
        const e = h.find((e) => e.brand === t.brand),
          n = g.get(t.brand) || {
            brand: t.brand,
            origin: e ? e.home_iso : 'Turkish maker' === t.group ? 'TR' : '',
            companies: 0,
            trade: null,
          };
        ((n.trade = t), g.set(t.brand, n));
      }
      for (const t of g.values()) {
        const e = h.find((e) => e.brand === t.brand);
        ((t.tier = e ? e.tier : null), !t.origin && e && (t.origin = e.home_iso));
      }
      let f = [...g.values()].sort(
        (t, e) =>
          e.companies - t.companies ||
          ((e.trade && e.trade.export_value_usd) || 0) - ((t.trade && t.trade.export_value_usd) || 0) ||
          t.brand.localeCompare(e.brand),
      );
      const y = dash.params().origin || 'all',
        b = d3
          .rollups(
            f.filter((t) => t.origin),
            (t) => t.length,
            (t) => t.origin,
          )
          .sort((t, e) => e[1] - t[1]),
        v = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
        w = (t, n, a) => {
          const o = el('button', 'cm-chip');
          return (
            (o.type = 'button'),
            o.setAttribute('aria-pressed', String(y === t)),
            o.append(el('span', null, n)),
            null != a && o.append(el('span', 'n', fmt(a))),
            o.addEventListener('click', () => {
              ((showAllBrands = !1), dash.setParams({ origin: t }));
            }),
            o
          );
        };
      (p.replaceChildren(w('all', 'All', f.length), ...b.map(([t, e]) => w(t, `${flag(t)} ${v.get(t) || t}`.trim(), e))),
        'all' !== y && (f = f.filter((t) => t.origin === y)));
      for (const t of f)
        if (!t.segments) {
          const e = h.find((e) => e.brand === t.brand);
          t.segments = e ? e.segments : '';
        }
      const _ = dash.params().seg || 'all',
        $ = (t, n) => {
          const a = el('button', 'cm-chip');
          return (
            (a.type = 'button'),
            a.setAttribute('aria-pressed', String(_ === t)),
            a.append(el('span', null, 'all' === t ? 'All segments' : t)),
            null != n && a.append(el('span', 'n', fmt(n))),
            a.addEventListener('click', () => {
              ((showAllBrands = !1), dash.setParams({ seg: t }));
            }),
            a
          );
        };
      if (
        (qs('.cm-segchips').replaceChildren(
          $('all'),
          ...[
            'Joints',
            'Osteosynthesis',
            'Spine',
            'Sports medicine',
            'Biologics & grafts',
            'Prosthetics & orthotics',
            'Imaging & equipment',
          ]
            .map((t) => [t, f.filter((e) => String(e.segments).split('|').includes(t)).length])
            .filter(([, t]) => t)
            .map(([t, e]) => $(t, e)),
        ),
        'all' !== _ && (f = f.filter((t) => String(t.segments).split('|').includes(_))),
        o.replaceChildren(),
        'ok' === u.status && !f.length)
      )
        return (o.append(el('div', 'cm-empty', 'No competitor brands recorded here yet.')), void (moreBtn.hidden = !0));
      const C = d3.max(f, (t) => t.companies) || 1;
      ((showAllBrands ? f : f.slice(0, 12)).forEach((t, l) => {
        const d = el('div', 'cm-row'),
          p = flag(t.origin),
          u = el('span', 'f' + (p ? '' : ' dot'), p);
        p && (u.title = v.get(t.origin) || t.origin);
        const m = el('button', 'cm-blink', t.brand);
        ((m.type = 'button'), (m.dataset.openBrand = t.brand), (m.title = `Open ${t.brand}`));
        const h = el('span', 'cm-meta');
        if (
          (t.trade &&
            h.append(
              mark(
                el('span', 'cm-tag tr', t.trade.export_rank ? `Export #${t.trade.export_rank}` : 'Exports here'),
                'competitor_footprint',
                'export_rank',
                `brand=${enc(t.brand)}&iso=${enc(n)}`,
              ),
            ),
          t.companies)
        ) {
          const n = mark(
            el('span', 'cm-imp' + (t.companies > 1 ? ' multi' : ''), t.companies > 1 ? `${fmt(t.companies)} importers` : '1 importer'),
            'brands_in_country',
            'companies',
            `brand=${enc(t.brand)}`,
          );
          ((n.title =
            t.companies > 1
              ? 'More than one company here carries this brand (not exclusive)'
              : 'Only one company here carries this brand in NetHunt'),
            hoverList(n, () => ({ title: `${t.brand} · importers here`, items: coItemsFromIds(t.company_ids) })),
            h.append(n));
        } else t.trade && h.append(el('span', 'cm-imp', 'Importer not in NetHunt'));
        if ((d.append(u, m, h), t.companies)) {
          const e = el('div', 'bar'),
            n = el('i');
          ((n.style.width = (t.companies / C) * 100 + '%'),
            (n.style.background = 0 === l ? dash.colors[0] : dash.colors[1]),
            e.append(n),
            d.append(e));
        }
        const g = [
          t.segments ? String(t.segments).split('|').join(', ') : null,
          t.tier && 'Other' !== t.tier ? t.tier : null,
          t.trade && t.trade.export_value_usd ? `${money(t.trade.export_value_usd)} tracked exports` : null,
        ].filter(Boolean);
        (g.length && d.append(el('div', 'cm-sub2', g.join(' · '))), o.append(d));
      }),
        (moreBtn.hidden = f.length <= 12),
        (moreBtn.textContent = showAllBrands ? 'Show top 12' : `Show all ${f.length} brands`));
    })(p),
    (function () {
      const n = qs('.cm-seglist'),
        a = dash.data('segments_in_country');
      if ((n.classList.toggle('dash-skeleton', 'loading' === a.status), 'error' === a.status)) return failLine(n);
      n.replaceChildren();
      const o = 'ok' === a.status ? a.data : [],
        s = d3.max(o, (t) => t.companies) || 1,
        l = dash.params().seg || 'all';
      o.forEach((t, a) => {
        const o = `segment=${enc(t.segment)}`,
          d = el('div', 'cm-seg');
        (d.setAttribute('role', 'button'), (d.tabIndex = 0), d.setAttribute('aria-pressed', String(l === t.segment)));
        const p = () => {
          ((showAllBrands = !1),
            dash.setParams({ seg: l === t.segment ? 'all' : t.segment }),
            document.getElementById('brands').scrollIntoView({ behavior: 'smooth', block: 'start' }));
        };
        (d.addEventListener('click', p),
          d.addEventListener('keydown', (t) => {
            ('Enter' !== t.key && ' ' !== t.key) || (t.preventDefault(), p());
          }));
        const u = el('span', 'sc'),
          m = mark(el('span', null, fmt(t.companies)), 'segments_in_country', 'companies', o);
        (t.companies && hoverList(m, () => ({ title: `${t.segment} · companies here`, items: coItemsFromIds(t.company_ids) })),
          u.append(m, el('span', 'cm-empty', ` co. · ${fmt(t.brands)} brands`)));
        const h = el('div', 'bar'),
          g = el('i');
        ((g.style.width = (t.companies / s) * 100 + '%'),
          (g.style.background = dash.colors[a % 8]),
          h.append(g),
          d.append(
            mark(el('span', 'sn', t.segment), 'segments_in_country', 'segment', o),
            u,
            h,
            mark(el('span', 'sb', t.top_brands || 'No brands recorded'), 'segments_in_country', 'top_brands', o),
          ),
          n.append(d));
      });
    })(),
    (function (n) {
      const a = qs('#registrants'),
        o = qs('.cm-reglist', a);
      if ('competitors' !== (dash.params().ctab || 'overview')) return;
      const s = dash.data('registrations');
      if ((o.classList.toggle('dash-skeleton', 'loading' === s.status), o.replaceChildren(), 'error' === s.status)) return failLine(o);
      const l = ('ok' === s.status ? s.data : []).filter((t) => t.country_iso === n);
      if (((a.hidden = 'ok' === s.status && !l.length), !l.length)) return;
      const p = dash.params().seg && 'all' !== dash.params().seg ? dash.params().seg : null,
        u = d3
          .rollups(
            l.filter((t) => !p || t.segment === p),
            (t) => t,
            (t) => t.company,
          )
          .sort((t, e) => e[1].length - t[1].length);
      ((qs('.cm-reg-hint').textContent =
        `${fmt(u.length)} local registrants${p ? ` in ${p.toLowerCase()}` : ''}, ${fmt(u.filter(([, t]) => t[0].nethunt_id).length)} in NetHunt. Source: ${[...new Set(l.map((t) => t.authority))].join('; ')}.`),
        u.slice(0, 15).forEach(([t, n], a) => {
          const s = n.find((t) => t.nethunt_id) || n[0],
            l = el('div', 'cm-tw');
          let d;
          (s.nethunt_id
            ? ((d = el('button', 'cm-co nm', t)), (d.type = 'button'), (d.dataset.openCompany = s.nethunt_id))
            : (d = el('span', 'nm', t)),
            mark(d, 'registrations', 'company', `id=${enc(s.id)}`));
          const p = [...new Set(n.map((t) => t.brand).filter(Boolean))],
            u = [...new Set(n.map((t) => t.manufacturer).filter(Boolean))],
            m = el('div', 'sub');
          (m.append(
            `${[...new Set(n.map((t) => t.segment))].join(', ')} · ${p.length ? `brands: ${p.slice(0, 4).join(', ')}` : `makers: ${u.slice(0, 3).join(', ').slice(0, 90)}`}`,
          ),
            s.nethunt_id || (m.append(' '), m.append(el('span', 'new', 'Not in NetHunt'))),
            l.append(el('span', 'rk', String(a + 1)), d, el('span', 'v', `${fmt(n.length)} devices`), m),
            o.append(l));
        }));
    })(p),
    drawTable());
}
const tagIsoMap = () => {
    const t = new Map();
    return (
      rowsOf('countries').forEach((e) =>
        String(e.crm_tags)
          .toLowerCase()
          .split('|')
          .forEach((n) => t.set(n, e.iso)),
      ),
      t
    );
  },
  isosOf = (t, e) =>
    new Set(
      String(t.country)
        .toLowerCase()
        .split(' | ')
        .map((t) => e.get(t))
        .filter(Boolean),
    );
function drawBrandTable() {
  const e = qs('.cm-btable tbody');
  if (!e) return;
  const n = dash.data('brand_companies');
  if ((e.replaceChildren(), 'ok' !== n.status)) return;
  const a = qs('.cm-bsearch').value.trim().toLowerCase(),
    o = a ? n.data.filter((t) => [t.company, t.country, t.city, t.status, t.brands].join(' ').toLowerCase().includes(a)) : n.data;
  for (const t of o
    .slice()
    .sort((t, e) => String(t.country).localeCompare(String(e.country)) || String(t.company).localeCompare(String(e.company)))) {
    const n = el('tr');
    n.dataset.key = t.id;
    const a = el('td');
    t.status && a.append(el('span', 'cm-pill', t.status));
    const o = el('td'),
      s = el('button', 'cm-co', t.company);
    ((s.type = 'button'),
      (s.dataset.openCompany = t.id),
      o.append(s),
      n.append(o, el('td', null, t.country), el('td', 'cm-hide-sm', t.city), a, el('td', 'b cm-hide-sm', t.brands)),
      e.append(n));
  }
}
const norm = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
function makeCombo(t, e, n, a = {}) {
  let o = [],
    s = -1;
  const r = () => o.filter((t) => !t.group),
    c = () => {
      e.replaceChildren();
      let n = -1;
      if (
        (o.forEach((t) => {
          const a = el('li');
          if (t.group) return ((a.className = 'g'), (a.textContent = t.group), a.setAttribute('role', 'presentation'), void e.append(a));
          n += 1;
          const o = n;
          (a.setAttribute('role', 'option'),
            (a.id = `${e.id}-${o}`),
            a.setAttribute('aria-selected', String(o === s)),
            a.append(el('span', null, t.icon || ''), el('span', 't', t.label), el('span', 's', t.sub || '')),
            a.addEventListener('mousedown', (t) => {
              (t.preventDefault(), p(o));
            }),
            e.append(a));
        }),
        (e.hidden = !o.length),
        t.setAttribute('aria-expanded', String(!e.hidden)),
        s >= 0)
      ) {
        t.setAttribute('aria-activedescendant', `${e.id}-${s}`);
        const n = document.getElementById(`${e.id}-${s}`);
        n && n.scrollIntoView({ block: 'nearest' });
      } else t.removeAttribute('aria-activedescendant');
    },
    l = () => {
      ((o = n(a.selectAllOnFocus && t.dataset.fresh ? '' : t.value)), (s = r().length ? 0 : -1), c());
    },
    d = () => {
      ((o = []), (s = -1), c());
    },
    p = (e) => {
      const n = r()[e];
      n &&
        (a.keepOpen
          ? (n.act(),
            (t.value = ''),
            setTimeout(() => {
              try {
                (t.focus(), l());
              } catch {}
            }, 0))
          : (d(), t.blur(), n.act()));
    };
  (t.addEventListener('focus', () => {
    (a.selectAllOnFocus && ((t.dataset.fresh = '1'), t.select()), l());
  }),
    t.addEventListener('input', () => {
      (delete t.dataset.fresh, l());
    }),
    t.addEventListener('blur', () => {
      (d(), a.onBlur && a.onBlur());
    }),
    t.addEventListener('keydown', (n) => {
      const a = r().length;
      'ArrowDown' === n.key
        ? (n.preventDefault(), e.hidden ? l() : a && ((s = (s + 1) % a), c()))
        : 'ArrowUp' === n.key
          ? (n.preventDefault(), a && ((s = (s - 1 + a) % a), c()))
          : 'Enter' === n.key
            ? (n.preventDefault(), p(s < 0 ? 0 : s))
            : 'Escape' === n.key
              ? (n.preventDefault(), d(), t.blur())
              : 'Tab' === n.key && !e.hidden && s >= 0 && p(s);
    }));
}
const allowIso = (iso) => { const s = window.__cm2 && window.__cm2.allowedIsos ? window.__cm2.allowedIsos() : null; return !s || s.has(iso); }; // Persons see only their countries
function countryItems(t) {
  const e = rowsOf('countries').filter((c) => allowIso(c.iso)),
    n = norm(t).trim();
  return (
    n
      ? e
          .map((t) => {
            const e = norm(t.country);
            return [e.startsWith(n) ? 0 : e.includes(n) ? 1 : t.iso.toLowerCase() === n ? 0 : norm(t.crm_tags).includes(n) ? 2 : 9, t];
          })
          .filter(([t]) => t < 9)
          .sort((t, e) => t[0] - e[0] || t[1].country.localeCompare(e[1].country))
          .map(([, t]) => t)
      : e.slice().sort((t, e) => t.country.localeCompare(e.country))
  )
    .slice(0, 60)
    .map((t) => ({ icon: flag(t.iso), label: t.country, sub: t.region, act: () => window.cmOpenCountry(t.iso) }));
}
makeCombo(sel, qs('#cm-country-list') || el('ul'), countryItems, {
  selectAllOnFocus: !0,
  onBlur: () =>
    (function () {
      const t = rowsOf('countries').find((t) => t.iso === dash.params().iso);
      document.activeElement !== sel && (sel.value = t ? `${flag(t.iso)} ${t.country}`.trim() : '');
    })(),
});
const cpop = qs('#cm-cpop'),
  cpick = qs('#cm-cpick'),
  TRIP_ISOS = ['CO', 'EC', 'PE', 'GT', 'PA', 'CL'];
function groupItems(e) {
  const n = norm(e).trim(),
    a = rowsOf('countries').filter((c) => allowIso(c.iso)),
    o = [],
    r = savedGroups,
    c = { icon: '🧳', label: 'My trip', isos: TRIP_ISOS },
    d = d3
      .groups(
        a.filter((t) => t.region),
        (t) => t.region,
      )
      .map(([t, e]) => ({ icon: '🌍', label: t, isos: e.map((t) => t.iso) }))
      .sort((t, e) => t.label.localeCompare(e.label));
  return (
    [{ icon: '🌐', label: window.__cm2 && window.__cm2.allowedIsos && window.__cm2.allowedIsos() ? 'All my countries' : 'All countries', isos: a.map((t) => t.iso) }, c, ...r.map((t) => ({ icon: '⭐', label: t.label, isos: t.isos })), ...d].forEach((t) => {
      if (n && !norm(t.label).includes(n)) return;
      t = { ...t, isos: t.isos.filter(allowIso) }; if (!t.isos.length) return;
      const e = t.isos.map((t) => (a.find((e) => e.iso === t) || {}).country).filter(Boolean);
      o.push({
        icon: t.icon,
        label: t.label,
        sub: `${e.length} countries${e.length <= 6 ? ` · ${e.join(', ')}` : ''}`,
        act: () => window.cmOpenGroup(t.isos, t.label),
      });
    }),
    o.push({
      icon: '☑️',
      label: 'Choose several countries…',
      sub: '',
      act: () =>
        setTimeout(
          () =>
            (function (t) {
              const e = new Set(multiIsos() || []);
              openSheet(
                t,
                'Choose countries',
                (t) => {
                  const n = el('div', 'cm-edit cm-fe'),
                    a = el('input');
                  ((a.type = 'text'), (a.placeholder = 'Filter countries…'));
                  const o = el('div', 'cm-gpick'),
                    r = () => {
                      const t = norm(a.value).trim();
                      o.replaceChildren(
                        ...rowsOf('countries')
                          .filter((n) => allowIso(n.iso) && (!t || norm(n.country).includes(t) || e.has(n.iso)))
                          .sort((t, n) => e.has(n.iso) - e.has(t.iso) || t.country.localeCompare(n.country))
                          .map((t) => {
                            const n = el('label', 'cm-check'),
                              a = el('input');
                            return (
                              (a.type = 'checkbox'),
                              (a.checked = e.has(t.iso)),
                              a.addEventListener('change', () => {
                                (a.checked ? e.add(t.iso) : e.delete(t.iso), (d.textContent = `${e.size} selected`));
                              }),
                              n.append(a, ` ${flag(t.iso)} ${t.country}`),
                              n
                            );
                          }),
                      );
                    };
                  a.addEventListener('input', r);
                  const c = el('input');
                  ((c.type = 'text'), (c.placeholder = 'Name this group (optional) — e.g. “Central America”'));
                  const d = el('span', 'cm-prog', `${e.size} selected`),
                    p = el('div', 'row'),
                    u = el('button', 'cm-btn', 'Open');
                  ((u.type = 'button'),
                    u.addEventListener('click', () => {
                      if (e.size < 1) return;
                      const t = [...e],
                        n = c.value.trim();
                      (n && (savedGroups = [...savedGroups.filter((t) => t.label !== n), { label: n, isos: t }]),
                        closeSheet(),
                        window.cmOpenGroup(t, n || null));
                    }),
                    p.append(d, u),
                    r());
                  const m = el('div', 'mrow');
                  (m.append(a), n.append(m, o, c, p), t.append(n), setTimeout(() => a.focus(), 0));
                },
                { static: !0 },
              );
            })(qs('.cm-goto-country')),
          0,
        ),
    }),
    o
  );
}
(makeCombo(
  cpick,
  qs('#cm-cpick-list'),
  (t) => {
    const e = [...countryItems(t), ...(norm(t).trim() ? groupItems(t).filter((t) => !/Choose several/.test(t.label)) : [])];
    if (!norm(t).trim()) {
      const e = groupItems(''),
        n = rowsOf('countries').find((t) => t.iso === dash.params().iso),
        a = countryItems(t);
      return [
        ...(n && !multiIsos()
          ? [
              { group: 'Current' },
              {
                icon: flag(n.iso),
                label: n.country,
                sub: 'Back to overview',
                act: () => {
                  (dash.setParams({ view: 'country' }), dash.setLink('overview'), window.scrollTo({ top: 0 }));
                },
              },
            ]
          : []),
        ...cmRecentRows(),
        { group: 'Several countries' },
        ...e,
        { group: 'Countries' },
        ...a,
      ];
    }
    const n = rowsOf('countries').find((t) => t.iso === dash.params().iso);
    if (!norm(t).trim() && n) {
      const t = e.filter((t) => t.label !== n.country);
      return [
        { group: 'Current' },
        {
          icon: flag(n.iso),
          label: n.country,
          sub: 'Back to overview',
          act: () => {
            (dash.setParams({ view: 'country' }), dash.setLink('overview'), window.scrollTo({ top: 0 }));
          },
        },
        { group: 'All countries' },
        ...t,
      ];
    }
    return e;
  },
  {
    onBlur: () => {
      cpop.hidden = !0;
    },
  },
),
  (window.cmPickCountry = (t) => {
    const e = t.getBoundingClientRect();
    cpop.hidden = !1;
    const n = cpop.offsetWidth,
      a = recentPtr();
    if (a) {
      const [t, e] = besidePoint(a, n, 360);
      placeFixed(cpop, t, e);
    } else placeFixed(cpop, Math.max(8, Math.min(e.left, window.innerWidth - n - 8)), e.bottom + 6);
    ((cpick.value = ''), cpick.focus());
  }),
  (window.cmOpenBrandIn = (e, n) => {
    const a = rowsOf('brand_profiles').find((t) => t.brand === e),
      o = rowsOf('countries').find((t) => t.iso === n);
    (ensureBrandView(), (qs('.cm-bsearch').value = ''));
    const s = a ? a.crm_q1 : e.toLowerCase();
    (dash.setParams({
      view: 'brand',
      brand: e,
      bq1: s,
      bq2: a ? a.crm_q2 : s,
      bcountry: n,
      ...(o ? { iso: o.iso, tags: String(o.crm_tags).split('|'), origin: 'all', seg: 'all' } : {}),
    }),
      dash.setLink('brand-buyers'),
      setTimeout(() => {
        const t = document.getElementById('brand-buyers');
        t && t.scrollIntoView({ block: 'start' });
      }, 50));
  }));
const findInput = qs('#cm-find');
makeCombo(findInput, qs('#cm-find-list'), (t) => {
  const n = norm(t).trim();
  if (!n)
    return [
      { group: 'Tips' },
      { icon: '⌨️', label: 'Type a country, a brand, a company, or both — e.g. “next colombia”', sub: '', act: () => findInput.focus() },
    ];
  const a = rowsOf('countries'),
    o = new Map();
  (rowsOf('brand_profiles').forEach((t) => o.set(t.brand, t.home_iso)),
    rowsOf('brands_in_country').forEach((t) => {
      o.has(t.brand) || o.set(t.brand, t.origin);
    }));
  try { const X = window.__cm3 && window.__cm3.brandExtra ? window.__cm3.brandExtra() : []; X.forEach((t) => { if (t.merged) o.delete(t.name); else if (!o.has(t.name)) o.set(t.name, t.iso); }); X.forEach((t) => { if (t.merged && !o.has(t.merged)) o.set(t.merged, ''); }); } catch { /* added brands are optional */ }
  const r = n.split(/\s+/).filter(Boolean),
    i = a
      .filter((t) => {
        if (!allowIso(t.iso)) return !1;
        const e = norm(t.country);
        return (
          r.some(
            (n) =>
              n.length >= 3 &&
              (e.startsWith(n) ||
                norm(t.crm_tags)
                  .split('|')
                  .some((t) => t.startsWith(n))),
          ) || r.includes(t.iso.toLowerCase())
        );
      })
      .slice(0, 5),
    c = [...o.keys()]
      .filter((t) => {
        const e = norm(t);
        return r.some((t) => t.length >= 3 && e.split(/[^a-z0-9]+/).some((e) => e.startsWith(t))) || e.startsWith(n);
      })
      .slice(0, 6),
    d = dash.params().iso,
    p = a.find((t) => t.iso === d),
    u = [];
  { const OB = [['next', /^(next|nextshoulder|next-shoulder|shoulder)$/], ['dunitech', /^(dunitech|duni|duni-tech)$/], ['motion', /^(motion|motionmedical)$/]]; const ob = OB.find(([, re]) => r.some((w) => re.test(w)));
    if (ob) { const cs = i.length ? i : p ? [p] : []; if (cs.length) { u.push({ group: `${OURS[ob[0]].label}` }); cs.slice(0, 3).forEach((e) => u.push({ icon: flag(e.iso), label: `${OURS[ob[0]].label} in ${e.country}`, sub: 'Best to call · by status', act: () => { window.cmOpenCountry(e.iso); dash.setParams({ ours: ob[0], ctab: 'companies', csub: 'partners', psort: 'status' }); } })); } } }
  if (
    (c.length &&
      i.length &&
      (u.push({ group: 'Distributors' }),
      c
        .slice(0, 3)
        .forEach((t) =>
          i
            .slice(0, 2)
            .forEach((e) =>
              u.push({
                icon: flag(e.iso),
                label: `Who distributes ${t} in ${e.country}`,
                sub: 'Brand × country',
                act: () => window.cmOpenBrandIn(t, e.iso),
              }),
            ),
        )),
    i.length &&
      (u.push({ group: 'Countries' }),
      i.forEach((t) => {
        (u.push({ icon: flag(t.iso), label: t.country, sub: 'Country overview', act: () => window.cmOpenCountry(t.iso) }),
          u.push({
            icon: '🏢',
            label: `All distributors in ${t.country}`,
            sub: 'Companies carrying any brand',
            act: () => {
              (window.cmOpenCountry(t.iso), dash.setParams({ ctab: 'companies', csub: 'list' }), window.cmSetTableFilter({ dist: !0 }));
            },
          }));
      })),
    c.length &&
      (u.push({ group: 'Brands' }),
      c.forEach((t) =>
        u.push({
          icon: flag(o.get(t)) || '🏷️',
          label: t,
          sub: p ? `Buyers in ${p.country}` : 'Brand profile',
          act: () => window.cmOpenBrandIn(t, d),
        }),
      )),
    n.length >= 2)
  )
    if ('ok' !== dash.data('company_index').status)
      u.push({ group: 'Companies' }, { icon: '⏳', label: 'Loading all companies…', sub: '', act: () => {} });
    else {
      const t = (function (t) {
        const e = new Map(rowsOf('company_index').map((t) => [t.id, t]));
        rowsOf('pipeline_changes').forEach((t) => e.set(t.id, t));
        const n = new Map(rowsOf('pipeline_stages').map((t) => [t.id, t])),
          a = oursKey(),
          o = t.split(/\s+/).filter(Boolean),
          s = [];
        for (const n of e.values()) {
          const e = norm(n.company);
          if (!e) continue;
          if (!o.every((t) => e.includes(t))) continue;
          const a = e === t ? -1 : e.startsWith(t) ? 0 : e.split(/[^a-z0-9]+/).some((t) => t.startsWith(o[0])) ? 1 : 2;
          s.push([a, n]);
        }
        s.sort(
          (t, e) =>
            t[0] - e[0] ||
            (n.has(e[1].id) ? n.get(e[1].id)[`stage_${a}`] : 0) - (n.has(t[1].id) ? n.get(t[1].id)[`stage_${a}`] : 0) ||
            t[1].company.length - e[1].company.length,
        );
        const r = s.slice(0, 12).map(([, t]) => {
          const e = isoOfCountry(t.country),
            o = n.get(t.id),
            s = o ? o[`stage_${a}`] : 0,
            r = [t.city ? String(t.city).split(',')[0] : '', t.country ? String(t.country).split(' | ')[0] : 'No country']
              .filter(Boolean)
              .join(', ');
          return { id: t.id, company: t.company, iso: e, sub: s ? `${r} · ${OURS[a].label.split(' ')[0]}: ${STAGE[s]}` : r };
        });
        return ((r.total = s.length), (r.more = s.length > 12), r);
      })(n);
      t.length &&
        (u.push({ group: 'Companies · all countries' + (t.more ? ` (top 12 of ${fmt(t.total)})` : '') }),
        t.forEach((t) => u.push({ icon: flag(t.iso) || '🏢', label: t.company, sub: t.sub, act: () => window.cmOpenCompany(t.id) })));
      const a = (function (t) {
        if (t.length < 3) return [];
        const e = new Set(),
          n = [],
          a = new Map(rowsOf('countries').map((t) => [t.iso, t.country]));
        for (const o of [...rowsOf('tender_awards'), ...rowsOf('registrations')]) {
          if (o.nethunt_id || !norm(o.company).includes(t)) continue;
          const s = `${o.country_iso}:${norm(o.company)}`;
          if (
            !e.has(s) &&
            (e.add(s), n.push({ iso: o.country_iso, name: o.company, country: a.get(o.country_iso) || o.country_iso }), n.length >= 4)
          )
            break;
        }
        return n;
      })(n);
      a.length &&
        (u.push({ group: 'Not in NetHunt (tenders & registrations)' }),
        a.forEach((t) =>
          u.push({ icon: flag(t.iso) || '＋', label: t.name, sub: `${t.country} · add?`, act: () => window.cmOpenLeads(t.iso, t.name) }),
        ));
    }
  return (u.length || u.push({ icon: '', label: 'No match', sub: 'Try a country, brand or company name', act: () => {} }), u);
});
let finderIso = null;
const isoOfCountry = (t) => {
  if (!finderIso) {
    const t = rowsOf('countries');
    if (!t.length) return null;
    ((finderIso = new Map()),
      t.forEach((t) =>
        String(t.crm_tags)
          .toLowerCase()
          .split('|')
          .forEach((e) => finderIso.set(e.trim(), t.iso)),
      ));
  }
  return (
    String(t || '')
      .toLowerCase()
      .split(' | ')
      .map((t) => finderIso.get(t.trim()))
      .find(Boolean) || null
  );
};
(onData(() => {
  document.activeElement === findInput &&
    findInput.value.trim().length >= 2 &&
    'ok' === dash.data('company_index').status &&
    !findInput.dataset.idxReady &&
    ((findInput.dataset.idxReady = '1'), findInput.dispatchEvent(new Event('input')));
}),
  findInput.addEventListener('focus', () => {
    dash.data('company_index');
  }),
  document.addEventListener('keydown', (t) => {
    const e = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    (('k' === String(t.key).toLowerCase() && (t.ctrlKey || t.metaKey)) || (('/' === t.key || '"' === t.key) && !e)) && (t.preventDefault(), findInput.focus());
  }));
const gmailHref = (t) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(String(t || '').trim())}`,
  svgI = (t) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t}</svg>`,
  ICON_LOG = svgI('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  ICON_PREP = svgI(
    '<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 11h8M8 15h5"/>',
  ),
  ICON_FLAG = svgI('<path d="M4 22V4m0 0h12l-2 4 2 4H4"/>'),
  ICON_PIN = svgI('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  ICON_CLOCK = svgI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  ICON_CHAT = svgI('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>'),
  ICON_TEL = svgI(
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  ),
  ICON_MAIL = svgI('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>'),
  ICON_WEB = svgI('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  ICON_NOTE = svgI(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  ),
  ICON_PPL = svgI(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  ),
  ICON_LI = svgI(
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  ),
  ICON_FB = svgI('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  ICON_IG = svgI('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
  ICON_X = svgI('<path d="M4 4l16 16M20 4 4 20"/>'),
  ICON_YT = svgI(
    '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  ),
  ICON_CAT = svgI('<path d="m21.4 11.6-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>'),
  ICON_WA = svgI('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M9.5 9.2c.2 1.6 1.7 3.6 3.3 4.4.6.3 1.1.2 1.5-.2l.5-.5"/>'),
  LOGO = window.cmBoot
    ? { next: 'img/logo_next.png', dunitech: 'img/logo_dunitech.png' }
    : { next: '/_blob/ee346e7f51dcae22dd78201d734c8dca', dunitech: '/_blob/da3089a44d1cdd3ef8a839637e4c0317' };
function logoImg(t, e) {
  if (!LOGO[t]) return null;
  const n = el('img', 'cm-logo' + (e ? ` ${e}` : ''));
  return ((n.src = LOGO[t]), (n.alt = ''), n.setAttribute('aria-hidden', 'true'), n);
}
const withLogo = (t, e, n) => {
    const a = document.createDocumentFragment(),
      o = logoImg(t, n);
    return (o && a.append(o), a.append(e), a);
  },
  OURS = {
    dunitech: { label: 'Dunitech', field: 'status', seg: 'Osteosynthesis' },
    next: { label: 'Next Shoulder', field: 'next_status', seg: 'Joints' },
    motion: { label: 'Motion Medical', field: 'motion_status', seg: 'Osteosynthesis' },
    all: { label: 'All companies', field: 'best_status', seg: 'Osteosynthesis', segName: 'orthopaedic', all: !0 },
  },
  OUR3 = () => Object.entries(OURS).filter(([, t]) => !t.all),
  STAGE = ['No contact', 'Lead', 'Contacted', 'Engaged', 'Interested', 'Negotiating', 'Partner'];
let lastPtr = null;
document.addEventListener(
  'pointerdown',
  (t) => {
    lastPtr = { x: t.clientX, y: t.clientY, t: Date.now() };
  },
  !0,
);
const recentPtr = () => (lastPtr && Date.now() - lastPtr.t < 1200 && (lastPtr.x || lastPtr.y) ? lastPtr : null);
function besidePoint(t, e, n) {
  const a = window.innerWidth,
    o = window.innerHeight;
  let s = t.x + 12,
    r = t.y + 14;
  return (
    s + e > a - 8 && (s = Math.max(8, t.x - e - 10)),
    r + n > o - 8 && (r = Math.max(8, Math.min(t.y - n - 10, o - n - 8))),
    [Math.max(8, s), Math.max(8, r)]
  );
}
function placeFixed(t, e, n) {
  ((t.style.left = `${e}px`), (t.style.top = `${n}px`));
  const a = t.getBoundingClientRect();
  if (!a.width && !a.height) return;
  const o = a.left - e,
    s = a.top - n;
  (Math.abs(o) > 0.5 || Math.abs(s) > 0.5) && ((t.style.left = e - o + 'px'), (t.style.top = n - s + 'px'));
}
const pop = qs('#cm-pop');
let popFor = null,
  popT = null,
  popRefresh = null;
const hidePop = () => {
    (clearTimeout(popT), (pop.hidden = !0), (popFor = null), (popRefresh = null));
  },
  laterHide = () => {
    (clearTimeout(popT), (popT = setTimeout(hidePop, 220)));
  };
function showPop(t, n, a, o, s, r, c) {
  (clearTimeout(popT), (popFor = t), pop.replaceChildren());
  const l = el('div', 'h', n);
  (r || c || l.append(el('span', 'n', ` · ${fmt(a.length)}`)), pop.append(l));
  const d = el('div', 'b');
  (r ? d.append(r) : a.length || d.append(el('div', 'e', o || 'None yet.')),
    a.slice(0, 150).forEach((t) => {
      const e = el('button', 'cm-pi');
      ((e.type = 'button'),
        t.id
          ? (e.dataset.openCompany = t.id)
          : t.iso
            ? (e.dataset.openIso = t.iso)
            : t.brand
              ? (e.dataset.openBrand = t.brand)
              : ((e.disabled = !0), (e.style.cursor = 'default')),
        e.append(el('span', null, t.icon || (t.id ? '🏢' : '')), el('span', 't', t.label), el('span', 's', t.sub || '')),
        d.append(e));
    }),
    pop.append(d),
    a.length > 150 && pop.append(el('div', 'more', `+${fmt(a.length - 150)} more`)),
    (pop.hidden = !1));
  const p = t.getBoundingClientRect(),
    u = pop.offsetWidth,
    m = pop.offsetHeight,
    h = window.innerWidth,
    g = window.innerHeight;
  let f, y;
  (s
    ? ([f, y] = besidePoint(s, u, m))
    : ((f = Math.max(8, Math.min(p.left, h - u - 8))), (y = p.bottom + m + 8 > g && p.top - m - 6 > 8 ? p.top - m - 6 : p.bottom + 6)),
    placeFixed(pop, f, y));
}
function hoverList(t, e, n = {}) {
  (t.classList.add('cm-hov'),
    'BUTTON' === t.tagName || t.hasAttribute('tabindex') || (t.tabIndex = 0),
    t.setAttribute('aria-haspopup', 'dialog'));
  const a = (n) => {
    const a = e();
    if (!a) return;
    const o = n && null != n.clientX && (n.clientX || n.clientY) ? { x: n.clientX, y: n.clientY } : null;
    (showPop(t, a.title, a.items || [], a.empty, o, a.node, a.noCount),
      (popRefresh = a.refresh
        ? () => {
            if (popFor === t && !pop.hidden) {
              const n = e(),
                a = { left: pop.style.left, top: pop.style.top };
              (showPop(t, n.title, n.items || [], n.empty, null, n.node), (pop.style.left = a.left), (pop.style.top = a.top));
            }
          }
        : null));
  };
  return (
    t.addEventListener('mouseenter', (t) => {
      clearTimeout(popT);
      const e = { clientX: t.clientX, clientY: t.clientY };
      popT = setTimeout(() => a(e), 120);
    }),
    t.addEventListener('mouseleave', laterHide),
    t.addEventListener('focus', () => {
      (popFor !== t || pop.hidden) && a();
    }),
    t.addEventListener('blur', (t) => {
      pop.contains(t.relatedTarget) || laterHide();
    }),
    n.keepClick ||
      t.addEventListener('click', (e) => {
        (e.stopPropagation(), popFor !== t || pop.hidden || e.detail ? a(e) : hidePop());
      }),
    t
  );
}
(pop.addEventListener('mouseenter', () => clearTimeout(popT)),
  pop.addEventListener('mouseleave', laterHide),
  pop.addEventListener('focusout', (t) => {
    pop.contains(t.relatedTarget) || t.relatedTarget === popFor || laterHide();
  }),
  pop.addEventListener('click', (t) => {
    t.target.closest('.cm-pi') && setTimeout(hidePop, 0);
  }),
  document.addEventListener('click', (t) => {
    pop.hidden || pop.contains(t.target) || t.target.closest('.cm-hov') || hidePop();
  }),
  document.addEventListener('keydown', (t) => {
    if ('Escape' === t.key && !pop.hidden) {
      t.stopImmediatePropagation();
      const e = popFor;
      (hidePop(), e && e.focus());
    }
  }),
  window.addEventListener(
    'scroll',
    () => {
      pop.hidden || hidePop();
    },
    { passive: !0 },
  ));
const byStage = (t) => (e, n) => n[`stage_${t}`] - e[`stage_${t}`] || String(e.company).localeCompare(String(n.company)),
  coItem = (t) => (e) => ({ id: e.id, label: e.company, sub: STAGE[e[`stage_${t}`]] });
function coItemsFromIds(t) {
  const e = String(t || '')
      .split('|')
      .filter(Boolean),
    n = new Map(rowsOf('companies').map((t) => [t.id, t])),
    a = oursKey(),
    o = new Map(rowsOf('partners').map((t) => [t.id, t[`stage_${a}`]]));
  return e
    .map((t) => {
      const e = n.get(t) || {},
        s = o.get(t) || 0;
      return { id: t, label: e.company || t, sub: s ? `${OURS[a].label.split(' ')[0]}: ${STAGE[s]}` : e.status || e.city || '' };
    })
    .sort((t, e) => (o.get(e.id) || 0) - (o.get(t.id) || 0) || t.label.localeCompare(e.label));
}
const isoItem = (t, e) => (n) => ({ iso: n.iso, icon: flag(n.iso), label: n.country, sub: e ? e(n) : STAGE[n[`stage_${t}`]] }),
  impMap = () => {
    const t = new Map();
    return (rowsOf('import_values').forEach((e) => t.set(e.id, e)), t);
  },
  impLevel = (t) =>
    null == t
      ? null
      : t >= 1e6
        ? 'Major importer'
        : t >= 1e5
          ? 'Mid-size importer'
          : t >= 1e4
            ? 'Small importer'
            : t > 0
              ? 'Occasional importer'
              : 'No value recorded',
  impTag = (t) => {
    if (!t) return null;
    const e = mark(
      el('span', 'cm-imp' + (t.import_value_usd >= 1e5 ? ' multi' : ''), `${money(t.import_value_usd)} imports`),
      'import_values',
      'import_value_usd',
      `id=${enc(t.id)}`,
    );
    return (
      (e.title = `${impLevel(t.import_value_usd)} · from ${t.import_entries} trade-data entr${1 === t.import_entries ? 'y' : 'ies'}`),
      e
    );
  },
  PORTALS = {
    EC: [['SERCOP', 'https://www.compraspublicas.gob.ec']],
    PE: [['SEACE / OECE', 'https://www.seace.gob.pe']],
    CL: [['Mercado Público', 'https://www.mercadopublico.cl']],
    GT: [['Guatecompras', 'https://www.guatecompras.gt']],
    PA: [['PanamaCompra', 'https://www.panamacompra.gob.pa']],
    CO: [['SECOP (Colombia Compra)', 'https://www.colombiacompra.gov.co']],
    TR: [['EKAP (KİK)', 'https://ekap.kik.gov.tr']],
    IN: [
      ['GeM', 'https://gem.gov.in'],
      ['CPPP', 'https://eprocure.gov.in'],
    ],
    AR: [['COMPR.AR', 'https://comprar.gob.ar']],
    BR: [
      ['PNCP', 'https://pncp.gov.br'],
      ['Compras.gov.br', 'https://www.gov.br/compras'],
    ],
    ID: [
      ['SPSE (Kemenkes LPSE)', 'https://spse.inaproc.id/kemkes'],
      ['opentender.net', 'https://opentender.net'],
      ['InfoAlkes (registrations)', 'https://infoalkes.kemkes.go.id'],
      ['e-Katalog v6', 'https://katalog.inaproc.id'],
    ],
    ZA: [
      ['eTenders', 'https://www.etenders.gov.za'],
      ['eTenders open data', 'https://data.etenders.gov.za'],
      ['SAHPRA licences', 'https://www.sahpra.org.za/licences-and-permits/'],
    ],
    FR: [
      [
        'DECP awards (data.gouv.fr)',
        'https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-consolidees-format-tabulaire',
      ],
      ['BOAMP', 'https://www.boamp.fr'],
    ],
    IT: [
      ['ANAC open data', 'https://dati.anticorruzione.it/opendata'],
      ['Consip / MEPA', 'https://www.acquistinretepa.it'],
    ],
    ES: [['PLACSP', 'https://contrataciondelsectorpublico.gob.es']],
    DE: [['oeffentlichevergabe.de', 'https://www.oeffentlichevergabe.de']],
    PL: [['e-Zamówienia', 'https://ezamowienia.gov.pl']],
    PT: [['Portal BASE', 'https://www.base.gov.pt']],
    HR: [['EOJN', 'https://eojn.nn.hr']],
    GR: [['KIMDIS', 'https://cerpp.eprocurement.gov.gr']],
    RO: [['SEAP / SICAP', 'https://www.e-licitatie.ro']],
    NL: [['TenderNed', 'https://www.tenderned.nl']],
    CZ: [['NEN', 'https://nen.nipez.cz']],
    IE: [['eTenders', 'https://www.etenders.gov.ie']],
    UA: [['Prozorro', 'https://prozorro.gov.ua']],
    SA: [
      ['Etimad', 'https://portal.etimad.sa'],
      ['NUPCO', 'https://www.nupco.com'],
    ],
    DO: [['Compras Dominicana', 'https://www.comprasdominicana.gob.do']],
    GH: [['GHANEPS', 'https://www.ghaneps.gov.gh']],
    VN: [['Muasamcong', 'https://muasamcong.mpi.gov.vn']],
    PH: [['PhilGEPS', 'https://www.philgeps.gov.ph']],
    KZ: [['Goszakup', 'https://goszakup.gov.kz']],
    PY: [['DNCP', 'https://www.contrataciones.gov.py']],
    UY: [['ARCE', 'https://www.comprasestatales.gub.uy']],
  },
  EU_PORTALS = [
    ['TED (all EU)', 'https://ted.europa.eu'],
    ['TED Search API', 'https://docs.ted.europa.eu/api/latest'],
    ['OpenTender.eu (history)', 'https://opentender.eu'],
    ['OCDS Data Registry', 'https://data.open-contracting.org'],
  ],
  portalLinks = (t, e) => {
    t.replaceChildren();
    const n = PORTALS[e];
    n &&
      (t.append(el('span', null, 'Check tenders:')),
      n.forEach(([e, n]) => {
        const a = el('a', null, e);
        ((a.href = n), (a.target = '_blank'), (a.rel = 'noopener noreferrer'), t.append(a));
      }));
  },
  CUR = { TRY: '₺', INR: '₹', USD: '$' },
  tenderVal = (t) =>
    null != t.value_usd
      ? money(t.value_usd)
      : null != t.value_local
        ? `${CUR[t.currency] || t.currency + ' '}${compact(t.value_local)}`
        : '—',
  nextReportStage = (t) =>
    t
      ? /exclusive/i.test(t.next_agreement || '')
        ? 6
        : /complete|in progress/i.test(t.next_registration || '')
          ? 5
          : 'Active' === t.next_presence
            ? 6
            : /early contact/i.test(t.next_status || '') || 'Prospect' === t.next_presence
              ? 2
              : 0
      : 0,
  stageColor = (t) =>
    t >= 6
      ? 'var(--color-ok)'
      : 5 === t
        ? dash.colors[0]
        : 4 === t
          ? dash.colors[1]
          : 3 === t
            ? dash.colors[2]
            : 2 === t
              ? dash.colors[4]
              : 1 === t
                ? dash.colors[6]
                : 'var(--cds-chart-muted)',
  oursKey = () => (OURS[dash.params().ours] ? dash.params().ours : 'next'),
  curView = () => {
    const t = dash.params();
    return 'company' === t.view && t.cid
      ? 'company'
      : 'brand' === t.view && t.brand
        ? 'brand'
        : 'country' === t.view
          ? 'country'
          : 'tenders' === t.view
            ? 'tenders'
            : 'sources' === t.view
              ? 'sources'
              : 'congresses' === t.view
                ? 'congresses'
                : 'trips' === t.view
                  ? 'trips'
                  : 'home' === t.view || !t.view
                    ? 'home'
                    : 'markets';
  },
  menu = qs('#cm-menu');
let menuFor = null;
function closeMenu() {
  if (menu.hidden) return null;
  menu.hidden = !0;
  const t = menuFor;
  return ((menuFor = null), t && t.setAttribute('aria-expanded', 'false'), t);
}
function openMenu(t, e) {
  if (menuFor === t && !menu.hidden) return;
  (hidePop(),
    (menuFor = t),
    t.setAttribute('aria-expanded', 'true'),
    menu.replaceChildren(
      ...e.map((t) => {
        const e = el('button');
        ((e.type = 'button'), e.setAttribute('role', 'menuitemradio'), e.setAttribute('aria-checked', String(!!t.on)));
        const n = el('span');
        return (
          t.logo && LOGO[t.logo] ? n.append(logoImg(t.logo)) : (n.textContent = t.icon || ''),
          e.append(n, el('span', null, t.label), el('span', 's', t.sub || '')),
          e.addEventListener('click', () => {
            (closeMenu(), t.act());
          }),
          e
        );
      }),
    ),
    (menu.hidden = !1));
  const n = recentPtr(),
    a = t.getBoundingClientRect(),
    [o, s] = n
      ? besidePoint(n, menu.offsetWidth, menu.offsetHeight)
      : [Math.max(8, Math.min(a.left, window.innerWidth - menu.offsetWidth - 8)), a.bottom + 6];
  placeFixed(menu, o, s);
  const r = menu.querySelector('[aria-checked=true]') || menu.querySelector('button');
  r && r.focus();
}
(document.addEventListener('mousedown', (t) => {
  menu.hidden || menu.contains(t.target) || (menuFor && menuFor.contains(t.target)) || closeMenu();
}),
  document.addEventListener('keydown', (t) => {
    if (!menu.hidden)
      if ('Escape' === t.key) {
        t.stopImmediatePropagation();
        const e = closeMenu();
        e && e.focus();
      } else if ('ArrowDown' === t.key || 'ArrowUp' === t.key) {
        t.preventDefault();
        const e = [...menu.querySelectorAll('button')],
          n = e.indexOf(document.activeElement);
        e[(n + ('ArrowDown' === t.key ? 1 : e.length - 1)) % e.length].focus();
      }
  }));
const MARKET_PAGES = {
  home: ['🏠', 'Home', 'What to do now and what’s coming'],
  markets: ['🌍', 'Markets', 'Where to focus next'],
  tenders: ['🏛️', 'Tenders', 'Who wins public tenders'],
  congresses: ['🎪', 'Congresses', 'National & world meetings, associations, exhibitors'],
  trips: ['🧳', 'Trip planner', 'Plan a trip: countries, potential, holidays, congresses, flights'],
  sources: ['📚', 'Sources', 'Where the data comes from'],
};
function goMarketPage(t) {
  (closeSheet(),
    hidePop(),
    'markets' === t
      ? (ensureMarketsView(), dash.setParams({ view: 'markets', from: null }), dash.setLink('markets'))
      : 'tenders' === t
        ? (ensureTendersView(), dash.setParams({ view: 'tenders' }), dash.setLink('tenders-page'))
        : 'congresses' === t || 'trips' === t || 'home' === t
          ? dash.setParams({ view: t })
          : (ensureSourcesView(), dash.setParams({ view: 'sources' }), dash.setLink('sources-page')),
    window.scrollTo({ top: 0 }));
}
const marketsMenu = (t) =>
    openMenu(
      t,
      Object.entries(MARKET_PAGES).map(([t, [e, n, a]]) => ({ icon: e, label: n, sub: a, on: curView() === t, act: () => goMarketPage(t) })),
    ),
  onPartners = () => 'country' === curView() && 'companies' === dash.params().ctab && 'list' !== dash.params().csub,
  oursMenu = (t) =>
    openMenu(
      t,
      Object.entries(OURS).map(([t, e]) => ({
        icon: 'all' === t ? '🌐' : 'motion' === t ? '⚙️' : '',
        logo: t,
        label: e.label,
        sub: e.all ? 'Neutral view' : e.seg,
        on: t === oursKey(),
        act: () => dash.setParams({ ours: t, mseg: e.seg }),
      })),
    );
(document.querySelectorAll('[data-goto]').forEach((t) =>
  t.addEventListener('click', () => {
    if ('markets' === t.dataset.goto) {
      const e = curView();
      return 'markets' === e || 'tenders' === e || 'sources' === e || 'congresses' === e || 'trips' === e || 'home' === e ? void marketsMenu(t) : void goMarketPage('home');
    }
    if ('tenders' === t.dataset.goto) (ensureTendersView(), dash.setParams({ view: 'tenders' }), dash.setLink('tenders-page'));
    else {
      if ('sources' !== t.dataset.goto) {
        const e = dash.params();
        return rowsOf('countries').some((t) => t.iso === e.iso) && 'country' !== curView()
          ? (dash.setParams({ view: 'country' }), dash.setLink('overview'), void window.scrollTo({ top: 0 }))
          : void window.cmPickCountry(t);
      }
      (ensureSourcesView(), dash.setParams({ view: 'sources' }), dash.setLink('sources-page'));
    }
    window.scrollTo({ top: 0 });
  }),
),
  qs('.cm-goto-country').addEventListener('dblclick', (t) => {
    (t.preventDefault(), window.cmPickCountry(t.currentTarget));
  }),
  qs('.cm-goto-markets').addEventListener('dblclick', (t) => {
    (t.preventDefault(), marketsMenu(t.currentTarget));
  }),
  qs('.cm-ours-btn').addEventListener('click', (t) => {
    const e = rowsOf('countries').some((t) => t.iso === dash.params().iso);
    !onPartners() && e
      ? (closeSheet(),
        hidePop(),
        dash.setParams({ view: 'country', ctab: 'companies', csub: 'partners' }),
        dash.setLink('partners'),
        window.scrollTo({ top: 0 }))
      : oursMenu(t.currentTarget);
  }),
  qs('.cm-ours-btn').addEventListener('dblclick', (t) => {
    (t.preventDefault(), oursMenu(t.currentTarget));
  }));
const TABS = ['overview', 'competitors', 'companies'];
document.querySelectorAll('[data-ctab]').forEach((t) => {
  (t.addEventListener('click', () => {
    (dash.setParams({ ctab: t.dataset.ctab }), dash.setLink(`tab-${t.dataset.ctab}`));
  }),
    t.addEventListener('keydown', (e) => {
      if ('ArrowRight' !== e.key && 'ArrowLeft' !== e.key) return;
      const n = TABS.indexOf(t.dataset.ctab),
        a = TABS[(n + ('ArrowRight' === e.key ? 1 : 2)) % 3];
      (dash.setParams({ ctab: a }), setTimeout(() => document.querySelector(`[data-ctab="${a}"]`).focus(), 0));
    }));
});
let partnersAll = !1;
const digits = (t) => String(t || '').replace(/\D/g, ''),
  waHref = (t) => `https://wa.me/${digits(t).replace(/^00/, '')}`,
  splitBar = (t) =>
    String(t || '')
      .split(' | ')
      .map((t) => t.trim())
      .filter(Boolean),
  goodPhone = (t) => digits(t).length >= 7,
  waOk = (t) => {
    const e = String(t || '').trim();
    if (!/^(\+|00)/.test(e)) return !1;
    const n = digits(e).replace(/^00/, '');
    if (n.length < 8 || n.length > 15 || /^0/.test(n)) return !1;
    if (noWaNums.has(n)) return !1; // you marked it "not on WhatsApp"
    for (const len of [3, 2, 1]) { const rule = MOBILE_RULES[n.slice(0, len)]; if (rule) return rule.test(n.slice(len)); }
    return !0; // country without a rule: allow
  };
// mobile number patterns after the country code (landlines are left out); countries not listed are allowed
const MOBILE_RULES = {
  593: /^9\d{8}$/, 51: /^9\d{8}$/, 56: /^9\d{8}$/, 57: /^3\d{9}$/, 502: /^[3-5]\d{7}$/, 507: /^6\d{7}$/, 506: /^[5-8]\d{7}$/,
  503: /^[67]\d{7}$/, 504: /^[389]\d{7}$/, 505: /^[5-8]\d{7}$/, 591: /^[67]\d{7}$/, 595: /^9\d{8}$/, 598: /^9\d{7}$/, 58: /^4\d{9}$/,
  54: /^9\d{10}$/, 55: /^\d{2}9\d{8}$/, 90: /^5\d{9}$/, 44: /^7\d{9}$/, 49: /^1[5-7]\d{8,9}$/, 34: /^[67]\d{8}$/, 39: /^3\d{8,9}$/,
  33: /^[67]\d{8}$/, 971: /^5\d{8}$/, 966: /^5\d{8}$/, 20: /^1\d{9}$/, 212: /^[67]\d{8}$/, 92: /^3\d{9}$/, 91: /^[6-9]\d{9}$/,
  995: /^5\d{8}$/, 994: /^(10|5[015]|7[07]|99)\d{7}$/, 7: /^[79]\d{9}$/, 962: /^7[789]\d{7}$/, 961: /^(3\d{6}|7[01689]\d{6}|81\d{6})$/,
  964: /^7\d{9}$/, 218: /^9[1-5]\d{7}$/, 216: /^[2-579]\d{7}$/, 213: /^[5-7]\d{8}$/, 998: /^[3-9]\d{8}$/, 30: /^69\d{8}$/, 48: /^[4-8]\d{8}$/,
  355: /^6\d{8}$/, 373: /^[67]\d{7}$/, 60: /^1\d{8,9}$/, 63: /^9\d{9}$/, 94: /^7\d{8}$/, 960: /^[79]\d{6}$/, 256: /^7\d{8}$/,
};
// numbers you marked as not on WhatsApp (saved with your settings)
let noWaNums = new Set();
function unmarkNoWa(num) { noWaNums.delete(digits(num).replace(/^00/, '')); say(`${num} shows WhatsApp again`); dash.setParams({}); }
const isNoWa = (num) => noWaNums.has(digits(num).replace(/^00/, ''));
function markNoWa(num) { noWaNums.add(digits(num).replace(/^00/, '')); say(`${num} marked as not on WhatsApp`); dash.setParams({}); }
function iconLink(t, e, n, a, o) {
  const s = el('a', `cm-qi ${t}`);
  return (
    (s.href = n),
    (s.title = a),
    s.setAttribute('aria-label', a),
    (s.innerHTML = e),
    o && ((s.target = '_blank'), (s.rel = 'noopener noreferrer')),
    s
  );
}
// on the website on a phone, tapping a number calls it; inside Claude (tel: blocked) or on a computer it copies the number
const CAN_CALL = !!window.cmBoot && !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
function cmCopyNum(t) {
  const e = String(t || '').trim();
  if (CAN_CALL) {
    location.href = `tel:${e.replace(/[^\d+]/g, '')}`;
    return;
  }
  try {
    navigator.clipboard
      .writeText(e)
      .then(() => say(`📋 ${e} copied`))
      .catch(() => say(`${e} — copy it by hand`, !0));
  } catch {
    say(`${e} — copy it by hand`, !0);
  }
}
function cmCopyBtn(t) {
  const e = el('button', 'cm-qi tel');
  return (
    (e.type = 'button'),
    (e.innerHTML = ICON_TEL),
    (e.title = `${CAN_CALL ? 'Call' : 'Copy'} ${t}`),
    e.setAttribute('aria-label', `${CAN_CALL ? 'Call' : 'Copy'} ${t}`),
    e.addEventListener('click', (n) => {
      (n.stopPropagation(), cmCopyNum(t));
    }),
    e
  );
}
function cmCallBtn(t) {
  const e = el('button', 'cm-qi tel');
  return ((e.type = 'button'), (e.innerHTML = ICON_TEL), (e.title = t), e.setAttribute('aria-label', t), e);
}
let cmBases = null,
  cmBaseRef = null,
  cmBaseMode = !1,
  cmDotT = null;
function cmBaseKey() {
  return `${dash.params().iso || '--'}|${dash.params().pcity || ''}`;
}
function cmBaseGet() {
  return (cmBases || {})[cmBaseKey()] || null;
}
let cmRecent = [];
function cmSaveStore() {
  try {
    cmBaseRef && cmBaseRef.set({ bases: cmBases || {}, recent: cmRecent });
  } catch {}
}
function cmRecentAdd(t) {
  if (!t) return;
  const e = [t, ...cmRecent.filter((e) => e !== t)].slice(0, 3);
  JSON.stringify(e) !== JSON.stringify(cmRecent) && ((cmRecent = e), cmSaveStore());
}
function cmRecentRows() {
  const t = dash.params().iso,
    e = rowsOf('countries'),
    n = cmRecent
      .filter((x) => x !== t && allowIso(x))
      .map((x) => e.find((c2) => c2.iso === x))
      .filter(Boolean)
      .slice(0, 3);
  return n.length
    ? [
        { group: 'Recent' },
        ...n.map((c2) => ({ icon: flag(c2.iso), label: c2.country, sub: c2.region, act: () => window.cmOpenCountry(c2.iso) })),
      ]
    : [];
}
async function cmBaseLoad() {
  if (cmBases) return cmBases;
  cmBases = {};
  try {
    const t = await (window.claude && window.claude.use ? window.claude.use('db') : null),
      e = await (window.claude && window.claude.use ? window.claude.use('user') : null);
    if (t && e) {
      const n = await e.id();
      if (n) {
        cmBaseRef = t.doc(`data/users/${n}/map_bases`);
        const a = await cmBaseRef.get();
        if (a && a.exists && a.data()) {
          const d2 = a.data();
          (d2.bases && (cmBases = d2.bases), Array.isArray(d2.recent) && (cmRecent = d2.recent.slice(0, 3)));
        }
      }
    }
  } catch {}
  return cmBases;
}
async function cmBaseSet(t) {
  ((cmBases = cmBases || {}), t ? (cmBases[cmBaseKey()] = t) : delete cmBases[cmBaseKey()]);
  try {
    sheetDraw && sheetDraw();
  } catch {}
  try {
    cmBaseRef && (await cmBaseRef.set({ bases: cmBases || {}, recent: cmRecent }));
  } catch {
    say('Saved for this visit only — couldn’t store it', !0);
  }
}
function cmBaseParse(t) {
  const e = String(t || '').trim(),
    n =
      e.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
      e.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ||
      e.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
      e.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!n) return null;
  const a = parseFloat(n[1]),
    o = parseFloat(n[2]);
  return Math.abs(a) <= 90 && Math.abs(o) <= 180 ? { lat: a, lng: o } : null;
}
function cmOrder(t, b) {
  if (t.length < 2) return t.slice();
  const e = t.slice(),
    n = [];
  let c = b;
  if (!c) {
    ((c = e.shift()), n.push(c));
  }
  for (; e.length;) {
    let a = 0,
      o = 1 / 0;
    (e.forEach((x, ix) => {
      const d = hav(c, x);
      d < o && ((o = d), (a = ix));
    }),
      (c = e.splice(a, 1)[0]),
      n.push(c));
  }
  return n;
}
const cmVersion = '2026-10-19g';
window.cmVersion = cmVersion;
function cmNarrow() {
  try {
    return (window.innerWidth || 800) <= 760;
  } catch {
    return !1;
  }
}
function cmKm(t) {
  return t < 1 ? `${Math.round(1e3 * t)} m` : t < 10 ? `${t.toFixed(1)} km` : `${Math.round(t)} km`;
}
let cmChatW = null;
function cmOpenChat(anchor, ev) {
  const rid = ev.rid || dash.params().cid;
  if (!rid || !ev.id) return void say('This chat has no transcript to open', !0);
  const p = dash.params();
  (p.chat_rid !== rid || p.chat_tid !== ev.id) && dash.setParams({ chat_rid: rid, chat_tid: ev.id });
  openSheet(
    anchor,
    `WhatsApp · ${ev.chat_name || 'chat'}`,
    (box) => {
      const d2 = dash.data('chat_transcript');
      if ('error' === d2.status) return void box.append(el('div', 'hint', 'Couldn\u2019t load this chat from NetHunt.'));
      if ('ok' !== d2.status) return void box.append(el('div', 'hint', 'Loading the chat\u2026'));
      const rows = d2.data || [];
      if (!rows.length) return void box.append(el('div', 'hint', 'No messages in this chat.'));
      {
        const mt2 = el('div', 'cm-chatmeta');
        (mt2.append(
          el(
            'span',
            'cm-prog',
            `${rows.length} message${1 === rows.length ? '' : 's'} · ${rows.filter((x) => 'them' === x.who).length} from them`,
          ),
        ),
          box.append(mt2));
      }
      const wrap = el('div', 'cm-chat');
      rows.forEach((msg) => {
        const b2 = el('div', `cm-msg ${'us' === msg.who ? 'me' : 'them'}`);
        (msg.body && b2.append(el('div', 'mb', msg.body)),
          (msg.file || 'photo' === msg.kind || 'document' === msg.kind) &&
            b2.append(el('div', 'mf', `📎 ${msg.file || ('photo' === msg.kind ? 'Photo' : 'Attachment')}`)),
          b2.append(
            el(
              'div',
              'mt',
              msg.time
                ? new Date(msg.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '',
            ),
          ),
          wrap.append(b2));
      });
      box.append(wrap);
    },
    { wide: !0 },
  );
  clearInterval(cmChatW);
  let seen = '',
    tries = 0;
  const mine = sheetFor;
  cmChatW = setInterval(() => {
    if (sheetFor !== mine || sheet.hidden) return void clearInterval(cmChatW);
    const d2 = dash.data('chat_transcript'),
      st = `${d2.status}:${(d2.data || []).length}`;
    (st !== seen &&
      ((seen = st),
      (() => {
        try {
          sheetDraw && sheetDraw();
        } catch {}
      })()),
      ('ok' === d2.status || 'error' === d2.status || (tries += 1) > 40) && clearInterval(cmChatW));
  }, 400);
}
function cmMapsUrl(t) {
  const p = t && t.place && String(t.place.url || '').trim();
  if (p && /^https?:/i.test(p)) return p;
  const q = [t.name, t.city].filter(Boolean).join(' ');
  return t.precise && null != t.lat && null != t.lng
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.lat},${t.lng}`)}`
    : q
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
      : '';
}
function cmOpenUrl(t) {
  if (!t) return;
  try {
    const e = document.createElement('a');
    ((e.href = t), (e.target = '_blank'), (e.rel = 'noopener noreferrer'), document.body.append(e), e.click(), e.remove());
  } catch {}
}
const cmNavKeys = ['view', 'iso', 'isos', 'glabel', 'cid', 'brand', 'ctab', 'csub'];
let cmHist = [],
  cmHi = -1,
  cmNavBusy = !1;
function cmNavSnap() {
  const p = dash.params(),
    o = {};
  return (
    cmNavKeys.forEach((k) => {
      o[k] = void 0 === p[k] ? null : p[k];
    }),
    JSON.stringify(o)
  );
}
function cmNavBtns() {
  const b = qs('.cm-back'),
    f2 = qs('.cm-fwd');
  (b && (b.disabled = cmHi <= 0), f2 && (f2.disabled = cmHi >= cmHist.length - 1));
}
function cmNavTick() {
  let v;
  try {
    v = cmNavSnap();
  } catch {
    return;
  }
  if (cmNavBusy) return ((cmNavBusy = !1), (cmHist[cmHi] = v), void cmNavBtns());
  if (cmHist[cmHi] === v) return void cmNavBtns();
  ((cmHist = cmHist.slice(0, cmHi + 1)),
    cmHist.push(v),
    (cmHi = cmHist.length - 1),
    cmHist.length > 80 && (cmHist.shift(), (cmHi -= 1)),
    cmNavBtns());
}
function cmNavGo(d2) {
  const n = cmHi + d2;
  if (n < 0 || n >= cmHist.length) return;
  ((cmHi = n), (cmNavBusy = !0));
  try {
    dash.setParams(JSON.parse(cmHist[n]));
  } catch {
    cmNavBusy = !1;
  }
  try {
    window.scrollTo({ top: 0 });
  } catch {}
}
// how reachable a person is: numbers, WhatsApp numbers and emails on file
function cmReach(p) { const ph = String(p.phone || '').split(' | ').filter((x) => /\d{5,}/.test(x.replace(/\D/g, ''))); return ph.length + ph.filter(waOk).length + String(p.email || '').split(', ').filter(Boolean).length; }
function cmRank(t) {
  const x = String(t || '').toLowerCase();
  if (!x) return 6;
  if (
    /\b(owner|co-?owner|founder|co-?founder|president|chairman|ceo|propietario|due[n\u00f1]o|fundador|presidente|socio|partner)\b/.test(x)
  )
    return 0;
  if (
    /\b(general manager|managing director|director general|gerente general|gte\.? general|vicepresidente|vice ?president|\bvp\b|\bgm\b|\bmd\b)\b/.test(
      x,
    )
  )
    return 1;
  if (/\b(cto|cfo|coo|cmo|cco|chief)\b/.test(x)) return 2;
  if (/\b(director|directora|head of|jefe|jefa)\b/.test(x)) return 3;
  if (/\b(manager|gerente|supervisor|coordinador|coordinadora|encargad[oa])\b/.test(x)) return 4;
  if (/\b(sales|ventas|comercial|purchas|compras|business)\b/.test(x)) return 5;
  return 6;
}
function cmLogRow(t, e, n) {
  const a = el('div', 'cm-pact'),
    o = el('button', 'cm-btn ghost', '☎ Log a call');
  return (
    (o.type = 'button'),
    o.addEventListener('click', (s) => {
      (s.stopPropagation(), openLogCall(o, t, e, n));
    }),
    a.append(o),
    a
  );
}
function cmLang(t) {
  const x = String(t || '').toLowerCase();
  return /espa|spanish|castell/.test(x)
    ? 'es'
    : /portug/.test(x)
      ? 'pt'
      : /fran|french/.test(x)
        ? 'fr'
        : /t[uü]rk/.test(x)
          ? 'tr'
          : /azer/.test(x)
            ? 'az'
            : /russ|рус/.test(x)
              ? 'ru'
              : 'en';
}
function cmLangName(t) {
  return { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', tr: 'Türkçe', az: 'Azərbaycanca', ru: 'Русский' }[t] || 'English';
}
function cmCatMsg(lg, c) {
  const T = {
    en: {
      su: `${c.brand} — ${c.items} catalogue`,
      body: `Dear ${c.company} team,\n\nPlease find attached our ${c.items} catalogue. We are looking for a distribution partner in ${c.country} and would be glad to hear your comments.\n\nBest regards,\nKavi Kaplan\n${c.brand}`,
    },
    es: {
      su: `${c.brand} — catálogo de ${c.items}`,
      body: `Estimado equipo de ${c.company}:\n\nAdjunto nuestro catálogo de ${c.items}. Buscamos un socio de distribución en ${c.country} y quedo atento a sus comentarios.\n\nSaludos cordiales,\nKavi Kaplan\n${c.brand}`,
    },
    pt: {
      su: `${c.brand} — catálogo de ${c.items}`,
      body: `Prezada equipe da ${c.company},\n\nSegue em anexo o nosso catálogo de ${c.items}. Procuramos um parceiro de distribuição em ${c.country} e fico à disposição para os seus comentários.\n\nAtenciosamente,\nKavi Kaplan\n${c.brand}`,
    },
    fr: {
      su: `${c.brand} — catalogue ${c.items}`,
      body: `Bonjour,\n\nVeuillez trouver ci-joint notre catalogue ${c.items}. Nous recherchons un partenaire de distribution en ${c.country} et je reste à votre disposition pour vos remarques.\n\nCordialement,\nKavi Kaplan\n${c.brand}`,
    },
    tr: {
      su: `${c.brand} — ${c.items} kataloğu`,
      body: `${c.company} ekibine merhaba,\n\n${c.items} kataloğumuzu ekte paylaşıyorum. ${c.country} pazarında bir distribütör arıyoruz; görüşlerinizi almaktan memnuniyet duyarım.\n\nSaygılarımla,\nKavi Kaplan\n${c.brand}`,
    },
    az: {
      su: `${c.brand} — ${c.items} kataloqu`,
      body: `${c.company} komandasına salam,\n\n${c.items} kataloqumuzu əlavədə göndərirəm. ${c.country} üzrə distribütor axtarırıq və rəyinizi eşitməkdən məmnun olarıq.\n\nHörmətlə,\nKavi Kaplan\n${c.brand}`,
    },
    ru: {
      su: `${c.brand} — каталог ${c.items}`,
      body: `Здравствуйте!\n\nНаправляю наш каталог: ${c.items}. Мы ищем партнёра по дистрибуции на вашем рынке и будем рады вашим комментариям.\n\nС уважением,\nKavi Kaplan\n${c.brand}`,
    },
  };
  return T[lg] || T.en;
}
function mapsLink(t, e, n, a, o) {
  const s = o ? rowsOf('maps_places').find((t) => t.id === o) : null,
    r = String(a || (s && s.url) || '').trim(),
    i = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(r),
    c = i
      ? r
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([t, String(e || '').split(/,|\n/)[0], n].filter(Boolean).join(' '))}`,
    d = s && s.rating ? ` · ★ ${s.rating}${s.reviews ? ` (${s.reviews} reviews)` : ''}` : '';
  return iconLink(
    'gmap' + (i ? ' saved' : ''),
    ICON_PIN,
    c,
    i ? `Google Maps: photos, reviews, opening hours${d}` : 'Find on Google Maps (photos & reviews)',
    !0,
  );
}
function socialLinks(t) {
  const e = [],
    n = new Set(),
    a = (t, a, o, s, r) => {
      const i = ((t) => {
        const e = String(t || '').trim();
        return !e || '0' === e || /^not found$/i.test(e) ? null : /^https?:\/\//i.test(e) ? e : `https://${e.replace(/^\/+/, '')}`;
      })(o);
      i && s.test(i) && !n.has(t) && (n.add(t), e.push([t, a, i, r]));
    };
  [t.linkedin, t.facebook, t.instagram, t.twitter, t.website].forEach((t) => {
    (a('li', ICON_LI, t, /linkedin\.com\//i, 'LinkedIn'),
      a('fb', ICON_FB, t, /(facebook|fb)\.com\//i, 'Facebook'),
      a('ig', ICON_IG, t, /instagram\.com\//i, 'Instagram'),
      a('yt', ICON_YT, t, /youtube\.com\/|youtu\.be\//i, 'YouTube'));
  });
  const o = String(t.twitter || '').trim();
  return (
    /^@?\w{2,15}$/.test(o)
      ? a('x', ICON_X, `https://x.com/${o.replace(/^@/, '')}`, /x\.com\//, 'X (Twitter)')
      : a('x', ICON_X, o, /(twitter|x)\.com\//i, 'X (Twitter)'),
    e
  );
}
function contactLine(t, e, { linkedin: n, phones: a, emails: o }) {
  const s = el('div', 'cm-crow2'),
    r = el('div', 't');
  (r.append(el('span', 'nm', t || '(no name)')), e && r.append(el('span', 'sb', e)));
  const c = el('div', 'ic'),
    l = String(n || '').trim();
  return (
    /linkedin\.com|^https?:/i.test(l) && c.append(iconLink('li', ICON_LI, /^https?:/i.test(l) ? l : `https://${l}`, 'Open LinkedIn', !0)),
    (window.__cm3 && window.__cm3.multiPhone ? window.__cm3.multiPhone(c, a.filter(goodPhone)) : 0) ||
    a
      .filter(goodPhone)
      .slice(0, 1)
      .forEach((t) => {
        if ((c.append(cmCopyBtn(t)), isNoWa(t) && window.__cm3 && window.__cm3.waBack && c.append(window.__cm3.waBack(t)), waOk(t))) {
          c.append(iconLink('wa', ICON_WA, waHref(t), `WhatsApp ${t}`, !0));
          const nx = el('button', 'cm-nowa', '✕'); nx.type = 'button'; nx.title = `${t} isn't on WhatsApp — stop showing WhatsApp for it`; nx.setAttribute('aria-label', nx.title);
          nx.addEventListener('click', (ev) => { ev.stopPropagation(); markNoWa(t); nx.previousSibling && nx.previousSibling.remove(); nx.remove(); });
          c.append(nx);
        }
      }),
    o.slice(0, 2).forEach((t) => c.append(iconLink('mail', ICON_MAIL, gmailHref(t), `Email ${t} in Gmail`, !0))),
    s.append(r, c),
    s
  );
}
const firstPara = (t, e) => {
    const n = String(t || '')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    return n
      ? n
          .split(/\n\s*\n/)
          .map((t) => t.trim())
          .filter(Boolean)
      : '';
  },
  clip = (t, e) => {
    const n = String(t || '')
      .replace(/\s+/g, ' ')
      .trim();
    return n.length > e ? `${n.slice(0, e - 1)}…` : n;
  };
function notesNode(t, n, a) { // the Summary pop-up — built by app3 (tiles, AI summary); a plain fallback while it loads
  if (window.__cm3 && window.__cm3.notesNode) return window.__cm3.notesNode(t, n, a, { prep: () => prepBtn(n.id, !0), visit: (b) => openVisitNotes(b, n.id, n.company), due: dueLabel, stage: STAGE });
  const o = el('div', 'cm-note cm-sum'); const p = el('button', 'cm-co', 'Open company →'); p.type = 'button'; p.dataset.openCompany = n.id; o.append(p); return o;
}
function contactChip(t, n, a) {
  const rc0 = a.__rc !== undefined ? a.__rc : a.__id ? realContact(a.__id) : undefined;
  rc0 !== undefined && ((t = rc0 ? rc0.days : null), (n = rc0 ? rc0.time : null));
  const o = el('span', 'cm-lc'),
    s = null == t ? 'never' : t <= 14 ? 'fresh' : t <= 60 ? 'warm' : 'cold';
  o.classList.add(s);
  const r =
      null == t ? 'Never' : t < 0 ? `in ${fmt(-t)} day${-1 === t ? '' : 's'}` : 0 === t ? 'Today' : 1 === t ? '1 day' : `${fmt(t)} days`,
    c =
      null == t
        ? 'Never contacted'
        : t < 0
          ? `Next interaction planned in ${fmt(-t)} day${-1 === t ? '' : 's'} (an upcoming meeting or call)`
          : 0 === t
            ? 'Contacted today'
            : 1 === t
              ? 'Last contact 1 day ago'
              : `Last contact ${fmt(t)} days ago`,
    l = el('span', 'w');
  {
    const ic = rc0 ? { call: ICON_TEL, chat: ICON_WA, email: ICON_MAIL }[rc0.type] : null;
    const hm = rc0 ? new Date(rc0.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    const lbl = rc0 && t <= 1 ? `${0 === t ? 'Today' : 'Yesterday'} ${hm}` : r;
    ic ? (l.innerHTML = ic) : rc0 && 'meeting' === rc0.type ? l.append('📅 ') : (l.innerHTML = ICON_CLOCK);
    l.append(lbl);
    rc0 && (l.title = `${{ call: 'Call', chat: 'WhatsApp', email: 'Email', meeting: 'Meeting' }[rc0.type] || 'Contact'}${'in' === rc0.dir ? ' from them' : ''} · ${new Date(rc0.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
    o.append(l);
  }
  const d = Number(a.emails_total) || 0,
    p = Number(a.calls_total) || 0,
    u = el('span', 'n');
  return (
    (u.innerHTML = ICON_CHAT),
    u.append(fmt(d + p)),
    o.append(u),
    (o.title = `${c} · ${fmt(d + p)} interactions (emails and calls)`),
    hoverList(o, () => {
      const t = el('div', 'cm-note'),
        o = (t) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
      {
        const lt2 = a.__id ? lastTouch(a.__id) : null,
          ti = (x) => {
            const z = String(x || '').toLowerCase();
            return /call/.test(z)
              ? '☎'
              : /mail/.test(z)
                ? '✉'
                : /meet|calendar|event/.test(z)
                  ? '📅'
                  : /whats|chat|messag/.test(z)
                    ? '💬'
                    : /note|comment/.test(z)
                      ? '📝'
                      : /linkedin/.test(z)
                        ? '🔗'
                        : '•';
          };
        (t.append(el('div', 'k', c)),
          t.append(
            el(
              'p',
              null,
              lt2
                ? `${ti(lt2.type)} ${lt2.type}${lt2.who ? ` by ${lt2.who}` : ''}${lt2.when ? ` · ${lt2.when}` : ''}${n ? ` · ${o(n)}` : ''}`
                : `Last interaction: ${o(n)}`,
            ),
          ));
      }
      (t.append(el('div', 'k', `${fmt(d + p)} logged interactions`)),
        t.append(
          el(
            'p',
            null,
            `✉ ${fmt(d)} emails${null != a.emails_sent ? ` (${fmt(a.emails_sent)} sent${a.email_opens ? `, opened ${fmt(a.email_opens)}×` : ''})` : ''}`,
          ),
        ),
        t.append(el('p', null, `☎ ${fmt(p)} calls${a.last_call ? ` · last ${o(a.last_call)}` : ''}`)));
      return (
        t.append(el('p', 'mut', 'Green = within 2 weeks · amber = within 2 months · red = longer')),
        { title: 'Contact history', node: t }
      );
    }),
    o
  );
}
function meetingTag(t) {
  const e = (function (t) {
    const e = dash.data('meetings');
    return 'ok' === e.status ? e.data.filter((e) => e.company_id === t) : [];
  })(t);
  if (!e.length) return null;
  const now0 = Date.now() - 36e5, ts = (x) => (x.start ? +new Date(x.start) : 0); // the next scheduled meeting first, then the most recent past one
  e.sort((x, y) => { const ux = ts(x) >= now0, uy = ts(y) >= now0; return ux !== uy ? (ux ? -1 : 1) : ux ? ts(x) - ts(y) : ts(y) - ts(x); });
  const n = e.find((t) => 'set' === t.status && ts(t) >= now0),
    a = n || e[0],
    o = a.start ? new Date(a.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
    s = el('button', `cm-mtag ${a.status}`, `📅 ${'set' === a.status ? 'Meeting set' : 'Proposed'} · ${o}`);
  return (
    (s.type = 'button'),
    mark(s, 'meetings', 'status', `key=${enc(a.key)}`),
    hoverList(s, () => {
      const t = el('div', 'cm-note');
      return (
        e.forEach((e) => {
          const n = e.start ? new Date(e.start) : null;
          if (
            (t.append(
              el(
                'div',
                'k',
                `${'set' === e.status ? '✅ Meeting set' : '🕓 Proposed, not confirmed'} — ${n ? n.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}`,
              ),
            ),
            t.append(el('p', null, e.summary)),
            e.location && t.append(el('p', 'mut', `📍 ${e.location}`)),
            t.append(el('p', 'mut', `Matched by ${e.matched_by}`)),
            safeHref(e.link))
          ) {
            const n = el('a', 'cm-co', 'Open in Google Calendar ↗');
            ((n.href = safeHref(e.link)), (n.target = '_blank'), (n.rel = 'noopener noreferrer'), t.append(n));
          }
        }),
        { title: 'Calendar', node: t }
      );
    }),
    s
  );
}


// ---- ortho check per company: set the category and tick where you saw ortho products ----
const ORTHO_SOURCES = ['Website', 'Google Maps', 'LinkedIn', 'Instagram', 'Facebook', 'WhatsApp profile', 'Visit or call'];
const QUICK_CATS = ['Ortho', 'Not Ortho', 'Ortho Manufacturer', 'Hospital/Clinic/Doctor', 'Dental', 'Cardio', 'Unqualified Medical Expo'];
function openOrthoEditor(anchor, row) {
  const co = rowsOf('companies').find((c) => c.id === row.id) || {};
  let cat = co.category || ''; const seen = new Set(String(co.ortho_sources || '').split('|').filter(Boolean));
  openSheet(anchor, `Ortho check · ${row.company}`, (body) => {
    body.append(el('div', 'hint', row.ortho_why || ''));
    body.append(el('div', 'k', 'Category'));
    const cr = el('div', 'cm-chips');
    QUICK_CATS.forEach((c) => { const b = el('button', 'cm-chip', c); b.type = 'button'; b.setAttribute('aria-pressed', String(c === cat));
      b.addEventListener('click', async () => { try { await nhCall('update_record', { folderId: NH_FOLDER, recordId: row.id, fieldKeys: 'label', fields: { Category: c } }); cat = c; say(`✓ ${row.company}: ${c}`); dash.refresh('companies'); sheetDraw(); } catch (e) { say(`Not saved — ${nhErr(e)}`, true); } });
      cr.append(b); });
    body.append(cr);
    body.append(el('div', 'k', 'Where did you see orthopaedic products?'));
    const sr = el('div', 'cm-chips');
    ORTHO_SOURCES.forEach((s) => { const b = el('button', 'cm-chip', `${seen.has(s) ? '✓ ' : ''}${s}`); b.type = 'button'; b.setAttribute('aria-pressed', String(seen.has(s)));
      b.addEventListener('click', async () => { const next = new Set(seen); next.has(s) ? next.delete(s) : next.add(s);
        try { await nhCall('update_record', { folderId: NH_FOLDER, recordId: row.id, fieldKeys: 'label', fields: { 'Ortho evidence': [...next] } }); seen.clear(); next.forEach((x) => seen.add(x)); say('✓ Saved — score updates in a moment'); dash.refresh('companies'); sheetDraw(); } catch (e) { say(`Not saved — ${nhErr(e)}`, true); } });
      sr.append(b); });
    body.append(sr);
    const links = el('div', 'cm-chips'); const add = (lbl, u) => { if (!safeHref(u)) return; const l = el('a', 'cm-chip', `${lbl} ↗`); l.href = safeHref(u); l.target = '_blank'; l.rel = 'noopener noreferrer'; links.append(l); };
    const norm2 = (u) => (u && !/^https?:/i.test(u) ? `https://${String(u).replace(/^\/+/, '')}` : u);
    add('Website', norm2(co.website)); add('Google Maps', co.google_maps); add('LinkedIn', norm2(co.linkedin)); add('Instagram', norm2(co.instagram)); add('Facebook', norm2(co.facebook));
    if (links.childNodes.length) { body.append(el('div', 'k', 'Check them')); body.append(links); }
    body.append(el('p', 'mut', 'Each place where you saw ortho products adds to the ortho part of the score (1 place = 15 of 25 points, +5 each more). “Not Ortho” sets it to 0.'));
  }, { static: true });
}

// ---- real contact (calls, WhatsApp, individual emails, meetings) and "they're waiting for you" ----
let rcCache = { src: null, map: new Map() };
function realContact(id) {
  const d = dash.data('contact_history'); if (d.status !== 'ok') return undefined; // undefined = not loaded yet
  if (rcCache.src !== d.data || rcCache.len !== d.data.length) {
    const m = new Map(), st = new Map(), t14 = new Date(Date.now() - 14 * 864e5).toISOString();
    d.data.forEach((e) => { const cur = m.get(e.record_id); if (!cur || e.time > cur.time) m.set(e.record_id, e);
      const s = st.get(e.record_id) || { n: 0, n14: 0, in: 0, in14: 0 }; s.n++; if ('in' === e.dir) s.in++; if (e.time >= t14) { s.n14++; if ('in' === e.dir) s.in14++; } st.set(e.record_id, s); });
    rcCache = { src: d.data, len: d.data.length, map: m, stats: st };
  }
  const e = rcCache.map.get(id); if (!e) return null;
  const ms = Date.now() - new Date(e.time); const days = Math.max(0, Math.floor(ms / 864e5));
  const ago = ms < 3600e3 ? `${Math.max(1, Math.round(ms / 60e3))} min` : ms < 864e5 ? `${Math.round(ms / 3600e3)}h` : `${days} day${days === 1 ? '' : 's'}`;
  return { ...e, days, ago, pending: e.dir === 'in' && days <= 30 };
}

function convStats(id) { realContact(id); return (rcCache.stats && rcCache.stats.get(id)) || { n: 0, n14: 0, in: 0, in14: 0 }; }
function nextMeetingAt(id) { const mt = dash.data('meetings'); if ('ok' !== mt.status) return null; const now = Date.now() - 36e5; const xs = mt.data.filter((m) => m.company_id === id && m.start && new Date(m.start) >= now).map((m) => +new Date(m.start)); return xs.length ? Math.min(...xs) : null; }
function hasMeetingSet(id) { const mt = dash.data('meetings'); return 'ok' === mt.status && mt.data.some((m) => m.company_id === id && 'set' === m.status && (!m.start || new Date(m.start) >= new Date(Date.now() - 864e5))); }
// 🔥 momentum: real two-way conversation lately (or a meeting coming up)
function hotReason(id) { const s = convStats(id); if (hasMeetingSet(id)) return 'meeting set'; if (s.in14 >= 1 && s.n14 >= 2) return `${s.n14} conversations in 2 weeks, they replied`; if (s.n14 >= 3) return `${s.n14} conversations in 2 weeks`; return null; }
// status the CRM should probably have now (replied / meeting) — shown as a one-tap suggestion, saved to NetHunt
const EARLY = /^(un ?processed|to be qualified|lead|enriched( leads)?|exploring market entry|contacted( linkedin)?|contact \d|called|no response|drip.*|awaiting response|target|need action to qualify|queued for bulk|)$/i;
function suggestStatus(id, k, cur) {
  const c = String(cur || '').trim(); const meeting = hasMeetingSet(id); const s = convStats(id);
  if (meeting && 'motion' !== k && (EARLY.test(c) || /^(replied|interested|follow up)$/i.test(c))) return 'Meeting';
  if (s.in > 0 && EARLY.test(c)) return 'motion' === k ? 'Replied / Engaged' : 'Replied';
  return null;
}
function statusSuggestBtn(id, company, k, cur) {
  const sg = suggestStatus(id, k, cur); if (!sg) return null;
  const b = el('button', 'cm-sugg', `→ ${sg}?`); b.type = 'button'; b.title = `${'Meeting' === sg ? 'A meeting is in your calendar' : 'They replied'} — tap to set ${OURS[k].label} status to “${sg}” in NetHunt`;
  b.addEventListener('click', async (ev) => { ev.stopPropagation(); b.disabled = !0; b.textContent = 'Saving…'; try { await nhCall('update_record', { folderId: NH_FOLDER, recordId: id, fieldKeys: 'label', fields: { [STATUS_FIELD[k]]: sg } }); say(`✓ ${company}: ${OURS[k].label} → ${sg}`); dash.refresh('companies'); } catch (e) { say(`Not saved — ${nhErr(e)}`, !0); b.disabled = !1; b.textContent = `→ ${sg}?`; } });
  return b;
}
// ---- visit notes → fields: next step, follow-up date, people, brands, status (you check before saving) ----
function parseVisitNotes(text, brandNames) {
  const t = String(text || ''); const low = t.toLowerCase(); const out = { emails: [...new Set(t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])], phones: [...new Set((t.match(/\+?\d[\d\s().-]{7,}\d/g) || []).map((x) => x.trim()))] };
  const sent = t.split(/(?<=[.!?\n])\s+/).map((s) => s.trim()).filter(Boolean);
  out.next = (sent.find((s) => /\b(next|send|enviar|mandar|follow ?up|seguimiento|call back|llamar|visit|visitar|quote|cotizaci[oó]n|price list|lista de precios|samples?|muestras?)\b/i.test(s)) || '').slice(0, 160);
  const now = new Date(); const day = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
  const wd = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5 };
  let due = null;
  if (/\b(tomorrow|mañana|manana)\b/.test(low)) due = day(1); else if (/\bnext week|pr[oó]xima semana|semana que viene\b/.test(low)) due = day(7);
  else { const m = low.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/); if (m) { const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : now.getFullYear(); due = new Date(y, +m[2] - 1, +m[1]); if (due < now) due.setFullYear(due.getFullYear() + 1); }
    else for (const [w, n] of Object.entries(wd)) if (new RegExp(`\\b${w}\\b`).test(low)) { const d = day(1); while (d.getDay() !== n) d.setDate(d.getDate() + 1); due = d; break; } }
  if (!due && out.next) due = day(5);
  out.due = due ? new Date(Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())) : null;
  out.brands = brandNames.filter((b) => b.length > 3 && new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(t)).slice(0, 8);
  out.people = []; for (const m of t.matchAll(/(?:[Mm]et|[Ss]poke (?:to|with)|[Cc]on|[Rr]euni[oó]n con|[Hh]abl[eé] con)\s+(?:(?:Mr|Mrs|Ms|Dr|Ing|Sr|Sra|Lic)\.?\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})(?:\s*\(([^)]{2,40})\)|,\s*([A-Za-záéíóúñ ]{3,40}?)(?=[.,;\n]|$))?/g)) out.people.push({ name: m[1], title: (m[2] || m[3] || '').trim() });
  out.status = /\bnot interested|no (les )?interesa|no est[aá]n interesados\b/i.test(t) ? 'Not interested' : /\b(meeting|reuni[oó]n) (set|booked|agendada|programada)\b/i.test(t) ? 'Meeting' : /\b(interested|interesad[oa]s?)\b/i.test(t) ? 'Interested' : null;
  return out;
}
function openVisitNotes(anchor, id, company) {
  const k = oursKey(); const key = OURS[k].all ? 'next' : k; let parsed = null;
  openSheet(anchor, `Visit notes · ${company}`, (body) => {
    const ta = el('textarea'); ta.placeholder = 'What happened? e.g. “Met Rafael González (gerente). Interested in IM nails, carry Stryker. Send price list and samples. Call back Thursday.”'; ta.style.minHeight = '7rem';
    const res = el('div', 'cm-vn'); const go = el('button', 'cm-btn', 'Read my notes'); go.type = 'button';
    go.addEventListener('click', () => {
      const brands = rowsOf('brand_profiles').map((b) => b.brand).filter(Boolean); parsed = parseVisitNotes(ta.value, brands); res.replaceChildren();
      const opt = (label, val, on = !0) => { const l = el('label', 'cm-check'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = on; l.append(cb, ` ${label}: `, el('b', null, val)); res.append(l); return cb; };
      parsed.cb = {};
      if (parsed.next) parsed.cb.next = opt('Next step', parsed.next);
      if (parsed.due) parsed.cb.due = opt('Follow-up', parsed.due.toISOString().slice(0, 10));
      if (parsed.status) parsed.cb.status = opt(`${OURS[key].label} status`, parsed.status);
      parsed.brands.forEach((b) => { parsed.cb[`b:${b}`] = opt('Brand they carry', b); });
      parsed.people.forEach((p, i) => { parsed.cb[`p:${i}`] = opt('New contact', `${p.name}${p.title ? ` (${p.title})` : ''}${i === 0 && parsed.emails[0] ? ` · ${parsed.emails[0]}` : ''}${i === 0 && parsed.phones[0] ? ` · ${parsed.phones[0]}` : ''}`); });
      res.append(el('p', 'mut', 'The full text is saved as a comment. Untick anything that isn’t right.'));
      save.hidden = !1;
    });
    const save = el('button', 'cm-btn', 'Save to NetHunt'); save.type = 'button'; save.hidden = !0;
    save.addEventListener('click', async () => {
      if (!parsed) return; save.disabled = !0; save.textContent = 'Saving…';
      try {
        await nhCall('create_record_comment', { folderId: NH_FOLDER, recordId: id, text: `Visit notes (${new Date().toLocaleDateString('en-GB')}): ${ta.value.trim()}` });
        const f = {};
        if (parsed.cb.next && parsed.cb.next.checked) f['Next step'] = parsed.next;
        if (parsed.cb.due && parsed.cb.due.checked) f['Next follow-up'] = parsed.due.getTime();
        if (parsed.cb.status && parsed.cb.status.checked) f[STATUS_FIELD[key]] = parsed.status;
        const nb = parsed.brands.filter((b) => parsed.cb[`b:${b}`] && parsed.cb[`b:${b}`].checked);
        if (nb.length) { const cur = (rowsOf('companies').find((c) => c.id === id) || {}).brands || ''; f.Brand = [...new Set([...String(cur).split('\n').map((x) => x.trim()).filter(Boolean), ...nb])]; }
        if (Object.keys(f).length) await nhCall('update_record', { folderId: NH_FOLDER, recordId: id, fieldKeys: 'label', fields: f });
        for (const [i, p] of parsed.people.entries()) { if (!(parsed.cb[`p:${i}`] && parsed.cb[`p:${i}`].checked)) continue; const w = p.name.split(/\s+/);
          const cf = { Name: p.name, 'First name': w[0], 'Last name': w.slice(1).join(' ') || undefined, Title: p.title || undefined, Company: [id], Email: i === 0 && parsed.emails[0] ? [parsed.emails[0]] : undefined, 'Phone number': i === 0 && parsed.phones[0] ? [parsed.phones[0]] : undefined };
          await nhCall('create_record', { folderId: '6682e9b8b6386800f586c0b0', fieldKeys: 'label', fields: Object.fromEntries(Object.entries(cf).filter(([, v]) => v != null)) }); }
        say('✓ Visit saved to NetHunt'); dash.refresh('companies'); closeSheet();
      } catch (e) { say(`Not saved — ${nhErr(e)}`, !0); save.disabled = !1; save.textContent = 'Save to NetHunt'; }
    });
    const row = el('div', 'row'); row.append(go, save); body.append(ta, micBar(ta), row, res); setTimeout(() => ta.focus(), 0);
  }, { static: !0 });
}
// business card text (iPhone: open the photo, press and hold the text → Copy) → contact fields
function parseCard(text) {
  const lines = String(text || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [''])[0]; const phones = (text.match(/\+?\d[\d\s().-]{7,}\d/g) || []).map((x) => x.trim());
  const li = (text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+/i) || [''])[0];
  const isTitle = (s) => /\b(gerente|director|manager|ceo|cfo|coo|founder|owner|presidente?|jefe|head|coordinador|coordinator|ventas|sales|comercial|import|compras|purchas|ingeniero|ing\.|engineer|representante|asesor|export|marketing|general)\b/i.test(s);
  const plain = lines.filter((s) => !/@|\d{3}|www\.|https?:|\.com|\.ec|\.pe|\.cl/i.test(s) && !/\b(s\.?\s?a\.?(\s?c)?|ltda|c[ií]a|sac|sas|inc|llc|ltd|gmbh|group|grupo|medical|m[eé]dica|corp|import\w*|distrib\w*)\b/i.test(s));
  const name = plain.find((s) => !isTitle(s) && /^[A-ZÁÉÍÓÚÑ][\p{L}'.-]+(\s+[\p{L}'.-]+){1,3}$/u.test(s)) || plain[0] || '';
  const title = lines.find((s) => s !== name && isTitle(s)) || '';
  return { name, title, email, phone: phones[0] || '', linkedin: li };
}


function openCompare3(anchor, p) {
  const city = dash.params().pcity; const ticked = selIds.size >= 2 ? rowsOf('partners').filter((t) => selIds.has(t.id)).slice(0, 4) : null;
  const rows = ticked || rowsOf('partners').filter((t) => (!city || norm(String(t.city || '').split(',')[0].trim()) === norm(city)) && t.ortho_verdict !== 'not_ortho').sort((x, y) => (y[`score_${p}`] || 0) - (x[`score_${p}`] || 0)).slice(0, 3);
  const where = city || (multiIsos() ? dash.params().glabel || 'these countries' : (countryOfIso(dash.params().iso) || {}).country || 'this country');
  openSheet(anchor, ticked ? `Comparing ${rows.length} companies` : `Top 3 in ${where}`, (body) => {
    if (!rows.length) { body.append(el('div', 'hint', 'No scored ortho companies here yet.')); return; }
    const tw = (id) => d3.sum(rowsOf('tender_awards').filter((t) => t.nethunt_id === id), (t) => t.value_usd || 0);
    const regs = (id) => rowsOf('registrations').filter((r) => r.nethunt_id === id).length;
    const lines = [
      ['Score', (r) => r[`score_${p}`]], ['Ortho evidence', (r) => ({ ortho: '✓ confirmed', not_ortho: '⚠ not ortho' }[r.ortho_verdict] || 'unsure')],
      ['Status with us', (r) => r[`status_${p}`] || r.status_all || '—'], ['Ortho brands they carry', (r) => r[`seg_brands_${p}`] || 0], ['Imports (trade data)', (r) => (r.import_value_usd ? money(r.import_value_usd) : '—')],
      ['Public tender wins', (r) => (tw(r.id) ? money(tw(r.id)) : '—')], ['Registrations held', (r) => regs(r.id) || '—'],
      ['Conversations (90 days)', (r) => { const s = convStats(r.id); return s.n ? `${s.n} · ${s.in} from them` : 'none'; }], ['Last real contact', (r) => { const rc = realContact(r.id); return rc ? `${rc.ago} ago (${rc.type})` : rc === null ? 'never' : '…'; }],
      ['Meeting', (r) => (hasMeetingSet(r.id) ? '📅 set' : '—')],
    ];
    const wrap = el('div', 'cm-tablewrap'); const tb = el('table', 'cm-cmp3'); const hd = el('tr'); hd.append(el('th', null, ''));
    rows.forEach((r) => { const th = el('th'); const b = el('button', 'cm-co', r.company); b.type = 'button'; b.dataset.openCompany = r.id; th.append(b); hd.append(th); });
    tb.append(hd); lines.forEach(([lbl, f]) => { const tr = el('tr'); tr.append(el('td', 'mut', lbl)); rows.forEach((r) => tr.append(el('td', null, String(f(r))))); tb.append(tr); });
    wrap.append(tb); body.append(wrap);
  }, { wide: !0 });
}

function replyLink(rc, co) {
  if (rc.type === 'chat' && rc.chat_number) return { href: `https://wa.me/${digits(rc.chat_number)}`, label: 'Reply on WhatsApp' };
  if (rc.type === 'email' && rc.by_email) return { href: gmailHref(rc.by_email), label: 'Reply by email' };
  return null;
}
// a person's name filed as a company (no company words, 2–5 plain name words)
function isPerson(name) {
  const s = String(name || '').trim();
  if (/\b(s\.?\s?a\.?\s?c?|sas|ltda|cia|c[ií]a|sac|eirl|spa|srl|inc|llc|ltd|corp|group|grupo|medical|med|medic|salud|health|ortho|orto|trauma|import|imp|export|distrib|comercial|comercializadora|droguer|farma|pharma|clinic|cl[ií]nica|hospital|centro|center|tech|solutions|servicios|services|global|international|internacional|surgical|quir|equipos|insumos|dental|lab|sociedad|empresa|holding|trading|industr|\d)/i.test(s)) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (/\b(chile|per[uú]|ecuador|colombia|guatemala|panam[aá]|m[eé]xico|argentina|brasil|bolivia|venezuela|uruguay|paraguay|latam|america|andina)\b/i.test(s)) return false;
  return words.length >= 3 && words.length <= 5 && words.every((w) => /^[A-Za-zÀ-ÿÑñ'.-]+$/.test(w)); // e.g. ESTUPIÑAN ENRIQUEZ MARIA FERNANDA
}
// "Near me": your phone's position (or the hotel you set on the map)
let nearPos = null;
function companyPoint(id, city) {
  const mp = rowsOf('map_points'); const ex = mp.find((p) => p.kind === 'company' && p.id === id); if (ex) return [ex.lat, ex.lng, true];
  const ctry = (countryOfIso(dash.params().iso) || {}).country; const c = mp.find((p) => p.kind === 'city' && p.country === ctry && norm(p.city) === norm(String(city || '').split(',')[0].trim()));
  return c ? [c.lat, c.lng, false] : null;
}
function kmBetween(a, b) { const R = 6371; const r = Math.PI / 180; const x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function askNearMe() {
  if (!navigator.geolocation) { say('Location isn’t available here — open the dashboard on your phone (website) to sort by distance.', true); return; }
  say('Finding where you are…');
  navigator.geolocation.getCurrentPosition((p) => { nearPos = [p.coords.latitude, p.coords.longitude]; dash.setParams({ psort: 'near' }); drawPartners(); say('Sorted by distance from you'); },
    () => { say('Location blocked — allow location for this site (on the website), or set your hotel on the 🗺 Map.', true); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}
// one clear next step per company
function nextAction(o, rc, phones, emails, ctx) {
  const wa = phones.find(waOk);
  if (rc && rc.pending) { const r = replyLink(rc); if (r) return { label: '↩ Reply', title: `${r.label} — they wrote ${rc.ago} ago`, href: r.href, hot: true }; }
  const stage = Math.max(o.stage_all || 0, o.stage_next || 0, o.stage_dunitech || 0, o.stage_motion || 0);
  if (!rc) { // never really spoken
    if (wa) return { label: '💬 Intro', title: 'Send the intro on WhatsApp (message ready)', href: `${waHref(wa)}?text=${encodeURIComponent(tplText('wa', ctx))}` };
    if (phones.length) return { label: '☎ Call', title: `Call ${phones[0]}`, call: phones[0] };
    if (emails.length) { const [su, bo] = tplText('intro', ctx); return { label: '✉ Intro', title: 'Send the intro email (draft ready)', href: `${gmailHref(emails[0])}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(bo)}` }; }
    return null;
  }
  const mt = dash.data('meetings'); const hasMeeting = 'ok' === mt.status && mt.data.some((m) => m.company_id === o.id && (!m.start || new Date(m.start) >= new Date(Date.now() - 864e5)));
  if (hasMeeting) return null; // meeting already in the calendar
  const kind = stage >= 4 ? 'meeting' : 'followup';
  if (wa) { const txt = kind === 'meeting' ? (ctx.es ? `Hola, soy Kavi Kaplan de ${ctx.brand}. ¿Podríamos agendar una reunión breve (en línea o presencial) esta semana o la próxima?` : `Hello, this is Kavi Kaplan from ${ctx.brand}. Could we schedule a short meeting (online or in person) this week or next?`) : (ctx.es ? `Hola, soy Kavi Kaplan de ${ctx.brand}. Le escribo para dar seguimiento a nuestro contacto. ¿Tiene unos minutos esta semana?` : `Hello, this is Kavi Kaplan from ${ctx.brand}, following up on our last contact. Do you have a few minutes this week?`);
    return { label: kind === 'meeting' ? '📅 Book meeting' : '↻ Follow up', title: `${kind === 'meeting' ? 'Ask for a meeting' : 'Follow up'} on WhatsApp (message ready)`, href: `${waHref(wa)}?text=${encodeURIComponent(txt)}` }; }
  if (emails.length) { const [su, bo] = tplText(kind, ctx); return { label: kind === 'meeting' ? '📅 Book meeting' : '↻ Follow up', title: 'Email (draft ready)', href: `${gmailHref(emails[0])}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(bo)}` }; }
  if (phones.length) return { label: '☎ Call', title: `Call ${phones[0]}`, call: phones[0] };
  return null;
}



// open this company in NetHunt (its web-app link: workspace + folder + record, base64 JSON)
let nhUrlPattern = '';
const NH_WORKSPACE = '6682e9b7b6386800f586c0a4';
const NH_ICON = window.cmBoot ? 'img/nethunt.png' : '/_blob/0c62dff4b8bf4e3202cc5dc168a1de5c';
// whoever is logged in: on the website, the email Cloudflare Access verified; inside Claude, the dashboard owner
let nhUser = 'hi@kavikaplan.com';
if (window.cmBoot) fetch('/api/me', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && /@/.test(j.email || '')) nhUser = j.email; }).catch(() => {});
function nethuntUrl(id, folder = NH_FOLDER) {
  const st = btoa(JSON.stringify({ workspaceId: NH_WORKSPACE, folderId: folder, recordId: id, recordPage: { recordId: id } }));
  return `https://nethunt.com/web/?u=${btoa(nhUser)}#nethunt/${st}`;
}
function nethuntLink(id, name) {
  const b = el('a', 'cm-nhlink'); b.href = nethuntUrl(id); b.target = '_blank'; b.rel = 'noopener noreferrer';
  b.addEventListener('click', () => { b.href = nethuntUrl(id); }); // use the logged-in user at the moment of the click
  b.title = 'Open in NetHunt'; b.setAttribute('aria-label', `Open ${name || 'company'} in NetHunt`);
  const im = el('img'); im.src = NH_ICON; im.alt = ''; im.width = 22; im.height = 22; b.append(im);
  return b;
}
// email popover: every address listed; tick "all" and the drafts go to everyone at once
function emailPanel(ctx, emails) {
  const list = [...new Set(emails.map((e) => String(e || '').trim()).filter((e) => /@/.test(e)))];
  const box = el('div'); let all = false;
  const draw = () => {
    box.replaceChildren();
    if (list.length > 1) {
      const lb = el('label', 'cm-check'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = all;
      cb.addEventListener('change', () => { all = cb.checked; draw(); });
      lb.append(cb, ` Send to all ${list.length} addresses`); box.append(lb);
    }
    list.forEach((e) => box.append(contactLine(e, '', { phones: [], emails: [e] })));
    box.append(templateBar(ctx, all ? list.join(',') : list[0], 'email'));
  };
  draw();
  return box;
}

document.addEventListener('click', (e) => {
  const l = e.target.closest('a[href^="https://mail.google.com/mail/?view=cm"]');
  if (!l || !window.cmBoot || !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) return;
  const q = new URLSearchParams(l.href.split('?')[1]); e.preventDefault();
  location.href = `googlegmail:///co?to=${encodeURIComponent(q.get('to') || '')}&subject=${encodeURIComponent(q.get('su') || '')}&body=${encodeURIComponent(q.get('body') || '')}`;
}, !0);
document.addEventListener('click', (e) => { const b = e.target.closest('.cm-phtop'); b && window.__cm2 && window.__cm2.openPowerHour(b); });
function drawPartners() {
  dash.data('contact_history'); // ask for real-contact history up front so it loads alongside the list
  const n = qs('.cm-partners'),
    o = dash.data('partners'),
    p = oursKey(),
    u = OURS[p],
    m = dash.params(),
    h = 'list' === m.csub ? 'list' : 'partners',
    y = qs('.cm-csubtabs'),
    b = 'ok' === dash.data('companies').status ? dash.data('companies').data.length : null;
  (y.replaceChildren(
    ...[
      ['partners', 'Best partners to call'],
      ['list', 'List' + (null != b ? ` · ${fmt(b)}` : '')],
    ].map(([t, e]) => {
      const n = el('button', 'cm-chip', e);
      return (
        (n.type = 'button'),
        n.setAttribute('aria-pressed', String(h === t)),
        n.addEventListener('click', () => {
          (dash.setParams({ csub: t }), dash.setLink('list' === t ? 'companies' : 'partners'));
        }),
        n
      );
    }),
  ),
    qs('#partners').classList.toggle('cm-hidden', 'partners' !== h),
    qs('#companies').classList.toggle('cm-hidden', 'list' !== h),
    (qs('.cm-partners-hint').textContent = ''),
    (qs('.cm-partners-hint').hidden = !0));
  const v = 'fit' === m.pfit ? 'fit' : 'all',
    $ = qs('.cm-ptools'),
    k = el('button', 'cm-chip cm-pours');
  if (
    ((k.type = 'button'),
    k.setAttribute('aria-haspopup', 'menu'),
    k.setAttribute('aria-pressed', 'true'),
    k.replaceChildren(cmNarrow() && LOGO[p] ? logoImg(p) : withLogo(p, u.label)),
    (k.title = `Viewing as ${u.label}`),
    k.setAttribute('aria-label', `Viewing as ${u.label}`),
    k.append(el('span', 'cm-caret', '▾')),
    k.addEventListener('click', () => oursMenu(k)),
    (() => {
      const fitLbl = `Carries ${(u.segName || u.seg).toLowerCase()}`,
        fb = el('button', 'cm-chip cm-pfit');
      ((fb.type = 'button'),
        fb.setAttribute('aria-haspopup', 'menu'),
        fb.setAttribute('aria-pressed', String('fit' === v)),
        fb.replaceChildren('all' === v ? 'Any company' : fitLbl),
        fb.append(el('span', 'cm-caret', '▾')),
        (fb.title = 'Which companies to list'),
        fb.addEventListener('click', () =>
          openMenu(fb, [
            { label: 'Any company', sub: 'everything scored here', on: 'all' === v, act: () => dash.setParams({ pfit: 'all' }) },
            {
              label: fitLbl,
              sub: 'only companies already carrying these brands',
              on: 'fit' === v,
              act: () => dash.setParams({ pfit: 'fit' }),
            },
            { icon: '👤', label: dash.params().phide ? 'Show people again' : 'Hide people', sub: 'rows that are a person’s name, not a company', on: !!dash.params().phide, act: () => dash.setParams({ phide: dash.params().phide ? null : 1 }) },
          ]),
        ),
        $.replaceChildren(k, fb));
    })(),
    u.all)
  ) {
    const t = ['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'best',
      e = el('button', 'cm-chip cm-pstat');
    ((e.type = 'button'),
      e.setAttribute('aria-haspopup', 'menu'),
      e.replaceChildren(
        cmNarrow() ? '' : 'Status shown: ',
        cmNarrow() && LOGO[t]
          ? logoImg(t)
          : withLogo(t, { best: 'Furthest stage', dunitech: 'Dunitech', next: 'Next Shoulder', motion: 'Motion Medical' }[t]),
      ),
      e.append(el('span', 'cm-caret', '▾')),
      e.addEventListener('click', () =>
        openMenu(
          e,
          [
            ['best', '⭐', 'Furthest stage', 'whichever company is furthest'],
            ['dunitech', '', 'Dunitech', 'Status'],
            ['next', '', 'Next Shoulder', 'NEXT Status'],
            ['motion', '⚙️', 'Motion Medical', 'Motion Status'],
          ].map(([e, n, a, o]) => ({ icon: n, logo: e, label: a, sub: o, on: e === t, act: () => dash.setParams({ pstat: e }) })),
        ),
      ),
      $.append(e));
  }
  if ((n.classList.toggle('dash-skeleton', 'loading' === o.status), 'error' === o.status)) return failLine(n);
  n.replaceChildren();
  { const ntg = (p === 'next') && window.__cm2 && window.__cm2.nextTag && window.__cm2.nextTag(dash.params().iso); ntg && n.append(ntg); }
  const C = ['score', 'recent', 'near', 'meeting', 'next'].includes(dash.params().psort) && (dash.params().psort !== 'near' || nearPos) ? dash.params().psort : ['score', 'recent'].includes(dash.params().psort) ? dash.params().psort : dash.params().psort === 'status' || (window.__cm2 && window.__cm2.isHouse()) ? 'status' : 'next', // People open in Power hour order; House keeps Status
    x = ['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'best',
    E = (t) => (u.all ? ('best' === x ? t.stage_all : t[`stage_${x}`]) : t[`stage_${p}`]) || 0,
    S = (t) => String((u.all ? ('best' === x ? '' : t[`status_${x}`]) : t[`status_${p}`]) || ''),
    L = el('button', 'cm-chip cm-psort');
  ((L.type = 'button'),
    L.setAttribute('aria-haspopup', 'menu'),
    (L.textContent = `Sort: ${{ score: 'Score', status: 'Status', recent: 'Last contacted', near: 'Near me', meeting: 'Next meeting', next: 'Do next' }[C]}`),
    L.append(el('span', 'cm-caret', '▾')),
    L.addEventListener('click', () =>
      openMenu(
        L,
        [
          ['next', '⚡', 'Do next', 'the Power hour order: replies, meetings, follow-ups and sequence steps first'],
          ['score', '🏆', 'Score', 'best partners first'],
          ['status', '📈', 'Status', 'furthest stage first, then score'],
          ['recent', '🕑', 'Last contacted', 'real conversations only, most recent first'],
          ['near', '📍', 'Near me', 'closest to where you are now'],
          ['meeting', '📅', 'Closest meetings booked', 'companies with the soonest meeting first'],
        ].map(([t, e, n, a]) => ({ icon: e, label: n, sub: a, on: t === C, act: () => (t === 'near' ? askNearMe() : dash.setParams({ psort: t })) })),
      ),
    ),
    $.append(L));
  {
    const t = new Set(('ok' === o.status ? o.data : []).map((t) => t.id)),
      e = dash.data('deals'),
      n = ('ok' === e.status ? e.data : []).filter(
        (e) =>
          dealOpen(e) &&
          String(e.company_ids)
            .split('|')
            .some((e) => t.has(e)),
      );
    if (n.length) {
      const t = d3.sum(n, (t) => t.amount || 0),
        e = d3.sum(n, (t) => (t.amount || 0) * (t.probability || 0)),
        o = el('span', 'cm-prog', `💼 ${n.length} open deal${1 === n.length ? '' : 's'} · ${money(t)} (weighted ${money(e)})`);
      { const tabs = qs('.cm-csubtabs'); tabs && tabs.querySelectorAll('.cm-dealsum').forEach((x) => x.remove()); o.classList.add('cm-dealsum'); mark(o, 'deals'); tabs ? tabs.append(o) : $.append(o); }
    }
  }
  {
    const t = el('button', 'cm-chip', '🗺 Map');
    ((t.type = 'button'),
      (t.title = 'Companies on a map — plan visits and open the route in Google Maps'),
      t.addEventListener('click', () => openSheet(t, 'Trip map', drawTripMap, { wide: !0 })),
      $.append(t));
  }
  {
    const t = (t) =>
        String(t.city || '')
          .split(',')[0]
          .trim(),
      n = d3
        .rollups(
          ('ok' === o.status ? o.data : []).filter((e) => t(e)),
          (e) => [
            e.length,
            d3.greatest(
              d3.rollups(e, (t) => t.length, t),
              (t) => t[1],
            )[0],
          ],
          (e) => norm(t(e)),
        )
        .map(([, [t, e]]) => [e, t])
        .sort((t, e) => e[1] - t[1]);
    if (n.length > 1) {
      const t = dash.params().pcity,
        a = t && n.find(([e]) => norm(e) === norm(t)),
        o = a ? a[0] : '',
        s = el('button', 'cm-chip cm-pcity');
      ((s.type = 'button'),
        s.setAttribute('aria-haspopup', 'menu'),
        s.setAttribute('aria-pressed', String(!!o)),
        (s.textContent = o ? `📍 ${o}` : 'All cities'),
        s.append(el('span', 'cm-caret', '▾')),
        s.addEventListener('click', () =>
          openMenu(s, [
            { icon: '🌍', label: 'All cities', on: !o, act: () => dash.setParams({ pcity: null }) },
            ...n
              .slice(0, 25)
              .map(([t, n]) => ({
                icon: '📍',
                label: t,
                sub: `${fmt(n)} companies`,
                on: norm(t) === norm(o),
                act: () => dash.setParams({ pcity: t }),
              })),
          ]),
        ),
        $.append(s));
    }
  }
  { $.closest('.cm-bhead') && $.closest('.cm-bhead').querySelectorAll('.cm-phbtn').forEach((x) => x.remove()); const ph = el('button', 'cm-chip cm-phbtn', '⚡ Power hour'); ph.type = 'button'; ph.title = 'Work through the list one company at a time: replies first, then follow-ups due, then the best never contacted'; ph.addEventListener('click', () => window.__cm2.openPowerHour(ph)); const hh = $.closest('.cm-bhead') && $.closest('.cm-bhead').querySelector('h2'); hh ? hh.after(ph) : $.prepend(ph); }
  { const cb = el('button', 'cm-chip', selIds.size >= 2 ? `⚖ Compare ${Math.min(4, selIds.size)} ticked` : '⚖ Compare top 3'); cb.type = 'button'; cb.title = selIds.size >= 2 ? 'The companies you ticked, side by side' : `The 3 best companies ${dash.params().pcity ? 'in this city' : 'here'} side by side — or tick 2–4 companies to compare those`; cb.addEventListener('click', () => openCompare3(cb, p)); $.append(cb); }
  const A = ('ok' === o.status ? o.data : [])
      .filter((t) => t[`score_${p}`] > 0 && t[`stage_${p}`] < 6 && ('all' === v || t[`seg_brands_${p}`] > 0) && !(dash.params().phide && isPerson(t.company)) && (!window.__cm2 || window.__cm2.passAssign(t.id)) && !(window.__cm2 && window.__cm2.nextHide && window.__cm2.nextHide(dash.params().iso, p, t.id)) && ('motion' === p || t.cat_ok || t.ortho_rel || t[`score_${p}`] >= 60 || t[`stage_${p}`] >= 3))
      .map((t) => { const rc = realContact(t.id); const pt = 'near' === C ? companyPoint(t.id, t.city) : null; const mt0 = 'meeting' === C ? nextMeetingAt(t.id) : null; return Object.assign(t, { __mt: mt0, __rc: rc, __days: rc === undefined ? t.days_since_contact : rc ? rc.days : null, __km: pt && nearPos ? kmBetween(nearPos, pt) : null }); })
      .sort(
        (t, e) =>
          (window.__cm2 ? window.__cm2.isIgnored(t.id) - window.__cm2.isIgnored(e.id) : 0) || // ignored companies go to the bottom
          ('next' === C && window.__cm2 ? window.__cm2.phRank(t.id) - window.__cm2.phRank(e.id) : 0) || // Do next: exactly the Power hour order
          (e.__rc && e.__rc.pending ? 1 : 0) - (t.__rc && t.__rc.pending ? 1 : 0) || // they wrote and nobody answered: top
          ('status' === C
            ? E(e) - E(t) || S(t).localeCompare(S(e))
            : 'recent' === C
              ? (t.__days ?? 1e9) - (e.__days ?? 1e9)
              : 'near' === C
                ? (t.__km ?? 1e9) - (e.__km ?? 1e9)
                : 'meeting' === C
                  ? (t.__mt ?? 9e15) - (e.__mt ?? 9e15)
                  : 0) || e[`score_${p}`] - t[`score_${p}`],
      ),
    N0 = dash.params().pcity,
    N = N0 && A.some((t) => norm(String(t.city || '').split(',')[0].trim()) === norm(N0)) ? N0 : null, // a city from another country never empties the list
    M = N
      ? A.filter(
          (t) =>
            norm(
              String(t.city || '')
                .split(',')[0]
                .trim(),
            ) === norm(N),
        )
      : A,
    T = partnersAll || N ? M : M.slice(0, 15),
    D = new Map(rowsOf('companies').map((t) => [t.id, t])),
    I = T.map((t) => t.id);
  I.length && JSON.stringify(dash.params().pcids || []) !== JSON.stringify(I) && dash.setParams({ pcids: I });
  const P =
      JSON.stringify(dash.params().pcids || []) === JSON.stringify(I) && I.length
        ? dash.data('partner_contacts')
        : { status: 'loading', data: [] },
    B = new Map();
  if (
    (('ok' === P.status ? P.data : []).forEach((t) =>
      String(t.company_ids)
        .split('|')
        .forEach((e) => {
          (B.has(e) || B.set(e, []), B.get(e).push(t));
        }),
    ),
    'ok' !== o.status ||
      T.length ||
      n.append(
        el(
          'div',
          'cm-empty',
          'fit' === v
            ? `No company here carries ${(u.segName || u.seg).toLowerCase()} brands yet — try “Any company”.`
            : 'No scored companies here yet.',
        ),
      ),
    T.length)
  ) {
    const t = el('div', 'cm-phead'),
      a = el('input');
    ((a.type = 'checkbox'), (a.className = 'cm-selall'));
    const o = selMode && T.every((t) => selIds.has(t.id));
    ((a.checked = o),
      (a.indeterminate = selMode && !o && T.some((t) => selIds.has(t.id))),
      (a.title = selMode ? (o ? 'Unselect all' : 'Select all shown') : 'Select companies to update several at once'),
      a.setAttribute('aria-label', a.title),
      a.addEventListener('change', () => {
        (selMode ? (o ? selIds.clear() : T.forEach((t) => selIds.add(t.id))) : ((selMode = !0), T.forEach((t) => selIds.add(t.id))),
          drawPartners(),
          drawBulk());
      }),
      t.append(a),
      selMode && t.append(el('span', 'cm-prog', `${fmt(selIds.size)} of ${fmt(T.length)} selected`)),
      n.append(t));
  }
  const O = (t) => {
    t.childNodes.length && t.append(' · ');
  };
  T.forEach((o, l) => {
    const d = `id=${enc(o.id)}`,
      m = el('div', 'cm-partner'),
      h = el('button', 'cm-co pn', o.company);
    ((h.type = 'button'), (h.dataset.openCompany = o.id), mark(h, 'partners', 'company', d));
    const y = mark(el('button', 'sc', String(o[`score_${p}`])), 'partners', `score_${p}`, d);
    y.type = 'button';
    const b = {
        icon: 'ortho' === o.ortho_verdict ? '✅' : 'not_ortho' === o.ortho_verdict ? '⛔' : '🦴',
        label: 'Ortho evidence · 25%',
        sub: `${o.pts_ortho} / 25`,
      },
      v = { icon: '', label: o.ortho_why || '', sub: '' };
    hoverList(y, () => ({
      noCount: !0,
      title: `${o.company} · score ${o[`score_${p}`]}`,
      items: [
        b,
        v,
        { icon: '🏷️', label: `${u.all ? 'Orthopaedic' : u.seg} brands carried · 5%`, sub: `${u.all ? o.pts_brand_all : o[`pts_brand_${p}`]} / 5` },
        { icon: '📦', label: `Imports · 25% — ${o.imp_why || ''}`, sub: `${o.pts_imp} / 25` },
        { icon: '🏛', label: `Tenders won · 25% — ${o.tender_why || ''}`, sub: `${o.pts_tender} / 25` },
        { icon: '🌐', label: `Presence · 20% — ${o.pres_why || ''}`, sub: `${o.pts_pres} / 20` },
        { icon: '📈', label: `Stage with us: ${u.all ? o.status_all || 'none' : STAGE[o[`stage_${p}`]]}`, sub: 'not scored' },
      ],
    }));
    const $ = el('div', 'bar'),
      k = el('i');
    ((k.style.width = `${o[`score_${p}`]}%`), (k.style.background = 0 === l ? dash.colors[0] : dash.colors[1]), $.append(k));
    const C = el('span', 'why'),
      x = o[`seg_brands_${p}`];
    if (x) {
      const t = el('button', 'cm-hov', `${x} ${(u.segName || u.seg).toLowerCase()} brand${x > 1 ? 's' : ''}`);
      ((t.type = 'button'),
        hoverList(t, () => ({
          title: `${u.segName ? 'Orthopaedic' : u.seg} brands they carry`,
          items: String(o[`seg_brand_names_${p}`] || '')
            .split('|')
            .filter(Boolean)
            .map((t) => ({ brand: t, icon: '🏷️', label: t, sub: 'Open brand' })),
        })),
        C.append(t));
    } else C.append(`no ${(u.segName || u.seg).toLowerCase()} brands recorded`);
    if ((O(C), o.import_value_usd)) {
      const t = el('button', 'cm-hov', `${money(o.import_value_usd)} imports`);
      ((t.type = 'button'),
        hoverList(t, () => ({
          title: 'Imports found in trade data',
          items: [
            {
              icon: '📦',
              label: money(o.import_value_usd),
              sub: `${fmt(o.import_entries || 1)} entr${1 === (o.import_entries || 1) ? 'y' : 'ies'}${o.import_last ? ` · last ${o.import_last}` : ''}`,
            },
          ],
        })),
        C.append(mark(t, 'partners', 'import_value_usd', d)));
    } else C.append('no import data');
    if ((O(C), o.lines)) {
      const t = el('button', 'cm-hov', `${o.lines} line${1 === o.lines ? '' : 's'}`);
      ((t.type = 'button'),
        hoverList(t, () => ({
          title: 'All brands they carry',
          items: String(o.line_names || '')
            .split('|')
            .filter(Boolean)
            .map((t) => {
              const e = t.match(/^(.*?)(?: \((.*)\))?$/);
              return { brand: e[1], icon: '🏷️', label: e[1], sub: e[2] || 'Segment unknown' };
            }),
        })),
        C.append(t));
    } else C.append('0 lines');
    const E = D.get(o.id) || {},
      S = o.category && !/^(no info|unknown|n\/a|ortho)$/i.test(String(o.category).trim()) && !['dunitech', 'next', 'motion'].some((x) => String(o[`status_${x}`] || '').trim().toLowerCase() === String(o.category).trim().toLowerCase()),
      L = el('span', 'pl', [o.__km != null ? `${o.__km < 10 ? o.__km.toFixed(1) : Math.round(o.__km)} km` : '', o.city && !dash.params().pcity ? o.city.split(',')[0] : '', S ? o.category : ''].filter(Boolean).join(' · ')),
      A = el('span', 'rc'),
      N = el('span', 'pills');
    {
      const vd = o.ortho_verdict || 'unknown';
      const t = el('button', `cm-ob ${vd}`, { ortho: '✓ Ortho', likely: 'Ortho?', unclear: 'Ortho?', unknown: 'Ortho?', not_ortho: '⚠ Not ortho' }[vd] || 'Ortho?');
      t.type = 'button'; t.addEventListener('click', (ev) => { ev.stopPropagation(); openOrthoEditor(t, o); });
      (hoverList(t, () => {
        const t = el('div', 'cm-note');
        if ((t.append(el('p', null, o.ortho_why || '')), safeHref(o.ortho_url))) {
          const e = el('a', 'cm-co', 'Open their website ↗');
          ((e.href = safeHref(o.ortho_url)), (e.target = '_blank'), (e.rel = 'noopener noreferrer'), t.append(e));
        }
        return (
          t.append(
            el(
              'p',
              'mut',
              'Click to set the category or tick where you saw ortho products (Google Maps, LinkedIn, Instagram…).',
            ),
          ),
          { title: 'Ortho evidence', node: t }
        );
      }),
        N.append(mark(t, 'partners', 'ortho_verdict', d)));
    }
    A.append(N);
    {
      const t = followPill(E.next_followup, E.next_step);
      t && A.append(mark(t, 'companies'));
    }
    A.append(mark(contactChip(o.__days, o.__rc ? o.__rc.time : o.__rc === null ? null : E.last_interaction, { ...E, __id: o.id, __rc: o.__rc }), o.__rc === undefined ? 'partners' : 'contact_history', o.__rc === undefined ? 'days_since_contact' : null, d), L);
    const M = el('span', 'nmw');
    if (multiIsos()) {
      const t = isoOfCountry(String((D.get(o.id) || {}).country || ''));
      t && M.append(el('span', 'cm-rflag', flag(t)));
    }
    M.append(h);
    const I = OUR3().map(([t]) => t),
      P = ['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'best',
      H = I.slice().sort(
        (t, e) => (o[`stage_${e}`] || 0) - (o[`stage_${t}`] || 0) || (o[`status_${e}`] ? 1 : 0) - (o[`status_${t}`] ? 1 : 0),
      )[0],
      R = u.all ? ('best' === P ? (o[`status_${H}`] ? [H] : []) : [P]) : [p];
    (R.forEach((t) => {
      const e = o[`stage_${t}`] || 0,
        n = o[`status_${t}`] || '',
        a = { dunitech: 'Dunitech', next: 'Next', motion: 'Motion' }[t],
        s = el('button', `cm-spill s${e}`),
        r = u.all ? logoImg(t, 'sm') : null;
      (s.append(document.createTextNode(u.all && !r ? `${a} · ${n || 'No status'}` : n || 'No status')),
        r && s.prepend(r),
        u.all && !r && (s.dataset.short = a),
        editableStatus(s, o.id, o.company, STATUS_FIELD[t], n),
        (s.title = `${OURS[t].label} status in NetHunt: ${n || 'none'} (stage: ${STAGE[e]})`),
        N.append(mark(s, 'partners', `status_${t}`, d)));
      { const sg = statusSuggestBtn(o.id, o.company, t, n); sg && N.append(sg); }
    }),
      u.all && 'best' === P && !R.length && N.append(el('span', 'cm-spill s0', 'Not contacted')));
    if (o.__rc && o.__rc.pending) {
      const r = replyLink(o.__rc, o.company); const t = el(r ? 'a' : 'span', 'cm-pend', `⏳ They wrote ${o.__rc.ago} ago`);
      r && ((t.href = r.href), (t.target = '_blank'), (t.rel = 'noopener noreferrer'));
      t.title = `${o.__rc.type === 'chat' ? 'WhatsApp' : 'Email'}${o.__rc.by ? ` from ${o.__rc.by}` : ''}: “${o.__rc.preview}” — no reply from us yet`;
      M.append(mark(t, 'contact_history'));
    }
    { const hr = hotReason(o.id); if (hr) { const t = el('span', 'cm-hot', '🔥'); t.title = `Hot: ${hr}`; M.append(mark(t, 'contact_history')); } }
    if (isPerson(o.company)) { const t = el('span', 'cm-isperson', '👤 Person'); t.title = 'Looks like a person’s name, not a company — hide people from the “Any company” menu'; M.append(t); }
    const j = meetingTag(o.id);
    j && M.append(j);
    {
      const t = dealTag(o.id);
      t && M.append(t);
    }
    const G = el('span', 'cm-qa'),
      U = el('button', 'cm-qi note');
    ((U.type = 'button'),
      (U.innerHTML = ICON_NOTE),
      (U.title = 'Summary: notes, calls & comments'),
      U.setAttribute('aria-label', `Summary for ${o.company}`),
      hoverList(U, () => (dash.params().ncid !== o.id && dash.setParams({ ncid: o.id }), { title: 'Summary', node: notesNode(E, o, p), refresh: !0 })));
    const K = el('button', 'cm-qi cat');
    ((K.type = 'button'),
      (K.innerHTML = ICON_CAT),
      (K.title = 'Send catalogue (PDF)'),
      K.setAttribute('aria-label', 'Send catalogue'),
      K.addEventListener('click', () => sendCatalog(K, o.id, o.company)),
      G.append(U, K));
    const W = splitBar(E.phones).filter(goodPhone),
      z = { ...E, company: o.company, brands: o.line_names, iso: dash.params().iso };
    {
      const na = nextAction(o, o.__rc, W, splitBar(E.emails), tplCtx(z));
      if (na) {
        const t = el(na.href ? 'a' : 'button', `cm-next${na.hot ? ' hot' : ''}`, na.label);
        t.title = na.title;
        na.href ? ((t.href = na.href), (t.target = '_blank'), (t.rel = 'noopener noreferrer')) : ((t.type = 'button'), t.addEventListener('click', () => cmCopyNum(na.call)));
        G.prepend(t);
      }
    }
    if (W.length) {
      const t = cmCallBtn(`Call ${o.company}`);
      (hoverList(
        t,
        () => {
          const n = el('div');
          (n.append(cmLogRow(o.id, o.company, u.all ? null : p)), W.forEach((e) => n.append(contactLine(e, 'Company line', { phones: [e], emails: [] }))));
          const e = W.find(waOk);
          return (e && n.append(templateBar(z, e, 'wa')), { title: 'Phone', node: n });
        },
        { keepClick: !0 },
      ),
        G.append(t));
    }
    const F = splitBar(E.emails);
    if (F.length) {
      const t = iconLink('mail', ICON_MAIL, gmailHref(F[0]), `Email ${F[0]} in Gmail`, !0);
      (hoverList(
        t,
        () => {
          const ppl = (B.get(o.id) || []).flatMap((x) => splitBar(x.email));
          return { title: 'Email', node: emailPanel(z, [...F, ...ppl]) };
        },
        { keepClick: !0 },
      ),
        G.append(t));
    }
    G.append(mapsLink(o.company, E.city, (countryOfIso(dash.params().iso) || {}).country, E.google_maps, o.id)); // website & social links: on the company page
    const Z = B.get(o.id) || [];
    if (Z.length) {
      const t = el('button', 'cm-qi ppl');
      ((t.type = 'button'),
        (t.innerHTML = ICON_PPL),
        t.append(el('span', 'c', String(Z.length))),
        (t.title = `${Z.length} people`),
        hoverList(t, () => {
          const t = el('div');
          return (
            Z.slice()
              .sort(
                (t, e) =>
                  (window.__cm2 && window.__cm2.personSort ? window.__cm2.personSort(t, e) : 0) || cmRank(t.title) - cmRank(e.title) || String(e.last_interaction || '').localeCompare(String(t.last_interaction || '')),
              )
              .forEach((e) =>
                t.append(
                  contactLine(e.name, [e.title, e.contact_type].filter(Boolean).join(' · '), {
                    linkedin: e.linkedin,
                    phones: splitBar(e.phone),
                    emails: splitBar(e.email),
                  }),
                ),
              ),
            { title: 'People', node: t }
          );
        }),
        G.append(t));
    }
    M.append(G);
    let Y = el('span', 'rk', `${l + 1}`);
    if (selMode) {
      Y = el('span', 'rk');
      const n = el('input');
      ((n.type = 'checkbox'),
        (n.checked = selIds.has(o.id)),
        n.setAttribute('aria-label', `Select ${o.company}`),
        n.addEventListener('change', () => {
          n.checked ? selIds.add(o.id) : selIds.delete(o.id);
          const a = qs('.cm-selall');
          if (a) {
            const t = T.filter((t) => selIds.has(t.id)).length;
            ((a.checked = t === T.length), (a.indeterminate = t > 0 && t < T.length));
          }
          const s = qs('.cm-phead .cm-prog');
          (s && (s.textContent = `${fmt(selIds.size)} of ${fmt(T.length)} selected`), drawBulk());
        }),
        Y.append(n));
    }
    (m.append(Y, M, y, A, $, C), window.matchMedia && window.matchMedia('(max-width: 640px)').matches && m.insertBefore(G, C), n.append(m));
  });
  const H = qs('.cm-pmore');
  ((H.hidden = A.length <= 15), (H.textContent = partnersAll ? 'Show top 15' : `Show all ${fmt(A.length)}`));
}
let sourcesBuilt = !1;
function ensureSourcesView() {
  if (sourcesBuilt) return;
  sourcesBuilt = !0;
  const e = qs('#sources-view');
  (e.append(qs('#tpl-sources').content.cloneNode(!0)),
    qs('.cm-dcountry', e).addEventListener('change', (t) => dash.setParams({ dcountry: t.target.value || 'all' })));
}
const tst = { q: '', sort: 'value', dir: -1, open: null };
let tendersBuilt = !1;
function ensureTendersView() {
  if (tendersBuilt) return;
  tendersBuilt = !0;
  const e = qs('#tenders-view');
  (e.append(qs('#tpl-tenders').content.cloneNode(!0)),
    qs('.cm-tq', e).addEventListener('input', (t) => {
      ((tst.q = t.target.value), drawTenders());
    }),
    qs('.cm-tcountry', e).addEventListener('change', (t) => dash.setParams({ tcountry: t.target.value || 'all' })),
    qs('.cm-tniche', e).addEventListener('change', (t) => dash.setParams({ tniche: t.target.value || 'all' })),
    qs('.cm-tclear', e).addEventListener('click', () => {
      ((tst.q = ''), (qs('.cm-tq', e).value = ''), dash.setParams({ tcountry: 'all', tniche: 'all', tcrm: 'all' }));
    }),
    e.querySelectorAll('[data-tsort]').forEach((t) =>
      t.addEventListener('click', () => {
        const e = t.dataset.tsort;
        ((tst.dir = tst.sort === e ? -tst.dir : 'company' === e || 'country_iso' === e || 'niche' === e ? 1 : -1), (tst.sort = e), drawTenders());
      }),
    ),
    qs('.cm-ttable tbody', e).addEventListener('click', (t) => {
      if (t.target.closest('[data-open-company]')) return;
      const e = t.target.closest('tr[data-key]');
      e && ((tst.open = tst.open === e.dataset.key ? null : e.dataset.key), drawTenders());
    }));
}
const tValSort = (t) =>
  null != t.value_usd
    ? t.value_usd
    : null != t.value_local
      ? t.value_local / ('INR' === t.currency ? 85 : 'TRY' === t.currency ? 40 : 1)
      : -1;
function drawTenders() {
  const o = qs('#tenders-view');
  if (!o.children.length) return;
  const p = dash.data('tender_awards'),
    u = 'ok' === p.status ? p.data : [],
    m = dash.params(),
    h = m.tcountry || 'all',
    g = m.tniche || 'all',
    f = m.tcrm || 'all',
    y = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
    b = d3.rollup(
      u,
      (t) => t.length,
      (t) => t.country_iso,
    ),
    v = qs('.cm-tcountry', o);
  (v.replaceChildren(
    new Option(`All countries (${fmt(u.length)})`, 'all'),
    ...[...b].sort((t, e) => e[1] - t[1]).map(([t, n]) => new Option(`${flag(t)} ${y.get(t) || t} (${fmt(n)})`.trim(), t)),
  ),
    (v.value = b.has(h) ? h : 'all'),
    v.classList.toggle('on', 'all' !== v.value));
  const w = u.filter((t) => 'all' === h || t.country_iso === h),
    _ = d3.rollup(
      w,
      (t) => t.length,
      (t) => t.niche || 'Unspecified',
    ),
    $ = qs('.cm-tniche', o);
  ($.replaceChildren(
    new Option('All niches', 'all'),
    ...[..._].sort((t, e) => e[1] - t[1]).map(([t, n]) => new Option(`${t} (${fmt(n)})`, t)),
  ),
    ($.value = _.has(g) ? g : 'all'),
    $.classList.toggle('on', 'all' !== $.value),
    qs('.cm-tcrm', o).replaceChildren(
      ...[
        ['all', 'All'],
        ['out', 'Not in NetHunt'],
        ['in', 'In NetHunt'],
      ].map(([t, e]) => {
        const n = el('button', null, e);
        return (
          (n.type = 'button'),
          n.setAttribute('aria-pressed', String(f === t)),
          n.addEventListener('click', () => dash.setParams({ tcrm: t })),
          n
        );
      }),
    ));
  const k = norm(tst.q).trim(),
    C = w.filter(
      (t) =>
        ('all' === $.value || (t.niche || 'Unspecified') === $.value) &&
        ('all' === f || ('in' === f) == !!t.nethunt_id) &&
        (!k || norm([t.company, t.top_buyers, t.niche, t.other_niches, t.scope, t.tax_id].join(' ')).includes(k)),
    );
  qs('.cm-tclear', o).hidden = !(k || 'all' !== h || 'all' !== $.value || 'all' !== f);
  const x = d3.sum(C, (t) => t.value_usd || 0),
    E = d3.rollups(
      C.filter((t) => null == t.value_usd && t.value_local),
      (t) => d3.sum(t, (t) => t.value_local),
      (t) => t.currency,
    ),
    S = C.filter((t) => t.nethunt_id).length,
    L = qs('.cm-tkpis', o);
  L.replaceChildren();
  const A = (t, e, n) => {
    const a = el('div', 'cm-kpi');
    a.append(el('span', 'lbl', t));
    const o = el('span', 'val', e);
    (o.classList.toggle('dash-skeleton', 'loading' === p.status), a.append(o), n && a.append(el('span', 'note', n)), L.append(a));
  };
  (A('Tender winners', fmt(C.length), 'all' === h ? `${fmt(new Set(C.map((t) => t.country_iso)).size)} countries` : y.get(h)),
    A(
      'Awarded (USD)',
      x ? money(x) : '—',
      E.length ? `+ ${E.map(([t, e]) => `${CUR[t] || t}${compact(e)}`).join(' + ')} in local currency` : 'LatAm data in USD',
    ),
    A('Not in NetHunt', fmt(C.length - S), C.length ? `${d3.format('.0%')((C.length - S) / C.length)} are new leads` : ''),
    A('Awards / purchase orders', fmt(d3.sum(C, (t) => t.awards || 0)), 'Total award lines'));
  const N = C.slice()
      .sort((t, e) => tValSort(e) - tValSort(t))
      .slice(0, 15),
    M = d3.max(N, tValSort) || 1;
  qs('.cm-ttop-hint', o).textContent =
    C.some((t) => null == t.value_usd && t.value_local) && C.some((t) => null != t.value_usd)
      ? 'Ranked by awarded value (INR/TRY converted roughly to USD for ranking only).'
      : 'Ranked by awarded value.';
  const T = qs('.cm-tchart', o);
  (T.replaceChildren(),
    T.classList.toggle('dash-skeleton', 'loading' === p.status),
    'error' === p.status && failLine(T),
    N.forEach((t, e) => {
      const n = `id=${enc(t.id)}`,
        a = el('div', 'cm-tbar');
      let o;
      (t.nethunt_id
        ? ((o = el('button', 'cm-co n', `${flag(t.country_iso)} ${t.company}`)),
          (o.type = 'button'),
          (o.dataset.openCompany = t.nethunt_id))
        : (o = el('span', 'n', `${flag(t.country_iso)} ${t.company}`)),
        mark(o, 'tender_awards', 'company', n));
      const l = el('div', 'b'),
        d = el('i');
      ((d.style.width = (tValSort(t) / M) * 100 + '%'),
        (d.style.background = t.nethunt_id ? dash.colors[0] : dash.colors[1]),
        l.append(d),
        a.append(o, mark(el('span', 'v', tenderVal(t)), 'tender_awards', null != t.value_usd ? 'value_usd' : 'value_local', n), l),
        T.append(a));
    }),
    N.length && T.append(el('div', 'cm-legend', '■ in NetHunt (dark) · ■ not in NetHunt (light)')));
  const D = qs('.cm-tnichelist', o);
  D.replaceChildren();
  const I = d3
      .rollups(
        C,
        (t) => ({ n: t.length, usd: d3.sum(t, (t) => t.value_usd || 0) }),
        (t) => t.niche || 'Unspecified',
      )
      .sort((t, e) => e[1].n - t[1].n)
      .slice(0, 12),
    P = d3.max(I, (t) => t[1].n) || 1;
  I.forEach(([t, n], o) => {
    const s = el('div', 'cm-row click');
    s.addEventListener('click', () => dash.setParams({ tniche: $.value === t ? 'all' : t }));
    const r = el('button', 'cm-blink', t);
    r.type = 'button';
    const c = el('div', 'bar'),
      l = el('i');
    ((l.style.width = (n.n / P) * 100 + '%'),
      (l.style.background = $.value === t ? dash.colors[0] : dash.colors[2]),
      c.append(l),
      s.append(el('span', 'f dot'), r, el('span', 'ct', `${fmt(n.n)}${n.usd ? ` · ${money(n.usd)}` : ''}`), c),
      D.append(s));
  });
  const B =
      {
        value: tValSort,
        awards: (t) => t.awards || 0,
        share_pct: (t) => t.share_pct ?? -1,
        company: (t) => String(t.company),
        country_iso: (t) => y.get(t.country_iso) || t.country_iso,
        niche: (t) => t.niche || '',
      }[tst.sort] || tValSort,
    O = C.slice().sort((t, e) => {
      const n = B(t),
        a = B(e);
      return ('string' == typeof n ? n.localeCompare(a) : n - a) * tst.dir;
    });
  (o.querySelectorAll('[data-tsort]').forEach((t) => {
    t.dataset.tsort === tst.sort ? t.setAttribute('aria-sort', tst.dir > 0 ? 'ascending' : 'descending') : t.removeAttribute('aria-sort');
  }),
    (qs('.cm-tcount', o).textContent = `${fmt(O.length)} winners${O.length > 500 ? ' · showing first 500' : ''}`));
  const H = qs('.cm-ttable tbody', o);
  (H.replaceChildren(),
    O.slice(0, 500).forEach((t) => {
      const n = el('tr');
      n.dataset.key = t.id;
      const a = el('td');
      if (t.nethunt_id) {
        const e = el('button', 'cm-co', t.company);
        ((e.type = 'button'), (e.dataset.openCompany = t.nethunt_id), a.append(e));
      } else a.append(t.company);
      const o = el('td');
      if (
        (o.append(t.nethunt_id ? el('span', 'cm-pill', 'In NetHunt') : el('span', 'cm-imp', 'New lead')),
        n.append(
          a,
          el('td', null, `${flag(t.country_iso)} ${y.get(t.country_iso) || t.country_iso}`),
          el('td', 'cm-hide-sm', t.niche || ''),
          el('td', 'cm-num', null != t.awards ? fmt(t.awards) : ''),
          el('td', 'cm-num', tenderVal(t)),
          el('td', 'cm-num cm-hide-sm', null != t.share_pct ? `${d3.format('.1f')(t.share_pct)}%` : ''),
          o,
        ),
        H.append(n),
        tst.open === t.id)
      ) {
        const e = el('tr', 'det'),
          n = el('td');
        if (
          ((n.colSpan = 7),
          [
            t.other_niches ? `Other niches: ${t.other_niches}` : null,
            t.scope ? t.scope : null,
            t.years ? `Active: ${t.years}` : null,
            t.top_buyers ? `Top buyers: ${t.top_buyers}` : null,
            t.buyer_type ? `Buyer type: ${t.buyer_type}` : null,
            t.company_type ? `Type: ${t.company_type}` : null,
            t.tax_id ? `Tax ID: ${t.tax_id}` : null,
            `Source: ${t.source} (${t.period})`,
          ]
            .filter(Boolean)
            .forEach((t) => n.append(el('div', null, t))),
          t.source_url && /^https?:/.test(t.source_url))
        ) {
          const e = el('a', null, 'Open source record ↗');
          ((e.href = t.source_url), (e.target = '_blank'), (e.rel = 'noopener noreferrer'), n.append(e));
        }
        (e.append(n), H.append(e));
      }
    }));
  const R = qs('.cm-tsources', o);
  R.replaceChildren();
  const j = (t, e) => {
    const n = el('div', 'grp');
    (n.append(el('b', null, t)),
      e.forEach(([t, e]) => {
        const a = el('a', null, t);
        ((a.href = e), (a.target = '_blank'), (a.rel = 'noopener noreferrer'), n.append(a));
      }),
      R.append(n));
  };
  (j('🇪🇺 EU-wide', EU_PORTALS),
    ('all' !== h && PORTALS[h] ? [h, ...Object.keys(PORTALS).filter((t) => t !== h)] : Object.keys(PORTALS)).forEach((t) =>
      j(`${flag(t)} ${y.get(t) || t}${b.has(t) ? ` · ${fmt(b.get(t))} winners loaded` : ''}`, PORTALS[t]),
    ));
}
let marketsBuilt = !1;
function ensureMarketsView() {
  if (marketsBuilt) return;
  marketsBuilt = !0;
  const n = qs('#markets-view');
  n.append(qs('#tpl-markets').content.cloneNode(!0));
  const a = qs('.cm-cmp-a', n),
    o = qs('.cm-cmp-b', n),
    s = (t, n) => {
      const a = norm(t).trim(),
        o = new Map();
      return (
        rowsOf('pipeline_stages').forEach((t) => t.brands && t.brands.split('|').forEach((t) => o.set(t, (o.get(t) || 0) + 1))),
        [...o]
          .filter(([t]) => !a || norm(t).includes(a))
          .sort((t, e) => e[1] - t[1])
          .slice(0, 40)
          .map(([t, a]) => ({ icon: '🏷️', label: t, sub: `${fmt(a)} companies`, act: () => dash.setParams({ [n]: t }) }))
      );
    };
  (makeCombo(a, qs('.cm-cmp-a-list', n), (t) => s(t, 'cmpA'), {
    selectAllOnFocus: !0,
    onBlur: () => {
      a.value = dash.params().cmpA || '';
    },
  }),
    makeCombo(o, qs('.cm-cmp-b-list', n), (t) => s(t, 'cmpB'), {
      selectAllOnFocus: !0,
      onBlur: () => {
        o.value = dash.params().cmpB || '';
      },
    }));
}
const gapState = { q: '', region: '', min: 0, growing: !1, unknown: !1, sort: 'size', dir: 'desc', all: !1 };
function drawMarkets() {
  const n = qs('#markets-view'),
    p = oursKey(),
    u = OURS[p],
    m = ['Joints', 'Osteosynthesis'].includes(dash.params().mseg) ? dash.params().mseg : u.seg,
    h = dash.data('country_matrix'),
    g = 'ok' === h.status ? h.data : [],
    f = 'Joints' === m ? 'joints_size' : 'osteo_size',
    y = 'Joints' === m ? 'joints_growth' : 'osteo_growth',
    b = 'Joints' === m ? 'competitors_joints' : 'competitors_osteo';
  (qs('.cm-mseg', n).replaceChildren(
    ...['Joints', 'Osteosynthesis'].map((t) => {
      const e = el('button', 'cm-chip', t);
      return (
        (e.type = 'button'),
        e.setAttribute('aria-pressed', String(t === m)),
        e.addEventListener('click', () => dash.setParams({ mseg: t })),
        e
      );
    }),
  ),
    (qs('.cm-mhint', n).textContent =
      `Each bubble is a country: right = faster ${m.toLowerCase()} import growth, up = more competitor brands in this segment, size = ${m.toLowerCase()} imports 2025, colour = ${u.label}'s furthest pipeline stage there.`));
  const v = qs('.cm-mtake', n);
  v.replaceChildren();
  const w = qs('.cm-matrix', n);
  if ((w.classList.toggle('dash-skeleton', 'loading' === h.status), 'error' === h.status)) return void failLine(w);
  if ('ok' === h.status) {
    const n = g.filter((t) => t[f] > 0 && null != t[y]),
      l = d3.median(n, (t) => t[y]),
      d = d3.median(n, (t) => t[b]),
      h = n
        .filter((t) => t[y] >= l && t[b] <= d && t[`stage_${p}`] < 2)
        .sort((t, e) => e[f] - t[f])
        .slice(0, 3),
      w = g.filter((t) => t[`stage_${p}`] >= 2).length;
    (v.append(
      hoverList(mark(el('b', null, fmt(w)), 'country_matrix', `stage_${p}`), () => ({
        title: `Countries where ${u.label} has contact`,
        items: g
          .filter((t) => t[`stage_${p}`] >= 2)
          .sort((t, e) => e[`stage_${p}`] - t[`stage_${p}`] || t.country.localeCompare(e.country))
          .map(isoItem(p)),
      })),
      ` countries where ${u.label} has contacted someone.`,
    ),
      h.length &&
        (v.append(` Biggest ${m.toLowerCase()} markets that are growing, less crowded and still untouched: `),
        h.forEach((t, e) => {
          const n = el('button', 'cm-co', `${flag(t.iso)} ${t.country}`);
          ((n.type = 'button'),
            (n.dataset.openIso = t.iso),
            mark(n, 'country_matrix', 'country', `iso=${enc(t.iso)}`),
            v.append(e ? ', ' : '', n, ` (${money(t[f])})`));
        }),
        v.append('.')),
      (function (e, n, r) {
        const c = qs('.cm-matrix'),
          l = qs('.cm-tip');
        c.querySelectorAll('svg').forEach((t) => t.remove());
        const d = 'Joints' === r ? 'joints_size' : 'osteo_size',
          p = 'Joints' === r ? 'joints_growth' : 'osteo_growth',
          u = 'Joints' === r ? 'competitors_joints' : 'competitors_osteo',
          m = e.filter((t) => t[d] > 0 && null != t[p]),
          h = Math.max(320, c.clientWidth),
          g = Math.min(480, Math.max(320, 0.55 * h)),
          f = { t: 16, r: 16, b: 42, l: 48 },
          y = d3
            .scaleLinear(
              d3.extent(m, (t) => Math.max(-0.6, Math.min(1.2, t[p]))),
              [f.l, h - f.r],
            )
            .nice(),
          b = d3.scaleLinear([0, d3.max(m, (t) => t[u]) || 1], [g - f.b, f.t]).nice(),
          v = d3.scaleSqrt([0, d3.max(m, (t) => t[d]) || 1], [3, 26]),
          w = d3
            .select(c)
            .append('svg')
            .attr('width', '100%')
            .attr('viewBox', `0 0 ${h} ${g}`)
            .attr('role', 'img')
            .attr('aria-label', 'Opportunity matrix'),
          _ = d3.median(m, (t) => t[p]),
          $ = d3.median(m, (t) => t[u]);
        (w
          .append('rect')
          .attr('x', y(_))
          .attr('y', b($))
          .attr('width', Math.max(0, h - f.r - y(_)))
          .attr('height', Math.max(0, g - f.b - b($)))
          .attr('fill', 'var(--cds-chart-grid)')
          .attr('opacity', 0.6)
          .attr('rx', 6),
          w
            .append('text')
            .attr('x', h - f.r - 6)
            .attr('y', g - f.b - 8)
            .attr('text-anchor', 'end')
            .attr('fill', 'var(--color-fg-muted)')
            .attr('font-size', 11)
            .text('Growing, less crowded'),
          [
            [y(_), f.t, y(_), g - f.b],
            [f.l, b($), h - f.r, b($)],
          ].forEach(([t, e, n, a]) =>
            w
              .append('line')
              .attr('x1', t)
              .attr('y1', e)
              .attr('x2', n)
              .attr('y2', a)
              .attr('stroke', 'var(--cds-chart-reference)')
              .attr('stroke-dasharray', '4 4'),
          ),
          [
            w
              .append('g')
              .attr('transform', `translate(0,${g - f.b})`)
              .call(
                d3
                  .axisBottom(y)
                  .ticks(Math.max(3, Math.floor(h / 110)))
                  .tickFormat(d3.format('+.0%')),
              ),
            w.append('g').attr('transform', `translate(${f.l},0)`).call(d3.axisLeft(b).ticks(5)),
          ].forEach((t) => {
            (t.attr('font-size', null).attr('font-family', null),
              t.selectAll('text').attr('fill', 'var(--color-fg-muted)').attr('font-size', 11),
              t.selectAll('line,path').attr('stroke', 'var(--cds-chart-axis)'));
          }),
          w
            .append('text')
            .attr('x', h - f.r)
            .attr('y', g - 6)
            .attr('text-anchor', 'end')
            .attr('fill', 'var(--color-fg-muted)')
            .attr('font-size', 11)
            .text('Joints' === r ? 'Joints import growth per year, 2021–25 →' : 'Osteosynthesis import growth over 5 years →'),
          w
            .append('text')
            .attr('x', 4)
            .attr('y', 11)
            .attr('fill', 'var(--color-fg-muted)')
            .attr('font-size', 11)
            .text(`↑ ${r.toLowerCase()} competitor brands present`));
        const k = w.append('g'),
          C = m.slice().sort((t, e) => e[d] - t[d]);
        k.selectAll('circle')
          .data(C)
          .join('circle')
          .attr('cx', (t) => y(Math.max(-0.6, Math.min(1.2, t[p]))))
          .attr('cy', (t) => b(t[u]))
          .attr('r', (t) => v(t[d]))
          .attr('fill', (t) => stageColor(t[`stage_${n}`]))
          .attr('fill-opacity', 0.75)
          .attr('stroke', 'var(--color-bg)')
          .attr('stroke-width', 1)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', (t) => `${t.country}: ${money(t[d])}, ${STAGE[t[`stage_${n}`]]}`)
          .style('cursor', 'pointer')
          .on('mouseenter focus', (t, e) => {
            (l.replaceChildren(
              el('div', 'h', `${flag(e.iso)} ${e.country}`),
              el('div', null, `${r} imports ${money(e[d])} · growth ${pct(e[p])}`),
              el('div', null, `${e[u]} ${r.toLowerCase()} competitors · ${e.importer_unknown} exporters with no known importer`),
              el('div', null, `${OURS[n].label}: ${STAGE[e[`stage_${n}`]]}`),
            ),
              (l.hidden = !1));
            const m = c.getBoundingClientRect(),
              g = (t.clientX ?? m.left + (y(e[p]) * m.width) / h) - m.left,
              f = (t.clientY ?? m.top + (b(e[u]) * m.width) / h) - m.top;
            ((l.style.left = `${Math.min(m.width - 230, Math.max(0, g + 12))}px`), (l.style.top = `${Math.max(0, f - 10)}px`));
          })
          .on('mouseleave blur', () => {
            l.hidden = !0;
          })
          .on('click', (t, e) => window.cmOpenCountry(e.iso))
          .on('keydown', (t, e) => {
            'Enter' === t.key && window.cmOpenCountry(e.iso);
          });
        const x = [],
          E = [];
        for (const t of C) {
          if (E.length >= 18) break;
          const e = y(Math.max(-0.6, Math.min(1.2, t[p]))) + v(t[d]) + 3,
            n = b(t[u]) + 4,
            a = [e, n - 11, e + 6.4 * t.country.length, n + 2];
          a[2] > h - 2 || x.some((t) => !(a[2] < t[0] || a[0] > t[2] || a[3] < t[1] || a[1] > t[3])) || (x.push(a), E.push(t));
        }
        (k
          .selectAll('text.lb')
          .data(E)
          .join('text')
          .attr('class', 'lb')
          .attr('x', (t) => y(Math.max(-0.6, Math.min(1.2, t[p]))) + v(t[d]) + 3)
          .attr('y', (t) => b(t[u]) + 4)
          .attr('font-size', 11)
          .attr('fill', 'var(--color-fg)')
          .attr('pointer-events', 'none')
          .text((t) => t.country),
          qs('.cm-legend').replaceChildren(
            ...STAGE.map((t, e) => {
              const n = el('span', 'li'),
                a = el('span', 'cm-dot');
              return ((a.style.background = stageColor(e)), n.append(a, t), n);
            }),
            el('span', 'li', '· bubble = market size · click a bubble to open the country'),
          ));
      })(g, p, m));
  }
  const _ = dash.data('markets_summary'),
    $ = ('ok' === _.status ? _.data : []).find((t) => t.ours === p),
    k = [30, 60, 90].includes(Number(dash.params().stale)) ? Number(dash.params().stale) : 30,
    C = [
      ['active_countries', 'countries with contact', 'See the matrix', 'matrix'],
      ['partner_countries', 'countries with a partner', 'See the matrix', 'matrix'],
      ['Joints' === m ? 'gaps_joints' : 'gaps_osteo', `untouched ${m.toLowerCase()} markets over $10M`, 'See coverage gaps', 'gaps'],
      [`stale_${k}`, `engaged leads quiet ${k}+ days`, 'See stale pipeline', 'stale'],
    ];
  qs('.cm-mactions', n).replaceChildren(
    ...C.map(([t, n, o, r]) => {
      const d = el('button', 'cm-action');
      d.type = 'button';
      const m = mark(el('span', 'n', $ ? fmt($[t]) : '—'), 'markets_summary', t, `ours=${p}`);
      (m.classList.toggle('dash-skeleton', 'loading' === _.status),
        d.append(m, el('span', 'l', n), el('span', 'go', `${o} →`)),
        d.addEventListener('click', () => {
          const t = document.getElementById(r);
          t && (t.scrollIntoView({ behavior: 'smooth', block: 'start' }), dash.setLink(r));
        }));
      const f =
        {
          active_countries: () => ({
            title: `Countries with contact · ${u.label}`,
            items: g
              .filter((t) => t[`stage_${p}`] >= 2)
              .sort((t, e) => e[`stage_${p}`] - t[`stage_${p}`] || t.country.localeCompare(e.country))
              .map(isoItem(p)),
          }),
          partner_countries: () => ({
            title: `Countries with a partner · ${u.label}`,
            items: g
              .filter((t) => t[`stage_${p}`] >= 6)
              .sort((t, e) => t.country.localeCompare(e.country))
              .map(isoItem(p)),
          }),
          gaps_joints: () => ({
            title: 'Untouched joints markets over $10M',
            items: g
              .filter((t) => t[`stage_${p}`] < 2 && t.joints_size >= 1e7)
              .sort((t, e) => e.joints_size - t.joints_size)
              .map(isoItem(p, (t) => money(t.joints_size))),
          }),
          gaps_osteo: () => ({
            title: 'Untouched osteosynthesis markets over $10M',
            items: g
              .filter((t) => t[`stage_${p}`] < 2 && t.osteo_size >= 1e7)
              .sort((t, e) => e.osteo_size - t.osteo_size)
              .map(isoItem(p, (t) => money(t.osteo_size))),
          }),
        }[t] ||
        (t.startsWith('stale_')
          ? () => {
              const t = Date.now();
              return {
                title: `Engaged leads quiet ${k}+ days · ${u.label}`,
                items: rowsOf('pipeline_stages')
                  .map((e) => ({ r: e, ago: e.last_interaction ? Math.round((t - new Date(e.last_interaction)) / 864e5) : null }))
                  .filter(({ r: t, ago: e }) => t[`stage_${p}`] >= 3 && t[`stage_${p}`] <= 5 && (null == e || e >= k))
                  .sort((t, e) => e.r[`stage_${p}`] - t.r[`stage_${p}`] || (e.ago ?? 9999) - (t.ago ?? 9999))
                  .map(({ r: t, ago: e }) => ({
                    id: t.id,
                    label: t.company,
                    icon: flag(t.iso) || '🏢',
                    sub: `${STAGE[t[`stage_${p}`]]} · ${null == e ? 'no contact' : `${e}d`}`,
                  })),
              };
            }
          : null);
      return (f && 'ok' === h.status && hoverList(d, f, { keepClick: !0 }), d);
    }),
  );
  const x = qs('.cm-gaps', n);
  (x.replaceChildren(),
    (qs('.cm-gaps-hint', n).textContent =
      `Markets where ${u.label} hasn't contacted anyone yet. Click a column to sort. "No known importer" = competitors the trade report shows exporting there, with no NetHunt company carrying them.`));
  const E = qs('.cm-gtools', n);
  if (!E.dataset.built) {
    E.dataset.built = '1';
    const e = el('input', 'cm-search cm-gq');
    ((e.type = 'search'),
      (e.placeholder = 'Search country…'),
      e.setAttribute('aria-label', 'Search coverage gaps'),
      e.addEventListener('input', () => {
        ((gapState.q = e.value), (gapState.all = !1), drawMarkets());
      }));
    const a = el('select', 'cm-fsel cm-gregion');
    (a.setAttribute('aria-label', 'Region'),
      a.addEventListener('change', () => {
        ((gapState.region = a.value), (gapState.all = !1), drawMarkets());
      }));
    const o = el('select', 'cm-fsel cm-gmin');
    (o.setAttribute('aria-label', 'Minimum imports'),
      [
        [0, 'Any size'],
        [1e6, 'Imports ≥ $1M'],
        [1e7, 'Imports ≥ $10M'],
        [5e7, 'Imports ≥ $50M'],
      ].forEach(([t, e]) => o.append(new Option(e, String(t)))),
      o.addEventListener('change', () => {
        ((gapState.min = Number(o.value)), (gapState.all = !1), drawMarkets());
      }));
    const s = el('button', 'cm-chip cm-ggrow', 'Growing only');
    ((s.type = 'button'),
      s.addEventListener('click', () => {
        ((gapState.growing = !gapState.growing), drawMarkets());
      }));
    const r = el('button', 'cm-chip cm-gunk', 'No known importer');
    ((r.type = 'button'),
      (r.title = 'Only markets where competitors export but no NetHunt company carries them'),
      r.addEventListener('click', () => {
        ((gapState.unknown = !gapState.unknown), drawMarkets());
      }));
    const c = el('button', 'cm-chip cm-gclr', 'Clear filters');
    ((c.type = 'button'),
      c.addEventListener('click', () => {
        (Object.assign(gapState, { q: '', region: '', min: 0, growing: !1, unknown: !1, all: !1 }), (e.value = ''), drawMarkets());
      }),
      E.append(e, a, o, s, r, c),
      qs('.cm-gmore', n).addEventListener('click', () => {
        ((gapState.all = !gapState.all), drawMarkets());
      }));
  }
  const S = qs('.cm-gregion', n),
    L = [...new Set(g.map((t) => t.region).filter(Boolean))].sort();
  (S.options.length !== L.length + 1 && S.replaceChildren(new Option('All regions', ''), ...L.map((t) => new Option(t, t))),
    (S.value = gapState.region),
    (qs('.cm-gmin', n).value = String(gapState.min)),
    qs('.cm-ggrow', n).setAttribute('aria-pressed', String(gapState.growing)),
    qs('.cm-gunk', n).setAttribute('aria-pressed', String(gapState.unknown)));
  const A = gapState.q || gapState.region || gapState.min || gapState.growing || gapState.unknown;
  qs('.cm-gclr', n).hidden = !A;
  const N = {
      country: (t) => t.country,
      size: (t) => t[f],
      growth: (t) => t[y],
      comp: (t) => t[b],
      unknown: (t) => t.importer_unknown || 0,
    },
    M = norm(gapState.q).trim(),
    T = g.filter(
      (t) =>
        t[`stage_${p}`] < 2 &&
        t[f] > 0 &&
        (!M || norm(t.country).includes(M) || t.iso.toLowerCase() === M) &&
        (!gapState.region || t.region === gapState.region) &&
        t[f] >= gapState.min &&
        (!gapState.growing || t[y] > 0) &&
        (!gapState.unknown || t.importer_unknown > 0),
    ),
    D = N[gapState.sort] || N.size;
  T.sort((t, e) => {
    const n = D(t),
      a = D(e);
    if (null == n && null == a) return 0;
    if (null == n) return 1;
    if (null == a) return -1;
    const o = 'string' == typeof n ? n.localeCompare(a) : n - a;
    return ('asc' === gapState.dir ? o : -o) || e[f] - t[f];
  });
  const I = gapState.all ? T : T.slice(0, 25),
    P = qs('.cm-gmore', n);
  ((P.hidden = T.length <= 25), (P.textContent = gapState.all ? 'Show top 25' : `Show all ${fmt(T.length)}`));
  const B = (t, e, n, a) => {
      const o = el('span', n || null),
        s = el('button', 'cm-gs', e + (gapState.sort === t ? ('asc' === gapState.dir ? ' ↑' : ' ↓') : ''));
      return (
        (s.type = 'button'),
        gapState.sort === t && s.setAttribute('aria-sort', 'asc' === gapState.dir ? 'ascending' : 'descending'),
        (s.title = `Sort by ${e.toLowerCase()}`),
        s.addEventListener('click', () => {
          (gapState.sort === t ? (gapState.dir = 'asc' === gapState.dir ? 'desc' : 'asc') : ((gapState.sort = t), (gapState.dir = a)),
            drawMarkets());
        }),
        o.append(s),
        o
      );
    },
    O = el('div', 'cm-grow h');
  (O.append(
    el('span'),
    B('country', 'Country', null, 'asc'),
    B('size', `${m} imports`, null, 'desc'),
    B('growth', 'Growth', null, 'desc'),
    B('comp', 'Competitors', 'x', 'asc'),
    B('unknown', 'No known importer', 'x', 'desc'),
  ),
    x.append(O),
    T.length || x.append(el('div', 'cm-empty', A ? 'No markets match these filters.' : 'No untouched markets with import data.')),
    I.forEach((t) => {
      const n = `iso=${enc(t.iso)}`,
        l = el('div', 'cm-grow');
      ((l.dataset.openIso = t.iso),
        (l.title = `Open ${t.country}`),
        (l.tabIndex = 0),
        l.addEventListener('keydown', (e) => {
          'Enter' === e.key && window.cmOpenCountry(t.iso);
        }),
        l.append(
          el('span', null, flag(t.iso)),
          mark(el('span', 'c', t.country), 'country_matrix', 'country', n),
          mark(el('span', 'num', money(t[f])), 'country_matrix', f, n),
          mark(el('span', 'num', pct(t[y])), 'country_matrix', y, n),
          mark(el('span', 'num x', fmt(t[b])), 'country_matrix', b, n),
          mark(el('span', 'mut x', t.importer_unknown ? t.importer_unknown_brands : '—'), 'country_matrix', 'importer_unknown_brands', n),
        ),
        x.append(l));
    }));
  const H = [30, 60, 90].includes(Number(dash.params().stale)) ? Number(dash.params().stale) : 30;
  qs('.cm-stale-days', n).replaceChildren(
    ...[30, 60, 90].map((t) => {
      const e = el('button', 'cm-chip', `${t}+ days`);
      return (
        (e.type = 'button'),
        e.setAttribute('aria-pressed', String(t === H)),
        e.addEventListener('click', () => dash.setParams({ stale: t })),
        e
      );
    }),
  );
  const R = dash.data('pipeline_stages'),
    j = qs('.cm-stale', n);
  if ((j.replaceChildren(), j.classList.toggle('dash-skeleton', 'loading' === R.status), 'error' === R.status)) failLine(j);
  else if ('ok' === R.status) {
    const a = Date.now(),
      o = R.data
        .map((t) => ({ r: t, ago: t.last_interaction ? Math.round((a - new Date(t.last_interaction)) / 864e5) : null }))
        .filter(({ r: t, ago: e }) => t[`stage_${p}`] >= 3 && t[`stage_${p}`] <= 5 && (null == e || e >= H))
        .sort((t, e) => e.r[`stage_${p}`] - t.r[`stage_${p}`] || (e.ago ?? 9999) - (t.ago ?? 9999));
    qs('.cm-stale-hint', n).textContent =
      `${fmt(o.length)} companies engaged, interested or negotiating with ${u.label}, with no activity for ${H}+ days.`;
    const d = new Map(rowsOf('countries').map((t) => [t.iso, t.country]));
    (o.slice(0, 40).forEach(({ r: t, ago: e }) => {
      const n = `id=${enc(t.id)}`,
        a = el('div', 'cm-srow'),
        o = el('button', 'cm-co pn', t.company);
      ((o.type = 'button'),
        (o.dataset.openCompany = t.id),
        mark(o, 'pipeline_stages', 'company', n),
        a.append(
          o,
          mark(el('span', 'cm-tag', t[u.field] || STAGE[t[`stage_${p}`]]), 'pipeline_stages', u.field, n),
          el(
            'span',
            'pm',
            `${flag(t.iso)} ${d.get(t.iso) || ''} · ${null == e ? 'no contact logged' : `${e} days since last contact`}`.trim(),
          ),
        ),
        j.append(a));
    }),
      o.length || j.append(el('div', 'cm-empty', 'Nothing stale — every active lead was touched recently.')));
  }
  const G = dash.params().cmpA || 'B. Braun',
    U = dash.params().cmpB || 'Johnson & Johnson (DePuy Synthes)',
    K = qs('.cm-cmp-a', n),
    W = qs('.cm-cmp-b', n);
  (document.activeElement !== K && (K.value = G), document.activeElement !== W && (W.value = U));
  const z = qs('.cm-cmp', n),
    q = qs('.cm-cmp-shared', n);
  if ((z.replaceChildren(), q.replaceChildren(), 'ok' === R.status)) {
    const a = (t, e) => t.brands && t.brands.split('|').includes(e),
      o = d3
        .rollups(
          R.data.filter((t) => t.iso && (a(t, G) || a(t, U))),
          (t) => ({ a: t.filter((t) => a(t, G)).length, b: t.filter((t) => a(t, U)).length, both: t.filter((t) => a(t, G) && a(t, U)) }),
          (t) => t.iso,
        )
        .sort((t, e) => e[1].a + e[1].b - (t[1].a + t[1].b)),
      d = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
      p = d3.sum(o, (t) => t[1].a),
      u = d3.sum(o, (t) => t[1].b),
      m = o.flatMap((t) => t[1].both);
    qs('.cm-cmp-sum', n).textContent =
      `${G}: ${fmt(p)} distributors in ${fmt(o.filter((t) => t[1].a).length)} countries · ${U}: ${fmt(u)} in ${fmt(o.filter((t) => t[1].b).length)} · ${fmt(m.length)} carry both.`;
    const h = d3.max(o, (t) => Math.max(t[1].a, t[1].b)) || 1,
      g = el('div', 'cm-crow h');
    if (
      (g.append(el('span'), el('span', null, 'Country'), el('span', 'ta', G), el('span', 'tb', U), el('span', null, 'Both')),
      z.append(g),
      o.slice(0, 20).forEach(([t, n]) => {
        const a = el('div', 'cm-crow');
        ((a.dataset.openIso = t), (a.title = `Open ${d.get(t) || t}`));
        const o = (t, n) => {
          const a = el('span', 'cb'),
            o = el('i');
          return ((o.style.width = (t / h) * 100 + '%'), (o.style.background = n), a.append(o, el('em', null, t ? fmt(t) : '—')), a);
        };
        (a.append(
          el('span', null, flag(t)),
          el('span', 'c', d.get(t) || t),
          o(n.a, dash.colors[0]),
          o(n.b, dash.colors[1]),
          el('span', 'num', n.both.length ? fmt(n.both.length) : '—'),
        ),
          z.append(a));
      }),
      o.length || z.append(el('div', 'cm-empty', 'Neither brand appears in NetHunt yet.')),
      m.length)
    ) {
      q.append(el('div', 'cm-fcount', 'Distributors carrying both'));
      const t = el('div', 'who');
      (m.slice(0, 30).forEach((e) => {
        const n = el('button', 'cm-co', `${flag(e.iso)} ${e.company}`);
        ((n.type = 'button'), (n.dataset.openCompany = e.id), mark(n, 'pipeline_stages', 'company', `id=${enc(e.id)}`), t.append(n));
      }),
        q.append(t));
    }
  }
}
onData(() => {
  const n = curView();
  ('brand' === n && ensureBrandView(),
    'company' === n && ensureCompanyView(),
    'markets' === n && ensureMarketsView(),
    qs('#markets-view').classList.toggle('cm-hidden', 'markets' !== n),
    qs('#tenders-view').classList.toggle('cm-hidden', 'tenders' !== n),
    qs('#sources-view').classList.toggle('cm-hidden', 'sources' !== n),
    qs('#congress-view').classList.toggle('cm-hidden', 'congresses' !== n),
    qs('#trip-view').classList.toggle('cm-hidden', 'trips' !== n),
    qs('#home-view').classList.toggle('cm-hidden', 'home' !== n),
    'home' === n && window.__cm2 && window.__cm2.drawHome(),
    'trips' === n && window.__cm2 && window.__cm2.drawTripPage(),
    'congresses' === n && window.__cm2 && window.__cm2.drawCongressPage(),
    'sources' === n && ensureSourcesView(),
    'tenders' === n && ensureTendersView(),
    qs('#country-view').classList.toggle('cm-hidden', 'country' !== n),
    qs('#brand-view').classList.toggle('cm-hidden', 'brand' !== n),
    qs('#company-view').classList.toggle('cm-hidden', 'company' !== n),
    (function () {
      const e = curView(),
        n = rowsOf('countries').find((t) => t.iso === dash.params().iso),
        a = 'markets' === e || 'tenders' === e || 'sources' === e || 'congresses' === e || 'trips' === e || 'home' === e;
      document.querySelectorAll('[data-goto]').forEach((t) => {
        const e = t.dataset.goto === (a ? 'markets' : 'country');
        (t.setAttribute('aria-selected', String(e)), t.setAttribute('aria-pressed', String(e)));
      });
      const o = qs('.cm-goto-markets'),
        r = MARKET_PAGES[a ? e : 'home'];
      ((o.textContent = `${r[0]} ${r[1]}`),
        o.append(el('span', 'cm-caret', '▾')),
        (o.title = a ? 'Home, Markets, Tenders, Congresses, Trips or Sources' : 'Open Home (double-click for all pages)'));
      const c = qs('.cm-goto-country');
      ((c.textContent = multiIsos()
        ? `${'My trip' === dash.params().glabel ? '🧳' : '🌍'} ${dash.params().glabel || `${multiIsos().length} countries`}`
        : n
          ? `${flag(n.iso)} ${n.country}`.trim()
          : 'Country'),
        c.append(el('span', 'cm-caret', '▾')),
        c.setAttribute('aria-haspopup', 'listbox'),
        (c.title = n
          ? 'country' === e
            ? 'Choose another country'
            : `Open ${n.country} (double-click to choose another)`
          : 'Choose a country'));
      const d = oursKey();
      !(function (e, n) {
        const a = qs('.cm-crumbs');
        if ((a.replaceChildren(), 'markets' === e || 'tenders' === e || 'sources' === e || 'congresses' === e || 'trips' === e || 'home' === e)) return;
        const o = dash.params(),
          r = [
            [
              '🌍 Markets',
              () => {
                (ensureMarketsView(), dash.setParams({ view: 'markets' }), dash.setLink('markets'));
              },
            ],
          ],
          c = 'company' === e ? window.cmCompanyIso || o.iso : ('brand' === e && o.bcountry) || o.iso,
          d = rowsOf('countries').find((t) => t.iso === c) || n;
        if (
          ('country' === e && multiIsos() ? r.push([`🌍 ${o.glabel || `${multiIsos().length} countries`}`, 'pick']) : d && r.push([`${flag(d.iso)} ${d.country}`.trim(), 'country' === e ? 'pick' : () => window.cmOpenCountry(d.iso)]),
          'brand' === e && r.push([o.brand, null]),
          'company' === e)
        ) {
          'brand' === o.from &&
            o.brand &&
            r.push([
              o.brand,
              () => {
                (dash.setParams({ view: 'brand' }), dash.setLink('brand'));
              },
            ]);
          const t = rowsOf('company_record').find((t) => 'Name' === t.field);
          r.push([t ? t.value : 'Company', null]);
        }
        r.forEach(([t, e], n) => {
          if ((n && a.append(el('span', null, '›')), 'pick' === e)) {
            const e = el('button', 'cur', t);
            ((e.type = 'button'),
              (e.title = 'Choose another country'),
              e.setAttribute('aria-haspopup', 'listbox'),
              e.append(el('span', 'cm-caret', '▾')),
              e.addEventListener('click', () => window.cmPickCountry(e)),
              a.append(e));
          } else if (e) {
            const n = el('button', null, t);
            ((n.type = 'button'), n.addEventListener('click', e), a.append(n));
          } else a.append(el('span', 'cur', t));
        });
      })(e, n);
      const p = qs('.cm-ours-btn');
      (p.replaceChildren(withLogo(d, OURS[d].label)),
        p.append(el('span', 'cm-caret', '▾')),
        p.setAttribute('aria-pressed', String(onPartners())),
        (p.title = onPartners()
          ? 'Switch company'
          : n
            ? `Open ${OURS[d].label}’s best partners in ${n.country} (double-click to switch company)`
            : 'Switch company'));
    })(),
    'brand' === n
      ? (function () {
          const n = qs('#brand-view'),
            o = dash.params().brand,
            p = rowsOf('brand_profiles').find((t) => t.brand === o) || {},
            u = new Map(rowsOf('countries').map((t) => [t.iso, t.country]));
          ((qs('.cm-bflag', n).textContent = flag(p.home_iso) || '🏷️'),
            (qs('.cm-bname', n).textContent = o),
            (qs('.cm-bsub', n).textContent = [
              p.home_iso ? `Home: ${u.get(p.home_iso) || p.home_iso}` : null,
              p.tier && 'Other' !== p.tier ? p.tier : null,
              p.full_name && p.full_name !== o ? p.full_name : null,
            ]
              .filter(Boolean)
              .join(' · ')));
          let m = qs('.cm-segpills', n);
          (m || ((m = el('div', 'cm-segpills')), qs('.cm-bsub', n).after(m)),
            m.replaceChildren(
              ...String(p.segments || '')
                .split('|')
                .filter(Boolean)
                .map((t) => mark(el('span', 'cm-tag', t), 'brand_profiles', 'segments', `brand=${enc(o)}`)),
            ));
          const h = qs('.cm-bnote', n);
          (h.replaceChildren(),
            p.note && h.append(mark(el('span', null, p.note), 'brand_profiles', 'note', `brand=${enc(o)}`)),
            (qs('.cm-bq', n).textContent = p.crm_q1
              ? `Brand field contains “${p.crm_q1}”${p.crm_q2 && p.crm_q2 !== p.crm_q1 ? ` or “${p.crm_q2}”` : ''}`
              : `Brand field contains “${String(o).toLowerCase()}”`));
          const g = dash.data('brand_kpis'),
            f = 'ok' === g.status ? g.data[0] : null;
          ['companies', 'countries'].forEach((a) => {
            const o = qs(`[data-source="brand_kpis"][data-field="${a}"]`, n);
            ((o.textContent = f ? fmt(f[a]) : '—'), o.classList.toggle('dash-skeleton', 'loading' === g.status));
          });
          const y = rowsOf('footprint_by_brand').find((t) => t.brand === o),
            b = rowsOf('footprint_by_brand').find((t) => t.brand === o);
          ([qs('.cm-bmk', n), qs('.cm-bval', n)].forEach((t) => {
            b
              ? ((t.dataset.source = 'footprint_by_brand'), t.setAttribute('data-where', `brand=${enc(o)}`))
              : (t.removeAttribute('data-where'), t.removeAttribute('data-source'));
          }),
            (qs('.cm-bmk', n).textContent = y ? fmt(y.markets) : '—'),
            (qs('.cm-bval', n).textContent = y && y.tracked_exports_usd ? money(y.tracked_exports_usd) : '—'));
          const v = qs('.cm-plist', n),
            w = dash.data('brand_by_country');
          if ((v.classList.toggle('dash-skeleton', 'loading' === w.status), 'error' === w.status)) failLine(v);
          else {
            const t = rowsOf('competitor_footprint').filter((t) => t.brand === o),
              n = new Map(rowsOf('market_intel').map((t) => [t.iso, t])),
              d = new Map();
            (rowsOf('brand_by_country').forEach((t) => d.set(t.iso, { iso: t.iso, crm: t.companies, t: null })),
              t.forEach((t) => {
                const e = d.get(t.iso) || { iso: t.iso, crm: 0, t: null };
                ((e.t = t), d.set(t.iso, e));
              }));
            const p = [...d.values()].sort(
                (t, e) => e.crm - t.crm || ((t.t && t.t.export_rank) || 999) - ((e.t && e.t.export_rank) || 999),
              ),
              m = el('div', 'cm-prow h');
            m.append(
              el('span'),
              el('span', null, 'Country'),
              el('span', null, 'Importers'),
              el('span', null, 'Tracked exports'),
              el('span', 'x', 'Next Shoulder there'),
            );
            const h = new Map();
            rowsOf('countries').forEach((t) =>
              String(t.crm_tags)
                .toLowerCase()
                .split('|')
                .forEach((e) => h.set(e, t.iso)),
            );
            const g = new Map();
            (rowsOf('brand_companies').forEach((t) =>
              new Set(
                String(t.country)
                  .toLowerCase()
                  .split(' | ')
                  .map((t) => h.get(t))
                  .filter(Boolean),
              ).forEach((e) => {
                (g.has(e) || g.set(e, []), g.get(e).push(t));
              }),
            ),
              v.replaceChildren(m),
              'ok' !== w.status || p.length || v.append(el('div', 'cm-empty', 'No NetHunt companies or tracked exports for this brand.')),
              p.forEach((t) => {
                const l = el('div', 'cm-prow' + (dash.params().bcountry === t.iso ? ' sel' : ''));
                ((l.dataset.buyersIso = t.iso), (l.title = `See who buys it in ${u.get(t.iso) || t.iso}`));
                const d = n.get(t.iso) || {},
                  p = t.crm
                    ? mark(
                        el('span', 'cm-imp' + (t.crm > 1 ? ' multi' : ''), t.crm > 1 ? `${fmt(t.crm)} importers` : '1 importer'),
                        'brand_by_country',
                        'companies',
                        `iso=${enc(t.iso)}`,
                      )
                    : el('span', 'mut', t.t ? 'Not in NetHunt' : '—');
                t.crm &&
                  hoverList(p, () => ({
                    title: `${o} · importers in ${u.get(t.iso) || t.iso}`,
                    items: (g.get(t.iso) || [])
                      .map((t) => ({ id: t.id, label: t.company, sub: t.city || t.status || '' }))
                      .sort((t, e) => t.label.localeCompare(e.label)),
                  }));
                const m = el('span');
                t.t
                  ? m.append(
                      mark(
                        el('span', null, t.t.export_rank ? `#${t.t.export_rank}` : 'Present'),
                        'competitor_footprint',
                        'export_rank',
                        `brand=${enc(o)}&iso=${enc(t.iso)}`,
                      ),
                      t.t.export_value_usd ? el('span', 'mut', ` · ${money(t.t.export_value_usd)}`) : '',
                    )
                  : m.append(el('span', 'mut', '—'));
                const h = d.next_status
                    ? mark(
                        el('span', 'mut x', d.target_tier ? `${d.next_status} · ${d.target_tier}` : d.next_status),
                        'market_intel',
                        'next_status',
                        `iso=${enc(t.iso)}`,
                      )
                    : el('span', 'mut x', '—'),
                  f = el('span', 'c', u.get(t.iso) || t.iso),
                  y = el('button', 'go', 'Open country ↗');
                ((y.type = 'button'), (y.dataset.openIso = t.iso));
                const b = el('span');
                (b.append(f, y), l.append(el('span', null, flag(t.iso)), b, p, m, h));
                const w = g.get(t.iso) || [];
                if (w.length) {
                  const t = el('div', 'who'),
                    e = impMap();
                  (w.sort((t, n) => ((e.get(n.id) || {}).import_value_usd || 0) - ((e.get(t.id) || {}).import_value_usd || 0)),
                    w.slice(0, 6).forEach((n) => {
                      const o = (e.get(n.id) || {}).import_value_usd,
                        s = mark(
                          el('button', 'cm-co', o ? `${n.company} (${money(o)})` : n.company),
                          'brand_companies',
                          'company',
                          `id=${enc(n.id)}`,
                        );
                      ((s.type = 'button'), (s.dataset.openCompany = n.id), t.append(s));
                    }),
                    w.length > 6 && t.append(el('span', null, `+${w.length - 6} more`)),
                    l.append(t));
                }
                v.append(l);
              }));
          }
          const _ = dash.data('brand_cobrands'),
            $ = qs('.cm-colist', n);
          ($.classList.toggle('dash-skeleton', 'loading' === _.status),
            'error' === _.status
              ? failLine($)
              : barList($, ('ok' === _.status ? _.data : []).filter((t) => t.brand !== o).slice(0, 10), 'brand', {
                  flag: !0,
                  link: !0,
                  src: 'brand_cobrands',
                  color: dash.colors[1],
                }),
            (function (e, n, a, o = {}) {
              const s = qs('.cm-bstatus');
              if (!s) return;
              const r = dash.data(e);
              if ((s.classList.toggle('dash-skeleton', 'loading' === r.status), 'error' === r.status)) return failLine(s);
              barList(s, 'ok' === r.status ? r.data.slice(0, o.limit || 10) : [], a, { color: dash.colors[2], src: e, ...o });
            })('brand_by_status', 0, 'status'),
            (function () {
              const n = qs('#brand-view'),
                a = qs('.cm-buyers', n);
              if (!a) return;
              const o = dash.data('brand_companies'),
                p = dash.params().brand,
                u = tagIsoMap(),
                m = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
                h = 'ok' === o.status ? o.data : [],
                g = new Map();
              h.forEach((t) => isosOf(t, u).forEach((t) => g.set(t, (g.get(t) || 0) + 1)));
              let f = dash.params().bcountry;
              'ok' !== o.status || (f && g.has(f)) || (f = [...g].sort((t, e) => e[1] - t[1])[0]?.[0] || null);
              const y = qs('.cm-bcsel', n);
              if (
                (y.replaceChildren(
                  ...[...g]
                    .sort((t, e) => String(m.get(t[0])).localeCompare(String(m.get(e[0]))))
                    .map(([t, n]) => new Option(`${flag(t)} ${m.get(t) || t} (${fmt(n)})`.trim(), t)),
                ),
                f && (y.value = f),
                (qs('.cm-btitle', n).textContent = f ? `Who buys ${p} in ${flag(f)} ${m.get(f) || f}`.replace('  ', ' ') : `Who buys ${p}`),
                a.classList.toggle('dash-skeleton', 'loading' === o.status),
                a.replaceChildren(),
                'error' === o.status)
              )
                return failLine(a);
              if ('ok' !== o.status) return;
              if (!f) return void a.append(el('div', 'cm-empty', 'No NetHunt company carries this brand yet.'));
              const b = impMap(),
                v = new Map(
                  rowsOf('tender_awards')
                    .filter((t) => t.nethunt_id)
                    .map((t) => [t.nethunt_id, t]),
                ),
                w = h
                  .filter((t) => isosOf(t, u).has(f))
                  .sort(
                    (t, e) =>
                      ((b.get(e.id) || {}).import_value_usd || 0) - ((b.get(t.id) || {}).import_value_usd || 0) ||
                      String(t.company).localeCompare(String(e.company)),
                  );
              for (const t of w) {
                const e = el('div', 'cm-buyer'),
                  n = b.get(t.id),
                  o = v.get(t.id);
                if (n || o) {
                  const t = el('div', 'lvl');
                  if ((n && t.append(impTag(n), el('span', 'bm', impLevel(n.import_value_usd))), o)) {
                    const e = mark(
                      el('span', 'cm-imp multi', `Tender winner ${tenderVal(o)}`),
                      'tender_awards',
                      null != o.value_usd ? 'value_usd' : 'value_local',
                      `id=${enc(o.id)}`,
                    );
                    ((e.title = `${o.awards || ''} public awards · ${o.source}`), t.append(e));
                  }
                  e.append(t);
                }
                const s = mark(el('button', 'cm-co bn', t.company), 'brand_companies', 'company', `id=${enc(t.id)}`);
                ((s.type = 'button'), (s.dataset.openCompany = t.id), (s.title = 'Open company profile'), e.append(s));
                const l = [t.city, t.category].filter(Boolean).join(' · ');
                (l && e.append(el('span', 'bm', l)),
                  t.status && e.append(mark(el('span', 'cm-pill', t.status), 'brand_companies', 'status', `id=${enc(t.id)}`)));
                const d = brandNames(t.brands).filter((t) => t !== p);
                if (d.length) {
                  const t = el('span', 'ba');
                  (t.append(el('b', null, 'Also carries: '), d.slice(0, 6).join(', ') + (d.length > 6 ? ' +' + (d.length - 6) : '')),
                    e.append(t));
                }
                a.append(e);
              }
            })(),
            (function (e) {
              const n = qs('#brand-view'),
                a = qs('.cm-bregs', n);
              if (!a) return;
              const o = dash.data('registrations');
              if ((a.replaceChildren(), a.classList.toggle('dash-skeleton', 'loading' === o.status), 'error' === o.status))
                return failLine(a);
              const l = ('ok' === o.status ? o.data : []).filter((t) => t.brand === e);
              ((qs('#brand-regs').hidden = 'ok' === o.status && !l.length),
                d3
                  .rollups(
                    l,
                    (t) => t,
                    (t) => t.company,
                  )
                  .sort((t, e) => e[1].length - t[1].length)
                  .slice(0, 12)
                  .forEach(([t, e]) => {
                    const n = e[0],
                      o = el('div', 'cm-tw');
                    let l;
                    (n.nethunt_id
                      ? ((l = el('button', 'cm-co nm', t)), (l.type = 'button'), (l.dataset.openCompany = n.nethunt_id))
                      : (l = el('span', 'nm', t)),
                      mark(l, 'registrations', 'company', `id=${enc(n.id)}`));
                    const d = el('div', 'sub');
                    (d.append(`${flag(n.country_iso)} ${[...new Set(e.map((t) => t.segment))].join(', ')} · ${n.authority}`),
                      n.nethunt_id || (d.append(' '), d.append(el('span', 'new', 'Not in NetHunt'))),
                      o.append(
                        el('span', 'rk', flag(n.country_iso)),
                        l,
                        el('span', 'v', `${e.length} device${1 === e.length ? '' : 's'}`),
                        d,
                      ),
                      a.append(o));
                  }));
            })(o),
            drawBrandTable());
        })()
      : 'company' === n
        ? (function () {
            const n = qs('#company-view'),
              o = dash.data('company_record'),
              p = 'ok' === o.status ? o.data : [],
              u = new Map(p.map((t) => [t.field, t.value])),
              m = new Set(['Record id', 'Name']),
              h = (t) => `field=${enc(t)}`,
              g = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
              f = tagIsoMap(),
              y =
                [
                  ...new Set(
                    String(u.get('Country') || '')
                      .toLowerCase()
                      .split('\n')
                      .map((t) => f.get(t.trim()))
                      .filter(Boolean),
                  ),
                ][0] || null;
            window.cmCompanyIso = y;
            const b = (t) => (t ? d3.utcFormat('%b %-d, %Y')(new Date(t)) : '—');
            ((qs('.cm-cname', n).textContent = u.get('Name') || ('loading' === o.status ? '—' : 'Company')),
              qs('.cm-cname', n).classList.toggle('dash-skeleton', 'loading' === o.status),
              (qs('.cm-cflag', n).textContent = flag(y) || '🏢'));
            const v = qs('.cm-csub', n);
            v.replaceChildren();
            const w = [u.get('City') ? String(u.get('City')).replace(/\n/g, ', ') : null, u.get('Category') || null].filter(Boolean);
            if (y) {
              const t = el('button', 'cm-co', g.get(y) || y);
              ((t.type = 'button'), (t.dataset.openIso = y), v.append(t));
            }
            (['City', 'Category'].forEach((t) => { // the value with a small ✎ next to it; “＋ city” when it's missing
                const val = u.get(t) ? String(u.get(t)).replace(/\n/g, ', ') : ''; if (val) { v.childNodes.length && v.append(' · '); v.append(val); }
                if (editable(t)) { const e = fieldEditBtn(t, u.get(t), dash.params().cid, u.get('Name') || 'company'); if (!val) { e.textContent = `＋ ${t.toLowerCase()}`; e.classList.add('cm-edadd'); } v.append(e); }
              }),
              ['City', 'Category', 'Country'].forEach((t) => m.add(t)));
            { const ad = String(u.get('Address') || '').trim(); if (ad && ad !== '0') { const t = el('div', 'cm-caddr', `📍 ${ad.replace(/\n/g, ', ')}`); v.append(t); } }
            m.add('Related companies');
            try { v.append(window.__cm2.relatedLine(dash.params().cid, u)); } catch { /* part 2 still loading */ }
            const _ = qs('.cm-cpills', n);
            _.replaceChildren(
              ...['Status', 'NEXT Status', 'Motion Status', 'Drip status']
                .filter((t) => u.get(t) || 'Drip status' !== t)
                .map((t) => {
                  if ((m.add(t), 'Drip status' === t))
                    return mark(el('span', 'cm-tag', `${t}: ${u.get(t)}`), 'company_record', 'value', h(t));
                  const e = el('button', 'cm-tag', `${t}: ${u.get(t) || '—'}`);
                  return (
                    (e.dataset.prefix = `${t}: `),
                    editableStatus(e, dash.params().cid, u.get('Name') || 'company', t, u.get(t) || ''),
                    mark(e, 'company_record', 'value', h(t))
                  );
                }),
            );
            {
              const t = u.get('Last Interaction Date'),
                e = t ? Math.round((Date.now() - new Date(t)) / 864e5) : null;
              _.append(
                mark(
                  contactChip(e, t, {
                    __id: dash.params().cid,
                    emails_total: u.get('Total Emails'),
                    emails_sent: u.get('Total Emails Sent'),
                    email_opens: u.get('Email Open Count'),
                    calls_total: u.get('Total Calls'),
                    last_call: u.get('Last Call'),
                  }),
                  'company_record',
                  'value',
                  h('Last Interaction Date'),
                ),
              );
            }
            {
              const t = u.get('Next follow-up'),
                e = followPill(t ? new Date(Number(t) || t).toISOString().slice(0, 10) : null, u.get('Next step'));
              e && _.append(mark(e, 'company_record', 'value', h('Next follow-up')));
            }
            {
              const t = meetingTag(dash.params().cid);
              t && _.append(t);
              const e = dealTag(dash.params().cid);
              e && _.append(e);
            }
            !(function (e, n) {
              const o = qs('.cm-cdeals');
              if (!o) return;
              o.replaceChildren();
              const s = dash.data('deals');
              if ('loading' === s.status) return void o.append(el('div', 'hint', 'Loading deals…'));
              if ('error' === s.status) return void o.append(el('div', 'cm-fail', 'Deals didn’t load'));
              const r = dealsFor(e).sort(
                (t, e) => dealOpen(e) - dealOpen(t) || String(e.close_date || '').localeCompare(String(t.close_date || '')),
              );
              r.length
                ? r.forEach((t) => {
                    const s = el('div', 'cm-deal'),
                      r = el('span', 'dn', t.name),
                      c = el('span', 'da', t.amount ? money(t.amount) : '—'),
                      l = el('div', 'dm'),
                      d = el('button', 'cm-dstage ' + (/won/i.test(t.stage) ? 'won' : /lost/i.test(t.stage) ? 'lost' : ''), t.stage || '—');
                    ((d.type = 'button'),
                      (d.title = 'Change stage'),
                      d.addEventListener('click', () =>
                        openMenu(
                          d,
                          DEAL_STAGES.map((e) => ({
                            label: e,
                            on: e === t.stage,
                            act: async () => {
                              try {
                                (await nhCall('update_record', {
                                  folderId: NH_DEALS,
                                  recordId: t.id,
                                  fieldKeys: 'label',
                                  fields: { Stage: e },
                                }),
                                  say(`✓ ${t.name} → ${e}`),
                                  dash.refresh('deals'));
                              } catch (t) {
                                say(`Not saved — ${nhErr(t)}`, !0);
                              }
                            },
                          })),
                        ),
                      ),
                      l.append(d),
                      t.probability && l.append(`${Math.round(100 * t.probability)}% likely`),
                      t.close_date && l.append(`close ${t.close_date}`),
                      t.category && l.append(t.category),
                      null != t.days_in_stage && l.append(`${t.days_in_stage} days in stage`));
                    const p = el('button', 'cm-ed', '✎ edit');
                    ((p.type = 'button'),
                      (p.style.opacity = '1'),
                      p.addEventListener('click', () => openDealEditor(p, t, e, n)),
                      l.append(p),
                      s.append(r, c, l),
                      t.next_steps && s.append(el('div', 'dx', `➜ ${t.next_steps}`)),
                      t.description && s.append(el('div', 'dx mut', t.description)),
                      o.append(s));
                  })
                : o.append(
                    el(
                      'div',
                      'hint',
                      'No deals yet. Create one when a distributor shows real interest — products, expected volume and next step.',
                    ),
                  );
            })(dash.params().cid, u.get('Name') || 'company');
            {
              const e = qs('.cm-cqa', n);
              e.replaceChildren(nethuntLink(dash.params().cid, u.get('Name')));
              {
                const cid = dash.params().cid, sb = el('button', 'cm-qi note'); sb.type = 'button'; sb.innerHTML = ICON_NOTE; sb.title = 'Summary: notes, calls & comments'; sb.setAttribute('aria-label', 'Summary');
                hoverList(sb, () => { dash.params().ncid !== cid && dash.setParams({ ncid: cid }); const E2 = rowsOf('companies').find((x) => x.id === cid) || { id: cid, notes: u.get('Notes'), update: u.get('Update'), next_step: u.get('Next step'), next_followup: u.get('Next follow-up'), last_interaction: u.get('Last Interaction Date') }; const k2 = oursKey(); const o2 = rowsOf('partners').find((x) => x.id === cid) || { id: cid, company: u.get('Name') || 'Company', [`status_${OURS[k2].all ? 'all' : k2}`]: u.get(STATUS_FIELD[OURS[k2].all ? 'next' : k2]) }; return { title: 'Summary', node: notesNode(E2, o2, OURS[k2].all ? 'next' : k2), refresh: !0 }; }, { keepClick: !0 });
                e.append(sb);
              }
              {
                const t = el('button', 'cm-qi cat');
                ((t.type = 'button'),
                  (t.innerHTML = ICON_CAT),
                  (t.title = 'Send catalogue (PDF)'),
                  t.setAttribute('aria-label', 'Send catalogue'),
                  t.addEventListener('click', () => sendCatalog(t, dash.params().cid, u.get('Name') || 'company')),
                  e.append(t));
              }
              const a = (t) =>
                  String(u.get(t) || '')
                    .split(/\n| \| /)
                    .map((t) => t.trim())
                    .filter(Boolean),
                o = a('Phone number').filter(goodPhone),
                s = a('Email');
              if (o.length) {
                const t = cmCallBtn('Call');
                (hoverList(
                  t,
                  () => {
                    const n = el('div');
                    (n.append(cmLogRow(dash.params().cid, u.get('Name') || 'company')), o.forEach((e) => n.append(contactLine(e, 'Company line', { phones: [e], emails: [] }))));
                    const a = o.find(waOk);
                    return (a && n.append(templateBar({ company: u.get('Name'), brands: u.get('Brand'), iso: window.cmCompanyIso }, a, 'wa')), { title: 'Phone', node: n });
                  },
                  { keepClick: !0 },
                ),
                  e.append(t));
              }
              if (s.length) {
                const t = iconLink('mail', ICON_MAIL, gmailHref(s[0]), `Email ${s[0]} in Gmail`, !0);
                (hoverList(
                  t,
                  () => {
                    const pc = dash.data('company_contacts'), ppl = 'ok' === pc.status ? pc.data.flatMap((x) => splitBar(x.email || x.emails)) : [];
                    return { title: 'Email', node: emailPanel({ company: u.get('Name'), brands: u.get('Brand'), iso: window.cmCompanyIso }, [...s, ...ppl]) };
                  },
                  { keepClick: !0 },
                ),
                  e.append(t));
              }
              const c = String(u.get('Website') || '').trim();
              (!c ||
                /^not found$/i.test(c) ||
                '0' === c ||
                /(linkedin|facebook|instagram|youtube|twitter|x)\.com\//i.test(c) ||
                e.append(iconLink('web', ICON_WEB, /^https?:/i.test(c) ? c : `https://${c}`, `Website: ${c}`, !0)),
                e.append(
                  mapsLink(u.get('Name'), u.get('City'), (countryOfIso(window.cmCompanyIso) || {}).country, u.get('Google Maps'), dash.params().cid),
                ));
              const l = socialLinks({
                linkedin: u.get('LinkedIn'),
                facebook: u.get('Facebook'),
                instagram: u.get('Instagram'),
                twitter: u.get('Twitter'),
                website: u.get('Website'),
              });
              (l.length && e.childNodes.length && e.append(el('span', 'sepq')), l.forEach(([t, n, a, o]) => e.append(iconLink(t, n, a, o, !0))));
            }
            const $ = qs('.cm-cfresh', n);
            ($.replaceChildren(),
              'ok' === o.status
                ? $.append(
                    'Live from NetHunt · record last updated ',
                    mark(el('b', null, b(u.get('Last updated in NetHunt'))), 'company_record', 'value', h('Last updated in NetHunt')),
                    ' · last interaction ',
                    mark(el('b', null, b(u.get('Last Interaction Date'))), 'company_record', 'value', h('Last Interaction Date')),
                    ' · added ',
                    mark(el('b', null, b(u.get('Created in NetHunt'))), 'company_record', 'value', h('Created in NetHunt')),
                  )
                : 'error' === o.status && ($.textContent = 'Couldn’t load this company from NetHunt.'),
              ['Last updated in NetHunt', 'Last Interaction Date', 'Created in NetHunt'].forEach((t) => m.add(t)));
            const k = qs('.cm-ckpis', n);
            (k.replaceChildren(),
              [
                ['Total Emails', 'Emails'],
                ['Total Emails Sent', 'Emails sent'],
                ['Total Calls', 'Calls'],
                ['Time in Status', 'Days in current status'],
                ['Employees', 'Employees'],
              ].forEach(([t, n]) => {
                m.add(t);
                ['Email Open Count'].forEach((x) => m.add(x));
                const a = el('div', 'cm-kpi');
                a.append(el('span', 'lbl', n));
                const em = dash.data('company_emails'), ppl = dash.data('company_contacts');
                let s;
                if (('Total Emails' === t || 'Total Emails Sent' === t) && 'ok' === em.status) {
                  // individual emails only — campaign emails left out
                  const rows = 'Total Emails' === t ? em.data : em.data.filter((x) => 'out' === x.dir);
                  s = mark(el('span', 'val', fmt(rows.length) + (em.cut ? '+' : '')), 'company_emails');
                  a.title = 'Individual emails only (campaign emails not counted)';
                } else if ('Employees' === t) {
                  const nPeople = 'ok' === ppl.status ? ppl.data.length : 0, nField = u.has(t) ? Number(u.get(t)) || 0 : 0;
                  s = nPeople || nField ? mark(el('span', 'val', fmt(Math.max(nPeople, nField))), nPeople > nField ? 'company_contacts' : 'company_record', nPeople > nField ? null : 'value', nPeople > nField ? null : h(t)) : el('span', 'val', '—');
                  nPeople > nField && (a.title = `At least ${nPeople} — the people linked to this company in NetHunt`);
                } else
                  s = u.has(t)
                    ? mark(el('span', 'val', fmt(Number(u.get(t)))), 'company_record', 'value', h(t))
                    : el('span', 'val', '—');
                (s.classList.toggle('dash-skeleton', 'loading' === o.status), a.append(s), k.append(a));
              }));
            const C = (t) => {
                const e = String(t).trim();
                if (!e || '0' === e) return null;
                const n = /^https?:/i.test(e) ? e : /^in\//.test(e) ? `https://www.linkedin.com/${e}` : `https://${e}`,
                  a = el('a', null, e);
                return ((a.href = n), (a.target = '_blank'), (a.rel = 'noopener noreferrer'), a);
              },
              x = (t, n, a = []) => {
                if ((t.replaceChildren(), t.classList.toggle('dash-skeleton', 'loading' === o.status), 'error' === o.status))
                  return failLine(t);
                let s = 0;
                for (const [o, r] of n) {
                  if ((m.add(o), !u.has(o) || '' === u.get(o))) continue;
                  s += 1;
                  const n = mark(el('span', 'v'), 'company_record', 'value', h(o)),
                    l = String(u.get(o));
                  (a.includes(o)
                    ? l.split('\n').forEach((t, e) => {
                        const a = C(t);
                        a && (e && n.append(el('br')), n.append(a));
                      })
                    : 'Email' === o
                      ? l.split('\n').forEach((t, e) => {
                          e && n.append(el('br'));
                          const a = el('a', null, t);
                          ((a.href = gmailHref(t)),
                            (a.target = '_blank'),
                            (a.rel = 'noopener noreferrer'),
                            (a.title = 'Write in Gmail'),
                            n.append(a));
                        })
                      : (n.textContent = E.has(o)
                          ? b(l)
                          : 'Revenue' === o ||
                              ['Reverse', 'Hemi', 'Anatomic/Total', 'PFN', 'Femur Nail', 'Tibial Nail', 'Total Hip HA'].includes(o)
                            ? `$${fmt(Number(l))}`
                            : l),
                    editable(o) && n.append(fieldEditBtn(o, u.get(o), dash.params().cid, u.get('Name') || 'company')),
                    t.append(el('span', 'k', r || o), n));
                }
                'ok' !== o.status || s || t.append(el('span', 'k', 'Nothing recorded'), el('span', 'v', ''));
                {
                  const e = t.closest('.cm-card');
                  e && e.classList.toggle('is-empty', 'ok' === o.status && !s);
                }
                const r = n.map(([t]) => t).filter((t) => editable(t) && !(u.has(t) && '' !== u.get(t)));
                if ('ok' === o.status && r.length) {
                  const e = el('button', 'cm-mini cm-addf', '＋ Add info');
                  ((e.type = 'button'),
                    e.setAttribute('aria-haspopup', 'menu'),
                    e.addEventListener('click', () =>
                      (function (t, e, n, a, o) {
                        const s = e.filter((t) => editable(t) && !(n.get(t) || '').toString().trim());
                        s.length
                          ? openMenu(
                              t,
                              s.map((e) => ({ label: e, sub: (schemaOf(e) || {}).type || '', act: () => openFieldEditor(t, e, '', a, o) })),
                            )
                          : say('Every editable field here already has a value — use ✎ to change one.');
                      })(e, r, u, dash.params().cid, u.get('Name') || 'company'),
                    ),
                    t.append(e));
                }
              },
              E = new Set(['Last Call', 'Last touch date']);
            (x(
              qs('.cm-ccontact', n),
              [
                ['Website'],
                ['Google Maps'],
                ['Address'],
                ['Phone number', 'Phone'],
                ['Email', 'Emails'],
                ['LinkedIn'],
                ['Facebook'],
                ['Twitter'],
                ['Instagram'],
                ['Docs'],
              ],
              ['Website', 'Google Maps', 'LinkedIn', 'Facebook', 'Twitter', 'Docs'],
            ),
              x(qs('.cm-cpipe', n), [
                ['Manager'],
                ['Tags'],
                ['Source'],
                ['Drip batch'],
                ['Drip cycle'],
                ['Last touch sent'],
                ['Last touch date'],
                ['Reply type'],
                ['Start drip'],
                ['Last Email Sender', 'Last email from'],
                ['Last Call'],
                ['Time in next status', 'Days in NEXT status'],
                ['Import Batch'],
                ['Priority'],
              ]),
              x(qs('.cm-cprof', n), [
                ['Do you Import', 'Imports?'],
                ['Products'],
                ['Industry'],
                ['Company size'],
                ['Foundation Year', 'Founded'],
                ['Revenue'],
                ['Competitors:', 'Competitors'],
                ['How many Surgeons you work with? KOLs?', 'Surgeons / KOLs'],
                ['Registeration', 'Registration'],
                ['Insurrance', 'Insurance'],
                ['Reimbursement Time (Months)', 'Reimbursement (months)'],
                ['MM Line'],
                ['Type'],
                ['Reverse', 'Price: Reverse'],
                ['Hemi', 'Price: Hemi'],
                ['Anatomic/Total', 'Price: Anatomic/Total'],
                ['PFN', 'Price: PFN'],
                ['Femur Nail', 'Price: Femur nail'],
                ['Tibial Nail', 'Price: Tibial nail'],
                ['Total Hip HA', 'Price: Total hip HA'],
              ]),
              m.add('Brand'));
            const S = qs('.cm-cnotes', n);
            (S.replaceChildren(),
              ['Notes', 'Update'].forEach((t) => {
                if ((m.add(t), u.get(t))) {
                  const e = el('div');
                  (e.append(
                    el('span', 'k', 'Notes' === t ? 'Notes' : 'Latest update'),
                    mark(el('div', 'n', u.get(t)), 'company_record', 'value', h(t)),
                  ),
                    (e.querySelector('.k').className = 'cm-fcount'),
                    S.append(e));
                }
              }),
              'ok' !== o.status || S.children.length || S.append(el('div', 'cm-empty', 'No notes yet.')));
            const L = qs('.cm-cbrands', n);
            L.replaceChildren();
            const A = brandNames(u.get('Brand') || ''),
              N = rowsOf('brand_profiles'),
              M = rowsOf('competitor_footprint');
            'ok' !== o.status || A.length || L.append(el('div', 'cm-empty', 'No brands recorded for this company.'));
            for (const t of A) {
              const e = N.find((e) => e.brand === t) || {},
                n = M.find((e) => e.brand === t && e.iso === y),
                a = el('div', 'cm-row'),
                o = flag(e.home_iso),
                l = el('button', 'cm-blink', t);
              ((l.type = 'button'), (l.dataset.openBrand = t));
              const d = el('span', 'cm-meta'),
                p = el('button', 'cm-brm', '✕');
              ((p.type = 'button'),
                (p.title = `Remove ${t} from this company in NetHunt`),
                p.setAttribute('aria-label', `Remove ${t}`),
                p.addEventListener('click', (e) => {
                  (e.stopPropagation(),
                    openMenu(p, [
                      {
                        icon: '✕',
                        label: `Remove ${t}`,
                        sub: 'from this company in NetHunt',
                        act: async () => {
                          const e = String(u.get('Brand') || '')
                            .split('\n')
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .filter((e) => !brandNames(e).includes(t));
                          try {
                            (await nhCall('update_record', {
                              folderId: NH_FOLDER,
                              recordId: dash.params().cid,
                              fieldKeys: 'label',
                              fields: { Brand: e.length ? e : null },
                            }),
                              say(`✓ Removed ${t} in NetHunt`),
                              afterWrite(dash.params().cid));
                          } catch (t) {
                            say(`Not saved — ${nhErr(t)}`, !0);
                          }
                        },
                      },
                    ]));
                }),
                n &&
                  d.append(
                    mark(
                      el('span', 'cm-tag tr', n.export_rank ? `Export #${n.export_rank}` : 'Exports here'),
                      'competitor_footprint',
                      'export_rank',
                      `brand=${enc(t)}&iso=${enc(y)}`,
                    ),
                  ),
                a.append(el('span', 'f' + (o ? '' : ' dot'), o), l, d, p));
              const m = [e.segments ? String(e.segments).split('|').join(', ') : null, e.tier && 'Other' !== e.tier ? e.tier : null].filter(
                Boolean,
              );
              (m.length && a.append(el('div', 'cm-sub2', m.join(' · '))), L.append(a));
            }
            const D = dash.data('tender_awards'),
              I = qs('.cm-ctenders', n);
            if (
              (I.replaceChildren(),
              I.classList.toggle('dash-skeleton', 'loading' === D.status),
              portalLinks(qs('.cm-cportals', n), y),
              'error' === D.status)
            )
              failLine(I);
            else if ('ok' === D.status) {
              const t = D.data.filter((t) => t.nethunt_id === dash.params().cid);
              (t.length ||
                I.append(
                  el(
                    'div',
                    'cm-empty',
                    'No tender awards matched in the data we hold (Ecuador, Peru, Chile, Guatemala, Panama, India; Türkiye Jan–Nov 2025).' +
                      (PORTALS[y] ? ' Check the portal below to search by name.' : ''),
                  ),
                ),
                t.forEach((t) => {
                  const n = `id=${enc(t.id)}`,
                    a = el('div', 'cm-tcard');
                  (a.append(mark(el('span', 'big', tenderVal(t)), 'tender_awards', null != t.value_usd ? 'value_usd' : 'value_local', n)),
                    a.append(
                      el(
                        'span',
                        'cm-fcount',
                        [
                          t.awards ? `${fmt(t.awards)} awards` : null,
                          null != t.share_pct ? `${d3.format('.1f')(t.share_pct)}% of the country's public ortho spend` : null,
                          t.years ? `active ${t.years}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · '),
                      ),
                    ),
                    (t.niche || t.other_niches) &&
                      a.append(mark(el('span', null, [t.niche, t.other_niches].filter(Boolean).join(' · ')), 'tender_awards', 'niche', n)),
                    !t.scope ||
                      ('TR' !== t.country_iso && 'IN' !== t.country_iso) ||
                      a.append(mark(el('span', 'pm', t.scope), 'tender_awards', 'scope', n)),
                    t.top_buyers && a.append(mark(el('span', 'pm', `Top buyers: ${t.top_buyers}`), 'tender_awards', 'top_buyers', n)),
                    t.buyer_type && a.append(el('span', 'pm', t.buyer_type)));
                  const o = el('span', 'pm', `${t.source} · ${t.period}`);
                  if (t.source_url && /^https?:/.test(t.source_url)) {
                    const e = el('a', null, ' · view record');
                    ((e.href = t.source_url), (e.target = '_blank'), (e.rel = 'noopener noreferrer'), o.append(e));
                  }
                  (a.append(o), t.tax_id && a.append(el('span', 'pm', `Tax ID ${t.tax_id}`)), I.append(a));
                }));
              const n = t.length ? t.reduce((t, e) => t + (e.value_usd || 0), 0) : 0;
              if (n) { const ly = Math.max(...t.map((x) => Math.max(...String(x.years || x.period || '').match(/\d{4}/g)?.map(Number) || [0]))); const age = new Date().getFullYear() - ly;
                const tg = el('span', `cm-tag cm-twin ${age <= 2 ? 'new' : age <= 4 ? 'mid' : 'old'}`, `Tender winner · ${money(n)}${ly ? ` · last ${ly}` : ''}`); tg.title = ly ? `Last public tender won in ${ly}` : ''; _.append(mark(tg, 'tender_awards', 'value_usd')); }
            }
            const P = dash.data('registrations'),
              B = qs('.cm-cregs', n);
            if ((B.replaceChildren(), B.classList.toggle('dash-skeleton', 'loading' === P.status), 'error' === P.status)) failLine(B);
            else if ('ok' === P.status) {
              const n = P.data.filter((t) => t.nethunt_id === dash.params().cid);
              if (((qs('#company-regs').hidden = !n.length && !['IN', 'CO', 'BR'].includes(y)), n.length)) {
                const t = d3
                  .rollups(
                    n,
                    (t) => t.length,
                    (t) => t.segment || 'Other',
                  )
                  .sort((t, e) => e[1] - t[1]);
                (B.append(
                  el(
                    'div',
                    'cm-fcount',
                    `${fmt(n.length)} registered devices · ${t.map(([t, e]) => `${t} ${e}`).join(' · ')} · source: ${[...new Set(n.map((t) => t.authority))].join('; ')}`,
                  ),
                ),
                  d3
                    .rollups(
                      n,
                      (t) => t,
                      (t) => t.manufacturer || '—',
                    )
                    .sort((t, e) => e[1].length - t[1].length)
                    .slice(0, 10)
                    .forEach(([t, e]) => {
                      const n = e[0],
                        a = el('div', 'cm-tw'),
                        o = n.brand ? el('button', 'cm-co nm', t) : el('span', 'nm', t);
                      (n.brand && ((o.type = 'button'), (o.dataset.openBrand = n.brand)),
                        mark(o, 'registrations', 'manufacturer', `id=${enc(n.id)}`));
                      const d = el(
                        'div',
                        'sub',
                        `${n.manufacturer_country || ''} · ${[...new Set(e.map((t) => t.segment))].join(', ')} · e.g. ${String(n.device || '').slice(0, 60)}${n.licence_no ? ` (${n.licence_no})` : ''}`,
                      );
                      (a.append(
                        el(
                          'span',
                          'rk',
                          flag(
                            ((t) => {
                              const e = rowsOf('countries').find(
                                (e) =>
                                  e.country === t ||
                                  String(e.crm_tags)
                                    .toLowerCase()
                                    .split('|')
                                    .includes(String(t || '').toLowerCase()),
                              );
                              return e ? e.iso : '';
                            })(n.manufacturer_country),
                          ),
                        ),
                        o,
                        el('span', 'v', `${e.length} device${1 === e.length ? '' : 's'}`),
                        d,
                      ),
                        B.append(a));
                    }));
              } else
                B.append(
                  el('div', 'cm-empty', 'No registrations matched in the data we hold (India CDSCO, Colombia INVIMA, Brazil ANVISA).'),
                );
            }
            const O = dash.data('company_trade'),
              H = qs('.cm-trade', n);
            if ((H.replaceChildren(), H.classList.toggle('dash-skeleton', 'loading' === O.status), 'error' === O.status)) failLine(H);
            else if ('ok' === O.status) {
              const t = O.data.filter((t) => 'Total value (USD)' === t.metric),
                n = O.data.filter((t) => 'Units' === t.metric),
                o = [...new Set(O.data.filter((t) => 'Product' === t.metric).map((t) => t.text))];
              if (t.length) {
                const s = d3.sum(t, (t) => t.value),
                  l = el('div');
                (l.append(
                  el('div', 'tot', money(s)),
                  el(
                    'div',
                    'cm-fcount',
                    `${impLevel(s)} · ${t.length} entr${1 === t.length ? 'y' : 'ies'}${n.length ? ` · ${fmt(d3.sum(n, (t) => t.value))} units` : ''}${o.length ? ` · ${o.join(', ')}` : ''}`,
                  ),
                ),
                  H.append(l),
                  t.forEach((t) => {
                    const e = el('div', 'ent');
                    (e.append(
                      mark(el('span', 'd', d3.utcFormat('%b %-d, %Y')(new Date(t.logged))), 'company_trade', 'logged', `id=${enc(t.id)}`),
                      el('span', null, t.metric),
                      mark(el('span', 'num', money(t.value)), 'company_trade', 'value', `id=${enc(t.id)}`),
                    ),
                      H.append(e));
                  }));
              } else H.append(el('div', 'cm-empty', 'No trade-data values logged for this company.'));
            }
            const R = impMap().get(dash.params().cid);
            R &&
              _.append(
                mark(
                  el('span', 'cm-tag', `${impLevel(R.import_value_usd)} · ${money(R.import_value_usd)}`),
                  'import_values',
                  'import_value_usd',
                  `id=${enc(R.id)}`,
                ),
              );
            const j = dash.data('company_contacts'),
              G = qs('.cm-cpeople', n);
            (G.dataset.cid !== String(dash.params().cid) && ((G.dataset.cid = String(dash.params().cid)), delete G.dataset.all),
              delete G.dataset.more,
              G.replaceChildren(),
              G.classList.toggle('dash-skeleton', 'loading' === j.status),
              'error' === j.status
                ? failLine(G)
                : 'ok' !== j.status || j.data.length
                  ? ('ok' === j.status
                      ? j.data
                          .slice()
                          .sort((t, e) => (window.__cm2 && window.__cm2.personSort ? window.__cm2.personSort(t, e) : 0) || cmRank(t.title) - cmRank(e.title) || cmReach(e) - cmReach(t) || String(e.last_interaction || '').localeCompare(String(t.last_interaction || '')))
                      : []
                    ).filter((t, i, all) => (G.dataset.all === '1' || i < 6 || ((i === 6) && (G.dataset.more = all.length - 6), !1))).forEach((t) => {
                      const e = `id=${enc(t.id)}`,
                        n = el('div', 'cm-person'),
                        a = el('div', 'cm-phead'),
                        o = contactLine('', '', {
                          linkedin: t.linkedin,
                          phones: String(t.phone || '').split(' | '),
                          emails: String(t.email || '')
                            .split(', ')
                            .filter(Boolean),
                        }).querySelector('.ic');
                      (a.append(mark(el('span', 'pn', t.name || '(no name)'), 'company_contacts', 'name', e)),
                        cmRank(t.title) <= 1 && a.append(el('span', 'cm-dm', 'Decision maker')),
                        a.append(o),
                        n.append(a),
                        (t.title || (t.contact_type && !/^(ortho lead|general)$/i.test(t.contact_type))) &&
                          n.append(
                            mark(el('span', 'pm', [t.title, /^(ortho lead|general)$/i.test(t.contact_type || '') ? '' : t.contact_type].filter(Boolean).join(' · ')), 'company_contacts', 'title', e),
                          ));
                      const s = el('span', 'pm cm-plinks');
                      (!1 && t.email &&
                        t.email.split(', ').slice(0, 1).forEach((t) => {
                          const e = el('a', null, t);
                          ((e.href = gmailHref(t)),
                            (e.target = '_blank'),
                            (e.rel = 'noopener noreferrer'),
                            (e.title = 'Write in Gmail'),
                            s.append(e));
                        }),
                        s.childNodes.length && n.append(mark(s, 'company_contacts', 'email', e)));
                      const l = String(t.phone || '')
                        .split(' | ')
                        .map((t) => t.trim())
                        .filter((t) => /\d{5,}/.test(t.replace(/\D/g, '')))
                        .sort((x, y) => waOk(y) - waOk(x))
                        .slice(0, 0); // numbers are in the icons
                      if (l.length) {
                        const t = el('span', 'pm cm-plinks');
                        (l.forEach((e) => {
                          const n = el('button', 'cm-tel', e);
                          ((n.type = 'button'),
                            (n.title = `${CAN_CALL ? 'Call' : 'Copy'} ${e}`),
                            n.addEventListener('click', (a) => {
                              (a.stopPropagation(), cmCopyNum(e));
                            }),
                            t.append(n));
                        }),
                          n.append(mark(t, 'company_contacts')));
                      }
                      (t.last_interaction &&
                        n.append(
                          mark(el('span', 'pm', `last ${b(t.last_interaction)}`), 'company_contacts', 'last_interaction', e),
                        ),
                        G.append(n));
                    })
                  : G.append(el('div', 'cm-empty', 'No contacts linked yet.')));
            if (G.dataset.more && G.dataset.all !== '1') { const mb = el('button', 'cm-mini', `Show all ${Number(G.dataset.more) + 6} people`); mb.type = 'button'; mb.addEventListener('click', () => { G.dataset.all = '1'; delete G.dataset.more; dash.setParams({}); }); G.append(mb); }
            const U = dash.data('company_timeline'),
              W = qs('.cm-cact', n);
            (W.replaceChildren(), W.classList.toggle('dash-skeleton', 'loading' === U.status));
            const z = {
              campaign_email: 'Campaign email',
              email: 'Email',
              call: 'Call',
              comment: 'Comment',
              chat: 'Chat',
              calendar: 'Meeting',
            };
            'error' === U.status
              ? failLine(W)
              : 'ok' !== U.status || U.data.length
                ? (window.__cm2 ? window.__cm2.actView('ok' === U.status ? U.data : [], W) : 'ok' === U.status ? U.data : []).forEach((t) => {
                    const e = `id=${enc(t.id)}`,
                      n = el('div', `cm-ev t-${t.type}${'chat' === t.type && 'NOT_REPLIED' === t.chat_status ? ' wait' : ''}`);
                    { const ic = el('span', 'cm-evi'); const sv = 'chat' === t.type && window.__cm2 && window.__cm2.chatLogo ? window.__cm2.chatLogo(t) : { call: ICON_TEL, chat: ICON_WA, email: ICON_MAIL }[t.type]; sv ? (ic.innerHTML = sv) : (ic.textContent = { comment: '📝', calendar: '📅', campaign_email: '📣' }[t.type] || '•'); ic.title = z[t.type] || t.type; n.append(ic); }
                    (n.append(
                      mark(el('span', 'et', t.title || z[t.type] || t.type), 'company_timeline', 'title', e),
                    ),
                      n.append(
                        mark(
                          el(
                            'span',
                            'em',
                            `${(() => { const d = agoDays(t.time); return null == d ? '' : d < 0 ? (-1 === d ? 'tomorrow' : `in ${-d} days`) : 0 === d ? 'today' : 1 === d ? 'yesterday' : d < 30 ? `${d} days ago` : d3.utcFormat('%b %-d, %Y')(new Date(t.time)); })()}${t.by ? ` · ${t.by}` : ''}${t.replies ? ` · ${t.replies} replies` : ''}`,
                          ),
                          'company_timeline',
                          'time',
                          e,
                        ),
                      ),
                      t.detail && n.append(mark(el('span', 'ed', t.detail), 'company_timeline', 'detail', e)),
                      ('call' === t.type || 'comment' === t.type) && window.__cm2 && window.__cm2.actEdit && (() => { const b = window.__cm2.actEdit(t); b && n.append(b); })(),
                      ('email' === t.type || ('campaign_email' === t.type && t.replies)) && window.__cm3 && window.__cm3.mailActs && n.append(window.__cm3.mailActs(t)),
                      'chat' === t.type && window.__cm2 && window.__cm2.chatActs
                        ? n.append(window.__cm2.chatActs(t))
                        : 'chat' === t.type &&
                        (() => {
                          const bits = [];
                          (t.chat_msgs && bits.push(`${t.chat_msgs} message${1 === t.chat_msgs ? '' : 's'}`),
                            t.chat_status && bits.push('REPLIED' === t.chat_status ? 'we answered last' : 'waiting for our reply'),
                            bits.length && n.append(el('span', 'em', bits.join(' · '))));
                          const ob = el('button', 'cm-btn ghost', 'Open chat');
                          ((ob.type = 'button'), ob.addEventListener('click', () => cmOpenChat(ob, t)), n.append(ob));
                        })(),
                      W.append(n));
                  })
                : W.append(el('div', 'cm-empty', 'No activity yet.'));
            const F = qs('.cm-cmarket', n);
            F.replaceChildren();
            const q = rowsOf('market_intel').find((t) => t.iso === y) || {},
              J = rowsOf('osteo_trade').find((t) => t.iso === y) || {},
              Z = (t, e, n, a) => {
                const o = el('div', 'cm-fact');
                (o.append(el('div', 'lbl', t), mark(el('div', 'v', e), n, a, `iso=${enc(y)}`)), F.append(o));
              };
            y
              ? (Z('Joints imports 2025', money(q.market_size_usd), 'market_intel', 'market_size_usd'),
                Z('Osteosynthesis imports 2025', money(J.osteo_imports_usd), 'osteo_trade', 'osteo_imports_usd'),
                Z('Next Shoulder status', q.next_status || '—', 'market_intel', 'next_status'),
                Z('Shoulder target tier', q.target_tier || '—', 'market_intel', 'target_tier'))
              : F.append(el('div', 'cm-empty', 'No country recorded for this company.'));
            {
              const e = p.filter((t) => !m.has(t.field)).map((t) => [t.field]),
                a = rowsOf('company_schema')
                  .filter((t) => !m.has(t.field) && !e.some(([e]) => e === t.field))
                  .map((t) => [t.field]);
              x(qs('.cm-cother', n), [...e, ...a]);
            }
          })()
        : 'markets' === n
          ? drawMarkets()
          : 'tenders' === n
            ? drawTenders()
            : 'sources' === n
              ? (function () {
                  const e = qs('#sources-view');
                  if (!e.children.length) return;
                  const n = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
                    a = dash.data('sources_used'),
                    o = qs('.cm-stable tbody', e);
                  (o.replaceChildren(),
                    ('ok' === a.status ? a.data : []).forEach((t) => {
                      const e = el('tr');
                      e.dataset.key = t.id;
                      const n = el('td');
                      if (/^https?:/.test(t.location)) {
                        const e = el('a', null, t.location.replace(/^https?:\/\//, '').slice(0, 48));
                        ((e.href = t.location), (e.target = '_blank'), (e.rel = 'noopener noreferrer'), n.append(e));
                      } else n.append(t.location);
                      const a = el('td');
                      (a.append(el('b', null, t.name), el('div', 'cm-fcount', t.provides)),
                        e.append(
                          a,
                          el('td', null, t.type),
                          el('td', 'cm-hide-sm', t.coverage),
                          el('td', 'cm-hide-sm', t.provider),
                          n,
                          el('td', 'cm-hide-sm', t.period),
                          el('td', 'cm-hide-sm', t.used_in),
                        ),
                        o.append(e));
                    }));
                  const r = dash.data('source_directory'),
                    c = 'ok' === r.status ? r.data : [],
                    d = dash.params(),
                    p = d.dcountry || 'all',
                    u = d.dtype || 'all',
                    m = [...new Set(c.map((t) => t.country_iso))].sort((t, e) =>
                      String(n.get(t) || t).localeCompare(String(n.get(e) || e)),
                    ),
                    h = qs('.cm-dcountry', e);
                  (h.replaceChildren(
                    new Option('All countries', 'all'),
                    ...m.map((t) => new Option(`${flag(t)} ${n.get(t) || ('EU' === t ? 'European Union' : t)}`.trim(), t)),
                  ),
                    (h.value = m.includes(p) ? p : 'all'),
                    qs('.cm-dtype', e).replaceChildren(
                      ...[
                        ['all', 'All'],
                        ['Registrations', 'Registrations'],
                        ['Tenders', 'Tenders'],
                      ].map(([t, e]) => {
                        const n = el('button', null, e);
                        return (
                          (n.type = 'button'),
                          n.setAttribute('aria-pressed', String(u === t)),
                          n.addEventListener('click', () => dash.setParams({ dtype: t })),
                          n
                        );
                      }),
                    ));
                  const f = qs('.cm-dtable tbody', e);
                  (f.replaceChildren(),
                    c
                      .filter((t) => !(('all' !== h.value && t.country_iso !== h.value) || ('all' !== u && t.type !== u)))
                      .forEach((t) => {
                        const e = el('tr');
                        e.dataset.key = t.id;
                        const a = el('td'),
                          o = el('a', null, t.name);
                        ((o.href = safeHref(t.url) || '#'),
                          (o.target = '_blank'),
                          (o.rel = 'noopener noreferrer'),
                          a.append(o),
                          e.append(
                            el(
                              'td',
                              null,
                              `${flag(t.country_iso)} ${n.get(t.country_iso) || ('EU' === t.country_iso ? 'EU' : t.country_iso)}`.trim(),
                            ),
                            el('td', null, t.type),
                            a,
                            el('td', 'cm-hide-sm', t.fields),
                            el('td', 'cm-hide-sm', t.access),
                            el(
                              'td',
                              null,
                              {
                                Y: '✓ checked' + (String(t.verified).slice(1).trim() ? ' ' + String(t.verified).slice(1).trim() : ''),
                                R: '◐ site reachable',
                                B: '◐ blocks auto-check',
                                X: '✕ link failed',
                              }[String(t.verified)[0]] || 'to check',
                            ),
                          ),
                          f.append(e));
                      }));
                })()
              : 'country' === curView() ? drawCountry() : null); // the country page only draws when it's the page on screen (Home, Trips and Congresses no longer load its data)
});
const NH_FOLDER = '6682e9b8b6386800f586c0b2',
  cap = (t) => (window.claude && 'function' == typeof window.claude.use ? window.claude.use(t).catch(() => null) : Promise.resolve(null)),
  agoDays = (t) => (t ? Math.round((Date.now() - new Date(t)) / 864e5) : null);
function chipRow(t, e, n) {
  return t.map(([t, a]) => {
    const o = el('button', 'cm-chip', a);
    return ((o.type = 'button'), o.setAttribute('aria-pressed', String(t === e)), o.addEventListener('click', () => n(t)), o);
  });
}
const sheet = qs('#cm-sheet');
let sheetDraw = null,
  sheetFor = null,
  sheetAt = null;
function placeSheet() {
  if (sheet.hidden) return;
  const t = sheet.offsetWidth;
  if (sheetAt) {
    const [e, n] = besidePoint(sheetAt, t, sheet.offsetHeight);
    return void placeFixed(sheet, e, n);
  }
  if (sheet.classList.contains('wide') || !sheetFor) return void placeFixed(sheet, Math.max(8, (window.innerWidth - t) / 2), 56);
  const e = sheetFor.getBoundingClientRect();
  placeFixed(sheet, Math.max(8, Math.min(e.right - t, window.innerWidth - t - 8)), Math.max(8, Math.min(e.bottom + 6, window.innerHeight - 160)));
}
let lockY = 0;
function lockPage(on) {
  const de = document.documentElement; if (on === de.classList.contains('cm-lock')) return;
  if (on) { lockY = window.scrollY; de.classList.add('cm-lock'); document.body.style.top = `-${lockY}px`; } else { de.classList.remove('cm-lock'); document.body.style.top = ''; window.scrollTo(0, lockY); }
}
function closeSheet() {
  const t = sheetFor;
  lockPage(!1);
  return ((sheet.hidden = !0), (sheetDraw = null), (sheetFor = null), t && t.setAttribute('aria-expanded', 'false'), t);
}
function openSheet(e, n, a, o = {}) {
  if (sheetFor === e && !sheet.hidden) return void closeSheet();
  (closeSheet(),
    hidePop(),
    (sheetFor = e),
    e.setAttribute('aria-expanded', 'true'),
    (sheetAt = recentPtr()),
    (qs('#cm-sheet-title').textContent = n),
    sheet.classList.toggle('wide', !!o.wide),
    sheet.classList.toggle('center', !!o.center),
    o.center && lockPage(!0));
  const s = qs('.sbar', sheet);
  (s.replaceChildren(), o.bar && o.bar(s));
  const r = qs('.sb', sheet);
  ((sheetDraw = () => {
    const t = r.scrollTop;
    (r.replaceChildren(), a(r), (r.scrollTop = t), placeSheet());
  }),
    (sheet.hidden = !1),
    (r.scrollTop = 0),
    sheetDraw(),
    o.static && (sheetDraw = () => placeSheet()),
    (s.querySelector('input') || qs('.sx', sheet)).focus());
}
(qs('.sx', sheet).addEventListener('click', () => {
  const t = closeSheet();
  t && t.focus();
}),
  sheet.addEventListener('click', (t) => {
    t.target.closest('[data-open-company],[data-open-iso]') && !t.target.closest('.cm-cmpt thead') && setTimeout(closeSheet, 0);
  }),
  document.addEventListener('keydown', (t) => {
    if ('Escape' === t.key && !sheet.hidden && pop.hidden && cpop.hidden && (!t.defaultPrevented || !sheet.contains(t.target))) {
      const t = closeSheet();
      t && t.focus();
    }
  }),
  document.addEventListener('mousedown', (t) => {
    sheet.hidden ||
      sheet.contains(t.target) ||
      (sheetFor && sheetFor.contains(t.target)) ||
      pop.contains(t.target) ||
      cpop.contains(t.target) ||
      t.target.closest('.cm-combo ul') ||
      closeSheet();
  }),
  window.addEventListener('resize', placeSheet));
let phTemplates = {}; let cgStars = {}; let tripPlans = []; let ignoredCos = {}; let dayPlan = {}; let uiFlags = {}; // ⭐ congresses / associations you follow // Power hour: your own draft templates per brand
let mapsSavedCount = 105; // Google Maps links already written to NetHunt (14 Oct)
let fuDays = 14,
  fuHere = !1,
  scoreMode = 'day'; // What changed: daily or weekly numbers
function changesSince() {
  const t = (dash.data('pipeline_changes').meta || []).find((t) => 'Changes since' === t.label);
  return t ? new Date(t.value) : null;
}
function drawChanges(t) {
  const n = dash.data('recent_changes'),
    a = changesSince();
  if (
    (t.append(
      el(
        'div',
        'hint',
        `Since ${a ? a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'the last snapshot'}: new companies and stage moves in NetHunt.`,
      ),
    ),
    'error' === n.status)
  )
    return void t.append(el('div', 'hint', 'Changes didn’t load.'));
  const o = 'ok' === n.status ? n.data : [],
    r = oursKey();
  window.__cm2 && window.__cm2.hotList(t, new Set(o.filter((x) => 'up' === x.kind).map((x) => x.id)));
  ([
    [
      'Moved forward',
      o
        .filter((t) => 'up' === t.kind)
        .sort((t, e) => (t.ours === r ? -1 : 0) - (e.ours === r ? -1 : 0) || String(e.at || '').localeCompare(String(t.at || ''))),
    ],
    ['New in NetHunt', o.filter((t) => 'new' === t.kind)],
    ['Moved back', o.filter((t) => 'down' === t.kind)],
  ].forEach(([n, a]) => {
    a.length &&
      (t.append(el('div', 'grp', `${n} · ${fmt(a.length)}`)),
      a.slice(0, 120).forEach((e) =>
        t.append(
          (({ id: t, iso: e, icon: n, label: a, sub: o, tag: s }) => {
            const r = el('button', 'cm-pi');
            ((r.type = 'button'), t ? (r.dataset.openCompany = t) : e && (r.dataset.openIso = e));
            const c = el('span', 't', a),
              l = s ? el('span', 'tag', s) : el('span', 's', o || '');
            return (r.append(el('span', null, n || ''), c, l), s && o && (r.title = o), r);
          })({
            id: e.id,
            icon: flag(e.iso) || '🏢',
            label: e.company,
            tag:
              'new' === e.kind
                ? 'New' + (e.at ? ' · ' + (0 === agoDays(e.at) ? 'today' : `${agoDays(e.at)}d ago`) : '')
                : `${OURS[e.ours].label.split(' ')[0]}: ${null == e.from_stage ? '' : `${STAGE[e.from_stage]} → `}${STAGE[e.to_stage]}${e.at ? ' · ' + (0 === agoDays(e.at) ? 'today' : `${agoDays(e.at)}d ago`) : ''}`,
          }),
        ),
      ));
  }),
    'ok' !== n.status || o.length || t.append(el('div', 'hint', 'No new companies or stage moves yet.')),
    dash.data('pipeline_changes').data &&
      dash.data('pipeline_changes').cut &&
      t.append(el('div', 'hint', 'Many records changed; only the first pages were read. Ask Claude to refresh the snapshot.')));
}
qs('.cm-tb-new').addEventListener('click', (t) => openSheet(t.currentTarget, '🔥 Hot companies & changes', drawChanges));
let funAll = !1;
function drawFunnel(t) {
  const n = dash.params(),
    a = rowsOf('countries').find((t) => t.iso === n.iso),
    o = el('div', 'cm-chips');
  ((o.style.margin = '10px 6px 0'),
    o.append(
      ...chipRow(
        [
          [!1, a ? `${flag(a.iso)} ${a.country}` : 'This country'],
          [!0, 'All markets'],
        ],
        funAll,
        (t) => {
          ((funAll = t), sheetDraw());
        },
      ),
    ),
    t.append(o));
  const r = funAll || !a ? 'pipeline_stages' : 'partners',
    d = dash.data(r);
  if ('error' === d.status) return void t.append(el('div', 'hint', 'Pipeline didn’t load.'));
  const p = 'ok' === d.status ? d.data : [];
  (t.append(
    el('div', 'hint', 'Companies that reached each stage or further. % = share that went on from the stage before. Hover a bar for names.'),
  ),
    OUR3().forEach(([n, o], s) => {
      const l = el('div', 'cm-fun'),
        d = el('div', 'h');
      (d.append(withLogo(n, o.label)), l.append(d));
      const u = p.filter((t) => t[`stage_${n}`] >= 2).length || 1;
      let m = null;
      ([2, 3, 4, 5, 6].forEach((t) => {
        const d = p.filter((e) => e[`stage_${n}`] >= t),
          h = el('div', 'cm-frow'),
          g = el('button', 'cm-co', STAGE[t]);
        ((g.type = 'button'),
          (g.style.textAlign = 'left'),
          hoverList(g, () => ({
            title: `${o.label} · ${STAGE[t].toLowerCase()}+${funAll || !a ? '' : ` in ${a.country}`}`,
            items: d.slice().sort(byStage(n)).map(coItem(n)),
          })));
        const f = el('div', 'b'),
          y = el('i');
        ((y.style.width = (d.length / u) * 100 + '%'),
          (y.style.background = dash.colors[s % dash.colors.length]),
          f.append(y),
          h.append(
            g,
            f,
            mark(el('span', 'n', fmt(d.length)), r, `stage_${n}`),
            el('span', 'c', m ? `${Math.round((d.length / m) * 100)}%` : ''),
          ),
          (m = d.length || null),
          l.append(h));
      }),
        t.append(l));
    }));
}
document.addEventListener('click', (t) => {
  const e = t.target.closest('.cm-funnel-btn');
  e && openSheet(e, 'Pipeline funnel', drawFunnel);
});
const cmpList = () => {
  const t = dash.params().cmp,
    e = Array.isArray(t) ? t.filter(Boolean) : [];
  return e.length ? e.slice(0, 4) : dash.params().iso ? [dash.params().iso] : [];
};
let cmpMsg = '';
function cmpBar(t) {
  const e = el('div', 'cm-combo'),
    n = el('input');
  ((n.type = 'text'),
    (n.placeholder = 'Add a country (up to 4)…'),
    n.setAttribute('aria-label', 'Add a country to compare'),
    n.setAttribute('role', 'combobox'),
    n.setAttribute('aria-autocomplete', 'list'),
    (n.autocomplete = 'off'));
  const a = el('ul');
  ((a.id = 'cm-cmp-list'),
    a.setAttribute('role', 'listbox'),
    (a.hidden = !0),
    n.setAttribute('aria-controls', a.id),
    e.append(n, a),
    makeCombo(
      n,
      a,
      (t) =>
        countryItems(t)
          .filter((t) => !cmpList().includes((rowsOf('countries').find((e) => e.country === t.label) || {}).iso))
          .map((t) => ({
            ...t,
            act: () => {
              const e = rowsOf('countries').find((e) => e.country === t.label);
              if (!e) return;
              const a = cmpList();
              if (a.length >= 4) return ((cmpMsg = 'Up to 4 countries — remove one first (✕).'), void (sheetDraw && sheetDraw()));
              ((cmpMsg = ''), dash.setParams({ cmp: [...a, e.iso] }), (n.value = ''));
            },
          })),
      { keepOpen: !0 },
    ));
  const o = el('button', 'cm-btn ghost', 'Clear');
  ((o.type = 'button'), o.addEventListener('click', () => dash.setParams({ cmp: [] })), t.append(e, o));
}
function drawCompare(t) {
  const n = cmpList(),
    d = oursKey(),
    p = OURS[d],
    u = new Map(rowsOf('country_matrix').map((t) => [t.iso, t])),
    m = new Map(rowsOf('countries').map((t) => [t.iso, t]));
  (n.length < 4 && (cmpMsg = ''), cmpMsg && t.append(el('div', 'hint', cmpMsg)));
  const h = n.length ? (m.get(n[0]) || {}).region : null,
    g = 'Joints' === OURS[d].seg ? 'joints_size' : 'osteo_size',
    f =
      n.length < 4
        ? rowsOf('country_matrix')
            .filter((t) => !n.includes(t.iso) && (!h || t.region === h) && t[g] > 0)
            .sort((t, e) => e[g] - t[g])
            .slice(0, 4)
        : [];
  if (f.length) {
    const e = el('div', 'cm-chips');
    ((e.style.margin = '10px 6px 0'),
      e.append(
        el('span', 'cm-prog', `Add${h ? ` (${h}, biggest ${OURS[d].seg.toLowerCase()} first)` : ''}:`),
        ...f.map((t) => {
          const e = el('button', 'cm-chip', `＋ ${flag(t.iso)} ${t.country}`);
          return ((e.type = 'button'), e.addEventListener('click', () => dash.setParams({ cmp: [...n, t.iso] })), e);
        }),
      ),
      t.append(e));
  }
  if (!n.length) return void t.append(el('div', 'hint', 'Add countries above to compare them side by side.'));
  const y = rowsOf('pipeline_stages'),
    b = rowsOf('tender_awards'),
    v = rowsOf('registrations'),
    w = el('div');
  w.style.overflowX = 'auto';
  const _ = el('table', 'cm-cmpt');
  mark(_, 'country_matrix');
  const $ = el('tr');
  ($.append(el('th', null, '')),
    n.forEach((t) => {
      const e = m.get(t),
        a = el('th'),
        o = el('button', 'cm-co', `${flag(t)} ${e ? e.country : t}`);
      ((o.type = 'button'), (o.dataset.openIso = t));
      const r = el('button', 'rm', '✕');
      ((r.type = 'button'),
        (r.title = 'Remove'),
        r.addEventListener('click', (e) => {
          (e.stopPropagation(), dash.setParams({ cmp: n.filter((e) => e !== t) }));
        }),
        a.append(o, r),
        $.append(a));
    }));
  const k = el('thead');
  (k.append($), _.append(k));
  const C = el('tbody');
  [
    ['Joints imports', (t) => t && t.joints_size, money, 'joints_size', 'max'],
    ['Joints growth', (t) => t && t.joints_growth, pct, 'joints_growth', 'max'],
    ['Osteosynthesis imports', (t) => t && t.osteo_size, money, 'osteo_size', 'max'],
    ['Osteosynthesis growth', (t) => t && t.osteo_growth, pct, 'osteo_growth', 'max'],
    ['Competitor brands · joints', (t) => t && t.competitors_joints, fmt, 'competitors_joints', 'min'],
    ['Competitor brands · osteo', (t) => t && t.competitors_osteo, fmt, 'competitors_osteo', 'min'],
    ['Companies in NetHunt', (t) => t && t.companies, fmt, 'companies', 'max'],
    ...OUR3().map(([t, e]) => [`${e.label} stage`, (e) => e && e[`stage_${t}`], (t) => STAGE[t || 0], `stage_${t}`, 'max']),
  ].forEach(([t, e, a, o, s]) => {
    const l = el('tr');
    l.append(el('td', null, t));
    const d = n.map((t) => e(u.get(t))),
      p = d.filter((t) => null != t),
      m = p.length > 1 ? ('max' === s ? Math.max(...p) : Math.min(...p)) : null;
    (n.forEach((t, e) => {
      const n = d[e],
        s = mark(el('td', null != n && n === m ? 'best' : null, null == n ? '—' : a(n)), 'country_matrix', o, `iso=${enc(t)}`);
      l.append(s);
    }),
      C.append(l));
  });
  const x = el('tr');
  (x.append(el('td', null, `Engaged+ with ${p.label}`)),
    n.forEach((t) => {
      const n = ((t) => y.filter((e) => e.iso === t && e[`stage_${d}`] >= 3))(t),
        a = el('td'),
        o = el('button', 'cm-co', fmt(n.length));
      ((o.type = 'button'),
        hoverList(o, () => ({
          title: `${p.label} · engaged+ in ${(m.get(t) || {}).country || t}`,
          items: n.slice().sort(byStage(d)).map(coItem(d)),
        })),
        a.append(mark(o, 'pipeline_stages')),
        x.append(a));
    }));
  const E = el('tr');
  (E.append(el('td', null, 'Tender winners & registrants not in NetHunt')),
    n.forEach((t) =>
      E.append(
        mark(
          el(
            'td',
            null,
            ((t) => b.some((e) => e.country_iso === t) || v.some((e) => e.country_iso === t))(t)
              ? fmt(
                  ((t) =>
                    new Set(
                      [
                        ...b.filter((e) => e.country_iso === t && !e.nethunt_id),
                        ...v.filter((e) => e.country_iso === t && !e.nethunt_id),
                      ].map((t) => norm(t.company).replace(/[^a-z0-9]/g, '')),
                    ).size)(t),
                )
              : 'no data yet',
          ),
          'tender_awards registrations',
        ),
      ),
    ),
    C.append(x, E),
    _.append(C),
    w.append(_),
    t.append(w),
    t.append(
      el(
        'div',
        'hint',
        `Bold = best of the countries shown (most imports and growth, fewest competitors). Stages and “engaged+” are for ${p.label}; switch with “Viewing as”.`,
      ),
    ));
}
qs('.cm-tb-cmp').addEventListener('click', (t) => openSheet(t.currentTarget, 'Compare countries', drawCompare, { wide: !0, bar: cmpBar }));
const nhPayload = (t) => {
  if (t && null != t.payload) {
    if ('string' == typeof t.payload)
      try {
        return JSON.parse(t.payload);
      } catch {
        return t.payload;
      }
    return t.payload;
  }
  const e = t && Array.isArray(t.content) ? t.content.find((t) => 'text' === t.type) : null;
  if (!e) return null;
  try {
    return JSON.parse(e.text);
  } catch {
    return e.text;
  }
};
async function nhCall(t, e) {
  const n = await cap('mcp');
  if (!n) {
    const t = new Error('unavailable');
    throw ((t.code = 'unavailable'), t);
  }
  const M = window.__cm2; M && M.beforeWrite && (e = M.beforeWrite(t, e));
  // NetHunt sometimes refuses a change for a moment (another change to the same record still in progress, or it's busy):
  // changes to one record go one after another, and a refused call is retried twice before an error is shown
  const write = /^(update_record|create_record|create_record_comment|create_record_call_log|delete_record)$/.test(t), key = write && e && e.recordId ? e.recordId : null;
  const run = async () => { let err; for (let k = 0; k < 3; k++) { try { return nhPayload(await n.callTool('Nethunt', t, e)); } catch (x) { err = x; const m = String((x && x.message) || x); if (!/UPSTREAM|502|503|504|429|unable to update|timeout|timed out|busy|ECONN|network|fetch/i.test(m) || (x && x.code && 'tool_error' !== x.code && !/UPSTREAM/.test(m))) break; await new Promise((res) => setTimeout(res, k ? 2000 : 700)); } } throw err; };
  const prev = key ? nhQueue.get(key) || Promise.resolve() : Promise.resolve(); const p = prev.catch(() => {}).then(run); key && nhQueue.set(key, p); p.finally(() => key && nhQueue.get(key) === p && nhQueue.delete(key)).catch(() => {});
  const r = await p;
  try { M && M.onWrite && M.onWrite(t, e, r); } catch { /* the log never blocks work */ }
  return r;
}
const nhQueue = new Map();
const nhErr = (t) =>
    ({
      unavailable: 'This page can’t reach NetHunt here. Use the CSV, or ask Claude in chat to do it.',
      not_in_manifest: 'This page isn’t allowed to write to NetHunt. Use the CSV, or ask Claude in chat to do it.',
      consent_required: 'Allow NetHunt for this page when asked, then try again.',
      not_granted: 'NetHunt access was declined for this page.',
      needs_reauth: 'Reconnect NetHunt in your Claude settings, then try again.',
      server_not_connected: 'NetHunt isn’t connected to your Claude account.',
    })[t && t.code] ||
    (t && /UPSTREAM|unable to update|502|503|504/i.test(String(t.message)) ? 'NetHunt was busy and didn’t save it (tried 3 times). Wait a moment and try again.' : '') ||
    (t && t.message) ||
    'NetHunt didn’t answer.',
  fatal = (t) => t && t.code && 'tool_error' !== t.code;
let nhAvail = null;
cap('mcp').then((t) => {
  ((nhAvail = !!t), sheetDraw && sheetDraw());
});
const NO_NH = 'Writing to NetHunt isn’t available in this view — use CSV, or ask Claude in chat.',
  toast = qs('#cm-toast');
let toastT = null;
function say(t, e) {
  (clearTimeout(toastT),
    (toast.textContent = t),
    toast.classList.toggle('bad', !!e),
    (toast.hidden = !1),
    (toastT = setTimeout(
      () => {
        toast.hidden = !0;
      },
      e ? 7e3 : 3500,
    )));
}
const STATUS_FIELD = { dunitech: 'Status', next: 'NEXT Status', motion: 'Motion Status' },
  choicesFor = (t) => {
    const e = dash.data('company_fields');
    return 'ok' === e.status
      ? e.data
          .filter((e) => e.field === t)
          .sort((t, e) => t.idx - e.idx)
          .map((t) => t.option)
      : [];
  };
function afterWrite(t) {
  (['pipeline_changes', 'companies'].forEach((t) => {
    try {
      dash.refresh(t);
    } catch {}
  }),
    dash.params().cid === t && ['company_record', 'company_timeline'].forEach((t) => dash.refresh(t)));
}
async function setField(t, e, n, a, o) {
  o && o.classList.add('busy');
  try {
    if ((await nhCall('update_record', { folderId: NH_FOLDER, recordId: t, fieldKeys: 'label', fields: { [n]: a } }), o)) {
      const t = a || (o.dataset.prefix ? '—' : 'No status');
      ([...o.childNodes].find((t) => 3 === t.nodeType) || o.appendChild(document.createTextNode(''))).nodeValue = o.dataset.short
        ? `${o.dataset.short} · ${t}`
        : o.dataset.prefix
          ? `${o.dataset.prefix}${t}`
          : t;
    }
    (say(`Saved to NetHunt: ${e} → ${n}: ${a || '(cleared)'}`), afterWrite(t));
  } catch (t) {
    say(`Not saved — ${nhErr(t)}`, !0);
  } finally {
    o && o.classList.remove('busy');
  }
}
function editableStatus(t, e, n, a, o) {
  return (
    (t.type = 'button'),
    (t.title = `${t.title ? `${t.title} — ` : ''}click to change ${a} in NetHunt`),
    t.setAttribute('aria-haspopup', 'menu'),
    t.addEventListener('click', (s) => {
      (s.stopPropagation(),
        (function (t, e, n, a, o) {
          const s = choicesFor(a);
          if (!s.length) return (dash.data('company_fields'), void say('Loading the status list from NetHunt — try again in a moment.'));
          openMenu(t, [
            ...s.map((s) => ({
              label: s,
              on: s === o,
              act: () => {
                s !== o && setField(e, n, a, s, t);
              },
            })),
            ...(o ? [{ icon: '✕', label: 'Clear', sub: '', act: () => setField(e, n, a, null, t) }] : []),
          ]);
        })(t, e, n, a, o));
    }),
    t
  );
}
function textEditor(t, e, n, a, o) {
  openSheet(
    t,
    e,
    (t) => {
      const s = el('div', 'cm-edit'),
        r = el('textarea');
      ((r.value = n || ''), (r.placeholder = o || ''), r.setAttribute('aria-label', e));
      const c = el('div', 'row'),
        l = el('button', 'cm-btn ghost', 'Cancel');
      l.type = 'button';
      const d = el('button', 'cm-btn', 'Save to NetHunt');
      ((d.type = 'button'),
        l.addEventListener('click', () => closeSheet()),
        d.addEventListener('click', async () => {
          const t = r.value.trim();
          (t || n) &&
            ((d.disabled = !0),
            (d.textContent = 'Saving…'),
            (await a(t)) ? closeSheet() : ((d.disabled = !1), (d.textContent = 'Save to NetHunt')));
        }),
        c.append(l, d),
        s.append(r, micBar(r), c),
        t.append(s),
        setTimeout(() => r.focus(), 0));
    },
    { static: !0 },
  );
}
function schemaOf(t) {
  return rowsOf('company_schema').find((e) => e.field === t);
}
function editable(t) {
  const e = schemaOf(t);
  return (
    !!e &&
    !/^(folderLink|user|timeSinceUpdate|lastInteractionTime|lastEmailFrom|totalEmailCount|outgoingEmailCount|emailOpenCount|totalCallLogsCount|lastCallLogAddedTime|formula|lookup|autoIncrement)$/.test(
      e.type,
    ) &&
    'Name' !== t
  );
}
function fieldEditBtn(t, e, n, a) {
  const o = el('button', 'cm-ed', '✎');
  return (
    (o.type = 'button'),
    (o.title = `Edit ${t} in NetHunt`),
    o.setAttribute('aria-label', `Edit ${t}`),
    o.addEventListener('click', (s) => {
      (s.stopPropagation(), openFieldEditor(o, t, e, n, a));
    }),
    o
  );
}
function openFieldEditor(t, e, n, a, o) {
  const s = schemaOf(e);
  if (!s) return (dash.data('company_schema'), void say('Loading NetHunt fields — try again in a moment.'));
  const r = String(s.presets || '')
      .split('|')
      .filter(Boolean),
    c = 'tag' === s.type || (s.multi && /^(dropdown|status)$/.test(s.type)),
    d = 'date' === s.type,
    p = /^(number|currency|percent)$/.test(s.type),
    u = 'checkbox' === s.type,
    m = 'multiLineText' === s.type,
    h = /^(dropdown|status)$/.test(s.type) && !s.multi,
    g = null == n ? '' : String(n);
  let f = g
    ? g
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  openSheet(
    t,
    `${e} · ${o}`,
    (t) => {
      const n = el('div', 'cm-edit cm-fe');
      let y;
      if (c || (s.multi && !h)) {
        const t = el('div', 'tags'),
          a = `dl-${Math.random().toString(36).slice(2)}`,
          o = el('datalist');
        ((o.id = a),
          ('Brand' === e ? [...new Set([...rowsOf('brand_profiles').map((t) => t.brand), ...r])] : r).forEach((t) =>
            o.append(new Option(t)),
          ));
        const c = () => {
            (t.replaceChildren(
              ...f.map((t, e) => {
                const n = el('span', 'cm-chip', t),
                  a = el('b', null, '✕');
                return (
                  (a.title = `Remove ${t}`),
                  a.addEventListener('click', () => {
                    (f.splice(e, 1), c());
                  }),
                  n.append(a),
                  n
                );
              }),
            ),
              f.length || t.append(el('span', 'hint', 'None yet')));
          },
          d = el('input');
        ((d.type = 'text'),
          d.setAttribute('list', a),
          (d.placeholder =
            'Brand' === e
              ? 'Type a brand, e.g. Zimed, Stryker…'
              : 'phoneNumber' === s.type
                ? 'e.g. +56 9 1234 5678'
                : 'email' === s.type
                  ? 'name@company.com'
                  : `Add ${e.toLowerCase()}…`));
        const p = el('button', 'cm-btn ghost', 'Add');
        p.type = 'button';
        const u = () => {
          const t = d.value.trim();
          t && (f.some((e) => e.toLowerCase() === t.toLowerCase()) || f.push(t), (d.value = ''), c(), d.focus());
        };
        (p.addEventListener('click', u),
          d.addEventListener('keydown', (t) => {
            'Enter' === t.key && (t.preventDefault(), u());
          }));
        const m = el('div', 'mrow');
        (m.append(d, p),
          c(),
          n.append(t, m, o),
          (y = () => {
            const t = d.value.trim();
            return (t && !f.includes(t) && f.push(t), f.length ? f : null);
          }));
      } else if (h) {
        const t = el('select');
        (t.append(new Option('— none —', '')),
          r.forEach((e) => t.append(new Option(e, e))),
          g && !r.includes(g) && t.append(new Option(g, g)),
          (t.value = g),
          n.append(t),
          (y = () => t.value || null));
      } else if (u) {
        const t = el('label', 'cm-check'),
          a = el('input');
        ((a.type = 'checkbox'), (a.checked = /^(true|yes|1)$/i.test(g)), t.append(a, ` ${e}`), n.append(t), (y = () => a.checked));
      } else if (d) {
        const t = el('input');
        t.type = 'date';
        const e = Number(g);
        ((t.value = g ? (e ? new Date(e).toISOString().slice(0, 10) : String(g).slice(0, 10)) : ''),
          n.append(t),
          (y = () => {
            if (!t.value) return null;
            const [e, n, a] = t.value.split('-').map(Number);
            return Date.UTC(e, n - 1, a);
          }));
      } else if (p) {
        const t = el('input');
        ((t.type = 'number'), (t.step = 'any'), (t.value = g), n.append(t), (y = () => ('' === t.value ? null : Number(t.value))));
      } else if (m) {
        const t = el('textarea');
        ((t.value = g), n.append(t), (y = () => t.value.trim() || null));
      } else {
        const t = el('input');
        ((t.type = 'text'), (t.value = g), n.append(t), (y = () => t.value.trim() || null));
      }
      const b = el('div', 'hint'),
        v = el('div', 'row'),
        w = el('button', 'cm-btn ghost', 'Cancel');
      w.type = 'button';
      const _ = el('button', 'cm-btn', 'Save to NetHunt');
      ((_.type = 'button'),
        w.addEventListener('click', () => closeSheet()),
        _.addEventListener('click', async () => {
          ((_.disabled = !0), (_.textContent = 'Saving…'), (b.textContent = ''));
          const t = y();
          try {
            (await nhCall('update_record', { folderId: NH_FOLDER, recordId: a, fieldKeys: 'label', fields: { [e]: t } }),
              say(`✓ Saved to NetHunt: ${o} → ${e}`),
              afterWrite(a),
              closeSheet());
          } catch (t) {
            ((b.textContent = `Not saved — ${nhErr(t)}`), (_.disabled = !1), (_.textContent = 'Save to NetHunt'));
          }
        }),
        v.append(w, _),
        n.append(b, v),
        t.append(n),
        setTimeout(() => {
          const t = n.querySelector('input:not([type=checkbox]), select, textarea');
          t && t.focus();
        }, 0));
    },
    { static: !0 },
  );
}
(document.addEventListener('click', (e) => {
  const n = e.target.closest('.cm-addcomment');
  if (n) {
    const e = dash.params().cid;
    return void textEditor(
      n,
      `Comment on ${(qs('.cm-cname') || {}).textContent || 'this company'}`,
      '',
      async (t) => {
        try {
          return (
            await nhCall('create_record_comment', { folderId: NH_FOLDER, recordId: e, text: t }),
            say('Comment added in NetHunt'),
            afterWrite(e),
            !0
          );
        } catch (t) {
          return (say(`Not saved — ${nhErr(t)}`, !0), !1);
        }
      },
      'What happened, what was agreed, next step…',
    );
  }
  const a = e.target.closest('.cm-editnotes');
  if (a) {
    const t = dash.params().cid,
      e = dash.data('company_record');
    textEditor(a, 'Edit notes', ('ok' === e.status && (e.data.find((t) => 'Notes' === t.field) || {}).value) || '', async (e) => {
      try {
        return (
          await nhCall('update_record', { folderId: NH_FOLDER, recordId: t, fieldKeys: 'label', fields: { Notes: e } }),
          say('Notes saved in NetHunt'),
          afterWrite(t),
          !0
        );
      } catch (t) {
        return (say(`Not saved — ${nhErr(t)}`, !0), !1);
      }
    });
  }
}),
  document.addEventListener('click', (t) => {
    const e = t.target.closest('.cm-addbrand');
    if (!e) return;
    const n = dash.data('company_record'),
      a = new Map('ok' === n.status ? n.data.map((t) => [t.field, t.value]) : []);
    openFieldEditor(e, 'Brand', a.get('Brand') || '', dash.params().cid, a.get('Name') || 'company');
  }),
  document.addEventListener('click', (e) => {
    const n = e.target.closest('.cm-addperson');
    if (!n) return;
    const a = dash.params().cid,
      o = (qs('.cm-cname') || {}).textContent || 'this company';
    openSheet(
      n,
      `Add person · ${o}`,
      (t) => {
        const e = el('div', 'cm-edit cm-fe'),
          n = (t, e = 'text') => {
            const n = el('input');
            return ((n.type = e), (n.placeholder = t), n);
          },
          s = n('Full name *'),
          r = n('Title, e.g. General Manager'),
          c = n('Email', 'text'),
          l = n('Phone with country code, e.g. +56 9 1234 5678'),
          d = n('LinkedIn profile URL'),
          p = el('select');
        ['Ortho Lead', 'General', 'Customer', 'Ortho Colab', 'Ortho Manufacturer', 'Medical'].forEach((t) => p.append(new Option(t, t)));
        const cardTa = el('textarea'); cardTa.placeholder = 'Optional: paste the text of a business card (iPhone: open the photo, press and hold the text → Copy All) — the fields fill in by themselves'; cardTa.style.minHeight = '3.6rem';
        cardTa.addEventListener('input', () => { const k = parseCard(cardTa.value); k.name && (s.value = k.name); k.title && (r.value = k.title); k.email && (c.value = k.email); k.phone && (l.value = k.phone); k.linkedin && (d.value = /^https?:/.test(k.linkedin) ? k.linkedin : `https://${k.linkedin}`); });
        const u = el('div', 'multi');
        [cardTa, s, r, c, l, d, p].forEach((t) => {
          const e = el('div', 'mrow');
          (e.append(t), u.append(e));
        });
        const m = el('div', 'hint'),
          h = el('div', 'row'),
          g = el('button', 'cm-btn ghost', 'Cancel');
        g.type = 'button';
        const f = el('button', 'cm-btn', 'Save to NetHunt');
        ((f.type = 'button'),
          g.addEventListener('click', () => closeSheet()),
          f.addEventListener('click', async () => {
            const t = s.value.trim();
            if (!t) return ((m.textContent = 'A name is needed.'), void s.focus());
            if (c.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.value.trim()))
              return ((m.textContent = 'That email doesn’t look right.'), void c.focus());
            ((f.disabled = !0), (f.textContent = 'Saving…'), (m.textContent = ''));
            const e = t.split(/\s+/),
              n = {
                Name: t,
                'First name': e[0],
                'Last name': e.slice(1).join(' ') || null,
                Title: r.value.trim() || null,
                'Contact type': p.value,
                Company: [a],
              };
            (c.value.trim() && (n.Email = [c.value.trim()]),
              l.value.trim() && (n['Phone number'] = [l.value.trim()]),
              d.value.trim() && (n.LinkedIn = d.value.trim()));
            try {
              (await nhCall('create_record', { folderId: '6682e9b8b6386800f586c0b0', fieldKeys: 'label', fields: n }),
                say(`✓ ${t} added to ${o} in NetHunt`),
                dash.refresh('company_contacts'),
                dash.refresh('partner_contacts'),
                closeSheet());
            } catch (t) {
              ((m.textContent = `Not saved — ${nhErr(t)}`), (f.disabled = !1), (f.textContent = 'Save to NetHunt'));
            }
          }),
          h.append(g, f),
          e.append(u, m, h),
          t.append(e),
          setTimeout(() => s.focus(), 0));
      },
      { static: !0 },
    );
  }));
const NH_DEALS = '6682e9b8b6386800f586c0af',
  DEAL_STAGES = ['New', 'Presented', 'Negotiating', 'Won', 'Lost'],
  DEAL_CATS = { next: 'NEXT', dunitech: 'Ortho', motion: 'Motion' },
  dealOpen = (t) => !/^(won|lost)$/i.test(String(t.stage || '').trim());
function dealsFor(t) {
  const e = dash.data('deals');
  return 'ok' === e.status ? e.data.filter((e) => String(e.company_ids).split('|').includes(t)) : [];
}
function dealTag(t) {
  const e = dealsFor(t).filter(dealOpen);
  if (!e.length) return null;
  const n = d3.sum(e, (t) => t.amount || 0),
    o = el('span', 'cm-dtag', `💼 ${e[0].stage || 'Deal'}${n ? ` · ${money(n)}` : ''}${e.length > 1 ? ` · ${e.length} deals` : ''}`);
  return (
    hoverList(o, () => ({
      title: 'Open deals',
      items: e.map((t) => ({
        icon: '💼',
        label: t.name,
        sub: `${t.stage || '—'}${t.amount ? ` · ${money(t.amount)}` : ''}${t.probability ? ` · ${Math.round(100 * t.probability)}%` : ''}${t.close_date ? ` · close ${t.close_date}` : ''}`,
      })),
    })),
    o
  );
}
function openDealEditor(t, e, n, a) {
  const o = oursKey(),
    s = OURS[o].all ? 'next' : o,
    r = e
      ? { ...e }
      : {
          name: `${a} – ${LINES[s][0]}`,
          stage: 'New',
          amount: '',
          probability: 0.25,
          close_date: '',
          category: DEAL_CATS[s] || 'Ortho',
          next_steps: '',
          description: '',
        };
  openSheet(
    t,
    e ? `Deal · ${e.name}` : `New deal · ${a}`,
    (t) => {
      const a = el('div', 'cm-edit cm-fe'),
        o = el('div', 'multi'),
        s = (t, e) => {
          const n = el('div', 'mrow'),
            a = el('span', 'hint', t);
          return ((a.style.minWidth = '6.5rem'), n.append(a, e), o.append(n), e);
        },
        c = (t, e, n) => {
          const a = el('input');
          return ((a.type = t), (a.value = e ?? ''), n && (a.placeholder = n), a);
        },
        l = (t, e) => {
          const n = el('select');
          return (
            t.forEach((t) => n.append(new Option(t, t))),
            e && !t.includes(e) && n.append(new Option(e, e)),
            (n.value = e || t[0]),
            n
          );
        },
        d = s('Name', c('text', r.name)),
        p = s('Stage', l(DEAL_STAGES, r.stage)),
        u = s('Amount (USD)', c('number', r.amount, 'e.g. 20000')),
        m = s('Probability', l(['25%', '50%', '75%', '90%'], r.probability ? `${Math.round(100 * r.probability)}%` : '25%')),
        h = s('Close date', c('date', r.close_date || '')),
        g = s('Category', l(['NEXT', 'Ortho', 'Motion', 'Customers'], r.category)),
        f = el('textarea');
      ((f.placeholder = 'Next steps (e.g. send price list, sample set, registration documents)'), (f.value = r.next_steps || ''));
      const y = el('textarea');
      ((y.placeholder = 'Products / description (e.g. IM nails + locking plates, first order 2 sets)'),
        (y.value = r.description || ''),
        (y.style.minHeight = '4rem'));
      const b = el('div', 'hint'),
        v = el('div', 'row'),
        w = el('button', 'cm-btn ghost', 'Cancel');
      w.type = 'button';
      const _ = el('button', 'cm-btn', 'Save to NetHunt');
      ((_.type = 'button'),
        w.addEventListener('click', () => closeSheet()),
        _.addEventListener('click', async () => {
          if (!d.value.trim()) return void (b.textContent = 'A deal name is needed.');
          ((_.disabled = !0), (_.textContent = 'Saving…'), (b.textContent = ''));
          const t = h.value
              ? (() => {
                  const [t, e, n] = h.value.split('-').map(Number);
                  return Date.UTC(t, e - 1, n);
                })()
              : null,
            a = {
              Name: d.value.trim(),
              Stage: p.value,
              'Deal amount': '' === u.value ? null : Number(u.value),
              Probability: Number(m.value.replace('%', '')) / 100,
              'Close date': t,
              Catagory: g.value,
              'Next Steps': f.value.trim() || null,
              Description: y.value.trim() || null,
            };
          try {
            (e
              ? await nhCall('update_record', { folderId: NH_DEALS, recordId: e.id, fieldKeys: 'label', fields: a })
              : await nhCall('create_record', {
                  folderId: NH_DEALS,
                  fieldKeys: 'label',
                  fields: { ...Object.fromEntries(Object.entries(a).filter(([, t]) => null != t && '' !== t)), Company: [n] },
                }),
              say(`✓ Deal ${e ? 'updated' : 'created'} in NetHunt`),
              dash.refresh('deals'),
              closeSheet());
          } catch (t) {
            ((b.textContent = `Not saved — ${nhErr(t)}`), (_.disabled = !1), (_.textContent = 'Save to NetHunt'));
          }
        }),
        v.append(w, _),
        a.append(o, f, micBar(f), y, b, v),
        t.append(a));
    },
    { static: !0 },
  );
}
document.addEventListener('click', (t) => {
  const e = t.target.closest('.cm-adddeal');
  if (!e) return;
  const n = dash.data('company_record'),
    a = new Map('ok' === n.status ? n.data.map((t) => [t.field, t.value]) : []);
  openDealEditor(e, null, dash.params().cid, a.get('Name') || 'company');
});
const NH_COUNTRIES = '673c960008039266ccd2ead3',
  REG_STEPS = ['Not started', 'Choosing holder', 'Collecting documents', 'Submitted', 'Approved', 'Not required yet'],
  REG_FIELD = { dunitech: 'Registration Dunitech', next: 'Registration Next Shoulder' },
  REG_DOCS = [
    'CE certificate(s) and EU declaration of conformity',
    'ISO 13485 certificate',
    'Free-sale certificate (apostilled)',
    'Technical file: IFU, labels in Spanish, material specs',
    'Biocompatibility, sterilisation and mechanical test reports',
    'Clinical evaluation report',
    'Letter of authorisation naming the local holder/distributor',
  ];
function regRow(t) {
  const e = dash.data('country_regs');
  return 'ok' === e.status ? e.data.find((e) => norm(e.name) === norm(t)) : null;
}
async function setReg(t, e) {
  const n = regRow(t);
  (n
    ? await nhCall('update_record', { folderId: NH_COUNTRIES, recordId: n.id, fieldKeys: 'label', fields: e })
    : await nhCall('create_record', {
        folderId: NH_COUNTRIES,
        fieldKeys: 'label',
        fields: { Name: t, ...Object.fromEntries(Object.entries(e).filter(([, t]) => null != t && '' !== t)) },
      }),
    dash.refresh('country_regs'));
}
onData(function () {
  const e = qs('#country-view .cm-reg');
  if (!e || 'country' !== curView()) return;
  e.replaceChildren();
  const n = dash.params().iso,
    a = countryOfIso(n) || {},
    o = rowsOf('registration_rules').find((t) => t.iso === n),
    s = el('div');
  if (o) {
    const t = el('dl');
    [
      ['Regulator', o.regulator],
      ['Needed?', o.required],
    ].forEach(([e, n]) => {
      n && t.append(el('dt', null, e), el('dd', null, n));
    });
    const e = el('details', 'cm-more-d');
    e.append(el('summary', null, 'Holder, documents, time & cost'));
    const n = el('dl');
    ([
      ['Rules', o.rules],
      ['Who holds it', o.holder],
      ['Documents', o.docs],
      ['Time & cost', o.time_cost],
      ['Watch out', o.watch],
      ['Confidence', o.confidence],
    ].forEach(([t, e]) => {
      e && n.append(el('dt', null, t), el('dd', null, e));
    }),
      e.append(n, el('p', 'mut', `Researched by Claude, Oct 2026 · ${o.sources}. Confirm details with the local holder before filing.`)),
      s.append(t, e));
  } else s.append(el('p', 'hint', `No registration research for ${a.country || 'this country'} yet — ask Claude to add it.`));
  const r = el('div', 'st'),
    c = dash.data('country_regs');
  if ('loading' === c.status) r.append(el('div', 'hint', 'Loading our progress…'));
  else if ('error' === c.status) r.append(el('div', 'cm-fail', 'Progress didn’t load from NetHunt'));
  else {
    const t = regRow(a.country || '') || {};
    [
      ['dunitech', 'Dunitech (IM nails)', t.reg_dunitech],
      ['next', 'Next Shoulder', t.reg_next],
    ].forEach(([t, e, n]) => {
      const o = el('div', 'srow'),
        s = el('img');
      ((s.src = LOGO[t]), (s.alt = ''), (s.width = 16), (s.height = 16));
      const c = el('button', 'cm-regpill ' + ('Approved' === n ? 'ok' : n && !/not started/i.test(n) ? 'mid' : ''), n || 'Not started');
      ((c.type = 'button'),
        (c.title = 'Change status'),
        c.addEventListener('click', () =>
          openMenu(
            c,
            REG_STEPS.map((o) => ({
              label: o,
              on: o === (n || 'Not started'),
              act: async () => {
                try {
                  (await setReg(a.country, { [REG_FIELD[t]]: o }), say(`✓ ${e}: ${o}`));
                } catch (t) {
                  say(`Not saved — ${nhErr(t)}`, !0);
                }
              },
            })),
          ),
        ),
        o.append(s, el('span', null, e), c),
        r.append(o));
    });
    const e = el('div', 'srow');
    e.append(el('span', 'hint', 'Holder:'));
    const n = t.holder_ids ? t.holder_ids.split('|') : [];
    n.forEach((t) => {
      const n = companyById(t),
        a = el('button', 'cm-co', n ? n.company : 'linked company');
      ((a.type = 'button'), (a.dataset.openCompany = t), e.append(a));
    });
    const o = el('button', 'cm-mini', n.length ? 'Change' : '＋ Choose holder');
    ((o.type = 'button'),
      o.addEventListener('click', () => {
        const t = rowsOf('partners')
          .slice()
          .sort((t, e) => (e.score_all || 0) - (t.score_all || 0))
          .slice(0, 25);
        openMenu(
          o,
          t.map((t) => ({
            label: t.company,
            sub: t.status_all || '',
            act: async () => {
              try {
                (await setReg(a.country, { 'Registration holder': [t.id] }), say(`✓ Holder: ${t.company}`));
              } catch (t) {
                say(`Not saved — ${nhErr(t)}`, !0);
              }
            },
          })),
        );
      }),
      e.append(o),
      r.append(e));
    const s = el('button', 'cm-mini', t.notes ? '✎ Notes' : '＋ Notes');
    ((s.type = 'button'),
      s.addEventListener('click', () =>
        textEditor(
          s,
          `Registration notes · ${a.country}`,
          t.notes || '',
          async (t) => {
            try {
              return (await setReg(a.country, { 'Registration notes': t || null }), say('✓ Registration notes saved'), !0);
            } catch (t) {
              return (say(`Not saved — ${nhErr(t)}`, !0), !1);
            }
          },
          'e.g. Holder: Medecu, sent CE + ISO 13485 on 14 Oct, waiting for free-sale certificate',
        ),
      ),
      t.notes && r.append(el('p', 'mut', t.notes.slice(0, 280))),
      r.append(s));
    const c = el('details', 'cm-more-d');
    c.append(el('summary', null, `Documents to prepare (${REG_DOCS.length})`));
    const d = el('ol');
    (REG_DOCS.forEach((t) => d.append(el('li', null, t))), c.append(d), r.append(c));
  }
  e.append(s, r);
});
const CATALOGS = {
    dunitech: {
      label: 'Dunitech IM nails catalogue',
      file: 'Dunitech_IM_Nails_Catalogue.pdf',
      blob: '/_blob/375943cbf51f522886f9d549aa4ebfe5',
      size: '4.7 MB',
    },
    next: {
      label: 'Next Shoulder catalogue',
      file: 'Next_Shoulder_Catalogue.pdf',
      blob: '/_blob/fe2adc9a699c17c7d9d2e1ff2c43dfd2',
      size: '14 MB',
    },
  },
  catUrl = (t) => (window.cmBoot ? `catalogs/${t.file}` : t.blob);
async function sendCatalog(t, e, n) {
  const a = oursKey(),
    o = OURS[a].all ? null : a,
    s = o && CATALOGS[o] ? [o, ...Object.keys(CATALOGS).filter((t) => t !== o)] : Object.keys(CATALOGS);
  openMenu(t, [
    ...s.map((a) => ({ icon: '📎', label: CATALOGS[a].label, sub: CATALOGS[a].size, act: () => shareCats(e, n, [a], t) })),
    { icon: '📎', label: 'Both catalogues', sub: '', act: () => shareCats(e, n, Object.keys(CATALOGS), t) },
  ]);
}
async function logCatSent(t, e, n) {
  const a = new Date();
  a.setDate(a.getDate() + 5);
  const o = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
    s = (rowsOf('companies').find((e) => e.id === t) || {}).next_followup,
    r = s && Date.parse(s) < o;
  try {
    (await nhCall('create_record_comment', {
      folderId: NH_FOLDER,
      recordId: t,
      text: `Catalogue sent from the dashboard (${new Date().toLocaleDateString('en-GB')}): ${e.map((t) => t.label).join(' + ')} (PDF, ${n}).`,
    }),
      r ||
        (await nhCall('update_record', {
          folderId: NH_FOLDER,
          recordId: t,
          fieldKeys: 'label',
          fields: {
            'Next follow-up': o,
            'Next step': `Check their reply to the ${e.map((t) => t.label.replace(' catalogue', '')).join(' + ')} catalogue`,
          },
        })),
      dash.refresh('companies'),
      say('✓ Logged in NetHunt · reminder in 5 days'));
  } catch (t) {
    say(`Not logged in NetHunt — ${nhErr(t)}`, !0);
  }
}
async function shareCats(t, e, n, a) {
  const o = n.map((t) => CATALOGS[t]);
  say('Preparing the PDF…');
  let s = [];
  try {
    s = await Promise.all(
      o.map(async (t) => {
        const e = await fetch(catUrl(t));
        if (!e.ok) throw new Error(`HTTP ${e.status}`);
        return new File([await e.blob()], t.file, { type: 'application/pdf' });
      }),
    );
  } catch (t) {
    return void say(`Couldn’t load the catalogue — ${t.message}`, !0);
  }
  const r = countryOfIso(dash.params().iso) || {},
    cl = cmLang(r.languages),
    cx = {
      company:
        String((rowsOf('companies').find((e) => e.id === t) || {}).company || e)
          .replace(/[\s,]+(S\.?A\.?S?|LTDA|SAC|SPA|S\.?R\.?L\.?|LIMITADA|CIA|LTD|INC|LLC|MMC|JSC|CJSC)\.?$/i, '')
          .trim() || e,
      brand: LINES[OURS[oursKey()].all ? 'next' : oursKey()][0],
      line: LINES[OURS[oursKey()].all ? 'next' : oursKey()][1],
      country: r.country || 'your country',
      items: o.map((t) => t.label.replace(' catalogue', '')).join(' + '),
    },
    d = cmCatMsg(cl, cx).body,
    p = !(!navigator.canShare || !navigator.canShare({ files: s }));
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && p) {
    try {
      await navigator.share({ files: s, text: d });
    } catch (t) {
      if ('AbortError' === t.name) return void say('Not sent');
    }
    return void logCatSent(t, o, 'shared from phone');
  }
  const u = () =>
    s.forEach((t) => {
      const e = URL.createObjectURL(t),
        n = el('a');
      ((n.href = e), (n.download = t.name), document.body.append(n), n.click(), n.remove(), setTimeout(() => URL.revokeObjectURL(e), 4e3));
    });
  u();
  if (qs('#cm-sheet') && !qs('#cm-sheet').hidden && qs('#cm-sheet').classList.contains('center')) return void (say('📎 Downloaded — drag the PDF into the WhatsApp or Gmail chat. Logged as sent.'), logCatSent(t, o, 'downloaded on computer (Power hour)'));
  const m = rowsOf('companies').find((e) => e.id === t) || {},
    h = rowsOf('partner_contacts')
      .filter((e) =>
        String(e.company_ids || '')
          .split('|')
          .includes(t),
      )
      .sort((x, y2) => cmRank(x.title) - cmRank(y2.title)),
    g = [
      ...splitBar(m.phones)
        .filter(waOk)
        .map((t) => ({ who: 'Company', p: t })),
      ...h.flatMap((t) =>
        splitBar(t.phones)
          .filter(waOk)
          .map((e) => ({ who: t.name, p: e })),
      ),
    ].slice(0, 6),
    f = [...splitBar(m.emails), ...h.flatMap((t) => splitBar(t.emails))].filter(Boolean).slice(0, 3);
  {
    const node = el('div', 'cm-cat');
    node.append(el('div', 'hint', `${s.length > 1 ? 'PDFs' : 'PDF'} saved to your Downloads · ${s.map((t) => t.name).join(', ')}`));
    let lang = cl;
    const langs = [...new Set(['en', cl, /russ|рус/i.test(r.languages || '') ? 'ru' : ''])].filter(Boolean);
    const lrow = el('div', 'cm-catlang'),
      ta = el('textarea', 'cm-catmsg'),
      wrap = el('div', 'cm-catlinks');
    ((ta.rows = 7), (ta.spellcheck = !1), ta.setAttribute('aria-label', 'Message to send'));
    const draw = () => {
      lrow.replaceChildren();
      langs.forEach((c2) => {
        const bt = el('button', 'cm-chip', cmLangName(c2));
        ((bt.type = 'button'),
          bt.setAttribute('aria-pressed', String(c2 === lang)),
          bt.addEventListener('click', (ev) => {
            (ev.stopPropagation(), (lang = c2), (ta.value = cmCatMsg(lang, cx).body), draw(), sync());
          }),
          lrow.append(bt));
      });
    };
    const sync = () => {
      const body = ta.value,
        su = cmCatMsg(lang, cx).su;
      (wrap.querySelectorAll('a[data-wa]').forEach((el) => {
        el.href = `https://wa.me/${el.dataset.wa}?text=${encodeURIComponent(body)}`;
      }),
        wrap.querySelectorAll('a[data-mail]').forEach((el) => {
          el.href = `${gmailHref(el.dataset.mail)}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
        }));
    };
    ((ta.value = cmCatMsg(lang, cx).body),
      ta.addEventListener('input', sync),
      ta.addEventListener('click', (ev) => ev.stopPropagation()),
      draw());
    node.append(lrow, ta);
    {
      const cp = el('button', 'cm-btn ghost', 'Copy message');
      ((cp.type = 'button'),
        cp.addEventListener('click', (ev) => {
          ev.stopPropagation();
          try {
            navigator.clipboard
              .writeText(ta.value)
              .then(() => say('📋 Message copied'))
              .catch(() => {});
          } catch {}
        }));
      const cr = el('div', 'cm-catcopy');
      (cr.append(cp), node.append(cr));
    }
    g.length
      ? wrap.append(el('div', 'cm-sendgrp', 'WhatsApp'))
      : wrap.append(el('div', 'hint', 'No WhatsApp number with a country code on file.'));
    g.forEach(({ who: w2, p: n2 }) => {
      const row = el('div', 'cm-trow cm-sendrow'),
        who = el('span', 'cm-sendwho');
      (who.append(el('span', 'cm-sendname', w2), el('span', 'cm-sendnum', n2)), row.append(who));
      const cb = el('button', 'cm-btn ghost', CAN_CALL ? 'Call' : 'Copy');
      ((cb.type = 'button'),
        (cb.title = `${CAN_CALL ? 'Call' : 'Copy'} ${n2}`),
        cb.addEventListener('click', (ev) => {
          (ev.stopPropagation(), cmCopyNum(n2));
        }));
      const wab = el('a', 'cm-btn', 'Open chat');
      ((wab.dataset.wa = digits(n2)),
        (wab.target = '_blank'),
        (wab.rel = 'noopener noreferrer'),
        (wab.style.textDecoration = 'none'),
        (wab.title = 'Opens the WhatsApp app if it is installed, otherwise WhatsApp Web'),
        row.append(cb, wab),
        wrap.append(row));
    });
    f.length && wrap.append(el('div', 'cm-sendgrp', 'Email'));
    f.forEach((ad) => {
      const row = el('div', 'cm-trow cm-sendrow'),
        who = el('span', 'cm-sendwho');
      (who.append(el('span', 'cm-sendnum', ad)), row.append(who));
      const gm = el('a', 'cm-btn ghost', 'Gmail');
      ((gm.dataset.mail = ad),
        (gm.target = '_blank'),
        (gm.rel = 'noopener noreferrer'),
        (gm.style.textDecoration = 'none'),
        row.append(gm),
        wrap.append(row));
    });
    (node.append(wrap), sync());
    {
      const row = el('div', 'row cm-catfoot'),
        again = el('button', 'cm-btn ghost', 'Download again');
      ((again.type = 'button'),
        again.addEventListener('click', (ev) => {
          (ev.stopPropagation(), u());
        }));
      const sent = el('button', 'cm-btn', '✓ Mark as sent');
      ((sent.type = 'button'),
        (sent.title = 'Logs it in NetHunt and sets a reminder in 5 days'),
        sent.addEventListener('click', (ev) => {
          (ev.stopPropagation(), logCatSent(t, o, 'downloaded and attached on computer'), hidePop());
        }),
        row.append(again, sent),
        node.append(row));
    }
    showPop(a, `Send ${cx.items} · ${e}`, [], '', null, node, !0);
  }
}
const leadState = new Map();
let leadSel = new Set(),
  leadQ = '',
  leadBusy = !1,
  leadMsg = '',
  leadOem = !1;
const nkey = (t) => norm(t).replace(/[^a-z0-9]/g, '');
let oemRules = null;
function leadsFor(t, e) {
  const n = new Map();
  (rowsOf('tender_awards')
    .filter((e) => e.country_iso === t && !e.nethunt_id)
    .forEach((t) => {
      const e = nkey(t.company);
      if (!e) return;
      const a = n.get(e) || { key: e, name: t.company, tender: null, reg: null };
      (/OEM/i.test(t.company_type || '') && (a.oem = !0),
        (a.tender = {
          awards: (a.tender ? a.tender.awards : 0) + (t.awards || 0),
          value_usd: ((a.tender && a.tender.value_usd) || 0) + (t.value_usd || 0),
          value_local: t.value_local,
          currency: t.currency,
          niche: t.niche,
          source: t.source,
        }),
        n.set(e, a));
    }),
    rowsOf('registrations')
      .filter((e) => e.country_iso === t && !e.nethunt_id)
      .forEach((t) => {
        const e = nkey(t.company);
        if (!e) return;
        const a = n.get(e) || { key: e, name: t.company, tender: null, reg: null };
        ((a.reg = a.reg || { n: 0, brands: new Set(), segs: new Set(), authority: t.authority }),
          (a.reg.n += 1),
          t.manufacturer && a.reg.brands.add(t.manufacturer),
          t.segment && a.reg.segs.add(t.segment),
          t.manufacturer && nkey(t.manufacturer) === e && (a.oem = !0),
          n.set(e, a));
      }));
  const a = [...n.values()];
  return (
    a.forEach((t) => {
      !t.oem &&
        ((t) => {
          if (!oemRules) {
            const t = rowsOf('brand_profiles');
            if (!t.length) return !1;
            oemRules = t
              .map((t) => {
                try {
                  return new RegExp(t.match, 'i');
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
          }
          return oemRules.some((e) => e.test(t));
        })(t.name) &&
        (t.oem = !0);
    }),
    a
      .filter((t) => e || !t.oem)
      .sort(
        (t, e) =>
          ((e.tender && e.tender.value_usd) || 0) - ((t.tender && t.tender.value_usd) || 0) ||
          ((e.tender && e.tender.awards) || 0) - ((t.tender && t.tender.awards) || 0) ||
          ((e.reg && e.reg.n) || 0) - ((t.reg && t.reg.n) || 0),
      )
  );
}
const leadSub = (t) =>
  [
    t.oem ? 'Brand owner / manufacturer' : null,
    t.tender
      ? `${fmt(t.tender.awards)} tender award${1 === t.tender.awards ? '' : 's'}${t.tender.value_usd ? ` · ${money(t.tender.value_usd)}` : ''}${t.tender.niche ? ` · ${t.tender.niche}` : ''}`
      : null,
    t.reg
      ? `${fmt(t.reg.n)} registration${1 === t.reg.n ? '' : 's'}${t.reg.brands.size ? ` · ${[...t.reg.brands].slice(0, 3).join(', ')}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
function leadsBar(t) {
  const e = el('input');
  ((e.type = 'search'),
    (e.placeholder = 'Search…'),
    e.setAttribute('aria-label', 'Search companies'),
    (e.value = leadQ),
    e.addEventListener('input', () => {
      ((leadQ = e.value), sheetDraw());
    }),
    t.append(e));
}
function drawLeads(t) {
  const n = dash.params().iso,
    o = rowsOf('countries').find((t) => t.iso === n),
    s = dash.data('tender_awards'),
    r = dash.data('registrations');
  ('loading' !== s.status && 'loading' !== r.status) || t.append(el('div', 'hint', 'Loading tender and registration data…'));
  const c = leadsFor(n, leadOem),
    d = leadsFor(n, !0).length - leadsFor(n, !1).length,
    p = leadQ ? c.filter((t) => norm(t.name).includes(norm(leadQ))) : c,
    u = el('div', 'hint');
  if (
    ((u.textContent = `${fmt(c.length)} public-tender winners and device registrants in ${o ? o.country : 'this country'} that aren’t in NetHunt. Biggest tender value first.${!leadOem && d ? ` ${fmt(d)} brand owners (e.g. manufacturer subsidiaries) hidden.` : ''}`),
    t.append(u),
    d)
  ) {
    const e = el('div', 'cm-chips');
    ((e.style.margin = '0 6px 6px'),
      e.append(
        ...chipRow(
          [
            [!1, 'Distributors only'],
            [!0, 'Include brand owners'],
          ],
          leadOem,
          (t) => {
            ((leadOem = t), sheetDraw());
          },
        ),
      ),
      t.append(e));
  }
  const m = el('div', 'cm-chips');
  m.style.margin = '0 6px 6px';
  const h = [...leadSel].filter((t) => c.some((e) => e.key === t) && !['added', 'exists'].includes(leadState.get(t))).length,
    g = el('button', 'cm-btn ghost', 'Select top 10');
  ((g.type = 'button'),
    g.addEventListener('click', () => {
      (p
        .filter((t) => !leadState.get(t.key))
        .slice(0, 10)
        .forEach((t) => leadSel.add(t.key)),
        sheetDraw());
    }));
  const f = el('button', 'cm-btn ghost', 'Clear');
  ((f.type = 'button'),
    f.addEventListener('click', () => {
      ((leadSel = new Set()), sheetDraw());
    }));
  const y = el('button', 'cm-btn', leadBusy ? 'Stop' : `Add ${h || ''} to NetHunt`.replace('  ', ' '));
  ((y.type = 'button'),
    (y.disabled = !(leadBusy || (h && !1 !== nhAvail))),
    !1 === nhAvail && (y.title = NO_NH),
    y.addEventListener('click', () => {
      leadBusy
        ? (leadBusy = !1)
        : (async function (t) {
            const n = rowsOf('countries').find((e) => e.iso === t);
            if (!n) return;
            const o = leadsFor(t).filter((t) => leadSel.has(t.key) && !['added', 'exists'].includes(leadState.get(t.key)));
            ((leadBusy = !0), (leadMsg = ''));
            for (const t of o) {
              if (!leadBusy) break;
              (leadState.set(t.key, 'busy'), sheetDraw && sheetDraw());
              try {
                const o = await nhCall('search_records', { folderId: NH_FOLDER, text: t.name, limit: 5, fieldKeys: 'label' });
                if (
                  (Array.isArray(o) ? o : (o && o.records) || []).some((e) => {
                    const n = nkey((e.fields || {}).Name || '');
                    return n === t.key || (n.length >= 6 && t.key.length >= 6 && (n.includes(t.key) || t.key.includes(n)));
                  })
                ) {
                  (leadState.set(t.key, 'exists'), leadSel.delete(t.key));
                  continue;
                }
                const s = [
                    `Added from Medint on ${new Date().toISOString().slice(0, 10)}.`,
                    t.tender
                      ? `Public tenders: ${fmt(t.tender.awards)} awards${t.tender.value_usd ? `, ${money(t.tender.value_usd)}` : ''}${t.tender.niche ? `, ${t.tender.niche}` : ''} (${t.tender.source || 'tender data'}).`
                      : null,
                    t.reg
                      ? `Device registrations: ${fmt(t.reg.n)} (${t.reg.authority || 'registry'}); segments ${[...t.reg.segs].join(', ') || '—'}.`
                      : null,
                  ]
                    .filter(Boolean)
                    .join('\n'),
                  r = {
                    Name: t.name,
                    Country: [n.country],
                    Status: 'Unprocessed',
                    Source: [t.tender ? 'Public tender' : 'Device registration'],
                    Notes: s,
                  };
                (t.reg && t.reg.brands.size && (r.Brand = [...t.reg.brands].slice(0, 10)),
                  await nhCall('create_record', { folderId: NH_FOLDER, fieldKeys: 'label', fields: r }),
                  leadState.set(t.key, 'added'),
                  leadSel.delete(t.key));
              } catch (e) {
                if (((leadMsg = nhErr(e)), fatal(e))) {
                  (leadState.delete(t.key), ['not_in_manifest', 'unavailable'].includes(e.code) && (nhAvail = !1));
                  break;
                }
                leadState.set(t.key, 'failed');
              }
            }
            ((leadBusy = !1), sheetDraw && sheetDraw());
          })(n);
    }));
  const b = el('div'),
    v = el('button', 'cm-btn ghost', 'CSV');
  ((v.type = 'button'),
    (v.title = 'Download the selected (or all shown) as a NetHunt import file'),
    v.addEventListener('click', () =>
      (async function (t, e, n) {
        const a = rowsOf('countries').find((e) => e.iso === t),
          o = (t) => `"${String(t ?? '').replace(/"/g, '""')}"`,
          s = [['Name', 'Country', 'Status', 'Source', 'Brand', 'Notes'].join(',')]
            .concat(
              e.map((e) =>
                [
                  e.name,
                  a ? a.country : t,
                  'Unprocessed',
                  e.tender ? 'Public tender' : 'Device registration',
                  e.reg ? [...e.reg.brands].slice(0, 10).join('; ') : '',
                  leadSub(e),
                ]
                  .map(o)
                  .join(','),
              ),
            )
            .join('\n'),
          r = await cap('downloads');
        if (r)
          try {
            return void (await r.save({ filename: `not-in-nethunt-${t}.csv`, data: s }));
          } catch {}
        const c = el('textarea', 'cm-csv');
        ((c.value = s),
          (c.readOnly = !0),
          n.replaceChildren(el('div', 'hint', 'Copy this into a .csv file and import it in NetHunt:'), c),
          c.select());
      })(n, h ? c.filter((t) => leadSel.has(t.key)) : p, b),
    ),
    m.append(g, f, y, v),
    t.append(m, b),
    (leadMsg || !1 === nhAvail) && t.append(el('div', 'hint', leadMsg || NO_NH)),
    p.slice(0, 250).forEach((e) => {
      const n = leadState.get(e.key),
        o = el('label', 'cm-lead'),
        s = el('input');
      ((s.type = 'checkbox'),
        (s.checked = leadSel.has(e.key)),
        (s.disabled = 'added' === n || 'exists' === n || leadBusy),
        s.addEventListener('change', () => {
          (s.checked ? leadSel.add(e.key) : leadSel.delete(e.key), sheetDraw());
        }));
      const r = el(
        'span',
        'v' + ('added' === n ? ' ok' : 'failed' === n ? ' bad' : ''),
        { added: '✓ Added', exists: 'Already in NetHunt', busy: 'Adding…', failed: 'Failed' }[n] ||
          (e.tender && e.tender.value_usd ? money(e.tender.value_usd) : ''),
      );
      (o.append(s, el('span', 't', e.name), r, el('span', 's', leadSub(e))), t.append(o));
    }),
    p.length > 250 && t.append(el('div', 'hint', `+${fmt(p.length - 250)} more — search to narrow.`)));
}
const leadsBtn = qs('.cm-newleads');
((window.cmOpenLeads = (t, e) => {
  (window.cmOpenCountry(t),
    setTimeout(() => {
      ((leadOem = !0), (leadQ = e || ''), openSheet(leadsBtn, 'Not in NetHunt', drawLeads, { bar: leadsBar }));
    }, 60));
}),
  leadsBtn.addEventListener('click', () => {
    ((leadQ = ''), openSheet(leadsBtn, 'Not in NetHunt', drawLeads, { bar: leadsBar }));
  }));
let viewsDoc = null,
  viewsList = null,
  viewsNote = '',
  impRun = null,
  impArmed = 0;
const VIEW_KEYS = [
    'view',
    'iso',
    'isos',
    'glabel',
    'tags',
    'origin',
    'seg',
    'ctab',
    'csub',
    'pfit',
    'pstat',
    'psort',
    'pcity',
    'ours',
    'mseg',
    'stale',
    'cid',
    'from',
    'brand',
    'bq1',
    'bq2',
    'bcountry',
    'cmp',
  ],
  viewParams = () => {
    const t = dash.params(),
      e = {};
    return (
      VIEW_KEYS.forEach((n) => {
        null == t[n] || (Array.isArray(t[n]) && !t[n].length) || (e[n] = t[n]);
      }),
      e
    );
  },
  PLACE = { markets: 'markets', tenders: 'tenders-page', sources: 'sources-page', brand: 'brand', company: 'company', country: 'overview' };
function applyView(t) {
  const e = {};
  (VIEW_KEYS.forEach((n) => {
    e[n] = t[n] ?? null;
  }),
    dash.setParams(e),
    dash.setLink(PLACE[t.view] || 'overview'),
    window.scrollTo({ top: 0 }));
}
function viewLabel() {
  const t = dash.params(),
    e = rowsOf('countries').find((e) => e.iso === t.iso),
    n = curView(),
    a = OURS[oursKey()].label;
  return 'country' === n && e
    ? `${e.country} · ${a}`
    : 'brand' === n
      ? `${t.brand} · ${a}`
      : 'markets' === n
        ? `Markets · ${a} · ${t.mseg || OURS[oursKey()].seg}`
        : 'company' === n
          ? `Company · ${a}`
          : `${n[0].toUpperCase()}${n.slice(1)}`;
}
async function saveViews(t) {
  ((viewsList = t), sheetDraw && sheetDraw());
  try {
    (await viewsDoc.set({ list: t }), (viewsNote = ''));
  } catch {
    viewsNote = 'Couldn’t save — you may only have view access.';
  }
  sheetDraw && sheetDraw();
}
let moreAcct = [];
function drawMore(t) {
  {
    const n = rowsOf('maps_places'),
      a = new Set(
        rowsOf('companies')
          .filter((t) => t.google_maps)
          .map((t) => t.id),
      );
    {
      const k = oursKey(), key = OURS[k].all ? 'next' : k, iso = dash.params().iso, todo = [];
      const pend = rowsOf('contact_history').length ? new Set(rowsOf('contact_history').filter((e) => 'in' === e.dir).map((e) => e.record_id)) : new Set();
      const waiting = [...pend].filter((id) => { const r = realContact(id); return r && r.pending; }).length;
      waiting && todo.push([`↩ ${waiting} compan${1 === waiting ? 'y is' : 'ies are'} waiting for a reply`, () => { closeSheet(); window.__cm2.openPowerHour(qs('.cm-phtop')); }]);
      const due = todayData().due.length; due && todo.push([`🏁 ${due} follow-up${1 === due ? '' : 's'} due`, () => { closeSheet(); qs('.cm-tb-follow').click(); }]);
      if ('country' === curView()) {
        const pr = rowsOf('partners'); const sg = pr.filter((r) => suggestStatus(r.id, key, r[`status_${key}`])).length;
        sg && todo.push([`📈 ${sg} status update${1 === sg ? '' : 's'} suggested (replies or meetings)`, () => { closeSheet(); window.__cm2.openPowerHour(qs('.cm-phtop')); }]);
        const unk = pr.slice().sort((x, y) => (y[`score_${key}`] || 0) - (x[`score_${key}`] || 0)).slice(0, 25).filter((r) => !['ortho', 'not_ortho'].includes(r.ortho_verdict)).length;
        unk && todo.push([`🦴 ${unk} of the top 25 need an ortho check (tap their “Ortho?” badge)`, () => closeSheet()]);
      }
      (window.__cm2 && window.__cm2.moreItems ? window.__cm2.moreItems() : []).forEach((x) => todo.push(x));
      todo.push(['🔎 Find contacts written in comments', (ev) => window.__cm2.openCommentContacts(ev.currentTarget)]);
      'country' === curView() && todo.push(['🔗 Check related companies (same phone, domain or people)', (ev) => window.__cm2.openRelatedCheck(ev.currentTarget)]);
      todo.push(['🧹 Data quality for this country', (ev) => openSheet(ev.currentTarget, 'Data quality', drawQuality, { wide: !0 })]);
      moreAcct = window.__cm3 && window.__cm3.moreTiles ? window.__cm3.moreTiles(t, todo) : (todo.forEach(([l, f]) => { const b0 = el('button', 'cm-btn ghost', l); b0.type = 'button'; b0.addEventListener('click', f); t.append(b0); }), []);
    }
    if (n.length > mapsSavedCount) {
      const o = el('button', 'cm-btn ghost', `📍 Save ${fmt(n.length - mapsSavedCount)} new checked Google Maps links to NetHunt`);
      ((o.type = 'button'),
        (o.style.margin = '10px 6px 0'),
        (o.title = 'Links Claude matched and checked by name, address and phone'),
        o.addEventListener('click', async () => {
          o.disabled = !0;
          let t = 0;
          for (const e of n)
            if (a.has(e.id)) t += 1;
            else
              try {
                (await nhCall('update_record', { folderId: NH_FOLDER, recordId: e.id, fieldKeys: 'label', fields: { 'Google Maps': e.url } }),
                  (t += 1),
                  (o.textContent = `Saving… ${t}/${n.length}`));
              } catch (t) {
                if ((say(`Stopped: ${nhErr(t)}`, !0), fatal(t))) break;
              }
          ((o.textContent = `✓ ${t} of ${n.length} saved in NetHunt`),
            say(`✓ Google Maps links saved for ${t} companies`),
            dash.refresh('companies'));
        }),
        t.append(o));
    }
  }
  t.append(el('div', 'grp', 'This view'));
  const n = el('div', 'cm-chips');
  n.style.margin = '0 6px';
  const a = el('input');
  ((a.type = 'text'), (a.placeholder = viewLabel()), a.setAttribute('aria-label', 'Name for this view'));
  const o = el('button', 'cm-btn', 'Save');
  ((o.type = 'button'),
    (o.disabled = !1 === viewsList || null == viewsList),
    o.addEventListener('click', () => {
      const t = a.value.trim() || viewLabel();
      saveViews(
        [
          { name: t, params: viewParams(), ui: uiSnapshot(), at: new Date().toISOString() },
          ...(viewsList || []).filter((e) => e.name !== t),
        ].slice(0, 30),
      );
    }));
  const s = el('button', 'cm-btn ghost', 'Copy link');
  s.type = 'button';
  const r = el('div');
  (s.addEventListener('click', async () => {
    const t = `https://claude.ai/artifact/WgnKuXV1obKYvFkWYftzhV#v~${encodeURIComponent(JSON.stringify({ ...viewParams(), ui: uiSnapshot() }))}`;
    try {
      (await navigator.clipboard.writeText(t),
        (s.textContent = 'Copied ✓'),
        setTimeout(() => {
          s.textContent = 'Copy link';
        }, 1600));
    } catch {
      const e = el('input');
      ((e.type = 'text'),
        (e.value = t),
        (e.readOnly = !0),
        (e.style.width = '100%'),
        r.replaceChildren(el('div', 'hint', 'Copy this link:'), e),
        e.select());
    }
  }),
    n.append(a, o, s),
    t.append(n, r),
    viewsNote && t.append(el('div', 'hint', viewsNote)),
    t.append(el('div', 'grp', 'Saved views')),
    !1 === viewsList
      ? t.append(el('div', 'hint', 'Saving isn’t available here — use Copy link.'))
      : null == viewsList
        ? t.append(el('div', 'hint', 'Loading…'))
        : viewsList.length
          ? viewsList.forEach((e) => {
              const n = el('div', 'cm-pi');
              n.style.cursor = 'default';
              const a = el('button', 'cm-co t', e.name);
              ((a.type = 'button'),
                (a.style.textAlign = 'left'),
                a.addEventListener('click', () => {
                  (applyView(e.params || {}), e.ui && applyUi(e.ui, !1), closeSheet());
                }));
              const o = el('button', 'cm-mini', 'Delete');
              ((o.type = 'button'),
                o.addEventListener('click', () => saveViews(viewsList.filter((t) => t !== e))),
                n.append(el('span', null, '🔖'), a, o),
                t.append(n));
            })
          : t.append(el('div', 'hint', 'None yet. Saved views are private to you.')),
    t.append(el('div', 'grp', 'Data')));
  const d = changesSince();
  t.append(
    mark(
      el(
        'div',
        'hint',
        `Pipeline: saved snapshot${d ? ` from ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''} plus live NetHunt changes since then, so pages open faster. Ask Claude to refresh the snapshot weekly.`,
      ),
      'pipeline pipeline_changes',
    ),
  );
  const p = rowsOf('import_values').filter((t) => t.id && t.import_value_usd > 0),
    u = el('div', 'cm-chips');
  u.style.margin = '0 6px';
  const m = el('button', 'cm-btn ghost');
  m.type = 'button';
  const h = impRun && !impRun.stopped && !impRun.done;
  m.textContent = h
    ? 'Stop'
    : impRun && impRun.stopped && impRun.i < impRun.n
      ? 'Resume'
      : impRun && impRun.done
        ? 'Write again'
        : `Write imports to NetHunt (${fmt(p.length)})`;
  const g = Date.now() - impArmed < 15e3;
  (g && !h && (m.textContent = `Confirm: write ${fmt(p.length)} records`),
    (m.disabled = !p.length || (!1 === nhAvail && !h)),
    !1 === nhAvail && (m.title = NO_NH),
    m.addEventListener('click', () => {
      if (h) impRun.stopped = !0;
      else {
        if (!(g || (impRun && impRun.stopped))) return ((impArmed = Date.now()), void sheetDraw());
        ((impArmed = 0),
          (async function () {
            const t = rowsOf('import_values').filter((t) => t.id && t.import_value_usd > 0);
            ((impRun = {
              i: impRun && impRun.stopped ? impRun.i : 0,
              n: t.length,
              failed: impRun && impRun.stopped ? impRun.failed : 0,
              stopped: !1,
              msg: '',
            }),
              sheetDraw && sheetDraw());
            try {
              const t = await nhCall('get_folder', { folderId: NH_FOLDER });
              ((t && t.fields) || []).some((t) => 'Imports (USD)' === t.name) ||
                (await nhCall('add_folder_field', {
                  folderId: NH_FOLDER,
                  name: 'Imports (USD)',
                  type: 'currency',
                  groupName: 'Profile',
                  description:
                    'Total imports found in trade data (sum of the Total Value (USD) / Total USD timeline comments). Written from Medint.',
                  options: { format: { currency: 'USD', useGrouping: !0, digits: { min: 0, max: 0 } } },
                }));
            } catch (t) {
              return (
                (impRun.msg = nhErr(t)),
                (impRun.stopped = !0),
                ['not_in_manifest', 'unavailable'].includes(t && t.code) && (nhAvail = !1),
                void (sheetDraw && sheetDraw())
              );
            }
            for (; impRun.i < t.length && !impRun.stopped; impRun.i += 1) {
              const e = t[impRun.i];
              try {
                await nhCall('update_record', {
                  folderId: NH_FOLDER,
                  recordId: e.id,
                  fieldKeys: 'label',
                  fields: { 'Imports (USD)': Math.round(e.import_value_usd) },
                });
              } catch (t) {
                if (fatal(t)) {
                  ((impRun.msg = nhErr(t)), (impRun.stopped = !0), ['not_in_manifest', 'unavailable'].includes(t.code) && (nhAvail = !1));
                  break;
                }
                impRun.failed += 1;
              }
              impRun.i % 5 == 0 && sheetDraw && sheetDraw();
            }
            (impRun.stopped || (impRun.done = !0), sheetDraw && sheetDraw());
          })());
      }
    }),
    u.append(mark(m, 'import_values')),
    t.append(u));
  const f = el('div', 'hint');
  ((f.textContent =
    !1 !== nhAvail || impRun
      ? impRun
        ? `${fmt(Math.max(0, Math.min(impRun.i, impRun.n) - impRun.failed))} of ${fmt(impRun.n)} written${impRun.failed ? ` · ${fmt(impRun.failed)} skipped (record not found or not writable)` : ''}${impRun.done ? ' · done' : ''}${impRun.msg ? ` · ${impRun.msg}` : ''}`
        : 'Fills a NetHunt “Imports (USD)” number field (created if missing) with each company’s trade-data total, so you can sort and filter by it in NetHunt. Uses your NetHunt connection.'
      : NO_NH),
    t.append(f));
}
(qs('.cm-tb-more').addEventListener('click', (t) => {
  (openSheet(t.currentTarget, 'Menu', (b) => { drawMore(b); window.__cm3 && window.__cm3.tidyMore && window.__cm3.tidyMore(b, moreAcct); }, { wide: !0 }),
    (async function () {
      if (viewsDoc) return;
      const t = await cap('db'),
        e = await cap('user'),
        n = e && 'function' == typeof e.id ? await e.id().catch(() => null) : null;
      if (!t || !n) return ((viewsList = !1), void (sheetDraw && sheetDraw()));
      viewsDoc = t.doc(`data/users/${n}/views`);
      try {
        const t = await viewsDoc.get();
        viewsList = (t.exists && (t.data() || {}).list) || [];
      } catch {
        viewsList = !1;
      }
      sheetDraw && sheetDraw();
    })());
}),
  onData(() => {
    popRefresh && !pop.hidden && popRefresh();
  }));
const CC = {
  US: 1,
  TR: 90,
  PK: 92,
  IN: 91,
  PE: 51,
  IQ: 964,
  ID: 62,
  EG: 20,
  RU: 7,
  MX: 52,
  BR: 55,
  VN: 84,
  ES: 34,
  MY: 60,
  IT: 39,
  EC: 593,
  TN: 216,
  ZA: 27,
  DE: 49,
  FR: 33,
  AE: 971,
  KZ: 7,
  CN: 86,
  CO: 57,
  AZ: 994,
  SA: 966,
  KG: 996,
  UZ: 998,
  PH: 63,
  BD: 880,
  UA: 380,
  CL: 56,
  JO: 962,
  GR: 30,
  AR: 54,
  BG: 359,
  DO: 1,
  VE: 58,
  KE: 254,
  IR: 98,
  LB: 961,
  NG: 234,
  KR: 82,
  MA: 212,
  DZ: 213,
  TH: 66,
  GT: 502,
  BO: 591,
  LK: 94,
  NP: 977,
  GB: 44,
  TM: 993,
  GH: 233,
  PA: 507,
  CH: 41,
  PL: 48,
  GE: 995,
  UG: 256,
  LY: 218,
  CM: 237,
  AU: 61,
  SD: 249,
  TZ: 255,
  IL: 972,
  CR: 506,
  PY: 595,
  ET: 251,
  NA: 264,
  ZW: 263,
  RO: 40,
  SY: 963,
  AM: 374,
  BE: 32,
  PT: 351,
  CA: 1,
  HR: 385,
  TW: 886,
  YE: 967,
  MD: 373,
  AF: 93,
  RW: 250,
  NI: 505,
  BH: 973,
  MM: 95,
  CI: 225,
  PR: 1,
  SG: 65,
  HN: 504,
  MV: 960,
  KW: 965,
  MW: 265,
  AO: 244,
  CD: 243,
  IE: 353,
  BW: 267,
  JP: 81,
  MK: 389,
  AL: 355,
  TJ: 992,
  QA: 974,
  AT: 43,
  CZ: 420,
  MN: 976,
  NL: 31,
  OM: 968,
  HK: 852,
  HU: 36,
  BA: 387,
  BI: 257,
  LA: 856,
  RS: 381,
  LT: 370,
  SN: 221,
  BY: 375,
  BJ: 229,
  UY: 598,
  NO: 47,
  BF: 226,
  XK: 383,
  PS: 970,
  MU: 230,
  JM: 1,
  FI: 358,
  SE: 46,
  TT: 1,
  SK: 421,
  MR: 222,
  GN: 224,
  SO: 252,
  SL: 232,
  BT: 975,
  GY: 592,
  MZ: 258,
  LR: 231,
  NZ: 64,
  ME: 382,
  TD: 235,
  GA: 241,
  ZM: 260,
  TG: 228,
  DJ: 253,
  DK: 45,
  SI: 386,
  CY: 357,
  SV: 503,
  LS: 266,
  MT: 356,
  ML: 223,
  BN: 673,
  KH: 855,
  CU: 53,
  EE: 372,
  IS: 354,
  LV: 371,
  LU: 352,
  MO: 853,
  SC: 248,
};
function followPill(t, e) {
  if (!t) return null;
  const n = el(
    'span',
    `cm-fu ${((t) => {
      const e = localISO();
      return t ? (t < e ? 'over' : t === e ? 'today' : 'later') : '';
    })(t)}`,
  );
  return (
    (n.innerHTML = ICON_FLAG),
    n.append(dueLabel(t)),
    (n.title = `Next follow-up: ${new Date(`${t}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${e ? ` — ${e}` : ''}`),
    n
  );
}
const companyById = (t) => rowsOf('companies').find((e) => e.id === t) || rowsOf('pipeline_stages').find((e) => e.id === t) || {};
function countryOfIso(t) {
  return rowsOf('countries').find((e) => e.iso === t) || {};
}
const STATUS_SUGGEST = {
    Status: { no_answer: 'Called', left_msg: 'Contacted', spoke: 'Replied', meeting: 'Meeting', not_interested: 'Lost' },
    'NEXT Status': { no_answer: 'Called', left_msg: 'Contacted', spoke: 'Replied', meeting: 'Meeting', not_interested: 'Not interested' },
    'Motion Status': {
      no_answer: 'Contacted',
      left_msg: 'Contacted',
      spoke: 'Replied / Engaged',
      meeting: 'Qualified',
      not_interested: 'Other',
    },
  },
  OUTCOMES = [
    ['no_answer', 'No answer', 2],
    ['left_msg', 'Left message', 3],
    ['spoke', 'Spoke', 7],
    ['meeting', 'Meeting set', 0],
    ['not_interested', 'Not interested', 0],
    ['wrong', 'Wrong number', 0],
  ];
function micBar(t) {
  const e = window.SpeechRecognition || window.webkitSpeechRecognition,
    n = el('div', 'cm-mic');
  if (!e) return (n.append(el('span', 'hint', '🎤 Tip: use the microphone key on your phone keyboard to dictate.')), n);
  const a = countryOfIso((multiIsos() || [])[0] || dash.params().iso) || {};
  let o = /spanish/i.test(a.languages || '') ? 'es-ES' : 'en-US';
  const s = el('button', 'cm-btn ghost', '🎤 Dictate');
  s.type = 'button';
  const r = el('button', 'cm-chip', 'es-ES' === o ? 'ES' : 'EN');
  ((r.type = 'button'),
    (r.title = 'Language you will speak'),
    r.addEventListener('click', () => {
      ((o = 'es-ES' === o ? 'en-US' : 'es-ES'), (r.textContent = 'es-ES' === o ? 'ES' : 'EN'));
    }));
  const c = el('span', 'hint', '');
  let l = null,
    d = '';
  return (
    s.addEventListener('click', () => {
      if (l)
        (() => {
          if (l)
            try {
              l.stop();
            } catch {}
        })();
      else {
        ((l = new e()),
          (l.lang = o),
          (l.continuous = !0),
          (l.interimResults = !0),
          (d = t.value ? `${t.value.replace(/\s+$/, '')} ` : ''),
          (l.onresult = (e) => {
            let n = '',
              a = '';
            for (let t = 0; t < e.results.length; t += 1) {
              const o = e.results[t][0].transcript;
              e.results[t].isFinal ? (n += o) : (a += o);
            }
            ((t.value = (d + n + a).replace(/\s+/g, ' ').trimStart()), t.dispatchEvent(new Event('input')));
          }),
          (l.onerror = (t) => {
            c.textContent =
              'not-allowed' === t.error
                ? 'Microphone blocked here — use your keyboard’s 🎤 key instead.'
                : `Dictation stopped (${t.error}).`;
          }),
          (l.onend = () => {
            ((l = null),
              (s.textContent = '🎤 Dictate'),
              s.classList.remove('on'),
              c.textContent.startsWith('Micro') || (c.textContent = t.value ? 'Done — check the text, then save.' : ''));
          }));
        try {
          (l.start(),
            (s.textContent = '■ Stop'),
            s.classList.add('on'),
            (c.textContent = 'es-ES' === o ? 'Escuchando… habla ahora' : 'Listening… speak now'));
        } catch {
          ((c.textContent = 'Could not start the microphone.'), (l = null));
        }
      }
    }),
    n.append(s, r, c),
    n
  );
}
function lastTouch(t) {
  const e = dash.data('activity_2w');
  if ('ok' !== e.status) return null;
  let n = null;
  for (const a of e.data)
    a.record_id === t &&
      ('call' === a.type ||
        'calendar' === a.type ||
        ('email' === a.type && /kavikaplan|next-shoulder|duni-tech|oliga|d-xray|motionmedical/i.test(a.by_email))) &&
      (!n || a.time > n.time) &&
      (n = a);
  if (!n) return null;
  const a = Math.max(0, Math.floor((Date.now() - new Date(n.time)) / 864e5));
  return {
    who: (n.by || n.by_email || 'someone').split(' ')[0],
    type: 'calendar' === n.type ? 'meeting' : n.type,
    days: a,
    when: 0 === a ? 'today' : 1 === a ? 'yesterday' : `${a} days ago`,
  };
}
function sharedNumbers(t) {
  const e = (t) => digits(t).replace(/^0+/, '').slice(-9),
    n = new Set(),
    a = rowsOf('companies'),
    o = a.find((e) => e.id === t);
  if (!o) return [];
  splitBar(o.phones)
    .filter(goodPhone)
    .forEach((t) => n.add(e(t)));
  const s = [];
  return (
    a.forEach((a) => {
      if (a.id === t) return;
      const o = splitBar(a.phones)
        .filter(goodPhone)
        .find((t) => n.has(e(t)));
      o && s.push({ company: a.company, id: a.id, phone: o });
    }),
    s
  );
}
const logDrafts = new Map();
function openLogCall(t, e, n, a) {
  const o =
      a ||
      (OURS[oursKey()].all ? (['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'next') : oursKey()),
    s = logDrafts.get(e) || { outcome: '', details: '', fu: '', step: '', who: o, status: null, cal: !1 };
  (logDrafts.set(e, s),
    openSheet(
      t,
      `Log call · ${n}`,
      (t) => {
        const a = el('div', 'cm-edit cm-log'),
          o = (t, ...e) => {
            const n = el('div', 'lr');
            return (n.append(el('span', 'll', t), ...e), n);
          },
          r = el('div', 'cm-chips'),
          c = OUTCOMES.map(([t, e]) => {
            const n = el('button', 'cm-chip', e);
            return (
              (n.type = 'button'),
              n.setAttribute('aria-pressed', String(s.outcome === t)),
              n.addEventListener('click', () => {
                ((s.outcome = t), c.forEach((e, n) => e.setAttribute('aria-pressed', String(OUTCOMES[n][0] === t))));
                const e = OUTCOMES.find((e) => e[0] === t)[2];
                (e && !s.fuTouched && ((s.fu = addDays(localISO(), e)), (p.value = s.fu), g()),
                  (null != s.status && s.statusTouched) || ((s.status = (STATUS_SUGGEST[STATUS_FIELD[s.who]] || {})[t] || ''), $()));
              }),
              n
            );
          });
        r.append(...c);
        const l = el('textarea');
        ((l.placeholder = 'Details (optional): who you spoke to, what was agreed, objections…'),
          (l.value = s.details),
          l.addEventListener('input', () => {
            s.details = l.value;
          }));
        const d = el('div', 'cm-chips'),
          p = el('input');
        ((p.type = 'date'), (p.value = s.fu || ''), (p.className = 'cm-date'));
        const u = [
            ['Tomorrow', 1],
            ['3 days', 3],
            ['1 week', 7],
            ['2 weeks', 14],
          ],
          m = u.map(([t, e]) => {
            const n = el('button', 'cm-chip', t);
            return (
              (n.type = 'button'),
              n.addEventListener('click', () => {
                ((s.fu = addDays(localISO(), e)), (s.fuTouched = !0), (p.value = s.fu), g());
              }),
              n
            );
          }),
          h = el('button', 'cm-chip', 'None');
        ((h.type = 'button'),
          h.addEventListener('click', () => {
            ((s.fu = ''), (s.fuTouched = !0), (p.value = ''), g());
          }));
        const g = () => m.forEach((t, e) => t.setAttribute('aria-pressed', String(s.fu === addDays(localISO(), u[e][1]))));
        (p.addEventListener('change', () => {
          ((s.fu = p.value), (s.fuTouched = !0), g());
        }),
          g(),
          d.append(...m, h, p));
        const f = el('input');
        ((f.type = 'text'),
          (f.placeholder = 'Next step, e.g. send catalogue to GM'),
          (f.value = s.step),
          f.addEventListener('input', () => {
            s.step = f.value;
          }));
        const w = el('select', 'cm-fsel');
        (OUR3().forEach(([t, e]) => w.append(new Option(e.label, t))), (w.value = s.who));
        const _ = el('select', 'cm-fsel'),
          $ = () => {
            _.replaceChildren(new Option('Keep current status', ''));
            const t = choicesFor(STATUS_FIELD[s.who]);
            (t.forEach((t) => _.append(new Option(t, t))),
              s.status && !t.includes(s.status) && _.append(new Option(s.status, s.status)),
              (_.value = s.status || ''));
          };
        (w.addEventListener('change', () => {
          ((s.who = w.value), (s.status = (s.outcome && (STATUS_SUGGEST[STATUS_FIELD[s.who]] || {})[s.outcome]) || ''), $());
        }),
          _.addEventListener('change', () => {
            ((s.status = _.value), (s.statusTouched = !0));
          }),
          $(),
          choicesFor('Status').length || dash.data('company_fields'));
        const k = el('label', 'cm-check'),
          C = el('input');
        ((C.type = 'checkbox'),
          (C.checked = !!s.cal),
          C.addEventListener('change', () => {
            s.cal = C.checked;
          }),
          k.append(C, ' Also add the follow-up to my Google Calendar'));
        const x = el('div', 'hint');
        {
          const t = lastTouch(e);
          t &&
            t.days <= 3 &&
            a.prepend(el('div', 'cm-warn', `👤 ${t.who} already had a ${t.type} with them ${t.when} — check before contacting again.`));
        }
        const E = el('div', 'row'),
          S = el('button', 'cm-btn ghost', 'Close');
        S.type = 'button';
        const L = el('button', 'cm-btn', 'Save to NetHunt');
        ((L.type = 'button'),
          S.addEventListener('click', () => closeSheet()),
          L.addEventListener('click', async () => {
            if (!(s.outcome || s.details.trim() || s.fu || s.step || s.status))
              return void (x.textContent = 'Pick an outcome or write a note first.');
            ((L.disabled = !0), (L.textContent = 'Saving…'), (x.textContent = ''));
            const t = [];
            try {
              const n = `${(OUTCOMES.find((t) => t[0] === s.outcome) || [null, 'Call'])[1]}${s.details.trim() ? ` — ${s.details.trim()}` : ''}${s.step ? `\nNext step: ${s.step}` : ''}`;
              if (!s.loggedId) {
                const t = await nhCall('create_record_call_log', { folderId: NH_FOLDER, recordId: e, text: n });
                if (!t || ('object' == typeof t && !t.id && !t.type)) throw new Error('NetHunt did not confirm the call log');
                s.loggedId = t.id || 'logged';
              }
              t.push('call logged');
              const a = {};
              if ((s.status && (a[STATUS_FIELD[s.who]] = s.status), s.fuTouched || s.fu))
                if (s.fu) {
                  const [t, e, n] = s.fu.split('-').map(Number);
                  a['Next follow-up'] = Date.UTC(t, e - 1, n);
                } else a['Next follow-up'] = null;
              ((s.step.trim() || s.fuTouched) && (a['Next step'] = s.step.trim() || null),
                Object.keys(a).length &&
                  (await nhCall('update_record', { folderId: NH_FOLDER, recordId: e, fieldKeys: 'label', fields: a }),
                  s.status && t.push(`status → ${s.status}`),
                  s.fu && t.push(`follow-up ${dueLabel(s.fu)}`)));
            } catch (n) {
              return (
                (x.textContent = `${t.length ? `Saved: ${t.join(', ')}. ` : ''}Not saved: ${nhErr(n)} — your note is kept here; try again.`),
                (L.disabled = !1),
                (L.textContent = 'Save to NetHunt'),
                void afterWrite(e)
              );
            }
            if (s.cal && s.fu)
              try {
                const e = await cap('mcp');
                (await e.callTool('Google Calendar', 'create_event', {
                  summary: `Follow up: ${n}`,
                  startTime: `${s.fu}T00:00:00`,
                  endTime: `${addDays(s.fu, 1)}T00:00:00`,
                  allDay: !0,
                  description: [s.step, s.details].filter(Boolean).join('\n'),
                }),
                  t.push('calendar reminder'));
              } catch (e) {
                t.push('(calendar reminder failed)');
              }
            (logDrafts.delete(e), say(`✓ Saved to NetHunt: ${t.join(' · ')}`), afterWrite(e), closeSheet());
          }),
          E.append(S, L),
          a.append(o('Outcome', r), l, micBar(l), o('Follow up', d), o('', f), o('Status', w, _), k, x, E),
          t.append(a),
          setTimeout(() => l.focus(), 0));
      },
      { static: !0 },
    ));
}
function logBtn(t, e, n) {
  const a = el('button', 'cm-qi logc');
  return (
    (a.type = 'button'),
    (a.innerHTML = ICON_LOG),
    (a.title = 'Log a call / set next follow-up'),
    a.setAttribute('aria-label', `Log a call with ${e}`),
    a.addEventListener('click', (o) => {
      (o.stopPropagation(), openLogCall(a, t, e, n));
    }),
    a
  );
}
let tplLang = null;
const LINES = {
  next: ['Next Shoulder', 'shoulder arthroplasty implants'],
  dunitech: ['Dunitech', 'orthopaedic trauma implants made in Ankara, Türkiye'],
  motion: ['Motion Medical', 'orthopaedic products'],
};
function tplCtx(t) {
  const e = oursKey(),
    n = OURS[e].all ? (['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'next') : e,
    a = countryOfIso(t.iso || dash.params().iso),
    o = String(t.brands || '')
      .split(/\n|\|/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2)
      .slice(0, 2);
  return {
    company:
      String(t.company || '')
        .replace(/\s+(S\.?A\.?S?|LTDA|SAC|SPA|S\.?R\.?L\.?|LIMITADA|CIA|LTD|INC)\.?$/i, '')
        .trim() || 'team',
    brand: LINES[n][0],
    line: LINES[n][1],
    country: a.country || 'your country',
    brands: o.join(' and '),
    es: tplLang ? 'es' === tplLang : /spanish/i.test(a.languages || ''),
  };
}
function tplText(t, e) {
  return (
    e.es
      ? {
          intro: [
            `${e.brand} – distribución en ${e.country}`,
            `Estimado equipo de ${e.company}:\n\nSoy Kavi Kaplan, responsable de exportaciones de ${e.brand} (${e.line}). Buscamos un socio de distribución con experiencia en ${e.country}${e.brands ? ` y, por su trabajo con ${e.brands}, ${e.company} nos parece un muy buen candidato` : ''}.\n\n¿Tendrían unos minutos esta semana para una breve llamada? Con gusto les envío antes nuestro catálogo y lista de precios.\n\nSaludos cordiales,\nKavi Kaplan\n${e.brand}`,
          ],
          followup: [
            `Seguimiento – ${e.brand} en ${e.country}`,
            `Estimado equipo de ${e.company}:\n\nLes escribo para dar seguimiento a mi mensaje anterior sobre ${e.brand} (${e.line}). ¿Les vendría bien una breve llamada en los próximos días? También puedo enviarles el catálogo y la lista de precios por correo.\n\nSaludos cordiales,\nKavi Kaplan`,
          ],
          meeting: [
            `Solicitud de reunión – ${e.brand}`,
            `Estimado equipo de ${e.company}:\n\nMe gustaría proponerles una breve reunión (en línea o presencial) para presentarles ${e.brand} (${e.line}) y conversar sobre la distribución en ${e.country}. ¿Qué día y hora les conviene esta semana o la próxima?\n\nSaludos cordiales,\nKavi Kaplan`,
          ],
          wa: `Hola, buen día. Soy Kavi Kaplan de ${e.brand} (${e.line}). Buscamos un distribuidor en ${e.country} y nos gustaría presentarle nuestros productos a ${e.company}. ¿Tendría unos minutos para una breve llamada?`,
        }
      : {
          intro: [
            `${e.brand} – distribution partnership in ${e.country}`,
            `Dear ${e.company} team,\n\nI'm Kavi Kaplan, responsible for export at ${e.brand} (${e.line}). We are looking for an experienced distribution partner in ${e.country}${e.brands ? `, and given your work with ${e.brands}, ${e.company} looks like a strong fit` : ''}.\n\nWould you be open to a short call this week? I'm happy to send our catalogue and price list beforehand.\n\nBest regards,\nKavi Kaplan\n${e.brand}`,
          ],
          followup: [
            `Following up – ${e.brand} in ${e.country}`,
            `Dear ${e.company} team,\n\nI'm following up on my previous message about ${e.brand} (${e.line}). Would a short call in the coming days work for you? I can also send our catalogue and price list by email.\n\nBest regards,\nKavi Kaplan`,
          ],
          meeting: [
            `Meeting request – ${e.brand}`,
            `Dear ${e.company} team,\n\nI'd like to propose a short meeting (online or in person) to present ${e.brand} (${e.line}) and discuss distribution in ${e.country}. Which day and time would suit you this week or next?\n\nBest regards,\nKavi Kaplan`,
          ],
          wa: `Hello, this is Kavi Kaplan from ${e.brand} (${e.line}). We are looking for a distribution partner in ${e.country} and would like to present our products to ${e.company}. Would you have a few minutes for a short call?`,
        }
  )[t];
}
function templateBar(t, e, n) {
  const a = el('div', 'cm-tpl'),
    o = () => {
      const s = tplCtx(t);
      a.replaceChildren(el('span', 'tl', 'wa' === n ? 'WhatsApp message' : 'Write with template'));
      const r = el('span', 'lang');
      ([
        ['en', 'EN'],
        ['es', 'ES'],
      ].forEach(([t, e]) => {
        const n = el('button', null, e);
        ((n.type = 'button'),
          n.setAttribute('aria-pressed', String((s.es ? 'es' : 'en') === t)),
          n.addEventListener('click', (e) => {
            (e.stopPropagation(), (tplLang = t), o());
          }),
          r.append(n));
      }),
        ('wa' === n
          ? [['wa', 'Intro']]
          : [
              ['intro', 'Intro'],
              ['followup', 'Follow-up'],
              ['meeting', 'Meeting'],
            ]
        ).forEach(([t, o]) => {
          const r = el('a', 'cm-chip', o);
          if (((r.target = '_blank'), (r.rel = 'noopener noreferrer'), 'wa' === n))
            r.href = `${waHref(e)}?text=${encodeURIComponent(tplText('wa', s))}`;
          else {
            const [n, a] = tplText(t, s);
            r.href = `${gmailHref(e)}&su=${encodeURIComponent(n)}&body=${encodeURIComponent(a)}`;
          }
          a.append(r);
        }),
        a.append(r));
    };
  return (o(), a);
}
function prepText(t) {
  return [...t.querySelectorAll('h3, .k, p, li')]
    .map((t) =>
      'H3' === t.tagName || t.classList.contains('k')
        ? `\n${t.textContent.toUpperCase()}`
        : `${'LI' === t.tagName ? '• ' : ''}${t.textContent}`,
    )
    .join('\n')
    .trim();
}
function prepBtn(t, e) {
  const n = el('button', e ? 'cm-btn ghost' : 'cm-qi prep', e ? '📋 Meeting prep brief' : null);
  return (
    (n.type = 'button'),
    e || (n.innerHTML = ICON_PREP),
    (n.title = 'Meeting prep brief'),
    n.setAttribute('aria-label', 'Meeting prep brief'),
    n.addEventListener('click', (o) => {
      (o.stopPropagation(),
        (function (t, n) {
          (dash.params().ncid !== n && dash.setParams({ ncid: n }),
            openSheet(
              t,
              'Meeting prep',
              (t) => {
                const o = rowsOf('partners').find((t) => t.id === n) || {},
                  r = companyById(n),
                  c = r.company || o.company || 'Company',
                  d = r.iso || dash.params().iso,
                  p = countryOfIso(d),
                  u = el('div', 'cm-prep'),
                  m = el('h3', null, `${flag(d)} ${c}`);
                (u.append(m),
                  u.append(
                    el('p', 'mut', [r.city ? String(r.city).split(',')[0] : '', p.country, r.category].filter(Boolean).join(' · ')),
                  ));
                const h = OUR3()
                  .map(([t, e]) => `${e.label}: ${o[`status_${t}`] || r[e.field] || '—'}`)
                  .join(' · ');
                u.append(el('p', null, h));
                const g = o.days_since_contact;
                u.append(
                  el(
                    'p',
                    null,
                    `Last contact: ${null == g ? 'never' : g <= 0 ? 'today' : `${g} days ago`} · ${fmt((Number(r.emails_total) || 0) + (Number(r.calls_total) || 0))} logged interactions${r.next_followup ? ` · next follow-up ${dueLabel(r.next_followup)}${r.next_step ? ` (${r.next_step})` : ''}` : ''}`,
                  ),
                );
                const f = String(o.line_names || '')
                  .split('|')
                  .filter(Boolean);
                if ((u.append(el('div', 'k', 'What they carry')), f.length)) {
                  const t = el('ul');
                  (f.slice(0, 12).forEach((e) => t.append(el('li', null, e))), u.append(t));
                } else u.append(el('p', 'mut', 'No brands recorded in NetHunt.'));
                u.append(el('div', 'k', 'Size & public business'));
                const y = rowsOf('tender_awards').filter((t) => t.nethunt_id === n),
                  b = rowsOf('registrations').filter((t) => t.nethunt_id === n),
                  w = y.reduce((t, e) => t + (e.value_usd || 0), 0),
                  _ = y.reduce((t, e) => t + (e.awards || 0), 0);
                (u.append(el('p', null, `Imports in trade data: ${o.import_value_usd ? money(o.import_value_usd) : 'none found'}`)),
                  u.append(
                    el(
                      'p',
                      null,
                      y.length
                        ? `Public tenders won: ${e(_)} awards${w ? ` · ${money(w)}` : ''}${y[0] && y[0].niche ? ` · ${[...new Set(y.map((t) => t.niche).filter(Boolean))].slice(0, 3).join(', ')}` : ''}`
                        : 'Public tenders: none matched',
                    ),
                  ),
                  u.append(
                    el(
                      'p',
                      null,
                      b.length
                        ? `Device registrations: ${e(b.length)} (${[...new Set(b.map((t) => t.manufacturer).filter(Boolean))].slice(0, 4).join(', ')})`
                        : 'Device registrations: none matched',
                    ),
                  ));
                const $ = rowsOf('brands_in_country')
                  .filter((t) => !f.some((e) => e.startsWith(t.brand)))
                  .slice(0, 5)
                  .map((t) => t.brand);
                $.length &&
                  (u.append(el('div', 'k', `Competitor brands active in ${p.country || 'the country'}`)),
                  u.append(el('p', null, $.join(', '))));
                const k = rowsOf('partner_contacts').filter((t) => String(t.company_ids).split('|').includes(n));
                if ((u.append(el('div', 'k', 'People')), k.length)) {
                  const t = el('ul');
                  (k.slice(0, 6).forEach((e) => t.append(el('li', null, [e.name, e.title, e.email, e.phone].filter(Boolean).join(' · ')))),
                    u.append(t));
                } else u.append(el('p', 'mut', 'No contacts linked in NetHunt — ask for the GM or product manager.'));
                u.append(el('div', 'k', 'Recent activity'));
                const C = dash.data('partner_timeline');
                if (dash.params().ncid !== n || 'loading' === C.status || C.refreshing) u.append(el('p', 'mut', 'Loading…'));
                else if ('ok' === C.status && C.data.length) {
                  const t = el('ul');
                  (C.data
                    .slice(0, 5)
                    .forEach((e) =>
                      t.append(
                        el(
                          'li',
                          null,
                          `${e.time ? new Date(e.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''} · ${e.type}${e.by ? ` (${e.by.split(' ')[0]})` : ''}: ${clip(e.title ? `${e.title} — ${e.detail}` : e.detail, 160)}`,
                        ),
                      ),
                    ),
                    u.append(t));
                } else u.append(el('p', 'mut', 'Nothing logged yet.'));
                const x = oursKey(),
                  E = OURS[x].all ? 'next' : x,
                  S = String(o[`seg_brand_names_${E}`] || '')
                    .split('|')
                    .filter(Boolean),
                  L = [];
                (S.length
                  ? L.push(
                      `They already sell ${S.slice(0, 3).join(', ')} — position ${LINES[E][0]} as a second line: pricing, delivery times, registration support.`,
                    )
                  : L.push(
                      `No ${OURS[E].seg.toLowerCase()} line recorded — ask whether they serve ${OURS[E].seg.toLowerCase()} today and through whom.`,
                    ),
                  y.length &&
                    L.push(`They win public tenders (${e(_)} awards) — ask which tenders they target and what registrations they need.`),
                  o.import_value_usd &&
                    L.push(`Trade data shows about ${money(o.import_value_usd)} of imports — ask current suppliers and yearly volumes.`),
                  b.length ||
                    L.push('No registrations found under their name — confirm who holds the registrations for the products they sell.'),
                  (null == g || g > 60) &&
                    L.push(
                      null == g
                        ? 'First real conversation — introduce the company, then qualify.'
                        : `Last contact was ${g} days ago — recap where things stood.`,
                    ),
                  k.length || L.push('Get the decision-maker’s name, email and mobile.'));
                {
                  const t = sharedNumbers(n),
                    e = lastTouch(n);
                  (t.length || e) &&
                    (u.append(el('div', 'k', 'Before you contact them')),
                    e && u.append(el('p', null, `👤 Last touch by ${e.who}: ${e.type}, ${e.when}.`)),
                    t
                      .slice(0, 3)
                      .forEach((t) =>
                        u.append(el('p', null, `☎ ${t.phone} is also listed for ${t.company} — may be the same team or a sister company.`)),
                      ));
                }
                {
                  const t = (function (t) {
                    const e = rowsOf('tender_awards').filter((e) => e.country_iso === t),
                      n = e
                        .slice()
                        .sort((t, e) => (e.value_usd || 0) - (t.value_usd || 0))
                        .slice(0, 5),
                      a = new Map();
                    return (
                      e.forEach((t) =>
                        String(t.top_buyers || '')
                          .split(';')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .forEach((e) => {
                            const n = norm(e),
                              o = a.get(n) || { name: e, value: 0, n: 0 };
                            ((o.value += t.value_usd || 0), (o.n += 1), a.set(n, o));
                          }),
                      ),
                      {
                        winners: n,
                        buyers: [...a.values()].sort((t, e) => e.value - t.value).slice(0, 5),
                        total: d3.sum(e, (t) => t.value_usd || 0),
                      }
                    );
                  })(d);
                  if (t.winners.length) {
                    if (
                      (u.append(
                        el('div', 'k', `Public tender market in ${p.country || 'the country'} (ortho, ${money(t.total)} recorded)`),
                      ),
                      t.buyers.length)
                    ) {
                      u.append(el('p', 'mut', 'Hospitals that buy most:'));
                      const e = el('ul');
                      (t.buyers.forEach((t) => e.append(el('li', null, t.name))), u.append(e));
                    }
                    u.append(el('p', 'mut', 'Who wins those tenders:'));
                    const e = el('ul');
                    (t.winners.forEach((t) =>
                      e.append(
                        el(
                          'li',
                          null,
                          `${t.company}${t.nethunt_id === n ? ' (this company)' : ''} — ${money(t.value_usd || 0)}${t.share_pct ? ` · ${t.share_pct}% share` : ''}${t.niche ? ` · ${t.niche}` : ''}`,
                        ),
                      ),
                    ),
                      u.append(e),
                      L.push(
                        `Open with the market: public hospitals${t.buyers[0] ? ` such as ${t.buyers[0].name}` : ''} bought ${money(t.total)} of ortho implants through tenders — ask which of these they bid on and who they lose to.`,
                      ));
                  }
                }
                {
                  const t = (function (t) {
                    const e = countryOfIso(t) || {},
                      n = rowsOf('registration_rules').find((e) => e.iso === t),
                      a = regRow(e.country || '');
                    return n || a
                      ? {
                          rule: n,
                          dun: (a && a.reg_dunitech) || 'Not started',
                          nxt: (a && a.reg_next) || 'Not started',
                          holder:
                            a && a.holder_ids
                              ? a.holder_ids
                                  .split('|')
                                  .map((t) => (companyById(t) || {}).company || '')
                                  .filter(Boolean)
                                  .join(', ')
                              : '',
                        }
                      : null;
                  })(d);
                  t &&
                    (u.append(el('div', 'k', 'Registration')),
                    t.rule && u.append(el('p', null, `${t.rule.regulator}: ${t.rule.required}`)),
                    u.append(
                      el(
                        'p',
                        'mut',
                        `Our status — Dunitech: ${t.dun} · Next Shoulder: ${t.nxt}${t.holder ? ` · holder: ${t.holder}` : ''}`,
                      ),
                    ),
                    t.holder ||
                      !t.rule ||
                      /^Not yet/.test(t.rule.required) ||
                      L.push(
                        `Ask if they would hold the registration with ${t.rule.regulator.split(' (')[0].split(' —')[0]} — and how long their last implant registration took.`,
                      ));
                }
                {
                  const t = el('div', 'k', 'Talking points'),
                    e = el('ul', 'cm-tp');
                  L.forEach((t) => e.append(el('li', null, t)));
                  const n = u.querySelector('.k');
                  (n ? u.insertBefore(t, n) : u.append(t), u.insertBefore(e, t.nextSibling));
                }
                const A = el('div', 'row'),
                  N = el('button', 'cm-btn ghost', 'Copy as text');
                ((N.type = 'button'),
                  N.addEventListener('click', async () => {
                    try {
                      (await navigator.clipboard.writeText(prepText(u)), (N.textContent = 'Copied ✓'));
                    } catch {
                      const t = el('textarea', 'cm-csv');
                      ((t.value = prepText(u)), A.after(t), t.select());
                    }
                  }),
                  A.append(
                    N,
                    (function (t, e) {
                      const n = el('button', 'cm-btn', 'Log a call');
                      return ((n.type = 'button'), n.addEventListener('click', () => openLogCall(n, t, e)), n);
                    })(n, c),
                  ),
                  u.append(A),
                  t.append(u));
              },
              { wide: !0 },
            ));
        })(n, t));
    }),
    n
  );
}
const officeOpenCache = new Map(); setInterval(() => officeOpenCache.clear(), 60e3); // per country, worked out once a minute
let todayMemo = { key: '', at: 0, val: null };
function todayData() {
  const key = [oursKey(), dash.params().iso, ...[...('country' === curView() ? ['companies'] : []), 'pipeline_stages', 'calendar_events', 'meeting_links', 'medint_ignore'].map((n) => { const d = dash.data(n); return `${d.status}:${(d.data || []).length}`; }), dash.params().ign].join('|');
  if (todayMemo.key === key && Date.now() - todayMemo.at < 15e3) return todayMemo.val;
  const val = todayData0(); todayMemo = { key, at: Date.now(), val }; return val;
}
function todayData0() {
  const t = localISO(),
    e = oursKey(),
    n = OURS[e].all ? 'all' : e,
    a = new Map(('country' === curView() ? rowsOf('companies') : []).map((t) => [t.id, t])), // live follow-ups of the open country; the pipeline covers the rest
    o = rowsOf('pipeline_stages').map((t) =>
      a.has(t.id) ? { ...t, next_followup: a.get(t.id).next_followup, next_step: a.get(t.id).next_step } : t,
    ),
    s = new Set(o.map((t) => t.id)),
    r = dash.params().iso;
  a.forEach((t) => {
    !s.has(t.id) && t.next_followup && o.push({ ...t, iso: r });
  });
  const i = o.filter((e) => e.next_followup && e.next_followup <= t && !(window.__cm2 && window.__cm2.isIgnored(e.id))).sort((t, e) => t.next_followup.localeCompare(e.next_followup)),
    c = new Set(
      rowsOf('meeting_links')
        .filter((t) => 'ignore' === t.action)
        .map((t) => t.event_id),
    ),
    d = addDays(t, 1),
    p = rowsOf('calendar_events')
      .filter(
        (e) =>
          !e.all_day &&
          !e.from_gmail &&
          (!e.color || '8' === e.color) &&
          !c.has(e.id) &&
          e.start &&
          [t, d].includes(localISO(new Date(e.start))),
      )
      .sort((t, e) => String(t.start).localeCompare(String(e.start))),
    u = o
      .map((t) => ({ r: t, ago: agoDays(t.last_interaction) }))
      .filter(
        ({ r: e, ago: a }) =>
          e[`stage_${n}`] >= 3 &&
          e[`stage_${n}`] <= 5 &&
          (null == a || a >= 14) &&
          e.iso &&
          (function (t) {
            if (officeOpenCache.has(t)) return officeOpenCache.get(t);
            const v = (function (t) {
            const e = TZ[t];
            if (!e) return !1;
            try {
              const t = Object.fromEntries(
                  new Intl.DateTimeFormat('en-US', { timeZone: e, hour: 'numeric', hourCycle: 'h23', weekday: 'short' })
                    .formatToParts(new Date())
                    .map((t) => [t.type, t.value]),
                ),
                n = Number(t.hour);
              return !/Sat|Sun/.test(t.weekday) && n >= 9 && n < 18;
            } catch {
              return !1;
            }
            })(t);
            officeOpenCache.set(t, v); return v;
          })(e.iso) &&
          !(e.next_followup && e.next_followup > t),
      )
      .sort((t, e) => e.r[`stage_${n}`] - t.r[`stage_${n}`] || (e.ago ?? 999) - (t.ago ?? 999))
      .slice(0, 12);
  return { t, tm: d, due: i, meets: p, now: u, stK: n };
}
function drawToday(t) {
  const { t: n, due: a, meets: o, now: r, stK: c } = todayData(),
    d = new Map(rowsOf('countries').map((t) => [t.iso, t.country])),
    p = new Map(rowsOf('meetings').map((t) => [t.event_id, t])),
    u = (t) => {
      const e = el('div', 'cm-trow'),
        n = el('button', 'cm-pi');
      if (
        ((n.type = 'button'),
        t.id ? (n.dataset.openCompany = t.id) : (n.disabled = !safeHref(t.href)),
        n.append(el('span', null, t.icon || ''), el('span', 't', t.label), el('span', 's', t.sub || '')),
        safeHref(t.href))
      ) {
        const a = el('a', 'cm-pi');
        ((a.href = safeHref(t.href)), (a.target = '_blank'), (a.rel = 'noopener noreferrer'), a.append(...n.childNodes), e.append(a));
      } else e.append(n);
      return (t.id && e.append(logBtn(t.id, t.label)), e);
    };
  (t.append(el('div', 'grp', `Follow-ups due · ${fmt(a.length)}`)),
    a.length || t.append(el('div', 'hint', 'Nothing due. Set follow-ups from “Log call” on any company.')),
    a
      .slice(0, 40)
      .forEach((e) =>
        t.append(
          u({
            id: e.id,
            icon: flag(e.iso) || '🏢',
            label: e.company,
            sub: `${dueLabel(e.next_followup)}${e.next_step ? ` · ${e.next_step}` : ''}`,
          }),
        ),
      ),
    t.append(el('div', 'grp', `Meetings today & tomorrow · ${fmt(o.length)}`)),
    'error' === dash.data('calendar_events').status
      ? t.append(el('div', 'hint', 'Calendar not available here.'))
      : o.length || t.append(el('div', 'hint', 'No meetings today or tomorrow.')),
    o.forEach((e) => {
      const a = p.get(e.id),
        o = new Date(e.start);
      t.append(
        u({
          id: a ? a.company_id : null,
          href: a ? null : e.link,
          icon: '8' === e.color ? '🕓' : '📅',
          label: e.summary,
          sub: `${localISO(o) === n ? 'Today' : 'Tomorrow'} ${o.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${'8' === e.color ? ' · proposed' : ''}`,
        }),
      );
    }));
  {
    const n = rowsOf('pipeline_stages')
        .map((t) => ({ r: t, ago: agoDays(t.last_interaction) }))
        .filter(
          ({ r: t, ago: e }) =>
            t[`stage_${c}`] >= 3 && t[`stage_${c}`] <= 5 && (null == e || e >= fuDays) && (!fuHere || t.iso === dash.params().iso),
        )
        .sort((t, e) => e.r[`stage_${c}`] - t.r[`stage_${c}`] || (e.ago ?? 9999) - (t.ago ?? 9999)),
      a = el('div', 'grp');
    a.append(`Gone quiet · ${fmt(n.length)} `);
    const o = el('span', 'cm-chips cm-inl');
    (o.append(
      ...chipRow(
        [
          [14, '14+ d'],
          [30, '30+'],
          [60, '60+'],
        ],
        fuDays,
        (t) => {
          ((fuDays = t), sheetDraw());
        },
      ),
      ...(dash.params().iso
        ? chipRow(
            [
              [!1, 'All'],
              [!0, flag(dash.params().iso) || 'Here'],
            ],
            fuHere,
            (t) => {
              ((fuHere = t), sheetDraw());
            },
          )
        : []),
    ),
      a.append(o),
      t.append(a),
      n
        .slice(0, 60)
        .forEach(({ r: e, ago: n }) =>
          t.append(
            u({
              id: e.id,
              icon: flag(e.iso) || '🏢',
              label: e.company,
              sub: `${STAGE[e[`stage_${c}`]]} · ${null == n ? 'never' : `${n} days`}`,
            }),
          ),
        ),
      n.length > 60 && t.append(el('div', 'hint', `+${fmt(n.length - 60)} more — narrow with 30+ / 60+ or this country.`)));
  }
  (t.append(el('div', 'grp', `Call now — office hours there, quiet 14+ days · ${fmt(r.length)}`)),
    r.length || t.append(el('div', 'hint', 'No engaged leads are in office hours right now.')),
    r.forEach(({ r: e, ago: n }) =>
      t.append(
        u({
          id: e.id,
          icon: flag(e.iso) || '🏢',
          label: e.company,
          sub: `${d.get(e.iso) || ''} · ${STAGE[e[`stage_${c}`]]} · ${null == n ? 'never' : `${n} days`}`,
        }),
      ),
    ));
}
qs('.cm-tb-follow').addEventListener('click', (t) => openSheet(t.currentTarget, 'Today', drawToday));
const OUR_DOMAINS = /@(kavikaplan\.com|duni-tech\.com|oliga\.com\.tr|d-xray\.com|next-shoulder\.com|motionmedical\.fi)$/i,
  PLACEHOLDER = /^(desconocido|unknown|n\/?a|test|tbd|-+|\?+|no name|sin nombre|none|xxx+)$/i,
  legalStrip = (t) =>
    norm(t)
      .replace(/\b(s\.?a\.?s?|ltda|limitada|sac|s\.?r\.?l|spa|cia|ltd|inc|llc|eirl|de c\.?v|sa de cv|co)\b\.?/g, '')
      .replace(/[^a-z0-9]/g, '');
let dqBusy = !1;
function drawQuality(t) {
  const n = dash.params().iso,
    a = countryOfIso(n);
  if (!n || 'ok' !== dash.data('companies').status)
    return void t.append(el('div', 'hint', 'Open a country first — the check covers that country’s NetHunt companies.'));
  const o = (function (t) {
    const e = rowsOf('companies'),
      n = CC[t],
      a = [];
    (e.forEach((t) => {
      (PLACEHOLDER.test(String(t.company || '').trim()) || String(t.company || '').trim().length < 3) &&
        a.push({ kind: 'Placeholder name', c: t, note: `“${t.company}”` });
    }),
      d3
        .groups(
          e.filter((t) => legalStrip(t.company).length >= 4),
          (t) => legalStrip(t.company),
        )
        .filter(([, t]) => t.length > 1)
        .forEach(([, t]) => t.forEach((e) => a.push({ kind: 'Possible duplicate', c: e, note: `${t.length} records named like this` }))));
    const o = (t) => {
      const e = String(t || '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .replace(/^www\./, '');
      return /\.[a-z]{2,}$/.test(e) && !/^(not found|0)$/.test(e) ? e : null;
    };
    return (
      d3
        .groups(
          e.filter((t) => o(t.website)),
          (t) => o(t.website),
        )
        .filter(([, t]) => t.length > 1)
        .forEach(([t, e]) =>
          e.forEach((e) => {
            a.some((t) => t.c === e && 'Possible duplicate' === t.kind) ||
              a.push({ kind: 'Possible duplicate', c: e, note: `same website ${t}` });
          }),
        ),
      e.forEach((t) => {
        const e = splitBar(t.phones).filter(goodPhone);
        e.length &&
          n &&
          !e.some((t) => /^\s*(\+|00)/.test(t)) &&
          a.push({
            kind: 'Phone without country code',
            c: t,
            note: e.join(', '),
            fix: {
              label: `Add +${n}`,
              fields: { 'Phone number': e.map((t) => (/^\s*(\+|00)/.test(t) ? t : `+${n} ${t.trim().replace(/^0+/, '')}`)) },
            },
          });
        {
          const e = sharedNumbers(t.id);
          e.length &&
            a.push({
              kind: 'Phone shared with another company',
              c: t,
              note: `${e[0].phone} also on ${e
                .map((t) => t.company)
                .slice(0, 2)
                .join(', ')} — possibly the same group`,
            });
        }
        (e.length ||
          splitBar(t.emails).length ||
          a.push({ kind: 'No phone or email', c: t, note: t.website ? `website: ${t.website}` : 'no website either' }),
          ['status', 'next_status'].forEach((e) => {
            /^no info$/i.test(String(t[e] || '').trim()) &&
              a.push({
                kind: '“No info” status',
                c: t,
                note: `${'status' === e ? 'Status' : 'NEXT Status'}: ${t[e]}`,
                fix: { label: 'Clear', fields: { ['status' === e ? 'Status' : 'NEXT Status']: null } },
              });
          }));
      }),
      a
    );
  })(n);
  (t.append(
    el(
      'div',
      'hint',
      `${fmt(o.length)} issues in ${fmt(rowsOf('companies').length)} ${a.country} companies. Fix buttons write to NetHunt; duplicates are best merged in NetHunt itself.`,
    ),
  ),
    d3
      .groups(o, (t) => t.kind)
      .forEach(([n, a]) => {
        const o = el('div', 'grp');
        o.append(`${n} · ${fmt(a.length)}`);
        const s = a.filter((t) => t.fix);
        if (s.length > 1) {
          const t = el('button', 'cm-mini', `Fix all ${fmt(s.length)}`);
          ((t.type = 'button'),
            (t.style.marginLeft = '10px'),
            (t.disabled = dqBusy),
            t.addEventListener('click', async () => {
              dqBusy = !0;
              let t = 0;
              for (const e of s)
                try {
                  (await nhCall('update_record', { folderId: NH_FOLDER, recordId: e.c.id, fieldKeys: 'label', fields: e.fix.fields }),
                    (t += 1),
                    say(`Fixing… ${t}/${s.length}`));
                } catch (t) {
                  if ((say(`Stopped: ${nhErr(t)}`, !0), fatal(t))) break;
                }
              ((dqBusy = !1), say(`✓ Fixed ${t} of ${s.length} in NetHunt`), dash.refresh('companies'));
            }),
            o.append(t));
        }
        (t.append(o),
          a.slice(0, 60).forEach((e) => {
            const n = el('div', 'cm-trow'),
              a = el('button', 'cm-pi');
            if (
              ((a.type = 'button'),
              (a.dataset.openCompany = e.c.id),
              a.append(el('span', null, '🏢'), el('span', 't', e.c.company || '(no name)'), el('span', 's', e.note)),
              n.append(a),
              e.fix)
            ) {
              const t = el('button', 'cm-btn ghost', e.fix.label);
              ((t.type = 'button'),
                t.addEventListener('click', async () => {
                  t.disabled = !0;
                  try {
                    (await nhCall('update_record', { folderId: NH_FOLDER, recordId: e.c.id, fieldKeys: 'label', fields: e.fix.fields }),
                      (t.textContent = '✓ Fixed'),
                      say(`✓ ${e.c.company} fixed in NetHunt`),
                      dash.refresh('companies'));
                  } catch (e) {
                    ((t.disabled = !1), say(`Not saved — ${nhErr(e)}`, !0));
                  }
                }),
                n.append(t));
            }
            t.append(n);
          }));
      }));
}
const bulkBar = el('div', 'cm-bulk');
async function bulkWrite(t, e) {
  const n = [...selIds];
  let a = 0;
  for (const o of n)
    try {
      const s = e(o);
      (s && (await nhCall('update_record', { folderId: NH_FOLDER, recordId: o, fieldKeys: 'label', fields: s }), (a += 1)),
        say(`${t}… ${a}/${n.length}`));
    } catch (t) {
      if ((say(`Stopped after ${a}: ${nhErr(t)}`, !0), fatal(t))) return;
    }
  (say(`✓ ${t}: ${a} of ${n.length} saved in NetHunt`), dash.refresh('companies'), dash.refresh('pipeline_changes'));
}
function drawBulk() {
  if (((bulkBar.hidden = !selMode || 'country' !== curView()), bulkBar.hidden)) return;
  const t = oursKey(),
    n = OURS[t].all ? (['dunitech', 'next', 'motion'].includes(dash.params().pstat) ? dash.params().pstat : 'next') : t,
    a = (t, e) => {
      const n = el('button', 'cm-chip', t);
      return ((n.type = 'button'), (n.disabled = !selIds.size), n.addEventListener('click', () => e(n)), n);
    };
  bulkBar.replaceChildren(
    el('span', 'n', `${fmt(selIds.size)} selected`),
    a(`${LINES[n][0].split(' ')[0]} status ▾`, (t) =>
      openMenu(
        t,
        choicesFor(STATUS_FIELD[n]).map((t) => ({
          label: t,
          act: () => bulkWrite(`${STATUS_FIELD[n]} → ${t}`, () => ({ [STATUS_FIELD[n]]: t })),
        })),
      ),
    ),
    a('Follow-up ▾', (t) =>
      openMenu(
        t,
        [
          ['Tomorrow', 1],
          ['In 3 days', 3],
          ['In 1 week', 7],
          ['In 2 weeks', 14],
          ['Clear', null],
        ].map(([t, e]) => ({
          label: t,
          act: () =>
            bulkWrite(`Follow-up ${t.toLowerCase()}`, () => {
              if (null == e) return { 'Next follow-up': null };
              const [t, n, a] = addDays(localISO(), e).split('-').map(Number);
              return { 'Next follow-up': Date.UTC(t, n - 1, a) };
            }),
        })),
      ),
    ),
    a('Tag ▾', (t) =>
      openMenu(
        t,
        choicesFor('Tags').map((t) => ({
          label: t,
          act: () =>
            bulkWrite(`Tag “${t}”`, (e) => {
              const n = splitBar(companyById(e).tags);
              return n.includes(t) ? null : { Tags: [...n, t] };
            }),
        })),
      ),
    ),
    a('Export CSV', async () => {
      const t = [...selIds].map(companyById),
        e = (t) => `"${String(t ?? '').replace(/"/g, '""')}"`,
        n = [
          ['Company', 'City', 'Status', 'NEXT Status', 'Motion Status', 'Phones', 'Emails', 'Website', 'Next follow-up', 'Next step'].join(
            ',',
          ),
        ]
          .concat(
            t.map((t) =>
              [t.company, t.city, t.status, t.next_status, t.motion_status, t.phones, t.emails, t.website, t.next_followup, t.next_step]
                .map(e)
                .join(','),
            ),
          )
          .join('\n'),
        a = await cap('downloads');
      if (a)
        try {
          return void (await a.save({ filename: `companies-${dash.params().iso || 'export'}.csv`, data: n }));
        } catch {}
      try {
        (await navigator.clipboard.writeText(n), say('CSV copied — paste it into a spreadsheet'));
      } catch {
        say('Couldn’t export here', !0);
      }
    }),
    a('Clear', () => {
      (selIds.clear(), drawPartners(), drawBulk());
    }),
  );
  const o = el('button', 'cm-mini', 'Done');
  ((o.type = 'button'),
    o.addEventListener('click', () => {
      ((selMode = !1), selIds.clear(), drawPartners(), drawBulk());
    }),
    bulkBar.append(o),
    bulkBar.querySelectorAll('.cm-chip').forEach((t, e) => {
      4 === e && (t.disabled = !1);
    }));
}
if (
  ((bulkBar.hidden = !0),
  bulkBar.setAttribute('role', 'toolbar'),
  bulkBar.setAttribute('aria-label', 'Bulk actions'),
  document.body.append(bulkBar),
  onData(drawBulk),
  window.matchMedia)
) {
  const t = window.matchMedia('(max-width: 640px)'),
    e = () => {
      try {
        drawPartners();
      } catch {}
    };
  t.addEventListener && t.addEventListener('change', e);
}
(!(function () {
  const t = dash.params().tags;
  (Array.isArray(t) && t.length) || dash.setParams({ tags: ['-'] });
})(),
  (function () {
    const t = new Date(Date.now() - 12096e5).toISOString().slice(0, 10) + 'T00:00:00Z';
    dash.params().act_from !== t && dash.setParams({ act_from: t });
    const h90 = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10) + 'T00:00:00Z';
    dash.params().hist_from !== h90 && dash.setParams({ hist_from: h90 });
  })());
// moved to app2.js: hav, drawTripMap
function hav(...a) { return window.__cm2.hav(...a); }
function drawTripMap(...a) { return window.__cm2.drawTripMap(...a); }
onData(() => {
  const n = qs('.cm-tb-follow .cm-badge'),
    a = 'ok' === dash.data('pipeline_stages').status ? todayData() : null,
    o = a ? a.due.length + a.meets.filter((t) => localISO(new Date(t.start)) === a.t).length : 0;
  n.textContent = o ? (o > 99 ? '99+' : String(o)) : '';
  const s = dash.data('recent_changes'),
    r = 'ok' === s.status ? s.data.filter((t) => 'down' !== t.kind).length : 0;
  qs('.cm-tb-new .cm-badge').textContent = r ? (r > 99 ? '99+' : String(r)) : '';
  const i = 'country' === curView() ? dash.params().iso : null, // only the country page shows this count
    c =
      i && 'ok' === dash.data('tender_awards').status && 'ok' === dash.data('registrations').status
        ? leadsFor(i).filter((t) => !['added', 'exists'].includes(leadState.get(t.key))).length
        : null;
  ((leadsBtn.textContent = null == c ? '—' : `＋ ${fmt(c)} not in NetHunt`),
    (qs('.cm-newleads-wrap').hidden = 0 === c),
    !sheetDraw ||
      (sheet.contains(document.activeElement) && document.activeElement.matches('input[type=text], input[type=search]')) ||
      sheetDraw());
});
const uiSnapshot = () => ({
  gap: {
    region: gapState.region,
    min: gapState.min,
    growing: gapState.growing,
    unknown: gapState.unknown,
    sort: gapState.sort,
    dir: gapState.dir,
  },
  tst: { sort: tst.sort, dir: tst.dir },
  table: { cat: filt.cat, stat: filt.stat, sf: filt.sf, dist: filt.dist, sortImp: filt.sortImp },
  fuDays: fuDays,
  fuHere: fuHere,
  funAll: funAll,
  leadOem: leadOem,
  groups: savedGroups,
  phTpl: phTemplates,
  cgStar: cgStars,
  trips: tripPlans,
  ignored: ignoredCos,
  dayPlan,
  uiFlags,
  mapsSaved: mapsSavedCount,
  nhUrl: nhUrlPattern,
  noWa: [...noWaNums],
  p: Object.fromEntries(
    ['stale', 'mseg', 'origin', 'seg', 'tcountry', 'tniche', 'tcrm', 'ctab', 'ours', 'csub', 'pfit', 'pstat', 'psort', 'pcity'].map((t) => [
      t,
      dash.params()[t] ?? null,
    ]),
  ),
});
function applyUi(t, e) {
  if (!t || 'object' != typeof t) return;
  (t.gap && Object.assign(gapState, t.gap),
    t.tst && Object.assign(tst, t.tst),
    t.table && Object.assign(filt, t.table),
    t.fuDays && (fuDays = t.fuDays),
    'boolean' == typeof t.fuHere && (fuHere = t.fuHere),
    Array.isArray(t.groups) && (savedGroups = t.groups),
    t.phTpl && 'object' == typeof t.phTpl && (phTemplates = t.phTpl),
    t.cgStar && 'object' == typeof t.cgStar && (cgStars = t.cgStar),
    Array.isArray(t.trips) && (tripPlans = t.trips),
    t.ignored && 'object' == typeof t.ignored && (ignoredCos = t.ignored),
    t.dayPlan && 'object' == typeof t.dayPlan && (dayPlan = t.dayPlan),
    t.uiFlags && 'object' == typeof t.uiFlags && (uiFlags = t.uiFlags),
    'number' == typeof t.mapsSaved && (mapsSavedCount = Math.max(mapsSavedCount, t.mapsSaved)),
    'string' == typeof t.nhUrl && (nhUrlPattern = t.nhUrl),
    Array.isArray(t.noWa) && (noWaNums = new Set(t.noWa)),
    'boolean' == typeof t.funAll && (funAll = t.funAll),
    'boolean' == typeof t.leadOem && (leadOem = t.leadOem));
  const n = dash.params(),
    a = {},
    o = new Set(['ours', 'mseg', 'pstat', 'psort']);
  if (t.p)
    for (const [s, r] of Object.entries(t.p))
      null != r && (e || null == n[s] || (o.has(s) && !location.hash.startsWith('#v~'))) && (a[s] = r);
  Object.keys(a).length && dash.setParams(a);
  const s = curView();
  try {
    'markets' === s ? drawMarkets() : 'tenders' === s ? drawTenders() : 'country' === s && drawTable();
  } catch {}
}
let prefsDoc = null,
  prefsSaved = '';
(async () => {
  const t = await cap('db'),
    e = await cap('user'),
    n = e && 'function' == typeof e.id ? await e.id().catch(() => null) : null;
  if (t && n) {
    prefsDoc = t.doc(`data/users/${n}/prefs`);
    try {
      const t = await prefsDoc.get();
      if (t.exists) {
        const e = t.data() || {};
        ((prefsSaved = JSON.stringify(e.ui || {})), location.hash.startsWith('#v~') || applyUi(e.ui, !1));
      }
    } catch {}
    setInterval(() => {
      const t = JSON.stringify(uiSnapshot());
      t !== prefsSaved && ((prefsSaved = t), prefsDoc.set({ ui: JSON.parse(t), at: new Date().toISOString() }).catch(() => {}));
    }, 2500);
  }
})();
const TZ = {
  US: 'America/New_York',
  TR: 'Europe/Istanbul',
  PK: 'Asia/Karachi',
  IN: 'Asia/Kolkata',
  PE: 'America/Lima',
  IQ: 'Asia/Baghdad',
  ID: 'Asia/Jakarta',
  EG: 'Africa/Cairo',
  RU: 'Europe/Moscow',
  MX: 'America/Mexico_City',
  BR: 'America/Sao_Paulo',
  VN: 'Asia/Ho_Chi_Minh',
  ES: 'Europe/Madrid',
  MY: 'Asia/Kuala_Lumpur',
  IT: 'Europe/Rome',
  EC: 'America/Guayaquil',
  TN: 'Africa/Tunis',
  ZA: 'Africa/Johannesburg',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  AE: 'Asia/Dubai',
  KZ: 'Asia/Almaty',
  CN: 'Asia/Shanghai',
  CO: 'America/Bogota',
  AZ: 'Asia/Baku',
  SA: 'Asia/Riyadh',
  KG: 'Asia/Bishkek',
  UZ: 'Asia/Tashkent',
  PH: 'Asia/Manila',
  BD: 'Asia/Dhaka',
  UA: 'Europe/Kiev',
  CL: 'America/Santiago',
  JO: 'Asia/Amman',
  GR: 'Europe/Athens',
  AR: 'America/Argentina/Buenos_Aires',
  BG: 'Europe/Sofia',
  DO: 'America/Santo_Domingo',
  VE: 'America/Caracas',
  KE: 'Africa/Nairobi',
  IR: 'Asia/Tehran',
  LB: 'Asia/Beirut',
  NG: 'Africa/Lagos',
  KR: 'Asia/Seoul',
  MA: 'Africa/Casablanca',
  DZ: 'Africa/Algiers',
  TH: 'Asia/Bangkok',
  GT: 'America/Guatemala',
  BO: 'America/La_Paz',
  LK: 'Asia/Colombo',
  NP: 'Asia/Kathmandu',
  GB: 'Europe/London',
  TM: 'Asia/Ashgabat',
  GH: 'Africa/Accra',
  PA: 'America/Panama',
  CH: 'Europe/Zurich',
  PL: 'Europe/Warsaw',
  GE: 'Asia/Tbilisi',
  UG: 'Africa/Kampala',
  LY: 'Africa/Tripoli',
  CM: 'Africa/Douala',
  AU: 'Australia/Sydney',
  SD: 'Africa/Khartoum',
  TZ: 'Africa/Dar_es_Salaam',
  IL: 'Asia/Jerusalem',
  CR: 'America/Costa_Rica',
  PY: 'America/Asuncion',
  ET: 'Africa/Addis_Ababa',
  NA: 'Africa/Windhoek',
  ZW: 'Africa/Harare',
  RO: 'Europe/Bucharest',
  SY: 'Asia/Damascus',
  AM: 'Asia/Yerevan',
  BE: 'Europe/Brussels',
  PT: 'Europe/Lisbon',
  CA: 'America/Toronto',
  HR: 'Europe/Zagreb',
  TW: 'Asia/Taipei',
  YE: 'Asia/Aden',
  MD: 'Europe/Chisinau',
  AF: 'Asia/Kabul',
  RW: 'Africa/Kigali',
  NI: 'America/Managua',
  BH: 'Asia/Bahrain',
  MM: 'Asia/Yangon',
  CI: 'Africa/Abidjan',
  PR: 'America/Puerto_Rico',
  SG: 'Asia/Singapore',
  HN: 'America/Tegucigalpa',
  MV: 'Indian/Maldives',
  KW: 'Asia/Kuwait',
  MW: 'Africa/Blantyre',
  AO: 'Africa/Luanda',
  CD: 'Africa/Kinshasa',
  IE: 'Europe/Dublin',
  BW: 'Africa/Gaborone',
  JP: 'Asia/Tokyo',
  MK: 'Europe/Skopje',
  AL: 'Europe/Tirane',
  TJ: 'Asia/Dushanbe',
  QA: 'Asia/Qatar',
  AT: 'Europe/Vienna',
  CZ: 'Europe/Prague',
  MN: 'Asia/Ulaanbaatar',
  NL: 'Europe/Amsterdam',
  OM: 'Asia/Muscat',
  HK: 'Asia/Hong_Kong',
  HU: 'Europe/Budapest',
  BA: 'Europe/Sarajevo',
  BI: 'Africa/Bujumbura',
  LA: 'Asia/Vientiane',
  RS: 'Europe/Belgrade',
  LT: 'Europe/Vilnius',
  SN: 'Africa/Dakar',
  BY: 'Europe/Minsk',
  BJ: 'Africa/Porto-Novo',
  UY: 'America/Montevideo',
  NO: 'Europe/Oslo',
  BF: 'Africa/Ouagadougou',
  PS: 'Asia/Gaza',
  MU: 'Indian/Mauritius',
  JM: 'America/Jamaica',
  FI: 'Europe/Helsinki',
  SE: 'Europe/Stockholm',
  TT: 'America/Port_of_Spain',
  SK: 'Europe/Bratislava',
  MR: 'Africa/Nouakchott',
  GN: 'Africa/Conakry',
  SO: 'Africa/Mogadishu',
  SL: 'Africa/Freetown',
  BT: 'Asia/Thimphu',
  GY: 'America/Guyana',
  MZ: 'Africa/Maputo',
  LR: 'Africa/Monrovia',
  NZ: 'Pacific/Auckland',
  ME: 'Europe/Podgorica',
  TD: 'Africa/Ndjamena',
  GA: 'Africa/Libreville',
  ZM: 'Africa/Lusaka',
  TG: 'Africa/Lome',
  DJ: 'Africa/Djibouti',
  DK: 'Europe/Copenhagen',
  SI: 'Europe/Ljubljana',
  CY: 'Asia/Nicosia',
  SV: 'America/El_Salvador',
  LS: 'Africa/Maseru',
  MT: 'Europe/Malta',
  ML: 'Africa/Bamako',
  BN: 'Asia/Brunei',
  KH: 'Asia/Phnom_Penh',
  CU: 'America/Havana',
  EE: 'Europe/Tallinn',
  IS: 'Atlantic/Reykjavik',
  LV: 'Europe/Riga',
  LU: 'Europe/Luxembourg',
  MO: 'Asia/Macau',
  SC: 'Indian/Mahe',
  XK: 'Europe/Belgrade',
};
function drawGlance() {
  const e = qs('#glance');
  if (!e || 'country' !== curView()) return;
  if (multiIsos()) return void e.replaceChildren();
  const n = rowsOf('countries').find((t) => t.iso === dash.params().iso);
  if ((e.replaceChildren(), !n)) return;
  const o = (t, a, o, s, l) => {
    const d = el('span', 'g');
    (s && (d.title = s), t && d.append(t), a && d.append(a));
    const p = el('b', null, o);
    return (l && mark(p, 'countries', l, `iso=${enc(n.iso)}`), d.append(p), e.append(d), d);
  };
  (null != n.population_m && o(null, 'Pop. ', `${d3.format(',.1f')(n.population_m)}M`, 'Population'),
    null != n.gdp_per_capita_usd && o(null, 'GDP/person ', money(n.gdp_per_capita_usd), 'GDP per person'),
    n.currency && o(null, '', (n.currency.match(/\(([A-Z]{3})\)/) || [])[1] || n.currency, n.currency, 'currency'),
    n.languages && o(null, '', n.languages, 'Languages', 'languages'));
}
onData(drawGlance);
const HOL_ID = {
    AT: 'austrian',
    AU: 'australian',
    BG: 'bulgarian',
    BR: 'brazilian',
    CA: 'canadian',
    CN: 'china',
    CZ: 'czech',
    DE: 'german',
    DK: 'danish',
    ES: 'spain',
    FI: 'finnish',
    FR: 'french',
    GB: 'uk',
    GR: 'greek',
    HK: 'hong_kong',
    HR: 'croatian',
    HU: 'hungarian',
    ID: 'indonesian',
    IE: 'irish',
    IL: 'jewish',
    IN: 'indian',
    IT: 'italian',
    JP: 'japanese',
    KR: 'south_korea',
    LT: 'lithuanian',
    LV: 'latvian',
    MX: 'mexican',
    MY: 'malaysia',
    NL: 'dutch',
    NO: 'norwegian',
    NZ: 'new_zealand',
    PH: 'philippines',
    PL: 'polish',
    PT: 'portuguese',
    RO: 'romanian',
    RU: 'russian',
    SE: 'swedish',
    SG: 'singapore',
    SI: 'slovenian',
    SK: 'slovak',
    TR: 'turkish',
    TW: 'taiwan',
    UA: 'ukrainian',
    US: 'usa',
    VN: 'vietnamese',
    ZA: 'sa',
    SA: 'saudiarabian',
  },
  NO_HOL = new Set(['PS']),
  holCal = (t) => `en.${HOL_ID[t] || t.toLowerCase()}#holiday@group.v.calendar.google.com`;
function drawCallNow() {
  const e = curView(),
    n = ('company' === e && window.cmCompanyIso) || dash.params().iso;
  (!n ||
    NO_HOL.has(n) ||
    ('country' !== e && 'company' !== e) ||
    (dash.params().hol_cc === n.toLowerCase() && dash.params().hol_cal === holCal(n)) ||
    dash.setParams({ hol_cc: n.toLowerCase(), hol_cal: holCal(n) }),
    [
      ['#callnow', 'country'],
      ['#callnow-company', 'company'],
    ].forEach(([a, o]) => {
      const s = qs(a);
      if (!s) return;
      if ((s.replaceChildren(), e !== o || !n || ('country' === o && multiIsos()))) return;
      const r = (function (t) {
        const e = TZ[t];
        if (!e) return null;
        try {
          const n = new Date(),
            a = new Intl.DateTimeFormat('en-GB', { timeZone: e, hour: '2-digit', minute: '2-digit' }).format(n),
            o = new Intl.DateTimeFormat('en-GB', { timeZone: e, weekday: 'short', day: 'numeric', month: 'short' }).format(n),
            s = Object.fromEntries(
              new Intl.DateTimeFormat('en-US', { timeZone: e, hour: 'numeric', hourCycle: 'h23', weekday: 'short' })
                .formatToParts(n)
                .map((t) => [t.type, t.value]),
            ),
            r = new Intl.DateTimeFormat('en-CA', { timeZone: e, year: 'numeric', month: '2-digit', day: '2-digit' }).format(n),
            l = new Intl.DateTimeFormat('en-US', { timeZone: e, timeZoneName: 'shortOffset' })
              .formatToParts(n)
              .find((t) => 'timeZoneName' === t.type),
            d = Number(s.hour),
            p = /Sat|Sun/.test(s.weekday),
            u = NO_HOL.has(t)
              ? { status: 'none', data: [] }
              : dash.params().hol_cal === holCal(t)
                ? dash.data('holidays')
                : { status: 'loading', data: [] },
            m = 'ok' === u.status ? u.data : [],
            h = m.filter((t) => t.public_holiday),
            g = h.find((t) => t.date === r),
            f = m.find((t) => t.date === r && !t.public_holiday),
            y = h.find((t) => t.date > r),
            b = !p && !g,
            v = b && d >= 9 && d < 18,
            w = document.createDocumentFragment(),
            _ = el('div', 't');
          (_.append(el('b', null, a), `${o} · ${l ? l.value.replace('GMT', 'UTC') : ''}`), w.append(_));
          const $ = el('div', 'st'),
            k = el('span', 'dot');
          ((k.style.background = v ? 'var(--color-ok)' : g ? 'var(--color-warn, #d9a02b)' : 'var(--cds-chart-muted)'),
            $.append(
              k,
              v ? 'Office hours — good time to call' : b ? (d < 9 ? 'Before office hours' : 'After office hours') : 'Offices closed today',
            ),
            w.append($));
          const C = el('div', 'hol');
          if (
            ((C.textContent = g
              ? `🎉 Public holiday: ${g.name}`
              : p
                ? 'Weekend'
                : 'ok' === u.status
                  ? 'Working day' + (f ? ` · ${f.name} (observance)` : '')
                  : 'none' === u.status
                    ? 'Working day (no public holiday calendar for this country)'
                    : 'error' === u.status
                      ? 'Working day (holidays unavailable)'
                      : 'Working day…'),
            (g || p || 'ok' === u.status) && mark(C, 'holidays'),
            w.append(C),
            y)
          ) {
            const t = new Date(`${y.date}T12:00:00Z`),
              e = Math.round((t - new Date(`${r}T12:00:00Z`)) / 864e5);
            w.append(
              mark(
                el(
                  'div',
                  null,
                  `Next holiday: ${y.name} · ${t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} (${1 === e ? 'tomorrow' : `in ${e} days`})`,
                ),
                'holidays',
              ),
            );
          }
          return w;
        } catch {
          return null;
        }
      })(n);
      r && s.append(r);
    }));
}
if (
  (onData(drawCallNow),
  setInterval(() => {
    document.hidden || drawCallNow();
  }, 3e4),
  setInterval(() => {
    document.hidden || drawGlance();
  }, 3e4),
  (function () {
    const t = (t) => String(t).padStart(2, '0'),
      e = (e) => `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T00:00:00`,
      n = new Date(),
      a = e(n),
      o = e(new Date(n.getTime() + 18144e5));
    (dash.params().cal_from === a && dash.params().cal_to === o) || dash.setParams({ cal_from: a, cal_to: o });
  })(),
  location.hash.startsWith('#v~'))
)
  try {
    const t = JSON.parse(decodeURIComponent(location.hash.slice(3)));
    (applyView(t), t.ui && applyUi(t.ui, !1));
  } catch {}
('#brand' === location.hash && dash.params().brand && ensureBrandView(),
  '#company' === location.hash && dash.params().cid && ensureCompanyView(),
  'markets' === curView() && ensureMarketsView(),
  0);
// names app2.js uses, live (getters) — and drawing starts once app2.js is loaded
window.__cm = Object.defineProperties({ flush: () => { onDataReady = !0; pendingOnData.forEach((t) => dash.onData(t)); } }, {
  drawChanges: { get: () => drawChanges },
  uiFlags: { get: () => uiFlags, set: (v) => { uiFlags = v; } },
  dayPlan: { get: () => dayPlan, set: (v) => { dayPlan = v; } },
  ignoredCos: { get: () => ignoredCos, set: (v) => { ignoredCos = v; } },
  tripPlans: { get: () => tripPlans, set: (v) => { tripPlans = v; } },
  cgStars: { get: () => cgStars, set: (v) => { cgStars = v; } },
  savedGroups: { get: () => savedGroups },
  TRIP_ISOS: { get: () => TRIP_ISOS },
  selIds: { get: () => selIds },
  nhUser: { get: () => nhUser },
  phTemplates: { get: () => phTemplates, set: (v) => { phTemplates = v; } },
  openMenu: { get: () => openMenu },
  digits: { get: () => digits },
  hoverList: { get: () => hoverList },
  OUR_DOMAINS: { get: () => OUR_DOMAINS },
  TZ: { get: () => TZ },
  agoDays: { get: () => agoDays },
  parseVisitNotes: { get: () => parseVisitNotes },
  micBar: { get: () => micBar },
  suggestStatus: { get: () => suggestStatus },
  contactLine: { get: () => contactLine },
  todayData: { get: () => todayData },
  curView: { get: () => curView },
  money: { get: () => money },
  oursKey: { get: () => oursKey },
  OURS: { get: () => OURS },
  realContact: { get: () => realContact },
  convStats: { get: () => convStats },
  hasMeetingSet: { get: () => hasMeetingSet },
  gmailHref: { get: () => gmailHref },
  tplText: { get: () => tplText },
  tplCtx: { get: () => tplCtx },
  nextAction: { get: () => nextAction },
  cmCopyNum: { get: () => cmCopyNum },
  closeSheet: { get: () => closeSheet },
  flag: { get: () => flag },
  STATUS_FIELD: { get: () => STATUS_FIELD },
  statusSuggestBtn: { get: () => statusSuggestBtn },
  sendCatalog: { get: () => sendCatalog },
  nethuntUrl: { get: () => nethuntUrl },
  dueLabel: { get: () => dueLabel },
  cmRank: { get: () => cmRank },
  cmReach: { get: () => cmReach },
  CAN_CALL: { get: () => CAN_CALL },
  companyById: { get: () => companyById },
  drawPartners: { get: () => drawPartners },
  logoImg: { get: () => logoImg },
  nhErr: { get: () => nhErr },
  ICON_TEL: { get: () => ICON_TEL },
  ICON_WA: { get: () => ICON_WA },
  markNoWa: { get: () => markNoWa },
  unmarkNoWa: { get: () => unmarkNoWa },
  isNoWa: { get: () => isNoWa },
  noWaList: { get: () => [...noWaNums] },
  ICON_LI: { get: () => ICON_LI },
  ICON_MAIL: { get: () => ICON_MAIL },
  rowsOf: { get: () => rowsOf },
  isPerson: { get: () => isPerson },
  countryOfIso: { get: () => countryOfIso },
  isoOfCountry: { get: () => isoOfCountry },
  norm: { get: () => norm },
  multiIsos: { get: () => multiIsos },
  el: { get: () => el },
  chipRow: { get: () => chipRow },
  cmBaseGet: { get: () => cmBaseGet },
  cmBaseMode: { get: () => cmBaseMode, set: (v) => { cmBaseMode = v; } },
  sheetDraw: { get: () => sheetDraw, set: (v) => { sheetDraw = v; } },
  cmBaseSet: { get: () => cmBaseSet },
  cmBaseParse: { get: () => cmBaseParse },
  say: { get: () => say },
  cmKm: { get: () => cmKm },
  cmDotT: { get: () => cmDotT, set: (v) => { cmDotT = v; } },
  cmOpenUrl: { get: () => cmOpenUrl },
  cmMapsUrl: { get: () => cmMapsUrl },
  clip: { get: () => clip },
  STAGE: { get: () => STAGE },
  cmOrder: { get: () => cmOrder },
  openSheet: { get: () => openSheet },
  LINES: { get: () => LINES },
  splitBar: { get: () => splitBar },
  waOk: { get: () => waOk },
  waHref: { get: () => waHref },
  nhCall: { get: () => nhCall },
  NH_FOLDER: { get: () => NH_FOLDER },
});
(function () {
  try {
    cmBaseLoad().then(() => {
      try {
        sheetDraw && sheetDraw();
      } catch {}
    });
  } catch {}
})();
(function () {
  try {
    const b = qs('.cm-back'),
      f2 = qs('.cm-fwd');
    (b && b.addEventListener('click', () => cmNavGo(-1)), f2 && f2.addEventListener('click', () => cmNavGo(1)));
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const g2 = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(g2) || (e.target && e.target.isContentEditable)) return;
      e.altKey && 'ArrowLeft' === e.key
        ? (e.preventDefault(), cmNavGo(-1))
        : e.altKey && 'ArrowRight' === e.key && (e.preventDefault(), cmNavGo(1));
    });
    window.addEventListener('mouseup', (e) => {
      3 === e.button ? (e.preventDefault(), cmNavGo(-1)) : 4 === e.button && (e.preventDefault(), cmNavGo(1));
    });
    window.addEventListener('auxclick', (e) => {
      (3 === e.button || 4 === e.button) && e.preventDefault();
    });
    onData(cmNavTick);
  } catch {}
})();

(function () {
  try {
    const o = window.cmOpenCountry;
    'function' == typeof o &&
      (window.cmOpenCountry = (t) => {
        try {
          cmRecentAdd(t);
        } catch {}
        return o(t);
      });
  } catch {}
})();

(function () {
  try {
    const n = qs('.cm-nav');
    if (n && !qs('.cm-build')) {
      const b = el('span', 'cm-build', `v${cmVersion}`);
      ((b.title = 'Build running right now'), n.append(b));
    }
  } catch {}
})();
(function () { try { const k = qs('.cm-kbd'); if (k) k.textContent = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '/ " or ⌘K' : '/ " or Ctrl K'; } catch {} })();
