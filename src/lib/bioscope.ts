export type BioscopeDownload = {
  id: string;
  group: string;
  title: string;
  note?: string;
  kind: string;
  detect?: string;
  featured?: boolean;
  version?: string;
  size?: string;
  action: string;
  href: string;
  alternates?: { label: string; href: string }[];
};

export type BioscopeGuideStep = {
  text: string;
  kind?: string;
  images?: { src: string; alt: string; width: number; height: number; caption?: string }[];
};

export type BioscopeData = {
  updated: string;
  app: { name: string; subtitle: string; tagline: string; logo: string };
  groups: { id: string; label: string; hint: string; detect: string[] }[];
  downloads: BioscopeDownload[];
  guides: { group: string; sections: { title: string; steps: BioscopeGuideStep[] }[] }[];
};

export type ResolvedBioscopeLinks = Record<string, { href: string; version?: string }>;

export function parseResolvedLinks(data: unknown): ResolvedBioscopeLinks {
  if (!data || typeof data !== "object" || !("resolved" in data) || !data.resolved || typeof data.resolved !== "object") return {};
  const result: ResolvedBioscopeLinks = {};
  for (const [id, entry] of Object.entries(data.resolved)) {
    if (!entry || typeof entry !== "object" || !("href" in entry) || typeof entry.href !== "string") continue;
    try {
      const url = new URL(entry.href);
      if (url.protocol !== "https:" || !["bioscopeapp.com", "link.bioscopeapp.com"].includes(url.hostname) || !/^Bioscope[\w.-]*\.(apk|exe|zip|dmg)$/i.test(url.pathname.split("/").pop() || "")) continue;
      const version = "version" in entry && typeof entry.version === "string" ? entry.version : undefined;
      result[id] = { href: entry.href, version };
    } catch { /* Keep the published download when a resolved link is invalid. */ }
  }
  return result;
}

export function resolveDownloads(downloads: BioscopeDownload[], links: ResolvedBioscopeLinks): BioscopeDownload[] {
  return downloads.map((download) => {
    const update = links[download.id];
    if (!update || update.href === download.href) return download;
    return { ...download, href: update.href, version: update.version ?? download.version,
      size: update.version && update.version !== download.version ? undefined : download.size };
  });
}
