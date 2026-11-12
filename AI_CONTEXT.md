2026-11-12 AI Movie credit labels corrected to shared catalog values.
See integration/AI_MOVIE_LABELS_20261112.md.

2026-11-11 Duolingo Ready Made Acc: renamed catalog, cards, detail page, FAQs,
legacy labels and order matching. Existing product/plan IDs and detail URL
are preserved. Shared bot/admin product 154 renamed with private backup;
both services active. Lint (four prior warnings), typecheck, build, CSP,
audit (zero vulnerabilities), commerce and migration checks pass.

# PStore AI Context

2026-11-11 ATOM 130GB data-only correction prepared; see
integration/ATOM130_20261111.md.

2026-11-11 Noto preview accepted by owner on phone; production release with
17px descriptions/FAQs and revised Netflix guidance is prepared.
Record: integration/MYANMAR_FONT_PREVIEW_20261111.md.

2026-11-11 Noto Sans Myanmar phone preview: 05529de, preview branch only.
Phone acceptance pending; local network resets pages.dev connections.
Record: integration/MYANMAR_FONT_PREVIEW_20261111.md.

2026-11-11 description batch 2: 12 more descriptions across 13 active routes;
25 total pages verified LIVE as 28d056a. See integration/PRODUCT_DETAILS_20261111.md.

2026-11-11 product descriptions and CapCut/Happ fixes: LIVE as f2c5bb0.
See integration/PRODUCT_DETAILS_20261111.md for scope and verification.

Read this file first. It is the short source of truth for AI-assisted work.
Read the larger documents only when the current task requires their details.

## Project Goal

Maintain the mobile-first PStore storefront in this Git project. The active
website source was imported from `/Users/ymp/Desktop/newsite_clean/orbit` on
2026-11-10. Read `integration/HANDOFF.md` for the current source, verification,
catalog boundaries and recovery instructions before using historical UI notes.

## Approved Stack

- Next.js App Router with static export.
- React and TypeScript.
- Tailwind CSS.
- Motion for React.
- Existing Cloudflare Pages project and Pages Functions.
- Build command: `npm run build`.
- Build output: `out`.
- Do not add Vite or React Router.
- Do not add GSAP or Lenis unless later approved and proven necessary.

## Critical Requirements

- Mobile is primary: design and test at 360px, 390px, and 430px first.
- Also support tablet, desktop, and common in-app WebViews.
- Keep the complete `PREMIUM STORE` brand visible in the mobile header.
- Fix untidy bottom content and footer spacing on mobile.
- Improve the light-mode color palette and visual hierarchy.
- Add smooth, lightweight animation matching the quality of the reference site
  discussed with the owner. Do not name or link that reference in project docs.
- Preserve current Burmese and English content.
- Preserve all product IDs, plan IDs, hashes, and checkout query parameters.
- Keep `products.json` as the live catalog source.
- Preserve `POST /api/order` and its exact multipart form contract.
- Keep all Cloudflare and Telegram secrets server-only.
- Do not use a new Cloudflare account or project.

## Current Status

2026-11-10 production release: COMPLETE; owner phone acceptance: PASS.
Code e2015e8 is committed and pushed to main. Cloudflare production deployment
461c0ba0-e52c-4034-aadf-a300f73931dc is live at https://pstorebynamso.com/.
Home, Music and ChatGPT return HTTP 200 with CSP; all 14 homepage CSS/JS
assets match the verified export byte for byte. Release checks pass, with
four existing lint warnings and zero npm audit vulnerabilities. Current upstream
catalog, content, dependencies and Pages Functions are retained. No live order
was submitted. See integration/RELEASE_20261110.md. Older preview/pending
entries below are historical and superseded by this accepted release.

2026-11-10 release acceptance: PASS. The owner approved the final phone test
and authorized commit/push/production deployment. Release source is prepared
on upstream 48512b2 in /private/tmp/pstore-ios-motion-release-20261110, keeping
the current 46-product catalog and dependency security fixes. All checks pass;
the release dependency audit reports zero vulnerabilities. The local approved
checkpoint is 107f4f0. See integration/RELEASE_20261110.md for publication state.
Older pending-preview and dependency findings below are historical.

2026-11-10 owner phone acceptance: PASS. The owner confirmed all changes in
the final 9d924b8d preview work on a phone and explicitly authorized commit,
push and production deployment. Release preparation preserves current upstream
catalog/content and dependency fixes. Production verification will be recorded
after deployment. Older pending-preview entries below are historical.

iOS-inspired motion refinement (2026-11-10): PREVIEW, PHONE TEST PENDING.

- Native forward/back navigation now uses opaque, layered push/pop movement
  with matched 440ms timing. The previous page recedes beneath the next page;
  the reverse direction reveals it. Header stays stationary.
- Dialogs retain their different directions, with shorter travel and restrained
  springs (480ms opening, 320ms closing). Home zoom is subtler. Older-browser
  and history entry use smaller directional movement without fading to blank.
  First paint, reduced motion, focus, URLs and cancellation remain protected.
- Build, lint (four existing warnings), typecheck, CSP, commerce, migration,
  carousel and motion lifecycle/CSS invariants pass. All 14 served assets
  match the build. The audit retains 16 findings; 93 protected hashes match.
- Test: https://9d924b8d.pstorebynamso.pages.dev/
  Alias: https://homepage-perf-test.pstorebynamso.pages.dev/
  Home/Music return HTTP 200 with CSP/noindex. Production remains
  001124df-b878-45d8-bf1a-d96e63e24ab4. No commit or push.
  Physical phone smoothness/visual acceptance remains pending.

Directional motion update (2026-11-10): PREVIEW, PENDING PHONE TEST.

- Forward/detail navigation enters from the right; back/parent navigation
  enters from the left. Category links use their relative catalog order.
  Browser Back/Forward tracks visited routes, including Forward from home.
- Home uses a soft zoom; information pages use a vertical fade. Route entry
  lasts 420ms and exit 200ms. Native snapshots and older-browser fallback use
  matching directions. Reduced motion, immediate first paint, URLs, focus,
  cancellation and scroll cleanup are preserved.
- Search drops from above (320ms), plans rise from below (320ms), reviews
  zoom in (320ms); all close in the reverse direction (200ms).
- Lint (four existing warnings), typecheck, build, CSP, commerce, migration,
  carousel and expanded offline motion checks pass. Audit retains 16 findings.
  All 93 protected catalog/content/Function/dependency hashes are unchanged.
- Preview: https://e6ee3fd5.pstorebynamso.pages.dev/
  Alias: https://homepage-perf-test.pstorebynamso.pages.dev/
  Home/Music return HTTP 200 with CSP and noindex. Production is unchanged at
  001124df-b878-45d8-bf1a-d96e63e24ab4. No commit or push.
- Physical phone acceptance remains pending. Test both navigation directions,
  Back/Forward, search, plans and reviews in both themes and reduced motion.

- 2026-11-10 page motion refinement: owner-requested sequential zoom/fade is
  uploaded to the existing `homepage-perf-test` branch. The outgoing page
  shrinks to 92% and fades over 300ms; the next page settles from 106% over
  600ms, with a stationary header. Native snapshots and an older-browser
  fallback preserve immediate first paint, reduced motion, query/hash values
  and Back cancellation. Search results use the same navigation. Preview:
  `https://5642067d.pstorebynamso.pages.dev/`; alias:
  `https://homepage-perf-test.pstorebynamso.pages.dev/`.
  Build, lint (four existing warnings), typecheck, CSP, commerce, migration,
  carousel and offline motion lifecycle checks pass. Audit retains 16 findings.
  Status is PENDING PHONE TEST. This update is preview-only; production remains
  `001124df-b878-45d8-bf1a-d96e63e24ab4`. No commit or push was made.

2026-11-10 production release `001124df-b878-45d8-bf1a-d96e63e24ab4` is live at
`https://pstorebynamso.com/`, explicitly authorized by the owner. Includes
homepage performance improvements, current category/page and dialog motion,
and the product-title double-tap shortcut. Lint, typecheck, build, CSP,
commerce, route, motion and carousel checks pass. Live homepage asset
references match the export. Chrome touch emulation passes search -> detail
-> double-tap -> plans -> close for ChatGPT Plus and Spotify on production.
Physical phone performance acceptance remains pending. Dependency audit
retains 16 findings (7 moderate, 8 high, 1 critical). Source edits remain
uncommitted. Rollback deployment is `b2551cdb-7367-43d8-80d3-071bf3a35105`.


- 2026-11-10 shortcut verification: the owner reported failure on
  `pstorebynamso.com`, whose production build predates the title shortcut.
  Owner-authorized Chrome touch emulation verified search, detail navigation,
  a single tap staying closed, a double-tap opening the correct live plans,
  and close/scroll restoration for ChatGPT Plus and Spotify on
  `https://homepage-perf-test.pstorebynamso.pages.dev/`. Direct touch tests also
  passed on the original `116d2928` preview. The same gesture on production
  reproduced the reported failure. Continue phone acceptance on the preview.

- 2026-11-10 motion preview: visible page content gets a 220ms
  transition on client navigation; initial content and live catalog refreshes
  stay immediate. Plans, search and review dialogs use shared Motion entry/exit
  animations (160-240ms), with focus trapping, focus return and scroll locking
  through closure. FAQ/menu disclosures have lightweight CSS motion; FAQ height
  transitions progressively enhance supporting browsers. Reduced motion skips
  the new animations. Build, lint (four existing warnings), typecheck, CSP,
  commerce, migration, carousel and offline motion lifecycle checks pass.
  The audit retains 16 existing findings. No dependencies, catalog, Functions
  or checkout contracts changed. Uploaded with owner authorization to the
  existing test branch: `https://homepage-perf-test.pstorebynamso.pages.dev/`
  (immutable `https://024bae1b.pstorebynamso.pages.dev/`). Preview pages return
  HTTP 200; CSS/layout JavaScript match the local build byte for byte.
  Preview noindex and CSP are present. Production deployment is unchanged.
  Status: PENDING PHONE TEST; mark PASS only after owner acceptance.
  Changes remain uncommitted; no Git push was performed.

- 2026-11-10 product detail shortcut: double-tapping a product title now opens
  the existing live View Plans dialog on every detail page. The shared
  `/product-details/` fallback also uses it. Lint, typecheck, build, CSP,
  commerce, migration and carousel checks pass. Uploaded to the existing
  Cloudflare test preview at `https://homepage-perf-test.pstorebynamso.pages.dev/`
  (immutable `https://116d2928.pstorebynamso.pages.dev/`). Phone gesture
  acceptance is pending. Production and Git remote are unchanged; these edits
  remain uncommitted, alongside the earlier performance edits.

- 2026-11-10 performance preview: source baseline is now committed locally as
  `b956117`, explicitly authorized by the owner. Steps 1-3 remove hero entrance
  delays, make sections visible immediately and pause shared carousel autoplay
  offscreen/hidden/reduced-motion. The rotating hero is unchanged. Preview:
  `https://homepage-perf-test.pstorebynamso.pages.dev/`. Performance edits remain
  uncommitted. Phone acceptance is PENDING; see `integration/PERFORMANCE_TEST.md`.
  The import preservation command is a historical pre-commit gate; use the
  ordinary migration check for subsequent intentional source changes.

- 2026-11-10: Latest website source consolidated into this project: 98 source
  files and 110 additional public assets. The complete previous frontend and
  pre-existing edits are retained in
  `.migration-backups/20261110-orbit-source/`, with Git patches and hash manifest.
  Desktop `newsite_clean/orbit`, Git HEAD/refs/index, package lockfile, all 91
  protected root catalog/content/image/Function files, and existing local
  catalog changes are unchanged. The local 47-product/103-plan catalog is
  intentionally retained; the imported 46-product/100-plan reference is tested
  separately. No catalog publication or backend change was made.
- Local validation: lint passes with four warnings; typecheck, webpack static
  build, strict CSP, offline commerce tests against both catalogs, live-data
  proxy checks, content mirrors and source-preservation checks pass. Export:
  74 HTML pages, 50 redirects and 213 checked local references. Three small
  import compatibility changes are listed in `integration/IMPORT_ADJUSTMENTS.json`.
- Existing dependency audit reports 16 findings (7 moderate, 8 high, 1 critical).
  The historical Zoom price assertion also fails against the preserved local
  catalog. Neither the lockfile nor catalog was rewritten to hide these findings.
  Browser/phone and live production order checks were not performed. No commit,
  push, deployment, credential copy or deletion of the Desktop source occurred.
- Active commands: `npm run dev` for Next design development; `npm run build`
  followed by `npm start` for the existing Pages Functions preview at port 3000.
  Historical browser QA scripts target the retired frontend. Current acceptance
  commands and remaining release limits are in `integration/HANDOFF.md`.

## Earlier release history

The entries below describe the previous frontend and earlier deployments.

- 2026-10-29: Streaming FAQ update `f0f4487` from release checkout
  `.release/streaming-movie-faq`: inspected existing 10 entries for overlap,
  added four Bioscope/AI Movie FAQs (14 total), kept the owner's wording and
  tutorial post /562, and enabled decimal markers for ordered rich-text lists.
  Lint, typecheck, build, CSP and source/export checks pass.

- 2026-10-29: ReelsCap stability fix `9f991cc` in the release checkout
  `.release/reelscap-stable`: a shared presentation policy keeps the card
  and plan-dialog logo compact even when a legacy catalog says banner.
  Current/legacy/current render regression, lint, typecheck, build and CSP pass.

- 2026-10-29: Package release `c279161`: standard ReelsCap logo size; Netflix
  Phone starts at 24,000 Ks with Basic removed; Spotify Individual in Music
  Apps has `us,ca,asia mix region`, 3 months / 20,000 and 6 months / 35,000 Ks;
  CapCut is 7 months / 110,000 Ks using its existing checkout ID. Bot/panel
  catalog operation `b751158` is applied. Release checkout is
  `.release/catalog-oct29-final`. Desktop browser preview awaits permission.

- 2026-10-29: AI Movie Bot Credits is live in Streaming Apps. Release `889c131`
  renamed the product, changed plan descriptions to credits, and enabled bot
  checkout for all four existing IDs. One inventory code `c` equals 100 credits.
  Prices remain 15,000/28,000/40,000/65,000 Ks, and `images/reelscap.jpg`
  remains the product image. The sale bot and panel have matching mappings.
  Cloudflare Pages succeeded; the public catalog and rendered page show the
  new name and image. No live order was submitted. The original checkout is
  behind upstream; the release checkout is `.release/ai-movie-release`.

- 2026-10-29: The owner-supplied ReelsCap logo is live as the Short Drama Bot
  Credits product image (release `1febb09`). It appears on the Streaming card
  and plan dialog. Four plans, prices, checkout, and IDs are unchanged. The
  normal production page and catalog use the new image; the served photo
  matches the source SHA-256. No order was submitted. The earlier price flyer
  remains in the repository but is no longer the product image.

- 2026-10-29 (shipped via release checkout): Added Short Drama Bot Credits under
  Streaming Apps from the owner's `IMG_0763.JPG` photo. The four website plans
  are 100/200/300/500 credits at 15,000/28,000/40,000/65,000 Ks. The photo
  renders as a wide card image and in the plan dialog. These plans use the
  website order form; bot checkout is intentionally absent until bot plan IDs
  are confirmed. Lint, typecheck, build, CSP, catalog/export photo checks, and
  diff check pass. `npm audit --omit=dev` reports 3 existing dependency
  advisories (2 high, 1 critical); no dependency change was made. The local
  branch remains behind upstream, and pre-existing review-33 edits were kept.
  Release commit `f5f343f` is live. Production page, catalog, and photo hash
  match the release; the payment route returns 200. No order was submitted.

- 2026-10-26: Added the owner's Downloads photo `IMG_0623.heic` as
  `images/review33.webp` (1147 x 1805, about 78 KB) and appended it to the
  canonical review list. Build, typecheck, CSP, review-flow, and exported
  HTML/JSON/image checks pass. Lint passes with one existing QA warning.
  Audit reports 9 existing dependency vulnerabilities (8 high, 1 critical);
  dependencies were not changed. The owner authorized commit, push, and
  deployment through the existing Pages Git integration; direct Wrangler
  access is unavailable because no API token is configured.

- **The homepage redesign is shipped (2026-08-24).** Search-first hero: a
  full-bleed solid plum-indigo band (`--hero-band`, `#392c6b` dark /
  `#2e245e` light), left-aligned Burmese headline, wide white search field
  that opens the header's single hardened `ProductSearch` dialog via the
  `ps-open-search` window event (⌘K/Ctrl+K lands there too — one dialog, so
  the 84dvh IME and `onCloseRef` fixes exist exactly once). Search matching
  stays substring-based but now expands through a storefront-owned
  Burmese/typo alias map (`src/data/search-aliases.ts`). Category grid leads
  the page, popular row follows it; every category card is one layout tinted
  by `--cat-<key>-*` tokens via `data-category` (VPN is the deliberately deep
  card in both themes; palette table in `README.md`). Card blurbs are
  storefront-owned Burmese one-liners (`categoryCardDescriptions` in
  `src/data/category-presentations.ts`) — panel subtitles stay on category
  pages. Raster app icons (Atom/Mytel/Bioscope) render full-bleed through
  `productLogoClass()` (`src/data/product-media.ts`). Burmese heading leading
  fixed site-wide (section h2 1.45, bioscope h1 1.28) with the 14px
  paragraph-gap fix kept. Popular row: rank chip, category·price meta,
  edge-to-edge scroll-snap under 720px — the 88px height contract and
  render-nothing-without-data rule are untouched. Two layout gotchas now
  documented in CSS comments: implicit grid auto tracks blow out on nowrap
  Burmese max-content, and hover lifts on motion-wrapped cards must use the
  independent `translate`/`scale` properties (inline `transform: none` after
  the reveal beats a stylesheet `transform`). Verified: lint, typecheck,
  build, csp:check, theme:check, touch:check all pass; screenshots at
  390/768/1280 in both themes plus `/premium-vpn-apps/` and
  `/bioscope-download/` regression shots confirmed detail pages render as
  before.
- **The animated theme switch is DEPLOYED (2026-08-23, commit `1e15e4e`).**
  The header's plain Sun/Moon icon button is now a `role="switch"` control
  with a painted day/night scene: the pill track cross-fades between a
  clouded day sky and a starred night sky while the thumb morphs from a
  glowing sun to a cratered moon and slides across with overshoot. Each
  toggle adds a `theme-transition` class to `<html>` for one beat so
  token-driven surfaces cross-fade (340ms) instead of snapping;
  reduced-motion collapses everything to an instant swap. Behaviour contract
  is unchanged — same `ps-theme` key, same untouched pre-hydration bootstrap
  (no flash), system `prefers-color-scheme` as the unset default; "system"
  is no longer a separate UI state (the switch toggles Light ↔ Dark and the
  first tap stores an explicit choice). `npm run typecheck`, `npm run build`,
  `npm run csp:check`, and `npm run theme:check`
  (`qa/theme-switch-check.mjs`) all pass locally AND against production
  `pstorebynamso.com` (animated flip, reload persistence both ways, system
  default, reduced motion, 44px target, wordmark/switch fit at
  360/430/768/1024px, zero console errors/overflow). Scene captures live in
  `qa/shots/theme-switch/`. Note: the theme CSS rode along inside the
  Bioscope commit `e049fd8` (it swept the then-dirty `globals.css`), while
  the component itself shipped in `1e15e4e`.
  ⚠️ Deploy-path finding: local `wrangler pages deploy` now fails with API
  code 10000 — the current OAuth login (`yeminphyo0000@gmail.com`, account
  `1177852b…`) has no Pages projects; the project lives in account
  `02dc0fa8…` (still cached in `node_modules/.cache/wrangler`, which was
  cleared). This deploy went out through the Pages Git integration on push
  (corrected build settings: `npm run build` → `out`), which published
  production within minutes. Future direct uploads need the owner to
  re-authenticate wrangler against the `02dc0fa8…` account.

- **The Bioscope download page is LIVE-READY (2026-08-23).**
  `/bioscope-download/` ships the official download links for Android, Android
  TV, the three iOS TestFlight slots, Windows and Mac behind one device rail
  that also swaps the install steps; a "New" spotlight card on the home page
  points at it. The macOS and iOS walkthroughs are illustrated (11 WebP
  screenshots in `public/images/bioscope/`) and carry the owner's red caution
  about the iOS build being withdrawable. Content lives in
  `data/bioscope-download.json` (storefront-owned and hand-editable — unlike
  panel-owned `products.json`, `data/faq.json` and `data/reviews.json`),
  mirrored by `prebuild` and served live by `functions/data/[file].js`. Download
  hrefs are re-validated on arrival: https only, official hosts only.
  `functions/api/bioscope-links.js` resolves the CURRENT installer filename off
  the vendor's own page and HEAD-verifies it, so a Bioscope release does not
  dead-end a button; the pinned link stays whenever that lookup fails.
  **Bioscope is deliberately NOT in `products.json`** — there is no price or
  stock yet, and only the Admin Panel may write that file. `npm run lint`,
  `typecheck`, `build`, `csp:check`, `bioscope:check`, `live-data:check`,
  `content-source:check` and `npm audit` all pass. Placeholder logo at
  `public/images/bioscope.svg` awaits the real artwork.

- **Checkout haptics and the one-step Order → Payment → Done flow are LIVE
  (2026-08-18, `1f81eda` → `8f3f337` → `a5556a0`).** Tap feedback runs off one
  delegated `pointerdown` listener and `data-haptic` on Android, and off an
  invisible `<input type="checkbox" switch>` overlaid on each button for
  iOS/iPadOS 18+, where no browser implements the Vibration API; iOS 17.4-17.x
  falls back to the programmatic switch toggle. Paying and filing the order are
  one step — the order form renders under the QR panel on `/payment/`, the
  scanned platform fills the form's payment field, and the Done step keeps only
  the confirmation. `CheckoutFlow` owns the single live catalog subscription for
  the step. **Owner functional test: PASS (2026-08-18) — haptics on device, and
  one end-to-end purchase from plan selection through the QR and screenshot to
  an order the admin received.**
  Checks: `qa/haptics-steps-check.mjs` and `qa/checkout-stock-flip-check.mjs`,
  both passing against production.

- **FAQ/review source-of-truth hardening and production acceptance are COMPLETE
  (2026-08-09).** Canonical sources are
  `data/faq.json`, `data/reviews.json`, and
  root `images/reviewN.*`. The stale tracked `public/data/{faq,reviews}.json` and
  `public/images/reviewN.*` copies are removed from Git; they are ignored build
  artifacts regenerated by `scripts/sync-live-data.mjs`. Successful Admin FAQ
  and review-list mutations trigger Pages builds. The live `/data` Functions
  resolve the current branch SHA from GitHub's public commit feed every five
  seconds, then fetch immutable raw blobs with `no-store` responses; this avoids
  raw branch CDN staleness without a new token or GitHub API rate load. Review
  images use the built static snapshot first and the same immutable GitHub path
  for newly committed files. Visible React consumers revalidate every five
  seconds and on focus. The sale bot owns no FAQ copy/cache and links its FAQ
  action to this storefront. Runtime fix `0ef0175` is deployed; final cleanup
  source `f82df0a` is active as Cloudflare Production
  `ce058647-54bc-4a88-af4d-6cb46d6b1d77`. Two disposable FAQ cycles (including
  final create/edit/delete) and two disposable Review upload/display/delete
  cycles passed through real Admin, GitHub, live JSON/images, and storefront.
  Final FAQ/review hashes equal their original baselines, `review32.webp` is
  absent/404, and no temporary or real customer content remains changed.
- **Canonical sequential review flow is DEPLOYED (2026-08-09).**
  Repository evidence confirmed original reviews in
  `images/review1.webp`…`review30.webp`, while the panel's 31st upload used the
  separate `images/uploads/review-1786262153.webp` / `img/...` contract. The
  release migrates that file to `images/review31.webp`, uses canonical review
  JSON, adds a canonical `/images/reviewN.*` GitHub-live Function with static
  fallback, rolling upstream cache key and no-store browser caching, and mirrors
  canonical review binaries from root `images/` before builds. The old `/img`
  Function remains for legacy paths. Review QA, lint, typecheck, build, CSP, and
  Zoom checks pass; local Wrangler returns the built review31 and preserves
  unrelated image routes. The build-only PostCSS dependency now resolves the
  patched `nanoid@3.3.18`, and `npm audit` reports zero vulnerabilities.
  Final production source is `f82df0a` / `ce058647-54bc-4a88-af4d-6cb46d6b1d77`;
  Admin Panel runtime `2d4c5f1` is live and healthy.
- **Already-open tab revalidation follow-up is DEPLOYED (2026-08-07,
  `6186a36`).** The panel successfully published both Stealth Writer plans as
  canonical `contact:true` in commits `b887c3d` and `9edb150`; the remaining
  mismatch was a storefront client that fetched catalog and live content only
  once after hydration. Visible tabs now revalidate catalog, FAQ, reviews, and
  guide data every five seconds and immediately on focus/visibility return,
  while background tabs do not poll. Production deployment
  `d1f676f1-f293-4a45-ac26-c7389154e39a` serves runtime commit `6186a36`.
  Both Stealth plans pass plan/direct/payment/order Ask Price checks on the
  custom domain, including focus-triggered catalog revalidation. The full
  49-item/98-open FAQ matrix also passes on mobile and desktop with
  focus-triggered FAQ revalidation and zero runtime, console, network,
  hydration, or overflow failures; maintained mobile/CSP checks pass. Rollback
  deployment: `c7bf779e-2182-4aac-a771-d00e15f57f8c`.
- **Ask Price + live content reliability fix is DEPLOYED (2026-08-07,
  `78066e9`).** The storefront now treats both canonical `contact:true` and
  the panel's legacy `"0 Ks"` sentinel as Ask Price in plan, direct category,
  payment, and order URLs, so no zero-price checkout can be opened. Pages
  Functions now revalidate the GitHub-backed catalog/FAQ/reviews/guide on a
  five-second rolling key and return `no-store`; invalid or oversized upstream
  JSON falls back to the build snapshot. `scripts/sync-live-data.mjs` keeps all
  four `public/` fallbacks byte-equal to the panel-written root files before
  every build. The current FAQ and Manus fallback snapshots are synchronized.
  Local Wrangler 4.120.0 browser checks, the full 49-item FAQ matrix, maintained
  mobile interaction checks, lint, typecheck, build, CSP, Zoom, proxy tests,
  audit (0 vulnerabilities), and diff checks pass. Commit `78066e9` is pushed;
  its verified export and Pages Functions are live as Production deployment
  `c7bf779e-2182-4aac-a771-d00e15f57f8c`. On `pstorebynamso.com`, Manus plan,
  direct category, payment, and order links are contact-only; the 49-item/98-open
  FAQ matrix and maintained mobile/CSP checks pass with zero runtime, console,
  network, hydration, or overflow failures. Both live JSON endpoints return
  `no-store` from `github-live`. Rollback deployment: `29cfb13c`.
- Planning and repository inspection are complete.
- P1 Next.js foundation is complete and verified.
- P2 shared mobile-first UI is complete and verified.
- P3 home and catalog migration is complete and verified.
- P4 FAQ, reviews, ExpressVPN guide, terms, and not-found migration is complete
  and verified.
- The local P5 payment and order migration and its production-compatible
  Preview integration gates are complete and verified.
- The P6 Motion and polish pass is complete and verified, including a real
  mid-range Android Chrome performance run.
- P7 metadata, structured data, sitemap, and legacy-route redirects are
  complete and verified.
- The P8 QA matrix, real Android Chrome acceptance, and physical iPhone Safari
  acceptance are complete. The owner confirmed that this deliverable is a SaaS
  website and does not require an embedded WebView app/wrapper.
- The App Router, TypeScript, Tailwind CSS, Motion, and static `out` export are
  configured.
- Runtime assets are mirrored into `public` with their existing URL paths.
- The legacy HTML, CSS, JavaScript, and Cloudflare Pages Functions remain in
  place and unchanged.
- The shared root layout now provides metadata, a responsive header and footer,
  navigation and back controls, safe-area spacing, reusable buttons and status
  states, and an accessible Motion-based modal.
- Light, dark, and system themes use the existing `ps-theme` preference key and
  apply before hydration to avoid a theme flash.
- The full `PREMIUM STORE` mobile brand, footer layout, and horizontal overflow
  were verified at 360px, 390px, 430px, 768px, and 1024px. Theme persistence,
  modal keyboard focus, reduced-motion behavior, and Motion hydration were also
  verified through the local Cloudflare Pages preview.
- The P2 CSP blocker is resolved for static export with build-time SHA-256
  hashes. `npm run build` inventories every executable inline Next.js bootstrap
  and Flight script and generates a route-specific policy in `out/_headers`;
  the effective export contains neither script `'unsafe-inline'` nor
  `'unsafe-eval'`. `script-src-attr 'none'` continues to block inline event
  handlers. The synchronized root/public templates retain `'unsafe-inline'`
  only as a documented legacy compatibility fallback and are replaced in the
  generated export.
- Client hydration and Motion interactions are verified locally, on Preview,
  and on the production custom domain with no browser CSP, console, chunk, or
  page errors. Cloudflare's automatically injected Web Analytics script is
  narrowly allowlisted at its exact beacon path and versioned subpath; beacon
  reporting remains same-origin under `connect-src 'self'`.
- The home page and all eight category routes render from a typed build snapshot
  and revalidate `/products.json` in the browser, preserving live catalog
  updates without a frontend rebuild.
- Product search, product hashes, product/plan query parameters, plan and
  checkout modals, stock/contact states, Telegram deep links, and the website
  payment path are migrated. All 36 products and 80 plan/header entries were
  checked against the current catalog without mismatches.
- All 49 FAQ entries, 30 review images, and six ExpressVPN location records use
  static fallbacks plus live `/data/*` revalidation. FAQ rich text is rendered
  through an allowlist parser; unsafe tags, event handlers, and script URLs are
  not inserted into the page.
- The FAQ runtime crash caused by rich-text `<br>` elements is fixed in
  Production deployment `c7f279ed-c605-44aa-8662-95ec45d29632` from runtime
  commit `ea9484c`, which is pushed to `origin/main`. The allowlist renderer now
  creates void elements without a `children` argument, avoiding React error
  #137. The production-parity browser guard opens all 49 FAQ entries, collapses
  them, and reopens three on both 390px mobile and 1280px desktop with no Next
  error boundary, runtime/console/network error, hydration marker, or
  horizontal overflow; the same complete matrix passes on
  `pstorebynamso.com` after deployment propagation.
- The payment page preserves KBZPay, WavePay, and AyaPay QR assets,
  instructions, cache exceptions, and product/plan query forwarding. The order
  page preserves the exact 11-field multipart contract, product/plan prefill,
  conditional customer email/password rules, native screenshot upload, 8MB
  validation, 180-second timeout, stock warning, and distinct API result
  states. Local Wrangler/browser tests passed 62 payment/order assertions plus
  the accelerated timeout check with no CSP or page errors.
- Preview has separate encrypted `BOT_TOKEN` and `ADMIN_CHAT_ID` bindings. The
  sale token was sourced without displaying it from the local
  `premium_store_bot` project, validated through Telegram `getMe` as
  `@PSNamso_bot`, and stored only in the Preview environment. A clearly labelled
  no-payment multipart QA order returned `ok: true` and order ID
  `WMSDASZ9H0SJ`, confirming Telegram `sendPhoto` delivery through the unchanged
  Function. Optional panel mirroring is not configured in Preview, so no panel
  delivery is expected or claimed.
- Motion now drives real hero and section reveals, staggered catalog, product,
  review, FAQ, and guide entrances, short route transitions, FAQ expansion,
  catalog modals, and the review lightbox. Server-rendered content stays visible
  before hydration, and reduced-motion users bypass nonessential reveals.
  Browser instrumentation passed 19 motion checks; a real Xiaomi 2201117TG /
  Android 13 Chrome run measured 16.7ms median and 16.8ms p95 frame intervals
  during scroll-triggered reveals, with no frames over 34ms or long tasks over
  50ms in the clean sample.
- All 15 canonical routes preserve or improve their title, description,
  canonical URL, and social metadata through the Metadata API. The home export
  preserves the Organization/WebSite JSON-LD graph. The synchronized root,
  `public`, and exported redirect files contain 17 valid permanent rules, and
  every legacy content `.html` URL resolves directly to its trailing-slash
  canonical route with query parameters preserved. The synchronized sitemap
  lists all 15 canonical routes, and raw exported HTML was checked for useful
  route content. The custom `404.html` remains a 404 document with `noindex`.
- Final local QA passed lint, TypeScript, static production build, and
  `npm audit` with zero vulnerabilities. Browser QA covered 15 routes at 360,
  390, 430, 768, and 1024px (225 responsive assertions), both themes on every
  route, keyboard/modal focus, reduced motion, live-data replacement, slow and
  failed requests, internal links, and mobile input behavior. A throttled
  390px run measured LCP 1.392s and CLS 0.0033. Android Chrome, iPhone Safari,
  and narrow WebView emulations passed; real Android Chrome and physical iPhone
  Safari now also pass. The embedded-WebView acceptance gate is closed by owner
  decision because the deliverable is a responsive SaaS website rather than an
  app wrapper.
- P8 caught and fixed two issues: small-screen header controls now retain the
  required 44px target, and payment QR responses now contain only
  `public, max-age=0, must-revalidate` rather than a conflicting merged
  immutable directive. Generic images retain their 30-day immutable policy.
- Returning-browser delivery is also corrected for Next.js build assets:
  Next 16 can reuse CSS/JavaScript chunk filenames across exports, so
  `/_next/static/*` now uses `public, max-age=0, must-revalidate` instead of an
  immutable one-year rule. This resolves the stale stylesheet that made the
  updated search modal and ChatGPT logo appear missing in previously used
  browsers without changing Kimi's approved design.
- A production-parity correction restored the legacy header hierarchy,
  typography, background treatment, home hero/catalog position, ninth
  ExpressVPN guide card, two-column image-first mobile catalog, compact
  payment/order layout, square review grid, official-channel layout, and the
  detailed ExpressVPN protocol/connection panels without removing the Next.js,
  Motion, CSP, responsive, or theme behavior.
- ⚠️ 2026-08-18: the SCREENSHOTS behind every approval set below were deleted
  (632 captures, 245 MB, commit `1ff2b68`) — the acceptance they record still
  stands, and the `report.json` summaries and written reports remain. The images
  are recoverable from THIS REPO'S GIT HISTORY only — `git show 1ff2b68^:<path>`.
  They were removed with `git rm`, which deletes from disk, so they are NOT in the
  Trash bundle from that day (an earlier version of this note wrongly said they
  were; an independent review caught it).
  Every `qa/*.mjs` check still runs and regenerates what it needs.
- The production-versus-Next approval set in `qa/comparisons/2026-08-03/` now
  covers home, Creative Apps, payment, order, reviews, ExpressVPN guide, and both
  terms pages at 390px, plus primary-flow bounds at 360px and 430px. Key section
  positions are within 16px of legacy at the tested widths, migrated category
  grids remain two columns, and migrated pages have no horizontal overflow.
- The pre-cutover P9 comparison confirmed that the legacy production site and
  the local Next.js
  export expose the same 8 categories, 36 products, 3 payment platforms, 11
  multipart field names, and 30 review images. The fetched production catalog
  exactly matched the local build snapshot during the check.
- Wrangler owner authentication is complete. The final hash-CSP build is
  deployed to the existing project's non-production `next-preview` alias at
  `https://next-preview.pstorebynamso.pages.dev`, deployment
  `ad0964b4-7aa3-4448-a8e1-37e53adbb2ef`. All 15 canonical routes, all 17
  redirects, and sampled data/assets return the expected responses;
  deployed-browser checks show no preview console/CSP errors
  or overflow and confirm hydration, Motion modal behavior, theme switching,
  plan selection, FAQ interaction, and a visible 150x150-source ChatGPT logo.
  The order Function also passed a labelled synthetic Telegram delivery test
  after hash hardening (order `WMSDDAZH528O`).
- Cloudflare's project API confirmed environment separation: Production has
  plaintext `ADMIN_CHAT_ID` and encrypted `BOT_TOKEN`; Preview has separate
  encrypted `ADMIN_CHAT_ID` and `BOT_TOKEN` bindings. The chat ID and locally
  sourced sale token were transferred through restricted temporary files and
  removed without displaying either value. Production secrets were not read,
  replaced, or modified.
- The existing project-wide Git build settings are still the legacy `exit 0`
  command with blank root/output. They were not changed because they also affect
  future production builds. The preview instead used root `pstorebynamso`,
  `npm run build`, and direct upload of `out` to `next-preview`.
- After explicit owner approval, the verified Next.js export replaced the
  legacy production deployment. Current Production is
  `1193282b-51a8-45de-938c-aeb20f800db5` and `pstorebynamso.com` passes all 15
  canonical routes, the custom 404, sampled JSON/image/Next assets, exact CSP
  hash matching, hydration, theme/FAQ/search/modal interactions, keyboard
  focus, reduced motion, and a zero-error browser-console check. The previous
  legacy deployment `93b28c45-798c-42e8-9e42-e21d605c9b45` remains the recorded
  rollback point.
- This work did not change Cloudflare build settings, domains, Functions,
  order behavior, or Production variables. No commit or push was performed.
- Nonce-based CSP is not implemented. Next.js nonces require a per-request
  dynamic response and therefore conflict with the current static-export
  architecture. The implemented build-time hash strategy preserves static
  export; a nonce migration would require a separately approved architecture
  change.
- Kimi's mobile performance and cross-browser pass (2026-08-04,
  owner-requested) found the real cause of "blur works on iOS Safari but not
  Android Chrome": the source wrote the standard `backdrop-filter` before its
  `-webkit-` twin, and the Tailwind 4 / Lightning CSS minifier dropped the
  standard declaration, so the deployed CSS carried only
  `-webkit-backdrop-filter` — which Chrome ignores entirely. All six blur
  pairs now put the prefixed line first, and the minified export contains
  both declarations again. The modal overlay also gained an 80%-opacity
  fallback inside the existing `@supports not (backdrop-filter)` block for
  older/GPU-blocklisted Android Chrome and Samsung Internet, while the dialog
  panel stays opaque. `touch-action: manipulation` was extended to FAQ
  questions, review cards, checkout options, platform buttons, the order file
  picker, and back controls, and the Google Fonts stylesheet moved from a
  chained CSS `@import` to a parallel head `<link>` so text paint no longer
  waits for the full app CSS. Lint, typecheck, build, CSP, Zoom contract, and
  the QA browser checks pass (`qa/kimi-overlay-touch-check.mjs`): Chrome now
  computes `backdrop-filter: blur(10px)` on the dialog backdrop, body scroll
  lock/restore is exact, and there are zero console errors. Deployed to
  Production on the owner's instruction (`711e7d92`, branch main); rollback
  point `b341d690`. The three `npm audit` findings are pre-existing `undici`
  advisories inside the `wrangler` dev-only preview toolchain; package
  updates were out of scope for this pass.
- Follow-up the same day: the owner reported Android Chrome collapsing the
  on-screen keyboard on every search keystroke (iOS unaffected). Root cause:
  the centered phone search dialog sized to its content, so each keystroke
  shrank the result list, re-centered the panel, and moved the focused
  input — Android dismisses the IME when the focused editable shifts
  mid-typing. The phone dialog now keeps a constant 84dvh flex height with
  the results scrolling inside (`qa/kimi-search-typing-check.mjs` proves the
  panel/input geometry is pixel-identical across keystrokes). Lint,
  typecheck, build, and CSP pass; deployed to Production as `b9c4adfc`;
  rollback chain `711e7d92` → `b341d690`. Confirmed on the owner's physical
  Samsung SM-S948B (Android 16) over adb: in production Chrome 150 the soft
  keyboard stayed open through a full "netflix" search and the plan-dialog
  backdrop computed `blur(10px)` with a visibly blurred page behind it, and
  Samsung Internet 30 passed the same search-typing and plan-dialog checks
  (`qa/kimi-device-check.mjs`, `qa/kimi-device-plan-check.mjs`,
  `qa/shots/device-check/`). (⚠️ those captures were deleted 2026-08-18 in `1ff2b68`; recover with `git show 1ff2b68^:<path>`)
- Same-day follow-ups (owner phone testing): (1) the search input lost focus
  on every keystroke — the dialog open-effect in
  `src/components/common/Modal.tsx` depended on the `onClose` prop, and
  `ProductSearch` passes an inline handler whose identity changes per render,
  so each keystroke tore the effect down (cleanup returned focus to the
  header button, collapsing the keyboard) and re-ran it (refocusing the
  input). The effect now reads the latest handler through `onCloseRef` and is
  bound to the open state only; `qa/kimi-search-focus-check.mjs` proves
  focus, node identity, and cursor position stay stable across a full typed
  sentence. (2) A lone phone search result rendered as one giant
  vertically-centred card — the constant-height results grid stretched a
  single row via its `align-content` default; `align-content: start` pins
  rows to the top at natural height. Both verified headless and on the live
  site, deployed to Production as `a821e236` then `677b1794`; rollback chain
  `a821e236` → `b9c4adfc`. The owner confirmed on-device that everything is
  fine. Committed and pushed to `origin/main` on the owner's instruction.
- REGRESSION INCIDENT (2026-08-04, later the same day): that `git push`
  triggered the Cloudflare Pages Git integration, whose build settings do NOT
  run the Next.js build — it published the legacy repo-root site as
  production deployment `f2c96254`. The owner's subsequent bug reports
  ("PREMIUM …" ellipsis brand, blue tap-highlight bar on button press, large
  highlight behind pressed buttons) were all legacy-site symptoms, not
  Next.js bugs. Production was restored by re-running the direct-upload
  deploy of `out/` (`9e26a2a3`); both `pstorebynamso.com` and
  `pstorebynamso.pages.dev` serve the Next.js export again and the wordmark
  fits at 360/384/412px. OPEN RISK: an ordinary future push to `main` can flip
  production back to the legacy site until the Pages build settings are fixed
  in the dashboard (build command `npm run build`, output `out`) or automatic
  deployments are disabled. The FAQ rollout used Cloudflare's build-skip commit
  prefix (recorded as idle deployment `8c647e33`) and then direct-uploaded the
  verified export as `c7f279ed`; future pushes require the same guarded pattern
  until the project setting is corrected.
- RISK CLOSED (2026-08-07): the regression recurred during 2026-08-05..07 —
  the admin panel commits to `main` on every FAQ edit and stock sync, and
  seven `panel: faq edit` pushes each republished the legacy root site over
  the Next.js production (owner-visible symptom: no brand letterhead or
  product icon in the View Plans dialog). Two fixes, both live: (1) the panel
  (pstore-adminpanel `ac3e02a`) now prefixes every GitHub commit it makes
  with `[CF-Pages-Skip]`, so panel activity can never trigger the Pages
  build; (2) the owner corrected the Pages build configuration in the
  dashboard (framework preset None, build command `npm run build`, output
  `out`, root directory blank), so an ordinary git build now publishes the
  Next.js export instead of the legacy root. This commit is itself the first
  push under the corrected settings and doubles as its verification.
- Kimi's owner-approved final polish (2026-08-03) added a
  four-token glass system applied selectively to the sticky header, the
  Telegram wallet CTA panel, the order-summary info panel, and modal chrome,
  plus two-tier card depth, opaque `@supports` fallbacks, and a 440ms
  section reveal. The targeted follow-up also centers the desktop search modal,
  improves purchase-guide spacing, adds the order-page back controls, and
  normalizes the requested product-logo tiles. All final checks pass; this
  design was later captured with the full migration/polish tree in `243d49a`.
  See
  `qa/overnight/2026-08-03/KIMI_UI_UX_REPORT.md` and
  `KIMI_SMALL_POLISH_REPORT.md`.
- Kimi's final mobile pass reduces phone product-logo tiles to 48px, centers
  catalog plan/checkout dialogs, and places the home footer's Shop and Official
  columns side-by-side below the full-width brand block. Fresh lint, typecheck,
  build, audit, local/deployed hydration, focus, FAQ, modal, reduced-motion,
  overflow, and console checks pass. A QA-only selector correction makes the
  mobile verification script target the real Telegram CTA and a category FAQ.
  See `qa/overnight/2026-08-03/KIMI_MOBILE_FINAL_REPORT.md`.
- A wired physical iPhone running iOS 26.2 was paired with Safari Web Inspector
  after the Kimi pass. At the device's 393×694 CSS-pixel viewport / DPR 3,
  `/music-apps/` rendered 48×48 icon tiles with no horizontal overflow; a real
  React `View Plans` click opened the Motion dialog, centered within 2px and
  locked body scrolling. On `/`, the brand spans the full footer grid while
  Shop and Official Channels share equal 170.5px columns on one row. A clean
  device reload produced zero CSP, hydration, or runtime console-error matches.
- The owner approved `PROJECT_REQUIREMENTS.md` and
  `qa/overnight/2026-08-03/REPORT.md` with its screenshots on 2026-08-03, then
  separately authorized production replacement after CSP hardening. The
  production Pages build settings were not changed. Android and physical iPhone
  browser acceptance both pass.
- Kimi's UX/performance polish (2026-08-03, owner-requested) added the
  Official Channels 2/3-column icon grid, start-aligned purchase steps,
  single-CTA bot checkout, two-column trust grid, data-driven View Plans
  product icons, and a centered mobile search dialog, and fixed three
  performance root causes: the route-level keyed remount that re-mounted
  every image on navigation, the reveal hook hiding SSR-painted above-fold
  content, and the unconditional catalog state replacement after background
  fetch. Touch feedback uses the independent `scale` property and
  `hover: none` guards; catalog/review images carry `?v=` version URLs.
  With the owner's explicit instruction the validated export was deployed to
  Production (`0f34fdb1-e06d-412c-9c71-cbcee34bfd55`, branch main);
  `1193282b-51a8-45de-938c-aeb20f800db5` is the rollback point. All 15
  routes and deployed-browser interaction guards pass on pstorebynamso.com
  with zero console errors. Production secrets, variables, domains, and
  build settings were untouched; no commit or push. See
  `qa/overnight/2026-08-03/KIMI_UX_PERF_POLISH_REPORT.md`.
- Kimi follow-up fixes on owner feedback (2026-08-03), each validated and
  deployed to Production on the owner's instruction:
  `4648c406` (y-only scroll reveals, eager home/catalog images, search-dialog
  centering hardening, mobile background-attachment scroll),
  `0e50330a` (scrolled-modal bugfix: Modal portals to document.body so
  Safari's backdrop-filter containing block no longer detaches the dialog,
  iOS-safe fixed-body scroll lock with exact scroll restore, and removal of
  the html/body `overflow-x: clip` that broke the sticky header in Chrome),
  and `b341d690` (Premium Store brand letterhead row inside the View Plans
  dialog so customer plan screenshots carry store identity). Current
  Production is `b341d690`, which also serves the Zoom catalog contract from
  `44f9ee4` (verified in the live `/products.json`). Rollback chain:
  `0e50330a` → `4648c406` → `0f34fdb1-e06d-412c-9c71-cbcee34bfd55`.
- The full Next.js migration, owner-approved UI/UX polish series, QA scripts,
  reports, and synchronized public assets are captured in local commit
  `243d49a`. That commit is not pushed; no remote history was changed during
  the final handoff pass.
- The Zoom catalog uses the approved ordered 1/3/6/12-month plans, prices,
  public IDs, and exclusive badges in both catalog copies. The catalog change
  is committed/pushed at `44f9ee4`; initial Zoom rollout deployment
  `7f039f71-961d-4983-98df-ac4cb9a43416` was superseded by current Production
  `b341d690`, which retains the same verified catalog contract.
- The dedicated contract check, lint, typecheck, static build, CSP verification,
  dependency audit, live catalog checks, and payment/order/Telegram endpoint
  checks pass. The bot-owned production SQLite migration and required Bot/Admin
  restarts are complete. The owner subsequently confirmed the production UI is
  fine; the earlier browser-controller limitation is closed by that owner
  acceptance together with the recorded real View Plans interaction tests,
  live HTTP checks, and bot runtime mapping checks.

## Documentation Reading Rules

- Always read `AI_CONTEXT.md` and the relevant part of `TODO.md`.
- Read `NEXTJS_MIGRATION_PLAN.md` only for architecture or migration work.
- Read `PROJECT_REQUIREMENTS.md` only for product behavior, UI/UX, mobile,
  security, SEO, or acceptance criteria related to the current task.
- Read `CHANGELOG.md` only when recording or reviewing completed changes.
- Do not reread every document for a small isolated task.

## Work Rules

- Migrate in phases and keep the current site available until feature parity.
- Do not change the order API during the frontend migration.
- Do not rename or remove existing assets until all references are migrated.
- Keep client components limited to interactive UI.
- Respect `prefers-reduced-motion` and mobile performance.
- Test each completed phase before starting the next dependent phase.
- Update `TODO.md` when work starts or finishes.
- Update `CHANGELOG.md` only for completed user-visible changes.
- Update the Current Status section in this file at the end of each work session.
- Replace outdated status text instead of appending a long session history.

## Detailed Documents

- `NEXTJS_MIGRATION_PLAN.md`: Architecture and phased migration plan.
- `PROJECT_REQUIREMENTS.md`: Complete requirements and acceptance criteria.
- `TODO.md`: Ordered implementation tasks and known UI/UX requests.
- `CHANGELOG.md`: Completed user-visible changes.
