import assert from "node:assert/strict";
import { copyFile, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const allLiveFiles = [
  "products.json",
  "data/faq.json",
  "data/reviews.json",
  "data/express-guide.json",
  "data/bioscope-download.json",
];
const faqReviewOnly = process.argv.includes("--faq-review-only");
const liveFiles = faqReviewOnly
  ? ["data/faq.json", "data/reviews.json"]
  : allLiveFiles;

for (const relativePath of liveFiles) {
  const sourcePath = path.join(projectRoot, relativePath);
  const publicPath = path.join(projectRoot, "public", relativePath);
  const source = await readFile(sourcePath, "utf8");
  JSON.parse(source);

  let current = "";
  try {
    current = await readFile(publicPath, "utf8");
  } catch (error) {
    assert.equal(error?.code, "ENOENT");
  }
  if (current !== source) await writeFile(publicPath, source, "utf8");
}

// Review binaries have the same source-of-truth split as reviews.json: the
// panel commits canonical images/reviewN.<ext> files at runtime, while Next's
// static export reads public/images/. Mirror them before every build so the
// next export contains every live review and removes deleted review mirrors.
const reviewName = /^review\d+\.(?:webp|jpe?g|png)$/i;
const sourceImages = path.join(projectRoot, "images");
const publicImages = path.join(projectRoot, "public", "images");
const sourceReviewNames = (await readdir(sourceImages)).filter((name) =>
  reviewName.test(name),
);
const publicReviewNames = (await readdir(publicImages)).filter((name) =>
  reviewName.test(name),
);
const sourceReviewSet = new Set(sourceReviewNames);

for (const name of sourceReviewNames) {
  await copyFile(path.join(sourceImages, name), path.join(publicImages, name));
}
for (const name of publicReviewNames) {
  if (!sourceReviewSet.has(name)) await unlink(path.join(publicImages, name));
}

console.log(
  `Synchronized ${liveFiles.length} live-data fallbacks and ${sourceReviewNames.length} review images.`,
);
