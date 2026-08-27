/**
 * Client for GET /api/vless-servers (functions/api/vless-servers.js) — the
 * sanitized location list of the Myanmar VLESS key. The route publishes
 * display NAMES only; anything else in the payload is a contract break, so the
 * validator here drops rather than renders it.
 */

export type VlessServer = {
  name: string;
};

const MAX_SERVERS = 50;

function isServer(value: unknown): value is VlessServer {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { name?: unknown }).name === "string" &&
    (value as { name: string }).name.trim().length > 0
  );
}

export async function fetchVlessServers(
  signal?: AbortSignal,
): Promise<VlessServer[]> {
  const response = await fetch("/api/vless-servers", {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`VLESS server list failed: ${response.status}`);
  }
  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as { servers?: unknown }).servers)
  ) {
    throw new Error("VLESS server list has an unexpected shape.");
  }
  return (data as { servers: unknown[] }).servers
    .filter(isServer)
    .slice(0, MAX_SERVERS)
    .map((server) => ({ name: server.name.trim() }));
}
