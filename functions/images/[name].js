/**
 * Cloudflare Pages Function: GET /images/reviewN.<ext> — canonical reviews.
 *
 * The Admin Panel commits new reviews directly to the repository's existing
 * images/ directory. This function makes a newly committed sequential file
 * available before the next static build; existing static assets remain the
 * fallback, and unrelated /images/* requests pass straight to ASSETS.
 */

const GITHUB_REPO = 'Namso9/pstorebynamso';
const GITHUB_BRANCH = 'main';
const REVIEW_NAME_RE = /^review\d+\.(webp|jpg|jpeg|png)$/i;
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
  if (!REVIEW_NAME_RE.test(name) || name.includes('..')) {
    return env.ASSETS.fetch(request);
  }

  const ext = name.split('.').pop().toLowerCase();
  const snapshot = await env.ASSETS.fetch(request);
  if (snapshot.ok) return imageResponse(snapshot.body, ext, 'static-build');

  try {
    const sha = await fetchGitHubBranchHead(GITHUB_REPO, GITHUB_BRANCH);
    const upstream = await fetch(
      immutableGitHubRawUrl(GITHUB_REPO, sha, `images/${name}`),
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
