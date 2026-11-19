"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: "web_order";
    appearance: "interaction-only";
    "response-field": false;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

function turnstileApi() {
  return (window as Window & { turnstile?: Turnstile }).turnstile;
}

export function useCheckoutVerification(active: boolean) {
  const [config, setConfig] = useState<{ siteKey: string | null } | "unavailable">();
  const [scriptReady, setScriptReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [token, setToken] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const siteKey = config && config !== "unavailable" ? config.siteKey : null;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch("/api/order", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Verification config unavailable");
        const result = await response.json();
        if (result?.ok !== true ||
            (result.siteKey !== null && (typeof result.siteKey !== "string" || !result.siteKey))) {
          throw new Error("Invalid verification config");
        }
        if (active) setConfig({ siteKey: result.siteKey });
      })
      .catch(() => { if (active) setConfig("unavailable"); })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!active || !siteKey || !scriptReady || !container.current) return;
    const api = turnstileApi();
    if (!api) return;
    const id = api.render(container.current, {
      sitekey: siteKey,
      action: "web_order",
      appearance: "interaction-only",
      "response-field": false,
      callback: (value) => { setFailed(false); setToken(value); },
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setFailed(true); },
    });
    widget.current = id;
    return () => {
      api.remove(id);
      widget.current = null;
    };
  }, [active, scriptReady, siteKey]);

  const ready = !!config && config !== "unavailable" && (!siteKey || !!token);
  const message = !config ? "Checking checkout availability..." :
    config === "unavailable" || failed ? "Checkout verification could not load. Reload the page to try again." :
    siteKey && !token ? "Complete the security check to place your order." : "";

  return {
    ready,
    token,
    reset() {
      if (!siteKey) return;
      setToken("");
      if (widget.current !== null) turnstileApi()?.reset(widget.current);
    },
    field: (
      <>
        {siteKey && <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setScriptReady(true)}
            onError={() => { setToken(""); setFailed(true); }}
          />
          <div ref={container} />
        </>}
        {message && <p className="order-notice" role="status">{message}</p>}
      </>
    ),
  };
}
