"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCatalog } from "@/services/catalog";
import type { CatalogData } from "@/types/catalog";

type CatalogStatus = "idle" | "loading" | "ready" | "refreshing" | "error";

export function useCatalog(
  initialCatalog?: CatalogData,
  enabled = true,
) {
  const [catalog, setCatalog] = useState<CatalogData | undefined>(initialCatalog);
  const [status, setStatus] = useState<CatalogStatus>(
    enabled ? (initialCatalog ? "refreshing" : "loading") : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchCatalog(controller.signal)
      .then((nextCatalog) => {
        // The fetched catalog usually matches the build-time data byte for
        // byte. Handing React the same reference skips a full re-render of
        // every card (and any image revalidation) after the background
        // refresh completes.
        setCatalog((current) =>
          current && JSON.stringify(current) === JSON.stringify(nextCatalog)
            ? current
            : nextCatalog,
        );
        setError(null);
        setStatus("ready");
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Catalog loading failed.",
        );
        setStatus("error");
      });
    return () => controller.abort();
  }, [enabled, requestVersion]);

  const refresh = useCallback(() => {
    setStatus(catalog ? "refreshing" : "loading");
    setRequestVersion((version) => version + 1);
  }, [catalog]);

  return { catalog, status, error, refresh };
}
