# Overnight visual-polish pass — Next.js preview

> ⚠️ **THE SCREENSHOTS THIS REPORT REFERENCES WERE DELETED ON 2026-08-18**
> (632 captures, 245 MB, storefront commit `1ff2b68`). The findings and the
> acceptance recorded below still stand — only the image files are gone. Recover
> any one of them with `git show 1ff2b68^:<path>` from the storefront repo. All 22
> `qa/*.mjs` checks still run; the capture-producing ones regenerate their own
> screenshots (several, like `content-source-check.mjs`, produce no images at all).

Date: 2026-08-03 (overnight session)
Scope: frontend visual polish and UX only, on the local Next.js source and its
static export. Nothing was deployed, committed, pushed, or changed on
`pstorebynamso.com`.

---

## 1. Executive summary

The Next.js preview was already close to the live site. This pass reviewed the
existing production-versus-Next screenshot set, then re-measured the built
export directly in a headless browser at nine viewport widths in both themes,
and fixed the defects that measurement exposed.

The single largest finding was systemic: **Tailwind Preflight resets
`h1`–`h6` to `font-weight: inherit`**, so every heading whose component rule did
not set a weight was rendering at 400 while the live site renders it at 650/700.
That silently de-emphasised the page titles on Payment, Reviews, both Terms
pages and the ExpressVPN guide, the Terms section headings, the FAQ section
title, the trust-card titles and the Official Channels heading. The same
Preflight reset had also stripped the list markers and every clause separation
from the VPN Terms page, which was rendering as one unbroken grey block against
the live site's spaced, blue-bulleted clauses.

The second cluster was Burmese typography. Myanmar stacked vowels and medials
overhang the em box, and several components used 1.25–1.4 leading, which made
line 1's descenders physically collide with line 2 on the home hero, the
category-card blurbs, the Telegram-Bot callout and the Terms section headings.
Leading was raised only where a collision was verified by zooming into the
rendered pixels, not wherever a number looked small.

The third cluster was colour: an unused `--accent-ink` token existed in the
design system for exactly the "text on an accent surface" case, but every such
surface hard-coded `white`, so in dark mode the primary CTA, the header Bot
button, the skip link and the Official-Channel button all sat at 2.7:1. The
ExpressVPN connection mock is dark in both themes but used the light-theme
`--muted`, which made "this week" and "Select Lightway encryption:" effectively
invisible in light mode.

Two further defects were structural rather than cosmetic: at 320px the wordmark
ran underneath the four header controls, and a leftover value in the
conditionally hidden `customer_mail` field made Chrome refuse to submit the
order form with "an invalid form control … is not focusable" — a dead end the
customer can neither see nor fix.

After the pass: no horizontal overflow, no clipped text and no console errors on
any tested route at any tested width in either theme; every text/background pair
that can be sampled from computed style meets WCAG AA in both themes; lint,
typecheck, build and `npm audit` are clean.

---

## 2. Files changed

Only two source files were modified. `git status` is byte-for-byte the same set
of entries as at session start — no tracked file gained a modification, and
nothing was staged or committed.

| File | Change |
|---|---|
| `src/app/globals.css` | 29 targeted rule changes (see §4) |
| `src/components/order/OrderForm.tsx` | 1 attribute change on the hidden email input |

New files, all inside the already-untracked `qa/` tree:

- `qa/overnight/2026-08-03/REPORT.md` (this file)
- `qa/overnight/2026-08-03/screenshots/*.png` (30 post-fix captures: nine routes at
  360/390/430px in light mode, plus home, order and the ExpressVPN guide at
  390px in dark mode)

Not touched: `package.json`, `package-lock.json`, `node_modules/`, `next.config.ts`,
`_headers`, `_redirects`, `functions/`, `public/`, `products.json`, `data/`,
any `.env*`, and every legacy root `.html`/`style.css`/`assets` file.

---

## 3. Pages and components reviewed

**Screenshot comparisons reviewed (all 12 route/width comparisons in
`qa/comparisons/2026-08-03/`):** home, Creative Apps, payment, order, reviews,
ExpressVPN guide, Shop Terms and VPN Terms at 390px (`deployed-preview/` and
`parity-restored/`), plus home, Creative Apps, payment and order at 360px and
430px (`mobile-bounds/`). Each `report.json` was diffed production-versus-Next
programmatically for geometry, overflow, column counts and browser errors before
the images were inspected, so the visual review concentrated on real deltas.

**Routes exercised in the browser:** `/`, `/creative-apps/`, `/streaming-apps/`,
`/payment/`, `/order/`, `/reviews/`, `/expressvpn-location-guide/`,
`/terms-of-service/`, `/terms-of-service-vpn/`, `/404.html`.

**Components inspected or changed:** `SiteHeader`, `SiteFooter`,
`OfficialChannels`, `Modal` (search + plan + checkout), `PlanModal`,
`ProductCard`, `CategoryCard`, `HomeCatalog`, `FAQList`/`FAQItem`,
`ReviewGallery`, `ExpressGuide`, `PaymentExperience`, `OrderForm`,
`OrderSummary`, `Button`, `AnimatedSection`/`useRevealMotion`.

**Production was read only.** Production pages were loaded in a headless browser
to measure the reference typography (for example, that the live wordmark is
14.72px and the live Terms headings are weight 700). No request other than a
`GET` was made to `pstorebynamso.com`.

---

## 4. Visual issues fixed

### 4.1 Headings and text hierarchy

1. **All headings had lost their bold weight** where the component rule did not
   set one (Tailwind Preflight sets `font-weight: inherit`). Restored a
   `font-weight: 700` default in `@layer base`, which the unlayered component
   rules still override. Measured production is 650 or 700 for every affected
   heading, and Lora only ships 400/500/600/700, so 650 and 700 resolve to the
   same face — the result matches the live site exactly. Affected: Payment,
   Reviews, Shop Terms, VPN Terms and ExpressVPN page titles; all nine Terms
   section headings; the FAQ section title; the four trust-card titles; the
   Official Channels heading; the payment platform heading.
2. **VPN Terms clauses had no bullets and no separation** (Preflight also sets
   `list-style: none` and zeroes list margins). Restored `list-style` on
   `.terms-document section ul`, tinted `::marker` with the accent to match the
   live blue bullets, and added 10px between `li + li` and `p + p`.
3. **Terms section headings now sit closer to their own content than to the
   previous section** — margin changed from `18px/10px` to `26px/12px`.
4. Terms section heading size `1.05rem → 0.98rem` (the live value), so the
   longer Burmese titles stop wrapping onto a colliding second line.

### 4.2 Burmese typography

Each of these was confirmed by cropping and magnifying the rendered PNG, not
inferred from the stylesheet.

5. `.store-hero h1` leading `1.28 → 1.4` — line 1's descenders were touching
   line 2 on the mixed Burmese/Latin headline.
6. `.category-card p` leading `1.4 → 1.7` — "App တစ်ခုချင်းစီ ကြည့်ရန် ပုံကိုနှိပ်ပါ"
   had line 1's marks overlapping line 2's. 1.7 is the smallest value that
   clears them at this size (verified against the trust-card copy, which was
   already at 1.7 and clean).
7. `.bot-callout h2` leading `1.3 → 1.5` (and `1.35 → 1.5` in the ≤768px block).
8. `.product-card p` `1.25 → 1.65`, `.plan-row__details > span` `1.45 → 1.6`,
   `.plan-row__details strong` `1.35 → 1.5`, `.section-heading h2` `1.15 → 1.32`,
   `.payment-warning-heading` `1.35 → 1.5`, `.modal-heading h2` `1.25 → 1.35`,
   `.category-card h3` `1.3 → 1.4`, `.button` `1.2 → 1.35`.

A sweep for Burmese text rendering with `line-height: normal` found only native
`<option>` elements, which cannot be styled reliably — no global change needed.

### 4.3 Header

9. **The wordmark had shrunk to 11.2px against the live site's 14.72px.** The
   space beside the four 44px controls grows one pixel per viewport pixel, so
   the usable size is linear rather than a plain `vw` ratio; the size is now
   `clamp(0.7rem, calc(10.5vw - 27px), 0.86rem)` below 400px and
   `clamp(0.74rem, 3.6vw, 1rem)` above it. Measured result: 11.2px at 360
   (unchanged — there is genuinely no room), 13.76px at 390, 15.48px at 430,
   16px from 480 up. Gap to the controls verified positive at 320/360/375/384/
   390/400/414/430/480/520/640/768/1024/1280.
10. **At 320px the wordmark ran underneath the header controls** (measured
    −29.3px overlap; pre-existing, invisible to `scrollWidth` because `html` has
    `overflow-x: clip`). Below 341px the duplicate Home control is hidden — the
    brand itself is the home link — which restores an 18.7px gap.
11. The wordmark link was a 30px-tall tap target; `padding-block: 7px` makes it
    44px inside the header's existing 44px content row, with no visual change.

### 4.4 Order form

12. **`customer_mail` blocked submission when hidden.** The field is
    `type="email"`; when the plan hides it, any leftover value fails format
    validation and Chrome refuses to submit, logging "An invalid form control
    with name='customer_mail' is not focusable." It now drops to `type="text"`
    while hidden, which keeps the value, keeps the field in the multipart body
    (the 11-field contract is unchanged) and only skips the format check.
    Reproduced before the fix and confirmed gone after.
13. **The screenshot drop zone read as a plain grey block.** Its 1px dash in
    `--border-strong` was invisible on light backgrounds; it is now a 2px
    accent-tinted dash over a faintly tinted surface, with a transition into the
    existing selected/hover state.
14. **Keyboard focus on the file input was invisible** — the real input is
    clipped to 1px, so the ring had nowhere to render. The visible label now
    shows the ring via `:has(.order-file-input:focus-visible)`.
15. **Prose links sat on colour alone and were 18px tall.** `.order-summary-next a`,
    `.order-form-card-next a` and `.order-result a` are underlined with a 3px
    offset and 6px block padding (30px tall, thicker underline on hover).

### 4.5 Colour and contrast

16. **Text on accent surfaces now uses `--accent-ink`**, a token the design
    system already defined (white in light, `#06192e` in dark) but nothing used.
    White on the dark theme's bright `#4d9fff` measured 2.7:1. Applied to
    `.button--primary`, `.skip-link`, `.site-header .header-bot-button`,
    `.official-channel--primary`, `.mobile-navigation__bot`,
    `.catalog-notice button`. **Light mode is pixel-identical** because
    `--accent-ink` is `#ffffff` there.
17. **The order submit button** was white on `--success`: 4.4:1 in light and
    1.9:1 in dark. A new `--success-surface` (`#0f7a49`, both themes) is used by
    that button only, so `--success` — which prices still use — is untouched.
18. **The ExpressVPN connection mock is dark in both themes** but used the
    light-theme `--muted`. "this week" (1.04:1) and "Select Lightway
    encryption:" (1.18:1) were invisible in light mode; the Secure Device
    Assistant row and the IP readout were also affected. All four now use
    explicit light-on-dark values.
19. **Trust chip icons** inherited `--muted`, flattening the row into one grey
    mass; the live site tints them with the accent, so they do too now.

### 4.6 Modals, cards and layout

20. **The modal panel was 4% transparent**, so a saturated product logo bled
    through the plan-modal title. It now paints `--surface-strong` over an
    opaque canvas layer — same tint, nothing bleeds through.
21. `.modal-close` 42px → 44px.
22. **Three payment platforms in a two-column grid** left the third stranded in
    a half row; the last-of-three now spans the full width, matching the rule
    the proof links already use.
23. **Legal pill links** (`.route-footer`, `.official-channels__terms`) were
    ~30px tall. Their links are now `min-height: 40px` with the pill padding
    reduced to compensate, so the pill's outer height is unchanged.

---

## 5. Viewport checks completed

All checks ran against the real static export (`out/`) served over HTTP, in
headless Chrome with device metrics and emulated media, not against `next dev`.

| Width | Purpose | Result |
|---|---|---|
| 320px | narrow WebView floor (`html { min-width: 320px }`) | header overlap found and fixed |
| 360px | required mobile width | clean |
| 375px | iPhone SE / mini class | clean |
| 384px, 400px, 414px | wordmark clamp boundaries | clean |
| 390px | required mobile width | clean |
| 430px | required mobile width | clean |
| 480px, 520px, 640px | phone→tablet transition | clean |
| 768px | representative tablet | clean |
| 1024px, 1280px | representative desktop | clean |

Result of the automated sweep on the final build: **54/54 route/width
combinations clean in light mode and 54/54 clean in dark mode** (nine routes ×
320/360/390/430/768/1280px). An earlier sweep on the near-final build covered a
wider grid — ten routes × nine widths × two themes — and was likewise **180/180
clean**.

Contrast: **8/8 audited pages have zero WCAG AA failures in light mode and 8/8
in dark mode**, measured by compositing each text node's colour against its
resolved (alpha-composited) background. Elements over gradients are excluded
because computed style cannot sample them.

Checked at each width: horizontal overflow (`scrollWidth` **and** a per-element
sweep for anything crossing the right edge, because `overflow-x: clip` hides the
former), clipped text (`scrollHeight > clientHeight` on non-`visible` overflow),
touch-target sizes, sticky-header behaviour, image aspect ratios, long Burmese
content, and browser console/error-log output.

Additional checks:

- **Both themes** — the full route set was audited in light and dark.
- **Modals** — search and plan modals verified open/close, focus moves inside,
  `Escape` closes, body scroll locks and unlocks, the panel scrolls internally
  when tall (`max-height: min(88vh, 88dvh)`), and no child overflows the
  viewport, at 360/390/430.
- **Reduced motion** — with `prefers-reduced-motion: reduce`, no element is left
  at reduced opacity or a non-identity transform, all durations collapse to
  0.01ms, and `scroll-behavior` falls back to `auto`.
- **Form states** — empty submit, file chosen, submitting (button disabled,
  "ပို့နေသည်…", `cursor: wait`, 0.6 opacity), API error (`role="alert"`, red
  tint) and success (green tint) were all exercised with the endpoint stubbed
  in-page, so no request left the machine.
- **Image layout stability** — the review grid uses `next/image` with `fill`
  inside an `aspect-ratio: 1` button, so the missing `width`/`height` attributes
  are not a CLS risk.

---

## 6. Validation command results

Run after the final source change, from the repository root.

| Command | Result |
|---|---|
| `npm run lint` | pass — no output, no warnings |
| `npm run typecheck` | pass — no output |
| `npm run build` | pass — compiled in ~1.4s, 17 static pages generated |
| `npm audit` | pass — **found 0 vulnerabilities** |
| `git diff --check` | pass — no whitespace errors |
| `git status --porcelain` | unchanged from session start (4 pre-existing modified tracked files, same untracked set) |

Static export verified: all 15 canonical routes plus `404.html` and
`_not-found` are present in `out/`, and every route returned HTTP 200 from the
local server.

Confirmed during validation:

- No secrets were introduced; no `.env*` file was read or written.
- No backend, Function, deployment or configuration file was changed.
- No production operation was performed.
- `package.json` and `package-lock.json` are untouched; no package was
  installed, removed or upgraded.
- No unrelated file was modified — a byte-level diff against a snapshot of
  `src/` shows exactly two changed files.

---

## 7. Unresolved local issues

1. **The wordmark stays at 11.2px below ~385px.** Four 44px header controls plus
   the logo leave no room for a larger wordmark at 360px and below. Raising it
   further requires shrinking the touch targets or dropping a control, and the
   earlier P8 pass deliberately raised those controls to 44px. Left as is.
2. **The `contact` field has a `pattern` but no `title`**, so a mistyped
   number gets Chrome's generic "Please match the requested format." A `title`
   would fix it, but that is new customer-facing Burmese copy the owner has not
   approved, so it was not added. Recommended, not done.
3. **The home page renders ~690px taller than production at 390px.** The section
   rhythm is deliberately more generous and nothing crowds or clips; tightening
   it is a design decision, not a defect, so it was left alone.
4. **The hero badge is uppercased** where the live site is title case, and the
   404 page has a large gap between the card and the back controls. Both are
   deliberate-looking style choices in the current design; neither is a
   usability problem, so neither was changed.
5. **`src/components/layout/MobileNavigation.tsx` is not rendered anywhere.**
   Dead component. Not removed — deleting source files is out of scope.

---

## 8. External blockers

1. **Cloudflare MCP connection could not be established.** The
   `claude.ai Cloudflare Developer Platform` connector requires interactive
   OAuth: the tool returns *"Ask the user to run `/mcp` and select 'claude.ai
   Cloudflare Developer Platform' to authenticate."* This cannot be completed
   without the owner at the keyboard. Nothing in this pass needed it — all work
   was local — but the connection is still pending.
2. **Preview `BOT_TOKEN` / `ADMIN_CHAT_ID` are still unset**, so a real
   `POST /api/order`, Telegram delivery and the optional panel mirror remain
   untested on the deployed preview. Requires owner-supplied preview-only
   secrets.
3. **Real-device acceptance is still open**: Android Chrome, iPhone Safari
   (WebKit) and an embedded Android WebView. Chromium emulation is not a
   substitute and is not claimed as one.
4. **Mid-range Android animation performance** cannot be measured here.
5. **Owner approval** of `PROJECT_REQUIREMENTS.md`, the device inventory, and
   any production replacement remain owner gates.
6. **Nothing was deployed**, so none of these fixes are on the
   `next-preview` alias yet. The preview still serves deployment
   `1ce72273-f60c-4d2c-a449-47b27bbbf70b`.

---

## 9. Assumptions made

1. **Production is the visual reference for typography, not for accessibility.**
   Where production and WCAG AA disagreed — white text on the dark theme's
   bright accent, the green submit button — AA won, using tokens the design
   system already defined. Light mode is unchanged by that decision.
2. **650 and 700 are interchangeable here.** Lora ships 400/500/600/700, so both
   resolve to the 700 face; a single bold default therefore reproduces
   production exactly rather than approximately.
3. **Below 341px, a duplicate Home control is the right thing to drop.** The
   wordmark is itself the home link, so no destination is lost. Reverting is one
   media query.
4. **Leading was raised only where a collision was visible in the rendered
   pixels**, so the vertical rhythm changes as little as possible.
5. **The hidden email field should keep its value.** Switching its `type` rather
   than clearing it or disabling it preserves both the submitted data and the
   11-field multipart contract.
6. **`:has()` is available.** It is used once, for the file-input focus ring, and
   degrades to today's behaviour (no visible ring) if unsupported.
7. **`out/` artefacts are not project state.** Empty `"… 4"` directories that
   appeared there were caused by rebuilding while the local static server held
   the directory open; a clean rebuild produces 34 correct entries.

---

## 10. Owner review checklist

Open the preview at 390px in light mode first, then repeat the starred items in
dark mode.

1. ★ **Home** — the wordmark should look noticeably larger than before; the hero
   headline's three lines should not touch; the four benefit chips should have
   blue icons.
2. **Home, scrolled** — the four trust cards and the Telegram-Bot callout
   heading should have clear space between their Burmese lines.
3. **Category page (Creative Apps)** — the "App တစ်ခုချင်းစီ…" blurbs under each
   card should no longer overlap themselves.
4. ★ **Plan modal** — tap *View Plans*: the product logo behind the sheet must
   not show through the title; the ✕ should be comfortably tappable.
5. ★ **Payment** — the title should be bold; with three platforms the third
   button should span the full width rather than sit alone in half a row.
6. ★ **Order** — the screenshot picker should read as a dashed drop zone;
   "Page Messenger" should be underlined; submitting should disable the button
   and show "ပို့နေသည်…".
7. **VPN Terms** — clauses should have blue bullets and space between them, as
   on the live site.
8. **Shop Terms** — section headings should be bold red and sit closer to their
   own text than to the section above.
9. **Reviews** — the page title should be bold.
10. **ExpressVPN guide, light mode** — "this week" under *Time Protected* and
    "Select Lightway encryption:" should now be readable.
11. **320px** (or a narrow in-app browser) — the wordmark must not run under the
    header buttons; the Home icon is intentionally hidden at that width.
12. **Reduced motion** (iOS: Settings → Accessibility → Motion) — all content
    should be visible immediately with no reveal animation.

If any single change is unwanted, each one in §4 is an isolated CSS rule and can
be reverted on its own.

---

## 11. Confirmation

Nothing was deployed. Nothing was committed, pushed, merged, rebased or reset.
No pull request was created. No Wrangler or Cloudflare command was run, and no
Cloudflare dashboard, DNS, domain, build or environment setting was changed.
`pstorebynamso.com` was loaded read-only for measurement and was not modified in
any way. No credential, token or `.env` file was read, written, displayed or
copied. No package was installed, removed or upgraded. No backend, API,
database, Telegram or payment behaviour was touched. No source file was deleted.
