/** POST /api/summarize { prompt } → { text } — AI summaries and reply drafts.
 *  Uses Claude when the ANTHROPIC_API_KEY secret is set; otherwise Google Gemini when GEMINI_API_KEY is set (free tier works). */
// Google retires Gemini models often: ask Google which “flash” models this key can use and try the newest first
let gmCache = { at: 0, list: [] };
async function geminiModels(key) { if (Date.now() - gmCache.at < 6 * 3600e3 && gmCache.list.length) return gmCache.list;
  try { const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(8000) }); const d = await r.json();
    const ver = (n) => Number((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);
    const list = (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => String(m.name).replace(/^models\//, '')).filter((n) => /^gemini-[\d.]+-flash(-lite)?(-latest)?$|^gemini-flash(-lite)?-latest$/.test(n) && !/image|tts|live|preview|exp/.test(n)).sort((a, b) => /lite/.test(a) - /lite/.test(b) || ver(b) - ver(a)); // newest Flash first, the lighter Flash-Lite models as back-ups (each has its own capacity)
    if (list.length) gmCache = { at: Date.now(), list }; return list; } catch { return gmCache.list; } }
export async function onRequestPost({ request, env }) {
  const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  if (new URL(request.url).searchParams.get('engines') === '1') return json({ engines: [env.ANTHROPIC_API_KEY && 'anthropic', env.OPENAI_API_KEY && 'openai', env.GEMINI_API_KEY && 'gemini'].filter(Boolean) });
  if (!env.ANTHROPIC_API_KEY && !env.GEMINI_API_KEY && !env.OPENAI_API_KEY) return json({ error: 'AI is off: add ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY in Cloudflare Pages → Settings → Variables and secrets.' }, 501);
  let body = {}; try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  const prompt = String(body.prompt || '').slice(0, 24000); if (!prompt.trim()) return json({ text: '' });
  let last = '';
  const P = {
    anthropic: async () => { if (!env.ANTHROPIC_API_KEY) return null;
    for (const model of [env.ANTHROPIC_MODEL, 'claude-haiku-5-5', 'claude-haiku-4-5'].filter(Boolean)) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 8000, ...(/-[5-9]-/.test(model) ? { output_config: { effort: 'low' } } : {}), messages: [{ role: 'user', content: prompt }] }), signal: AbortSignal.timeout(40000) }); // Claude 5.x thinks first and that counts towards max_tokens: room for it, and low effort keeps it short
        const d = await r.json().catch(() => ({}));
        if (r.ok) { const text = (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim(); if (text) return json({ text, model, engine: 'Claude' }); last = `Claude ${model} gave no text (stop: ${d.stop_reason || '?'})`; continue; } // never hand back an empty answer: try the next model / engine
        last = (d.error && d.error.message) || `HTTP ${r.status}`; if (r.status !== 404 && r.status !== 400) break;
      } catch (e) { last = String((e && e.message) || e); }
    }
   return null; },
    openai: async () => { if (!env.OPENAI_API_KEY) return null;
      for (const model of [env.OPENAI_MODEL, 'gpt-4o-mini'].filter(Boolean)) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }), signal: AbortSignal.timeout(25000) }); const d = await r.json().catch(() => ({}));
        if (r.ok) { const text = String((((d.choices || [])[0] || {}).message || {}).content || '').trim(); if (text) return json({ text, model, engine: 'ChatGPT' }); last = 'ChatGPT returned an empty answer'; continue; } last = (d.error && d.error.message) || `HTTP ${r.status}`; if (r.status !== 404 && r.status !== 400) break; } catch (e) { last = String((e && e.message) || e); } } return null; },
    gemini: async () => { if (!env.GEMINI_API_KEY) return null; let busy = 0;
    // “high demand” (503) and per-model limits (429) are common on Gemini: wait a moment and retry once, then move on to the next model
    for (const model of [env.GEMINI_MODEL, ...(await geminiModels(env.GEMINI_API_KEY)), 'gemini-flash-latest', 'gemini-flash-lite-latest'].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 6)) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const gc = { maxOutputTokens: 1500, temperature: 0.4, ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) }; // no hidden “thinking” eating the answer
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gc }), signal: AbortSignal.timeout(25000) });
          const d = await r.json().catch(() => ({}));
          const text = r.ok ? (((d.candidates || [])[0] || {}).content || { parts: [] }).parts.map((p) => p.text || '').join('').trim() : '';
          if (r.ok && text) return json({ text, model, engine: 'Gemini' });
          last = r.ok ? 'Gemini returned an empty answer' : (d.error && d.error.message) || `HTTP ${r.status}`;
          if (r.status === 401 || r.status === 403) return null; // bad key: no point trying other models
          if ([429, 500, 503, 504].includes(r.status)) { busy++; if (attempt === 0) { await new Promise((ok) => setTimeout(ok, 1200)); continue; } }
          break;
        } catch (e) { last = String((e && e.message) || e); busy++; break; }
      }
    }
    if (busy) last = `Gemini is busy right now (high demand) — try again in a minute, or use 📋 Copy for ChatGPT / Claude. (${last})`;
   return null; },
  };
  // order: AI_ORDER secret (e.g. "anthropic,openai,gemini"); the first that answers wins
  const want = String(body.engine || '').toLowerCase(); const order = String(env.AI_ORDER || 'anthropic,openai,gemini').split(',').map((x) => x.trim().toLowerCase()).filter((x) => P[x]); if (Object.hasOwn(P, want)) { order.splice(order.indexOf(want) >>> 0, order.includes(want) ? 1 : 0); order.unshift(want); } // a chosen engine (Claude / ChatGPT / Gemini) goes first; the others still back it up
  for (const k of order) { const res = await P[k](); if (res) return res; }
  return json({ error: `AI failed: ${last}` }, 502);
}
