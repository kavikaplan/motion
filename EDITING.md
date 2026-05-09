# Editing the Motion Medical website

This guide is written for non-developers. Every common edit is one
short paragraph. You don't need any tools beyond a text editor (TextEdit
on Mac, Notepad on Windows, or VS Code if you have it).

After saving any file, double-click `index.html` to view the change in
your browser. If the change doesn't appear, do a hard refresh
(Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows).


## 1. Change phone number, WhatsApp, email, or social media links

Open **`js/site.config.js`** in a text editor. The top of the file
holds every contact value the site uses. Change the value inside the
quotes, save the file, refresh the browser. That's it — every page
on the site picks up the new value automatically.

Examples:
- New phone: change both `phone` (display) and `phoneTel` (digits-only,
  used by clickable phone links).
- New WhatsApp number: change `whatsapp` to country code + number with
  no plus sign and no spaces (e.g. `358414882527`).
- Hide a social network: set its URL to `""` (empty quotes).
- Add a new social network: would need a small code change — ask a
  developer.


## 2. Change the office addresses on the contact page

Same file: `js/site.config.js`. Edit the `helsinki:` and `ankara:` blocks.
Use a comma where you want a line break (the script turns the first
comma into a `<br>` automatically).


## 3. Change the homepage headline or any homepage text

Open **`index.html`**. The page is divided into clearly-labelled
sections — search the file for `HERO`, `TRUST STRIP`, `FINNISH
CONNECTION`, `FEATURES ROW`, `PRODUCT RANGE CARDS`, `BOTTOM CTA BAND`,
or `FOOTER`. A big comment block before each section explains what it
is and what's editable.

Edit the words between the HTML tags. For example:
```html
<h1>Old headline</h1>
```
becomes:
```html
<h1>New headline</h1>
```
Don't touch anything inside the `<` and `>` brackets unless you know
what it does.

If a tag has `data-i18n="some.key"`, leave that attribute alone — it's
how the language switcher (EN / FI) finds the right translation. To
update the Finnish translation too, open `js/main.js` and search for
that same key.


## 4. Add or edit a product page

Each product is its own HTML file inside `products/`. To edit an
existing product (price, specs, description), open the matching file
(e.g. `products/manifold.html`) and edit the text between the tags.

To add a brand-new product:
1. Copy an existing file in `products/` (e.g. `manifold.html`) and
   rename it (e.g. `new-product.html`).
2. Open the new file and update the product name, hero image, copy,
   and spec table.
3. Add the product to the dropdown menu in **every** page — search for
   `products-grid` and copy/paste an existing `<a class="product-card">`
   block into the right pillar.
4. Add the product to `products.html` so it appears in the main grid.

This step is repetitive — if you add new products often, ask a
developer to set up a small script.


## 5. Change a product hero image

Hero images live in `assets/products/`. Replace the file (keep the
same filename) and the page will use the new image automatically.
Recommended size: 1000×700 pixels, transparent PNG.


## 6. Change the logo

Logos live in `assets/logo/`. The header uses
`motion-medical-logo.svg`; the footer uses `motion-wordmark.svg`.
Replace these files with your new versions (keep the same filename and
file extension).


## 7. Wire up the contact form to actually send emails

Right now the form shows a "Message received" success card but doesn't
send the message anywhere. To make it send for real, sign up for a
free service like [Formspree](https://formspree.io) or
[Getform](https://getform.io), then ask a developer to plug in your
endpoint URL — they'll need to edit the `form.addEventListener`
block near the bottom of `js/main.js` (look for the `// Success` comment).


## 8. Publish the site

The site is plain HTML — it works on any web host. The simplest free
options:
- **Netlify Drop** — drag the whole `motion-medical/` folder onto
  netlify.com/drop
- **GitHub Pages** — push the folder to a GitHub repo and turn on
  Pages in the repo settings
- **Cloudflare Pages** — connect the GitHub repo, deploy in one click

Any of these will give you a live URL within minutes.


## File map (where things live)

```
motion-medical/
├── index.html              ← homepage
├── products.html           ← all-products grid
├── contact.html            ← contact page + form
├── procedure-packs.html    ← procedure packs page
├── quality.html            ← quality & compliance page
├── 404.html                ← page-not-found
│
├── products/               ← one HTML file per product
│   └── (10 product pages)
│
├── assets/
│   ├── logo/               ← logo + wordmark in PNG and SVG
│   ├── brand/              ← brand-mark variants
│   └── products/           ← product hero images
│
├── css/
│   └── styles.css          ← all visual styling
│
├── js/
│   ├── site.config.js      ← ★ contact info + social links (edit this!)
│   └── main.js             ← navigation, language switcher, form
│
├── README.md               ← original technical notes
└── EDITING.md              ← this guide
```


## When to ask a developer

You can do these on your own:
- Edit any text or headline
- Update phone, email, social, addresses (via `js/site.config.js`)
- Replace images in `assets/`
- Publish the site to a host

Ask a developer for:
- New page sections or layout changes
- A new social network in the icon row
- Wiring the contact form to a real backend
- Adding a blog or news section
- Adding tracking or analytics
