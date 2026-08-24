"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";

import { primaryNavigation } from "./navigation";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        className="icon-button mobile-menu-button"
        aria-label="Open navigation"
        aria-expanded={open}
        data-haptic="selection"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Navigation"
        className="mobile-nav-panel"
      >
        <nav className="mobile-navigation" aria-label="Mobile navigation">
          {primaryNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              data-haptic="selection"
              onClick={close}
              prefetch={false}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <a
            className="mobile-navigation__bot"
            href="https://t.me/PSNamso_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            <Icon name="telegram" />
            <span>Telegram Bot</span>
          </a>
        </nav>
      </Modal>
    </>
  );
}
