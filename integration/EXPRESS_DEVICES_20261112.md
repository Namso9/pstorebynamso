# Express VPN device wording - 2026-11-12

Owner authorized web, bot and admin update, deployment, commit and push.
Title: Express VPN (ios and mac os only).
Website device paragraph replaced with the exact owner-supplied notice;
text is stored using ASCII JSON escapes. Existing expressvpn URL, logo,
plan IDs, prices, stock and checkout contracts are preserved.

Bot/admin share SQLite product 160. Scoped operation:
admin panel/files/ops/update_express_display.py. Offline dry-run/apply/repeat
checks passed. VPS operation applied one product; repeat changed zero.
Private rollback: /root/pstore-ship-backups/express-display-20261112/store.db.
Both services active; no restart or source deployment required.

Website release copy: .release/express-ios-20261112, base ef28505.
Latest upstream catalog preserved. Build mirrors current root JSON to public,
including the existing upstream Zoom plan-name edit. Primary dirty work retained.
Lint (four existing warnings), typecheck, build, CSP, commerce, live-data,
migration and exported exact-title/description/logo checks passed.
npm audit: zero vulnerabilities.
Production deployment: bed8435e.pstorebynamso.pages.dev.
Rollback deployment: 19748e80.pstorebynamso.pages.dev.
Public Express page exact title and description verified; no browser/order.
GitHub JSON publication and final asset verification follow below.
