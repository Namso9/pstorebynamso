"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/common/Icon";

export function BackButton() {
  const pathname = usePathname();
  // The home page has nothing to go back to. Every other internal page gets
  // this row at the bottom of <main> — including /payment/, which used to end
  // with its own copy in the middle of the page now that the order form
  // follows the QR panel.
  if (pathname === "/") return null;

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  return (
    <div className="back-row">
      <button
        type="button"
        className="back-control"
        data-haptic="light"
        onClick={goBack}
      >
        <Icon name="arrow-left" />
        <span>Back</span>
      </button>
      <Link className="back-control" href="/" prefetch={false} data-haptic="light">
        <Icon name="home" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
