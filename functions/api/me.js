/** Who is using the website: the email Cloudflare Access verified at login, plus their Medint role. GET /api/me → { email, name, role, active, lookup } */
import { whoIs } from '../_lib/access.js';
import { callTool } from './nethunt.js';
export async function onRequestGet({ request, env }) {
  const email = (request.headers.get('cf-access-authenticated-user-email') || '').toLowerCase();
  const house = String(env.MEDINT_HOUSE || 'hi@kavikaplan.com').toLowerCase().split(',').map((x) => x.trim());
  // never assume House: only the House list, or a People record that says so
  let who = { email, name: email.split('@')[0], role: !email ? 'House' : house.includes(email) ? 'House' : 'Person', active: true }; let lookup = 'skipped';
  if (email && env.NETHUNT_MCP_URL) { try { who = await whoIs(env, (n, a) => callTool(env, n, a), email); lookup = 'ok'; } catch { lookup = 'failed'; } }
  return new Response(JSON.stringify({ email, name: who.name, role: who.role, active: who.active !== false, lookup }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
