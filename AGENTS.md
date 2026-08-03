# Storefront Instructions

- Git root: this directory. Read `AI_CONTEXT.md`, the relevant `TODO.md` section,
  and `../AGENTS.md` before work.
- Preserve the legacy site, root `functions/`, asset/JSON paths, route behavior,
  product/plan IDs, checkout parameters, and exact multipart `POST /api/order`
  contract unless the milestone explicitly changes them.
- The approved architecture is Next.js App Router static export to `out/` with
  trailing slashes, unoptimized images, Tailwind, Motion, and generated CSP
  hashes. Do not introduce dynamic runtime adapters or weaken CSP casually.
- Keep Telegram/Cloudflare/panel secrets server-only. Never expose them through
  `NEXT_PUBLIC_*`, client code, build output, logs, or screenshots.
- Standard validation: `npm run lint`, `npm run typecheck`, `npm run build`,
  `npm run csp:check`, and `npm audit`; add targeted browser/Wrangler checks when
  behavior changes.
- Preserve the pre-existing dirty worktree. Cloudflare settings, deployments,
  production replacement, commit, and push require explicit authorization.
