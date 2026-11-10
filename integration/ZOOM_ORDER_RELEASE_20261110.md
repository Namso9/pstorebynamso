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
