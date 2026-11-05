// NetHunt “Rate limit exceeded … Retry after Ns” (100 calls a minute per workspace): Medint waits as long as NetHunt says and carries on —
// Link all no longer stops with errors
const { run } = require('./harness');
(async () => { const h = run({ site: true, params: { view: 'home' } }); await h.settle(); await new Promise((r) => setTimeout(r, 1500)); const W = h.w; const C = W.__cm; const bad = [];
  const mcp = await W.claude.use('mcp'); const ct0 = mcp.callTool; let n = 0; const said = []; const s0 = C.say; 
  mcp.callTool = async (srv, tool, a) => { if (tool === 'get_record' && a.recordId === 'RL1') { n++; if (n <= 2) throw new Error('Rate limit exceeded: 100 req/minute per workspace. Retry after 2s (resets 2026-11-05T12:48:00.000Z).'); return { content: [ { type: 'text', text: JSON.stringify({ id: 'RL1', fields: { Name: 'Conmed Italia' } }) } ] }; } return ct0(srv, tool, a); };
  const obs = new W.MutationObserver(() => { const t = [ ...W.document.querySelectorAll('.cm-toast, #cm-toast, [role="status"]') ].map((x) => x.textContent).join(' '); /limit/.test(t) && said.push(t); }); obs.observe(W.document.body, { childList: !0, subtree: !0, characterData: !0 });
  const t0 = Date.now(); let r = null, er = null; try { r = await C.nhCall('get_record', { folderId: 'f', recordId: 'RL1' }); } catch (e) { er = e; }
  const secs = (Date.now() - t0) / 1000; console.log('result:', r && r.fields && r.fields.Name, '| error:', er && er.message, '| tries:', n, '| waited', secs.toFixed(1), 's', '| told the person:', said.length ? said[0].slice(0, 90) : 'no');
  if (!r || n !== 3 || secs < 4) bad.push('waits and retries');
  // another kind of error is still shown at once
  mcp.callTool = async (srv, tool, a) => { if (a && a.recordId === 'X9') throw new Error('Record not found'); return ct0(srv, tool, a); }; const t1 = Date.now(); let e2 = null; try { await C.nhCall('get_record', { folderId: 'f', recordId: 'X9' }); } catch (e) { e2 = e; }
  console.log('other errors still come back at once:', !!e2, ((Date.now() - t1) / 1000).toFixed(1), 's'); if (!e2 || Date.now() - t1 > 1500) bad.push('other errors');
  mcp.callTool = ct0; console.log(`errors ${h.errors.length + bad.length}`, bad.join(', ')); process.exit(0); })();
