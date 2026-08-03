# PStore TODO

## Status

Current stage: P0 technical review and owner approval, production-parity
restoration for P2-P5, and the P5 payment/order implementation and Preview
integration checks are complete. P3-P7 and the P8 QA matrix are complete.
Real Android Chrome, mid-range Android Motion, and physical iPhone Safari checks
pass. The owner confirmed that an embedded WebView/app wrapper is not required
for this SaaS website. The build-time hash CSP and production cutover are now
complete. Preview deployment `ad0964b4-7aa3-4448-a8e1-37e53adbb2ef` is live on
`next-preview`, and Production deployment
`1193282b-51a8-45de-938c-aeb20f800db5` is live on `pstorebynamso.com`; routes,
static/data assets, hydration, CSP enforcement, and browser interactions pass.

The App Router scaffold and static export are verified and the approved Next.js
build is now Production. The legacy source remains in the repository and the
recorded pre-cutover Pages deployment remains the rollback point.

A local overnight visual-polish pass ran on 2026-08-03 (see the section below
and `qa/overnight/2026-08-03/REPORT.md`). Its fixes remain uncommitted but are
included in the current `next-preview` deployment.

A second liquid-glass polish pass ran on 2026-08-03 (see
`qa/overnight/2026-08-03/KIMI_UI_UX_REPORT.md`): selective glass on the
header, Telegram CTA panel, order-summary panel and modal chrome, two-tier
card depth, opaque `@supports` fallbacks, and a 440ms section reveal. Kimi's
final design and targeted follow-up are owner-approved.

A third UX/performance polish series ran on 2026-08-03 (see
`qa/overnight/2026-08-03/KIMI_UX_PERF_POLISH_REPORT.md`): responsive
Official Channels and trust grids, purchase-steps readability, data-driven
View Plans product icons, centered search dialogs, route-remount and
reveal-flash performance fixes, versioned image URLs, the scrolled-modal
bugfix (body portal + iOS-safe scroll lock + restored sticky header), and
the Premium Store brand strip in View Plans. Production deployments
`0f34fdb1` → `4648c406` → `0e50330a` → `b341d690` (current) were made with
the owner's instruction, and the full worktree — migration, polish passes,
QA scripts, and reports — is now committed.

## Zoom Package Contract (2026-08-04)

- [x] Publish the ordered `1 Month`, `3 Months`, `6 Months`, `1 Year` catalog
  with prices `29,000 Ks`, `85,000 Ks`, `169,000 Ks`, `329,000 Ks` in both
  root and public catalog copies.
- [x] Keep `⭐ Most Popular` exclusive to `6 Months` and `🔥 Best Value`
  exclusive to `1 Year`.
- [x] Verify public IDs, Telegram deep-link payloads, payment query values,
  catalog parity, lint, typecheck, production build, CSP, and dependency audit.
- [x] Owner rollout: commit/push the contract, deploy Production, apply the
  bot-owned SQLite migration with backup, restart Bot/Admin, and verify live
  catalog, payment/order/Telegram endpoints, and Bot public-ID mappings.
- [ ] Perform one literal production browser click smoke when browser control is
  available; its runtime failed to initialize in the rollout session. The live
  HTTP and runtime contract checks already pass.

## Completed Planning

- [x] Inspect the current HTML, CSS, JavaScript, JSON, and Cloudflare Functions.
- [x] Confirm the existing site uses Cloudflare Pages features.
- [x] Select Next.js instead of Vite.
- [x] Select TypeScript, Tailwind CSS, and Motion for React.
- [x] Define mobile-first and WebView-ready requirements.
- [x] Create the main migration plan.
- [x] Create the project requirements, task list, and changelog documents.

## P0: Before Coding

- [x] Complete a technical review of `PROJECT_REQUIREMENTS.md` against the
  migration plan and current repository.
- [x] Obtain owner approval for `PROJECT_REQUIREMENTS.md`. Approved by the
  owner on 2026-08-03 without authorizing production replacement.
- [x] Confirm targeted UI/UX improvements are included in the first migration.
- [x] Record the currently known UI/UX issues in this file.
- [x] Confirm the Cloudflare Pages production project build settings. The
  project-wide Git configuration remains legacy (`exit 0`, blank root/output),
  so the Next.js preview was built locally and uploaded directly without
  changing production-facing settings.
- [x] Confirm which mobile devices are available for final testing. A Xiaomi
  2201117TG running Android 13 passed real Chrome testing. The owner's iPhone
  running iOS 26.2 was paired over USB and passed Safari Web Inspector testing
  at a 393×694 CSS-pixel viewport / DPR 3; an embedded-WebView host is no longer
  required.

## Overnight Visual Polish Pass (2026-08-03)

Local-only pass over the Next.js preview source and its static export. Nothing
was deployed, committed or pushed; production was read-only. Full write-up:
`qa/overnight/2026-08-03/REPORT.md`.

- [x] Restore the bold heading weights Tailwind Preflight had reset to 400
  across the page titles, Terms sections, FAQ titles, trust cards and Official
  Channels heading.
- [x] Restore the VPN Terms list markers and clause spacing Preflight removed.
- [x] Fix Burmese line collisions on the home hero, category-card blurbs,
  Telegram-Bot callout and Terms section headings.
- [x] Recover the header wordmark size from 11.2px at 385px and above, and stop
  it running under the header controls at 320px.
- [x] Make the order screenshot picker read as a drop zone and give its clipped
  file input a visible keyboard focus ring.
- [x] Stop a leftover hidden `customer_mail` value blocking order submission
  with an unfocusable validation error.
- [x] Reach WCAG AA text contrast in both themes on every sampled surface,
  including the dark-mode primary button and the always-dark ExpressVPN panel.
- [x] Make the modal panel opaque so page content cannot bleed through titles.
- [x] Re-verify all migrated routes at 320, 360, 375, 384, 390, 400, 414, 430,
  480, 520, 640, 768, 1024 and 1280px in both themes with no horizontal
  overflow, clipped text or console errors, plus modal focus/scroll, reduced
  motion, and the order form's loading/error/success states.
- [x] Owner review of `qa/overnight/2026-08-03/REPORT.md` and its screenshots.
  Approved by the owner on 2026-08-03.

## Overnight Liquid-Glass Polish Pass (2026-08-03, Kimi)

Second local-only pass over the Next.js preview source and its static export,
focused on selective liquid-glass surfaces, card depth, and motion-band
conformance. Nothing was deployed, committed or pushed; production was
untouched. Full write-up: `qa/overnight/2026-08-03/KIMI_UI_UX_REPORT.md`.

- [x] Add a four-token glass set (`--glass-bg`, `--glass-line`, `--glass-hi`,
  `--glass-shadow`) per theme and apply glass selectively to the sticky
  header, the Telegram wallet CTA panel, the order-summary info panel, and
  modal chrome (border/highlight only; the panel stays opaque).
- [x] Give cards two-tier depth: inset top highlight plus ink-tinted soft
  shadows on anchor surfaces, highlight only on dense list rows.
- [x] Add an opaque `@supports` fallback for every translucent surface.
- [x] Bring the 480ms section reveal back inside the 250-450ms entrance band
  (now 440ms/16px); all other motion already met the guidelines.
- [x] Verify 43 route/width/theme combinations with no overflow or console
  errors, glass contrast at AA in both themes (min 5.13:1), zero
  reduced-motion stuck elements, and working plan/checkout modals and
  parameterized order summary.
- [x] Re-run lint, typecheck, build, `npm audit`, and `git diff --check`.
- [x] Owner review of `qa/overnight/2026-08-03/KIMI_UI_UX_REPORT.md`,
  `KIMI_SMALL_POLISH_REPORT.md`, and their screenshots. The owner approved
  Kimi's final design on 2026-08-03.

## Priority UI/UX Requests

- [x] Fix the untidy bottom content and footer layout on mobile.
- [x] Use consistent spacing, alignment, wrapping, and section separation at
  360px, 390px, and 430px widths.
- [x] Ensure no bottom text overlaps, clips, crowds nearby content, or sits too
  close to the screen edge.
- [x] Fix the header branding so the `STORE` text beside `PREMIUM` is always
  fully visible and never hidden by navigation controls.
- [x] Verify the full `PREMIUM STORE` brand at all required mobile widths,
  browser zoom levels, and both theme modes.
- [x] Improve the light-mode palette so backgrounds, cards, borders, text,
  accents, buttons, and shadows look intentional and color-matched.
- [x] Check light-mode contrast and visual hierarchy on every page.
- [x] Add smoother entrance, scroll reveal, card, modal, and page-transition
  animation using Motion for React.
- [x] Match the smooth timing, easing, reveal flow, and interaction quality of
  the reference website discussed with the owner while keeping PStore branding
  and mobile performance.
- [x] Keep animations smooth on mid-range mobile devices without delaying taps,
  navigation, payment, or order actions. A real Xiaomi 2201117TG Chrome run
  measured 16.7ms median / 16.8ms p95 frame intervals during reveal scrolling,
  with no frames over 34ms and no long tasks over 50ms in the clean sample.
- [x] Complete a general mobile UI/UX polish pass covering spacing, typography,
  hierarchy, card consistency, button placement, and touch usability.
- [x] Capture production-versus-Next comparison screenshots for every migrated
  content-page type at 390px, with home/category/payment/order bounds at 360px
  and 430px, in `qa/comparisons/2026-08-03/`.
- [x] Restore the live header hierarchy, typography, spacing, background
  treatment, home hero/catalog position, and ExpressVPN home card.
- [x] Restore two-column image-first category cards and compact payment/order
  layouts while retaining hydration, Motion, CSP, themes, and responsive fixes.

## P1: Next.js Foundation

- [x] Add Next.js, React, TypeScript, Tailwind CSS, and Motion.
- [x] Configure the Next.js App Router.
- [x] Configure static export to the `out` directory.
- [x] Enable trailing-slash routes and unoptimized static images.
- [x] Move runtime static files into `public` without losing paths.
- [x] Keep Cloudflare Pages Functions at the repository root.
- [x] Add local development and production build commands.
- [x] Verify a clean production build.
- [x] Verify Cloudflare Functions can run with the exported site locally.

## P2: Shared Mobile-First UI

- [x] Resolve static-export CSP compatibility. The initial `'unsafe-inline'`
  compatibility policy has been replaced in `out/_headers` by route-specific
  SHA-256 hashes for every executable Next.js inline bootstrap/Flight script;
  `script-src-attr 'none'` remains enforced and `'unsafe-eval'` is absent.
- [x] Implement build-time hash-based CSP hardening with a clean-export guard,
  exact post-build verification, Cloudflare Pages rule/line-limit checks, and a
  browser probe proving that an unapproved inline script is blocked.
- [x] Record nonce CSP as not implemented: request-specific Next.js nonces need
  dynamic rendering and are incompatible with the approved static export.
- [x] Create the root layout and global metadata.
- [x] Create the shared header, footer, navigation, and back controls.
- [x] Create light, dark, and system theme support.
- [x] Keep the complete `PREMIUM STORE` brand visible in the mobile header.
- [x] Refine mobile footer and bottom-section spacing and alignment.
- [x] Define a coherent light-mode color token set and verify shared UI
  consistency.
- [x] Create reusable buttons, loading states, errors, and modal components.
- [x] Add safe-area handling for mobile and in-app browsers.
- [x] Verify shared UI at 360px, 390px, 430px, 768px, and desktop widths.
- [x] Verify no horizontal overflow.
- [x] Prevent stale Next.js CSS/JavaScript after preview rebuilds by requiring
  `/_next/static/*` browser revalidation. Next 16 can reuse chunk filenames,
  so these assets are intentionally not marked immutable.

## P3: Home and Catalog

- [x] Create a typed catalog data model.
- [x] Add live loading from `/products.json`.
- [x] Migrate the home page.
- [x] Create reusable category and product cards.
- [x] Create the dynamic category route.
- [x] Statically generate all 8 category routes.
- [x] Migrate product plan selection.
- [x] Migrate product search.
- [x] Migrate plan and checkout modals.
- [x] Preserve product hashes.
- [x] Preserve product and plan query parameters.
- [x] Preserve Telegram deep links and contact links.
- [x] Verify all 36 current products and plans.

## P4: Content Pages

- [x] Migrate FAQ loading and accordion behavior.
- [x] Migrate the reviews page and lightbox.
- [x] Migrate the ExpressVPN location guide.
- [x] Migrate the store terms page.
- [x] Migrate the VPN terms page.
- [x] Create the not-found page.
- [x] Preserve all current Burmese and English content.

## P5: Payment and Order

- [x] Migrate the payment platform selector.
- [x] Preserve all QR images and payment instructions.
- [x] Preserve payment image cache rules.
- [x] Forward product and plan parameters to the order page.
- [x] Migrate the order summary.
- [x] Migrate the order form and client validation.
- [x] Preserve conditional email and password fields.
- [x] Preserve screenshot validation and native file upload.
- [x] Preserve the exact multipart form field names.
- [x] Verify success, error, timeout, and out-of-stock states locally with the
  API response intercepted; the real integration checks remain below.
- [x] Test `POST /api/order` successfully in a safe preview environment. The
  sale token was securely sourced from the local `premium_store_bot` project,
  validated as `@PSNamso_bot`, and stored only as an encrypted Preview secret.
  The labelled no-payment QA request returned order `WMSDASZ9H0SJ`.
- [x] Verify Telegram order delivery. Telegram `sendPhoto` returned `ok: true`
  through the deployed Function for the labelled Preview QA order.
- [x] Record optional panel mirroring status. Preview has no
  `PANEL_INGEST_URL`/`PANEL_INGEST_TOKEN`, so mirroring is intentionally not
  configured and no panel delivery is expected or claimed.

## P6: Animation

- [x] Review the agreed reference animation patterns before final motion design.
- [x] Add lightweight hero entrance animation.
- [x] Add section reveal animation.
- [x] Add staggered card animation.
- [x] Add button hover and press feedback.
- [x] Animate FAQ expansion.
- [x] Animate modals and the review lightbox.
- [x] Add short page transitions where they do not slow navigation.
- [x] Add reduced-motion behavior.
- [x] Verify animation performance on a mid-range Android device. Real Chrome
  testing on a Xiaomi 2201117TG passed with 16.8ms p95 frame intervals during
  scroll-triggered Motion reveals and no clean-sample long tasks.

## P7: SEO and Redirects

- [x] Preserve page titles and descriptions with the Next.js Metadata API.
- [x] Preserve canonical and social metadata.
- [x] Preserve structured data.
- [x] Add permanent redirects for every old content `.html` route; keep the
  generated `404.html` as an error document rather than redirecting it.
- [x] Update `sitemap.xml` to clean trailing-slash routes.
- [x] Verify generated HTML contains useful indexable content.

## P8: Quality Assurance

- [x] Run linting and TypeScript checks.
- [x] Run a clean production build.
- [x] Test Android Chrome on a real device. Chrome 150 on a Xiaomi 2201117TG /
  Android 13 passed hydration, theme switching, search and ChatGPT plan modals,
  visible ChatGPT logo loading, zero horizontal overflow, and zero console
  errors.
- [x] Test iPhone Safari on a real device. Wired Safari Web Inspector verified
  the deployed preview on iOS 26.2 at 393×694 / DPR 3: the 48×48 mobile icon,
  React/Motion View Plans hydration, centered dialog (2px center delta), body
  scroll lock, two-column footer, and zero horizontal overflow pass. A clean
  reload produced zero CSP, hydration, or runtime console-error matches.
- [x] Close the embedded Android WebView acceptance gate by owner decision. The
  deliverable is a responsive SaaS website; no WebView app/wrapper is required.
- [x] Test desktop Chromium (the Chrome-compatible local engine).
- [x] Test keyboard navigation and modal focus.
- [x] Test reduced-motion mode.
- [x] Test slow loading and API failure states.
- [x] Check mobile performance and layout shift under local 4G/4x CPU
  throttling; retain real-device acceptance separately.
- [x] Verify Cloudflare security and cache headers. QR cache rules now detach
  the generic immutable header before applying `max-age=0, must-revalidate`.
- [x] Verify live product and data updates without a frontend rebuild.

## P9: Deployment

- [x] Create a Cloudflare preview deployment from the `out` directory on branch
  `next-preview` (current deployment
  `ad0964b4-7aa3-4448-a8e1-37e53adbb2ef`).
- [x] Verify all Functions on the preview deployment. `/products.json`,
  `/data/*`, and `/api/order` pass with Preview-only encrypted `BOT_TOKEN` and
  `ADMIN_CHAT_ID` bindings.
- [x] Verify old URL redirects and direct route refreshes on the deployed
  preview. All 17 redirects and all 15 direct routes pass on Cloudflare Pages.
- [x] Complete a real end-to-end test order safely. A labelled synthetic
  no-payment order returned `ok: true` and Telegram order ID
  `WMSDASZ9H0SJ`; it was explicitly marked not to fulfil.
- [x] Compare the Next.js version against the current production site. Both
  expose the same 8 categories, 36 products, 3 payment platforms, 11 order
  fields, and 30 review images; the live production catalog exactly matches the
  build snapshot at the time of the check. Screenshot parity covers every
  migrated content-page type at 390px and the primary flows at 360px and 430px.
- [x] Obtain approval before replacing production. The owner explicitly
  approved replacement after CSP hardening on 2026-08-03.
- [x] Replace production only after the hardened Preview passed. Current
  Production is `1193282b-51a8-45de-938c-aeb20f800db5`; the custom domain passes
  route, asset, exact-hash CSP, hydration, interaction, and console checks.
- [x] Keep a rollback path to the last static HTML deployment. The legacy files
  and Pages Functions remain in the repository, and deployment
  `93b28c45-798c-42e8-9e42-e21d605c9b45` is the recorded pre-cutover rollback
  point.

## Future Work

- [x] Defer a PWA install experience until after parity and production
  performance are measured.
- [x] Keep the website WebView-ready; evaluate Android or iOS wrappers only as
  separate post-migration products.
- [x] Defer a Telegram Mini App until the responsive website and order flow are
  stable in Telegram's in-app browser.
- [x] Treat an admin panel as a separate authenticated project after the
  storefront migration.
- [x] Schedule visual-redesign discovery after functional parity, baseline QA,
  and owner approval of the migrated storefront.
