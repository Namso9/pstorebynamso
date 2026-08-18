# Mobile Production Comparison

> ⚠️ **THE SCREENSHOTS THIS REPORT REFERENCES WERE DELETED ON 2026-08-18**
> (632 captures, 245 MB, storefront commit `1ff2b68`). The findings and the
> acceptance recorded below still stand — only the image files are gone. Recover
> any one of them with `git show 1ff2b68^:<path>` from the storefront repo. Every
> `qa/*.mjs` check still runs and regenerates its own captures.

Captured on 2026-08-03 for the PStore Next.js migration approval review.

## Current coverage

- Viewports: 360px, 390px, and 430px wide by 932px high.
- `parity-restored/`: home, Creative Apps, payment, order, reviews, ExpressVPN
  guide, Shop Terms, and VPN Terms at 390px.
- `mobile-bounds/`: home, Creative Apps, payment, and order at 360px and 430px.
- `deployed-preview/`: the same eight representative routes comparing the
  unchanged production site with the deployed `next-preview` alias at 390px.
- Each directory includes a machine-readable `report.json` with geometry,
  overflow, browser-error, hydration, Motion, theme, plan-modal, and FAQ checks.
- ⚠️ The older root-level JPG pairs are NOT retained any more — they were part of
  the 2026-08-18 deletion. The `report.json` files in each directory survive.

## Automated checks during capture

- Every tested production, local, and deployed-preview page returned HTTP 200.
- The Next.js pages had no horizontal overflow at any captured width.
- The local and deployed pages hydrated without console or CSP errors.
- Motion-backed dialogs, theme switching, the Creative plan modal, and FAQ
  expansion worked after hydration.
- The production legacy Creative Apps page overflowed horizontally at 360px;
  the corresponding Next.js page did not.
- Production logged its existing Cloudflare Insights CSP error because its
  currently deployed legacy CSP allows only same-origin scripts. Production was
  observed read-only and was not changed.

These screenshots are approval evidence, not proof of real Android, iPhone
Safari, or embedded WebView behavior. Those device gates remain open.
