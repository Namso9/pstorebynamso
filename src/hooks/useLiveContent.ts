"use client";

import { useCallback, useEffect, useState } from "react";

import { useLiveRevalidation } from "./useLiveRevalidation";

type ContentStatus = "refreshing" | "ready" | "error";

export function useLiveContent<T>(
  initialValue: T,
  loader: (signal?: AbortSignal) => Promise<T>,
) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<ContentStatus>("refreshing");
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestRefresh = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useLiveRevalidation(requestRefresh);

  useEffect(() => {
    const controller = new AbortController();
    void loader(controller.signal)
      .then((nextValue) => {
        // The polled file usually matches byte for byte. Handing React the
        // same reference skips re-rendering the whole live section (FAQ,
        // reviews, downloads) every five seconds — that re-render was the
        // hitch the owner saw when a poll landed mid-scroll.
        setValue((current) =>
          JSON.stringify(current) === JSON.stringify(nextValue)
            ? current
            : nextValue,
        );
        setStatus("ready");
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Live content loading failed.",
        );
      });
    return () => controller.abort();
  }, [loader, requestVersion]);

  const refresh = useCallback(() => {
    setStatus("refreshing");
    requestRefresh();
  }, [requestRefresh]);

  return { value, status, error, refresh };
}
