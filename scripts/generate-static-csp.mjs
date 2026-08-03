import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const GENERATED_START = "# BEGIN GENERATED NEXT STATIC CSP HASHES";
const GENERATED_END = "# END GENERATED NEXT STATIC CSP HASHES";
const CLOUDFLARE_HEADER_LINE_LIMIT = 2_000;
const CLOUDFLARE_HEADER_RULE_LIMIT = 100;
const checkOnly = process.argv.includes("--check");
const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "out");
const outputHeadersPath = path.join(outputDirectory, "_headers");
const publicHeadersPath = path.join(projectRoot, "public", "_headers");
const rootHeadersPath = path.join(projectRoot, "_headers");
const cloudflareWebAnalyticsScripts = [
  "https://static.cloudflareinsights.com/beacon.min.js",
  "https://static.cloudflareinsights.com/beacon.min.js/",
].join(" ");

const compatibilityPolicy =
  `default-src 'self'; script-src 'self' 'unsafe-inline' ${cloudflareWebAnalyticsScripts}; ` +
  "script-src-attr 'none'; " +
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
  "font-src https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data:; " +
  "connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; " +
  "frame-ancestors 'none'";

const nonScriptDirectives =
  "script-src-attr 'none'; " +
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
  "font-src https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data:; " +
  "connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; " +
  "frame-ancestors 'none'";

const executableScriptTypes = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript",
  "text/ecmascript",
  "application/ecmascript",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractAttribute(attributes, name) {
  const expression = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = attributes.match(expression);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function executableInlineScripts(html, fileName) {
  const bodies = [];
  const scriptExpression = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptExpression)) {
    const attributes = match[1];
    const body = match[2];
    if (extractAttribute(attributes, "src") !== null || body.length === 0) {
      continue;
    }

    const type = (extractAttribute(attributes, "type") ?? "")
      .trim()
      .toLowerCase()
      .split(";", 1)[0];

    if (!executableScriptTypes.has(type)) {
      if (type === "application/ld+json" || type === "application/json") {
        continue;
      }
      throw new Error(
        `Unknown inline script type ${JSON.stringify(type)} in ${fileName}`,
      );
    }

    bodies.push(body);
  }

  return [...new Set(bodies)];
}

function hashSource(scriptBody) {
  const digest = createHash("sha256")
    .update(Buffer.from(scriptBody, "utf8"))
    .digest("base64");
  return `'sha256-${digest}'`;
}

function policyForScripts(scriptBodies) {
  assert(scriptBodies.length > 0, "Expected at least one executable inline script");
  const hashes = scriptBodies.map(hashSource).join(" ");
  return (
    `default-src 'self'; script-src 'self' ${cloudflareWebAnalyticsScripts} ${hashes}; ` +
    nonScriptDirectives
  );
}

async function listHtmlFiles(directory) {
  const files = [];

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".html")) files.push(entryPath);
    }
  }

  await walk(directory);
  return files.sort();
}

function routeForHtml(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.slice(0, -"index.html".length)}*`;
  }
  return `/${normalized}`;
}

function headerRuleCount(headers) {
  return headers.split("\n").filter((line) => {
    const trimmed = line.trim();
    return line.length > 0 && !/^\s/.test(line) && !trimmed.startsWith("#");
  }).length;
}

function validateHeaderLines(headers) {
  const oversized = headers
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => Buffer.byteLength(line, "utf8") > CLOUDFLARE_HEADER_LINE_LIMIT);

  assert(
    oversized.length === 0,
    `Cloudflare's ${CLOUDFLARE_HEADER_LINE_LIMIT}-byte header-line limit was exceeded on line(s): ${oversized
      .map(({ number }) => number)
      .join(", ")}`,
  );

  const rules = headerRuleCount(headers);
  assert(
    rules <= CLOUDFLARE_HEADER_RULE_LIMIT,
    `Cloudflare's ${CLOUDFLARE_HEADER_RULE_LIMIT}-rule limit was exceeded (${rules})`,
  );
  return rules;
}

const [publicTemplate, rootTemplate] = await Promise.all([
  readFile(publicHeadersPath, "utf8"),
  readFile(rootHeadersPath, "utf8"),
]);

assert(
  publicTemplate === rootTemplate,
  "Root and public _headers templates must remain byte-for-byte synchronized",
);
assert(
  !publicTemplate.includes(GENERATED_START) &&
    !publicTemplate.includes(GENERATED_END),
  "Generated CSP rules belong only in out/_headers",
);

const compatibilityLine = `  Content-Security-Policy: ${compatibilityPolicy}`;
assert(
  publicTemplate.split(compatibilityLine).length === 2,
  "Expected exactly one compatibility CSP line in the _headers template",
);

const htmlFiles = await listHtmlFiles(outputDirectory);
assert(htmlFiles.length > 0, "No exported HTML files found in out");

const pages = [];
for (const filePath of htmlFiles) {
  const relativePath = path.relative(outputDirectory, filePath);
  const html = await readFile(filePath, "utf8");
  const scripts = executableInlineScripts(html, relativePath);
  pages.push({
    filePath,
    relativePath,
    route: routeForHtml(relativePath),
    scripts,
    policy: policyForScripts(scripts),
  });
}

const fallback = pages.find(({ relativePath }) => relativePath === "404.html");
assert(fallback, "Expected out/404.html for the catch-all CSP fallback");

const routeNames = new Set();
for (const page of pages) {
  assert(!routeNames.has(page.route), `Duplicate generated route: ${page.route}`);
  routeNames.add(page.route);
  assert(
    !/script-src[^;]*'unsafe-inline'/.test(page.policy),
    `Generated script policy is not strict for ${page.relativePath}`,
  );
  assert(
    !page.policy.includes("'unsafe-eval'"),
    `Generated policy unexpectedly allows eval for ${page.relativePath}`,
  );
  for (const script of page.scripts) {
    assert(
      page.policy.includes(hashSource(script)),
      `Missing CSP hash for an inline script in ${page.relativePath}`,
    );
  }
}

const routeRules = pages
  .filter(({ relativePath }) => relativePath !== "404.html")
  .map(
    ({ route, policy, relativePath }) =>
      `# ${relativePath}\n${route}\n  ! Content-Security-Policy\n  Content-Security-Policy: ${policy}`,
  )
  .join("\n\n");

const generatedBlock = [
  GENERATED_START,
  "# Generated by scripts/generate-static-csp.mjs. Do not edit out/_headers.",
  "# The global rule uses the exported 404 policy; each HTML route detaches it",
  "# and installs hashes for exactly that document's executable inline scripts.",
  routeRules,
  GENERATED_END,
].join("\n");

const expectedHeaders = `${publicTemplate.replace(
  compatibilityLine,
  `  Content-Security-Policy: ${fallback.policy}`,
).trimEnd()}\n\n${generatedBlock}\n`;

const rules = validateHeaderLines(expectedHeaders);
const largestHeaderLine = Math.max(
  ...expectedHeaders
    .split("\n")
    .map((line) => Buffer.byteLength(line, "utf8")),
);

if (checkOnly) {
  const currentHeaders = await readFile(outputHeadersPath, "utf8");
  assert(
    currentHeaders === expectedHeaders,
    "out/_headers is stale; run npm run build to regenerate CSP hashes",
  );
} else {
  await writeFile(outputHeadersPath, expectedHeaders, "utf8");
}

const uniqueHashes = new Set(
  pages.flatMap(({ scripts }) => scripts.map(hashSource)),
);
console.log(
  `${checkOnly ? "Verified" : "Generated"} strict CSP hashes for ${pages.length} HTML files ` +
    `(${uniqueHashes.size} unique executable scripts, ${rules} header rules, ` +
    `largest line ${largestHeaderLine}/${CLOUDFLARE_HEADER_LINE_LIMIT} bytes).`,
);
