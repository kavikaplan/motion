// fit verdict, reply alerts and weekly report (website mode)
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000)); const X = h.w.__cm3; const now = Date.now(); const d = (n) => now - n * 864e5;
  const ev = (t, type, text, dir) => ({ t, type, by: 'Luz', dir, text });
  const pty = X.coFitFrom({ company: 'PTY Medical', status: 'Contacted', stage_next: 1 }, [ev(d(2), 'call', 'no answer'), ev(d(20), 'email', 'Thank you, but the product line you currently have does not interest us. Gracias, no nos interesa por ahora.', 'in'), ev(d(40), 'email', 'Catalogue Next Shoulder')]);
  console.log('PTY Medical:', pty.fit, '|', pty.why, '|', (pty.quote || '').slice(0, 70));
  const hot = X.coFitFrom({ company: 'Vitalmedic', status: 'Interested', stage_next: 3 }, [ev(d(1), 'calendar', 'Meeting at their office')]);
  const later = X.coFitFrom({ company: 'Ortho X', status: 'Contacted' }, [ev(d(3), 'email', 'Please send us the quotation for the shoulder system', 'in'), ev(d(30), 'email', 'Not interested at the moment', 'in')]);
  const fresh = X.coFitFrom({ company: 'New Co' }, []); const ghost = X.coFitFrom({ company: 'Ghost' }, [ev(d(5), 'email', 'hello'), ev(d(10), 'call', 'no answer'), ev(d(20), 'chat', 'hola')]);
  const lost = X.coFitFrom({ company: 'Gone', status: 'Not interested' }, []);
  console.log('Vitalmedic:', hot.fit, '| said no then asked for a quote:', later.fit, '| new:', fresh.fit, '| 3 tries no reply:', ghost.fit, ghost.why, '| status not interested:', lost.fit);
  const wh = X.workHours(new Date('2026-10-23T17:00:00').getTime(), new Date('2026-10-26T10:00:00').getTime()); console.log('Fri 17:00 → Mon 10:00 =', wh, 'working hours (expect 4)');
  console.log('replies waiting list ok:', Array.isArray(X.repliesWaiting()));
  X.openWeekly(h.d.body, 'next'); await h.settle(); await new Promise((r) => setTimeout(r, 1200)); await h.settle(); const S = h.d.getElementById('cm-sheet'); console.log('weekly sheet:', (h.d.getElementById('cm-sheet-title') || {}).textContent, '|', !!S.querySelector('iframe.cm-wrprev') ? 'preview shown' : (S.textContent.slice(0, 60)));
  const ok = pty.fit === 'poor' && hot.fit === 'good' && later.fit !== 'poor' && fresh.fit === 'check' && ghost.fit === 'check' && lost.fit === 'poor' && Math.abs(wh - 4) < 0.01;
  console.log(`errors ${ok ? 0 : 1}`); process.exit(0); })();
