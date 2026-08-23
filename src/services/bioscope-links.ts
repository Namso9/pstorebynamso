import type {
  BioscopeDownload,
  BioscopeResolvedLinks,
} from "@/types/content";

/**
 * The same host policy the pinned data is held to. The resolver already checks
 * it server-side; re-checking here means a compromised or misbehaving response
 * cannot put a foreign host on a download button.
 */
const ALLOWED_HOSTS = new Set(["bioscopeapp.com", "link.bioscopeapp.com"]);

/** Only versioned installers are resolved, never a store or beta page. */
const FILE_NAME = /^Bioscope[\w.-]*\.(?:apk|exe|zip|dmg)$/i;

function isResolvedHref(value: unknown) {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      return false;
    }
    return FILE_NAME.test(url.pathname.split("/").pop() || "");
  } catch {
    return false;
  }
}

export function parseBioscopeResolvedLinks(
  value: unknown,
): BioscopeResolvedLinks {
  if (typeof value !== "object" || value === null) return {};
  const resolved = (value as { resolved?: unknown }).resolved;
  if (typeof resolved !== "object" || resolved === null) return {};

  const result: BioscopeResolvedLinks = {};
  for (const [id, entry] of Object.entries(resolved)) {
    if (typeof entry !== "object" || entry === null) continue;
    const { href, version } = entry as { href?: unknown; version?: unknown };
    if (!isResolvedHref(href)) continue;
    if (version !== undefined && typeof version !== "string") continue;
    result[id] = { href: href as string, version: version as string | undefined };
  }
  return result;
}

export async function fetchBioscopeLinks(signal?: AbortSignal) {
  const response = await fetch("/api/bioscope-links", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Bioscope link resolver failed with ${response.status}.`);
  }
  return parseBioscopeResolvedLinks(await response.json());
}

/**
 * Overlay the live filenames on the pinned catalogue.
 *
 * A resolved entry only replaces the pinned one when it actually differs. When
 * the version moves, the pinned `size` is dropped rather than shown against a
 * different file — a wrong number is worse than no number.
 */
export function applyResolvedLinks(
  downloads: BioscopeDownload[],
  resolved: BioscopeResolvedLinks | null,
): BioscopeDownload[] {
  if (!resolved || Object.keys(resolved).length === 0) return downloads;

  let changed = false;
  const next = downloads.map((download) => {
    const update = resolved[download.id];
    if (!update || update.href === download.href) return download;
    changed = true;
    const versionMoved =
      update.version !== undefined && update.version !== download.version;
    return {
      ...download,
      href: update.href,
      version: update.version ?? download.version,
      size: versionMoved ? undefined : download.size,
    };
  });

  return changed ? next : downloads;
}
