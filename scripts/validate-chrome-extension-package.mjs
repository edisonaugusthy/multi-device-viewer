import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function validateChromeExtensionPackage(zipPath) {
  const { stdout } = await execFileAsync("unzip", ["-Z1", zipPath]);
  const files = stdout.split(/\r?\n/).filter(Boolean);
  const manifests = files.filter((file) => file.endsWith("manifest.json"));

  if (manifests.length !== 1 || manifests[0] !== "manifest.json") {
    throw new Error(
      `Chrome Web Store packages must contain exactly one root manifest.json. Found: ${manifests.join(", ")}`
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const zipPath = process.argv[2];

  if (!zipPath) {
    throw new Error("Usage: node scripts/validate-chrome-extension-package.mjs <zip-path>");
  }

  await validateChromeExtensionPackage(zipPath);
  console.log(`Validated Chrome extension package: ${zipPath}`);
}
