import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const liveFiles = [
  "products.json",
  "data/faq.json",
  "data/reviews.json",
  "data/express-guide.json",
];

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

console.log(`Synchronized ${liveFiles.length} live-data fallbacks.`);
