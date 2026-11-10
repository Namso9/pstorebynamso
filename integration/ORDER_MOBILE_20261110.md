# Zoom Pro labels and mobile order form

Implemented locally, uncommitted and not deployed.
Zoom Pro labels now read 1 Month / 3 Months / 6 Months / 1 Year - 100 p.
Removed Monthly, Quarterly, Most Popular and Best Value from these plans.
Prices, product/plan IDs and checkout contract are unchanged.

Contact has a short placeholder and persistent, associated help text below:
Telegram username, Viber number or email. This keeps all options readable on
mobile and while typing. Terms, refund policy and privacy policy use their
existing routes, trailing slashes and blue underlined links with keyboard focus
styles and separate light/dark colors.

Chrome mobile emulation passed at 360, 390 and 430 pixels in both themes:
no horizontal overflow; contact placeholder/help and consent fit. Screenshots
of contact and consent were visually inspected at 360 pixels. No form was
submitted. Lint (four existing warnings), typecheck, build, CSP, commerce and
migration checks pass. Dependency versions are unchanged; the existing local
16-advisory audit remains a separate issue. No commit, push or deployment.
