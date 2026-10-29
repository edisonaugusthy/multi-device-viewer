import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { getBrowserGeometry, nextBrowserCollapse, supportsIos26 } from "./browser-geometry";
import { fitViewportToScreen } from "../../ui/components/DeviceFrame";
import { orientations, toLandscapeAwareSize } from "./device-service";

describe("browser content boundaries", () => {
  it.each(["apple-iphone-18-pro-2026", "google-pixel-10-2026", "apple-iphone-duo-folded-2026"])("keeps %s cameras clear of the page and lower controls", id => {
    const device = devices.find(d => d.id === id)!;
    for (const orientation of orientations) for (const collapsed of [0, 1]) {
      const size = toLandscapeAwareSize(device.cssViewport, orientation);
      const geometry = getBrowserGeometry(device, size, {}, { orientation, collapsed });
      expect(geometry.top + geometry.content.height + geometry.bottom).toBe(size.height);
      expect(geometry.left + geometry.content.width + geometry.right).toBe(size.width);
      const keyboard = getBrowserGeometry(device, size, {}, { orientation, collapsed, keyboardHeight: 240 });
      expect(keyboard.bottom).toBeGreaterThanOrEqual(240 + (keyboard.cameraBottomInset ?? 0));
      expect(keyboard.top + keyboard.content.height + keyboard.bottom).toBe(size.height);
    }
  });
  it("keeps all 119 device identities available", () => { expect(devices).toHaveLength(119); });
  it("uses the full width of a wide fold whose camera is in the top edge", () => {
    const device = devices.find(d => d.id === "samsung-galaxy-z-fold8-unfolded-2026")!;
    const geometry = getBrowserGeometry(device, device.cssViewport);
    const viewport = device.mockupAssets[0].viewport!.landscape!;
    const camera = viewport.occlusions![0];
    expect(geometry.left).toBe(0);
    expect(geometry.right).toBe(0);
    expect(geometry.content.width).toBe(device.cssViewport.width);
    expect(geometry.status).toBeGreaterThanOrEqual((camera.top + camera.height) * device.cssViewport.height / viewport.height);
  });
  it("keeps the upright Fold7 camera in the top edge", () => {
    const device = devices.find(d => d.id === "samsung-galaxy-z-fold7-unfolded-2025")!;
    const geometry = getBrowserGeometry(device, device.cssViewport);
    const viewport = device.mockupAssets[0].viewport!.portrait!;
    const camera = viewport.occlusions![0];
    expect(device.cssViewport.height).toBeGreaterThan(device.cssViewport.width);
    expect(camera.top).toBeLessThan(camera.left);
    expect(camera.left).toBeGreaterThan(viewport.width / 2);
    expect(geometry.left + geometry.right).toBe(0);
    expect(geometry.status).toBeGreaterThanOrEqual((camera.top + camera.height) * device.cssViewport.height / viewport.height);
  });
  it("keeps the page beside a phone camera turned into the side edge", () => {
    const device = devices.find(d => d.id === "google-pixel-10-2026")!;
    const screen = { width: device.cssViewport.height, height: device.cssViewport.width };
    const geometry = getBrowserGeometry(device, screen, {}, { orientation: "landscape" });
    const viewport = device.mockupAssets[0].viewport!.landscape!;
    const camera = viewport.occlusions![0];
    // Turning clockwise brings the top camera to the right edge.
    expect(viewport.width - camera.left - camera.width).toBeLessThan(camera.top);
    expect(geometry.right).toBeGreaterThanOrEqual((viewport.width - camera.left) * screen.width / viewport.width);
    expect(geometry.left).toBe(0);
    expect(geometry.status).toBe(24);
  });
  it.each(devices.filter(device => device.type === "phone" || device.type === "tablet").map(d => [d.id, d] as const))("keeps fixed page actions above controls on %s", (_id, device) => {
    for (const landscape of [false, true]) for (const collapsed of [0, 1]) for (const layout of ["compact", "bottom", "top", "side", "tabs", "compact-tabs"] as const) {
      const screen = landscape ? { width: device.cssViewport.height, height: device.cssViewport.width } : device.cssViewport;
      const geometry = getBrowserGeometry(device, screen, { layout }, { collapsed });
      expect(geometry.content.width).toBeGreaterThan(0);
      expect(geometry.top + geometry.content.height + geometry.bottom).toBe(screen.height);
      expect(geometry.left + geometry.content.width + geometry.right).toBe(screen.width);
      if (geometry.pillHeight) expect(geometry.bottom).toBeGreaterThanOrEqual(geometry.pillHeight + geometry.pillBottom);
    }
  });
  it("shrinks usable content for keyboard and preserves iPad's distinct browser layout", () => {
    const ipad = devices.find(d => d.id === "apple-ipad-mini-6")!;
    const normal = getBrowserGeometry(ipad, ipad.cssViewport);
    const keyboard = getBrowserGeometry(ipad, ipad.cssViewport, {}, { keyboardHeight: 400 });
    expect(normal.family).toBe("ipad"); expect(normal.tabStrip).toBeGreaterThan(0);
    expect(keyboard.content.height).toBeLessThan(normal.content.height);
    expect(keyboard.bottom).toBe(400);
  });
  it("keeps the folded Duo's controls in a column beside the camera, with the address bar at the foot of the page", () => {
    const duo = devices.find(d => d.id === "apple-iphone-duo-folded-2026")!;
    const portrait = getBrowserGeometry(duo, { width: 466, height: 678 });
    const landscape = getBrowserGeometry(duo, { width: 678, height: 466 });
    expect(portrait.duoControls).toBe("side");
    expect(portrait.duoFullWidthBottom).toBe(true);
    expect(portrait.top).toBe(0);
    expect(portrait.left).toBe(0);
    expect(portrait.right).toBe(Math.ceil(portrait.duoIconCenterRight! + 24));
    expect(portrait.content.width).toBe(466 - portrait.right);
    const aperture = duo.mockupAssets[0].viewport!.portrait!;
    const camera = aperture.occlusions![0];
    expect(portrait.duoStatusTop).toBeGreaterThan((camera.top + camera.height) * 678 / aperture.height);
    expect(portrait.bottom).toBe(portrait.address + 12);
    expect(landscape.duoControls).toBe("side");
    expect(landscape.duoFullWidthBottom).toBe(false);
    expect(landscape.left).toBe(0);
    expect(landscape.right).toBe(Math.ceil(landscape.duoIconCenterRight! + 24));
    expect(landscape.content.width).toBe(678 - landscape.right);
    expect(landscape.bottom).toBe(landscape.address + 12);
    expect(getBrowserGeometry(duo, { width: 678, height: 466 }, {}, { viewportFit: "cover" })).toEqual(landscape);
    for (const screen of [{ width: 466, height: 678 }, { width: 678, height: 466 }]) {
      const bare = getBrowserGeometry(duo, screen, {}, { showStatusBar: false, showUrlBar: false });
      expect(bare.right).toBe(Math.ceil(bare.duoIconCenterRight! + 24));
      expect(bare.top).toBe(0);
      expect(bare.bottom).toBe(12);
      const normal = getBrowserGeometry(duo, screen);
      const scrolled = getBrowserGeometry(duo, screen, { layout: "top" }, { collapsed: 1 });
      expect(scrolled.content.width).toBe(normal.content.width);
      expect(scrolled.right).toBe(normal.right);
      expect(scrolled.duoIconCenterRight).toBe(normal.duoIconCenterRight);
      expect(scrolled.duoStatusTop).toBe(normal.duoStatusTop);
      expect(scrolled.address).toBe(24);
      expect(scrolled.bottom).toBe(36);
      expect(scrolled.toolbar).toBe(normal.toolbar);
      expect(scrolled.content.height - normal.content.height).toBe(normal.bottom - scrolled.bottom);
      expect(scrolled.content.height).toBeGreaterThan(normal.content.height);
      const keyboard = getBrowserGeometry(duo, screen, {}, { keyboardHeight: 260 });
      expect(keyboard.right).toBe(normal.right);
      expect(keyboard.bottom).toBe(260);
      expect(keyboard.content.height + keyboard.top + keyboard.bottom).toBe(screen.height);
      expect(getBrowserGeometry(duo, screen, {}, { keyboardHeight: 260, collapsed: 1 }).content).toEqual(keyboard.content);
    }
  });
  it("runs Safari on the unfolded Duo like an iPad: one top bar in either orientation, the page under the home indicator", () => {
    const duo = devices.find(d => d.id === "apple-iphone-duo-unfolded-2026")!;
    for (const screen of [{ width: 890, height: 626 }, { width: 626, height: 890 }]) {
      const normal = getBrowserGeometry(duo, screen);
      expect(normal.duoControls).toBe("top");
      expect(normal.layout).toBe("top");
      expect([normal.top, normal.status, normal.address, normal.toolbar]).toEqual([60, 60, 40, 0]);
      expect([normal.left, normal.right, normal.bottom]).toEqual([0, 0, 0]);
      expect(normal.content).toEqual({ width: screen.width, height: screen.height - 60 });
      expect(normal.duoStatusTop).toBeUndefined();
      // Only the status, or only the address bar, still needs the bar; neither needs none.
      expect(getBrowserGeometry(duo, screen, {}, { showStatusBar: false }).top).toBe(60);
      expect(getBrowserGeometry(duo, screen, {}, { showStatusBar: false }).status).toBe(0);
      expect(getBrowserGeometry(duo, screen, {}, { showUrlBar: false }).address).toBe(0);
      const bare = getBrowserGeometry(duo, screen, {}, { showStatusBar: false, showUrlBar: false });
      expect([bare.top, bare.content.height]).toEqual([0, screen.height]);
      // Scrolling minimizes nothing; the keyboard takes the bottom.
      expect(getBrowserGeometry(duo, screen, {}, { collapsed: 1 })).toEqual({ ...normal, collapse: 1 });
      const keyboard = getBrowserGeometry(duo, screen, {}, { keyboardHeight: 260 });
      expect(keyboard.bottom).toBe(260);
      expect(keyboard.content.height).toBe(screen.height - 60 - 260);
    }
  });
  it.each(["apple-iphone-18-pro-2026", "apple-iphone-18-pro-max-2026"])("keeps %s cover pages outside the landscape camera", id => {
    const phone = devices.find(d => d.id === id)!;
    const screen = { width: phone.cssViewport.height, height: phone.cssViewport.width };
    const normal = getBrowserGeometry(phone, screen);
    const cover = getBrowserGeometry(phone, screen, {}, { viewportFit: "cover", collapsed: 1 });
    expect(cover.left).toBeGreaterThanOrEqual(59);
    expect(cover.content.width).toBe(normal.content.width);
    expect(cover.neutralChrome).toBe(true);
  });
  it.each(["google-pixel-10-2026", "google-pixel-10-pro-2026", "google-pixel-10-pro-fold-2026", "motorola-razr-70-ultra-2026"])("keeps the downloaded %s camera above the address bar", id => {
    const phone = devices.find(d => d.id === id)!;
    const aperture = phone.mockupAssets[0].viewport!.portrait!;
    const camera = aperture.occlusions![0];
    const cameraBottom = (camera.top + camera.height) * phone.cssViewport.height / aperture.height;
    expect(getBrowserGeometry(phone, phone.cssViewport).status).toBeGreaterThan(cameraBottom + 4);
  });
  it("does not assign iOS 26 to incompatible iPhones", () => {
    expect(devices.filter(d => d.type === "phone" && supportsIos26(d))).toHaveLength(34);
    for (const id of ["apple-iphone-5", "apple-iphone-se-2018", "apple-iphone-x", "apple-iphone-xr"]) expect(supportsIos26(devices.find(d => d.id === id)!)).toBe(false);
  });
  it("preserves aspect ratio even when an artwork aperture differs from the screen", () => {
    const fit = fitViewportToScreen({ width: 393, height: 852 }, { left: 3, top: 8, width: 390, height: 844 });
    expect(fit.scaleX).toBe(fit.scaleY);
    expect(fit.contentLeft).toBeGreaterThanOrEqual(0);
    expect(fit.contentTop).toBeGreaterThanOrEqual(0);
  });
  it("uses stable collapse transitions and expands on upward scrolling", () => {
    expect(nextBrowserCollapse(0, 200, 20)).toBe(1);
    expect(nextBrowserCollapse(1, 220, 0)).toBe(1);
    expect(nextBrowserCollapse(1, 150, -30)).toBe(0);
    expect(nextBrowserCollapse(1, 0, 0)).toBe(0);
  });
});
