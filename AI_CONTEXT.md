# PStore AI Context

Read this file first. It is the short source of truth for AI-assisted work.
Read the larger documents only when the current task requires their details.

## Project Goal

Migrate the existing static PStore website to a mobile-first Next.js application
while preserving all content, catalog data, checkout behavior, Cloudflare
Functions, URLs, SEO metadata, and production integrations.

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
