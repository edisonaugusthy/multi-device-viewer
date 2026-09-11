import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { getBrowserGeometry, nextBrowserCollapse, supportsIos26 } from "./browser-geometry";
import { fitViewportToScreen } from "../../ui/components/DeviceFrame";

describe("browser content boundaries", () => {
  it("keeps all 109 device identities available", () => { expect(devices).toHaveLength(109); });
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
  it.each(["apple-iphone-duo-folded-2026", "apple-iphone-duo-unfolded-2026"])("uses posture-specific orientation rules for controls on %s", id => {
    const duo = devices.find(d => d.id === id)!;
    const folded = id.includes("-folded-");
    const portrait = getBrowserGeometry(duo, { width: 466, height: 678 });
    const landscape = getBrowserGeometry(duo, { width: 678, height: 466 });
    expect(portrait.duoControls).toBe(folded ? "side" : "bottom");
    expect(portrait.duoFullWidthBottom).toBe(folded);
    expect(portrait.top).toBe(folded ? 0 : 40);
    expect(portrait.left).toBe(0);
    expect(portrait.right).toBeCloseTo(folded ? Math.ceil(466 * 74 / 724 + 24) : 0);
    expect(portrait.duoStatusTop).toBe(folded ? 80 : 4);
    expect(portrait.bottom).toBe(portrait.address + (folded ? 0 : portrait.toolbar) + 12);
    expect(landscape.duoControls).toBe("side");
    expect(landscape.duoFullWidthBottom).toBe(!folded);
    expect(landscape.left).toBe(0);
    expect(landscape.right - landscape.duoIconCenterRight!).toBeLessThanOrEqual(28);
    expect(landscape.right - landscape.duoIconCenterRight!).toBeGreaterThanOrEqual(24);
    expect(landscape.right).toBeCloseTo(folded ? Math.ceil(678 * 83 / 1060 + 24) : 56);
    expect(landscape.bottom).toBe(landscape.address + 12);
    expect(getBrowserGeometry(duo, { width: 678, height: 466 }, {}, { viewportFit: "cover" })).toEqual(landscape);
    for (const screen of [{ width: 466, height: 678 }, { width: 678, height: 466 }]) {
      const bare = getBrowserGeometry(duo, screen, {}, { showStatusBar: false, showUrlBar: false });
      expect(bare.right).toBeCloseTo(folded ? screen.width < screen.height ? Math.ceil(screen.width * 74 / 724 + 24) : Math.ceil(screen.width * 83 / 1060 + 24) : 0);
      expect(bare.top).toBe(0);
      expect(bare.bottom).toBe(12);
      const normal = getBrowserGeometry(duo, screen);
      const scrolled = getBrowserGeometry(duo, screen, { layout: "top" }, { collapsed: 1 });
      expect(scrolled.content).toEqual(normal.content);
      const keyboard = getBrowserGeometry(duo, screen, {}, { keyboardHeight: 260 });
      expect(keyboard.right).toBe(normal.right);
      expect(keyboard.bottom).toBe(260);
      expect(keyboard.content.height + keyboard.top + keyboard.bottom).toBe(screen.height);
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
  it("does not assign iOS 26 to incompatible iPhones", () => {
    expect(devices.filter(d => d.type === "phone" && supportsIos26(d))).toHaveLength(33);
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
