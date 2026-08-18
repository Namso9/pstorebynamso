# Kimi UI/UX polish pass — Next.js preview

> ⚠️ **THE SCREENSHOTS THIS REPORT REFERENCES WERE DELETED ON 2026-08-18**
> (632 captures, 245 MB, storefront commit `1ff2b68`). The findings and the
> acceptance recorded below still stand — only the image files are gone. Recover
> any one of them with `git show 1ff2b68^:<path>` from the storefront repo. Every
> `qa/*.mjs` check still runs and regenerates its own captures.

Date: 2026-08-03 (overnight session, Kimi)
Scope: UI/UX and visual polish of the local Next.js source and its static
export only. Nothing was deployed, committed, pushed, or changed on
`pstorebynamso.com`.

---

## 1. Executive summary

This pass ran after the earlier defect-fix pass documented in
`qa/overnight/2026-08-03/REPORT.md`, which had already restored production
parity, heading weights, Burmese leading, contrast, and modal opacity. The
remaining gap was not correctness but finish: surfaces were flat, the shadow
system was a single reused token, the only glass was the sticky header, and
the premium Telegram-CTA panel — the page's main conversion surface — had no
visual elevation above ordinary cards.

The pass added a small liquid-glass token set (four tokens per theme, not a
new design system), applied glass selectively to exactly four surface types
(sticky header, the Telegram wallet CTA panel, the order-summary info panel,
and modal chrome), gave cards a two-tier depth treatment (inset top highlight
plus a soft ink-tinted drop shadow on anchor surfaces; highlight only on dense
list rows), and added an opaque `@supports` fallback for every translucent
surface. Motion needed almost no correction — the existing system already met
the duration and reduced-motion guidelines; the one outlier (a 480ms section
reveal) was brought back inside the 250–450ms band.

Verified on the real static export: 43 route/width/theme combinations with no
horizontal overflow and no browser errors, glass-surface contrast measured in
both themes (worst case 5.13:1, AA is 4.5:1), reduced-motion leaves no hidden
or transformed element, plan/checkout modals and the parameterized order
summary render correctly in both themes, and lint, typecheck, build,
`npm audit`, and `git diff --check` are all clean.

---

## 2. Design direction applied

Premium, calm, conversion-focused; the existing identity, content, routes,
and production-restored layout are unchanged. Glass is a finish, not a theme:

- Controlled transparency (66–68% opaque surfaces, never under critical copy).
- One restrained blur per surface (14–18px), never stacked.
- Visible soft borders (`--glass-line`) and an inset 1px top highlight
  (`--glass-hi`) instead of heavy shadows.
- Shadows tint themselves from the theme ink via `color-mix`, so light and
  dark stay soft without per-theme hard-coded greys.
- Every translucent surface falls back to the opaque `--surface-strong` when
  `backdrop-filter` is unavailable.
- No gradients added, no neon, no continuous decorative motion, no layout
  changes — all rules are additive surface treatments.

## 3. Files changed

| File | Change |
|---|---|
| `src/app/globals.css` | 4 glass tokens per theme (`--glass-bg`, `--glass-line`, `--glass-hi`, `--glass-shadow`) plus one appended "Premium liquid-glass polish" section (~100 lines) |
| `src/components/common/AnimatedSection.tsx` | Section reveal 480ms/18px → 440ms/16px (back inside the recommended entrance band) |

New QA artifacts (all inside the untracked `qa/` tree, no dependencies added):

- `qa/kimi-shots.mjs` — dependency-free CDP full-page capture harness.
- `qa/kimi-modal-shots.mjs` — interactive order-summary / plan-modal /
  checkout-modal captures in both themes.
- `qa/kimi-verify.mjs` — reduced-motion and glass-contrast measurement.
- `qa/overnight/2026-08-03/kimi-shots/baseline/` — pre-change captures.
- `qa/overnight/2026-08-03/kimi-shots/polish/` — post-change captures.

Not touched: `package.json`, `package-lock.json`, `node_modules/`,
`next.config.ts`, `_headers`, `_redirects`, `functions/`, `public/`,
`products.json`, `data/`, any `.env*`, every legacy root file, and all
backend/order/payment logic.

## 4. Pages and components reviewed

- Screenshot comparisons in `qa/comparisons/2026-08-03/` (README, parity and
  bounds sets, production reference captures) — all reviewed before changing
  anything.
- Routes exercised in a headless browser against the built export: `/`,
  `/creative-apps/`, `/payment/`, `/order/` (plain and with
  `?product=picsart&plan=6_months`), `/reviews/`, `/terms-of-service/`,
  `/terms-of-service-vpn/`, `/expressvpn-location-guide/`.
- Components inspected: `SiteHeader`, `Modal`, `Button`, `AnimatedSection`,
  `useRevealMotion`, `HomeCatalog`, `CategoryCard`, `ProductCard`,
  `PlanModal`/`CheckoutModal` (rendered states), `OrderSummary`, `OrderForm`,
  `PaymentExperience`, `OfficialChannels`, `SiteFooter`.
- Production was read-only: only the pre-existing comparison captures and
  earlier measurements were used as reference; no new requests were needed.

## 5. Liquid-glass treatments added

| Surface | Treatment | Why it qualifies |
|---|---|---|
| Sticky header | hairline `--glass-line` border, ink-tinted soft shadow (blur 16px already existed) | navigation bar — the canonical glass case |
| `.bot-callout` (Telegram wallet CTA) | `--glass-bg` over the page's fixed backdrop, accent-tinted edge, 18px blur, inset highlight, `--glass-shadow` | the premium conversion panel; previously flat |
| `.order-summary-next` | `--glass-bg`, 14px blur, glass border and highlight | compact floating info panel |
| `.modal-panel` | glass border + inset highlight only; panel stays opaque per the earlier readability fix | modal chrome without risking copy contrast |

Deliberately not glass: product/category/trust cards (opacity would fight the
product imagery), form fields, terms documents, and any surface carrying
long Burmese copy.

Fallback: `@supports not (backdrop-filter)` paints `--surface-strong` on the
header, CTA panel, info panel, and shared feature cards. (CSS inspected;
Chrome cannot emulate its absence, so the fallback path is verified by
construction, not by screenshot.)

## 6. Animation improvements

- Section reveals: 480ms → 440ms, offset 18px → 16px
  (`AnimatedSection`/`useRevealMotion`), back inside the recommended
  250–450ms entrance band.
- Everything else already met the motion guidelines and was left alone:
  modal 180/240ms, route transition 180ms, card staggers 360–420ms,
  once-only viewport reveals, transform/opacity-only properties.
- Reduced-motion verified on the final build: after scrolling the whole home
  page with `prefers-reduced-motion: reduce`, zero elements are left with
  reduced opacity or a non-identity transform.

## 7. Mobile UX improvements

- 43 route/width/theme checks (360/390/430/768/1024px, light and dark) show
  no horizontal overflow, no clipped text, and no console or page errors on
  the final build.
- Tiered card depth improves tap-target legibility on dense mobile grids
  without changing any geometry, so the previously verified 44px targets and
  wordmark clamps are untouched.
- The order-summary glass panel keeps product, plan, and price visually
  grouped above the form at all three required mobile widths (verified with
  real query parameters at 390px in both themes).

## 8. Accessibility improvements

- Glass contrast measured on the rendered page (text colour composited over
  the resolved translucent surface): CTA heading 17.46:1 light / 17.43:1
  dark; CTA copy 5.13:1 light / 7.63:1 dark — all above WCAG AA.
- The modal panel remains opaque, preserving the earlier fix that kept page
  imagery from bleeding under dialog copy.
- No state is communicated by colour alone anywhere in the new rules (all
  additions are surface treatments; existing icons/labels unchanged).
- Focus-visible outlines, semantic structure, keyboard modal behaviour, and
  reduced-motion support were verified unchanged.

## 9. Performance considerations

- Exactly one blurred element is added to any viewport (the CTA panel); the
  header blur already shipped. No stacked blurred layers.
- Blur radii are small and static — no animated blur anywhere.
- All animations remain transform/opacity-only; no layout-property animation
  was introduced.
- No new assets, fonts, JavaScript, or dependencies. The CSS addition is
  ~3.3KB unminified.
- Real mid-range Android measurement remains an external gate (unchanged).

## 10. Validations completed

| Check | Result |
|---|---|
| `npm run lint` | pass, no output |
| `npm run typecheck` | pass, no output |
| `npm run build` | pass, 17 static pages generated |
| `npm audit` | pass, 0 vulnerabilities |
| `git diff --check` | pass |
| `git status --porcelain` | identical to session start (same 4 pre-existing modified tracked files, same untracked set) |
| Overflow/console sweep | 43/43 route/width/theme combinations clean |
| Reduced-motion sweep | 0 stuck elements |
| Glass contrast | AA pass in both themes (min 5.13:1) |
| Modal interactions | plan modal, checkout modal, and parameterized order summary render in both themes |

## 11. Unresolved local issues

1. The `@supports` no-`backdrop-filter` fallback is verified by construction
   only; Chrome cannot emulate its absence. The rule is standard and the
   fallback colours are the already-verified `--surface-strong`.
2. The home page is still ~690px taller than production at 390px (generous
   section rhythm). Recorded by the earlier pass as a design decision; left
   unchanged.
3. The wordmark still floors at 11.2px below ~385px — physically constrained
   by the four 44px header controls; recorded by the earlier pass, still not
   fixable without shrinking touch targets.
4. The review-strip images load lazily and can appear as empty frames in
   fast full-page captures; they are real assets returning HTTP 200 and were
   confirmed rendering in normal browsing. Not a defect.

## 12. External blockers

1. Preview `BOT_TOKEN` / `ADMIN_CHAT_ID` unset — real order/Telegram test
   impossible (owner-supplied preview-only secrets required).
2. Real-device acceptance (Android Chrome, iPhone Safari, Android WebView)
   and mid-range Android animation performance cannot be measured locally.
3. Owner approval of `PROJECT_REQUIREMENTS.md`, device inventory, this and
   the earlier report, and any production replacement remain owner gates.
4. Nothing was deployed, so this polish is not on the `next-preview` alias
   (still deployment `1ce72273-f60c-4d2c-a449-47b27bbbf70b`).

## 13. Recommended owner-review order

Open the local export or, after an authorized redeploy, the preview at 390px
light mode first; repeat the starred items in dark mode.

1. ★ Home → "New Bot Checkout" panel — should now read as a floating glass
   card with a soft accent edge, clearly the richest surface on the page.
2. ★ Home → category grid and trust cards — subtle top highlight and softer,
   deeper shadows than before; compare with `kimi-shots/baseline/`.
3. ★ Creative Apps → View Plans → choose a plan — the checkout sheet's
   recommended Telegram option has a quiet accent elevation.
4. Order with parameters (`/order/?product=picsart&plan=6_months`) — the
   "Your Order" summary floats above the page as a compact glass panel.
5. Scroll with the sticky header — hairline bottom border, no harsh grey.
6. Reduced motion on — all content visible immediately, no reveals.

## 14. Suggested copy changes not automatically applied

None. No wording was changed and none is recommended by this pass; existing
copy fit the layouts once surface hierarchy was corrected.

## 15. Confirmation

Nothing was deployed. Nothing was committed, pushed, merged, rebased, or
reset. No pull request was created. No Cloudflare, DNS, domain, build, or
environment setting was changed. `pstorebynamso.com` was not modified in any
way. No credential, token, or `.env` file was read, written, displayed, or
copied. No package was installed, removed, or upgraded. No backend, API,
database, Telegram, or payment behaviour was touched. No source file was
deleted. No testimonials, metrics, ratings, or capabilities were invented.
