import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const out = path.join(root, "out");
const read = (file) => readFileSync(file, "utf8");
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const redirects = new Map();
for (const line of read(path.join(root, "public/_redirects")).split("\n")) {
  if (!line.trim() || line.trimStart().startsWith("#")) continue;
  const [from, to] = line.trim().split(/\s+/);
  assert(!redirects.has(from), `Duplicate redirect: ${from}`);
  redirects.set(from, to);
}

function resolveLocal(url) {
  const target = new URL(url, "https://fixture.invalid");
  if (target.origin !== "https://fixture.invalid") return null;
  let route = decodeURIComponent(target.pathname);
  const seen = new Set();
  while (redirects.has(route)) {
    assert(!seen.has(route), `Redirect cycle: ${route}`);
    seen.add(route);
    const next = new URL(redirects.get(route), "https://fixture.invalid");
    if (next.origin !== "https://fixture.invalid") return null;
    route = decodeURIComponent(next.pathname);
  }
  const relative = route.replace(/^\//, "");
  const candidates = [path.join(out, relative), path.join(out, relative, "index.html")];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile());
}

for (const route of [
  "/", "/products/", "/order/", "/payment/", "/product-details/",
  "/bioscope-download/", "/about/", "/contact/",
  "/streaming-apps/", "/ai-apps/", "/premium-vpn-apps/",
  "/music-apps/", "/creative-apps/", "/mobile-data/", "/social/",
]) {
  assert(resolveLocal(route), `Required route is missing: ${route}`);
}
for (const [from] of redirects) {
  assert(resolveLocal(from), `Redirect ends at a missing route: ${from}`);
}

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

const htmlFiles = filesIn(out).filter((file) => file.endsWith(".html"));
const localReferences = new Set();
for (const file of htmlFiles) {
  for (const match of read(file).matchAll(/\b(?:href|src)=["'](\/[^"']*)["']/g)) {
    const url = match[1].replaceAll("&amp;", "&");
    if (url.startsWith("//") || url.startsWith("/api/")) continue;
    localReferences.add(url);
    assert(resolveLocal(url), `Missing local reference in ${path.relative(out, file)}: ${url}`);
  }
}
assert.equal(read(path.join(out, "products.json")), read(path.join(root, "products.json")));
assert(read(path.join(out, "index.html")).includes("subscription-hero"));
assert(read(path.join(out, "_headers")).includes("font-src 'self'"));
assert(!/script-src[^;\n]*'unsafe-(?:inline|eval)'/.test(read(path.join(out, "_headers"))));
const forbidden = filesIn(out).filter((file) => /(?:^|\/)\.(?:env|dev\.vars|git)(?:[./]|$)/.test(file));
assert.equal(forbidden.length, 0, "Private environment or Git files entered the export");

if (process.argv.includes("--preservation")) {
  const backup = path.join(root, ".migration-backups/20261110-orbit-source");
  const manifest = JSON.parse(read(path.join(backup, "manifest.json")));
  const adjustments = JSON.parse(read(path.join(root, "integration/IMPORT_ADJUSTMENTS.json")));
  for (const [relative, hash] of Object.entries(manifest.protected_before)) {
    assert.equal(sha(path.join(root, relative)), hash, `Protected data changed: ${relative}`);
  }
  for (const [relative, hash] of Object.entries(manifest.original_src)) {
    assert.equal(sha(path.join(backup, "before", relative)), hash, `Original source lost: ${relative}`);
  }
  for (const [relative, hash] of Object.entries(manifest.dirty_before)) {
    const original = relative.startsWith("src/") || relative === "AI_CONTEXT.md"
      ? path.join(backup, "before", relative) : path.join(root, relative);
    assert.equal(sha(original), hash, `Pre-existing edit lost: ${relative}`);
  }
  for (const [relative, hash] of Object.entries(manifest.incoming_before)) {
    assert.equal(sha(path.join(manifest.source, relative)), hash, `Desktop source changed: ${relative}`);
    if (relative.startsWith("src/") && !Object.hasOwn(adjustments, relative)) {
      assert.equal(sha(path.join(root, relative)), hash, `Imported source differs: ${relative}`);
    }
    if (relative.startsWith("public/") && !relative.startsWith("public/data/") &&
        !["public/products.json", "public/_headers", "public/_redirects"].includes(relative)) {
      assert.equal(sha(path.join(root, relative)), hash, `Imported asset differs: ${relative}`);
    }
  }
  assert.equal(sha(path.join(root, "package-lock.json")), sha(path.join(backup, "before/package-lock.json")));
  assert.equal(sha(path.join(root, ".git/index")), manifest.index_sha256_before);
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: "0" };
  const git = (args) => {
    const actual = execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], { env, encoding: "utf8" }).trim();
    assert.equal(actual, root);
    return execFileSync("git", ["-C", root, ...args], { env, encoding: "utf8" });
  };
  assert.equal(git(["rev-parse", "HEAD"]).trim(), manifest.head_before);
  assert.equal(git(["show-ref"]), manifest.refs_before);
  console.log("Preservation verified: original edits, protected data, lockfile, Git history/index and Desktop source.");
}

console.log(`Source migration checks passed: ${htmlFiles.length} HTML pages, ${redirects.size} redirects, ${localReferences.size} local references.`);
