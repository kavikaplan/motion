/** GET /api/translate?q=…&to=en → { text } — translates a short customer message for Power hour (Google Translate's public endpoint). */
export async function onRequestGet({ request }) {
  const u = new URL(request.url); const q = (u.searchParams.get('q') || '').slice(0, 1500); const to = (u.searchParams.get('to') || 'en').replace(/[^a-z-]/gi, '').slice(0, 8) || 'en';
  const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=86400' } });
  if (!q.trim()) return json({ text: '' });
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) { const d = await r.json(); return json({ text: (d[0] || []).map((x) => x[0]).join(''), from: d[2] || '' }); }
  } catch { /* try the second translator */ }
  const from = (u.searchParams.get('from') || '').replace(/[^a-z-]/gi, '').slice(0, 8);
  if (from) {
    try { const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 480))}&langpair=${from}|${to}`, { signal: AbortSignal.timeout(8000) }); if (r.ok) { const d = await r.json(); const t = d && d.responseData && d.responseData.translatedText; if (t) return json({ text: t, from }); } } catch { /* both failed */ }
  }
  return json({ error: 'translator unreachable' }, 502);
}
