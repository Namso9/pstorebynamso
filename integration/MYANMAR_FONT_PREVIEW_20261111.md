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

Publication and owner phone acceptance pending. Check product descriptions,
expanded FAQs and MM information pages in both themes. No browser/device
automation or live checkout was used for validation.
