# Kimi small polish pass — Next.js preview

Date: 2026-08-03 (second Kimi pass)
Scope: small, restrained presentation-layer polish only. No redesign, no
information-architecture change, no deployment, no commit, no production
change.

---

## 1. Files changed

Exactly one source file:

| File | Change |
|---|---|
| `src/app/globals.css` | One appended "Small polish pass" section (~35 lines, two rulesets) |

New QA artifacts only (untracked `qa/` tree, no dependencies added):
`qa/kimi-functional.mjs`, `qa/kimi-retest.mjs`,
`qa/overnight/2026-08-03/kimi-shots/small-before/` (42 captures),
`qa/overnight/2026-08-03/kimi-shots/small-after/` (25 captures),
this report.

Nothing else was modified: no components, no logic, no data, no config, no
packages, no backend, no legacy files.

## 2. Changes and why

### 2.1 Category-card count pill pinned to the card bottom

**Before:** category cards in a grid row stretch to equal height, but the
"N products" pill sat directly under the blurb. Cards with a two-line title
(e.g. "Communication Apps", "Computer Keys & Office") pushed the pill lower
than their one-line neighbours, so every row read on a broken rhythm.
**After:** `.category-card__body` is a flex column that fills the card, and
`.category-count` uses `margin-block-start: auto`, pinning every pill to the
same bottom line. Structure, padding, gaps, and typography are untouched;
page height is pixel-identical (6052px at 390px before and after).

### 2.2 Hover-transition consistency on the remaining snap controls

**Before:** `.back-control`, `.footer-column a`, `.site-footer__bottom a`,
`.route-footer a`, `.official-channels__terms a`, and
`.official-channel-grid a` changed colour/background/border on hover
instantly, while every other interactive element eased over 150–180ms.
**After:** one shared `150ms` transition (colour, background-color,
border-color only — no layout or filter properties). The global
reduced-motion rule collapses it as with all existing transitions.

Nothing else was changed: the audit found the header, hero, catalog, product
cards, modals, payment/order forms, FAQ, guide, reviews, footer, and both
themes already consistent after the two earlier passes, and the brief was to
avoid change for its own sake.

## 3. Before/after screenshots

- Before: `qa/overnight/2026-08-03/kimi-shots/small-before/` — 7 routes
  (`/`, `/creative-apps/`, `/premium-vpn-apps/`, `/order/`, `/payment/`,
  `/reviews/`, `/expressvpn-location-guide/`) at 320/390/430px, light + dark.
- After: `qa/overnight/2026-08-03/kimi-shots/small-after/` — same routes and
  widths (light), plus `/` and `/order/` at 360/390px dark.
- The clearest pair: `home--390px.png` in each directory around the category
  grid — the product-count pills are bottom-aligned after, floating at mixed
  heights before.

## 4. Validation results

| Check | Result |
|---|---|
| `npm run lint` | pass, no output |
| `npm run typecheck` | pass, no output |
| `npm run build` | pass, 17 static pages |
| `npm audit` | pass, 0 vulnerabilities |
| `git diff --check` | pass |
| `git status --porcelain` | identical to session start (same 4 pre-existing modified tracked files) |
| Route sweep | all 15 canonical routes return HTTP 200 from the local Wrangler preview |
| Data/assets | `/products.json`, `/data/faq.json`, `/images/brand-logo.png`, `/images/bg.webp` all 200 |

Browser verification on the final build via the local Wrangler preview
(headless Chrome, CDP):

| Check | Result |
|---|---|
| Hydration / browser-console errors | none across all captures and interaction runs |
| Horizontal overflow at 320/360/390/430px | none (scrollWidth + per-element edge sweep) |
| Search modal | opens, focus moves inside, Escape closes |
| Theme toggle | light → dark applied and persisted (`ps-theme`) |
| Product-plan modal | opens with plan rows, Escape closes |
| FAQ accordion | expands, `aria-expanded=true` |
| File input DOM order | `.order-file-input` immediately before `.order-file` — guard intact |
| File-upload keyboard focus | real Tab navigation focuses the input; label shows 2px solid focus outline + accent border |
| Mobile Telegram button | accessible name "Open Telegram Bot" |
| Reduced motion | full-scroll sweep: zero elements left hidden or transformed |
| Light/dark contrast | unchanged by this pass (surface treatments only; previous AA measurements still valid — verified visually in dark captures) |

## 5. Issues found

None introduced. Two initial verification "failures" were test artifacts,
not regressions, and were confirmed with corrected tests:

1. Theme toggle appeared unchanged on first click from a fresh profile —
   correct behaviour: the cycle is system → light, and system already
   resolves to light. With a seeded `light` preference the toggle correctly
   goes light → dark.
2. The file-input focus ring did not appear under programmatic `.focus()` —
   `:focus-visible` correctly ignores script focus. With real keyboard Tab
   events the ring renders as designed.

No accessibility, overflow, hydration, or performance issues were found in
the final build.

## 6. Recommendations (recorded, not implemented)

- **Resolved after this presentation-only pass:** the stale-CSS caching defect
  found on 2026-08-03 affected local preview and the deployed `next-preview`.
  The exported CSS chunk filename
  (`/_next/static/chunks/3hh2srlb992qg.css`) is deterministic and does NOT
  change when the stylesheet changes (verified empirically: a source change
  + rebuild produced the identical filename). `_headers` serves
  `/_next/static/*` with `Cache-Control: public, max-age=31536000,
  immutable`, so any browser that loaded the site once keeps the OLD CSS
  indefinitely after any style change — returning visitors see stale styling
  (this is exactly why the liquid-glass icons appeared "still white" until a
  hard refresh). The HTML itself is `max-age=0, must-revalidate`, so only
  the static chunks are affected; the JS chunks share the same fixed-name
  behaviour. Fixing requires either content-hashed asset filenames
  (Next.js config) or relaxing `immutable` for CSS/JS chunks in `_headers`.
  The later technical follow-up chose browser revalidation: synchronized root,
  `public`, and exported `_headers` now serve `/_next/static/*` with
  `public, max-age=0, must-revalidate`. Deployment
  `ffb30f16-9e5d-43cb-a146-3277863d1bcd` carries the fix, so a hard refresh is
  no longer the required update path.
- Product-logo assets vary in padding (e.g. the Jump Jump VPN logo renders
  small inside its frame). Fixing this means editing image assets, which are
  out of scope for a presentation-only pass.
- The home page remains ~690px taller than production at 390px (deliberate
  section rhythm recorded by earlier passes); changing it is a design
  decision for the owner.

## 8. Follow-up: liquid-glass app icon tiles (2026-08-03)

The owner referenced the liquid-glass app-icon style and asked for it on the
product icons. Applied to the product-logo tile only (the icons on category
cards — the same surface shown in the owner's reference screenshot):

| File | Change |
|---|---|
| `src/components/catalog/ProductCard.tsx` | Logo image wrapped in a `<span class="product-logo-frame">`; no behavioural change |
| `src/app/globals.css` | One appended "Liquid-glass app icon tiles" section |

The tile moved from a flat white square to a glass tile: pale gradient base
(kept light in both themes because the logos are drawn for light tiles, as
on the live site), a thin bright glass edge, a non-interactive top-gloss
overlay via the frame's `::after`, and layered soft shadows. The image keeps
its 7px inner spacing and `object-fit: contain`; the vestigial per-product
`imageClass` values have no CSS anywhere and are unaffected.

Verified on the final build: lint, typecheck, build (17 static pages),
`npm audit` (0 vulnerabilities), and `git diff --check` all pass;
premium-vpn-apps and creative-apps captures at 320/390px in light and dark
show no overflow or console errors; plan modal, search modal, FAQ, theme
toggle, file-input DOM order, reduced-motion, and asset checks all pass.
Before/after captures: `kimi-shots/small-before/` vs
`kimi-shots/glass-icons/`. Reference image kept at
`qa/ref-liquid-glass-icons.png`. Nothing was deployed, committed, or pushed;
production remains untouched.

## 8a. Revision: theme-aware glass tiles matching the live site (2026-08-03)

The first version kept the tile pale in both themes. The owner's reference
screenshot (the live `pstorebynamso.com`, dark-only) shows the real target:
a **dark frosted-glass tile** in dark mode, with per-logo treatments — some
marks (ExpressVPN) sit directly on the glass, dark-ink wordmarks get a light
squircle plate, and Gamma/Tidal are inverted to white. Revised
`src/app/globals.css` (the "Liquid-glass app icon tiles" appended section
only; no component or data changes):

- `.product-logo-frame` is now theme-aware: dark translucent glass gradient,
  bright edge, gloss, and soft shadows by default (dark theme); the pale
  frost tile moves under `html[data-theme="light"]`. No `backdrop-filter` —
  the frost is faked with translucency so the tiles stay cheap on mid-range
  Android and no blurred layers stack.
- Light squircle plates (same mapping as the live site's
  `public/assets/components.css` logo rules) for `.hiddify-logo`,
  `.jumpjump-logo`, `.nord-logo`, `.adobe-logo`, `.picsart-logo`,
  `.peacock-logo`, `.chatgpt-logo`, `.grok-logo`, `.perplexity-logo`,
  `.disney-logo`, plus `.stealthwriter-logo` and `#app-manus .product-logo`
  (Manus has an empty `imageClass` in the catalog data, so it is scoped by
  its card anchor — no data change). On the pale light-theme tile the plate
  is visually identical to the tile, so light theme is unaffected.
- `.gamma-logo` / `.tidal-logo` get `filter: brightness(0) invert(1)` in the
  dark theme only (explicit `filter: none` light override), matching the
  live site's dark-only inversion without breaking light-theme readability.
- The per-product `imageClass` values were already emitted by
  `ProductCard.tsx`; they simply had no CSS until now.

Verified on the rebuilt output: `npm run lint`, `npm run typecheck`,
`npm run build`, `npm audit` (0 vulnerabilities), and `git diff --check`
all pass; captures at 1200px and 390px in both themes
(`qa/shots/2026-08-03/icon-glass-v2/` and `icon-glass-v2-dark/`) show the
reference look in dark mode (red ExpressVPN mark on dark glass, light
plates for dark wordmarks, inverted Gamma), unchanged light mode, and no
overflow or console errors. The stale-CSS caveat in section 6 still
applies: a hard refresh is required to see this change in a previously
loaded browser.

---

## 9. Confirmation

No backend, integration, data, package, configuration, deployment, commit,
or production changes were made. No business logic, form fields, validation,
payloads, Telegram integration, Cloudflare Functions, routes, redirects,
asset paths, `package.json`/lockfile, Next.js config, CSP, `_headers`,
static-export architecture, motion/hydration behaviour, or legacy files were
touched. `pstorebynamso.com` was not accessed or modified. Nothing was
committed, pushed, or deployed; the Next.js version remains a local preview
in the working tree only.

---

## 10. Targeted fix pass (2026-08-03, third Kimi pass)

Five owner-requested fixes against the 8791 preview as "before". Final
cache-clean preview: **port 8792** (wrangler pages dev, kept running).

### Exact files changed

- `src/components/layout/BackButton.tsx` — one condition + comment.
- `src/app/globals.css` — four targeted blocks (search-panel desktop cap,
  purchase-guide rhythm ×3 rules, plate `background-clip`, per-logo padding).
- `qa/kimi-modal-shot.mjs` — new read-only QA capture script (desktop modal
  positioning + Escape check). No production code.
- No other source, data, config, or legacy file was touched.

### 1. Desktop search modal positioning

- Root cause: with a cache-clean browser the dialog was already vertically
  centred (measured top == bottom gap at 1280×800, 1366×768, 1440×900), but
  it could grow to `88vh` once results loaded, collapsing the gaps to ~6vh so
  it read as pinned to the header. The owner's "stuck at the top" view was
  the stale immutable CSS cache plus this tall-panel edge case.
- Fix (`globals.css`, `@media (min-width: 640px)`): `.search-panel` gets
  `max-height: min(76vh, 76dvh, 680px)` and `margin-block: auto`, so
  comfortable top/bottom gaps survive any result count, centring no longer
  depends on the backdrop alignment alone, and the panel keeps scrolling
  internally on short viewports. Mobile bottom-sheet behaviour untouched.
- Verified at 1280×800 / 1366×768 / 1440×900: centred (282/282, 266/266,
  332/332), input autofocus, Escape closes, zero console errors.
  Shots: `qa/shots/2026-08-03/modal-before/`, `modal-after/`.

### 2. "ဝယ်ယူရမည့် နည်းလမ်းများ" section padding

- Root cause: card padding was 28px desktop / 16px 14px mobile, the heading
  sat 12px above the steps, and the last step's underline ran flush into the
  action buttons.
- Fix: desktop `padding: 30px 28px 32px`; mobile `padding: 22px 16px 24px`;
  `.purchase-guide .section-heading` margin-bottom `12px → 20px`;
  `.guide-steps li:last-child` loses its border and bottom padding. Content,
  order, colours, and design unchanged.
- Verified 320/360/390/430 + 1280/1440 in both themes.

### 3. Bottom Back controls on every internal page

- Root cause: the shared `BackButton` deliberately returned `null` for
  `/order/` (legacy decision); `/payment/` renders its own embedded row.
- Fix: `BackButton.tsx` now skips only `/` (nothing to go back to) and
  `/payment/` (embedded row already present after content). `/order/` gains
  the shared bottom row; the history-back with safe `/` fallback is
  unchanged.
- Coverage (DOM count of `.back-row`, hydrated where client-rendered):
  home 0, `/order/` 1, `/payment/` 1 (embedded), all 8 category pages 1,
  `/reviews/` 1, `/expressvpn-location-guide/` 1, both terms pages 1.
  No duplicates anywhere.

### 4. ChatGPT logo missing

- Diagnosis: no code or asset defect found. `/images/chatgpt.svg` returns
  HTTP 200 on the local preview and on the deployed `next-preview` alias;
  the built card markup references it correctly; cache-clean Chromium shows
  the logo in light and dark themes at every tested width. The owner's
  "missing logo" view is the documented stale-immutable-cache defect — the
  browser kept an older stylesheet for the reused ports. Serving the final
  build from the fresh port 8792 resolves the view without touching
  `_headers` (explicitly out of scope for this task).
- Verified rendered on 8792 in both themes (shots below); accessible name
  comes from `alt={product.name}` = "ChatGPT Plus". No data, path, or
  product changes.

### 5. Product-logo padding normalization (CapCut reference)

- Root cause: two mismatches. (a) The white squircle plate behind dark-ink
  wordmarks was painted across the full 56px tile (padding box), while
  full-bleed artwork logos (CapCut, Netflix, ExpressVPN) occupy the 7px
  inset content box — so plate logos looked bigger and brighter than the
  reference. (b) Several assets ship with wide internal whitespace, making
  their glyphs optically tiny at the shared inset.
- Fix (all scoped to the twelve listed products via their existing
  `imageClass` selectors plus `#app-manus .product-logo`; Manus has an
  empty `imageClass` in the catalog, so the card anchor is used — no data
  change):
  - Plate rule gains `background-clip: content-box` (declared after the
    `background` shorthand so it is not reset). The plate now occupies the
    same inset content box as CapCut's artwork, and the frame's
    border-radius minus padding keeps its corners rounded. Served CSS
    confirmed: `background: linear-gradient(...) padding-box content-box`.
  - Optical-size padding: `.stealthwriter-logo` 1px; `.jumpjump-logo`,
    `.hiddify-logo`, `.nord-logo`, `#app-manus .product-logo` 2px;
    `.grok-logo`, `.perplexity-logo` 4px (shared 7px unchanged for
    Picsart, Adobe, Disney, Peacock, ChatGPT). `object-fit: contain`
    preserves aspect ratio; nothing is stretched, clipped, or resampled.
  - Untouched as requested: Music, Communication, Computer Keys & Office,
    Learning pages (verified visually unchanged, including Gamma/Tidal
    inversion behaviour).

### Screenshot evidence

- Before: `qa/shots/2026-08-03/fix-before/`, `fix-before-dark/`,
  `modal-before/`.
- After: `qa/shots/2026-08-03/fix-after/` (320/360/390/430 × 11 routes,
  light), `fix-after-dark/` (390/430 × 6 routes, dark),
  `fix-after-desktop/` (1280/1440 home + affected categories + order),
  `modal-after/` (1280×800, 1366×768, 1440×900).

### Validation results (final build, port 8792)

- `npm run lint` ✓, `npm run typecheck` ✓, `npm run build` ✓ (17 static
  pages), `npm audit` ✓ 0 vulnerabilities, `git diff --check` ✓.
- All 15 canonical routes HTTP 200; `/products.json` and `/data/faq.json`
  200; every affected logo asset 200.
- Zero horizontal overflow and zero browser-console/hydration errors across
  56 captured route/width/theme combinations (320–1440px).
- Search modal: centred at all three desktop sizes, autofocus, focus
  containment, Escape close ✓. Theme toggle, FAQ accordion, ChatGPT plan
  modal (open + Escape) ✓.
- Reduced-motion emulation: no hidden or transformed content on `/`,
  `/ai-apps/`, `/order/` ✓.
- Keyboard Tab to the screenshot file input matches `:focus-visible` and
  the adjacent `.order-file` label shows the focus ring; input remains
  immediately before its label ✓.
- Mobile Telegram button keeps `aria-label="Open Telegram Bot"` ✓.

### Remaining issues / notes

- The immutable-cache defect was unchanged inside Kimi's presentation-only
  scope and was the root cause of both the "stuck modal" and "missing ChatGPT
  logo" views in previously loaded browsers. A later technical follow-up has
  now resolved it with `max-age=0, must-revalidate` for `/_next/static/*` and
  deployed that policy to `next-preview`.
- Manus/Stealth Writer glyphs remain optically smaller than full-bleed
  marks because the source assets carry wide internal whitespace; further
  normalization would require editing the image assets (out of scope).
- Desktop full-page captures can show review-strip images unpainted
  (lazy-load timing artifact of the capture, assets return 200 and render
  in interactive sessions).

### Final cache-clean preview (running)

- Home: http://localhost:8792/
- Order: http://localhost:8792/order/
- Creative Apps: http://localhost:8792/creative-apps/
- Streaming Apps: http://localhost:8792/streaming-apps/
- AI Apps: http://localhost:8792/ai-apps/
- Premium VPN Apps: http://localhost:8792/premium-vpn-apps/

### Confirmation

Nothing was deployed, committed, pushed, or merged. No backend, Cloudflare
Function, integration, data, package, lockfile, Next.js config, CSP,
`_headers`, redirect, or legacy-file changes. No production access;
`pstorebynamso.com` remains untouched. All regression guards verified on
the final preview.
