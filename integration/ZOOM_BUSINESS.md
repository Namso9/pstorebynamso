# Zoom Business and trending review - 2026-11-10

Status: implemented and verified locally; not published.

Zoom Business is immediately after Zoom Pro in Creative Apps. The same image,
brand color, logo class, product page, plan picker, dialogs and order layout are
used. Two plans: 300 participants / 1 month / 50,000 Ks, and 500 participants /
1 month / 90,000 Ks. Product ID zoom_business; plan IDs 300p_1_month and
500p_1_month. Email collection matches Zoom Pro. Existing Zoom Pro plans and
all other products are unchanged.

The new plans use the existing manual website order path. No bot inventory or
fulfillment mapping exists for these new IDs, so no product bot deep link is
enabled. The existing multipart POST /api/order and backend code are unchanged.
Both tiers were verified with offline rendering and mocked Telegram/panel
requests, including the correct product ID, plan ID and customer_mail.
No live order or message was sent.

The primary checkout retains its older 47-product catalog; it now has 48 with
this addition. Production was checked read-only and has the current 46-product
catalog, without Zoom Business. Future publication must insert only the new
product into current upstream data, preserving all newer panel changes.
integration/ZOOM_BUSINESS_CATALOG_PATCH.json contains that exact product block.
Do not publish the entire older local catalog over upstream. A live catalog
refresh from unchanged production will not include the new product until the
catalog addition is published.

## Trending This Week

The current component imports src/data/trending-snapshot.json and never fetches
the public ranking. That snapshot is dated 06 Nov 2026. The public
https://pstorebynamso.com/data/popular.json was checked read-only and is dated
10 Nov 2026; its current ranking differs from the displayed snapshot. The
snapshot can be historical ranking data, but the component does not establish
its provenance or keep it current. It must not be described as live customer
purchase data.

The backend ranking code in admin panel/files/web_popular.py sums anonymous
plan/checkout clicks over seven days, caps each product at five clicks per
minute, folds old Express product IDs, and excludes clicks from the popular
row and site-wide visits/sessions/search events. The panel publishes ranking
IDs to data/popular.json. These are visitor-interest signals, not completed
sales, unique customers or verified buyers. No customer records were queried.
resolveTrending exists in src/lib/trending.ts but the current homepage does not
call it. Trending was inspected only and left unchanged as requested.

## Validation

Lint passes with four existing warnings. Typecheck, static build, strict CSP,
offline commerce/live-data, migration and targeted two-tier email/order checks
pass. Export has 75 HTML files, 50 redirects and 207 checked local references.
Both prices and the matching Zoom image/class appear in the exported product
page; category card placement is after Zoom Pro and before Telegram Premium.
The local dependency audit still has 16 pre-existing findings (7 moderate,
8 high, 1 critical); dependencies were not changed. The published release's
separate clean audit is documented in RELEASE_20261110.md.

No commit, push, deployment, production catalog write, bot/panel change or
production configuration change was made. Prior naming/recovery edits remain
uncommitted and preserved.
