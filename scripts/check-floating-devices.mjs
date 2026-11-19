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
  const resize = pixel + " [data-floating-resize]";
  const controlState = () => worker.evaluate(async ({ tabId, pixel }) => {
    const [frame] = await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, args: [pixel], func: pixel => {
      const root = chrome.dom.openOrClosedShadowRoot(document.querySelector("#multi-device-viewer-overlay"));
      return Array.from(root.querySelector(pixel).querySelectorAll(":scope > button"), button => {
        const { opacity, pointerEvents } = getComputedStyle(button);
        return [Number(opacity), pointerEvents];
      });
    } });
    return frame.result;
  }, { tabId, pixel });
  const shown = [[1, "auto"], [1, "auto"]];
  const hidden = [[0, "none"], [0, "none"]];
  async function hoverDevice(selector) {
    const r = await bounds(selector);
    await page.mouse.move(r.x + r.width / 2, r.y + 4);
  }
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

  const before = await bounds(pixel);
  assert.equal(await bounds(pixel + " header"), null);
  await expect.poll(controlState).toEqual(hidden);
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await expect.poll(controlState).toEqual(shown);
  const x = before.x + before.width / 2, y = before.y + 4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 340, y + 120, { steps: 8 });
  await page.mouse.up();
  const dragged = await bounds(pixel);
  assert.equal(dragged.x, before.x - 340);
  assert.equal(dragged.y, before.y + 120);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => bounds(pixel)).toEqual({ ...dragged, x: dragged.x - 8 });
  await page.mouse.move(20, 20);
  await expect.poll(controlState).toEqual(shown);
  await hoverDevice(pixel);
  const [rx, ry] = await center(resize);
  await page.mouse.move(rx, ry);
  await page.mouse.down();
  await page.mouse.move(rx - 50, ry + 80, { steps: 10 });
  await page.mouse.up();
  const moved = await bounds(pixel);
  assert(moved.width > dragged.width && moved.height > dragged.height);
  assert.equal(moved.x + moved.width, dragged.x - 8 + dragged.width);
  assert.equal(await phone.evaluate(() => innerWidth), 412);
  await expect.poll(controlState).toEqual(shown);
  await page.screenshot({ path: "output/playwright/floating-device-resized.png", clip: moved, scale: "css" });
  await page.mouse.move(20, 20);
  await expect.poll(controlState).toEqual(hidden);
  await page.screenshot({ path: "output/playwright/floating-device-idle.png", clip: moved, scale: "css" });
  await page.keyboard.press("ArrowUp");
  await expect.poll(controlState).toEqual(shown);
  await expect.poll(async () => (await bounds(pixel)).width).toBeGreaterThan(moved.width);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => bounds(pixel)).toEqual(moved);
  assert.match(phone.url(), /\/linked/);
  await openPicker();
  await choose("iPhone 18 Pro", "apple-iphone-18-pro-2026");
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  assert.equal(frames().length, 2);
  assert.match(phone.url(), /\/linked/);
  await hoverDevice(iphone);
  await click(iphone + " [data-floating-close]");
  await expect.poll(() => frames().length).toBe(1);
  await openPicker();
  await expect.poll(() => bounds('[role="dialog"]')).toBeTruthy();
  await page.mouse.click(300, 300);
  await expect.poll(() => bounds('[role="dialog"]')).toBeNull();

  await page.reload();
  await expect.poll(() => bounds(pixel)).toEqual(moved);
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    assert(await page.evaluate(() => matchMedia("(hover: none)").matches));
    await expect.poll(controlState).toEqual(hidden);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: moved.x + moved.width / 2, y: moved.y + 4 }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(controlState).toEqual(shown);
  } finally {
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await touch.detach();
  }
  const originalSize = page.viewportSize();
  await page.setViewportSize({ width: 500, height: 410 });
  await expect.poll(async () => {
    const r = await bounds(pixel);
    return r && r.x >= 0 && r.y >= 0 && r.x + r.width <= 500 && r.y + r.height <= 410;
  }).toBe(true);
  await hoverDevice(pixel);
  await click(pixel + " [data-floating-close]");
  await page.setViewportSize(originalSize);
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  assert.deepEqual(await workspace(), originalWorkspace);
  assert.equal(frames().length, 0);
  const originalOverflow = await page.evaluate(() => document.documentElement.style.overflow);
  const selected = "samsung-galaxy-s24";
  const tablet = { ...originalWorkspace.slots[0], id: "tablet", deviceId: "apple-ipad-mini-a17-pro-2024" };
  const fullWorkspace = { ...originalWorkspace, slots: [...originalWorkspace.slots, tablet], activeSlotId: tablet.id };
  await worker.evaluate(session => chrome.storage.local.set({ mdvSimulatorSession: session }), fullWorkspace);
  await worker.evaluate(async tabId => {
    const { url } = await chrome.tabs.get(tabId);
    await chrome.tabs.sendMessage(tabId, { type: "OPEN_SIMULATOR", mode: "workspace", url, sourceTabId: tabId }, { frameId: 0 });
  }, tabId);
  await expect.poll(() => bounds('[data-open-floating]')).toBeTruthy();
  await expect.poll(() => frames().length).toBe(4);
  // A development reload can update the toolbar before the background worker.
  // Keep the established preview commands working while the new one gets no reply.
  await worker.evaluate(tabId => chrome.scripting.executeScript({ target: { tabId }, func: () => {
    const send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = (...args) => args[0]?.type === "MDV_OPEN_FLOATING" ? Promise.resolve(undefined) : send(...args);
  } }), tabId);
  await click("[data-open-floating]");
  const launchDialog = '[role="dialog"][aria-label="Choose a device for floating preview"]';
  await expect.poll(() => bounds(launchDialog)).toBeTruthy();
  assert.equal(await bounds("[data-floating-device]"), null);
  assert.equal(await bounds("[data-preset-chip]"), null);
  await page.keyboard.press("Escape");
  await expect.poll(() => bounds(launchDialog)).toBeNull();
  await expect.poll(() => bounds("[data-open-floating]:focus")).toBeTruthy();
  assert.equal(frames().length, 4);
  const workspaceBeforePick = await workspace();
  await page.keyboard.press("Enter");
  await expect.poll(() => bounds(launchDialog)).toBeTruthy();
  await page.screenshot({ path: "output/playwright/floating-device-picker.png", clip: await bounds(launchDialog), scale: "css" });
  await choose("Galaxy S24", selected);
  await expect.poll(() => bounds(`[data-floating-device="${selected}"]`)).toBeTruthy();
  assert.equal(await bounds("[data-main-toolbar]"), null);
  assert.deepEqual(await workspace(), workspaceBeforePick);
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow), originalOverflow);
  await hoverDevice(`[data-floating-device="${selected}"]`);
  await click("[data-floating-close]");
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  await openPicker();
  const tv = '[data-floating-device="samsung-neo-qled-4k-55"]';
  await choose("Neo QLED", "samsung-neo-qled-4k-55");
  const tvScreen = tv + " [data-device-screen]";
  await expect.poll(() => bounds(tvScreen)).toBeTruthy();
  async function checkTvCorners() {
    const screen = await bounds(tvScreen);
    const [closeX, closeY] = await center(tv + " [data-floating-close]");
    const [gripX, gripY] = await center(tv + " [data-floating-resize]");
    for (const gap of [closeX - screen.x - screen.width, screen.y - closeY, screen.x - gripX, gripY - screen.y - screen.height]) {
      assert(Math.abs(gap - 8) < 1, `TV control should stay 8 CSS pixels outside the display, got ${gap}`);
    }
    return screen.width;
  }
  const tvStartWidth = await checkTvCorners();
  await hoverDevice(tv);
  await click(tv + " [data-floating-resize]");
  await expect.poll(async () => (await bounds(tvScreen)).width).toBeGreaterThan(tvStartWidth);
  const enlargedWidth = await checkTvCorners();
  const [gripX, gripY] = await center(tv + " [data-floating-resize]");
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await page.mouse.move(gripX, gripY);
  await page.mouse.down();
  await page.mouse.move(1, viewport.height - 1, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => (await bounds(tvScreen)).width).toBeGreaterThan(enlargedWidth);
  await checkTvCorners();
  for (const selector of ["[data-floating-close]", "[data-floating-resize]"]) {
    const button = await bounds(tv + " " + selector);
    assert(button.x >= 0 && button.y >= 0 && button.x + button.width <= viewport.width && button.y + button.height <= viewport.height);
  }
  await hoverDevice(tv);
  await click(tv + " [data-floating-close]");
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  console.log("Floating devices passed: picker, hover and keyboard controls, frame drag and resize, TV corner controls at multiple scales, fixed viewport, independent navigation, desktop input and scroll, multiple devices, reload placement and cleanup.");
}
