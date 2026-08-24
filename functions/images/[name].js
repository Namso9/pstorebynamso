/**
 * Cloudflare Pages Function: GET /images/reviewN.<ext> — canonical reviews.
 *
 * The Admin Panel commits new reviews directly to the repository's existing
 * images/ directory. This function makes a newly committed sequential file
 * available before the next static build; existing static assets remain the
 * fallback, and unrelated /images/* requests pass straight to ASSETS.
 *
 * NEW_ASSET_NAMES extends the same fallback to product marks that have been
 * committed but may not be in the promoted build yet. That closes a real
 * ordering hazard: `data/*.json` and `products.json` are both served LIVE from
 * GitHub within seconds, so a commit that repoints one of them at a new image
 * would otherwise show a broken logo to every visitor until the next build was
 * promoted — the JSON is live, the asset is not. With this, the two halves can
 * land in either order. Once a build has shipped a name, ASSETS answers first
 * and the entry costs nothing; entries may be pruned after that, or left.
 *
 * Reviews live in the repo's root images/, these live in public/images/, so the
 * upstream path differs per kind.
 */

const GITHUB_REPO = 'Namso9/pstorebynamso';
const GITHUB_BRANCH = 'main';
const REVIEW_NAME_RE = /^review\d+\.(webp|jpg|jpeg|png)$/i;
const NEW_ASSET_NAMES = new Set([
  'atom.webp',
  'mytel.webp',
  'bioscope.webp',
]);
const TYPES = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

import {
  fetchGitHubBranchHead,
  immutableGitHubRawUrl,
  IMMUTABLE_GITHUB_TTL_SECONDS,
} from '../_shared/live-json.js';

function imageResponse(body, ext, source) {
  return new Response(body, {
    headers: {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'X-Image-Source': source,
    },
  });
}

export async function onRequestGet({ params, request, env }) {
  const name = String(params.name || '');
  const isReview = REVIEW_NAME_RE.test(name);
  const isNewAsset = NEW_ASSET_NAMES.has(name);
  if ((!isReview && !isNewAsset) || name.includes('..')) {
    return env.ASSETS.fetch(request);
  }

  const ext = name.split('.').pop().toLowerCase();
  const snapshot = await env.ASSETS.fetch(request);
  if (snapshot.ok) {
    // Reviews keep the no-store wrapper: the panel replaces images/reviewN.*
    // in place, so a cached copy would outlive the file it names.
    if (isReview) return imageResponse(snapshot.body, ext, 'static-build');
    // App icons are the opposite. They are immutable by filename and carry a
    // `?v=` from publicAssetPath, so once a build has them the ASSETS response
    // is returned UNTOUCHED — wrapping it re-stated `Cache-Control: no-store`
    // over the repository's immutable /images/* policy, which would have made
    // every page load re-download three logos AND spend a Function invocation
    // on each. This branch is the steady state; the fallback below runs only in
    // the window between a commit and the build that promotes it.
    return snapshot;
  }

  try {
    const sha = await fetchGitHubBranchHead(GITHUB_REPO, GITHUB_BRANCH);
    const upstreamPath = isReview
      ? `images/${name}`
      : `public/images/${name}`;
    const upstream = await fetch(
      immutableGitHubRawUrl(GITHUB_REPO, sha, upstreamPath),
      {
        cf: {
          cacheTtl: IMMUTABLE_GITHUB_TTL_SECONDS,
          cacheEverything: true,
        },
      },
    );
    if (upstream.ok) return imageResponse(upstream.body, ext, 'github-live');
  } catch (_error) {
    // Fall through to a clean 404. The build snapshot was checked first.
  }
  return new Response('not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function onRequestHead(ctx) {
  const response = await onRequestGet(ctx);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
