# KIMI UX + Performance Polish Report — 2026-08-03

> ⚠️ **THE SCREENSHOTS THIS REPORT REFERENCES WERE DELETED ON 2026-08-18**
> (632 captures, 245 MB, storefront commit `1ff2b68`). The findings and the
> acceptance recorded below still stand — only the image files are gone. Recover
> any one of them with `git show 1ff2b68^:<path>` from the storefront repo. All 22
> `qa/*.mjs` checks still run; the capture-producing ones regenerate their own
> screenshots (several, like `content-source-check.mjs`, produce no images at all).

Scope: UI/UX improvements (6 items) + Next.js performance/root-cause fixes + touch interaction + image caching, on the existing Next.js preview. No redesign; owner-approved baseline preserved.

## Changed files

| File | Change |
|---|---|
| `src/app/page.tsx` | Removed the secondary "Payment Methods" button from the New Bot Checkout section; only the "Open Telegram Bot" primary CTA remains (payment is handled inside the bot). |
| `src/components/content/OfficialChannels.tsx` | Added Telegram/Facebook icons to channel cards; moved the misplaced bottom-of-file `Link` import to the top (no behavior change). |
| `src/components/common/Icon.tsx` | Added a `facebook` glyph (lucide-style stroke path) for the channel cards. |
| `src/components/common/Modal.tsx` | New optional `icon?: ReactNode` prop rendered inside a `.modal-heading__title` flex wrapper next to the dialog title. Focus trap, Escape, backdrop close, scroll lock untouched. |
| `src/components/catalog/PlanModal.tsx` | View Plans dialog now shows the product's own logo tile next to the plan name, driven by `product.image` + `product.imageClass` — fully data-driven, no hard-coded conditions; white-plate mapping (ChatGPT etc.) carries over. `alt=""` (decorative; title carries the name). |
| `src/components/common/RouteTransition.tsx` | **Perf root cause #1.** Removed `AnimatePresence mode="popLayout"` and the `key={pathname}` wrapper. The keyed remount was unmounting the entire page subtree on every client-side navigation — every image remounted (flicker / "refresh-like" feel) and every reveal animation replayed. The wrapper now persists; only incoming page content mounts, once. |
| `src/hooks/useRevealMotion.ts` | **Perf root cause #2.** Elements already in the viewport at hydration were painted visible by the SSR HTML, then hidden and re-animated when the observer fired — a visible flash on load/navigation. Entries firing within 180 ms of mount now skip the hide-and-animate; only below-the-fold entries animate, still once-only, still reduced-motion aware. |
| `src/hooks/useCatalog.ts` | **Perf root cause #3.** The background `products.json` refresh used to `setCatalog` unconditionally, re-rendering every card after load. If the fetched data is byte-identical to the current data the previous reference is kept, so nothing re-renders. |
| `src/components/catalog/HomeCatalog.tsx` | `counts` memoized with `useMemo` (was recomputed every render). |
| `src/components/catalog/CategoryCatalog.tsx` | `products` filter memoized with `useMemo`. |
| `src/services/catalog.ts` | `publicAssetPath` now appends `?v=<ASSET_VERSION>` (currently `2`) to catalog/review image URLs. Hosting marks `/images/*` immutable; bumping the version invalidates changed images while unchanged images stay cached and are never re-requested during scrolling. Paths themselves are unchanged. |
| `src/app/globals.css` | One dated section appended ("UI/UX and interaction polish pass, fourth pass"): Official Channels 2-col mobile / 3-col ≥720px grid with consistent card min-height, padding, icon size; How-to-Purchase steps start-aligned with tighter rhythm; trust cards fixed 2-col at all widths; plan-modal icon tile styles; mobile search dialog centered (`:has(.search-panel)`, 84vh→84dvh cap, results keep internal scroll so the close button never scrolls away); `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation` on controls; `:active` scale feedback via the independent `scale` property (framer-motion's inline `transform: none` was silently beating stylesheet `:active` transforms); `@media (hover: none)` disables transform hovers so tapped cards no longer stick mid-lift. |

## Root causes fixed (performance)

1. Route-level keyed remount (`RouteTransition`) — image remount/flicker + animation replay on every navigation. Removed.
2. Reveal hook hiding SSR-painted above-fold content — flash/"refresh" on load. Guarded.
3. Unconditional catalog state replacement after background fetch — full grid re-render post-load. Skipped when data is identical.
4. Sticky hover transforms on touch + missing active feedback — fixed with `hover: none` media guard and `scale` property feedback.
5. Unversioned image URLs under immutable hosting cache — version query added.

Not changed (by design): `next.config.ts` (`images.unoptimized` is required for the static export), `_headers`/CSP, no new dependencies, no smooth-scroll libraries (native scrolling kept), image `priority` usage unchanged (2 category cards + header logo only), all image `width`/`height` attributes already present (no CLS).

## Validation (all run locally, preview `http://localhost:8796/`)

- `npm run lint` — clean (fixed one `react-hooks/purity` error during the pass).
- `npm run typecheck` — clean.
- `npm run build` — 17 static pages generated, CSP hashes regenerated.
- `npm audit` — 0 vulnerabilities.
- `git diff --check` — clean.
- All 15 routes + `/products.json` + `/images/chatgpt.svg?v=2` → HTTP 200.
- Screenshot sweep (`qa/kimi-shots.mjs`): `/`, `/ai-apps/`, `/reviews/` at 320/360/390/430/1280 light + 390/430 dark — 0 horizontal overflow, 0 console errors on every capture.
- Plan modal geometry (`qa/kimi-plan-modal-shot.mjs`): centered at 390×844 (top 288 / bottom 284) and 1280×800 (269/269), body locked, Escape closes, scroll restored, 0 errors. Product icon tile visible next to the plan title.
- Mobile search dialog (`qa/kimi-modal-shot.mjs`): centered at 320×700 (top 187 / bottom 183) and 390×844 (306/302), input auto-focused, Escape closes, close button visible and unobstructed, 0 errors.
- Regression guards (`qa/kimi-mobile-verify.mjs`): Telegram button accessible name OK, theme toggle OK, FAQ OK, search + plan focus traps OK, file-input DOM order OK, `.order-file-input:focus-visible + .order-file` ring visible (2px `rgba(77,159,255,0.72)`), reduced-motion clean, no console errors, CSP still blocks inline scripts.
- `qa/kimi-functional.mjs` reported `themeToggle`/`fileFocusRing` FAILs — inspected and confirmed stale-script artifacts, not regressions: the script clicks the theme button once from a fresh `system`-mode profile (system→light keeps resolved theme `light`, so its before===after check fails) and uses programmatic `.focus()` (never matches `:focus-visible`; its `:has()` also looks for the input inside the label, while the markup correctly has it as a preceding sibling). The keyboard-driven verifier passes both.

## Screenshots

- `qa/shots/2026-08-03/ux-after/` — home/ai-apps/reviews at 320/360/390/430/1280 (light)
- `qa/shots/2026-08-03/ux-after-dark/` — home/ai-apps at 390/430 (dark)
- `qa/shots/2026-08-03/plan-modal-icon/` — plan modal with product icon at 390×844, 1280×800
- `qa/shots/2026-08-03/search-modal-mobile/` — centered mobile search at 320×700, 390×844

## Notes / limitations

- Physical-device testing (iPhone Safari, Android Chrome) was **not** performed; all results are from headless Chrome at emulated widths.
- The two-column trust grid applies on desktop too, per the request ("2-column grid on both mobile and desktop").
- `qa/kimi-functional.mjs` is stale relative to the current markup (see above); left untouched.

## Confirmations

Nothing was committed, pushed, or merged. No changes to `functions/`, order/payment logic, Telegram integration, catalog data/prices, routes, `package.json`/lockfile, `next.config.ts`, `_headers`, `_redirects`, CSP, or Cloudflare settings.

## Production deployment (owner-authorized, 2026-08-03)

At the owner's explicit request ("deploy website, I will check in pstorebynamso.com"), the validated `out/` export was deployed with `wrangler pages deploy out --project-name=pstorebynamso --branch=main`:

- New Production deployment: `0f34fdb1-e06d-412c-9c71-cbcee34bfd55` (`https://0f34fdb1.pstorebynamso.pages.dev`)
- Rollback point (previous Production): `1193282b-51a8-45de-938c-aeb20f800db5`
- Post-deploy checks on `https://pstorebynamso.com`: all 15 canonical routes + `/products.json` + `/images/chatgpt.svg?v=2` return 200; new code markers present in served HTML (facebook icon path, `?v=2` asset URLs); deployed-browser run of `qa/kimi-mobile-verify.mjs` passes every guard (theme toggle, FAQ, search/plan focus trap + Escape, file-input order + focus ring, reduced-motion clean) with zero console errors and CSP still blocking inline scripts.
- Production secrets, variables, domains, and build settings were not read, modified, or replaced.

## Follow-up fixes + redeploy (owner feedback, 2026-08-03)

Owner reported (in Burmese): search dialog still pinned near the top on PC and phone, and home images still "refresh" while scrolling.

Diagnosis: fresh-browser geometry on production was already centered (282/282 desktop, 306/302 mobile) — the owner was seeing pre-fix CSS; each build renames the CSS chunk (`3nxd_hq3lldo8` → `3ih201kox4-9p` → `008hlfbul4gxj`), so a normal reload picks up the fix. The scroll "refresh" feel had two remaining code causes, now fixed:

- `src/hooks/useRevealMotion.ts` — reveal no longer touches opacity (the hide-and-fade was the "refresh"); entrance is a short transform-only settle (≤320ms, reduced-motion and mount guards kept).
- `CategoryCard.tsx`, `ProductCard.tsx`, `page.tsx` — category images, product logos, and home review-strip images now `loading="eager"` (small files; stops lazy-load pop-in during scroll). The 30-image `/reviews/` grid stays lazy.
- `globals.css` (fifth pass) — `.search-panel { margin-block: auto }` at all widths (centers even without `:has()`); desktop dialog capped at `min(70vh,70dvh,620px)`; mobile results capped at `42dvh` so the dialog stays compact/centered with the close button always clear; `body { background-attachment: scroll }` ≤768px (kills full-viewport repaint stutter from the fixed background on mobile GPUs).

Validation: lint/typecheck/build/audit/diff-check clean; local + production modal geometry centered at 1280×800 (282/282), 390×844 (306/302), 320×700 (234/230); home full-scroll capture shows no hidden/stuck content; zero overflow, zero console errors; production routes all 200; deployed interaction guards pass.

Redeployed to Production: `4648c406` (`https://4648c406.pstorebynamso.pages.dev`). Rollback points: `0f34fdb1-e06d-412c-9c71-cbcee34bfd55`, then `1193282b-51a8-45de-938c-aeb20f800db5`. No commit/push; no Cloudflare settings, secrets, or backend changes.

## Scrolled-modal bugfix + redeploy (owner feedback #2, 2026-08-03)

Owner report (Burmese): search opened from the page top works, but opened while scrolled the dialog appears at the very top of the document (unusable); View Plans also fails to appear properly when scrolled; search must be openable from any scroll position.

Root causes found and fixed:

1. **Dialog rendered inside the sticky header** (`ProductSearch` → `Modal` inline in `.site-header`, which has `backdrop-filter`). In Safari a `backdrop-filter` ancestor becomes the containing block for fixed-position descendants, so the "fixed" backdrop/dialog was positioned against the header/document instead of the viewport. Fix: `Modal` now renders through `createPortal(..., document.body)` (`src/components/common/Modal.tsx`) — all dialogs (search, plans, checkout, review viewer, mobile nav) escape every ancestor containing-block effect.
2. **iOS scroll-lock jump**: locking scroll with `body { overflow: hidden }` snaps iOS Safari's layout viewport to the document top, so any dialog opened while scrolled showed at the top of the page. Fix: iOS-safe lock — body pinned with `position: fixed; top: -<scrollY>px` while a dialog is open, scroll restored instantly on close (bypassing `scroll-behavior: smooth`). Measured: opened at scrollY 1190, restored to exactly 1190 after close.
3. **Sticky header broken in Chrome**: `overflow-x: clip` on both `html` and `body` made a clipped ancestor, so the sticky header scrolled away in Chrome and the search/bot controls were unreachable once scrolled. Fix: removed both clips (`src/app/globals.css`); overflow containment is by layout (re-verified zero horizontal overflow at 320/360/390/430/1280 on /, /ai-apps/, /order/, /payment/, /reviews/). The header now stays pinned at every scroll position, and remains visible (dimmed, behind the dialog) when a dialog opens from a scrolled position.

Verification: `qa/kimi-scroll-modal-check.mjs` (new) — search + View Plans opened at scrollY 0 and scrolled (1190 mobile / 890 desktop): backdrop viewport-anchored, dialog centered in view, body pinned, scroll restored exactly on close, Escape/close working; sticky header top: 0 while scrolled. Full guard suite (`qa/kimi-mobile-verify.mjs`) passes locally and on production; zero console errors; zero overflow; lint/typecheck/build/audit/diff-check clean.

Redeployed to Production: `0e50330a` (`https://0e50330a.pstorebynamso.pages.dev`). Rollback: `4648c406`, then `0f34fdb1-e06d-412c-9c71-cbcee34bfd55`. No commit/push; no Cloudflare settings, secrets, Functions, or data changes. Physical-device (iPhone Safari) verification was not possible in this session — the iOS fixes use the standard portal + fixed-body technique; geometry verified in emulated browsers.

## View Plans brand strip + redeploy (owner request #3, 2026-08-03)

Owner request: plan-dialog screenshots shared by customers show only the product/plan name (e.g. "Zoom Pro") with no store identity — the Premium Store brand should appear in the dialog.

Change: `Modal` gained an optional `banner` slot rendered above the dialog heading; `PlanModal` passes a compact letterhead row (the same `/images/brand-logo.png` + PREMIUM STORE wordmark as the site header, with a hairline divider). Scoped to View Plans only; checkout and other dialogs unchanged. CSS: `.plan-modal-brand` rules appended (sixth pass). Product name, plans, prices, and dialog behavior untouched.

Validation: lint/typecheck/build/audit/diff-check clean; local + production plan-modal geometry centered (390×844, panel height 325 with the strip); screenshot confirms the brand row above the plan title in light theme.

Redeployed to Production: `b341d690` (`https://b341d690.pstorebynamso.pages.dev`). Rollback: `0e50330a`, then `4648c406`. No commit/push; no Cloudflare settings, secrets, Functions, or data changes.
