# Motion Medical — Logo Files

Clean, text-only wordmark logo extracted from the original brand SVG.
Decorative cross elements removed. Transparent background.

## Files

| File | Use for |
|---|---|
| `motion-medical-logo.svg` | **Primary logo** — use this everywhere you can (header, footer, email signatures, Open Graph). Scales crisply at any size, 50 KB. |
| `motion-medical-logo-480w.png` | PNG fallback for header / navbar (renders at ~160–240px, retina-sharp). 480×74 px. |
| `motion-medical-logo-720w.png` | PNG fallback for larger placements (hero, about page). 720×111 px. |
| `motion-medical-logo-1080w.png` | PNG fallback for very large placements (print-grade web hero, social cards). 1080×166 px. |

The logo has an **aspect ratio of ~6.5 : 1** (very horizontal, typical wordmark).

## Recommended display sizes

- **Header / navbar:** 160–200 px wide (logo height ~25–31 px) — fits in a 56–72 px header
- **Footer:** 140–180 px wide
- **Hero section:** 240–320 px wide
- **Mobile header:** 120–140 px wide
- **Social sharing / Open Graph (1200×630):** centered at ~600 px wide
- **Email signature:** 160–180 px wide

## Colors

- Brand blue: **`#00a6e0`** (this is the exact teal-blue in the logo)
- Use on white or very light backgrounds for best contrast
- For dark backgrounds, apply CSS `filter: brightness(0) invert(1);` to turn it white

## Feeding this to Claude Code

Drop this folder into your website repo (e.g. under `assets/logo/`) and
tell Claude Code:

> Replace the text logo in the site header and footer with the SVG at
> `assets/logo/motion-medical-logo.svg`. In the header, size it to ~180px
> wide. In the footer (which has a dark background), apply
> `filter: brightness(0) invert(1)` to render it in white.

## HTML snippets

**Header logo (light background):**
```html
<a href="/" class="logo">
  <img src="/assets/logo/motion-medical-logo.svg"
       alt="Motion Medical"
       width="180" height="28">
</a>
```

**Footer logo (dark background, inverted to white via CSS):**
```html
<a href="/" class="footer-logo">
  <img src="/assets/logo/motion-medical-logo.svg"
       alt="Motion Medical"
       width="160" height="25">
</a>
```
```css
.footer-logo img {
  filter: brightness(0) invert(1);
}
```

**With PNG fallback (for emails and legacy browsers):**
```html
<picture>
  <source srcset="/assets/logo/motion-medical-logo.svg" type="image/svg+xml">
  <img src="/assets/logo/motion-medical-logo-480w.png"
       alt="Motion Medical"
       width="180" height="28">
</picture>
```

## Accessibility

Always include `alt="Motion Medical"` — this is the company name, so screen
readers should announce it.

Don't use the logo as the only identifier for a link; pair it with visible
text in the context around it where possible.
