import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { getBrowserGeometry, nextBrowserCollapse, supportsIos26 } from "./browser-geometry";
import { fitViewportToScreen } from "../../ui/components/DeviceFrame";

describe("browser content boundaries", () => {
  it("keeps all 105 device identities available", () => { expect(devices).toHaveLength(105); });
  it.each(devices.filter(device => device.type === "phone" || device.type === "tablet").map(d => [d.id, d] as const))("keeps fixed page actions above controls on %s", (_id, device) => {
    for (const landscape of [false, true]) for (const collapsed of [0, 1]) for (const layout of ["compact", "bottom", "top", "tabs", "compact-tabs"] as const) {
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
  it("does not assign iOS 26 to incompatible iPhones", () => {
    expect(devices.filter(d => d.type === "phone" && supportsIos26(d))).toHaveLength(29);
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
