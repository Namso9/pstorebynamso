# Homepage performance preview

Status: PASS. On 2026-11-10 the owner confirmed all changes in the final
9d924b8d preview work on a physical phone and authorized production release.

Baseline checkpoint: `b956117` (latest source import, local Git commit).

Implemented steps 1-3:

1. Hero entrance classes no longer delay or blur the heading and description.
2. Section wrappers are visible in exported HTML, without a reveal observer,
   opacity fade or 48px translation.
3. The shared category/comparison/review carousel starts autoplay only when its
   row is at least 1% visible. Timers stop offscreen, in hidden tabs, during
   reduced motion and on unmount. Existing hover/focus and manual controls stay.

The rotating hero, review duplication and finder backgrounds are unchanged.
The owner authorized committing, pushing and deploying the cumulative changes.

Preview alias: https://homepage-perf-test.pstorebynamso.pages.dev/
Current cumulative deployment: https://9d924b8d.pstorebynamso.pages.dev/
Includes iOS-inspired native push/pop navigation with coordinated 440ms timing
and opaque page layers. The header remains still. Search, plans and reviews
retain different directions and use restrained springs with smaller movement.
Older browsers and browser history use a smaller directional fallback.
Initial content stays immediate and reduced motion disables these additions.
All 14 served assets match the build; preview hosts and Music return HTTP 200
with CSP/noindex. Production remains unchanged.
Earlier performance-only snapshot: https://22f8a540.pstorebynamso.pages.dev/
Production comparison: https://pstorebynamso.com/

Local verification: build, lint (four existing warnings), typecheck, strict
CSP, commerce/live-data fixtures, migration routes/assets and the offline
carousel visibility harness pass. Dependency audit findings from the source
import remain unchanged. Catalog data and Pages Functions are unchanged.

## Phone acceptance

Use the same phone/browser/network for production and preview. Compare fresh
opens in both themes and languages. Confirm heading/description and section
content appear immediately. Scroll through categories, comparison and reviews;
check swipes, arrows and comparison selection. Leave/re-enter sections and
background/restore the tab; autoplay should pause and resume without a jump.
Check reduced motion, search, plans and order navigation without submitting an
order. Note startup feel and any scrolling stutter separately.

For the motion pass, open Music, switch categories in both directions and
open product details. Use browser Back and Forward, including Forward after
returning home. Confirm slide direction follows the navigation. Search, plans
and reviews should have visibly different entrances and reversed exits.
Try rapid navigation and ensure the page never stays faded out.
Also compare plans opening
and closing (including the title double-tap), search typing/keyboard/closing,
review lightbox and FAQ expansion. Confirm closure restores scrolling and
focus. Check both themes at 360/390/430px where available. Turn OS reduced
motion on and confirm the new transitions stop. Initial content should remain
immediately visible throughout this comparison.

Owner acceptance is PASS, based on the explicit final phone confirmation.
If stuttering remains, profile on the phone before changing the rotating hero
or review duplication. Finder background deferral is a later step.
