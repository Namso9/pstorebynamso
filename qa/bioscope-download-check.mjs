/**
 * Guards the Bioscope download page's data contract without a browser.
 *
 * The page's links are the product: a wrong host or a plain-http href would
 * hand a customer an unrelated binary. This re-states the shape and the host
 * policy that `parseBioscopeDownloadData` enforces at runtime, checks the
 * generated public mirror still matches the canonical source, and proves the
 * live proxy is allowed to serve the file.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

const CANONICAL = "data/bioscope-download.json";
const MIRROR = "public/data/bioscope-download.json";
const ALLOWED_HOSTS = new Set([
  "apps.apple.com",
  "bioscopeapp.com",
  "link.bioscopeapp.com",
  "play.google.com",
  "testflight.apple.com",
]);
const KINDS = new Set(["apk", "dmg", "exe", "store", "testflight", "zip"]);
const DEVICE_TOKENS = new Set(["android", "androidtv", "ios", "mac", "windows"]);

const data = await readJson(CANONICAL);
const mirror = await readJson(MIRROR);
assert.deepEqual(
  mirror,
  data,
  "the generated public mirror must equal the canonical Bioscope data",
);

assert.equal(typeof data.updated, "string", "updated must be a string");
for (const field of ["name", "subtitle", "tagline", "logo"]) {
  assert.ok(data.app?.[field]?.trim(), `app.${field} must be a non-empty string`);
}
assert.ok(
  !data.app.logo.startsWith("http"),
  "app.logo must stay a same-origin asset path — the CSP blocks remote images",
);

const groupIds = new Set();
for (const group of data.groups) {
  assert.ok(group.id?.trim(), "every group needs an id");
  assert.ok(!groupIds.has(group.id), `duplicate group id ${group.id}`);
  groupIds.add(group.id);
  assert.ok(group.label?.trim() && group.hint?.trim(), `${group.id} needs a label and hint`);
  assert.ok(Array.isArray(group.detect) && group.detect.length > 0, `${group.id} needs detect tokens`);
  for (const token of group.detect) {
    assert.ok(DEVICE_TOKENS.has(token), `${group.id} has an unknown detect token ${token}`);
  }
}

const downloadIds = new Set();
const featuredByGroup = new Map();
for (const download of data.downloads) {
  const id = download.id;
  assert.ok(id?.trim(), "every download needs an id");
  assert.ok(!downloadIds.has(id), `duplicate download id ${id}`);
  downloadIds.add(id);
  assert.ok(groupIds.has(download.group), `${id} points at unknown group ${download.group}`);
  assert.ok(KINDS.has(download.kind), `${id} has an unknown kind ${download.kind}`);
  for (const field of ["title", "action"]) {
    assert.ok(download[field]?.trim(), `${id} needs a ${field}`);
  }
  if (download.note !== undefined) {
    assert.ok(download.note.trim(), `${id} has an empty note`);
  }

  for (const [label, href] of [
    ["href", download.href],
    ...(download.alternates || []).map((a) => [`alternate "${a.label}"`, a.href]),
  ]) {
    const url = new URL(href);
    assert.equal(url.protocol, "https:", `${id} ${label} must use https`);
    assert.ok(
      ALLOWED_HOSTS.has(url.hostname),
      `${id} ${label} points at unapproved host ${url.hostname}`,
    );
  }

  if (download.detect) {
    assert.ok(
      DEVICE_TOKENS.has(download.detect),
      `${id} has an unknown detect token ${download.detect}`,
    );
    const group = data.groups.find((entry) => entry.id === download.group);
    assert.ok(
      group.detect.includes(download.detect),
      `${id} claims device ${download.detect}, which its group ${download.group} does not cover`,
    );
    const sameDevice = data.downloads.filter(
      (other) => other.group === download.group && other.detect === download.detect,
    );
    assert.equal(
      sameDevice.length,
      1,
      `device ${download.detect} is claimed by ${sameDevice.length} downloads in ${download.group}`,
    );
  }

  if (download.featured) {
    featuredByGroup.set(download.group, (featuredByGroup.get(download.group) || 0) + 1);
  }
}

// Detection only helps if every device a group advertises has an entry to lead
// with; otherwise a visitor sees the group's generic default.
for (const group of data.groups) {
  for (const token of group.detect) {
    assert.ok(
      data.downloads.some(
        (download) => download.group === group.id && download.detect === token,
      ),
      `group ${group.id} advertises device ${token} with no download claiming it`,
    );
  }
}

// The hero CTA is one button. It resolves to the visitor's own device when
// detection succeeds, and to the group's `featured` entry otherwise — so each
// group needs exactly one of those, or the fallback is silent about which.
for (const [group, count] of featuredByGroup) {
  assert.equal(count, 1, `group ${group} must have exactly one featured download, found ${count}`);
}
for (const group of groupIds) {
  assert.ok(
    data.downloads.some((download) => download.group === group),
    `group ${group} has no downloads`,
  );
}

const STEP_KINDS = new Set(["step", "note", "warning"]);
const referencedImages = new Set();

for (const guide of data.guides) {
  assert.ok(groupIds.has(guide.group), `a guide points at unknown group ${guide.group}`);
  assert.ok(guide.sections?.length > 0, `guide ${guide.group} needs sections`);
  for (const section of guide.sections) {
    assert.ok(section.title?.trim(), `guide ${guide.group} has a section without a title`);
    assert.ok(section.steps?.length > 0, `guide section "${section.title}" needs steps`);
    let numbered = 0;
    for (const step of section.steps) {
      const where = `guide section "${section.title}"`;
      assert.ok(step?.text?.trim(), `${where} has a step without text`);
      if (step.kind !== undefined) {
        assert.ok(STEP_KINDS.has(step.kind), `${where} has unknown step kind ${step.kind}`);
      }
      if ((step.kind || "step") === "step") numbered += 1;
      // The owner asked that the walkthroughs never send a customer to the
      // vendor's own link page — the download buttons are the only exit.
      assert.ok(
        !/https?:\/\//i.test(step.text),
        `${where} must not carry a link in its steps`,
      );
      for (const image of step.images || []) {
        assert.ok(image.src?.trim(), `${where} has an image without a src`);
        // `img-src 'self' data:` — a remote screenshot would be CSP-blocked.
        assert.ok(
          !/^[a-z]+:/i.test(image.src) && !image.src.startsWith("//"),
          `${where} image ${image.src} must be a same-origin path`,
        );
        assert.ok(image.alt?.trim(), `${where} image ${image.src} needs alt text`);
        assert.ok(
          Number.isFinite(image.width) && image.width > 0 &&
            Number.isFinite(image.height) && image.height > 0,
          `${where} image ${image.src} needs real width and height`,
        );
        referencedImages.add(image.src);
      }
    }
    assert.ok(numbered > 0, `guide section "${section.title}" has no numbered steps`);
  }
}

// Every screenshot the guide names has to actually ship in the export.
for (const src of referencedImages) {
  await readFile(path.join(root, "public", src));
}

await readFile(path.join(root, "public", data.app.logo));

const proxy = await readFile(path.join(root, "functions/data/[file].js"), "utf8");
assert.ok(
  proxy.includes("'bioscope-download.json'"),
  "the live /data proxy must allow bioscope-download.json",
);
const prebuild = await readFile(path.join(root, "scripts/sync-live-data.mjs"), "utf8");
assert.ok(
  prebuild.includes('"data/bioscope-download.json"'),
  "prebuild must mirror data/bioscope-download.json into public/",
);

const linkCount =
  data.downloads.length +
  data.downloads.reduce((total, d) => total + (d.alternates?.length || 0), 0);

console.log(
  `Bioscope download check passed: ${data.groups.length} device groups, ` +
    `${linkCount} official links, ${data.guides.length} install guides, ` +
    `${referencedImages.size} guide screenshots present.`,
);
