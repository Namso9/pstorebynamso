# Zoom and order UI release - 2026-11-10

Owner authorized commit, push and production deployment. Prepared on current
upstream fe3aaec. Zoom Business: 300 participants / one month / 50,000 Ks;
500 participants / one month / 90,000 Ks. Manual website orders collect email.
Pro labels use duration + 100 p, preserving prices and IDs. Contact help stays
visible. Three policy links have blue/underline/focus styles in both themes.
Premium Store naming preserves carousel behavior. Trending is unchanged.

Only the Zoom addition and Pro plan text modify current catalog data; unrelated
products/content, Functions and current dependencies are retained. The older
primary checkout catalog is not published.

Lint (four old warnings), typecheck, build, CSP, commerce/live-data, migration,
and both Business tier order checks pass. Audit: zero vulnerabilities.
Export: 74 HTML files, 50 redirects, 206 local references. Identical frontend
source passed Chrome mobile checks at 360/390/430 in both themes; screenshots
inspected at 360px. No live order or message submitted.
Rollback: 8eac5720-d114-47d2-8532-702e44b3ffe7.

Production upload and verification pending. The skip prefix avoids a competing
automatic deployment; the verified export is uploaded directly.

Production verification COMPLETE: source f7d8f0196f39fdcdc236493e2d0eedfb03059683
pushed to main. Deployment 4357581e-1927-48e2-b548-4d4ab3788e5c is live at
https://pstorebynamso.com/ (immutable https://4357581e.pstorebynamso.pages.dev/).
All 14 served order CSS/JS files match the verified export. Live catalog now
contains Zoom Business with both correct prices and Pro's 100 p labels.
GitHub raw temporarily served stale data; the public feed has now refreshed.
Production 360px browser check confirms contact help and styled policy links,
without horizontal overflow. No live order or message submitted.
