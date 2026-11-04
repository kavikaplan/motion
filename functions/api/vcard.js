/**
 * 📇 Save to phone contacts.
 *   GET /api/vcard?d=<base64url vCard text>&n=<file name>
 * Answers with the card as text/vcard. On an iPhone or iPad this opens the Contacts sheet (“Create New Contact” / “Add All Contacts”);
 * on Android and computers it downloads a .vcf file that the Contacts app imports.
 * A data: link cannot do this on iOS (it opens a blank “data:” page, especially from the home-screen app), hence a real address.
 */
export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  let txt = '';
  try { const b = (u.searchParams.get('d') || '').replace(/-/g, '+').replace(/_/g, '/'); txt = new TextDecoder().decode(Uint8Array.from(atob(b + '==='.slice((b.length + 3) % 4)), (c) => c.charCodeAt(0))); } catch { txt = ''; }
  if (!/^BEGIN:VCARD/i.test(txt.trim()) || !/END:VCARD\s*$/i.test(txt.trim()) || txt.length > 40000) return new Response('Not a contact card', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  const name = (u.searchParams.get('n') || 'contact').replace(/[^\p{L}\p{N} ._-]+/gu, '').trim().slice(0, 60) || 'contact';
  return new Response(txt, { headers: { 'content-type': 'text/vcard; charset=utf-8', 'content-disposition': `inline; filename="${name.replace(/[^\x20-\x7e]/g, '_')}.vcf"; filename*=UTF-8''${encodeURIComponent(name)}.vcf`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}
