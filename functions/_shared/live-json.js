export const LIVE_JSON_TTL_SECONDS = 5;
export const LIVE_JSON_CACHE_CONTROL = 'no-store, max-age=0';
export const LIVE_JSON_MAX_BYTES = 2_000_000;
export const IMMUTABLE_GITHUB_TTL_SECONDS = 31_536_000;

export function versionedRawUrl(rawUrl, now = Date.now()) {
  const url = new URL(rawUrl);
  // Keep each Cloudflare edge entry short-lived.
  url.searchParams.set(
    'pstore_live_rev',
    String(Math.floor(now / (LIVE_JSON_TTL_SECONDS * 1000))),
  );
  return url.toString();
}

export async function fetchGitHubBranchHead(repo, branch) {
  const feedUrl = versionedRawUrl(
    `https://github.com/${repo}/commits/${encodeURIComponent(branch)}.atom`,
  );
  const response = await fetch(feedUrl, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cf: {
      cacheTtl: LIVE_JSON_TTL_SECONDS,
      cacheEverything: true,
    },
  });
  if (!response.ok) throw new Error(`GitHub commit feed failed: ${response.status}`);
  const feed = await response.text();
  const match = feed.match(/Grit::Commit\/([0-9a-f]{40})/i);
  if (!match) throw new Error('GitHub commit feed has no branch head');
  return match[1].toLowerCase();
}

export function immutableGitHubRawUrl(repo, sha, path) {
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('invalid GitHub commit SHA');
  const encodedPath = String(path)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `https://raw.githubusercontent.com/${repo}/${sha}/${encodedPath}`;
}

async function readValidatedJson(response) {
  if (!response.ok) throw new Error(`live JSON fetch failed: ${response.status}`);
  const declaredBytes = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredBytes) && declaredBytes > LIVE_JSON_MAX_BYTES) {
    throw new Error('live JSON exceeds size limit');
  }
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > LIVE_JSON_MAX_BYTES) {
    throw new Error('live JSON exceeds size limit');
  }
  JSON.parse(body);
  return body;
}

export async function fetchLiveJson(rawUrl) {
  const response = await fetch(versionedRawUrl(rawUrl), {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cf: {
      cacheTtl: LIVE_JSON_TTL_SECONDS,
      cacheEverything: true,
    },
  });
  return readValidatedJson(response);
}

export async function fetchGitHubLiveJson(repo, branch, path) {
  const sha = await fetchGitHubBranchHead(repo, branch);
  const response = await fetch(immutableGitHubRawUrl(repo, sha, path), {
    cf: {
      cacheTtl: IMMUTABLE_GITHUB_TTL_SECONDS,
      cacheEverything: true,
    },
  });
  return readValidatedJson(response);
}

export function freshJsonHeaders(sourceHeader, source) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': LIVE_JSON_CACHE_CONTROL,
    'X-Content-Type-Options': 'nosniff',
    [sourceHeader]: source,
  };
}

export function freshFallbackResponse(fallback, sourceHeader) {
  const headers = new Headers(fallback.headers);
  headers.set('Cache-Control', LIVE_JSON_CACHE_CONTROL);
  headers.set(sourceHeader, 'static-fallback');
  return new Response(fallback.body, { status: fallback.status, headers });
}
