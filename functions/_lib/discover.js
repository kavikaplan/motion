// Richard's website discovery, rebuilt for Medint (references/02-find-website.md):
//  1. the two searches that found most websites — the FULL raw name as written (no quotes, no country) and the
//     quoted name without its legal form + country; unquoted only when the quoted one returns nothing
//  2. rank candidates (search order is not evidence), load the top 3 and CONFIRM each on its own page —
//     "the title is the claim, the body is corroboration"; namesakes abroad are rejected
//  3. no website → a presence page: the company's own LinkedIn / Facebook page, or a page naming it with a phone/email
//  4. Instagram: searched when the site doesn't link one; accepted only when it is clearly theirs
// Every step is written to `attempts` so a "not found" can be argued afterwards, not merely believed.
import { webSearch } from './search.js';
import { bdPage, bdSearchOn } from './brightdata.js';

const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'en,es;q=0.8,pt;q=0.7,fr;q=0.6' }; // a normal browser: many company sites refuse bots
// country → [ccTLD, dialling code]
const CC = { argentina: ['ar', '54'], bolivia: ['bo', '591'], brazil: ['br', '55'], chile: ['cl', '56'], colombia: ['co', '57'], 'costa rica': ['cr', '506'], 'dominican republic': ['do', '1'], ecuador: ['ec', '593'], 'el salvador': ['sv', '503'], guatemala: ['gt', '502'], honduras: ['hn', '504'], mexico: ['mx', '52'], nicaragua: ['ni', '505'], panama: ['pa', '507'], paraguay: ['py', '595'], peru: ['pe', '51'], uruguay: ['uy', '598'], venezuela: ['ve', '58'], cuba: ['cu', '53'], 'puerto rico': ['pr', '1'], 'united states': ['us', '1'], usa: ['us', '1'], canada: ['ca', '1'], spain: ['es', '34'], portugal: ['pt', '351'], france: ['fr', '33'], italy: ['it', '39'], germany: ['de', '49'], austria: ['at', '43'], switzerland: ['ch', '41'], netherlands: ['nl', '31'], belgium: ['be', '32'], 'united kingdom': ['uk', '44'], ireland: ['ie', '353'], poland: ['pl', '48'], czechia: ['cz', '420'], 'czech republic': ['cz', '420'], slovakia: ['sk', '421'], hungary: ['hu', '36'], romania: ['ro', '40'], bulgaria: ['bg', '359'], greece: ['gr', '30'], croatia: ['hr', '385'], serbia: ['rs', '381'], slovenia: ['si', '386'], estonia: ['ee', '372'], latvia: ['lv', '371'], lithuania: ['lt', '370'], finland: ['fi', '358'], sweden: ['se', '46'], norway: ['no', '47'], denmark: ['dk', '45'], turkey: ['tr', '90'], 'türkiye': ['tr', '90'], ukraine: ['ua', '380'], russia: ['ru', '7'], kazakhstan: ['kz', '7'], uzbekistan: ['uz', '998'], azerbaijan: ['az', '994'], georgia: ['ge', '995'], armenia: ['am', '374'], israel: ['il', '972'], 'saudi arabia': ['sa', '966'], 'united arab emirates': ['ae', '971'], uae: ['ae', '971'], qatar: ['qa', '974'], kuwait: ['kw', '965'], oman: ['om', '968'], bahrain: ['bh', '973'], jordan: ['jo', '962'], lebanon: ['lb', '961'], iraq: ['iq', '964'], iran: ['ir', '98'], egypt: ['eg', '20'], morocco: ['ma', '212'], algeria: ['dz', '213'], tunisia: ['tn', '216'], libya: ['ly', '218'], nigeria: ['ng', '234'], ghana: ['gh', '233'], kenya: ['ke', '254'], 'south africa': ['za', '27'], ethiopia: ['et', '251'], tanzania: ['tz', '255'], india: ['in', '91'], pakistan: ['pk', '92'], bangladesh: ['bd', '880'], 'sri lanka': ['lk', '94'], indonesia: ['id', '62'], malaysia: ['my', '60'], singapore: ['sg', '65'], thailand: ['th', '66'], vietnam: ['vn', '84'], philippines: ['ph', '63'], china: ['cn', '86'], japan: ['jp', '81'], 'south korea': ['kr', '82'], korea: ['kr', '82'], taiwan: ['tw', '886'], australia: ['au', '61'], 'new zealand': ['nz', '64'] };
const ALLCC = new Set(Object.values(CC).map((x) => x[0]));
const VANITY = new Set(['co', 'io', 'me', 'ai', 'tv', 'app', 'biz', 'info', 'net', 'org', 'com', 'online', 'site', 'store', 'shop', 'health', 'med', 'global']);
// never a company's own website (directories, marketplaces, trade data, people data, social, free builders, gov/edu)
const BLOCKED = /(^|\.)(linkedin|facebook|instagram|youtube|twitter|x|tiktok|pinterest|wikipedia|google|bing|yahoo|kompass|yellowpages|paginasamarillas|alibaba|aliexpress|indiamart|europages|medicalexpo|dnb|crunchbase|zoominfo|opencorporates|bloomberg|volza|importgenius|panjiva|importyeti|seair|zauba|eximpedia|tridge|tradeatlas|apollo|lusha|rocketreach|empresite|infoempresa|cylex|mapcarta|yelp|glassdoor|indeed|computrabajo|bumeran|trabajando|laborum|wix|wixsite|blogspot|wordpress|weebly|godaddysites|jimdo|site123|mercadolibre|amazon|ebay|universidadperu|datoperu|cuit|rut|boletinoficial|einforma|axesor|guiaempresa|empresas|companieshouse|chileempresas|genealog|emis|b2bhint|connectamericas|bizapedia|dateas|guatemala\.com|zonaempresas|infobel|hotfrog|tuugo|lasempresas|ciiu)\./i;
const GOVEDU = /\.(gov|gob|mil|edu|ac|int)(\.[a-z]{2})?$/i;
const LEGAL = /[,.]?\s*\b(s\.?\s?a\.?\s?(de\s?c\.?\s?v\.?)?|s\.?a\.?s\.?|s\.?a\.?c\.?|s\.?r\.?l\.?|s\.?p\.?a\.?|spa|ltda\.?|limitada|ltd\.?|limited|inc\.?|llc|llp|tov|corp\.?|corporation|gmbh|ag|bv|oy|o[üu]|as|ab|e\.?i\.?r\.?l\.?|cia\.?|y\s+c[ií]a\.?|sociedad an[oó]nima|sociedad|ltd\s?sti|sdn\s?bhd|pty|pvt|plc|sp\.?\s?z\s?o\.?\s?o\.?|kft|zrt|eood|ood|lda|unipessoal)\s*$/gi;
const LEAD = /^(too|pt|ooo|zao|oao|cong ty|cv|sc)\s+/i;
// words that never build a domain or prove identity on their own
const TRADE = new Set('medical medica medico medicos medicas medicina med medic surgical quirurgica quirurgico quirurgicos ortho orto ortopedia ortopedica ortopedico orthopedic orthopaedic trauma traumatologia joint bone spine supply supplies suministros insumos hospital hospitalaria hospitalario ministry ministerio international internacional global group grupo company compania comercial comercializadora distribuidora distribuidor distribuciones distribution import importadora imports export trading servicios services solutions soluciones tecnologia technology technologies equipos equipment productos products health salud center centro cia corporation corp inversiones de del la las los el y e and the of chile peru mexico colombia guatemala argentina ecuador panama bolivia uruguay paraguay venezuela brasil brazil'.split(' '));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
export const searchName = (raw) => { let s = String(raw || '').replace(/\(.*?\)/g, ' ').replace(LEAD, ''); for (let i = 0; i < 3; i++) s = s.replace(LEGAL, ''); s = s.replace(/\b([A-Z])\s(?=[A-Z]\b)/g, '$1').replace(/\s+/g, ' ').trim(); return s || String(raw || '').trim(); };
const host = (u) => { try { return new URL(u).host.toLowerCase().replace(/^www\./, ''); } catch { return ''; } };
const tld = (h) => (h.split('.').pop() || '');
const label = (h) => { const p = h.split('.'); return (p.length > 2 && /^(com|co|org|net|gob|gov|edu|ac)$/.test(p[p.length - 2]) ? p[p.length - 3] : p[p.length - 2]) || ''; };
const txt = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const titleOf = (h) => ((String(h || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
const CHALLENGE = /just a moment|access denied|attention required|verify you are human|captcha|cloudflare ray id|enable javascript and cookies/i;

async function fetchPage(env, url) {
  try { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(8000) }); if (r.ok && /html/i.test(r.headers.get('content-type') || '')) { const html = (await r.text()).slice(0, 400000); if (!CHALLENGE.test(titleOf(html)) && txt(html).length > 200) return { url: r.url, html }; } } catch { /* try Bright Data */ }
  const p = await bdPage(env, url, { max: 400000 }); return p || null;
}

// how the company's name relates to a domain: 'full' (its distinctive words run together), 'partial' (one of them), ''
function nameBuilt(dom, rare, all) { const l = norm(label(dom)).replace(/[^a-z0-9]/g, ''); if (!l || l.length < 3) return ''; const joinedRare = rare.join(''); const joinedAll = all.join('');
  if (joinedRare && (l === joinedRare || l === joinedAll || (joinedRare.length >= 5 && l.includes(joinedRare)) || (l.length >= 6 && joinedAll.includes(l) && rare.filter((w) => l.includes(w)).length >= Math.min(2, rare.length)))) return 'full';
  if (rare.length === 1 && l.startsWith(rare[0]) && rare[0].length >= 4) return 'full';
  if (rare.some((w) => w.length >= 4 && l.includes(w))) return 'partial'; return ''; }

function score(r, rare, all, cc) { const h = host(r.link); const t = norm(r.title); const sn = norm(`${r.title} ${r.snippet}`); let s = 0; const nb = nameBuilt(h, rare, all); if (nb === 'full') s += 6; else if (nb === 'partial') s += 2;
  const phrase = all.join(' '); if (phrase && t.includes(phrase)) s += 4; else if (rare.some((w) => t.includes(w))) s += 1.5; s += Math.min(3, rare.filter((w) => sn.includes(w)).length * 1.2);
  const tl = tld(h); if (cc && tl === cc[0]) s += 1.5; else if (ALLCC.has(tl) && !VANITY.has(tl) && cc && tl !== cc[0]) s -= 1.5; if ((r.link.match(/\//g) || []).length > 5) s -= 1; return s; }

// confirm a loaded page is the company's own (references/02-find-website.md §4)
function confirm(pg, dom, rare, all, country, cc) {
  const title = norm(titleOf(pg.html)); const body = norm(txt(pg.html)).slice(0, 60000); const phrase = all.join(' '); const nb = nameBuilt(dom, rare, all); const tl = tld(dom);
  const rareOn = rare.filter((w) => body.includes(w)); const cn = norm(country); const ctryOn = !!(cn && body.includes(cn)) || !!(cc && new RegExp(`\\+\\s?${cc[1]}\\b`).test(body));
  if (cc && ALLCC.has(tl) && !VANITY.has(tl) && tl !== cc[0] && !ctryOn) return [false, `${dom}: a .${tl} site and ${country} is not on the page (namesake abroad?)`];
  const others = Object.keys(CC).filter((k) => k.length > 4 && k !== cn && new RegExp(`\\b${k}\\b`).test(body.slice(0, 4000)));
  if (cn && !ctryOn && others.length && tl !== (cc || [])[0]) return [false, `${dom}: the page names ${others.slice(0, 2).join(', ')} but not ${country}`];
  if (!rare.length) return phrase && body.includes(phrase) ? [true, `${dom}: the full name is on the page`] : [false, `${dom}: name has no distinctive word and the full name is not on the page`];
  if (nb === 'full') { if (rareOn.length >= 2 || (phrase && body.includes(phrase)) || (rareOn.length === 1 && (rare.length === 1 ? (ctryOn || body.includes(phrase)) : true))) return [true, `${dom}: domain built from the name and “${rareOn[0] || phrase}” is on the page`]; return [false, `${dom}: domain looks like the name but the name is not on the page`]; }
  if (nb === 'partial') { if ((phrase && body.includes(phrase)) || rareOn.length >= 2) return [true, `${dom}: domain carries part of the name and ${rareOn.length >= 2 ? 'two name words are' : 'the full name is'} on the page`]; return [false, `${dom}: domain carries one name word only and nothing else matches`]; }
  const inTitle = rare.filter((w) => title.includes(w)); if (inTitle.length && (inTitle.length >= 2 || rareOn.length >= 2 || (phrase && body.includes(phrase)) || ctryOn)) return [true, `${dom}: “${inTitle[0]}” in the page title${ctryOn ? ` and ${country} on the page` : ''}`];
  return [false, `${dom}: the name is not in the page title`]; }

const PHONE = /(?:\+|00)\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,5}\d{2,4}/g;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export async function discover(env, rawName, country, opts = {}) {
  const attempts = []; const log = (s) => attempts.push(s); const cc = CC[norm(country)] || null; const sname = searchName(rawName); const all = words(sname); const rare = all.filter((w) => w.length >= 3 && !TRADE.has(w));
  const out = { website: '', website_ownership: '', website_evidence: '', presence_url: '', presence_kind: '', presence_phone: '', presence_email: '', linkedin: '', facebook: '', instagram: '', results: [], attempts, via: '' };
  if (!bdSearchOn(env)) { log('web search isn’t set up (BRIGHTDATA_API_KEY + BRIGHTDATA_SERP_ZONE)'); out.error = 'web search isn’t set up'; return out; }
  const seen = new Map(); const add = (list, q) => (list || []).forEach((r) => { const k = r.link; if (!k || seen.has(k)) return; seen.set(k, { title: r.title || '', link: r.link, snippet: r.snippet || r.description || '', q }); });
  const search = async (q, num = 8) => { const sr = await webSearch(env, q, num); out.via = out.via || sr.via; if (sr.error) { log(`search “${q}” failed: ${sr.error}`); return null; } log(`search “${q}” → ${(sr.organic || []).length} results${sr.kg && sr.kg.website ? ` · knowledge panel ${host(sr.kg.website)}` : ''}`); add(sr.organic, q); if (sr.kg && sr.kg.website) add([{ title: sr.kg.title || rawName, link: sr.kg.website, snippet: 'Google knowledge panel' }], q); return sr; };
  // 1a. the plain search (full raw name, legal form included, no quotes, no country) + the quoted search_name with the country
  const s1 = search(String(rawName).trim()); const qq = `"${sname}"${country ? ` ${country}` : ''}`; const s2 = search(qq); const [r1, r2] = await Promise.all([s1, s2]);
  if (r2 && !(r2.organic || []).length) await search(`${sname}${country ? ` ${country}` : ''}`);
  if (!r1 && !r2) { out.error = 'search failed'; return out; }
  const results = [...seen.values()]; out.results = results.slice(0, 12);
  // socials seen in the results — the company's own page only (name in the title)
  const own = (r) => { const t = norm(r.title); return rare.length ? rare.filter((w) => t.includes(w)).length >= Math.min(2, rare.length) : !!all.length && t.includes(all.join(' ')); };
  for (const r of results) { const h = host(r.link); if (!out.linkedin && /linkedin\.com\/company\//.test(r.link) && own(r)) out.linkedin = r.link.split('?')[0]; if (!out.facebook && /(^|\.)facebook\.com$/.test(h) && !/\/(posts|groups|photos|videos|reel|events)\//.test(r.link) && own(r)) out.facebook = r.link.split('?')[0]; if (!out.instagram && /(^|\.)instagram\.com$/.test(h) && !/\/(p|reel|explore)\//.test(r.link) && own(r)) out.instagram = r.link.split('?')[0]; }
  // 2. rank candidate websites, load the top 3 and confirm on the page
  const cand = []; const byHost = new Set(); const blocked = new Set((opts.block || []).map((x) => String(x).toLowerCase()));
  for (const r of results) { const h = host(r.link); if (!h || byHost.has(h)) continue; if (BLOCKED.test(`${h}.`) || BLOCKED.test(h) || GOVEDU.test(h) || blocked.has(h)) continue; byHost.add(h); cand.push({ ...r, host: h, score: score(r, rare, all, cc) }); }
  cand.sort((a, b) => b.score - a.score);
  if (opts.given) { const h = host(/^https?:/.test(opts.given) ? opts.given : `https://${opts.given}`); if (h && !cand.some((c) => c.host === h)) cand.unshift({ link: `https://${h}`, host: h, title: '', snippet: 'given', score: 99 }); }
  const rejected = []; for (const c of cand.slice(0, 3)) { const pg = await fetchPage(env, `https://${c.host}/`) || (c.link.startsWith('http') ? await fetchPage(env, c.link) : null) || await fetchPage(env, `http://${c.host}/`);
    if (!pg) { const nb = nameBuilt(c.host, rare, all); if (nb === 'full' && (r1 && r2) && results.filter((x) => host(x.link) === c.host).length >= 2) { out.website = `https://${c.host}`; out.website_ownership = 'unconfirmed'; out.website_evidence = `${c.host}: name-built domain seen in both searches, but the site did not open — check it`; log(out.website_evidence); break; } log(`${c.host}: did not open`); rejected.push(c.host); continue; }
    const [ok, why] = confirm(pg, c.host, rare, all, country, cc); log(why); if (ok) { out.website = pg.url && /^https?:/.test(pg.url) ? `https://${host(pg.url) || c.host}` : `https://${c.host}`; out.website_ownership = 'confirmed'; out.website_evidence = why; out.page = pg; break; } rejected.push(c.host); }
  if (!out.website && !cand.length) log('no candidate website in the results (only directories, social or trade-data sites)');
  // 3. no website → presence page (own LinkedIn / Facebook, or a page naming the company with its phone/email); at most 2 more searches
  if (!out.website && all.length && (rare.length || all.length >= 2)) {
    if (!out.linkedin && !out.facebook) { await search(`site:linkedin.com/company ${sname}${country ? ` ${country}` : ''}`, 5); await search(`site:facebook.com ${sname}${country ? ` ${country}` : ''}`, 5);
      for (const r of seen.values()) { const h = host(r.link); if (!out.linkedin && /linkedin\.com\/company\//.test(r.link) && own(r)) out.linkedin = r.link.split('?')[0]; if (!out.facebook && /(^|\.)facebook\.com$/.test(h) && !/\/(posts|groups|photos|videos|reel|events)\//.test(r.link) && own(r)) out.facebook = r.link.split('?')[0]; } }
    const ownPage = out.facebook || out.linkedin; if (ownPage) { const r = seen.get(ownPage) || [...seen.values()].find((x) => x.link.startsWith(ownPage)) || {}; out.presence_url = ownPage; out.presence_kind = out.facebook === ownPage ? 'facebook' : 'linkedin'; const sn = `${r.title || ''} ${r.snippet || ''}`; out.presence_phone = ((sn.match(PHONE) || [])[0] || '').trim(); out.presence_email = ((sn.match(EMAIL) || []).filter((m) => !/\.(png|jpe?g)$/i.test(m))[0] || ''); log(`presence: own ${out.presence_kind} page ${ownPage.replace(/^https?:\/\/(www\.)?/, '')}`); }
    else { // someone else's page naming the company with a phone or email — needs the country on it when only one name word matches
      for (const r of seen.values()) { const sn = `${r.title} ${r.snippet}`; const n = norm(sn); const hits = rare.filter((w) => n.includes(w)).length; const ph = (sn.match(PHONE) || [])[0]; const em = (sn.match(EMAIL) || [])[0]; if (!(ph || em)) continue; if (/volza|importgenius|panjiva|importyeti|seair|zauba|eximpedia|tridge|indeed|computrabajo|linkedin\.com\/in\//i.test(r.link)) continue;
        if (hits >= Math.min(2, rare.length || 1) && (hits >= 2 || (cc && (n.includes(norm(country)) || (ph && ph.replace(/\D/g, '').startsWith(cc[1])))))) { out.presence_url = r.link; out.presence_kind = 'listing'; out.presence_phone = ph ? ph.trim() : ''; out.presence_email = em || ''; log(`presence: ${host(r.link)} names the company with ${ph ? 'a phone' : 'an email'}`); break; } } }
    if (!out.presence_url) log('no website and no page that names the company with a phone or email — parked, not a rejection'); }
  // 4. Instagram when we still have none: accept only if the handle equals the domain label, the domain is shown, or all name words appear
  if (!out.instagram && (out.website || rare.length) && opts.instagram !== false) { await search(`site:instagram.com ${rare.length ? rare.join(' ') : sname}${country ? ` ${country}` : ''}`, 5); const dl = out.website ? norm(label(host(out.website))) : '';
    for (const r of seen.values()) { if (!/(^|\.)instagram\.com$/.test(host(r.link)) || /\/(p|reel|explore|stories)\//.test(r.link)) continue; const handle = norm((r.link.match(/instagram\.com\/([^/?#]+)/) || [])[1] || '').replace(/[^a-z0-9]/g, ''); const n = norm(`${r.title} ${r.snippet}`);
      if ((dl && handle === dl.replace(/[^a-z0-9]/g, '')) || (out.website && n.includes(host(out.website))) || (rare.length && rare.every((w) => n.includes(w) || handle.includes(w)))) { out.instagram = r.link.split('?')[0]; log(`instagram: @${handle}`); break; } }
    if (!out.instagram) log('instagram: none that is clearly theirs'); }
  out.results = [...seen.values()].slice(0, 24); // include the presence / Instagram searches, so research can read the page's title and summary
  return out;
}
