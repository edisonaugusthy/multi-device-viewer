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
  async function dragBy(selector, dx, dy) {
    const [x, y] = await center(selector);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 10 });
    await page.mouse.up();
  }
  const near = (a, b) => assert(Math.abs(a - b) <= 1, `Expected ${a} within 1px of ${b}`);
  async function choose(search, id) {
    await click('[role="dialog"] input[placeholder]');
    await page.keyboard.type(search);
    await click(`[data-device-pick="${id}"]`);
  }
  const pixel = '[data-floating-device="google-pixel-8"]';
  const iphone = '[data-floating-device="apple-iphone-18-pro-2026"]';
  const grip = pixel + " [data-floating-resize]";
  const controlState = () => worker.evaluate(async ({ tabId, pixel }) => {
    const [frame] = await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, args: [pixel], func: pixel => {
      const root = chrome.dom.openOrClosedShadowRoot(document.querySelector("#multi-device-viewer-overlay"));
      return Array.from(root.querySelector(pixel).querySelectorAll(":scope > .mdv-floating-control"), control => {
        const { opacity, pointerEvents } = getComputedStyle(control);
        return [Number(opacity), pointerEvents];
      });
    } });
    return frame.result;
  }, { tabId, pixel });
  // Controls linger briefly after the pointer leaves the device, so these are polled.
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
  assert.equal(await bounds(pixel + " [data-floating-edge]"), null, "only the corner resizes");
  await hoverDevice(pixel);
  await click(grip);
  assert.equal((await bounds(pixel)).width, dragged.width, "clicking the bracket leaves the size alone");
  // The bracket grows the device down and left; its upper-right corner stays put.
  await hoverDevice(pixel);
  await dragBy(grip, -50, 60);
  const moved = await bounds(pixel);
  assert(moved.width > dragged.width + 30 && moved.height > dragged.height);
  near(moved.x + moved.width, dragged.x - 8 + dragged.width);
  near(moved.y, dragged.y);
  await hoverDevice(pixel);
  await dragBy(grip, 30, -36);
  const shrunk = await bounds(pixel);
  assert(shrunk.width < moved.width);
  near(shrunk.x + shrunk.width, moved.x + moved.width);
  await hoverDevice(pixel);
  await dragBy(grip, -30, 36);
  near((await bounds(pixel)).width, moved.width);
  assert.equal(await phone.evaluate(() => innerWidth), 412);
  await hoverDevice(pixel);
  await expect.poll(controlState).toEqual(shown);
  const clip = { x: moved.x - 16, y: moved.y - 16, width: moved.width + 32, height: moved.height + 32 };
  await page.screenshot({ path: "output/playwright/floating-device-resized.png", clip, scale: "css" });
  await page.mouse.move(20, 20);
  await expect.poll(controlState).toEqual(hidden);
  await page.screenshot({ path: "output/playwright/floating-device-idle.png", clip, scale: "css" });
  await page.keyboard.press("ArrowUp");
  await expect.poll(controlState).toEqual(shown);
  await expect.poll(async () => (await bounds(pixel)).width).toBeGreaterThan(moved.width);
  await page.keyboard.press("ArrowDown");
  near((await bounds(pixel)).width, moved.width);
  const saved = await bounds(pixel);
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
  await expect.poll(() => bounds(pixel)).toEqual(saved);
  await expect.poll(() => frames().filter(f => f.url().startsWith(pageUrl)).length).toBe(1);
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    assert(await page.evaluate(() => matchMedia("(hover: none)").matches));
    await expect.poll(controlState).toEqual(hidden);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: saved.x + saved.width / 2, y: saved.y + 4 }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(controlState).toEqual(shown);
    const [gx, gy] = await center(pixel + " [data-floating-resize]");
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: gx, y: gy }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: gx + 16, y: gy - 32 }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const afterGrip = await bounds(pixel);
    assert(afterGrip.width < saved.width && afterGrip.height < saved.height, "the corner bracket resizes by touch");
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
  const allTab = launchDialog + ' [data-picker-type="all"]';
  const otherTab = launchDialog + ' [data-picker-type="other"]';
  const allBox = await bounds(launchDialog);
  await page.mouse.move(...await center(otherTab));
  assert(await bounds(allTab + '[aria-selected="true"]'), "moving across the launch picker keeps its category");
  assert.deepEqual(await bounds(launchDialog), allBox);
  await click(otherTab);
  await expect.poll(() => bounds(otherTab + '[aria-selected="true"]')).toBeTruthy();
  const otherBox = await bounds(launchDialog);
  await page.mouse.move(...await center(allTab));
  assert.deepEqual(await bounds(launchDialog), otherBox);
  assert(await bounds(otherTab + '[aria-selected="true"]'));
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
  const tvGrip = tv + " [data-floating-resize]";
  const tvTab = tv + " [data-floating-tab]";
  async function checkTvControls() {
    const screen = await bounds(tvScreen);
    await expect.poll(() => bounds(tvTab)).toBeTruthy();
    const tab = await bounds(tvTab), grip = await bounds(tvGrip);
    near(tab.x + tab.width / 2, screen.x + screen.width / 2);
    near(tab.y + tab.height, screen.y - 6);
    near(grip.x, screen.x - 8);
    near(grip.y + grip.height, screen.y + screen.height + 8);
    return screen.width;
  }
  const tvStartWidth = await checkTvControls();
  await hoverDevice(tv);
  // The tab stays small while the × keeps a 24 px target.
  assert.equal((await bounds(tvTab)).height, 16);
  const closeTarget = await bounds(tv + " [data-floating-close]");
  assert(closeTarget.width >= 24 && closeTarget.height >= 24);
  assert.equal((await bounds(tv + " [data-floating-close] svg")).width, 6);
  const [gx, gy] = await center(tvGrip);
  await page.mouse.move(gx, gy);
  await page.mouse.down();
  await page.mouse.move(gx - 120, gy + 68, { steps: 8 });
  await page.mouse.up();
  assert(await checkTvControls() > tvStartWidth + 100);
  const enlargedWidth = (await bounds(tvScreen)).width;
  const [edgeX] = await center(tvGrip);
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await hoverDevice(tv);
  await dragBy(tvGrip, 1 - edgeX, viewport.height);
  await expect.poll(async () => (await bounds(tvScreen)).width).toBeGreaterThan(enlargedWidth);
  await checkTvControls();
  for (const selector of [tvTab, tvGrip]) {
    const button = await bounds(selector);
    assert(button.x >= 0 && button.y >= 0 && button.x + button.width <= viewport.width && button.y + button.height <= viewport.height);
  }
  await hoverDevice(tv);
  await click(tv + " [data-floating-close]");
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  console.log("Floating devices passed: picker, move-and-close tab and corner bracket, frame movement, corner-only resizing, touch and keyboard resizing, TV alignment at multiple scales, fixed viewport, independent navigation, desktop input and scroll, multiple devices, reload placement and cleanup.");
}
