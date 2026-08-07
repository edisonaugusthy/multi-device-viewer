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

  const { stdout: manifestSource } = await execFileAsync("unzip", [
    "-p",
    zipPath,
    "manifest.json",
  ]);
  const manifest = JSON.parse(manifestSource);

  if (manifest.manifest_version !== 3) {
    throw new Error(
      `Chrome Web Store packages must use Manifest V3. Found manifest_version=${manifest.manifest_version}`,
    );
  }

  if (typeof manifest.background?.service_worker !== "string") {
    throw new Error("Manifest V3 package is missing a background service worker.");
  }

  const requiredIcons = ["16", "32", "48", "128"];
  for (const size of requiredIcons) {
    const iconPath = manifest.icons?.[size];
    if (typeof iconPath !== "string" || !files.includes(iconPath.replace(/^\//, ""))) {
      throw new Error(`Manifest is missing its packaged ${size}px icon.`);
    }
  }

  const extensionCsp = manifest.content_security_policy?.extension_pages ?? "";
  if (/unsafe-eval|https?:\/\//i.test(extensionCsp)) {
    throw new Error(
      `Extension CSP must not permit remote code or unsafe evaluation: ${extensionCsp}`,
    );
  }

  const exposedMatches = (manifest.web_accessible_resources ?? []).flatMap(
    (resource) => resource.matches ?? [],
  );
  if ([...(manifest.host_permissions ?? []), ...exposedMatches].includes("<all_urls>")) {
    throw new Error(
      "Use explicit HTTP/HTTPS match patterns instead of broader <all_urls> access.",
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
