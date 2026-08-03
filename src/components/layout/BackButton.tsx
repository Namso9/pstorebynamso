"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/common/Icon";

export function BackButton({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  // The home page has nothing to go back to, and the payment page renders its
  // own embedded back row after its content, so the shared row skips both.
  // Every other internal page (including /order/) gets the shared bottom row.
  if (embedded ? pathname !== "/payment/" : pathname === "/" || pathname === "/payment/") {
    return null;
  }

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  return (
    <div className="back-row">
      <button type="button" className="back-control" onClick={goBack}>
        <Icon name="arrow-left" />
        <span>Back</span>
      </button>
      <Link className="back-control" href="/" prefetch={false}>
        <Icon name="home" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
