# Medint — live website

The same dashboard you use in Claude, as your own website:

- **Saved data** (trade data, tenders, registrations, pipeline copy) lives in `public/data/`.
- **Live NetHunt data** goes through one small server function, `functions/api/nethunt.js`.
  It holds your NetHunt key; the browser never sees it.
- **Adding companies / writing fields** works when you switch writes on (step 5).
- **Saved views and filters** are kept per browser.
- **Local time, office hours and public holidays** work for every country.
  - Holidays for 2026–2027 are saved in `public/data/holidays_all.json`: 156 countries, downloaded from Google's public holiday calendars on 12 Oct 2026.
  - After 2027, or for a country missing from the file, `functions/api/holidays.js` fetches them live from Google; no login or key is needed.
  - Palestine has no published holiday calendar.
- **Not on the website:** 📅 meeting tags from your Google Calendar.
  Those need your own Google login, so they stay in the Claude version.

Hosting: **Cloudflare Pages** (free) + **Cloudflare Access** (free login for up to 50 people).

---


> **NetHunt connection (what works):** set two secrets in Cloudflare → Settings → Variables and secrets:
> `NETHUNT_MCP_URL` = `https://nethunt.com/mcp` and `NETHUNT_MCP_TOKEN` = your NetHunt API key (`nh_live_…`).
> Then Deployments → Retry deployment. Check `/api/nethunt` shows `"ok": true`.

## Before you start (once)

1. A free Cloudflare account: https://dash.cloudflare.com/sign-up
2. Node.js (LTS) installed: https://nodejs.org
3. Your **NetHunt MCP URL**: the personal NetHunt link you added to Claude as the NetHunt connector
   (it looks like `https://nethunt.com/mcp/…`).
   - Treat it like a password: anyone with it can read and write your CRM.
   - If NetHunt only gives you a sign-in (OAuth) connection instead of a link, stop here and tell Claude.
     The server function can be switched to NetHunt's REST API key instead.

Open a terminal in this folder (the one with this README) for the commands below.

## 1. Sign in and create the project

```
npx wrangler login
npx wrangler pages project create country-market-dashboard --production-branch main
```

Your site address will be **https://country-market-dashboard.pages.dev**.

## 2. Lock it with a login — do this before uploading anything

The data files contain CRM data, so the site must never be public.

In Cloudflare: **Zero Trust → Access → Applications → Add an application → Self-hosted**.

- **Application domain:** `country-market-dashboard.pages.dev`
- Add a second domain, `*.country-market-dashboard.pages.dev`, which covers preview copies.
- **Policy:** Action **Allow**, Include **Emails**. List each person who may open it (yours first).
- **Login method:** One-time PIN. People get a code by email; no passwords to manage.

(The first time you open Zero Trust, Cloudflare asks you to pick a team name and the Free plan.)

## 3. Upload the site

```
npx wrangler pages deploy
```

## 4. Give the server your NetHunt key

```
npx wrangler pages secret put NETHUNT_MCP_URL --project-name country-market-dashboard
```

Paste the NetHunt MCP URL when asked.

If NetHunt also gave you a separate token, add it too:
`npx wrangler pages secret put NETHUNT_MCP_TOKEN --project-name country-market-dashboard`

Then upload again so the function picks the secret up:

```
npx wrangler pages deploy
```

## 5. (Optional) Allow Add / Write

By default the site is **read-only to NetHunt**: "Add to NetHunt" and "Write imports" are refused.

To allow them:

```
npx wrangler pages secret put ALLOW_WRITES --project-name country-market-dashboard
```

Type `true`, then run `npx wrangler pages deploy` once more.

## 6. Check it

- Open https://country-market-dashboard.pages.dev/api/nethunt.
  After the login it should show `{"ok":true,"folders":…}`.
  If you see an error, the message says what's wrong (usually the URL/secret).
- Open https://country-market-dashboard.pages.dev and you should see the Markets page.

## Updating

- **Live data** (companies, people, statuses, changes) is always current. Use ↻ Refresh in the top bar.
- **Saved data** (trade report, tenders, registrations, pipeline copy, company index): ask Claude to refresh it.
  You'll get a new copy of this folder; run `npx wrangler pages deploy` again.
- **Dashboard changes** made in Claude come over the same way.

### Updating through GitHub (GitHub Desktop / the GitHub app)

1. Unzip the new `medint-site.zip` over your local copy of the repository (replace everything; it holds the whole site).
2. In GitHub Desktop: check the changed files, write a short summary, **Commit to main**, then **Push origin**.
3. Cloudflare Pages deploys `main` by itself in about a minute (no build step: the site is the `public/` folder, the server is `functions/`).
4. Something wrong? Cloudflare → Workers & Pages → the project → Deployments → the previous one → **Rollback**.

What's in the folder:
- `public/` — the website as served (scripts are already compressed, with content-hashed names).
- `functions/` — the server (NetHunt, Gmail, calendar, AI, the shared lead store).
- `source/` — the readable source of the three app scripts (`app.js`, `app2.js`, `app3.js`).
- `tests/` — the automated checks: `cd tests && npm install && node run.js` (and `node run.js --bundle` for the compressed build).

## What's protected and how

- The NetHunt key exists only as a Cloudflare secret. It isn't in any file in this folder or in the browser.
- The server only allows dashboard tools on the Companies and Contacts folders. Nothing can delete.
  Writes are refused unless `ALLOW_WRITES` is `true`.
- Cloudflare Access sits in front of everything: pages, data files and the server function.


## Meetings on the website (optional)
Add a secret `GOOGLE_CALENDAR_ICS` in Cloudflare → Settings → Variables and secrets, with your Google Calendar's **Secret address in iCal format** (Google Calendar → ⚙ Settings → your calendar → Integrate calendar). Then Deployments → Retry deployment. Meetings then show on the website too.


## Medint's own log copy (optional, recommended)
Cloudflare → Workers & Pages → **D1 SQL database** → Create → name `medint`. Then medint (Pages project) → Settings → **Bindings** → Add → D1 database → Variable name `MEDINT_DB` → database `medint` → Save → Deployments → Retry deployment. Every action is then also stored in Medint's own database; House can download it at `/api/medint?csv=1`.

## Optional secrets (Cloudflare Pages → Settings → Variables and secrets)

| Secret | What it turns on |
|---|---|
| `ANTHROPIC_API_KEY` | ✨ AI everywhere on the website: 🧠 company summaries, smart drafts and task messages, ✨ Tidy in the 📝 Log, client reports. Optional `ANTHROPIC_MODEL` picks the model. |
| `BRAVE_API_KEY` | Web search in 🔎 Find missing details. |

## Saved settings on the website
Trips, congress stars, templates, saved views and other settings are now kept per login in the D1 database (`MEDINT_DB`, table `prefs`), so phone and laptop share them. The first time Kavi or Team opens the website, the trips from the Claude version are added automatically.

## 🕒 Scheduled emails

Emails scheduled in Medint are kept in the `MEDINT_DB` database (table `mail_queue`, created automatically) and go out
when they are due while Medint is open anywhere (every open Medint checks once a minute; each email is sent only once).

Optional — to send on time even when nobody has Medint open:
1. Pages project → Settings → Variables and secrets: add a secret `CRON_KEY` (any long random text).
2. Cloudflare Zero Trust → Access → Service auth → Service tokens: create a token; in the Medint Access application add a
   policy with action **Service Auth** that includes this token.
3. Deploy the `scheduler/` folder as a Worker (`npx wrangler deploy` inside it) and give it the secrets
   `MEDINT_URL`, `CRON_KEY`, `ACCESS_ID`, `ACCESS_SECRET`. It calls `/api/gmail/cron` every 5 minutes.

## 📣 Email campaigns with follow-ups

📥 Inbox → 📣 Campaigns, or tick companies in a country's company list → 📣 Email campaign. Code: `functions/_lib/camp.js`
(sending, rules, `/api/gmail/camp/…`), `functions/_lib/camp_core.js` (time zones, working hours, variables), the page part in
`source/app3.js` (search “📣 Email campaigns”). Tables `camp`, `camp_rcpt`, `camp_sent`, `camp_box` are created in `MEDINT_DB` by themselves.

- Recipients: each company's general email(s) and every related person (linked or in Related records); the same address twice is kept once (the person wins); people already in a running campaign are left out; “Merged duplicate” people are skipped.
- Sent from the chosen mailbox and “Send mail as” address, with that address's signature. Follow-ups go in the same Gmail thread after N business days, at the chosen hour in the recipient's time.
- Only Monday–Friday 9:00–17:00 in the recipient's country time; one email per mailbox every 3–7 minutes; at most the mailbox's daily limit (default 50, ✎ limit in the load panel) of campaign emails per day (Istanbul day).
- A reply pauses the whole company (in every campaign); a bounce stops that address; a call where you spoke, a WhatsApp from them, a meeting, a status change or an email from them in NetHunt → the company's choice (⏸ pause by default, ▶ continue, ⏹ stop). Unanswered calls and WhatsApps you send don't count.
- Each sent email goes into the Medint Log (NetHunt + D1) as “📣 campaign · email n of N”. NetHunt statuses are not changed.
- 📣 Campaigns on the top bar: a page with every NetHunt company — one country, several or all — filtered in NetHunt by Status, NEXT / Motion status, Category, Tags, last contact and email; select all → 📣 Create campaign.
- Receivers: one line per company and per person; 🚩 wrong (typo / invalid), undeliverable (Snov check, ✓ Check emails) and bounced-before addresses are red and unticked.
- 🧩 Fallbacks per variable (used when someone has no value); 🖼 images (shown inside the email, cid:) and 📎 files (from the computer → the file library, or from the library) per email.
- No campaign email on the recipient country's public holidays (data/holidays_year.json, read by the function through env.ASSETS).
- Safe with overlapping runs: each mailbox and each recipient is claimed atomically; a sent email is recorded right after Gmail accepts it; a send cut off half-way is looked up in Gmail's Sent before anything is resent; Gmail 429 / quota / revoked token rests the mailbox for an hour (shown in the load panel) without failing anyone; a campaign is created as a draft and switched on only when every recipient is saved.
- Sending runs with the scheduled emails: the scheduler Worker (every 5 minutes) and every open Medint (every minute).

## 📂 Imported lead lists

✨ Not in NetHunt → **📂 Import a lead list**: a CSV (comma or semicolon) or Excel file from lead generation. Columns are guessed from
their names (English / Spanish / Portuguese / Turkish) and can be changed; rows of the same company are joined; countries are read
from names or codes (unknown ones: pick a country or leave them out). Everything else in the file is kept as info.
Stored in the shared lead store (D1 `leadstore`, kind `lead`); `public/xlsx.full.min.js` (SheetJS 0.18.5) reads Excel files.
Adding to NetHunt sends the tags to Tags, the city, products and brands, Source “Lead generation”, and the rest into Notes.

## ✉ Email box, ➕ Add info and brand scope (Yaman's feedback, Oct 2026)
- **Email box:** it looks like the email the receiver gets (white page). You can paste or drag images and GIFs in, and use bold, italic, underline, left/centre/right align, bullets and links. Pictures upload to the file library as hidden `_img-…` files and go inside the email as inline pictures (`cid:`), not as attachments.
- **Signature:** it sits inside the same box and can be edited for one email. Use ✕ to drop it or ↺ to get the original back.
- **Templates:** templates keep their pictures and layout, saved as `html` next to `body`.
- **From Power hour:** after you send, you are back in Power hour on the same company.
- **✓ Check:** a second click closes the box instead of adding another one.
- **Brand scope:** Dunitech = intramedullary nails only, Next Shoulder = shoulder prostheses only. AI drafts never offer other products. X-ray / imaging companies are left out of Best partners and Power hour for these two brands, unless they wrote to us or are Engaged or further.
- **Arabic drafts:** written in simple, correct Modern Standard Arabic, with the product named in Arabic.
- **Power hour:** a 🌐 button next to the phone and WhatsApp buttons opens the company website. **➕ Add info** (with the "How did it go?" choices) takes pasted text and sorts it into Phone number, Email, Website, Brand, City, new contacts and a comment. Simple rules sort it at once; ✨ AI can sort it better. Numbers and emails NetHunt already has are skipped. Done saves pasted info that wasn't saved yet, then opens the next company as before.
- **Campaign Tags filter:** loads NetHunt's choices plus the tags seen in your lists, and you can type any tag.

## 🔎 Medint × Richard: troubleshooting lookups (Nov 2026)
Richard (the Lead research skill) and Medint share methods but not code: Medint has its own copy of Richard's website search (`functions/_lib/discover.js`), page reader (`functions/api/enrich.js`), qualification (`functions/api/research.js`) and people/email lookups (`functions/api/leads.js`, Apollo + Snov). Medint uses its own keys in Cloudflare.
1. **Status first:** Menu → status check (`/api/health`). "People · Snov" now shows the credit balance and turns red at 0 credits. Web search needs BRIGHTDATA_API_KEY + BRIGHTDATA_SERP_ZONE (Richard's engine), SERPER_API_KEY or FIRECRAWL_API_KEY.
2. **Snov out of credits:** the first Snov call that answers "not enough credits" (or HTTP 402) is recognised. Medint then skips Snov for 30 minutes and shows "Snov credits are used up". Apollo and the website results still show. In ⚡ Qualify & enrich, companies with emails still come out ready, with the emails marked "not checked (Snov credits used up)", and the results show a warning. Add Snov credits, then run ✉ Check emails.
3. **A website that won't open:** the NetHunt value is cleaned (first address only, "http//" fixed). Medint then tries https and http, with and without www, using a normal browser's headers, and then Firecrawl / Bright Data Web Unlocker if those keys are set. The real reason is shown: domain not found, no answer in time, broken certificate, HTTP 403 (blocked automatic reading), robot check, site down. Medint then looks the company up by name and suggests what it finds. The NetHunt website is never overwritten automatically; a person adds the new one.
4. **No website:** "Find on the web", "Find contacts" (⚡ Search) and ⚡ Qualify & enrich all look the company up by name with Richard's search first. A site is accepted only when its page names the company; otherwise it is labelled "not confirmed — check it". Apollo's company search is the fallback. The messages keep "no website in NetHunt — searched by name" separate from "the website on file didn't open".
Tests: t142 (server: website reasons and fallbacks, name search, Snov credits — all outside services simulated) and t143 (the ⚡ run with no Snov credits).

## 🎯 Worth going? Congresses & trade fairs (Nov 2026)
- **Where it shows:** every congress and trade-fair card has a 🎯 chip, e.g. "Next: Exhibit · Duni: Visit". Tap it for the full evaluation. Filters: "🎯 Worth it for Next / Dunitech"; sort: "🎯 best for Next / Dunitech".
- **Verdict per brand:** Exhibit (book a booth), Visit (go without a booth to meet distributors and surgeons) or Skip, with a 0–100 score and the reasons:
  - **audience:** Next = shoulder / upper limb / arthroplasty / sports; Dunitech = trauma / fractures; general orthopaedics = medium
  - **size:** participants or visitors, exhibitors, countries
  - **reach:** worldwide / regional or national
  - **booths:** whether an exhibition exists
  - **our market:** Next / Dunitech pipeline in that country
  - **distributors:** distributors among the exhibitors we know
  - **cost:** booth price + travel from Istanbul for 2 people (Exhibit) or 1 person (Visit); stand build, printing and samples not counted
- **Where the numbers come from, in order:**
  1. typed by the team (✎ Type the numbers)
  2. 🔎 Research size & booth price: `/api/eventsize` reads the event's own pages plus 2 web searches, and an AI copies only numbers written there, each with its quote and page
  3. our event data
  Numbers whose quote is not on the page are shown as ⚠ unverified and never used. Results are shared with the team (leadstore kind `evt`).
- **Tests:** t144.

## ⚡ Power hour V3 (Nov 2026)
- **← Back:** the header has "← company name" to go back to the previous company; what you saved stays saved.
- **↩ Not worked:** at the end of the list, "↩ Back to the N not worked" goes through the skipped ones again.
- **Country:** the country and its flag show next to the weather.
- **Several countries:** one country at a time. The country with the best company comes first and its companies stay together, then the next country. "They wrote" replies stay on top.
- **Status menus:** Next Shoulder (light red) and Dunitech (light yellow) side by side without labels, plus Category, for everyone. The server was hiding the Companies field list (the choices) from a Person.
- **Sort by status:** Registration, Negotiating, Promising, Follow up, Awaiting response, Meeting, Interested, Replied, Called, Contacted, Drips, Enriched, Lead, To be qualified, Nurturing, Customer, Doctor / surgeon / hospital, Distributor, Lost, Exploring market entry, No info, Manufacturing branch, Unprocessed (`cmStatusRank`). Used by Best partners and Campaigns.
- **Tests:** t145.

## 🌤 Weather in Power hour

`/api/weather` needs no key: the nearest airport's live report (aviationweather.gov METAR, within ~40 km and under
90 minutes old) and otherwise Open-Meteo's current conditions. Cached 20 minutes.


## Offline and sign-in

- Medint saves itself on each phone and laptop (service worker `sw.js`, built from `source/sw.js`). Without internet it opens with the last data: companies, countries, Power hour, NetHunt answers you already loaded.
- Notes, call logs, status and field changes, and Log entries made offline (or after the Cloudflare sign-in expired) wait on the device and are sent when you are back. The pill in the top bar shows 📴 offline · 🔑 sign in again · ⏳ sending.
- New companies, AI drafts, enrichment and email sending need internet.
- Cloudflare Zero Trust → Access → Applications → Medint: set the session duration to the longest option so the sign-in is asked rarely.
- iPhone home-screen app: it keeps its own sign-in, separate from Safari. Sign in from inside the app (🔑 Sign in again), not in Safari.
- Browser check: `python3 tests/browser/offline_check.py` (serve `public/` on port 8811 first).
