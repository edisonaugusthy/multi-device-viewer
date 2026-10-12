import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const execFileAsync = promisify(execFile);

export async function validateChromeExtensionPackage(zipPath) {
  const { stdout } = await execFileAsync("unzip", ["-Z1", zipPath]);
  const files = stdout.split(/\r?\n/).filter(Boolean);
  for (const [packaged, source] of [["LICENSE.txt", "LICENSE"], ["ARTWORK-LICENSE.txt", "ARTWORK-LICENSE.txt"]]) {
    if (!files.includes(packaged)) throw new Error(`Package is missing ${packaged}.`);
    const { stdout: contents } = await execFileAsync("unzip", ["-p", zipPath, packaged]);
    if (contents !== await readFile(new URL(`../${source}`, import.meta.url), "utf8")) {
      throw new Error(`Packaged ${packaged} does not match the current license.`);
    }
  }
  if (files.some((file) => /(?:^|\/)(?:device-art\.mjs|frames\.json|icon\.svg|private-artwork\/|internal\/|source\/captures\/)/.test(file))) {
    throw new Error("Package includes private artwork inputs.");
  }
  // Every catalogued frame must be packaged. The owner's private manifest also
  // pins each image's checksum; without it (for example in CI) only presence is checked.
  const catalog = await readFile(new URL("../src/domain/device/device-art-frames.ts", import.meta.url), "utf8");
  const ids = JSON.parse(catalog.slice(catalog.indexOf("= [") + 2, catalog.lastIndexOf("]") + 1)).map((frame) => frame.id);
  const manifestUrl = new URL("../internal/tools/device-frames/manifest.json", import.meta.url);
  const checksums = new Map(existsSync(manifestUrl) ? JSON.parse(await readFile(manifestUrl, "utf8")).map((frame) => [frame.id, frame.sha256]) : []);
  for (const id of ids) {
    const path = `mockups/${id}.webp`;
    if (!files.includes(path)) throw new Error(`Package is missing ${path}.`);
    if (!checksums.has(id)) continue;
    const { stdout: bytes } = await execFileAsync("unzip", ["-p", zipPath, path], { encoding: "buffer" });
    if (createHash("sha256").update(bytes).digest("hex") !== checksums.get(id)) {
      throw new Error(`Packaged ${path} does not match the frame manifest.`);
    }
  }
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

  const viewerScripts = (manifest.content_scripts ?? []).filter(script => script.js?.includes("content-scripts/content.js"));
  const bridgeScripts = (manifest.content_scripts ?? []).filter(script => script.js?.includes("content-scripts/preview-bridge.js"));
  if (viewerScripts.length !== 0 || !files.includes("content-scripts/content.js")
    || bridgeScripts.length !== 1 || bridgeScripts[0].all_frames !== true || bridgeScripts[0].run_at !== "document_start") {
    throw new Error("Package the viewer for on-demand injection only, and register the preview bridge in all frames at document_start to capture resource failures.");
  }
  for (const file of new Set((manifest.content_scripts ?? []).flatMap(script => script.js ?? []))) {
    if (!files.includes(file)) throw new Error(`Missing packaged content script: ${file}`);
  }
  const { stdout: bridgeSource } = await execFileAsync("unzip", ["-p", zipPath, "content-scripts/preview-bridge.js"]);
  // Allow bridge growth while catching accidental imports of the full React UI.
  if (Buffer.byteLength(bridgeSource) > 128 * 1024) {
    throw new Error("Preview bridge exceeds 128 KiB; check for viewer UI dependencies.");
  }

  const requiredIcons = ["16", "32", "48", "128"];
  for (const size of requiredIcons) {
    const iconPath = manifest.icons?.[size];
    if (typeof iconPath !== "string" || !files.includes(iconPath.replace(/^\//, ""))) {
      throw new Error(`Manifest is missing its packaged ${size}px icon.`);
    }
  }

  const extensionCsp = manifest.content_security_policy?.extension_pages ?? "";
  if (!files.includes("wasm/pixel-diff.wasm")) throw new Error("Package is missing the visual comparison WASM module.");
  const { stdout: wasmBytes } = await execFileAsync("unzip", ["-p", zipPath, "wasm/pixel-diff.wasm"], { encoding: "buffer" });
  if (!WebAssembly.validate(wasmBytes)) throw new Error("Packaged visual comparison WASM module is invalid.");
  if (createHash("sha256").update(wasmBytes).digest("hex") !== createHash("sha256").update(await readFile(new URL("../public/wasm/pixel-diff.wasm", import.meta.url))).digest("hex")) {
    throw new Error("Packaged visual comparison WASM module does not match the current build.");
  }
  // WASM compilation is allowed separately from JavaScript eval().
  if (/(?:^|[\s;])'unsafe-eval'|https?:\/\//i.test(extensionCsp)) {
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
