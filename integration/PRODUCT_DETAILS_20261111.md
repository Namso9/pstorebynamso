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
No browser automation or live order. Production publication/verification complete.
Rollback: bffb83dd-1416-47ee-a114-4b1193ecfb33.

Production source f2c5bb0b1eb27c5b158a511b371614910bd9a4d1 is pushed to main.
Deployment: 17050485-c816-42d3-a40a-99c76cf0e9cb.
Live: https://pstorebynamso.com/.
Immutable: https://17050485.pstorebynamso.pages.dev/.
All 12 live descriptions match the stored text. Tutorial link, Happ locations,
CapCut 7-month label and CSP pass. All 14 checked live CSS/JS assets match the
verified export. Public catalog matches the release root catalog exactly.
Post-publication verification is recorded locally; no duplicate deploy needed.

## Additional descriptions - batch 2

Added the owner's 12 further descriptions to 13 routes: ExpressVPN, Nord, Proton, Canva, Picsart Gold, ChatGPT Plus, Quillbot, TIDAL,
Netflix (both Premium pages), Office, Coursera and Telegram. Existing names,
prices, IDs, order contracts and earlier descriptions are preserved.
All 25 exported descriptions match stored text; 12 previous entries unchanged.
Lint (four existing warnings), typecheck, build, CSP, commerce and migration pass.
This batch changes content only. Dependency audit evidence from the first
release remains valid: package manifest and lockfile are unchanged.
Publication complete. Rollback: 17050485-c816-42d3-a40a-99c76cf0e9cb.

Batch 2 is LIVE: source 28d056a2f36af603442052ae975623bcd6691154 pushed to main.
Production deployment: c5c43502-0806-4aa5-95f5-24974f6cd337.
Immutable: https://c5c43502.pstorebynamso.pages.dev/.
All 25 descriptions match on https://pstorebynamso.com/; tutorial link, Happ
locations, CapCut label and CSP pass. All 14 checked CSS/JS files match the
export. Public catalog matches the release catalog. No live order submitted.

## Obsolete Netflix Basic FAQ removal

Owner requested removal of the Phone/Tablet/PC Premium-versus-Basic FAQ
because Basic is no longer sold. Removed that single product FAQ, preserving
all other questions, product details and catalog entries. Publication pending.
Rollback: c5c43502-0806-4aa5-95f5-24974f6cd337.
