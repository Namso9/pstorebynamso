# Next.js Main Migration Plan

## Goal

This is the main technical plan for converting the current static HTML, CSS,
and JavaScript website to a Next.js React application while:

- Preserving the current design, content, product data, links, and checkout flow.
- Adding smooth scroll-based animation and page transitions.
- Reusing components instead of repeating markup across pages.
- Keeping the existing Cloudflare Pages Functions and API behavior.
- Preserving existing public URLs and search engine metadata.
- Treating mobile as the primary customer experience.
- Keeping the site ready for a future WebView wrapper without requiring one.

## Current Website

The project currently has no build system or frontend framework.

### Pages

- `index.html`: Home page and category cards.
- `creative-apps.html`: Creative products.
- `music-apps.html`: Music products.
- `communication-apps.html`: Communication products.
- `streaming-apps.html`: Streaming products.
- `computer-keys-and-office-apps.html`: Computer and office products.
- `learning-apps.html`: Learning products.
- `ai-apps.html`: AI products.
- `premium-vpn-apps.html`: VPN products.
- `expressvpn-location-guide.html`: ExpressVPN location guide.
- `payment.html`: Payment platform and QR selection.
- `order.html`: Order form and screenshot upload.
- `reviews.html`: Customer review gallery and lightbox.
- `terms-of-service.html`: Store terms.
- `terms-of-service-vpn.html`: VPN terms.
- `404.html`: Not-found page.

### Frontend files

- `style.css`: Main styles.
- `assets/components.css`: Shared component styles.
- `assets/theme.css`: Theme variables and dark mode styles.
- `assets/app.js`: Shared header, search, catalog, plan modal, checkout modal, and order summary behavior.
- `assets/theme.js`: Theme state stored in `localStorage`.
- `assets/faq.js`: FAQ loading and accordion behavior.
- `assets/payment.js`: Payment platform selection.
- `assets/order.js`: Order form validation and submission.
- `assets/reviews.js`: Review gallery and lightbox.
- `assets/expressvpn-guide.js`: ExpressVPN guide rendering.

### Data and server endpoints

- `products.json`: Settings, 8 categories, 36 products, and product plans.
- `/data/faq.json`: FAQ content.
- `/data/reviews.json`: Review image list.
- `/data/express-guide.json`: ExpressVPN guide content.
- `POST /api/order`: Existing order submission endpoint.
- `functions/`: Existing Cloudflare Pages Functions.

The React migration must not expose or move these server environment variables
into client code:

- `BOT_TOKEN`
- `ADMIN_CHAT_ID`
- `FB_PAGE_LINK`
- `PANEL_INGEST_URL`
- `PANEL_INGEST_TOKEN`

## Recommended Stack

- Next.js with the App Router and static export.
- React with TypeScript and TSX.
- Tailwind CSS for responsive layout and reusable design tokens.
- Motion for React for scroll reveals, transitions, and modal animation.
- Existing CSS migrated gradually without redesigning the site first.
- Native `fetch` for the existing JSON and order endpoints.
- Cloudflare Pages for hosting the static `out` directory.
- Existing Cloudflare Pages Functions for data and order APIs.

No database or backend rewrite is required.

Do not add Vite or React Router. Next.js provides the build system and routing.
Do not add GSAP or Lenis during the initial migration. Motion is sufficient and
lighter for the mobile-first launch.

## Proposed Project Structure

```text
functions/
  api/order.js
  data/[file].js
  img/[name].js
  products.json.js
public/
  data/
  images/
  products.json
  _headers
  _redirects
  robots.txt
  sitemap.xml
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    loading.tsx
    not-found.tsx
    [category]/
      page.tsx
    expressvpn-location-guide/
      page.tsx
    payment/
      page.tsx
    order/
      page.tsx
    reviews/
      page.tsx
    terms-of-service/
      page.tsx
    terms-of-service-vpn/
      page.tsx
  components/
    layout/
      SiteHeader.tsx
      SiteFooter.tsx
      PageLayout.tsx
      BackButtons.tsx
    catalog/
      CategoryCard.tsx
      ProductCard.tsx
      ProductGrid.tsx
      ProductSearch.tsx
      PlanModal.tsx
      CheckoutModal.tsx
    common/
      AnimatedSection.tsx
      Button.tsx
      LoadingState.tsx
      ErrorState.tsx
      Modal.tsx
      ThemeToggle.tsx
    faq/
      FAQList.tsx
      FAQItem.tsx
    order/
      OrderSummary.tsx
      OrderForm.tsx
    payment/
      PaymentSelector.tsx
      PaymentPanel.tsx
    reviews/
      ReviewGrid.tsx
      ReviewLightbox.tsx
  hooks/
    useCatalog.ts
    useTheme.ts
  services/
    api.ts
  styles/
    components.css
    pages.css
next.config.ts
package.json
tsconfig.json
```

## Route Plan

Use clean routes as the primary URLs:

```text
/
/creative-apps
/music-apps
/communication-apps
/streaming-apps
/computer-keys-and-office-apps
/learning-apps
/ai-apps
/premium-vpn-apps
/expressvpn-location-guide
/payment
/order
/reviews
/terms-of-service
/terms-of-service-vpn
```

The old `.html` URLs must redirect to the matching clean routes so existing
bookmarks, search results, and shared links continue to work.

Next.js must statically generate each route at build time. The 8 category
slugs must be returned by `generateStaticParams`. The project must use
`output: "export"`, `trailingSlash: true`, and unoptimized Next.js images so it
can deploy as static files to Cloudflare Pages.

Product links must continue to support:

- Product hashes such as `#app-PRODUCT_ID`.
- Checkout query parameters such as `?product=PRODUCT_ID&plan=PLAN_ID`.
- Forwarding the query parameters from the payment page to the order page.

## Component Migration

### Shared layout

Replace the header and modal HTML currently injected by `assets/app.js` with
React components. Use one shared header, footer, search modal, and theme toggle
for every route.

### Product categories

Replace the 8 repeated category page templates with one `CategoryPage`.
The route slug selects the correct category, products, title, subtitle, and FAQ
content from JSON.

### Catalog and checkout

Move product rendering, plan selection, product search, and checkout choice
logic from `assets/app.js` into React state and reusable components. Keep
`products.json` as the single source of truth.

### FAQ

Replace DOM event listeners from `assets/faq.js` with controlled React
accordion items. Continue loading FAQ content from `/data/faq.json`.

### Payment

Move the platform selector from `assets/payment.js` into React state. Keep all
current QR images, payment warnings, and order links unchanged.

### Order form

Move `assets/order.js` behavior into a controlled React form while preserving:

- Existing field names and validation limits.
- Product and plan prefill from query parameters.
- Conditional email and password fields.
- Screenshot type and size checks.
- `multipart/form-data` submission to `POST /api/order`.
- Current timeout, success, out-of-stock, and error behavior.

### Reviews

Replace `assets/reviews.js` with a React gallery and accessible animated
lightbox. Continue loading `/data/reviews.json`.

### ExpressVPN guide

Replace string-based HTML rendering with React components. Continue loading
`/data/express-guide.json` and preserve all current guide details.

## Mobile-First Requirements

Mobile is a required part of the implementation, not a later improvement. The
majority of customers use phones, so every component must be designed for the
small screen first and then expanded for tablet and desktop.

### Required mobile behavior

- Primary design widths are 360px, 390px, and 430px.
- Also test 768px tablet and 1024px or wider desktop layouts.
- No horizontal overflow at any supported width.
- Buttons and interactive controls must have at least a 44px touch target.
- Form inputs must use at least 16px text to avoid unwanted mobile zoom.
- Product cards, modals, QR panels, and forms must fit without clipped content.
- Checkout actions must be easy to reach with one hand.
- Sticky controls must not cover form fields, warnings, or browser controls.
- Use `safe-area-inset-*` spacing where a fixed element touches a screen edge.
- The order form must work with the mobile keyboard and native image picker.
- Back navigation, product hashes, and query parameters must work on mobile.
- Images must be responsive, lazy-loaded where appropriate, and compressed.
- Motion must remain smooth on mid-range Android phones.
- Essential checkout behavior must work when reduced motion is enabled.

### Mobile performance target

- Keep client components limited to sections that need interaction.
- Render static content as Next.js server components where possible.
- Avoid large animation bundles and continuous background animation.
- Use transform and opacity for animation instead of layout-heavy properties.
- Target a mobile Largest Contentful Paint of 2.5 seconds or better on a
  production build under a typical 4G connection.

### Required device testing

- Chrome on Android.
- Safari on iPhone.
- A narrow Android WebView test before production.
- Desktop Chrome or Edge for the wider layout.

## Website and WebView Decision

The main product will be a responsive website, not a native WebView application.
Customers will open it normally in Chrome, Safari, Telegram, Messenger, and
other in-app browsers.

The website will be WebView-ready by using responsive layout, safe-area spacing,
standard navigation, touch-friendly controls, and native file input. A dedicated
Android WebView wrapper, iOS wrapper, Telegram Mini App, or PWA can be added as a
separate phase later. The first migration must not depend on a wrapper.

## Animation Plan

Use animation to improve the site without making navigation slow or difficult.

### Initial animations

- Fade and slide the hero content into view.
- Reveal category and product cards as they enter the viewport.
- Stagger cards in each grid.
- Add subtle hover and press feedback to buttons and cards.
- Animate FAQ opening and closing.
- Animate search, plan, checkout, and review modals.
- Add a short route transition between pages.
- Smoothly scroll to products and selected product hashes.

### Animation rules

- Do not use scroll hijacking.
- Do not delay checkout or order form interactions.
- Keep mobile animations lightweight.
- Respect the `prefers-reduced-motion` setting.
- Avoid animating large QR images or payment instructions.
- Use transform and opacity where possible for better performance.

## Migration Phases

### Phase 1: React foundation

1. Add Next.js, React, TypeScript, Tailwind CSS, and Motion.
2. Configure the Next.js App Router and static export.
3. Add `next.config.ts` with `output: "export"`, `trailingSlash: true`, and
   `images.unoptimized: true`.
4. Move static files required at runtime into `public`.
5. Keep `functions` at the repository root for Cloudflare Pages.
6. Configure local Cloudflare development for `/api`, `/data`, `/img`, and
   `/products.json` after generating the static `out` directory.

### Phase 2: Shared UI

1. Create the page layout, header, footer, theme toggle, and back buttons.
2. Create reusable modal and animation components.
3. Move global CSS without redesigning the site.
4. Build every shared component mobile-first.
5. Confirm 360px, 390px, 430px, tablet, and desktop behavior before migrating
   page-specific content.

### Phase 3: Catalog

1. Add a catalog service for `products.json`.
2. Migrate the home page.
3. Migrate all category pages to one dynamic component.
4. Migrate search, plan modal, checkout modal, hashes, and query parameters.

### Phase 4: Content pages

1. Migrate FAQ content and accordion behavior.
2. Migrate reviews and the lightbox.
3. Migrate the ExpressVPN guide.
4. Migrate both terms pages.
5. Add the React not-found page.

### Phase 5: Payment and order flow

1. Migrate the payment selector and QR panels.
2. Migrate the order summary and form.
3. Verify the exact multipart form payload sent to `/api/order`.
4. Test Telegram delivery and optional panel mirroring in a safe environment.
5. Verify out-of-stock handling against the live product data.

### Phase 6: Animation and polish

1. Add hero and section reveal animations.
2. Add card staggering and interaction feedback.
3. Add modal and route transitions.
4. Test reduced-motion mode and real mobile performance.
5. Test normal mobile browsers and an Android WebView.
6. Remove the legacy frontend JavaScript only after feature parity is complete.

### Phase 7: Deployment

1. Set the Cloudflare Pages build command to `npm run build`.
2. Set the output directory to `out`.
3. Preserve all security and cache headers from `_headers`.
4. Add old `.html` URL redirects to `_redirects`.
5. Verify that `/api/order`, `/products.json`, `/data/*`, and `/img/*` still
   execute through Cloudflare Pages Functions.
6. Update `sitemap.xml` and canonical metadata to the clean routes.

## SEO and Metadata

Each route must preserve its current:

- Page title.
- Meta description.
- Canonical URL.
- Open Graph metadata.
- Structured data where present.

Use the Next.js Metadata API for page titles, descriptions, canonical URLs, and
social metadata. Each important route must be present in the static export so
search crawlers receive useful HTML without waiting for client JavaScript.

## Testing Checklist

### Navigation

- Every clean route loads directly after a browser refresh.
- Every old `.html` URL reaches the correct new route.
- Header, footer, back buttons, and external links work.
- Unknown routes display the not-found page.

### Catalog

- All 8 categories and 36 products load.
- Search finds products and opens the correct category/product.
- Product plans, prices, stock states, and contact links match the JSON data.
- Product hashes open or scroll to the correct product.

### Checkout

- Product and plan query parameters survive the full flow.
- Telegram deep links are generated only for supported plans.
- Payment selection displays the correct QR and instructions.
- The order form sends the exact existing field names and screenshot file.
- Success, error, timeout, and out-of-stock states are clear.

### UI

- Theme mode persists across refreshes.
- Modals trap focus, close with Escape, and restore focus.
- Animations work on desktop and mobile.
- Reduced-motion mode disables nonessential movement.
- No layout shift hides payment or order controls.
- Layout works without horizontal overflow at 360px, 390px, and 430px.
- Touch controls, mobile keyboard behavior, and image upload work on phones.
- The production build remains responsive on a mid-range Android device.

### Deployment

- Cloudflare security headers remain active.
- Product and panel-managed JSON data still updates without rebuilding React.
- Payment QR images are not served from a stale immutable cache.
- Cloudflare environment variables remain server-only.

## Migration Safety

- Perform the migration in phases instead of deleting the static site first.
- Keep the current HTML and JavaScript available until the React version reaches
  feature parity.
- Do not change the order API during the frontend migration.
- Do not rename images or product IDs unless all live data and links are updated.
- Do not commit secrets, Cloudflare variables, or Telegram credentials.
- Deploy a preview and test the real payment and order flow before production.

## Documentation Plan

Keep this file as the main technical migration document. Do not create a new
Markdown file for every small idea.

Use these documents when needed:

- `NEXTJS_MIGRATION_PLAN.md`: Main architecture and migration source of truth.
- `PROJECT_REQUIREMENTS.md`: Business, design, mobile, and customer requirements.
- `TODO.md`: Current tasks, priorities, and unresolved fixes.
- `CHANGELOG.md`: Completed user-visible changes after development starts.

Mobile-first behavior is already mandatory in this migration plan. Add future
requirements to `PROJECT_REQUIREMENTS.md` and implementation tasks to `TODO.md`.

## Default Decisions

Unless changed before implementation, use these defaults:

- Next.js App Router with React and TypeScript/TSX.
- Next.js static export with clean routes and old `.html` redirects.
- Tailwind CSS for mobile-first responsive layout.
- Motion for React for animation.
- Preserve the current visual design during migration.
- Treat 360px to 430px mobile screens as the primary experience.
- Deliver a responsive website that is WebView-ready, not WebView-dependent.
- Add animation after functional parity, not before.
- Keep the existing Cloudflare Pages Functions unchanged.
