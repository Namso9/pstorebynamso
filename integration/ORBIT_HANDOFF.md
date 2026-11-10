# New storefront commerce integration

Prepared locally on 2026-11-09. No deployment, push, commit, live order,
production database access, or bot/panel/databot service changes were performed.

## Source and boundaries

- Target: /Users/ymp/Desktop/newsite_clean/orbit (standalone, no Git root).
- Reference: /Users/ymp/Dev/pstore-core/.release/express-two-plans,
  clean release 344d0ef, recorded as deployed in PStore Core STATUS.md.
- The older main storefront checkout is dirty and behind the documented release.
  It was inspected but not modified or used as the catalog baseline.
- Before-integration source/config backup:
  /private/tmp/pstore-newsite-before-integration.tar.gz (no environment files).
- Retired standalone Next API handlers are retained outside the source tree at
  /private/tmp/pstore-previous-next-api-20261109.

## Connected contracts

1. Root products.json is the public build fallback. The existing Pages Function
   serves its live version from Namso9/pstorebynamso/main/products.json.
   Admin panel web_sync.py remains the writer. No private DB access in the site.
2. One shared CatalogProvider fetches /products.json every five seconds while
   visible and refreshes on focus. Unchanged data preserves the catalog reference.
   Product grids, search, plan dialogs, details, and checkout consume the catalog.
3. The new visual adapter preserves product IDs, plan IDs, group labels,
   ask-price semantics, bot eligibility, stock flags, and canonical asset paths.
   Routes retain existing new-design slugs even when product names change.
   Newly added products have a query-based detail page without another export.
4. Website purchases use /payment/?product=<catalog-id>&plan=<catalog-plan-id>.
   Eligible plans also use the existing Telegram buy-product-plan deep link.
5. Existing Cloudflare functions are retained for order, live catalog/content,
   live images, interest tracking, Bioscope downloads and VLESS locations.
   Non-ASCII legacy text is represented with escapes/entities in source files.
6. Existing multipart POST /api/order contract is retained: product, product_id,
   plan_id, name, contact, payment, screenshot, phone, customer_mail, customer_pw,
   note and extra_field_hp. Telegram notification, optional panel ingestion,
   stock warnings and image-type behavior remain in the reference handler.
7. The reference checkout form/flow preserves entered data and completed results
   during a stock flip. Invalid targeted checkout links do not invite a transfer.
   Per-selection form baselines are retained; newly published IDs can prefill.
8. Reviews, product FAQs, trending cards and Bioscope guide content retain the
   new-design local data. Bioscope download URLs still use the existing API.
9. Legacy category URLs redirect to the corresponding new category pages with
   app-product-id anchors. /payment/ aliases the new order design. Legacy legal,
   review and Express guide URLs redirect to the new site instead of importing
   the old page designs.

## Hosting and local preview

The site now exports to out/ with trailing slashes and unoptimized images.
Pages Functions remain in the root functions/ folder. The build generates
per-route CSP script hashes in out/_headers. Root/public header templates match.
Existing Google font files are now self-hosted from public/fonts/ so builds do
not depend on downloading fonts.

- npm run dev: design development; Pages Functions are not executed by Next dev.
- npm run build: synchronize public JSON, export Next, generate CSP headers.
- npm start: Wrangler Pages preview on http://localhost:3000, including Functions.
  The pinned Wrangler version is invoked through npx; first use may need internet.
- cloudflared tunnel --url http://localhost:3000: phone/share preview.

Existing Cloudflare project settings and server-only bindings must be preserved
when this source replaces the old storefront. Required order notification
binding names remain BOT_TOKEN and at least one of ADMIN_CHAT_ID, ADMIN_IDS,
SALE_GROUP_ID. Optional panel bindings remain PANEL_INGEST_URL,
PANEL_INGEST_TOKEN and PANEL_CLICK_URL; FB_PAGE_LINK and existing location API
settings also remain supported. No credentials were copied into source files.
Local state, environment files and .dev.vars files are ignored.

Do not replace or point the panel's public-catalog repository at a new empty
repository. The existing products.json, data/, images/ and public-data publisher
paths must remain available in the existing deployment repository. A later
release should overlay this prepared app while preserving the publisher-owned
root data/assets and the Cloudflare project's bindings, domain and Access rules.

## Verification and limits

Passed: static build, TypeScript, CSP verification, offline live-data proxy
checks, and offline commerce fixtures for 46 products: ID preservation,
price/stock updates, reordered plans, retired products, checkout URLs, assets,
mocked Telegram delivery and mocked panel mirror. Pages Functions compiled
successfully using installed Wrangler 4.120.0.

Lint has zero errors and nine warnings (legacy unused catch variables and
existing raw image elements).

Browser/phone interaction was not automated. Local Wrangler runtime startup was
blocked by sandbox loopback binding permissions and file-watcher limits; no
preview server was left running. Actual Telegram delivery, panel ingestion,
Cloudflare production bindings, and production catalog freshness remain for an
authorized staging/live check. The old site and backend services remain live as
before. npm registry access was unavailable here; a new Wrangler dependency was
not added to the lockfile. Dependency lockfile is unchanged. Offline npm audit
reported zero vulnerabilities; this does not replace a fresh online audit.
All imported/changed text files are ASCII; the Functions match the recorded
import hashes. Do not include environment files, .wrangler state or node_modules
in a later source handoff.

## Next step

Owner reviews the new Pages preview locally. Then prepare a staging deployment
in the existing Cloudflare Pages project and verify public catalog freshness,
checkout paths, and panel receipt before authorizing production replacement.


## Design correction after owner review

The imported legacy checkout UI was rejected by the owner. Active /order/ and
/payment/ now use the original new-design WebsiteOrder component, restored from
the pre-integration backup. Its existing sections, collapsed QR control,
spacing, headings and confirmation panel are retained. Its submit handler maps
to the existing multipart API contract and stable live catalog IDs. The
replacement checkout stylesheet and extra Buy in bot action in plan dialogs
were removed; the original single Order button and detail-page Buy now style
are restored. Telegram checkout links are connected behind the original
Other ways to buy link. The imported legacy CheckoutFlow components remain
unused reference code and are not routed into the active pages.

Product FAQs also retain the original per-product mapping in
src/data/product-faqs.json. Category-wide legacy FAQ data must not override
these curated lists. Products without assigned FAQs show no FAQ section.

## Owner-requested presentation rollback

Restored original product names, descriptions, icons, short plan labels, review
content, trending snapshot, Bioscope guide content and global CSS. The adapter
keeps presentation separate from live prices, stock and stable commerce IDs.
Plan-label mappings are stored by canonical ID, never by live array position.
New backend products/plans without a curated mapping use their catalog text.
Removed the added legacy legal/reviews/Express pages and redirected old links.
The owner explicitly retained product-specific checkout fields and availability
behavior, plus visit/product/search tracking. API handlers, bot links and panel
order submission remain connected. No backend service or database was changed.
