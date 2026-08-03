"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { officialNavigation, shopNavigation } from "./navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/payment/") {
    return (
      <footer className="route-footer">
        <p>Premium Store Since 2020</p>
        <div>
          <Link href="/terms-of-service-vpn/" prefetch={false}>VPN Terms</Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms-of-service/" prefetch={false}>Shop Terms</Link>
        </div>
      </footer>
    );
  }
  if (pathname !== "/") return null;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="footer-brand-block">
            <p className="footer-brand-name">
              PREMIUM <strong>STORE</strong>
            </p>
            <p>
              Digital products &amp; premium subscriptions များကို
              စျေးနှုန်းချိုသာစွာ၊ လုံခြုံစိတ်ချစွာ ဝယ်ယူနိုင်သော Premium
              Store by Namso ဖြစ်ပါတယ်။
            </p>
          </div>

          <div className="footer-column">
            <h2>Shop</h2>
            {shopNavigation.map((item) => (
              <Link href={item.href} key={item.href} prefetch={false}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="footer-column">
            <h2>Official Channels</h2>
            {officialNavigation.map((item) => (
              <a
                href={item.href}
                key={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="site-footer__bottom">
          <Link href="/terms-of-service-vpn/" prefetch={false}>
            VPN Terms
          </Link>
          <Link href="/terms-of-service/" prefetch={false}>
            Shop Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
