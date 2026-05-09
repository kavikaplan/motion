/* ============================================================
 * Motion Medical — Single source of truth for contact + social.
 * ------------------------------------------------------------
 *  EDIT THIS FILE to change phone numbers, email, or social links
 *  site-wide. After editing, save and refresh any page in your
 *  browser — the new values appear automatically.
 *
 *  No need to touch the HTML files for these changes.
 * ============================================================ */

window.SITE = {

  /* -------- Primary contact (Helsinki HQ) -------- */
  // Phone shown in top-bar of every page.
  // Format the displayed version however you like;
  // the tel: link MUST stay digits-only (no spaces).
  phone:        "+358 41 4882527",
  phoneTel:     "+358414882527",        // for tel: links — digits only

  // WhatsApp click-to-chat number.
  // Format: country code + number, no plus sign, no spaces.
  whatsapp:     "358414882527",

  // Email shown on contact page + email links anywhere on site.
  email:        "info@motionmedical.fi",

  /* -------- Helsinki HQ address -------- */
  helsinki: {
    label:   "Helsinki HQ",
    address: "Majurinkulma 2B 044, 02600 Espoo, Finland",
  },

  /* -------- Ankara office (production / shipping) -------- */
  ankara: {
    label:    "Ankara Office",
    address:  "Maltepe, Özveren Sk. No:2 D:19, 06570 Çankaya/Ankara",
    phone:    "+90 507 821 55 14",
    phoneTel: "+905078215514",
    email:    "info@motionmedical.com.tr",
  },

  /* -------- Social media links -------- */
  // Set any of these to "" (empty string) to hide the icon site-wide.
  social: {
    instagram: "https://www.instagram.com/motionmedical.fi/",
    facebook:  "https://www.facebook.com/profile.php?id=61589385234193",
    tiktok:    "https://www.tiktok.com/@motionmedical.fi",
    linkedin:  "https://www.linkedin.com/company/motionmedi",
  },
};


/* ============================================================
 * Auto-fills the page using the values above.
 * You shouldn't need to edit anything below this line.
 * ============================================================ */
(function applySiteConfig () {
  const S = window.SITE;
  if (!S) return;

  // -- Top-bar phone (every page) --
  document.querySelectorAll(".tb-phone").forEach((el) => {
    el.setAttribute("href", "tel:" + S.phoneTel);
    el.textContent = S.phone;
  });

  // -- WhatsApp floating action button (every page) --
  document.querySelectorAll(".wa-fab").forEach((el) => {
    el.setAttribute("href", "https://wa.me/" + S.whatsapp);
  });

  // -- Contact-page Helsinki block (auto-fill if present) --
  document.querySelectorAll("[data-mm-helsinki-phone]").forEach((el) => {
    el.setAttribute("href", "tel:" + S.phoneTel);
    el.textContent = S.phone;
  });
  document.querySelectorAll("[data-mm-helsinki-email]").forEach((el) => {
    el.setAttribute("href", "mailto:" + S.email);
    el.textContent = S.email;
  });
  document.querySelectorAll("[data-mm-helsinki-address]").forEach((el) => {
    el.innerHTML = S.helsinki.address.replace(", ", "<br>");
  });

  // -- Contact-page Ankara block (auto-fill if present) --
  document.querySelectorAll("[data-mm-ankara-phone]").forEach((el) => {
    el.setAttribute("href", "tel:" + S.ankara.phoneTel);
    el.textContent = S.ankara.phone;
  });
  document.querySelectorAll("[data-mm-ankara-email]").forEach((el) => {
    el.setAttribute("href", "mailto:" + S.ankara.email);
    el.textContent = S.ankara.email;
  });
  document.querySelectorAll("[data-mm-ankara-address]").forEach((el) => {
    el.innerHTML = S.ankara.address.replace(", ", "<br>");
  });

  // -- Social-icon container(s): build icons from config --
  const iconSvg = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.6V4.2C16.4 4.1 15.4 4 14.3 4c-2.3 0-3.8 1.4-3.8 3.9v2.9H7.8V14h2.7v8h3z"/></svg>',
    tiktok:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3v13.2a2.6 2.6 0 1 1-2.6-2.6c.2 0 .5 0 .7.1V9.6a5.7 5.7 0 1 0 4.9 5.6V8.5a6.5 6.5 0 0 0 4 1.3V6.7a3.7 3.7 0 0 1-3.4-3.7V2z"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z"/></svg>',
  };
  const labels = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn" };

  document.querySelectorAll("[data-mm-social]").forEach((wrap) => {
    const html = Object.keys(S.social)
      .filter((k) => S.social[k])
      .map((k) =>
        `<a class="mm-social-link" href="${S.social[k]}" target="_blank" rel="noopener" aria-label="${labels[k]}">${iconSvg[k]}</a>`
      )
      .join("");
    wrap.innerHTML = html;
  });
})();
