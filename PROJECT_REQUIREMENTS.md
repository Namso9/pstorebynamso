# PStore Project Requirements

## Document Purpose

This document records the product, customer, design, technical, and operational
requirements for PStore. Add new requirements here before they are implemented.

The detailed migration sequence remains in `NEXTJS_MIGRATION_PLAN.md`. Active
implementation tasks remain in `TODO.md`.

## Product Summary

PStore is a digital product storefront for subscriptions, software, streaming,
VPN, learning, communication, and AI products. Customers browse products,
select a plan, choose a payment platform, and submit payment proof or continue
through Telegram.

## Primary Customers

- Most customers use mobile phones.
- Customers may open the website from Chrome, Safari, Telegram, Messenger, or
  another in-app browser.
- The site must continue supporting its current Burmese and English content.
- The purchase path must remain simple for customers with limited technical
  experience.

## Main Platform Decision

- Build a responsive website with Next.js, React, and TypeScript.
- Use the Next.js App Router and static export.
- Use Tailwind CSS for mobile-first responsive layout.
- Use Motion for React for lightweight animation.
- Host the generated `out` directory on the existing Cloudflare Pages project.
- Keep the existing Cloudflare Pages Functions as the backend.
- Do not use Vite or React Router.
- Do not require a native mobile application or WebView wrapper.

## Mobile-First Requirements

Mobile is the primary experience and is required for every feature.

- Design first for 360px, 390px, and 430px widths.
- Support tablet and desktop layouts after mobile is correct.
- Prevent horizontal scrolling and clipped content.
- Use a minimum 44px touch target for interactive controls.
- Use at least 16px text in form inputs to prevent unwanted mobile zoom.
- Keep primary purchase actions easy to reach with one hand.
- Support mobile keyboards and the native image picker.
- Respect phone safe areas for fixed or sticky elements.
- Ensure modals fit within the visible mobile viewport.
- Keep QR codes clear and large enough to use.
- Avoid sticky elements covering payment warnings or form fields.
- Keep the full `PREMIUM STORE` brand visible without clipping in the header.
- Keep bottom content and footer text neatly spaced, aligned, and readable.
- Prevent footer text from crowding, overlapping, or touching screen edges.
- Test on Android Chrome, iPhone Safari, and a narrow Android WebView.

## WebView Requirement

The website must work correctly inside common in-app WebViews, but it must not
depend on a WebView wrapper.

- Use standard links, browser history, query parameters, and file inputs.
- Support safe-area spacing.
- Do not depend on browser extensions or unsupported window features.
- Keep external Telegram, Messenger, and Facebook links functional.
- A dedicated Android wrapper, iOS wrapper, Telegram Mini App, or PWA is a
  separate future project.

## Functional Requirements

### Navigation and routes

- Preserve all current pages and content.
- Use clean routes without `.html` as the primary URLs.
- Redirect every old `.html` URL to its matching clean route.
- Support direct page loads and browser refreshes on every route.
- Preserve browser back navigation.
- Show a useful not-found page for unknown routes.

### Catalog

- Keep `products.json` as the single source of truth.
- Load all current categories, products, plans, prices, and stock states.
- Continue receiving live product updates without requiring a frontend rebuild.
- Render the 8 category pages from one reusable category implementation.
- Preserve product IDs and plan IDs.
- Display a clear loading state and a useful error state.

#### Zoom package contract (approved 2026-08-03)

- Publish exactly four Zoom plans in this order: `1 Month`, `3 Months`,
  `6 Months`, `1 Year`.
- Use `29,000 Ks`, `85,000 Ks`, `169,000 Ks`, and `329,000 Ks` respectively.
- Use public plan IDs `1_month`, `3_months`, `6_months`, and `1_year`.
- Show `⭐ Most Popular` only on `6 Months` and `🔥 Best Value` only on
  `1 Year`.
- Preserve the `buy-zoom-PLAN_ID` Telegram payload and
  `/payment/?product=zoom&plan=PLAN_ID` website checkout contract.
- Keep the selected name, price, public ID, and 1/3/6/12-month subscription
  duration aligned with the bot-owned SQLite catalog and Admin Panel.

### Search

- Search products by the same names and terms currently supported.
- Show relevant category information with each result.
- Navigate to the selected product and open or focus it correctly.
- Support keyboard navigation and screen readers.

### Product and plan selection

- Display the current product image, title, subtitle, plans, price, and stock.
- Preserve contact-only and out-of-stock behavior.
- Preserve Telegram bot eligibility for supported plans.
- Support product hashes such as `#app-PRODUCT_ID`.
- Support `?product=PRODUCT_ID&plan=PLAN_ID` query parameters.

### Checkout selection

- Let customers choose Telegram bot checkout or website payment when available.
- Preserve the current Telegram deep-link format.
- Preserve product and plan information throughout the checkout path.
- Do not delay checkout actions with animation.

### Payment page

- Support KBZPay, WavePay, and AYA Pay.
- Preserve all existing payment warnings, account details, QR images, and proof
  submission instructions.
- Make the selected payment platform obvious.
- Forward the product and plan query parameters to the order form.
- Do not allow stale payment QR images to be served from immutable cache.

### Order form

- Preserve all existing field names and server payloads.
- Prefill product and plan details from the URL.
- Preserve conditional customer email and password fields.
- Preserve contact validation and field length limits.
- Accept payment screenshots through the native file picker.
- Preserve screenshot size and file-type validation.
- Submit `multipart/form-data` to `POST /api/order`.
- Preserve timeout, success, error, and out-of-stock handling.
- Keep Telegram delivery and optional panel mirroring unchanged.

### FAQ, reviews, guides, and terms

- Continue loading FAQ content from `/data/faq.json`.
- Continue loading reviews from `/data/reviews.json`.
- Continue loading the ExpressVPN guide from `/data/express-guide.json`.
- Preserve both terms pages and all existing customer notices.
- Keep the review lightbox and FAQ accordion accessible on mobile.

### Theme

- Support light, dark, and system theme behavior.
- Preserve the selected theme across browser sessions.
- Avoid a visible incorrect-theme flash during initial loading.
- Maintain readable contrast in both themes.
- Give light mode a coordinated palette for backgrounds, cards, borders, text,
  accents, buttons, and shadows.
- Keep light-mode visual hierarchy consistent across every page.

## Design and Animation Requirements

- Preserve the current brand and content during the first migration.
- Include targeted mobile, branding, light-mode, animation, and UI/UX fixes in
  the initial migration.
- Leave any full visual redesign until after functional parity is verified.
- Use subtle hero, section, card, accordion, modal, and route animations.
- Match the smoothness, timing, easing, reveals, and interaction quality of the
  reference website discussed with the owner.
- Adapt the reference motion to PStore instead of copying its branding.
- Make transitions feel smooth and consistent rather than decorative or slow.
- Do not use scroll hijacking.
- Respect `prefers-reduced-motion`.
- Use transform and opacity for most animations.
- Avoid continuous heavy animation on mobile.
- Keep checkout, payment, and order interactions immediate.

## Accessibility Requirements

- Use semantic headings, landmarks, forms, buttons, and links.
- Provide useful alternative text for meaningful images.
- Support keyboard navigation.
- Keep visible focus styles.
- Trap focus inside open modals and restore focus after closing.
- Close modals with Escape.
- Label form controls and report validation errors clearly.
- Maintain readable color contrast.

## Performance Requirements

- Target a mobile Largest Contentful Paint of 2.5 seconds or better on a
  production build over a typical 4G connection.
- Keep client components limited to interactive sections.
- Render static content as Next.js server components where possible.
- Compress and correctly size images.
- Lazy-load noncritical images.
- Avoid unnecessary JavaScript and animation libraries.
- Prevent major layout shifts.

## SEO Requirements

- Preserve current titles, descriptions, canonical URLs, and social metadata.
- Preserve structured data where currently present.
- Statically generate every important route.
- Update `sitemap.xml` for clean routes.
- Keep old URLs working through permanent redirects.
- Ensure useful page content exists in generated HTML without client JavaScript.

## Backend and Security Requirements

- Keep `POST /api/order` on Cloudflare Pages Functions.
- Keep `/products.json`, `/data/*`, and `/img/*` Cloudflare function behavior.
- Keep all secrets and environment variables server-only.
- Do not commit Telegram tokens, admin IDs, panel tokens, or credentials.
- Preserve origin, request-size, upload-size, and image-type validation.
- Preserve security headers and content security policy.
- Do not weaken payment image cache rules.

## Deployment Requirements

- Use the existing Cloudflare account, project, domain, Functions, and secrets.
- Do not create or depend on a separate Cloudflare account.
- Build with `npm run build`.
- Deploy the generated `out` directory.
- Keep the `functions` directory at the repository root.
- Verify live JSON updates, order submission, redirects, and headers in a preview
  deployment before production.

## Initial Non-Goals

- No database migration.
- No order API rewrite.
- No native Android or iOS application.
- No dedicated WebView wrapper.
- No Telegram Mini App in the initial migration.
- No product ID or plan ID renaming.
- No GSAP or Lenis in the initial migration.
- No major visual redesign before feature parity.

The approved Zoom package contract above is a scoped post-migration exception
to the initial plan-ID-renaming non-goal. No other product or plan IDs change.

## Requirement Change Process

For each new request:

1. Add or update the requirement in this document.
2. Add an actionable task to `TODO.md`.
3. Implement and test the task.
4. Record the completed customer-visible change in `CHANGELOG.md`.

## Future Decision Plan

The initial migration remains a responsive, WebView-ready website. The
following items are deliberately deferred so they cannot expand or destabilize
the parity migration:

- PWA: reconsider after production performance and repeat-visit behavior are
  measured. Require a clear install, offline, or notification use case before
  adding service-worker complexity.
- Android or iOS wrappers: evaluate as separate products only if browser and
  in-app WebView testing demonstrates a customer need that responsive web
  behavior cannot satisfy.
- Telegram Mini App: reconsider after the responsive checkout flow is stable in
  Telegram's existing in-app browser. It must not fork the catalog or order
  contract.
- Admin panel: scope as a separate authenticated system after storefront
  parity. It must use server-side authorization and must not expose existing
  Cloudflare or Telegram secrets.
- Visual redesign: begin discovery only after functional parity, baseline QA,
  and owner approval of the migrated storefront. Preserve the current brand
  until that work is separately approved.

The owner still needs to name the real Android, iPhone, and narrow-WebView
devices available for final acceptance testing.
