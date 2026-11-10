"use client";

import { useCallback, useEffect, useState } from "react";
import snapshot from "@/data/happ-locations.json";

type Locations = { servers: { name: string }[]; updatedAt: string; isLive: boolean };

export default function HappLocations() {
  const [data, setData] = useState<Locations>({ ...snapshot, isLive: false });
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/vless-servers", { cache: "no-store", signal });
      if (!response.ok) throw new Error("Locations unavailable");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("servers" in result) || !Array.isArray(result.servers) ||
          !result.servers.every((server) => server && typeof server.name === "string") ||
          !("updatedAt" in result) || typeof result.updatedAt !== "string") return;
      setData({ servers: result.servers, isLive: true, updatedAt: result.updatedAt });
    } catch {
      if (!signal?.aborted) setData((current) => ({ ...current, isLive: false }));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- State updates follow the awaited network request.
    void refresh(controller.signal);
    const timer = window.setInterval(() => void refresh(controller.signal), 5 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refresh]);

  return (
    <section className="detail-locations" aria-labelledby="happ-locations-title">
      <div className="detail-locations-heading">
        <h2 id="happ-locations-title">Happ (VLESS) server locations</h2>
        <button type="button" disabled={loading} onClick={() => { setLoading(true); void refresh(); }}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>
      <p role="status">{data.isLive ? "Live locations" : "Latest saved locations"} &middot; {data.servers.length} servers</p>
      {!data.isLive && !loading && <p className="detail-muted">Live updates are unavailable. Showing the last saved list.</p>}
      <ul className="detail-location-list">{data.servers.map(({ name }, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
      {!data.servers.length && <p>No locations are currently listed.</p>}
    </section>
  );
}
