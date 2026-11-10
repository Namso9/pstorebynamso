# Website source consolidation

2026-11-10 production release: COMPLETE; owner phone acceptance: PASS.
Code e2015e8 is committed and pushed to main. Cloudflare production deployment
461c0ba0-e52c-4034-aadf-a300f73931dc is live at https://pstorebynamso.com/.
Home, Music and ChatGPT return HTTP 200 with CSP; all 14 homepage CSS/JS
assets match the verified export byte for byte. Release checks pass, with
four existing lint warnings and zero npm audit vulnerabilities. Current upstream
catalog, content, dependencies and Pages Functions are retained. No live order
was submitted. See integration/RELEASE_20261110.md. Older preview/pending
entries below are historical and superseded by this accepted release.

2026-11-10 release acceptance: PASS. The owner approved the final phone test
and authorized commit/push/production deployment. Release source is prepared
on upstream 48512b2 in /private/tmp/pstore-ios-motion-release-20261110, keeping
the current 46-product catalog and dependency security fixes. All checks pass;
the release dependency audit reports zero vulnerabilities. The local approved
checkpoint is 107f4f0. See integration/RELEASE_20261110.md for publication state.
Older pending-preview and dependency findings below are historical.

2026-11-10 owner phone acceptance: PASS. The owner confirmed all changes in
the final 9d924b8d preview work on a phone and explicitly authorized commit,
push and production deployment. Release preparation preserves current upstream
catalog/content and dependency fixes. Production verification will be recorded
after deployment. Older pending-preview entries below are historical.

iOS-inspired motion refinement (2026-11-10): PREVIEW, PHONE TEST PENDING.

- Native forward/back navigation now uses opaque, layered push/pop movement
  with matched 440ms timing. The previous page recedes beneath the next page;
  the reverse direction reveals it. Header stays stationary.
- Dialogs retain their different directions, with shorter travel and restrained
  springs (480ms opening, 320ms closing). Home zoom is subtler. Older-browser
  and history entry use smaller directional movement without fading to blank.
  First paint, reduced motion, focus, URLs and cancellation remain protected.
- Build, lint (four existing warnings), typecheck, CSP, commerce, migration,
  carousel and motion lifecycle/CSS invariants pass. All 14 served assets
  match the build. The audit retains 16 findings; 93 protected hashes match.
- Test: https://9d924b8d.pstorebynamso.pages.dev/
  Alias: https://homepage-perf-test.pstorebynamso.pages.dev/
  Home/Music return HTTP 200 with CSP/noindex. Production remains
  001124df-b878-45d8-bf1a-d96e63e24ab4. No commit or push.
  Physical phone smoothness/visual acceptance remains pending.

Directional motion update (2026-11-10): PREVIEW, PENDING PHONE TEST.

Deployment verification: all 14 served CSS/JavaScript assets referenced by the
homepage match the final export byte for byte. Four distinct page entry/exit
styles are present. Browser/physical phone visual acceptance remains pending.

- Forward/detail navigation enters from the right; back/parent navigation
  enters from the left. Category links use their relative catalog order.
  Browser Back/Forward tracks visited routes, including Forward from home.
- Home uses a soft zoom; information pages use a vertical fade. Route entry
  lasts 420ms and exit 200ms. Native snapshots and older-browser fallback use
  matching directions. Reduced motion, immediate first paint, URLs, focus,
  cancellation and scroll cleanup are preserved.
- Search drops from above (320ms), plans rise from below (320ms), reviews
  zoom in (320ms); all close in the reverse direction (200ms).
- Lint (four existing warnings), typecheck, build, CSP, commerce, migration,
  carousel and expanded offline motion checks pass. Audit retains 16 findings.
  All 93 protected catalog/content/Function/dependency hashes are unchanged.
- Preview: https://e6ee3fd5.pstorebynamso.pages.dev/
  Alias: https://homepage-perf-test.pstorebynamso.pages.dev/
  Home/Music return HTTP 200 with CSP and noindex. Production is unchanged at
  001124df-b878-45d8-bf1a-d96e63e24ab4. No commit or push.
- Physical phone acceptance remains pending. Test both navigation directions,
  Back/Forward, search, plans and reviews in both themes and reduced motion.

Page motion refinement (2026-11-10): PREVIEW, PENDING PHONE TEST.

Owner requested the motion style from a supplied reference. The reference was
opened in Chrome and its navigation settings inspected: outgoing scale 0.92,
opacity 0, 300ms; incoming scale 1.06 to 1, opacity 0 to 1, 600ms; origin at
center top. The implementation uses existing browser APIs and adds no library.
The earlier horizontal slide is replaced; initial content stays immediate.

- Task 1 complete: snapshot current dirty source/docs and inspect the reference.
- Task 2 complete: sequential native view transitions; Web Animations fallback
  for older browsers; current URLs/options preserved; Back, rapid clicks,
  reduced motion, hidden tabs and slow routes release animations safely.
  Search results now share category/product/header/footer navigation motion.
- Task 3 complete: lint (four existing warnings), typecheck, build, strict CSP,
  offline commerce/live-data, migration routes/assets, carousel and expanded
  `node qa/motion-transition-check.cjs` pass. All 93 protected data, Function
  and dependency files match the starting hashes. Audit retains 16 findings
  (7 moderate, 8 high, 1 critical).
- Task 4 complete: owner-authorized upload to `homepage-perf-test`, deployment
  `5642067d-c46b-4182-986a-68af4fab53d7`:
  `https://5642067d.pstorebynamso.pages.dev/`, alias
  `https://homepage-perf-test.pstorebynamso.pages.dev/`. Both hosts and Music
  return HTTP 200 with motion markup, CSP and preview noindex. Production
  deployment remains `001124df-b878-45d8-bf1a-d96e63e24ab4`, verified before and
  after upload. No commit, push, catalog publication or live order was made.
  Four served stylesheets and layout JavaScript match the final export byte
  for byte; the stylesheet contains the new zoom animations.
- Acceptance pending: reference and preview rendering were inspected in Chrome;
  the new sequence still needs physical phone review. Test home/category menu
  -> Music, category switching, Back, search -> product, both themes and OS
  reduced motion. Do not infer a visual/performance PASS from the offline checks.

2026-11-10 production release `001124df-b878-45d8-bf1a-d96e63e24ab4` is live at
`https://pstorebynamso.com/`, explicitly authorized by the owner. Includes
homepage performance improvements, current category/page and dialog motion,
and the product-title double-tap shortcut. Lint, typecheck, build, CSP,
commerce, route, motion and carousel checks pass. Live homepage asset
references match the export. Chrome touch emulation passes search -> detail
-> double-tap -> plans -> close for ChatGPT Plus and Spotify on production.
Physical phone performance acceptance remains pending. Dependency audit
retains 16 findings (7 moderate, 8 high, 1 critical). Source edits remain
uncommitted. Rollback deployment is `b2551cdb-7367-43d8-80d3-071bf3a35105`.


Title shortcut verification (2026-11-10): the reported URL was
`pstorebynamso.com`, where the production build predates this shortcut.
Chrome touch emulation reproduced the missing behavior there and verified the
current preview's complete search -> detail -> double-tap -> plans -> close
flow for ChatGPT Plus and Spotify. Single taps stay closed; dialog close restores
page scrolling. Direct touch tests also passed on the original `116d2928`
preview. Browser testing was explicitly authorized by the owner. Continue
physical phone acceptance on `https://homepage-perf-test.pstorebynamso.pages.dev/`.

Motion follow-up (2026-11-10): PREVIEW VERIFIED, PENDING PHONE TEST.
Owner-authorized test upload:
`https://homepage-perf-test.pstorebynamso.pages.dev/`
(immutable `https://024bae1b.pstorebynamso.pages.dev/`, deployment
`024bae1b-eedb-4f1c-b4e9-9e341c854cc8`). This supersedes the older preview URLs
below for the cumulative performance, title shortcut and motion test.

- Task 1 complete: keep the immediate hero/section first paint and add a
  220ms transition only to visible content on pathname navigation. Header and
  footer stay still; query changes, live refreshes and hidden tabs do not
  trigger motion. Interrupted navigation cancels its animation. The temporary
  animation leaves no persistent transforms. Homepage category/trending links
  now use Next Link without prefetching, preserving their destinations.
- Task 2 complete: shared `AnimatedDialog` uses Motion's `LazyMotion`, small
  `m` components and `AnimatePresence` for plans, search and review portals.
  Entry is 160-240ms and exit is 160ms. Focus/scroll cleanup follows the exit;
  rapid reopen and overlapping dialogs retain the right focus and scroll lock.
  Search still focuses synchronously on tap. FAQ/menu CSS keeps native details
  behavior; unsupported FAQ height animation falls back to an opening fade.
  Reduced motion disables these additions. No new dependency is needed.
- Task 3 complete: lint (four existing warnings), typecheck, static build,
  strict CSP, offline commerce/live-data, migration routes/assets, carousel
  visibility and `node qa/motion-transition-check.cjs` pass. The motion harness
  checks lifecycle behavior with DOM/Motion stubs, not browser rendering.
  All 93 protected catalog/content/image/Function/dependency hashes match the
  start of this pass. `npm audit` retains 16 findings (7 moderate, 8 high,
  1 critical).
- Acceptance pending: phone views at 360/390/430px in both themes, navigation
  and browser Back, keyboard search, FAQ closing, title double-tap, review
  lightbox and OS reduced motion. Mark PASS only after owner confirmation of
  an improvement with no regressions. No browser automation, order submission,
  commit or push was performed.
- Upload verification complete: fresh build, CSP, migration and offline motion
  and carousel checks pass. Both preview hostnames and products/category/ChatGPT/
  fallback/order pages return HTTP 200. Four served stylesheets and layout
  JavaScript match the export byte for byte. Preview noindex and CSP headers
  are present. Wrangler identifies the new deployment as Preview on
  `homepage-perf-test`; production remains `b2551cdb-7367-43d8-80d3-071bf3a35105`
  on `main`, matching the production deployment ID captured before upload.

Current follow-up: source checkpoint `b956117` is committed locally. Homepage
performance steps 1-3 are implemented and uploaded for preview testing; phone
acceptance remains PENDING. See `PERFORMANCE_TEST.md`. The original import
verification below predates the authorized commit and performance edits.

Product detail follow-up (2026-11-10): all product titles now open the existing
View Plans dialog on double-tap/double-click, including the shared
`/product-details/` fallback. The current Cloudflare test preview is
`https://116d2928.pstorebynamso.pages.dev/` (alias:
`https://homepage-perf-test.pstorebynamso.pages.dev/`). ChatGPT and fallback
routes return HTTP 200; local lint, typecheck, build, CSP, commerce, migration
and carousel checks pass. Phone gesture acceptance is pending. This deployment
is a branch preview; production and Git remote are unchanged. New work remains
uncommitted.

## Milestone

Import the latest website from `/Users/ymp/Desktop/newsite_clean/orbit` into
`/Users/ymp/dev/PStore-Core/pstorebynamso`, preserving Git history, local edits,
publisher-owned catalog/content, existing Functions, and the Desktop source.

## Boundaries

- Primary project: storefront, Git root `pstorebynamso`.
- The owner explicitly authorized reading the Desktop source for this import.
- Source is a standalone Next.js app, not a separate Git repository.
- Other Codex tasks for these folders were idle during intake. Relevant source
  hashes stayed stable. No background editor was observed changing the source.
- No bot, panel, databot, account, production service, or Cloudflare setting is
  part of the change. No commit, push, deployment, or source deletion is authorized.
- Keep root `products.json`, `data/`, `images/`, and `functions/` intact.
- Keep all product/plan IDs and the existing multipart `POST /api/order` contract.
- Keep patched project dependencies and the existing package lockfile.
- Exclude environment files, local Wrangler state, dependencies, and build output
  from the import. The Desktop source remains intact after verification.

## Serial task queue

| Task | Goal and files | Dependencies and risks | Validation and done criteria |
| --- | --- | --- | --- |
| M1 | Confirm source, Git root, session stability, dirty files and data ownership. | No dependency; avoid concurrent edits and stale catalog replacement. | COMPLETE: source matches the live design; source hashes are stable; existing dirty paths identified. |
| M2 | Snapshot existing source and dirty files; import `src/`, new public assets and commerce QA; merge package scripts, CSP font permission and redirects. | M1; preserve all original bytes before replacing active source. No backend contract change. | COMPLETE: original source is recoverable; protected files, Git HEAD/refs/index, lockfile and Desktop source have unchanged hashes. |
| M3 | Verify the imported app and integration. | M2; local catalog and imported reference catalog differ, so check both. | Local import checks PASS. Online audit and the historical Zoom check have unchanged-baseline findings recorded below; this is not a clean release gate. |
| M4 | Update project and umbrella handoffs. | M3; report local checks separately from browser/production checks. | COMPLETE: project handoffs and the root status index are updated. |

Cross-project contract change: no. Bot, panel and databot retain their existing
contracts and require no changes for this source consolidation.

## Catalog ownership

The local canonical catalog contains 47 products and 103 plans, including the
older `express_phone` and `express_pc` IDs. The imported reference has 46 products
and 100 plans, including `express_vpn`. This milestone preserves local canonical
data exactly; it does not publish or reconcile catalog changes. The imported
adapter must work with either catalog and retain the same live catalog endpoint.

## Recovery

Verified local recovery directory:
`.migration-backups/20261110-orbit-source/`.

It retains the complete original `src/`, pre-existing dirty files, changed build
configuration, public catalog mirror, Git patches, index snapshot and hash
manifest. The source folder on Desktop is a second retained reference.

## Import results

- Imported 98 source files and 110 new public assets. Existing public image
  collisions were identical; canonical JSON and existing image paths were kept.
- Original 82-file source tree is retained at
  `.migration-backups/20261110-orbit-source/before/src/`.
- The recovery directory also contains `unstaged.patch`, `staged.patch`, the
  original Git index/status, changed configuration snapshots, protected data
  copies and `manifest.json`. It is ignored by Git, TypeScript and ESLint.
- Retained all 91 protected root files byte for byte: catalog, content,
  canonical images and Functions. Pre-existing tracked and untracked edits
  were verified against their active or recovery copies.
- Kept the existing package versions and lockfile. Build now explicitly uses
  webpack, matching the imported site. The root/public CSP templates and CSP
  generator only add permission for the site's self-hosted fonts.
- Preserved all 26 existing redirects and added 24 new design entry points.
- Three compatibility edits are documented in `IMPORT_ADJUSTMENTS.json`:
  hydration-safe device detection, internal footer links without prefetch,
  and exporting curated product slugs as well as local catalog slugs.
- The incoming integration notes remain in `ORBIT_HANDOFF.md` and
  `ORBIT_SOURCE_MANIFEST.json`; those describe the earlier Desktop preparation.

## Verification performed

| Check | Result |
| --- | --- |
| `npm run lint` | PASS, zero errors and four warnings. One warning is retained historical QA; three concern imported raw image elements. |
| `npm run typecheck` | PASS. |
| `npm run build` | PASS, static export with 74 HTML documents. |
| `npm run csp:check` | PASS, 227 executable inline script hashes, 86 header rules, largest line 911/2000 bytes. |
| `npm run integration:check` | PASS, offline stable IDs, plan reordering, prices/stock refresh, removal, URLs, assets, order delivery and panel mirror for the preserved 47-product catalog. All external requests mocked. |
| Imported-reference commerce fixture | PASS for the retained 46-product catalog, using `PSTORE_CATALOG_FIXTURE`. |
| `npm run migration:check -- --preservation` | PASS, 74 HTML pages, all 50 redirects, 213 local references, original edits, 91 protected files, lockfile, Git HEAD/refs/index and Desktop source. |
| `npm run content-source:check` | PASS, seven canonical FAQ sections and 33 exact review image mirrors. |
| `npm audit` | Reports 16 existing findings: seven moderate, eight high, one critical. The dependency lockfile is unchanged from before import. |
| Historical `npm run zoom:check` | Fails because its hardcoded expected prices differ from the unchanged local catalog. Catalog and check were not altered to suppress the mismatch. |

The online audit identifies existing Next.js, Wrangler and transitive dependency
advisories. Dependency updates are a separate release-readiness task. No new
dependency or dependency downgrade was introduced by this source move.

## Preview and remaining limits

- `npm run dev` starts Next design development; Pages Functions are not run by
  that server. `npm run build` then `npm start` uses the installed Wrangler for
  the Pages preview at `http://localhost:3000`.
- Browser automation and phone visual checks were not performed. No local
  preview server was left running by this import.
- No live order, Telegram delivery, panel write, credential copy, backend
  service action, Cloudflare setting change or production deployment was made.
- Git history, refs and index remain unchanged. No stage, commit or push was
  performed. The current checkout still has its original older catalog and
  local work; reconcile any future release with the panel's current published
  baseline rather than silently replacing that data during source import.
- Keep `/Users/ymp/Desktop/newsite_clean` and the recovery directory. They are
  retained even though local source/preservation checks pass.

## Recommended next milestone

Resolve the dependency security audit before preparing a production release.
