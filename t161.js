// one NetHunt login for the team: a call or note written from Medint is signed “— Yaman”, so Recent activity shows Yaman as the
// author (not the NetHunt login owner) and the signature is not repeated in the text · emails keep their real sender
const { run } = require('./harness');
const CO = '6908ae29847fe001cd52bfef';
(async () => { const bad = []; const t = new Date().toISOString();
  const answers = { company_timeline: () => ({ events: [
    { id: 'c1', timeISO: t, type: 'call', text: 'No answer\n— Yaman', creator: { name: 'Kavi Kaplan', email: 'hi@kavikaplan.com' } },
    { id: 'c2', timeISO: t, type: 'comment', text: '<p>Sent the catalogue<br>— Luz</p>', creator: { name: 'Kavi Kaplan', email: 'hi@kavikaplan.com' } },
    { id: 'c3', timeISO: t, type: 'call', text: 'Spoke to the buyer', creator: { name: 'Kavi Kaplan', email: 'hi@kavikaplan.com' } },
    { id: 'c4', timeISO: t, type: 'email', subject: 'Offer', text: 'Thanks, best regards — Maria', creator: { name: 'Leslie De La Piedra', email: 'leslie@grupointersalud.com' } } ] }) };
  const h = run({ params: { iso: 'CL', view: 'company', cid: CO, tags: [ 'chile' ] }, answers }); await h.settle(); h.d.dispatchEvent(new h.w.Event('pointerdown')); await new Promise((r) => setTimeout(r, 450)); h.w.dash.setParams({ view: 'company', cid: CO, iso: 'CL', tags: [ 'chile' ] }); for (let k = 0; k < 20 && h.w.dash.data('company_timeline').status !== 'ok'; k++) await h.settle(150); await new Promise((r) => setTimeout(r, 500)); await h.settle(); console.log('status', h.w.dash.data('company_timeline').status);
  const tl = h.w.dash.data('company_timeline'); const D = tl.data || []; const g = (id) => D.find((x) => x.id === id) || {};
  console.log(D.map((x) => `${x.type}: “${String(x.detail).replace(/\n/g, ' ')}” by ${x.by}`).join(' | '));
  if (g('c1').by !== 'Yaman' || /Yaman/.test(g('c1').detail) || g('c2').by !== 'Luz' || /— Luz/.test(g('c2').detail) || g('c3').by !== 'Kavi Kaplan' || g('c4').by !== 'Leslie De La Piedra' || !/— Maria/.test(g('c4').detail)) bad.push('authors');
  const page = (h.d.querySelector('.cm-cact') || {}).textContent || ''; console.log('on the page:', page.replace(/\s+/g, ' ').slice(0, 300)); if (!/Yaman/.test(page)) bad.push('page');
  console.log(`errors ${bad.length + h.errors.length}`, bad.join(', '), h.errors.slice(0, 2).join(' | ')); process.exit(0); })();
