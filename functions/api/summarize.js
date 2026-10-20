/** POST /api/summarize { prompt } → { text } — short AI summaries for the client report (needs the ANTHROPIC_API_KEY secret). */
export async function onRequestPost({ request, env }) {
  const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'AI summaries are off: add the ANTHROPIC_API_KEY secret in Cloudflare Pages → Settings → Variables and secrets.' }, 501);
  let body = {}; try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  const prompt = String(body.prompt || '').slice(0, 12000); if (!prompt.trim()) return json({ text: '' });
  const models = [env.ANTHROPIC_MODEL, 'claude-haiku-5-5', 'claude-haiku-4-5', 'claude-3-5-haiku-latest'].filter(Boolean);
  let last = '';
  for (const model of models) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 220, messages: [{ role: 'user', content: prompt }] }), signal: AbortSignal.timeout(25000) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return json({ text: (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim(), model });
      last = (d.error && d.error.message) || `HTTP ${r.status}`; if (r.status !== 404 && r.status !== 400) break;
    } catch (e) { last = String(e && e.message || e); }
  }
  return json({ error: `AI summary failed: ${last}` }, 502);
}
