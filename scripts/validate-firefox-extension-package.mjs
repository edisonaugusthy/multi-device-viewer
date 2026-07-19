import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function validateFirefoxExtensionPackage(zipPath) {
  const { stdout: listing } = await execFileAsync("unzip", ["-Z1", zipPath]);
  const files = listing.split(/\r?\n/).filter(Boolean);
  const manifests = files.filter((file) => file.endsWith("manifest.json"));

  if (manifests.length !== 1 || manifests[0] !== "manifest.json") {
    throw new Error(
      `Firefox packages must contain exactly one root manifest.json. Found: ${manifests.join(", ")}`,
    );
  }

  const { stdout: manifestText } = await execFileAsync("unzip", ["-p", zipPath, "manifest.json"]);
  const manifest = JSON.parse(manifestText);
  const gecko = manifest.browser_specific_settings?.gecko;
  const geckoAndroid = manifest.browser_specific_settings?.gecko_android;
  const permissions = new Set(manifest.permissions ?? []);

  if (manifest.manifest_version !== 3) throw new Error("Firefox package must use Manifest V3.");
  if (!gecko?.id) throw new Error("Firefox Manifest V3 package is missing browser_specific_settings.gecko.id.");
  if (!gecko?.data_collection_permissions?.required?.includes("none")) {
    throw new Error("Firefox package must explicitly declare that it transmits no data.");
  }
  if (Number.parseInt(gecko.strict_min_version, 10) < 140) {
    throw new Error("Firefox package must target Firefox 140 or newer for built-in data consent.");
  }
  if (Number.parseInt(geckoAndroid?.strict_min_version, 10) < 142) {
    throw new Error("Firefox for Android package must target version 142 or newer for built-in data consent.");
  }
  for (const chromeOnlyPermission of ["offscreen", "tabCapture"]) {
    if (permissions.has(chromeOnlyPermission)) {
      throw new Error(`Firefox package contains unsupported permission: ${chromeOnlyPermission}`);
    }
  }
  if (files.some((file) => file === "offscreen.html" || /(^|\/)offscreen-[^/]+\.js$/.test(file))) {
    throw new Error("Firefox package contains the Chrome-only offscreen recorder.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const zipPath = process.argv[2];
  if (!zipPath) throw new Error("Usage: node scripts/validate-firefox-extension-package.mjs <zip-path>");
  await validateFirefoxExtensionPackage(zipPath);
  console.log(`Validated Firefox extension package: ${zipPath}`);
}
