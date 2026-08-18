# Cloudflare Pages Preview QA — 2026-08-03

> ⚠️ **THE SCREENSHOTS THIS REPORT REFERENCES WERE DELETED ON 2026-08-18**
> (632 captures, 245 MB, storefront commit `1ff2b68`). The findings and the
> acceptance recorded below still stand — only the image files are gone. Recover
> any one of them with `git show 1ff2b68^:<path>` from the storefront repo. Every
> `qa/*.mjs` check still runs and regenerates its own captures.

## Deployment

- Project: `pstorebynamso` (existing project; no project was created)
- Environment: Preview
- Branch: `next-preview`
- Deployment ID: `1ce72273-f60c-4d2c-a449-47b27bbbf70b`
- Immutable URL: <https://1ce72273.pstorebynamso.pages.dev>
- Branch alias: <https://next-preview.pstorebynamso.pages.dev>
- Source revision recorded by Pages: `b6577e0`

## Build used for this direct preview upload

- Working/root directory: `pstorebynamso`
- Framework: Next.js static HTML export
- Build command: `npm run build`
- Output directory uploaded: `out`
- Wrangler command target: existing project `pstorebynamso`, branch
  `next-preview`

The existing project-wide Git build configuration remains the legacy
`exit 0` command with empty root and destination fields. It was not changed,
because that setting is shared with future production Git builds. The requested
Next.js settings were used locally for this direct preview upload only.

## Environment separation

Cloudflare's project API confirmed separate deployment configurations:

- Production: `ADMIN_CHAT_ID` (plain text) and `BOT_TOKEN` (encrypted secret)
  are configured. Their values were not read or copied.
- Preview: no environment variables or secrets are currently configured.

Required before a successful preview order test:

- `BOT_TOKEN` — required encrypted preview secret; use a dedicated preview bot.
- `ADMIN_CHAT_ID` — required preview value; use a dedicated test chat/channel.

Optional preview-only values:

- `FB_PAGE_LINK` — optional plain-text success/contact URL.
- `PANEL_INGEST_URL` — optional plain-text test-panel endpoint.
- `PANEL_INGEST_TOKEN` — optional encrypted test-panel token; set it only when
  `PANEL_INGEST_URL` is also configured.

Do not copy production values into preview merely to make the test pass.

## Verified results

- `npm run lint`: passed.
- `npm run typecheck`: passed. Machine-generated `.next` conflict-copy files
  containing spaces are excluded while canonical Next types remain checked.
- `npm run build`: passed; 17 static pages were generated.
- Static/client secret scan: 293 files and 5,267,505 bytes scanned; no
  `NEXT_PUBLIC_*` reference, project environment file, Telegram-token pattern,
  private key, Cloudflare token assignment, or literal credential assignment
  was found.
- Both the immutable deployment URL and branch alias return HTTP 200.
- All 15 canonical routes return HTTP 200.
- All 17 legacy redirects return HTTP 301 and preserve the query string.
- `/products.json`, `/data/faq.json`, the brand image, and a Next.js JavaScript
  chunk return HTTP 200.
- Next.js build assets use `public, max-age=31536000, immutable`.
- Preview responses include `X-Robots-Tag: noindex`.
- The expected CSP is active, including `script-src 'self' 'unsafe-inline'` and
  `script-src-attr 'none'`.
- Production comparison covers all migrated content-page types at 390px and
  home/category/payment/order at 360px and 430px. The corrected header, hero,
  catalog, review, payment/order, footer, FAQ, terms, and ExpressVPN layouts are
  captured under `qa/comparisons/2026-08-03/`.
- Deployed Mobile Chromium checks found no horizontal overflow or preview
  console/CSP errors. Client hydration, theme switching, Motion-backed search
  modal, plan modal, and FAQ expansion all pass.
- The custom missing route returns HTTP 404 with `noindex` metadata.
- A post-deployment synthetic preview request reached `/api/order`, returned HTTP 500
  `Server not configured`, and rendered the client error state. This is the
  expected result while preview variables are empty; it did not contact
  Telegram or the optional panel.
- Production remained on deployment
  `fb8f0085-505e-4d61-aeca-40187278bb47`; its home-page SHA-256 remained
  `ade280fc9737598b890fd736921a26a3618993ff2418b1a927a94111101ba868`
  before and after the preview upload.

## Remaining preview acceptance checklist

### Order submission and Telegram

- [ ] Configure dedicated preview `BOT_TOKEN` and `ADMIN_CHAT_ID` values in the
  Preview environment only.
- [ ] Reconfirm the Production values were not changed and are not visible to
  the preview deployment.
- [ ] Submit one clearly labelled synthetic order through the branch alias with
  a non-sensitive test image.
- [ ] Confirm the browser displays a success state and a traceable `W...` order
  ID.
- [ ] Confirm exactly one photo/caption reaches the dedicated preview Telegram
  chat with the expected product, plan, payment, contact, and order ID.
- [ ] Confirm invalid origin, missing fields, unsupported image, oversized
  image, and out-of-stock guidance remain correct without generating duplicate
  Telegram messages.
- [ ] If panel mirroring is enabled, use only a test endpoint/token and confirm
  the password and screenshot are never mirrored.

### Mobile browsers

- [ ] Test the branch alias on a real mid-range Android device in Chrome.
- [ ] Test on a real iPhone in Safari.
- [ ] Test in Telegram's in-app browser or another narrow Android WebView.
- [ ] At 360px, 390px, and 430px, verify the full header brand, menu, search,
  plan modal, payment selector, native file picker, order error/success states,
  theme persistence, bottom safe area, and Motion smoothness.

### Rollback readiness

- [x] Production deployment ID and content fingerprint were recorded before
  and verified after the preview upload.
- [x] The preview has both an immutable deployment URL and a branch alias.
- [x] The legacy site and existing Pages Functions remain in the repository.
- [ ] Before any production replacement, confirm the owner can select the last
  known-good production deployment in the Pages dashboard and review the
  rollback action without executing it.
- [ ] Do not promote this preview, change custom domains, or deploy `main`
  without separate approval.
