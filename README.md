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
| `ANTHROPIC_API_KEY` | ✨ AI summaries in the 📤 Client report (website version). The Claude version works without it. Optional `ANTHROPIC_MODEL` picks the model. |
| `BRAVE_API_KEY` | Web search in 🔎 Find missing details. |

## Saved settings on the website
Trips, congress stars, templates, saved views and other settings are now kept per login in the D1 database (`MEDINT_DB`, table `prefs`), so phone and laptop share them. The first time Kavi or Team opens the website, the trips from the Claude version are added automatically.
