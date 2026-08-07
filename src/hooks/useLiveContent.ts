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
        setValue(nextValue);
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
