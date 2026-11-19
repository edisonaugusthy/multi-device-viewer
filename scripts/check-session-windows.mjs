// npm run build && node scripts/check-session-windows.mjs
// Real Chrome extension test for two per-device options, with no new
// permissions: a guest session (a clean, signed-out device beside a signed-in
// one) and the always-on-top window (a floating preview's device above other
// apps, still signed in, with its device headers and its link to the viewer).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
const manifest = JSON.parse(await readFile(join(extension, "manifest.json"), "utf8"));
assert.deepEqual(manifest.permissions, ["activeTab", "contextMenus", "declarativeNetRequestWithHostAccess", "downloads", "scripting", "storage", "offscreen", "tabCapture"], "no new permissions");

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const seen = { cookie: req.headers.cookie ?? "", ua: req.headers["user-agent"] };
  // Every page refuses to be embedded, so a frame that loads proves the tab's rules reached it.
  const headers = { "cache-control": "no-store", "x-frame-options": "DENY" };
  if (path === "/api") { res.writeHead(200, { ...headers, "content-type": "application/json" }); res.end(JSON.stringify(seen)); return; }
  if (path === "/seed") headers["set-cookie"] = ["mdvStrict=logged-in; HttpOnly; SameSite=Strict; Path=/", "mdvLax=logged-in; SameSite=Lax; Path=/"];
  res.writeHead(200, { ...headers, "content-type": "text/html" });
  res.end(`<!doctype html><title>Session fixture</title><style>body{margin:0}main{height:4000px}</style><main><h1>Session fixture</h1></main><script>
    ${path === "/seed" ? 'localStorage.setItem("mdv-probe","logged-in");' : ""}
    window.probe = { document: ${JSON.stringify(seen)}, local: localStorage.getItem("mdv-probe"), guest: window.credentialless === true };
    fetch("/api").then(r => r.json()).then(r => { window.probe.fetch = r; });
  </script>`);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const pageUrl = `${origin}/app`;
const profile = await mkdtemp(join(tmpdir(), "mdv-session-"));
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
  // Sign in once, then work on a page that signs nobody in: the viewer opens its devices on the tab's page.
  await page.goto(`${origin}/seed`);
  await page.waitForFunction(() => window.probe?.fetch);
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.probe?.fetch);
  const tabId = await worker.evaluate(async url => {
    const slot = ([id, deviceId]) => ({ id, deviceId, url, orientation: "portrait", zoom: 0.58, zoomMode: "fit", reloadToken: 0, showFrame: true });
    await chrome.storage.local.set({
      responsiveTesterFirstRunComplete: true, mdvLastSeenTour: chrome.runtime.getManifest().version, mdvLastSeenReleaseVersion: chrome.runtime.getManifest().version,
      mdvSimulatorSession: { slots: [["phone", "apple-iphone-18-pro-2026"], ["pixel", "google-pixel-8"]].map(slot), activeSlotId: "phone", display: { scrollSync: true, navigationSync: false, darkMode: false } },
    });
    const [tab] = await chrome.tabs.query({ url });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/content.js"] });
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
    if (!reply?.ok) throw new Error(`Viewer did not open: ${reply?.error ?? "no reply"}`);
    return tab.id;
  }, pageUrl);

  // The production viewer lives in a closed shadow root: read geometry through
  // the extension, then act with the real mouse (a pop-out needs a real click).
  const bounds = selector => worker.evaluate(async ({ tabId, selector }) => {
    const [frame] = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      func: selector => {
        const host = document.getElementById("multi-device-viewer-overlay");
        const element = host && chrome.dom.openOrClosedShadowRoot(host)?.querySelector(selector);
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return width && height ? { x, y, width, height } : null;
      },
      args: [selector],
    });
    return frame.result;
  }, { tabId, selector });
  const center = async selector => {
    await expect.poll(() => bounds(selector), { message: selector }).toBeTruthy();
    const box = await bounds(selector);
    return [box.x + box.width / 2, box.y + box.height / 2];
  };
  // Reads an element inside the viewer's closed shadow root: its text, or whether it shows and takes the pointer.
  const inViewer = (selector, what) => worker.evaluate(async ({ tabId, selector, what }) => (await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] }, args: [selector, what],
    func: (selector, what) => {
      const element = chrome.dom.openOrClosedShadowRoot(document.getElementById("multi-device-viewer-overlay"))?.querySelector(selector);
      if (!element) return null;
      if (what === "text") return element.textContent;
      const { opacity, pointerEvents } = getComputedStyle(element);
      return [Number(opacity), pointerEvents];
    },
  }))[0].result, { tabId, selector, what });
  const hover = async selector => page.mouse.move(...await center(selector));
  // Pause on the device's name until its toolbar shows, as a person would.
  const showToolbar = async id => {
    await hover(`${card(id)} [data-device-caption]`);
    await page.waitForTimeout(300);
  };
  const click = async selector => page.mouse.click(...await center(selector));
  const card = id => `[data-preview-slot-id="${id}"]`;
  const frameIn = (owner, id) => owner.frames().find(frame => frame !== owner.mainFrame() && frame.name().endsWith(`-${id}`));
  const probe = async (owner, id) => {
    await expect.poll(() => frameIn(owner, id)?.url() ?? "", { message: `${id} frame` }).toContain(origin);
    const frame = frameIn(owner, id);
    await frame.waitForFunction(() => window.probe?.fetch);
    return frame.evaluate(() => ({ ...window.probe, ua: navigator.userAgent }));
  };
  const signedIn = (result, label) => {
    for (const kind of ["document", "fetch"]) for (const name of ["mdvStrict", "mdvLax"]) assert(result[kind].cookie.includes(`${name}=logged-in`), `${label}: ${kind} request keeps ${name}`);
    assert.equal(result.local, "logged-in", `${label}: storage kept`);
    assert.equal(result.guest, false, `${label}: the tab's own session`);
  };

  signedIn(await probe(page, "phone"), "phone on the page");
  signedIn(await probe(page, "pixel"), "pixel on the page");

  // ---- Guest session: one device signed out beside one signed in.
  await showToolbar("pixel");
  await click(`${card("pixel")} [data-device-menu-toggle]`);
  await click(`${card("pixel")} [role="menuitemcheckbox"]`);
  await expect.poll(async () => (await probe(page, "pixel")).guest, { message: "pixel reloads as a guest" }).toBe(true);
  const guest = await probe(page, "pixel");
  assert.equal(guest.document.cookie, "", "guest document request has no cookies");
  assert.equal(guest.fetch.cookie, "", "guest API request has no cookies");
  assert.equal(guest.local, null, "guest storage starts empty");
  assert.match(guest.document.ua, /Android.*Mobile/, "the guest still gets its device headers");
  assert.match(guest.ua, /Android.*Mobile/, "the guest's scripts still see the device");
  signedIn(await probe(page, "phone"), "phone beside a guest");
  await expect.poll(() => bounds(`${card("pixel")} [data-guest-chip]`), { message: "guest chip" }).toBeTruthy();
  assert.equal(await bounds(`${card("phone")} [data-guest-chip]`), null, "only the guest device is marked");
  // A guest's sign-in stays in the guest session.
  await frameIn(page, "pixel").evaluate(() => { document.cookie = "guestOnly=1; Path=/"; localStorage.setItem("mdv-probe", "guest"); });
  assert(!(await page.evaluate(() => document.cookie)).includes("guestOnly"), "the tab does not get the guest's cookies");
  assert.equal(await page.evaluate(() => localStorage.getItem("mdv-probe")), "logged-in", "the tab keeps its own storage");

  // The device's dropdown holds the guest switch, not the window or floating options.
  await showToolbar("phone");
  await click(`${card("phone")} [data-device-menu-toggle]`);
  const menuText = await inViewer(`${card("phone")} [data-viewport-actions]`, "text");
  assert(menuText.includes("Guest session") && !menuText.includes("on top") && !menuText.includes("floating"), `dropdown: ${menuText}`);
  await page.keyboard.press("Escape");

  // ---- The floating preview picker offers both places; "on top" opens the window in that one click.
  const floating = '[data-floating-device="google-pixel-8"]';
  const anyPreview = owner => owner.frames().find(frame => frame !== owner.mainFrame() && /^mdv-(?:mobile-)?preview-/.test(frame.name()));
  const inWindow = async (owner, label, pattern) => {
    await owner.locator("[data-popout-device]").waitFor();
    await expect.poll(() => anyPreview(owner)?.url() ?? "", { message: `${label}: frame in the window` }).toContain(origin);
    await anyPreview(owner).waitForFunction(() => window.probe?.fetch);
    const result = await anyPreview(owner).evaluate(() => ({ ...window.probe, ua: navigator.userAgent }));
    signedIn(result, label);
    for (const ua of [result.document.ua, result.fetch.ua, result.ua]) assert.match(ua, pattern, `${label}: keeps its device`);
  };
  const fromMenu = request => worker.evaluate(({ tabId, url, request }) => chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "floating", url, sourceTabId: tabId, ...request }, { frameId: 0 }), { tabId, url: pageUrl, request });
  const backToWorkspace = async () => {
    await worker.evaluate(({ tabId, url }) => chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "workspace", url, sourceTabId: tabId }, { frameId: 0 }), { tabId, url: pageUrl });
    await probe(page, "phone");
  };
  // ---- A device's own bar takes it out of the workspace in one click: above every app, or onto the page.
  await showToolbar("phone");
  const fromBar = context.waitForEvent("page");
  await click(`${card("phone")} [data-testid="pop-out-button"]`);
  const barWindow = await fromBar;
  await inWindow(barWindow, "device sent on top from its bar", /iPhone/);
  await expect.poll(() => bounds(card("phone")), { message: "the workspace gives way" }).toBe(null);
  assert.equal(await bounds('[data-floating-device="apple-iphone-18-pro-2026"]'), null, "the device is in the window");
  // Closing the window closes the device for good: nothing is left on the page.
  const viewerGone = message => expect.poll(() => page.locator("#multi-device-viewer-overlay").count(), { message }).toBe(0);
  await barWindow.close();
  await viewerGone("closing the window closes the device and, as it was the only one, the floating view");
  assert.equal(anyPreview(page), undefined, "no frame is left on the page");
  await backToWorkspace();
  await showToolbar("pixel");
  await click(`${card("pixel")} [data-testid="float-button"]`);
  await expect.poll(() => bounds(floating), { message: "the bar's other button floats the device on the page" }).toBeTruthy();
  await expect.poll(() => bounds(card("phone")), { message: "in place of the workspace" }).toBe(null);
  assert.equal(context.pages().length, 2, "without a window");
  // ---- The right-click menu has both entries; "on top" opens the page's picker set to it.
  await worker.evaluate(() => Promise.all(["add-device-to-page", "add-device-on-top"].map(id => chrome.contextMenus.update(id, {}))));
  await fromMenu({ placement: "top" });
  await expect.poll(() => bounds('[data-floating-placement="top"]'), { message: "the on-top entry sets the picker" }).toBeTruthy();
  await fromMenu({ placement: "page" });
  await expect.poll(() => bounds('[data-floating-placement="page"]'), { message: "the on-page entry sets it back" }).toBeTruthy();
  await page.keyboard.press("Escape");
  await backToWorkspace();

  await click("[data-open-floating]");
  await expect.poll(() => bounds('[data-floating-placement="page"]'), { message: "opens over the page unless told otherwise" }).toBeTruthy();
  await click('[data-floating-placement] button[aria-pressed="false"]');
  await expect.poll(() => bounds('[data-floating-placement="top"]'), { message: "on top chosen" }).toBeTruthy();
  const opened = context.waitForEvent("page");
  await click('[data-device-pick="google-pixel-8"]');
  const popOut = await opened;
  await inWindow(popOut, "device chosen for the top", /Android.*Mobile/);
  const windowInfo = await worker.evaluate(async tabId => {
    const [tab] = (await chrome.tabs.query({})).filter(tab => tab.openerTabId === tabId);
    const win = tab && await chrome.windows.get(tab.windowId);
    const rules = (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.condition.tabIds?.[0] === tabId);
    return { onTop: win?.alwaysOnTop, popOutTab: tab?.id, ruleTabs: rules.map(rule => rule.condition.tabIds) };
  }, tabId);
  assert.equal(windowInfo.onTop, true, "the window stays on top of other windows");
  assert(windowInfo.ruleTabs.length >= 2 && windowInfo.ruleTabs.every(tabs => tabs.length === 2 && tabs[1] === windowInfo.popOutTab), `every rule covers the window's tab: ${JSON.stringify(windowInfo.ruleTabs)}`);
  await expect.poll(() => bounds(card("phone")), { message: "the floating view replaces the workspace" }).toBe(null);
  assert.equal(await bounds(floating), null, "the device is in the window, not on the page");
  assert.equal(anyPreview(page), undefined, "and the page holds no frame for it");
  // The window holds the device and nothing else, on the viewer's usual background.
  assert.equal(await popOut.locator("button").count(), 0, "no buttons in the window");
  const look = await popOut.evaluate(() => {
    const device = document.querySelector("[data-device-capture]").getBoundingClientRect();
    return { spareWidth: innerWidth - device.width, spareHeight: innerHeight - device.height, background: getComputedStyle(document.querySelector("[data-popout-device]")).backgroundColor };
  });
  assert.equal(look.background, "rgb(245, 245, 242)", "the usual light background, no added colour");
  assert(Math.min(look.spareWidth, look.spareHeight) < 2 && Math.min(look.spareWidth, look.spareHeight) > -1, `the device fills the window: ${JSON.stringify(look)}`);
  // The window's frame and the viewer talk both ways: the load check is asked and answered, so no warning shows.
  await popOut.waitForTimeout(6000);
  assert.equal(await popOut.locator("[data-preview-load-issue]").count(), 0, "the viewer hears the window's frame");
  // Closing the window closes the device; it does not drop onto the page.
  await popOut.close();
  await viewerGone("the picked device is gone with its window");
  assert.equal(await bounds(floating), null, "it is not floating on the page");
  // A floating device on the page, for the next checks.
  await fromMenu({ placement: "page", deviceId: "google-pixel-8" });
  await expect.poll(() => bounds(floating), { message: "a floating device on the page" }).toBeTruthy();
  await expect.poll(() => anyPreview(page)?.url() ?? "", { message: "with its page" }).toContain(origin);

  // ---- Its tab can be reached from the side, after the pointer has left the device.
  const device = await bounds(floating);
  const tab = await bounds(`${floating} [data-floating-tab]`);
  await page.mouse.move(device.x + device.width / 2, device.y + 40);
  await page.mouse.move(device.x - 30, tab.y + tab.height / 2, { steps: 4 });
  await page.waitForTimeout(150);
  await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2, { steps: 12 });
  await page.waitForTimeout(700);
  const control = await inViewer(`${floating} [data-floating-tab]`, "shown");
  assert.deepEqual(control, [1, "auto"], "the tab stays while the pointer comes to it from outside the device");
  // The tab's window button moves the device back out in one click.
  await hover(floating);
  const again = context.waitForEvent("page");
  await click(`${floating} [data-floating-popout]`);
  const second = await again;
  await inWindow(second, "floating device moved to the top", /Android.*Mobile/);
  await expect.poll(() => bounds(floating), { message: "the device leaves the page" }).toBe(null);
  await second.close();
  await viewerGone("a floating device moved to the window closes with it, not back onto the page");

  // ---- Two devices: closing one device's window leaves the other on the page.
  await fromMenu({ placement: "page", deviceId: "google-pixel-8" });
  await expect.poll(() => bounds(floating), { message: "pixel floats on the page" }).toBeTruthy();
  await fromMenu({ placement: "top" });
  await expect.poll(() => bounds('[data-floating-placement="top"]'), { message: "the page's picker, set to on top" }).toBeTruthy();
  const third = context.waitForEvent("page");
  await click('[data-device-pick="apple-iphone-18-pro-2026"]');
  const phoneWindow = await third;
  await inWindow(phoneWindow, "second device chosen for the top", /iPhone/);
  assert.equal(await bounds('[data-floating-device="apple-iphone-18-pro-2026"]'), null, "it opens in the window, not on the page");
  await phoneWindow.close();
  await page.waitForTimeout(500);
  assert.equal(await bounds('[data-floating-device="apple-iphone-18-pro-2026"]'), null, "its window closed, the phone is gone");
  await expect.poll(() => bounds(floating), { message: "the device on the page stays" }).toBeTruthy();
  assert.equal(await page.locator("#multi-device-viewer-overlay").count(), 1, "and the floating view with it");
  // The picker remembers "on top": the next device takes one click.
  await fromMenu({});
  await expect.poll(() => bounds('[data-floating-placement="top"]'), { message: "the choice was kept" }).toBeTruthy();
  const fourth = context.waitForEvent("page");
  await click('[data-device-pick="apple-iphone-18-pro-2026"]');
  const lastWindow = await fourth;
  await inWindow(lastWindow, "device chosen with the remembered place", /iPhone/);
  // Leaving the floating view closes the window with it.
  const gone = lastWindow.waitForEvent("close");
  await worker.evaluate(({ tabId, url }) => chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "workspace", url, sourceTabId: tabId }, { frameId: 0 }), { tabId, url: pageUrl });
  await gone;
  await probe(page, "phone");
  await worker.evaluate(({ tabId, url }) => chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", url, sourceTabId: tabId }, { frameId: 0 }), { tabId, url: pageUrl });
  await expect.poll(() => worker.evaluate(async tabId => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.condition.tabIds?.includes(tabId)).length, tabId), { message: "rules removed with the viewer" }).toBe(0);
  assert.deepEqual(errors, [], "no page errors");
  console.log("Session windows check passed: guest session; header-bar buttons for on top and on the page; right-click menu entries; floating picker opens a device on the page or on top in one click; the window holds just the device on the usual background; reachable floating tab; pop-out from the tab; closing a window closes its device; remembered choice.");
} finally {
  await context?.close();
  server.close();
  await rm(profile, { recursive: true, force: true });
}
