# Myanmar font phone preview - 2026-11-11

Owner requested a committed trial of the recommended font on a phone.
Prepared on production source 09d449a in .release/myanmar-font-phone-20261111.
Preview only; production has not been replaced.

Noto Sans Myanmar replaces Stadium for --font-mm-body and becomes the default
Myanmar body fallback after Inter. Yay Chan Zin remains the heading fallback.
Product descriptions and FAQ questions/answers use 16px text, 1.9 line height
and normal letter spacing. All existing product content, prices and IDs remain.

Font source: Google Fonts ofl/notosansmyanmar/NotoSansMyanmar[wdth,wght].ttf.
https://github.com/google/fonts/tree/main/ofl/notosansmyanmar
The width axis is fixed at normal (100); weight 100-900 is retained. Self-hosted
WOFF is 254,976 bytes. SIL Open Font License included beside the font.
No package/dependency or external browser font request was added.

Lint (four existing warnings), typecheck, build, CSP, commerce/live-data and
migration checks pass. All Myanmar characters used in descriptions and FAQs
are present in the font. Parent dependency audit evidence is reused because
the package manifest and lockfile are unchanged.

Preview publication complete; owner phone acceptance pending. Check product descriptions,
expanded FAQs and MM information pages in both themes. No browser/device
automation or live checkout was used for validation.

Commit: 05529ded0f4e1d8a70ed43faeb19999aff14aced.
Remote preview branch: myanmar-font-phone (production main is unchanged).
Deployment: 26834f30-8c60-4192-9c8e-2cf46b1feaab, Environment Preview.
Phone link: https://myanmar-font-phone.pstorebynamso.pages.dev/product/capcut-pro/.
Immutable: https://26834f30.pstorebynamso.pages.dev/.

Generated CSS binds notoMyanmar to the self-hosted variable WOFF at weights
100-900. The font asset is present in the verified export. External preview
HTTP checks are blocked by connection resets from this network: both preview
hosts and the existing pstorebynamso.pages.dev root fail, while the production
custom domain responds 200. DNS resolves and Cloudflare confirms deployment.
No live rendering/asset verification or real-phone acceptance is claimed.
The upstream license retains one original trailing space.

## Production approval and enlargement

Owner tested the preview on a phone, approved Noto Sans Myanmar, and explicitly
authorized commit/push/production deployment with slightly larger text.
Descriptions and FAQ questions/answers are increased from 16px to 17px; line
height remains 1.9. Both Netflix detail pages replace the old shared-device
paragraph with the owner's TV/Android box versus Phone/Laptop/Tablet guidance.
The remaining descriptions, FAQ entries, catalog, IDs and Functions are intact.

Production publication pending. Rollback: 9f2fc823-1467-42f1-8abf-9424e898a01f.
