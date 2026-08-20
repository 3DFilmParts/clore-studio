# CLORE Studio

Social content for **3D Film Parts**, built from the live store.
One self-contained HTML file. Open it on a phone, add it to the home screen, make posts.

Live: https://3dfilmparts.github.io/clore-studio/

---

## How it works

Five steps, in the order you actually think in.

1. **What** are you making. Post, Story, Reel, Banner. Pick one or pick all of them.
2. **Products.** The whole catalogue, live from `3dfilmparts.com/products.json`, filtered by
   category, searchable, multi select. Or upload your own photos, or start blank.
3. **Template.** Every template is drawn live with your own first product, so you are choosing
   the actual result rather than a thumbnail of something else.
4. **Refine.** Full control over every element, with the type sizing itself so nothing clips.
5. **Export.** Share sheet on a phone, a named zip on a computer, captions alongside.

## The rules this app enforces in code, not by habit

- **Type never clips and never collides.** Blocks are measured before anything is drawn and the
  whole stack shrinks together until it fits. If it still will not fit at the floor size the app
  says so out loud rather than cutting a word in half.
- **No eyebrow labels.** Anywhere.
- **Nothing small is ever thin.** There is a floor size and a floor weight for small copy, so the
  spidery wide-tracked look is not reachable even by accident.
- **No em dashes** in anything the app generates. One `clean()` function is the choke point.
- **Price is off by default.** The store sells into a lot of countries and one currency figure
  causes more questions than it answers.
- **The accent rule is off by default** for the same reason: it reads as template furniture.

## What is in it

**18 templates**, each of which works at all five sizes:
Hero, Hero centred, Photo card, Headline first, Split block, Poster, Gallery frame,
Hero + detail, Colour band, Two angles, Three up, Statement, Spec sheet, Taped print,
Ruled edge, Hero + 3 angles, Hero + 4 angles, Contact sheet.

**Five sizes**, every one of them available on every template:
square 1080x1080, portrait 1080x1350, story 1080x1920, web banner 1600x600, email 1200x400.

**Type.** Ten named pairings, eleven display faces, eight text faces, and a separate override for
headline, description and the price/button/handle line.

**Colour.** Seven grounds, four accents, and full control of the gradient over the photo:
shape, strength, where it starts, softness, blend mode, and a follow-the-text mode that sizes the
gradient to the words so a dark product stops disappearing into a dark gradient. Plus a type
shadow, which is what lets the gradient come right down and still leave the headline readable.

**Backdrops.** 21 pieces of frame art: twelve new photographic ones shot to brand
(gaffer tape, torn paper, case foam, film edge, layer lines, cable run, red stripe, machined
plate, cutting mat, paper sweep, grid paper, steel and cream) plus the original nine
(Camera Tape 1 to 5, Film Slate, Edit Suite, Colour Grade, Gear Shop).

**Images.** Six slots per post, chosen by tapping the actual product photos. Slot 1 is the hero,
the rest fill the detail frames. Framing, zoom, position, corner and grade per post.

**Captions.** Built from your real Shopify product description, spun into ten different angles at
three lengths, regenerating endlessly. Five hashtags maximum, `#3dfilmparts` always among them.

**Motion.** Two jobs, kept separate.
- *Animated post* takes the design you just made, splits it into its real layers
  (photo, logo, badge, headline, rule, description, price, shop line) and animates each one on its
  own: effect, start, duration, distance, easing. Three starting points, then adjust anything.
- *Reel* puts your own footage inside the frame art, with a movable window, titles, stickers,
  progress bar and timecode, exported at the clip's own frame rate with its audio.

**Final Cut.** Exports a zip with the stills and an `.fcpxml` timeline, ready for File, Import, XML.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app. No build step, no dependencies, no server. |
| `legacy-v1.html` | The previous build, kept so nothing is lost. |
| `clore-templates/reel-frames/` | Frame art and sticker badges. |
| `clore-templates/preview-assets/` | The logos, also embedded in the app. |
| `manifest.webmanifest`, `sw.js`, `icons/` | The bits that make it installable and work offline. |

## Notes for anyone rebuilding it

- One canvas renderer draws the preview, the export, the template thumbnails and the video.
  The preview *is* the export, scaled. There is no second code path to drift.
- Shopify's CDN sends `access-control-allow-origin: *`, which is the only reason the canvas can
  export product photography without tainting. Load product images with `crossOrigin`.
- Templates paint the ground, photo and gradient straight to the canvas. Text, logo, badge and the
  shop line go through helpers that can either paint immediately or hand a painter to the animator.
  That split is what makes per layer animation possible without a second layout engine.
- An element id is a global name. The motion overlay has its own ids for exactly that reason.
