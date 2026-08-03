# KIMI Mobile Final Report — 2026-08-03

Restrained mobile UI/UX polish pass on the Next.js preview, on top of the
owner-approved Kimi baseline. No redesign, no desktop styling changes, no
information-architecture changes.

## Exact files changed

| File | Change |
| --- | --- |
| `src/app/globals.css` | Only file edited. One dated section appended at the end ("Mobile polish pass (2026-08-03, third Kimi pass)") with three `@media (max-width: 639px)` blocks — see below. |

New QA tooling (not site code):

- `qa/kimi-plan-modal-shot.mjs` — plan-modal capture/geometry/Escape checker.
- `qa/kimi-mobile-verify.mjs` — mobile regression-guard checker (theme toggle,
  Telegram accessible name, FAQ, search/plan dialog focus trap + Escape,
  file-input DOM order + focus ring, reduced-motion residue).

## Changes and why

1. **Mobile product icons 56px → 48px** (`max-width: 639px` only).
   The glass tile read oversized inside the compact two-column phone cards.
   The 48px tile keeps the tile's exact proportions: inner spacing ratio
   preserved (7px → 6px, both ~12.5%) and a proportional corner radius
   (15px → 13px). Per-logo optical padding overrides, the white-plate
   mapping, liquid-glass treatments, and image aspect ratios are untouched,
   so the CapCut-style visual consistency carries over. The tile is
   decorative — the full-width View Plans button remains the 44px+ touch
   target. Desktop and small tablets keep 56px.

2. **View Plans / checkout dialog centered on mobile.**
   Previously `.modal-backdrop` used `align-items: flex-end` below 640px
   (bottom sheet). Now `.modal-backdrop:has(.catalog-modal)` centers the
   panel on mobile, scoped to `.catalog-modal` so the search dialog, review
   viewer, and nav sheet keep their existing mobile behavior. `:has()` is
   supported by all evergreen mobile browsers (Safari 15.4+, Chrome 105+);
   older browsers gracefully keep the current sheet. `max-height` uses the
   `88vh` → `88dvh` fallback pattern so the panel clears Safari toolbars and
   the software keyboard; the backdrop's existing safe-area padding becomes
   the safe margin. Focus trap, focus restoration, Escape/backdrop close,
   body scroll locking, reduced-motion, and internal scrolling live in
   `Modal.tsx` and are unchanged. Measured: 390×844 top/bottom 293/289px
   (was 570/12 bottom-anchored); 320×700 216/212px.

3. **Mobile home footer two-column.**
   Brand block stays full width; Shop and Official Channels (four links
   each, so they balance) sit side-by-side underneath; the VPN/Shop Terms
   row stays compact below. All destinations, content, centered alignment,
   and 40px minimum link row heights preserved; desktop keeps the
   three-column layout.

4. **Full mobile audit.**
   15 routes × 6 widths (320, 360, 375, 390, 393, 430) × light/dark =
   180 captures. Zero horizontal overflow, zero browser-console errors
   everywhere. Spot-reviewed home, all catalog categories, order, payment,
   reviews, expressvpn-location-guide, and both terms pages in both themes:
   spacing, Burmese wrapping, tap targets, sticky header, and modal
   behavior are all sound. No further confirmed problems, so no further
   changes were made.

## Before/after screenshots

- Icons + pages before: `qa/shots/2026-08-03/mobile-before/` and
  `mobile-before-dark/` (320, 390px)
- Icons + pages after: `qa/shots/2026-08-03/mobile-after/` and
  `mobile-after-dark/` (320, 390px)
- Plan modal before (bottom sheet): `qa/shots/2026-08-03/plan-modal-before/`
- Plan modal after (centered): `qa/shots/2026-08-03/plan-modal-after/`
- Full audit matrix: `qa/shots/2026-08-03/audit-light/` and `audit-dark/`
  (15 routes × 6 widths each)

## Validation results

- `npm run lint` — clean.
- `npm run typecheck` — clean.
- `npm run build` — 17/17 static pages generated.
- `npm audit` — 0 vulnerabilities.
- `git diff --check` — clean.
- All 15 canonical routes + `/products.json` + `/images/chatgpt.svg`
  return HTTP 200 on the final preview.
- No hydration or browser-console errors across all 180 audit captures.
- No horizontal overflow at 320/360/375/390/393/430px in either theme.

Regression guards (verified by `qa/kimi-mobile-verify.mjs` at 390px):

- Mobile Telegram header link accessible name: "Open Telegram Bot" ✓
- Theme toggle switches and restores `data-theme` ✓
- FAQ disclosure expands (`aria-expanded=true`) ✓
- Search dialog: input autofocus, Tab trapped inside, Escape closes ✓
- Plan dialog: Tab trapped inside, Escape closes, body scroll lock
  released ✓
- `.order-file-input` immediately precedes its visible `.order-file`
  label ✓; keyboard `:focus-visible` shows the 2px
  `rgba(77,159,255,0.72)` outline on the label ✓
- Reduced-motion emulation: no hidden or transformed content ✓

## Issues found

- None blocking. Pre-existing capture artifact: lazy-loaded review images
  render blank in full-page headless captures (present identically in
  before captures; assets return HTTP 200; not a regression).

## Physical iPhone

No physical iPhone was connected to this machine during the pass
(checked via `devicectl` and USB system profiler). All results above are
from headless-Chrome responsive emulation at real device metrics; no
real-device pass is claimed. Safari/Web Inspector verification on the
owner's iPhone remains an external/physical-device follow-up.

### Post-Kimi physical-device acceptance

The owner subsequently paired a physical iPhone running iOS 26.2 over USB, and
Codex completed the external Safari Web Inspector follow-up against the deployed
`next-preview` build. At 393×694 CSS pixels / DPR 3:

- `/music-apps/` rendered the mobile product tile at exactly 48×48px with no
  horizontal overflow;
- dispatching the real `View Plans` control opened the hydrated React/Motion
  dialog, locked body scrolling, and placed the panel center within 2px of the
  visual viewport center;
- `/` kept the brand block full-width and placed Shop and Official Channels on
  the same row in equal 170.5px columns, without horizontal overflow; and
- a clean physical-device reload produced zero CSP, hydration, or runtime
  console-error matches.

This post-pass acceptance does not change Kimi's original statement that no
physical device was available during Kimi's own capture run.

## Final preview (cache-clean)

Port **8794** (fresh; 8788/8790/8791/8793 were not reused). Process kept
running via `npx wrangler pages dev out --compatibility-date=2026-08-02
--port 8794` (log `/tmp/pstore-8794.log`). Verified HTTP 200.

- Home: http://localhost:8794/
- Order: http://localhost:8794/order/
- Creative Apps: http://localhost:8794/creative-apps/
- Streaming Apps: http://localhost:8794/streaming-apps/
- AI Apps: http://localhost:8794/ai-apps/
- Premium VPN Apps: http://localhost:8794/premium-vpn-apps/

## Confirmations

Nothing was deployed, committed, or pushed. No changes to `functions/`,
the order API, Telegram integration, catalog/business data, JSON paths,
`package.json`/`package-lock.json`, Next.js config, Cloudflare config,
`_headers`, `_redirects`, CSP, caching, or the legacy website.
pstorebynamso.com production remains untouched.
