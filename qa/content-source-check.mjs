import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

const faq = await readJson("data/faq.json");
const faqMirror = await readJson("public/data/faq.json");
assert.deepEqual(faqMirror, faq, "generated FAQ fallback must equal canonical FAQ");
for (const [page, section] of Object.entries(faq)) {
  assert.equal(typeof section?.title, "string", `${page} FAQ title must remain a string`);
  assert.ok(Array.isArray(section?.items), `${page} FAQ items must remain an array`);
  for (const [index, item] of section.items.entries()) {
    assert.equal(typeof item?.q, "string", `${page}#${index} q must remain a string`);
    assert.equal(
      typeof item?.a_html,
      "string",
      `${page}#${index} a_html must remain a string`,
    );
  }
}

const reviews = await readJson("data/reviews.json");
const reviewMirror = await readJson("public/data/reviews.json");
assert.deepEqual(
  reviewMirror,
  reviews,
  "generated review-list fallback must equal canonical review list",
);

const reviewName = /^review\d+\.(?:webp|jpe?g|png)$/i;
const sourceNames = (await readdir(path.join(root, "images")))
  .filter((name) => reviewName.test(name))
  .sort();
const mirrorNames = (await readdir(path.join(root, "public/images")))
  .filter((name) => reviewName.test(name))
  .sort();
assert.deepEqual(mirrorNames, sourceNames, "generated review images must match canonical names");
for (const name of sourceNames) {
  assert.deepEqual(
    await readFile(path.join(root, "public/images", name)),
    await readFile(path.join(root, "images", name)),
    `${name} mirror must be byte-identical`,
  );
}

console.log(
  `Canonical content check passed: ${Object.keys(faq).length} FAQ sections and ` +
    `${sourceNames.length} review images have exact generated mirrors.`,
);
