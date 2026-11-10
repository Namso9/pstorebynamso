# Gemini retirement - 2026-11-10

Scope: remove Gemini plans from sale across bot, website and admin. Owner
explicitly authorized commit, push and deployment. Existing order/plan records,
wallets, inventory and IDs are retained. Plans are hidden in SQLite; public
Gemini plans are empty. The operation writes a private SQLite backup before
changing visibility and is idempotent. It does not delete inventory or history.

## Serial queue

| Task | Owner / root | Dependencies | Check / done gate |
| --- | --- | --- | --- |
| G1 retire catalog | admin panel/files; bot owns store.db | known Gemini mappings | fixture dry/apply/repeat/rejection, backup and unrelated-row preservation |
| G2 bot availability | premium_store_bot | hidden Gemini plans | Gemini stays visible/OOS; no plan controls; existing hidden-plan guards reject old IDs |
| G3 admin view | admin panel/files | G1 | zero available plans, archived records collapsed |
| G4 storefront | pstorebynamso release checkout | G1/G2/G3 | empty plans, OOS labels; old links render no form; POST rejects before external effects |
| G5 publish/deploy | all three repositories | all gates and existing bot-work permission | commit/push, normal VPS deployment, catalog operation, Pages upload; verify services and public state |

Checks: two bot tests and three panel tests pass on Mac and isolated VPS Python
3.12. The read-only live preflight finds two Gemini plans needing retirement.
Website lint (four existing warnings), typecheck, static build, CSP, commerce,
live-data and migration checks pass. Both old Gemini IDs return mocked HTTP 409
without Telegram/panel calls. At mobile 360px, Gemini detail has no plans or
purchase links; its old order URL has an OOS notice, no form, password or
receipt input, and no overflow. No actual order/message submitted.
Dependencies/build configuration are unchanged from the prior clean release
audit. The pending Stealth Writer 50,000 Ks and mobile spacing update is also
prepared in the release checkout and passed these checks.

Existing bot icon/menu edits in five files are already deployed but uncommitted.
Their original bytes match the VPS. The owner approved preserving these reviewed existing
changes in a checkpoint commit (2a1147d). Bot feature commit 61f028f and panel
commit a3d3e85 are pushed after all cross-project gates passed. Normal VPS
deployment and live data application are in progress.
All work is prepared and retained; do not discard the existing icon changes.

Restoring Gemini later requires explicit re-enabling of its archived plans,
public catalog and the server-side paused-product guard together.

Final tidy-UI check removes empty product details and old sales FAQs while
Gemini has no plans. The rebuilt export passes all web gates.
