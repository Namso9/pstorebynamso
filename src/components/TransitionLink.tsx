"use client";

import Link from "next/link";
import { useContext, type ComponentProps } from "react";
import { RouteMotionContext } from "@/components/PageTransition";

export default function TransitionLink({ href, onNavigate, ...props }: ComponentProps<typeof Link>) {
  const navigate = useContext(RouteMotionContext);

  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
        if (!cancelled && typeof href === "string" && navigate?.(href, { replace: props.replace, scroll: props.scroll })) {
          event.preventDefault();
        }
      }}
    />
  );
}
