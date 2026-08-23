/**
 * Cloudflare Pages Function: GET /api/bioscope-links
 *
 * Bioscope ships every release under a NEW filename (…-V2.2.1.apk →
 * …-V2.2.2.apk), so a link pinned in data/bioscope-download.json goes dead the
 * day they publish an update. ဒီ function က vendor ရဲ့ official page ကနေ
 * လက်ရှိ filename ကို ဖတ်ပြီး၊ file တကယ်ရှိမရှိ HEAD နဲ့ စစ်ပြီးမှ ပြန်ပေးတယ် —
 * storefront က အဲ့ဒါကို pinned link ပေါ် overlay လုပ်တယ်။
 *
 * Fail-safe by construction: ဘာမှ resolve မရရင် `{}` ပဲ ပြန်တယ်၊ page က
 * data/bioscope-download.json ထဲက pinned link ကို ဆက်ပြတယ်။ Vendor page
 * redesign ဖြစ်လည်း site မကျဘူး — link က ရှေးဟောင်းဖြစ်နိုင်ရုံပဲ။
 *
 * TestFlight နှင့် Play Store link များကို မ resolve ပါ — အဲ့ဒါတွေ filename
 * မဟုတ်ဘဲ stable URL များဖြစ်ပြီး၊ "TestFlight 1 / 2 / 4" label က owner ရဲ့
 * ကိုယ်ပိုင် သတ်မှတ်ချက် ဖြစ်တာမို့ auto မပြောင်းသင့်ပါ။
 */

const PAGE_TTL_SECONDS = 600;
const FILE_TTL_SECONDS = 300;

/** Only these hosts may ever appear in a resolved href. */
const ALLOWED_HOSTS = new Set(['bioscopeapp.com', 'link.bioscopeapp.com']);

/**
 * One entry per download id in data/bioscope-download.json that names a
 * versioned file. `pattern` runs against the vendor page's HTML.
 */
const TARGETS = [
  {
    id: 'android-tv-apk',
    page: 'https://link.bioscopeapp.com/',
    // TV first: "Bioscope-Android-TV-V…" would otherwise be shadowed below.
    pattern: /\/download\/(Bioscope-Android-TV-V[0-9][\w.-]*\.apk)/i,
  },
  {
    id: 'android-phone-apk',
    page: 'https://link.bioscopeapp.com/',
    pattern: /\/download\/(Bioscope-Android-V[0-9][\w.-]*\.apk)/i,
  },
  {
    id: 'windows-exe',
    page: 'https://link.bioscopeapp.com/',
    pattern: /\/download\/(Bioscope-V[0-9][\w.-]*\.exe)/i,
  },
  {
    id: 'windows-zip',
    page: 'https://link.bioscopeapp.com/',
    pattern: /\/download\/(Bioscope-V[0-9][\w.-]*\.zip)/i,
  },
  {
    id: 'mac-dmg',
    page: 'https://bioscopeapp.com/download-mac',
    pattern: /\/downloads\/(Bioscope-V[0-9][\w.-]*\.dmg)/i,
  },
];

const VERSION_RE = /-V([0-9][\w.-]*?)\.(?:apk|exe|zip|dmg)$/i;

function versionFromFileName(fileName) {
  const match = fileName.match(VERSION_RE);
  return match ? match[1] : undefined;
}

async function readPage(pageUrl) {
  const response = await fetch(pageUrl, {
    headers: { Accept: 'text/html' },
    cf: { cacheTtl: PAGE_TTL_SECONDS, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`vendor page ${response.status}`);
  return response.text();
}

/** A resolved link only counts once the file itself answers. */
async function fileExists(href) {
  try {
    const response = await fetch(href, {
      method: 'HEAD',
      cf: { cacheTtl: FILE_TTL_SECONDS, cacheEverything: true },
    });
    return response.ok;
  } catch (_error) {
    return false;
  }
}

export async function onRequestGet() {
  const pages = new Map();
  const resolved = {};

  for (const target of TARGETS) {
    if (pages.has(target.page)) continue;
    pages.set(
      target.page,
      readPage(target.page).catch(() => null),
    );
  }
  for (const [pageUrl, pending] of pages) pages.set(pageUrl, await pending);

  const candidates = [];
  for (const target of TARGETS) {
    const html = pages.get(target.page);
    if (typeof html !== 'string') continue;
    const match = html.match(target.pattern);
    if (!match) continue;

    let url;
    try {
      // The vendor writes relative hrefs; resolve them against their own page
      // and then re-check the host, so a redirect target cannot smuggle in a
      // different origin.
      url = new URL(match[0], target.page);
    } catch (_error) {
      continue;
    }
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) continue;

    candidates.push({
      id: target.id,
      href: url.toString(),
      version: versionFromFileName(match[1]),
    });
  }

  const checks = await Promise.all(
    candidates.map((candidate) => fileExists(candidate.href)),
  );
  candidates.forEach((candidate, index) => {
    if (!checks[index]) return;
    resolved[candidate.id] = candidate.version
      ? { href: candidate.href, version: candidate.version }
      : { href: candidate.href };
  });

  return new Response(JSON.stringify({ resolved }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Short enough that a vendor release shows up the same day, long enough
      // that a busy page does not re-scrape on every view.
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Bioscope-Resolved': String(Object.keys(resolved).length),
    },
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
