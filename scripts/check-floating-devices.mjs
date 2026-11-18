import assert from "node:assert/strict";
import { expect } from "@playwright/test";

// Exercise the production build's closed shadow root. Read control geometry
// through the content script world, then interact through the browser mouse.
export async function checkFloatingDevices({ page, worker, pageUrl }) {
  const tabId = await worker.evaluate(async url => {
    await chrome.contextMenus.update("add-device-to-page", { enabled: true });
    const [tab] = await chrome.tabs.query({ url });
    return tab.id;
  }, pageUrl);
  async function openPicker() {
    const reply = await worker.evaluate(async tabId => {
      const { url } = await chrome.tabs.get(tabId);
      return chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "floating", url, sourceTabId: tabId }, { frameId: 0 });
    }, tabId);
    assert(reply?.ok && reply.active);
  }
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
  async function center(selector) {
    await expect.poll(() => bounds(selector)).toBeTruthy();
    const r = await bounds(selector);
    return [r.x + r.width / 2, r.y + r.height / 2];
  }
  const click = async selector => page.mouse.click(...await center(selector));
  async function choose(search, id) {
    await click('[role="dialog"] input[placeholder]');
    await page.keyboard.type(search);
    await click(`[data-device-pick="${id}"]`);
  }
  const pixel = '[data-floating-device="google-pixel-8"]';
  const iphone = '[data-floating-device="apple-iphone-18-pro-2026"]';
  const grip = pixel + " header button:first-child";
  const frames = () => page.frames().filter(f => /mdv-(?:mobile-)?preview-/.test(f.name()));
  const workspace = () => worker.evaluate(async () => (await chrome.storage.local.get("mdvSimulatorSession")).mdvSimulatorSession);
  const originalWorkspace = await workspace();
  const input = page.locator("input[name=query]");
  await input.fill("desktop draft");
  const width = await page.evaluate(() => {
    document.body.style.minHeight = "220vh";
    document.documentElement.style.setProperty("overflow", "auto", "important");
    return innerWidth;
  });
  await openPicker();
  await choose("Pixel 8", "google-pixel-8");
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  const phone = frames()[0];
  assert.equal(await phone.evaluate(() => innerWidth), 412);
  await phone.getByRole("link", { name: "Link", exact: true }).click();
  await phone.waitForURL("**/linked**");
  assert.equal(page.url(), pageUrl);
  assert.equal(await input.inputValue(), "desktop draft");
  await input.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("desktop edited");
  assert.equal(await input.inputValue(), "desktop edited");
  assert.equal(await page.evaluate(() => innerWidth), width);
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);

  const [x, y] = await center(grip);
  const before = await bounds(pixel);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 340, y + 120, { steps: 8 });
  await page.mouse.up();
  const dragged = await bounds(pixel);
  assert.equal(dragged.x, before.x - 340);
  assert.equal(dragged.y, before.y + 120);
  await page.keyboard.press("ArrowLeft");
  const moved = { ...dragged, x: dragged.x - 8 };
  await expect.poll(() => bounds(pixel)).toEqual(moved);
  assert.match(phone.url(), /\/linked/);
  await openPicker();
  await choose("iPhone 18 Pro", "apple-iphone-18-pro-2026");
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  assert.equal(frames().length, 2);
  assert.match(phone.url(), /\/linked/);
  await click(iphone + " header button:last-child");
  await expect.poll(() => frames().length).toBe(1);
  await click('button[aria-haspopup="dialog"]');
  await expect.poll(() => bounds('[role="dialog"]')).toBeTruthy();
  await page.mouse.click(300, 300);
  await expect.poll(() => bounds('[role="dialog"]')).toBeNull();

  await page.reload();
  await expect.poll(() => bounds(pixel)).toEqual(moved);
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  const originalSize = page.viewportSize();
  await page.setViewportSize({ width: 500, height: 410 });
  await expect.poll(async () => {
    const r = await bounds(pixel);
    return r && r.x >= 0 && r.y >= 0 && r.x + r.width <= 500 && r.y + r.height <= 410;
  }).toBe(true);
  await click(pixel + " header button:last-child");
  await page.setViewportSize(originalSize);
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  assert.deepEqual(await workspace(), originalWorkspace);
  assert.equal(frames().length, 0);
  console.log("Floating devices passed: picker, live mobile viewport, independent navigation, desktop input and scroll, drag, second device, reload placement and cleanup.");
}
