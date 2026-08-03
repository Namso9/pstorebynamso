import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/common/Icon";
import { ProductSearch } from "@/components/catalog/ProductSearch";

import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          className="site-brand"
          href="/"
          aria-label="Premium Store home"
          prefetch={false}
        >
          <Image
            className="site-brand__logo"
            src="/images/brand-logo.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span className="site-brand__text">
            PREMIUM <strong>STORE</strong>
          </span>
        </Link>

        <div className="site-header__actions">
          <ThemeToggle />
          <Link
            className="icon-button header-home-button"
            href="/"
            aria-label="Home"
            title="Home"
            prefetch={false}
          >
            <Icon name="home" />
          </Link>
          <ProductSearch />
          <a
            className="button button--primary button--sm header-bot-button"
            href="https://t.me/PSNamso_bot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Telegram Bot"
          >
            <Icon name="telegram" />
            <span>Bot</span>
          </a>
        </div>
      </div>
    </header>
  );
}
