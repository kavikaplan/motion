/**
 * GET /api/weather?city=&iso=&capital=  → { icon, text, temp, feels, is_day, place, time, tz, source }
 * The weather right now where the company is: the city is found with Open-Meteo's geocoder (in that country only,
 * falling back to the capital). Temperature and sky come from the nearest airport's live report (METAR, aviationweather.gov) when one is
 * within ~40 km and under 90 minutes old — the most accurate source; otherwise from Open-Meteo's model (refreshed every 15 minutes).
 * No key needed. Geocoding is cached 30 days, conditions 20 minutes.
 */
const json = (b, s = 200, age = 600) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': `private, max-age=${age}` } });
// WMO weather codes → [day icon, night icon, words]
const W = { 0: ['☀️', '🌙', 'Clear'], 1: ['🌤️', '🌙', 'Mostly clear'], 2: ['⛅', '☁️', 'Partly cloudy'], 3: ['☁️', '☁️', 'Overcast'], 45: ['🌫️', '🌫️', 'Fog'], 48: ['🌫️', '🌫️', 'Freezing fog'],
  51: ['🌦️', '🌧️', 'Light drizzle'], 53: ['🌦️', '🌧️', 'Drizzle'], 55: ['🌧️', '🌧️', 'Heavy drizzle'], 56: ['🌧️', '🌧️', 'Freezing drizzle'], 57: ['🌧️', '🌧️', 'Freezing drizzle'],
  61: ['🌦️', '🌧️', 'Light rain'], 63: ['🌧️', '🌧️', 'Rain'], 65: ['🌧️', '🌧️', 'Heavy rain'], 66: ['🌧️', '🌧️', 'Freezing rain'], 67: ['🌧️', '🌧️', 'Freezing rain'],
  71: ['🌨️', '🌨️', 'Light snow'], 73: ['🌨️', '🌨️', 'Snow'], 75: ['❄️', '❄️', 'Heavy snow'], 77: ['🌨️', '🌨️', 'Snow grains'], 80: ['🌦️', '🌧️', 'Rain showers'], 81: ['🌧️', '🌧️', 'Rain showers'], 82: ['⛈️', '⛈️', 'Violent rain showers'],
  85: ['🌨️', '🌨️', 'Snow showers'], 86: ['❄️', '❄️', 'Heavy snow showers'], 95: ['⛈️', '⛈️', 'Thunderstorm'], 96: ['⛈️', '⛈️', 'Thunderstorm with hail'], 99: ['⛈️', '⛈️', 'Thunderstorm with hail'] };
async function cached(key, ttl, fn) { const c = caches.default; const k = new Request(`https://medint.cache/${key}`); const hit = await c.match(k); if (hit) return hit.json(); const v = await fn(); if (v) await c.put(k, new Response(JSON.stringify(v), { headers: { 'cache-control': `max-age=${ttl}` } })); return v; }
async function geocode(name, iso) { if (!name) return null; return cached(`geo/${iso}/${encodeURIComponent(name.toLowerCase())}`, 30 * 86400, async () => {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`, { signal: AbortSignal.timeout(8000) }); if (!r.ok) return null; const d = await r.json();
  const L = (d.results || []).filter((x) => !iso || String(x.country_code || '').toUpperCase() === iso.toUpperCase()); const best = L.sort((a, b) => (b.population || 0) - (a.population || 0))[0]; return best ? { lat: best.latitude, lon: best.longitude, place: [best.name, best.admin1].filter(Boolean).join(', '), tz: best.timezone } : { none: 1 }; }).then((g) => (g && !g.none ? g : null)); } // “not found” is cached too
export async function onRequestGet({ request }) {
  const u = new URL(request.url); const iso = (u.searchParams.get('iso') || '').slice(0, 2).toUpperCase(); const city = (u.searchParams.get('city') || '').split(/,|\n|\(/)[0].trim().slice(0, 60); const capital = (u.searchParams.get('capital') || '').split(/,|\(/)[0].trim().slice(0, 60);
  try {
    const g = (await geocode(city, iso)) || (await geocode(capital, iso)); if (!g) return json({ error: 'place not found' }, 404, 3600);
    const key = `wx/${g.lat.toFixed(2)},${g.lon.toFixed(2)}`;
    const cur = await cached(key, 1200, async () => { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m,apparent_temperature,weather_code,is_day,precipitation,wind_speed_10m&timezone=auto`, { signal: AbortSignal.timeout(8000) }); if (!r.ok) return null; const d = await r.json(); return d.current ? { ...d.current, tz: d.timezone } : null; });
    // a real observation beats a model: the nearest airport report (METAR) within ~40 km, if under 90 minutes old
    const obs = await cached(`metar/${g.lat.toFixed(1)},${g.lon.toFixed(1)}`, 900, async () => { try { const d0 = 0.4; const r = await fetch(`https://aviationweather.gov/api/data/metar?bbox=${g.lat - d0},${g.lon - d0},${g.lat + d0},${g.lon + d0}&format=json`, { headers: { 'user-agent': 'Medint/1.0' }, signal: AbortSignal.timeout(8000) }); if (!r.ok) return { none: 1 }; const L = await r.json().catch(() => []);
      const km = (x) => Math.hypot((x.lat - g.lat) * 111, (x.lon - g.lon) * 111 * Math.cos((g.lat * Math.PI) / 180)); const best = (Array.isArray(L) ? L : []).filter((x) => x.temp != null && Date.now() - (x.reportTime ? Date.parse(String(x.reportTime).replace(' ', 'T').replace(/(\d)$/, '$1Z')) : x.obsTime * 1000) < 90 * 6e4).sort((a, b) => km(a) - km(b))[0];
      return best && km(best) <= 40 ? { id: best.icaoId, name: best.name || best.icaoId, temp: best.temp, wx: best.wxString || '', cover: ((best.clouds || [])[0] || {}).cover || best.cover || '', time: best.reportTime ? new Date(Date.parse(String(best.reportTime).replace(' ', 'T').replace(/(\d)$/, '$1Z'))).toISOString() : new Date(best.obsTime * 1000).toISOString(), km: Math.round(km(best)) } : { none: 1 }; } catch { return { none: 1 }; } });
    if (!cur && (!obs || obs.none)) return json({ error: 'weather unavailable' }, 502, 120);
    const day = cur ? cur.is_day !== 0 : (() => { const h = new Date().getUTCHours() + g.lon / 15; const lh = ((h % 24) + 24) % 24; return lh >= 6.5 && lh < 18.5; })();
    let code = cur ? cur.weather_code : 0; let src = 'Open-Meteo model';
    if (obs && !obs.none) { // turn the airport's report into a WMO-style code
      const x = obs.wx; code = /TS/.test(x) ? 95 : /SN|SG/.test(x) ? (/\+/.test(x) ? 75 : 71) : /SH/.test(x) && /RA/.test(x) ? 80 : /\+RA/.test(x) ? 65 : /-RA/.test(x) ? 61 : /RA/.test(x) ? 63 : /DZ/.test(x) ? 51 : /FG/.test(x) ? 45 : /BR|HZ/.test(x) && !/OVC|BKN/.test(obs.cover) ? 45 : /OVC/.test(obs.cover) ? 3 : /BKN/.test(obs.cover) ? 2 : /SCT|FEW/.test(obs.cover) ? 1 : /SKC|CLR|CAVOK|NCD|NSC/.test(obs.cover || 'CLR') ? 0 : code;
      src = `${obs.id} airport report${obs.km ? `, ${obs.km} km away` : ''}`; }
    const w = W[code] || ['🌡️', '🌡️', 'Weather']; const temp = obs && !obs.none ? Math.round(obs.temp) : Math.round(cur.temperature_2m);
    return json({ icon: day ? w[0] : w[1], text: w[2], temp, feels: cur ? Math.round(cur.apparent_temperature + (temp - cur.temperature_2m)) : temp, wind: cur ? Math.round(cur.wind_speed_10m || 0) : 0, precip: cur ? cur.precipitation || 0 : 0, is_day: day, place: g.place, guessed: !(city && g.place && g.place.toLowerCase().startsWith(city.toLowerCase().slice(0, 4))), time: obs && !obs.none ? obs.time : cur.time, tz: cur ? cur.tz : g.tz, source: src }, 200, 600);
  } catch (e) { return json({ error: String(e.message || e) }, 502, 60); }
}
