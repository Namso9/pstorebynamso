# Live weekly trending - 2026-11-15

Replaced the frozen November 6 homepage snapshot with runtime requests to
/data/popular.json and /products.json. Uses the existing visitor-interest
ranking, not sales. Refreshes every five minutes; missing, invalid, empty or
more-than-48-hour-old rankings hide the section without a snapshot fallback.
Catalog resolves current prices, stock and product-ID detail links.

Owner authorized fix, commit, push and production deployment. Release checkout:
.release/live-trending-20261115, based on upstream b206097. Existing primary
checkout changes preserved. No production customer data or orders accessed.

Validation: focused synthetic ranking tests, lint (four existing warnings),
typecheck, static build, strict CSP, live-data proxy and commerce checks pass.
Dependency audit: zero vulnerabilities. Browser automation not used.
Deployment: pending GitHub-connected Cloudflare Pages pipeline.
