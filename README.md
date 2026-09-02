# pstorebynamso

Premium Store by Namso storefront. Next.js App Router static export (`out/`,
trailing slashes, unoptimized images), deployed to Cloudflare Pages. See
`AI_CONTEXT.md` for the working agreements and `TODO.md` for the task queue.

## Homepage design system (2026-08-24 redesign)

The homepage is a search-first, color-coded category grid. The rules:

- **One layout, color is the only variable.** Every category card shares
  padding, icon size, radius, shadow, and text hierarchy. A card's color comes
  from its `data-category` attribute and the `--cat-*` tokens below — never
  from per-card markup or inline style.
- **No text inside images.** Every category name and blurb is real, crawlable
  text. Card blurbs are storefront-owned Burmese one-liners in
  `src/data/category-presentations.ts` (`categoryCardDescriptions`); the
  panel-owned `categories[].subtitle` stays on the category pages.
- **Product/category detail pages are untouched** — the liquid-glass product
  card system there is intentional and approved. Category colors stop at the
  homepage grid.
- The hero is a full-bleed solid band (`--hero-band`), left-aligned headline,
  wide white search field. The field is a button that opens the header's one
  `ProductSearch` dialog (via the `ps-open-search` event, same as ⌘K/Ctrl+K) —
  the mobile IME/focus fixes live in that single dialog, do not duplicate it.
- Search matching is substring + a storefront-owned Burmese/typo alias map
  (`src/data/search-aliases.ts`). Zero-result queries are NOT logged: the
  `/api/track` contract is anonymous product clicks only, and extending it is
  a privacy decision for the owner.
- Every `:hover` rule lives inside `@media (hover: hover)` with an `:active`
  twin (`npm run touch:check` enforces). Hover lifts on motion-wrapped cards
  use the independent `translate`/`scale` properties, because the reveal
  leaves an inline `transform: none` that beats a stylesheet `transform`.

### Hero band

| Token | Dark (default) | Light | Notes |
| --- | --- | --- | --- |
| `--hero-band` | `#392c6b` | `#2e245e` | Solid plum-indigo; white ink ≈ 12:1 both |
| `--hero-band-ink` | `#f6f4ff` | same | Headline |
| `--hero-band-muted` | 78% white | same | Subtitle, bot link |

### Category palette

Per category: `--cat-<key>-{surface,line,plate,plate-ink}`. `surface` is the
card, `line` the border, `plate` the icon tile and count pill, `plate-ink`
the glyph color. Text is `--ink`/`--muted` on every card, so the whole grid
keeps the same hierarchy and stays at WCAG AA.

| Key | Category | Light surface | Dark surface | Card text |
| --- | --- | --- | --- | --- |
| `stream` | Streaming Apps | `#fdeef2` rose | 12% rose tint | `--ink` (AA ✓) |
| `ai` | AI Apps | `#eceefc` periwinkle | 15% indigo tint | `--ink` (AA ✓) |
| `vpn` | Premium VPN Apps | `#e3ebfa` royal blue | 17% royal-blue tint | `--ink` (AA ✓) |
| `data` | Mobile Data | `#e7f6ee` mint | 12% emerald tint | `--ink` (AA ✓) |
| `music` | Music Apps | `#fdf1de` cream | 13% amber tint | `--ink` (AA ✓) |
| `create` | Creative & Work | `#e9f1fd` sky | 13% brand-blue tint | `--ink` (AA ✓) |

Every card is a tinted surface — including VPN, whose royal-blue tint is the
richest of the set, so it keeps a quiet anchor quality without dominating the
grid (it used to be a solid deep-navy tile with its own white ink pair, which
over-highlighted one category, most jarring in light mode). A slug with no
palette entry (or the guide tile) renders the neutral default card.

### Raster app icons

`src/data/product-media.ts` lists the owner's real 256px app icons
(`atom.webp`, `mytel.webp`, `bioscope.webp`) and renders them full-bleed via
`.product-logo--fullbleed` — the frame's `overflow: hidden` clips them to the
shared tile radius. Flat SVG brand marks keep the 7px inset and light
squircle plate.

## Validation

`npm run lint` · `npm run typecheck` · `npm run build` · `npm run csp:check` ·
`npm run theme:check` · `npm run touch:check` · `npm audit`
