import type { ReactNode } from "react";

import { RouteTransition } from "@/components/common/RouteTransition";

import { BackButton } from "./BackButton";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type PageLayoutProps = {
  children: ReactNode;
};

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main className="site-main" id="main-content">
        <RouteTransition>{children}</RouteTransition>
        <BackButton />
      </main>
      <SiteFooter />
    </div>
  );
}
