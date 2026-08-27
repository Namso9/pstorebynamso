"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchVlessServers, type VlessServer } from "@/services/vlessServers";

/**
 * "VLESS Key Server Locations" — a compact disclosure bar under the Myanmar
 * VPN row (owner request, 2026-08-28). Closed it is one slim row; opened it
 * lists the key's live locations as chips.
 *
 * The list is fetched ONLY on first open, never on page load: most visitors
 * never expand it, and /api/vless-servers proxies the owner's key panel, so
 * an eager fetch would turn every home-page view into a hit on that panel
 * (edge-cached or not). No `trackProductClick` here for the same reason as
 * `MyanmarVpnRow`: the source enum is pinned across three repos.
 *
 * When the route is unconfigured (no VLESS_SUB_URL in the Pages dashboard) it
 * answers an empty 200 — the panel then shows a quiet "later" note instead of
 * an error, because nothing is actually broken.
 */

/** Leading regional-indicator pair, i.e. the flag emoji x-ui remarks start with. */
const FLAG_RE = /^(\p{RI}\p{RI})\s*(.*)$/u;

type PanelStatus = "closed" | "loading" | "ready" | "empty" | "error";

export function VlessServersPanel() {
  const [open, setOpen] = useState(false);
  const [servers, setServers] = useState<VlessServer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  // One fetch per open/retry, not per render: the effect below only re-runs
  // when `requestVersion` moves.
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    const controller = new AbortController();
    void fetchVlessServers(controller.signal)
      .then((list) => {
        setServers(list);
        setFailed(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
      });
    return () => controller.abort();
  }, [open, requestVersion]);

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const retry = useCallback(() => {
    fetchedRef.current = false;
    setFailed(false);
    setRequestVersion((version) => version + 1);
  }, []);

  const status: PanelStatus = !open
    ? "closed"
    : failed
      ? "error"
      : servers === null
        ? "loading"
        : servers.length
          ? "ready"
          : "empty";

  return (
    <section className="vless-servers" aria-label="VLESS key server locations">
      <button
        type="button"
        className="vless-servers__toggle"
        data-haptic="light"
        aria-expanded={open}
        aria-controls="vless-servers-body"
        onClick={toggle}
      >
        <span className="vless-servers__icon" aria-hidden="true">
          {/* Globe-with-live-node mark. Inline so the CSP stays untouched;
              the gradient reads the theme's accent tokens, so it recolors
              with light/dark for free. */}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <defs>
              <linearGradient
                id="vless-icon-grad"
                x1="4"
                y1="4"
                x2="20"
                y2="20"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" style={{ stopColor: "var(--accent)" }} />
                <stop
                  offset="1"
                  style={{ stopColor: "var(--accent-hover)" }}
                />
              </linearGradient>
            </defs>
            <circle
              cx="12"
              cy="12"
              r="8.25"
              stroke="url(#vless-icon-grad)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="12"
              cy="12"
              rx="3.6"
              ry="8.25"
              stroke="url(#vless-icon-grad)"
              strokeWidth="1.2"
            />
            <path
              d="M4.55 9.25h14.9M4.55 14.75h14.9"
              stroke="url(#vless-icon-grad)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle
              className="vless-servers__icon-pulse"
              cx="17.6"
              cy="6.4"
              r="4"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1"
            />
            <circle
              cx="17.6"
              cy="6.4"
              r="2.3"
              fill="var(--accent)"
              stroke="var(--surface-strong)"
              strokeWidth="1.2"
            />
          </svg>
        </span>
        <span className="vless-servers__label">
          <strong>VLESS Key Server Locations</strong>
          <span>
            {servers?.length
              ? `Live locations ${servers.length} ခု`
              : "Key ထဲက live server locations"}
          </span>
        </span>
        <span className="vless-servers__chevron" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="vless-servers__body" id="vless-servers-body">
          {status === "loading" ? (
            <p className="vless-servers__note" role="status">
              Server list စစ်ဆေးနေပါတယ်…
            </p>
          ) : null}

          {status === "error" ? (
            <p className="vless-servers__note" role="status">
              <span>Live list မရသေးပါ။</span>
              <button type="button" data-haptic="light" onClick={retry}>
                Retry
              </button>
            </p>
          ) : null}

          {status === "empty" ? (
            <p className="vless-servers__note" role="status">
              Server list ကို ခဏအကြာမှာ ပြန်ကြည့်ပေးပါ။
            </p>
          ) : null}

          {status === "ready" && servers ? (
            <ul className="vless-servers__list">
              {servers.map((server) => (
                <ServerChip name={server.name} key={server.name} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * One location chip. x-ui remarks glue the flag to the text ("🇹🇭THAI VIP"),
 * so the flag is split into its own span for even spacing; a remark with no
 * flag (the panel's plain "MM" entry) gets a globe so the chips stay aligned.
 */
function ServerChip({ name }: { name: string }) {
  const match = FLAG_RE.exec(name);
  const flag = match?.[1] ?? "🌐";
  const label = (match?.[2] ?? name).trim() || name;
  return (
    <li className="vless-servers__chip">
      <span aria-hidden="true">{flag}</span>
      {label}
    </li>
  );
}
