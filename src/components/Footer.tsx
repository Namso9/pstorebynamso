"use client";

import Link from "@/components/TransitionLink";
import { STR, useLang } from "@/lib/i18n";

export default function Footer() {
  const lang = useLang();
  const s = STR[lang].footer;
  const l = s.links;
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* shop */}
        <div className="footer-col">
          <div className="footer-title">{s.shop}</div>
          <Link href="/category/ai" prefetch={false}>{l.aiTools}</Link>
          <Link href="/category/streaming" prefetch={false}>{l.streaming}</Link>
          <Link href="/category/music" prefetch={false}>{l.music}</Link>
          <Link href="/category/creative-work#product-9" prefetch={false}>{l.learning}</Link>
          <Link href="/category/creative-work" prefetch={false}>{l.work}</Link>
          <Link href="/category/vpn" prefetch={false}>{l.vpn}</Link>
        </div>

        {/* support */}
        <div className="footer-col">
          <div className="footer-title">{s.support}</div>
          <Link href="/how-to-use" prefetch={false}>{l.how}</Link>
          <Link href="/payment-methods" prefetch={false}>{l.payment}</Link>
          <Link href="/delivery-of-accounts" prefetch={false}>{l.delivery}</Link>
          <Link href="/contact" prefetch={false}>{l.contact}</Link>
        </div>

        {/* company */}
        <div className="footer-col">
          <div className="footer-title">{s.company}</div>
          <Link href="/about" prefetch={false}>{l.about}</Link>
          <Link href="/resellers" prefetch={false}>{l.resellers}</Link>
        </div>

        {/* legal */}
        <div className="footer-col">
          <div className="footer-title">{s.legal}</div>
          <Link href="/terms-and-conditions" prefetch={false}>{l.terms}</Link>
          <Link href="/privacy-policy" prefetch={false}>{l.privacy}</Link>
          <Link href="/refund-policy" prefetch={false}>{l.refund}</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-pay">KBZPay &middot; WavePay &middot; AYA Pay</div>
      </div>
    </footer>
  );
}
