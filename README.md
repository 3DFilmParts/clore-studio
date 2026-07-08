# Handoff: CLORE Studio — 3D Film Parts creative tool

## Overview
CLORE Studio is a browser-based creative tool for 3D Film Parts (3dfilmparts.com). It generates
on-brand product marketing assets from the live Shopify catalogue across four workspaces:

1. **Design** — fills brand templates (T02–T13) with product data; exports PNG / JPEG / SVG at
   production size in five formats (square 1080x1080, portrait 1080x1350, story 1080x1920,
   webbanner 1600x600, emailbanner 1200x400). Includes a render queue and shareable presets.
2. **Animation** — decomposes the current design into layers (logo, badge, eyebrow, headline,
   rule, price, CTA, product image cycle) and records animated MP4/WebM with per-layer effects,
   easing, stagger, Ken Burns.
3. **Batch** — deals 10 random catalogue products styled with the current template/format/preset;
   one-click export of all 10 as PNG / JPEG / MP4 (sequential, with Stop button).
4. **Reel** — vertical 1080x1920 video maker: drop in an edited phone video, choose from 13 brand
   skins (6 hand-drawn + 7 AI-generated frames incl. the Camera Tape 1–5 family), timed text
   overlays, animated badge stickers, rolling timecode slate, progress bar, optional CTA end card,
   exports MP4 at the source video's own frame rate with audio.

### v1.1 additions (Design workspace)
- **Carousel builder** — a 5-slide Instagram story arc for the selected product
  (hero → closer look → on set → angles → call to action), each slide on a different brand
  template, portrait or square, with image shuffle. Exports numbered `01–05` PNG/JPEG files at
  production size, ready to upload in order.
- **Caption + hashtag generator** — ready-to-paste caption built from the live product data
  (hook line, store description when available, price + product URL, CTA) with a rotating
  "New angle" variant, plus a brand/camera-specific/niche hashtag set. One-click copy for
  caption, hashtags, or both. Captions are editable in place.
- These features live in the deployed bundle (`index.html` / standalone HTML); the
  `.dc.html` source reference predates them.

### v1.2 additions (mobile app)
- **Responsive mobile layout** — below 820px the app stacks (stage first, controls below) with a
  fixed bottom tab bar (Post / Design / Anim / Batch / Reel) and previews that fit the screen.
- **Installable PWA** — `manifest.webmanifest`, `sw.js` (network-first, offline fallback), branded
  icons. Add to Home Screen on iPhone/Android launches it fullscreen like a native app and it
  keeps working offline after first load.
- **Quick Post mode** — phone-first flow: horizontal product strip → swipeable template styles →
  format chips → live preview → **Share image / Share carousel** via the native share sheet
  (`navigator.share` with files, straight into Instagram; caption + hashtags auto-copied to the
  clipboard on tap). Falls back to file downloads in browsers without a share sheet.

## About the files in this bundle

| File | What it is |
|---|---|
| `CLORE Studio (standalone).html` | **Fully working, self-contained build.** One file, no server, no dependencies — all templates, tokens, frame art and badges are embedded. Works from `file://` or GitHub Pages as-is. |
| `CLORE Studio Editor.dc.html (source reference)` | The original source (a Design Component). Reference only — it needs its host runtime and sibling folders to run. Read it for the full application logic. |
| `clore-templates/` | The production design-system assets (see below). This folder is what the CLORE pipeline / any rebuild should consume. |

**Recommended GitHub layout:** commit the whole folder; serve `CLORE Studio (standalone).html`
via GitHub Pages (rename to `index.html` if you like). If you later rebuild the tool in a
framework, treat the standalone build as the working spec and `clore-templates/` as the asset
source of truth.

## Fidelity
**High-fidelity and functional.** The standalone HTML is not a mock — every feature above works.
A re-implementation should match it pixel-for-pixel and behaviour-for-behaviour.

## clore-templates/ contents
- `tokens.css` — CLORE design tokens v1.5 (`--clore-*`): Signal Red `#E8231F`, Ink `#141414`,
  Paper `#F2EFE8`, White, faint greys; Archivo Black display + JetBrains Mono; tracking, radii,
  eyebrow-bar dimensions, motifs.
- `T02/T05A/T05B/T10/T11/T12/T13` — production HTML templates with `{{SLOT}}` placeholders:
  `FORMAT, TITLE, EYEBROW, PRICE, BADGE, IMAGE, IMAGE2 (T10/T11), LOGO, TAPEBG (T13)`.
  Empty `BADGE`/`PRICE` hide cleanly. Light grounds take the ink logo, dark grounds the white
  logo (each file's header comment documents its rules).
- `preview-assets/` — ink + white transparent logos.
- `reel-frames/` — frame art: `frame-a` Film Slate, `frame-b` Camera Tape 1 dark,
  `frame-c` Edit Suite, `frame-d` Colour Grade, `frame-e` Gear Shop (faded cartoon montage drawn
  from real catalogue products), `frame-f/g/h/i` Camera Tape 2 paper / 3 red / 4 airy / 5 border;
  `badge-new/hot/eyes.png` — alpha sticker badges.
- `standalone-assets.js` — auto-generated pack embedding all of the above (`window.CLORE_ASSETS`).
  **Regenerate this file whenever templates or frame art change**, then rebuild the standalone
  HTML (the app prefers live files and falls back to this pack when fetches fail).

## Key behaviours a rebuild must preserve
- **Catalogue**: fetched from `https://3dfilmparts.com/products.json?limit=250` (Shopify),
  fallback to a bundled 73-product list, then a built-in 16-product shortlist. Picking a product
  fills title/price/eyebrow/badge and both image slots; badge default is `NEW PRODUCT`.
- **Slot filling**: templates are plain text; replace every `{{KEY}}` occurrence. Image
  scale/position are injected as a `<style>` override; headline scale via `h1 { zoom: n }`.
- **Logo colour**: Auto (ink on light / white on dark, incl. T13 tape-ground override) with a
  manual Black/White toggle in all workspaces.
- **Exports**: filenames follow `{product-slug}_{template}_{format}.{ext}`
  (`..._anim.mp4` for animation, `..._{skin}_story_reel.mp4` for reels). PNG has an HQ 2X mode.
- **Reel engine**: 1080x1920 canvas; video drawn cover with zoom 0.4–2.5x; source fps
  auto-detected via `requestVideoFrameCallback` and used for `canvas.captureStream(fps)`;
  audio track piped from the source video; 24 Mbps video bitrate; MP4 where supported else WebM.
- **Persistence**: everything (template settings, queue, anim setup, presets, reel config) lives
  in `localStorage` key `clore-studio-editor-v1`; presets import/export as JSON and auto-load
  from `clore-templates/presets.json` if present.
- **Safe zones**: reel progress bar sits ~350px above the bottom edge to clear Instagram's
  caption/CTA overlay zone; text overlays are user-positioned 5–95% vertically.

## Design tokens (quick reference)
- Signal Red `#E8231F` · Ink `#141414` · Paper `#F2EFE8` · White `#FFFFFF` · Faint `#8A8A86`
- Display: Archivo Black (900), uppercase, letter-spacing -0.03em, line-height ~0.95
- Mono: JetBrains Mono 400/700; eyebrows lowercase red with wide tracking; labels uppercase
- Radii: 0 for hard-edge cards, pill for circle badges, 10–24px for tape/photo cards

## Assets provenance
Product photography comes from the 3D Film Parts Shopify CDN at runtime. Frame art and badge
stickers were AI-generated to brand spec and are committed in `reel-frames/` — no runtime AI calls.
