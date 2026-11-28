// npm run build && node scripts/check-auto-reload.mjs
// Real Chrome extension test for a local site that is rebuilt while Mobile
// View is open. The fixture is a plain static server: files carry only a
// Last-Modified date, so Chrome would reuse its copies. A reload shows the
// files as they are now, and with Auto reload on the devices reload by
// themselves once the files stop changing.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
// The feature tour is not under test: mark the current one as seen.
const tourRevision = /FEATURE_TOUR_REVISION = "([^"]+)"/.exec(await readFile(new URL("../src/app/release-notes.ts", import.meta.url), "utf8"))[1];
const longAgo = new Date(Date.now() - 30 * 86_400_000).toUTCString();
const files = {
  "/": { type: "text/html", version: 1, modified: longAgo, body: version => `<!doctype html><title>Build fixture</title><link rel="stylesheet" href="/site.css"><script src="/app.js"></script><h1 id="page" data-version="${version}">Build fixture</h1>` },
  "/site.css": { type: "text/css", version: 1, modified: longAgo, body: version => `#page{width:${version}00px;margin:0}` },
  "/app.js": { type: "text/javascript", version: 1, modified: longAgo, body: version => `window.scriptVersion=${version};` },
};
const rebuild = (...paths) => { for (const path of paths) Object.assign(files[path], { version: files[path].version + 1, modified: new Date().toUTCString() }); };
// Requests the viewer makes to look for changes, apart from the devices' own page loads.
let checks = 0, documents = 0;
const server = createServer((req, res) => {
  const file = files[new URL(req.url, "http://localhost").pathname];
  if (!file) { res.writeHead(404); res.end(); return; }
  if (req.headers["sec-fetch-dest"] === "empty") checks++;
  if (req.headers["sec-fetch-dest"] === "iframe") documents++;
  if (req.headers["if-modified-since"] === file.modified) { res.writeHead(304, { "last-modified": file.modified }); res.end(); return; }
  res.writeHead(200, { "content-type": file.type, "last-modified": file.modified });
  res.end(file.body(file.version));
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;
const profile = await mkdtemp(join(tmpdir(), "mdv-auto-reload-"));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: "chromium", headless: true, viewport: { width: 1440, height: 1000 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(pageUrl);
  const open = mode => worker.evaluate(async ({ url, mode }) => {
    const [tab] = await chrome.tabs.query({ url });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/content.js"] });
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id, ...mode }, { frameId: 0 });
    if (!reply?.ok) throw new Error(`Viewer did not open: ${reply?.error ?? "no reply"}`);
    return tab.id;
  }, { url: pageUrl, mode });
  await worker.evaluate(async ({ url, tourRevision }) => {
    const slot = ([id, deviceId]) => ({ id, deviceId, url, orientation: "portrait", zoom: 0.58, zoomMode: "fit", reloadToken: 0, showFrame: true });
    await chrome.storage.local.set({
      mdvUseCount: 4, responsiveTesterFirstRunComplete: true, mdvLastSeenTour: tourRevision, mdvLastSeenReleaseVersion: chrome.runtime.getManifest().version,
      mdvSimulatorSession: { slots: [["phone", "apple-iphone-18-pro-2026"], ["pixel", "google-pixel-8"]].map(slot), activeSlotId: "phone", display: { scrollSync: false, navigationSync: false, darkMode: false } },
    });
  }, { url: pageUrl, tourRevision });
  const tabId = await open({});

  const bounds = selector => worker.evaluate(async ({ tabId, selector }) => {
    const [frame] = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      func: selector => {
        const host = document.getElementById("multi-device-viewer-overlay");
        const element = host && chrome.dom.openOrClosedShadowRoot(host)?.querySelector(selector);
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return width && height ? { x, y, width, height, checked: element.getAttribute("aria-checked") } : null;
      },
      args: [selector],
    });
    return frame.result;
  }, { tabId, selector });
  const click = async selector => {
    await expect.poll(() => bounds(selector), { message: `${selector} is shown` }).toBeTruthy();
    const box = await bounds(selector);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  // What every device shows: its page, stylesheet and script versions.
  const shown = async () => {
    const frames = page.frames().filter(frame => /mdv-(?:mobile-)?preview-/.test(frame.name()));
    return (await Promise.all(frames.map(frame => frame.evaluate(() => {
      const heading = document.getElementById("page");
      return heading ? `${heading.dataset.version}/${parseInt(getComputedStyle(heading).width) / 100}/${window.scriptVersion}` : "loading";
    }).catch(() => "loading")))).sort().join(" ");
  };
  // Watching starts from the files as they are once it has read them all: a
  // page, its stylesheet and its script, so two rounds have certainly finished one.
  const watching = async () => { const from = checks; await expect.poll(() => checks - from, { message: "the viewer is checking the site" }).toBeGreaterThanOrEqual(6); };
  const quiet = async (ms = 2500) => { const before = [checks, documents]; await page.waitForTimeout(ms); return [checks - before[0], documents - before[1]]; };

  await expect.poll(shown, { message: "two devices show the first build" }).toBe("1/1/1 1/1/1");
  // Off unless chosen: nothing is asked of the server, and a build changes nothing on screen.
  assert.deepEqual(await quiet(), [0, 0], "no checks while Auto reload is off");
  rebuild("/site.css", "/app.js");
  assert.deepEqual(await quiet(), [0, 0], "a build is not noticed while Auto reload is off");
  assert.equal(await shown(), "1/1/1 1/1/1");
  // A reload by hand shows the files as they are now, not the copies Chrome kept.
  await click('button[aria-label="Reload all"]');
  await expect.poll(shown, { message: "Reload all shows the rebuilt stylesheet and script" }).toBe("1/2/2 1/2/2");

  // Turned on in Settings, it is remembered.
  await click('button[aria-label="Settings"]');
  await click('[role="switch"][aria-label="Auto reload"]');
  await expect.poll(async () => (await bounds('[role="switch"][aria-label="Auto reload"]'))?.checked).toBe("true");
  await expect.poll(() => worker.evaluate(async () => (await chrome.storage.local.get("mdvAutoReload")).mdvAutoReload)).toBe(true);
  await page.keyboard.press("Escape");
  await watching();

  // Only a stylesheet and a script were rewritten: the page itself is the same.
  let before = documents;
  rebuild("/site.css", "/app.js");
  await expect.poll(shown, { message: "devices reload after a build", timeout: 10_000 }).toBe("1/3/3 1/3/3");
  assert.equal(documents - before, 2, "each device reloaded once");
  assert.equal((await quiet())[1], 0, "and not again until the next build");
  // The page alone.
  before = documents;
  rebuild("/");
  await expect.poll(shown, { message: "devices reload after the page changes", timeout: 10_000 }).toBe("2/3/3 2/3/3");
  assert.equal(documents - before, 2);
  // A build that writes its files one after another is shown once, when it has finished.
  before = documents;
  rebuild("/site.css");
  await page.waitForTimeout(100);
  rebuild("/app.js");
  await page.waitForTimeout(100);
  rebuild("/");
  await expect.poll(shown, { message: "a longer build is shown complete", timeout: 10_000 }).toBe("3/4/4 3/4/4");
  assert.equal((await quiet())[1], 0);
  assert.equal(documents - before, 2, "one reload for the whole build");

  // A floating device has no settings of its own and follows the same choice.
  await open({ mode: "floating", deviceId: "google-pixel-8" });
  await expect.poll(shown, { message: "one floating device" }).toBe("3/4/4");
  await watching();
  rebuild("/site.css");
  await expect.poll(shown, { message: "the floating device reloads after a build", timeout: 10_000 }).toBe("3/5/4");

  // Closing the viewer stops the checks and removes the tab's rules.
  await worker.evaluate(({ tabId, url }) => chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "workspace", url, sourceTabId: tabId }, { frameId: 0 }), { tabId, url: pageUrl });
  await expect.poll(shown).toBe("3/5/4 3/5/4");
  await click('button[aria-label="Close viewer"]');
  await expect.poll(() => page.locator("#multi-device-viewer-overlay").count()).toBe(0);
  await expect.poll(() => worker.evaluate(async tabId => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.condition.tabIds?.includes(tabId)).length, tabId), { message: "rules removed with the viewer" }).toBe(0);
  await page.waitForTimeout(1500);
  assert.equal((await quiet())[0], 0, "no checks after the viewer closed");

  // A normal browser reload (F5) restores the open viewer on the new build.
  await worker.evaluate(() => chrome.storage.local.set({ mdvAutoReload: false }));
  await open({});
  await expect.poll(shown).toBe("3/5/4 3/5/4");
  rebuild("/", "/site.css", "/app.js");
  await page.reload();
  await expect.poll(shown, { message: "browser reload restores both previews with the rebuilt page, stylesheet and script" }).toBe("4/6/5 4/6/5");
  assert.deepEqual(errors, [], "no page errors");
  console.log("Local reload check passed: browser reload and Reload all show rebuilt files; Auto reload is off by default, remembers the switch, reloads all previews once per build, and stops when the viewer closes.");
} finally {
  await context?.close();
  server.close();
  await rm(profile, { recursive: true, force: true });
}
