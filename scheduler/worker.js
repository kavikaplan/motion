// Optional: sends scheduled Medint emails on time even when nobody has Medint open.
// A tiny Cloudflare Worker with a cron trigger that calls Medint every 5 minutes.
// Secrets on this Worker: MEDINT_URL (https://medint.kavikaplan.com), CRON_KEY (same value as on the Pages project),
// ACCESS_ID + ACCESS_SECRET (a Cloudflare Access service token allowed into Medint).
export default {
  async scheduled(_ev, env) {
    const r = await fetch(`${env.MEDINT_URL}/api/gmail/cron`, { headers: { 'x-cron-key': env.CRON_KEY, 'CF-Access-Client-Id': env.ACCESS_ID, 'CF-Access-Client-Secret': env.ACCESS_SECRET } });
    console.log('medint scheduled mail', r.status, await r.text());
  },
};
