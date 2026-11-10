# Stealth Writer price and mobile plan spacing

Implemented locally, not committed or deployed. Starter plan stealthwriter:1_month
is 50,000 Ks. IDs, Plus plan and all other product prices remain unchanged.
Mobile plan rows use a 16px radio column and aligned text/price column with a
4px gap. Radio aligns to the label; plan dialog row gap is reduced to 6px.
Shared layout applies consistently to all product plan rows.

Current upstream release checkout and primary checkout have the same scoped
change, preserving their separate catalog baselines. Release lint (four existing
warnings), typecheck, build, CSP, commerce/live-data and migration checks pass.
Dependency/configuration inputs are unchanged from the prior clean release audit.
Chrome mobile checks at 360/390/430 pass in both themes: aligned text/price,
4px gap, no overflow. Updated 360px screenshot visually inspected. No order.
No new screenshot was attached to the user request; checked the actual page.
