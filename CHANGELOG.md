# Changelog

## Unreleased

### Added

- A mobile-first Next.js App Router shell with persistent light, dark, and
  system themes, accessible navigation, reusable status states, and
  Motion-based modals.
- A typed live catalog that starts with indexable static content and revalidates
  `/products.json` without requiring a frontend rebuild.
- The migrated home page and eight statically exported category routes.
- Product search, product hash links, plan selection, fresh checkout stock
  checks, Telegram bot deep links, and website-payment query forwarding.
- Live FAQ accordions, the customer-review gallery and lightbox, the ExpressVPN
  location guide, both terms pages, official-channel panels, and a branded
  not-found page.
- Migrated payment selection for KBZPay, WavePay, and AyaPay with the current QR
  assets, instructions, payment warnings, and order-query forwarding.
- A mobile-first order form that preserves catalog prefill, conditional account
  fields, stock warnings, native screenshot upload, API response guidance, and
  the existing multipart submission contract.
- Lightweight Motion entrances, viewport reveals, staggered cards, modal and
  lightbox transitions, FAQ expansion, and short route transitions with a
  no-animation path for reduced-motion users.
- Preserved route metadata and home structured data, aligned the sitemap with
  canonical trailing-slash URLs, and added permanent redirects from every
  legacy content `.html` URL to its clean route.
- Production-versus-Next mobile comparison screenshots for the home and
  Creative Apps pages at 360px, 390px, and 430px.

### Fixed

- Aligned Zoom with the new ordered 1/3/6/12-month package contract, prices,
  public plan IDs, exclusive Most Popular/Best Value badges, Telegram deep
  links, and website payment query flow in both catalog copies.
- Completed the coordinated production rollout across the storefront, sale bot,
  and Admin Panel; the owner confirmed the resulting production UI is correct.
- Applied the owner-approved Kimi polish to the preview, including centered
  desktop search, cleaner purchase-guide spacing, order-page back controls,
  selective liquid-glass depth, and normalized requested product-logo tiles.
- Made the ChatGPT logo and other fresh visual updates reliable for returning
  browsers by requiring revalidation of Next.js CSS/JavaScript chunks whose
  filenames can be reused across static exports.
- Restored production-like header typography, spacing, backgrounds, home hero
  density, catalog position, and the ExpressVPN guide home card.
- Restored image-first two-column mobile category cards, compact payment/order
  layouts, square mobile review cards, two-column official links, and the
  detailed ExpressVPN protocol/connection presentation.
- Kept the migrated Motion, hydration, static-export CSP, theme switching, and
  responsive improvements while correcting visual hierarchy and route spacing.
- Kept all small-screen header controls at a 44px touch target.
- Increased the migrated home hero's line height so Burmese combining marks do
  not crowd adjacent title lines on narrow mobile screens.
- Removed the conflicting generic immutable directive from payment QR responses
  while preserving immutable caching for other static images.
- Added the Premium Store brand strip to the View Plans dialog so screenshots of
  any plan also carry the store identity, plus product icons beside plan names.
- Centered the search dialog on all viewports and kept it usable from any scroll
  position by closing the body lock cleanly.
- Fixed scrolling image flicker and refresh-like behavior with y-only viewport
  reveals, eager first-row catalog images, stable `?v=` image URLs, and no
  background-attachment parallax on mobile.
- Moved modals into a `document.body` portal with an iOS-safe fixed-body scroll
  lock that restores the exact scroll position, and removed the `overflow-x:
  clip` rule that broke the sticky header in Chrome.
- Added immediate touch feedback on buttons and cards while keeping
  reduced-motion support and avoiding expensive animated properties.
- Restored backdrop blur in every Chrome browser (Android and desktop): the
  source listed the standard `backdrop-filter` before its `-webkit-` twin and
  the Tailwind 4 minifier dropped the standard declaration, so the deployed
  CSS only carried `-webkit-backdrop-filter`, which Chrome ignores. The
  prefixed line now comes first in all six blur pairs.
- Darkened the modal overlay to 80% where `backdrop-filter` is unsupported
  (older/GPU-blocklisted Android Chrome, older Samsung Internet) so page copy
  no longer stays readable behind dialogs; the dialog panel stays opaque.
- Extended `touch-action: manipulation` to FAQ questions, review cards,
  checkout options, platform buttons, the order file picker, and back
  controls, removing double-tap-zoom delay on those tap targets.
- Moved the Google Fonts stylesheet from a chained CSS `@import` behind the
  globals bundle to a parallel `<link>` in the root layout head, so mobile
  text paint no longer waits for the full app CSS first.
- Stopped the Android Chrome on-screen keyboard from collapsing on every
  search keystroke: the centered search dialog sized to its content, so each
  keystroke shrank the result list, re-centered the panel, and moved the
  focused input — Android dismisses the IME when the focused editable shifts
  mid-typing. The phone dialog now keeps a constant height and the results
  scroll inside it, so the input's geometry never changes while typing.
- Kept the search input focused and the mobile keyboard open across every
  keystroke: the dialog's open effect depended on the `onClose` prop, and the
  search parent passes an inline handler whose identity changes per render, so
  each typed character tore the effect down (returning focus to the header
  button, collapsing the keyboard) and re-ran it (refocusing the input). The
  effect now reads the latest handler through a ref and is bound to the open
  state only, so the input is never blurred, remounted, or refocused while
  typing and the cursor stays put.
- Kept a lone search result at natural height on phones: the constant-height
  results area is a grid whose stretch default blew a single row up to fill
  the whole panel (one giant vertically-centred card). `align-content: start`
  pins rows to the top at their real height.

### Security

- Static-export CSP compatibility for Next.js bootstrap and Flight scripts via
  intentional `'unsafe-inline'`, while `script-src-attr 'none'` continues to
  block inline event handlers.
