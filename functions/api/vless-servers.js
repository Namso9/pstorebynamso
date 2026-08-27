/**
 * Cloudflare Pages Function: GET /api/vless-servers
 *
 * Publishes the CURRENT server-location list of the Myanmar VLESS key so the
 * storefront can show visitors which locations the key carries right now
 * (owner request, 2026-08-28). The upstream is the key's live subscription
 * endpoint, which returns base64-encoded `vless://UUID@host:port?...#NAME`
 * lines — i.e. the actual working credentials.
 *
 * That is why this route exists at all instead of a client-side fetch:
 * ONLY the display names after `#` may leave this function. The UUID, the
 * hosts, the ports and every transport parameter are secrets/infrastructure
 * and must never appear in the response, whatever the upstream sends.
 *
 * Setup (Cloudflare Dashboard -> Pages project -> Settings -> Environment
 * variables). The upstream URL is itself a credential (anyone holding it can
 * import the key), so it lives in the dashboard, never in this public repo:
 *   VLESS_SUB_URL = the subscription endpoint of the Myanmar VLESS key
 *
 * Unconfigured is a silent no-op — 200 with an empty list — same philosophy
 * as /api/track: the storefront ships before the dashboard variable exists
 * and the section simply stays hidden until it is set.
 */

// The subscription is a few KB; anything past this is not a subscription.
const MAX_UPSTREAM_BYTES = 262_144;

// Sanity bounds for what we republish.
const MAX_SERVERS = 50;
const MAX_NAME_LENGTH = 40;

// x-ui appends a random per-config suffix to some remarks ("THAI
// VIP-h9qurtldk9"). It identifies nothing useful to a visitor, so strip it.
// Eight-plus trailing alphanumerics only — "SG-2" and "US-2" stay intact.
const RANDOM_SUFFIX_RE = /-[a-z0-9]{8,}$/i;

function json(body, status, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Extract display names from a decoded subscription body. Accepts any
 * `scheme://...#fragment` proxy-URI line so a panel that later mixes in
 * trojan/vmess entries keeps working; everything before the `#` is dropped
 * unread.
 */
export function parseServerNames(text) {
  const names = [];
  const seen = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(line)) continue;
    const hashIndex = line.indexOf('#');
    if (hashIndex === -1) continue;
    let name;
    try {
      name = decodeURIComponent(line.slice(hashIndex + 1));
    } catch {
      continue;
    }
    name = name.replace(RANDOM_SUFFIX_RE, '').trim().slice(0, MAX_NAME_LENGTH);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
    if (names.length >= MAX_SERVERS) break;
  }
  return names;
}

export async function onRequestGet({ env }) {
  if (!env.VLESS_SUB_URL) {
    return json({ servers: [] }, 200, 'public, max-age=300');
  }

  try {
    // `cacheTtl` keeps one edge copy for five minutes, so a busy page costs
    // the upstream panel a request per edge per five minutes, not per visitor.
    const response = await fetch(env.VLESS_SUB_URL, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);

    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_UPSTREAM_BYTES) {
      throw new Error('upstream too large');
    }
    const raw = (await response.text()).slice(0, MAX_UPSTREAM_BYTES);

    // Subscription bodies are base64; tolerate a plain-text one too.
    let decoded;
    try {
      const binary = atob(raw.replace(/\s+/g, ''));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      decoded = new TextDecoder().decode(bytes);
    } catch {
      decoded = raw;
    }

    const servers = parseServerNames(decoded).map((name) => ({ name }));
    return json(
      { servers, updatedAt: new Date().toISOString() },
      200,
      'public, max-age=300',
    );
  } catch {
    // No console.error, same reason as /api/track: this log stream carries
    // /api/order's honeypot trail and must not be flooded by an upstream blip.
    return json({ servers: [] }, 503, 'no-store');
  }
}
