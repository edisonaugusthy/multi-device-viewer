// Loads the built extension (.output/chrome-mv3) in Chromium, opens the viewer
// on a local page the same way the toolbar button does, and checks that it
// mounts, renders device frames and loads the page into live previews.
//
//   npm run build && npm run test:extension
//
// Exact device identities are covered only against a build that holds the
// debugger permission from the start (MDV_DEBUGGER_REQUIRED=1 npm run build),
// since Chrome grants the optional permission only at the user's click.

import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
const pages = {
  "/": "<!doctype html><title>Smoke page</title><h1>Smoke page</h1><p>Mobile View extension smoke test.</p><a href=\"/next\">Next page</a>",
  "/next": "<!doctype html><title>Next page</title><h1>Next page</h1>",
  "/self": "<!doctype html><title>Self page</title><h1>Self page</h1>",
  "/exact": "<!doctype html><title>Exact page</title><h1>Exact page</h1>",
};
// The User-Agent of each request, by what it loaded and which page: phone
// previews identify as the workspace's iPhone, the MacBook preview as Safari
// on a Mac, and the page itself keeps the browser's own.
const agents = { iframe: new Map(), document: new Map() };
const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const seen = agents[req.headers["sec-fetch-dest"]];
  if (seen) seen.set(path, [...seen.get(path) ?? [], req.headers["user-agent"] ?? ""]);
  res.writeHead(200, { "content-type": "text/html" }); res.end(pages[path] ?? pages["/"]);
});
const IPHONE = /iPhone/, MAC_SAFARI = /Macintosh.*Version\/\d+\.0 Safari\/605/;
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
  const frameAgents = agents.iframe.get("/") ?? [];
  if (!frameAgents.some((agent) => IPHONE.test(agent))) failures.push(`no preview frame identified as the workspace's iPhone: ${frameAgents.join(" | ") || "no frame request"}`);
  if (!frameAgents.some((agent) => MAC_SAFARI.test(agent))) failures.push(`no preview frame identified as the MacBook's Safari: ${frameAgents.join(" | ") || "no frame request"}`);
  if ((agents.document.get("/") ?? []).some((agent) => IPHONE.test(agent) || MAC_SAFARI.test(agent))) failures.push("the page itself was requested as a device");
  console.log(`viewer opened in ${opened} ms; ${previewCount} live previews; ${frameCount} device frames`);

  // A link followed inside a phone preview is fetched as a phone too: the
  // wrapper frame navigates it, so the request starts from the extension.
  const wrapped = previews().find((frame) => frame.parentFrame()?.url().startsWith(`${extensionOrigin}/preview-frame.html`));
  if (!wrapped) failures.push("no phone preview was wrapped in the extension's frame");
  else {
    // A click dispatched in the page, as a pointer click on the scaled device would land anywhere.
    await wrapped.evaluate(() => document.querySelector("a").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
    for (let i = 0; i < 100 && !(agents.iframe.get("/next") ?? []).length; i++) await page.waitForTimeout(100);
    const nextAgents = agents.iframe.get("/next") ?? [];
    if (!nextAgents.length || !nextAgents.every((agent) => IPHONE.test(agent))) failures.push(`a link inside the phone preview was not fetched as an iPhone: ${nextAgents.join(" | ") || "no request"}`);
    const next = page.frames().find((frame) => frame.url() === `${pageUrl}next`);
    const landed = await next?.locator("h1").textContent({ timeout: 5000 }).catch(() => null);
    if (landed !== "Next page") failures.push("the phone preview did not show the linked page");
    // A page the script navigates itself starts from the website, so it
    // arrives as desktop once and is fetched again as a phone.
    await next?.evaluate(() => { location.href = "/self"; });
    for (let i = 0; i < 100 && (agents.iframe.get("/self") ?? []).length < 2; i++) await page.waitForTimeout(100);
    const selfAgents = agents.iframe.get("/self") ?? [];
    if (selfAgents.length < 2 || !MAC_SAFARI.test(selfAgents[0]) || !IPHONE.test(selfAgents[selfAgents.length - 1])) failures.push(`a page navigated by its own script was not fetched as desktop, then again as an iPhone: ${selfAgents.join(" | ") || "no request"}`);
    const self = await page.frames().find((frame) => frame.url() === `${pageUrl}self`)?.locator("h1").textContent({ timeout: 5000 }).catch(() => null);
    if (self !== "Self page") failures.push("the phone preview did not show the page it navigated to itself");
  }

  // A second click closes the viewer and restores the page.
  await worker.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
  }, pageUrl);
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached", timeout: 5000 }).catch(() => failures.push("viewer did not close"));

  // Exact device identities need the debugger, which Chrome grants only at the
  // user's click; a build with MDV_DEBUGGER_REQUIRED=1 has it from the start,
  // so this part runs only against such a build.
  const manifest = JSON.parse(await readFile(join(extension, "manifest.json"), "utf8"));
  if (manifest.permissions?.includes("debugger")) {
    const exactUrl = `${pageUrl}exact`;
    await worker.evaluate(async (url) => {
      const slot = (id, deviceId) => ({ id, deviceId, url, orientation: "portrait", zoom: 0.58, zoomMode: "fit", reloadToken: 0, showFrame: true });
      await chrome.storage.local.set({ mdvSimulatorSession: {
        slots: [slot("exact-iphone", "apple-iphone-18-pro-2026"), slot("exact-pixel", "google-pixel-8"), slot("exact-mac", "apple-macbook-pro-14-m5-2025")],
        activeSlotId: "exact-iphone",
        display: { scrollSync: false, navigationSync: false, darkMode: false, previewStyle: "device", exactIdentities: true },
      } });
    }, exactUrl);
    const exactPage = await context.newPage();
    exactPage.on("pageerror", (error) => errors.push(`exact: ${error.message}`));
    await exactPage.goto(exactUrl);
    await worker.evaluate(async (url) => {
      const [tab] = await chrome.tabs.query({ url });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/content.js"] });
      const reply = await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
      if (!reply?.ok) throw new Error(`Viewer did not open: ${reply?.error ?? "no reply"}`);
    }, exactUrl);
    const exactPreviews = () => exactPage.frames().filter((frame) => frame !== exactPage.mainFrame() && frame.url() === exactUrl);
    for (let i = 0; i < 100 && exactPreviews().length < 3; i++) await exactPage.waitForTimeout(150);
    const exactAgents = agents.iframe.get("/exact") ?? [];
    const ANDROID = /Linux; Android 10; K.*Mobile Safari/;
    for (const [name, pattern] of [["iPhone", IPHONE], ["Android", ANDROID], ["Mac Safari", MAC_SAFARI]]) {
      if (!exactAgents.some((agent) => pattern.test(agent))) failures.push(`exact identities: no preview requested the page as ${name}: ${exactAgents.join(" | ") || "no request"}`);
    }
    if (!exactPreviews().every((frame) => frame.parentFrame()?.url().startsWith(`${extensionOrigin}/preview-frame.html`))) failures.push("exact identities: a preview was not wrapped");
    // The page's scripts see the device's browser too.
    const scriptAgents = await Promise.all(exactPreviews().map((frame) => frame.evaluate(() => navigator.userAgent).catch(() => "")));
    for (const [name, pattern] of [["iPhone", IPHONE], ["Android", ANDROID], ["Mac Safari", MAC_SAFARI]]) {
      if (!scriptAgents.some((agent) => pattern.test(agent))) failures.push(`exact identities: no preview's navigator.userAgent is ${name}: ${scriptAgents.join(" | ")}`);
    }
    console.log(`exact identities: ${exactPreviews().length} previews, ${new Set(exactAgents).size} distinct agents on one page`);
    await exactPage.close();
  } else console.log("exact identities: skipped (build without MDV_DEBUGGER_REQUIRED=1)");

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
