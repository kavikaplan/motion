# Motion Medical — Website Bundle

Pre-processed static site for Motion Medical. Plain HTML / CSS / vanilla JS.
No build step, no frameworks, no dependencies.

## Quick start

Open `index.html` in a browser. Everything works locally from the file system.

To deploy: upload the entire folder to any static host (Netlify, Vercel,
Cloudflare Pages, GitHub Pages, S3, or a regular web server).

## What's included

```
motion-medical/
├── index.html                  Home page
├── products.html               All 9 products in a grid
├── contact.html                Contact form + company info
├── products/                   9 individual landing pages
│   ├── indeflator-20cc.html
│   ├── indeflator-30cc.html
│   ├── kyphoplasty-inflator.html
│   ├── coronary-injector.html
│   ├── manifold.html
│   ├── manifold-kit-set.html
│   ├── trans-radial-band.html
│   ├── bone-cement-mixer.html
│   └── skin-stapler.html
├── assets/products/            9 transparent-background hero PNGs
├── css/styles.css              Full design system
└── js/main.js                  Dropdown + mobile menu + form stub
```

## Design

- **Accent color:** teal-blue (`#1B94B8`) matching the brochure titles
- **Typography:** system font stack for fast, reliable rendering
- **Layout:** responsive, mobile-first, sticky header
- **Products dropdown:** hover on desktop, tap-to-expand on mobile; shows
  thumbnail + name + tagline for every product plus a "View all" footer link
- **Landing pages:** hero image + description + spec table + "what's
  included" + feature grid + bottom CTA band that links to the contact page
- **Accessibility:** `aria-expanded` on the dropdown, keyboard-navigable,
  closes on Escape, closes on outside-click

## Prompt for Claude Code

If you want Claude Code to customize or extend this bundle, use this prompt:

> The `motion-medical/` folder contains a complete, working plain-HTML/CSS/JS
> website for a medical-device company. Do not rebuild it from scratch — read
> the existing `index.html`, `products.html`, `contact.html`, `css/styles.css`,
> and `js/main.js` to understand the design system, then make the following
> changes: [describe your changes here]. Keep the design system consistent,
> preserve the hover dropdown and responsive behavior, and don't introduce
> any build tools, frameworks, or npm dependencies.

## Things you'll want to change before launch

1. **Contact info in `contact.html`** — currently placeholders (`info@motionmedical.com`,
   phone, address). Replace with real values.

2. **Contact form backend** — `js/main.js` currently logs to the console.
   Wire it to your preferred endpoint (Formspree, Getform, a serverless
   function, etc.) by replacing the `console.log` line in the form handler.

3. **Company name** — the logo reads "Motion**Medical**". If your company
   name is different, search-replace across the HTML files (it appears in
   the `.logo` element in each page's header and in the `.site-footer`).

4. **Products with generic copy** (flagged because their source PDFs dropped
   out of the sandbox before I could extract the Turkish text):
   - `skin-stapler` — body copy is industry-standard, not from the brochure
   - `bone-cement-mixer` — body copy is industry-standard, not from the brochure
   - `kyphoplasty-inflator` — body copy is industry-standard, not from the brochure
   - `manifold` — body copy is adapted from the manifold kit set (closely related product)

   Re-upload those 4 PDFs and rerun the text extraction if you want the exact
   translated marketing copy from the originals.

5. **Hero image: skin stapler** — the only partial-view image in the set,
   because the original PDF was unavailable when the hero was generated.
   Re-upload the PDF to regenerate a full-device view.

6. **Open Graph / favicon / SEO metadata** — not added by default. Add
   `<meta property="og:*">`, `<meta name="description">`, and a favicon link
   in each `<head>` before launch.

## Image processing notes

- Hero images are 1000×700 transparent PNG, centered with ~5% padding
- Color-to-alpha conversion was used on the pastel-blue brochure background,
  with edge feathering for smooth transitions
- Images are sized for display at up to 560px wide at 2× DPI

## License

All product names, specs, and brand references ("Morpho", "Maccore",
reference numbers) come directly from the supplied brochures and belong to
the respective rights holder. Verify with your legal team before publishing.
