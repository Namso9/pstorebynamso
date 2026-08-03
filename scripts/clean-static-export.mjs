import { readFile, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const packagePath = path.join(projectRoot, "package.json");
const outputDirectory = path.join(projectRoot, "out");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

if (packageJson.name !== "pstorebynamso") {
  throw new Error("Refusing to clean output outside the pstorebynamso project");
}

if (
  path.dirname(outputDirectory) !== projectRoot ||
  path.basename(outputDirectory) !== "out"
) {
  throw new Error(`Refusing unexpected output path: ${outputDirectory}`);
}

await rm(outputDirectory, { recursive: true, force: true });
console.log("Removed the generated out directory before static export.");
