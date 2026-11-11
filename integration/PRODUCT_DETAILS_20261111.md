# Product descriptions release - 2026-11-11

Owner authorized descriptions, commit, push and production deployment.
Release checkout: .release/product-details-20261111, based on upstream 601b1a1.

Ten owner-supplied Burmese descriptions populate 12 product pages: Jump Jump,
Bioscope, Happ/Premium VPN Key, Zoom Pro, Zoom Business, CapCut, AI Movie Bot,
Spotify US/Canada/Individual, Grammarly and Snapchat. Text is stored as ASCII
JSON escapes, preserving displayed paragraphs. The AI Movie tutorial post /563
is clickable, keyboard accessible and styled for both themes.

Includes the pending CapCut display correction to 7 months / 110,000 Ks and
Hiddify-to-Happ display rename. Existing happ checkout IDs, legacy product URL,
FAQs and server locations are preserved. Current upstream root catalog and
Functions are unchanged; the public fallback mirror is synchronized with the
root catalog, preserving current prices and bot links. Unrelated primary
checkout edits are excluded. No bot/admin live database access or mutation.

Lint (four existing warnings), typecheck, build, CSP, commerce/live-data and
migration checks pass; all 12 exported descriptions match their JSON text
exactly and the tutorial is an actual link. npm audit: zero vulnerabilities.
No browser automation or live order. Production publication/verification pending.
Rollback: bffb83dd-1416-47ee-a114-4b1193ecfb33.
