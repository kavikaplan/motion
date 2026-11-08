// ⚡ Power hour focus: one dropdown in the top bar (next to ✕) — All · 💬 Replies · 👋 Intros · 🔁 Follow-ups with counts; a chip shows only that kind
// (Replies = they wrote / Replied below Interested · Follow-ups = Interested and above, meetings, follow-ups due · Intros = the rest);
// remembered for the day only
const { run } = require('./harness');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => { const bad = [];
  const h = run({ site: true, params: { view: 'country', iso: 'CL', tags: [ 'chile' ], ctab: 'companies', csub: 'partners', ours: 'dunitech', psort: 'next' } }); await h.settle(); await wait(2500); await h.settle(); const W = h.w, D = h.d, X2 = W.__cm2x;
  try { W.localStorage.removeItem('medint.phfocus'); } catch (_e) { /* */ }
  const loaded = async () => { await h.settle(); for (let k = 0; k < 40 && D.querySelector('#cm-sheet .cm-phload'); k++) await h.settle(150); await wait(400); await h.settle(); };
  // the rules
  const c = (status, t) => X2.phFocusGet && W.__cm2x && (() => { const x = { status, t }; return W.__cm2x.__cls ? W.__cm2x.__cls(x) : null; })();
  const R = [ [ 'Interested', 0, 'follow' ], [ 'Negotiating', 5, 'follow' ], [ 'Customer', 5, 'follow' ], [ 'Promising', 5, 'follow' ], [ 'Awaiting response', 3, 'follow' ], [ 'Meeting', 3, 'follow' ], [ 'Follow up', 2, 'follow' ],
    [ 'Replied', 5, 'replies' ], [ 'Contacted', 0, 'replies' ], [ 'Lead', 0, 'replies' ], [ 'Contacted', 3, 'intros' ], [ 'Enriched Leads', 5, 'intros' ], [ 'To Be Qualified', 6, 'intros' ], [ 'Drip1', 5, 'intros' ], [ 'Lead', 1, 'follow' ], [ '', 2, 'follow' ] ];
  const wrongR = R.filter(([st, t, want]) => X2.phCls({ status: st, t }) !== want); console.log('rules:', R.map(([st, t]) => `${st || '—'}${t === 0 ? ' (wrote)' : t === 1 ? ' (meeting)' : t === 2 ? ' (due)' : ''} → ${X2.phCls({ status: st, t })}`).join(' · ')); if (wrongR.length) bad.push('rules ' + wrongR.map((x) => x[0]).join('/'));
  D.querySelector('.cm-phbtn').click(); await loaded();
  const btn = () => D.querySelector('#cm-sheet-title .cm-phmode'); const menu = async () => { btn().click(); await wait(100); return [ ...D.querySelectorAll('.cm-menu button, #cm-menu button') ]; };
  const chips = () => [ btn() ? btn().textContent : '' ];
  console.log('dropdown:', btn() && btn().textContent, '| one button only:', D.querySelectorAll('#cm-sheet-title .cm-phmode').length === 1); if (!btn() || !/All ▾/.test(btn().textContent) || D.querySelectorAll('#cm-sheet-title .cm-phmode').length !== 1) bad.push('dropdown');
  { const it = (await menu()).map((b) => b.textContent.replace(/\s+/g, ' ').trim()); console.log('menu:', it.join(' | ')); D.body.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape' })); await wait(50); }
  const q0 = X2.powerQueue(); console.log('counts:', JSON.stringify(q0.counts), '| all', q0.all);
  for (const [k, lab] of [ [ 'intros', 'Intros' ], [ 'follow', 'Follow-ups' ], [ 'replies', 'Replies' ] ]) {
    const b = (await menu()).find((x) => x.textContent.includes(lab)); if (!b) { console.log(lab, ': none'); D.querySelector('#cm-sheet .cm-phwho') && D.body.click(); continue; }
    b.click(); await loaded(); const q = X2.powerQueue(); const wrong = q.list.filter((x) => x.__cls !== k);
    console.log(`${lab}: ${q.list.length} in the queue (${q.list.slice(0, 4).map((x) => `${x.name} [${x.status || '—'}${x.t === 0 ? ', wrote' : ''}]`).join(', ')}) · other kinds: ${wrong.length} · button: ${btn() && btn().textContent} · Power hour open: ${!D.getElementById('cm-sheet').hidden}`);
    if (wrong.length || D.getElementById('cm-sheet').hidden || !(btn() && btn().textContent.includes(lab))) bad.push(lab);
    for (const x of q.list) { const st = String(x.status || ''); if (k === 'intros' && /interest|negotiat|meeting|follow ?up|awaiting|customer|promising/i.test(st)) bad.push(`intro has ${st}`); if (k === 'follow' && /^(lead|enriched|contacted|to be qualified)/i.test(st) && x.t !== 1) bad.push(`follow-up has ${st}`); }
  }
  const saved = JSON.parse(W.localStorage.getItem('medint.phfocus') || '{}'); console.log('remembered today:', saved.f, saved.d === new W.Date().toDateString());
  W.localStorage.setItem('medint.phfocus', JSON.stringify({ d: 'Mon Jan 01 2001', f: 'intros' })); console.log('another day → back to All:', X2.phFocusGet() === ''); if (X2.phFocusGet() !== '') bad.push('day only');
  W.__cm2x.phFocusSet('replies'); const all = (await menu()).find((x) => /^\s*⚡?\s*All/.test(x.textContent)); all && all.click(); await loaded();
  console.log(`errors ${bad.length + h.errors.length}`, [ ...new Set(bad) ].join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
