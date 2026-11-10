"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function BuyingGuidePrompt() {
  const mm = useLang() === "mm";
  return (
    <div className="buying-guide-prompt" lang={mm ? "my" : "en"}>
      <p>
        <span>{mm ? "\u1018\u101a\u103a\u101c\u102d\u102f \u101d\u101a\u103a\u101b\u1019\u101c\u1032?" : "New here?"}</span>
        <Link href="/how-to-use">
          {mm ? "\u101d\u101a\u103a\u101a\u1030\u1014\u100a\u103a\u1038 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a" : "How to buy"}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
    </div>
  );
}
