// Loads the built extension (.output/chrome-mv3) in Chromium, opens the viewer
// on a local page the same way the toolbar button does, and checks that it
// mounts, renders device frames and loads the page into live previews.
//
//   npm run build && npm run test:extension

import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
const html = "<!doctype html><title>Smoke page</title><h1>Smoke page</h1><p>Mobile View extension smoke test.</p>";
const server = createServer((_, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(html); });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;
const profile = await mkdtemp(join(tmpdir(), "mdv-smoke-"));
const failures = [];

const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const extensionOrigin = worker.url().split("/").slice(0, 3).join("/");
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => { if (request.url().startsWith(extensionOrigin)) errors.push(`failed ${request.url()}`); });
  await page.goto(pageUrl);

  // What the toolbar button does: inject the viewer and ask it to open.
  const started = Date.now();
  await worker.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/content.js"] });
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
    if (!reply?.ok) throw new Error(`Viewer did not open: ${reply?.error ?? "no reply"}`);
  }, pageUrl);

  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "attached", timeout: 15000 });
  const previews = () => page.frames().filter((frame) => frame !== page.mainFrame() && frame.url() === pageUrl);
  // The viewer lives in a closed shadow root; the DevTools protocol can pierce it.
  const cdp = await context.newCDPSession(page);
  const frameImages = async () => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const images = [];
    const walk = (node) => {
      const src = node.attributes?.[node.attributes.indexOf("src") + 1];
      if (node.nodeName === "IMG" && node.attributes.includes("src") && src.startsWith(`${extensionOrigin}/mockups/`)) images.push(node.backendNodeId);
      for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) walk(child);
    };
    walk(root);
    let loaded = 0;
    for (const backendNodeId of images) {
      const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
      const { result } = await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function () { return this.complete && this.naturalWidth > 0; }", returnByValue: true });
      if (result.value) loaded++;
    }
    return loaded;
  };
  for (let i = 0; i < 100 && (previews().length === 0 || await frameImages() === 0); i++) await page.waitForTimeout(150);
  const opened = Date.now() - started;
  const frameCount = await frameImages();
  const previewCount = previews().length;
  const headings = await Promise.all(previews().map((frame) => frame.locator("h1").textContent({ timeout: 5000 }).catch(() => null)));

  if (!previewCount) failures.push("no live preview loaded the page");
  if (headings.some((text) => text !== "Smoke page")) failures.push("a preview did not render the page");
  if (!frameCount) failures.push("no device frame image loaded");
  console.log(`viewer opened in ${opened} ms; ${previewCount} live previews; ${frameCount} device frames`);

  // A second click closes the viewer and restores the page.
  await worker.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
  }, pageUrl);
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached", timeout: 5000 }).catch(() => failures.push("viewer did not close"));

  // The simulator page (used where the viewer cannot be injected) shares the same code.
  const simulator = await context.newPage();
  simulator.on("pageerror", (error) => errors.push(`simulator: ${error.message}`));
  await simulator.goto(`${extensionOrigin}/simulator.html?url=${encodeURIComponent(pageUrl)}`);
  const simulatorPreviews = () => simulator.frames().filter((frame) => frame.url() === pageUrl).length;
  for (let i = 0; i < 100 && simulatorPreviews() === 0; i++) await simulator.waitForTimeout(150);
  if (!simulatorPreviews()) failures.push("simulator page did not load a preview");
  if (!await simulator.locator(`img[src*="/mockups/"]`).count()) failures.push("simulator page shows no device frames");
  console.log(`simulator page: ${simulatorPreviews()} live previews`);
  for (const error of errors) failures.push(`console: ${error}`);
} finally {
  await context.close();
  server.close();
  await rm(profile, { recursive: true, force: true });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Extension smoke test passed");
