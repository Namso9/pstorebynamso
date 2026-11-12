# AI Movie credit labels - 2026-11-12

Owner screenshots showed stale website tiers (200/300/500), while the panel
correctly showed 220/330/550. The design override masked current catalog names.
AI Movie labels now use runtime catalog names; static fallback labels agree.
Checkout IDs, prices, fulfillment and all unrelated design labels are preserved.
The build also mirrors the already-published Duolingo rename into public JSON.

Live shared bot/admin catalog dry-run: plans=4 changed=0. Both services active.
Only 100 credits uses automatic code-c delivery; larger tiers remain manual.
Bot bundle tests (4) and panel operation tests (2) pass using offline fixtures.
Website lint (four existing warnings), typecheck, build, CSP, commerce,
migration, exported labels/prices and full npm audit (zero findings) pass.
Dependency lock matches the reused installation. No customer order was made.
Release checkout: .release/ai-movie-labels-20261112, based on upstream 010f55a.
Original dirty checkouts preserved. Deployment verification follows below.
