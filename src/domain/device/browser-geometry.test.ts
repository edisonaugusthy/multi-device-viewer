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
  it("adapts Duo Safari to orientation without an inner-display sensor margin", () => {
    const duo = devices.find(d => d.id === "apple-iphone-duo-unfolded-2026")!;
    const portrait = getBrowserGeometry(duo, { width: 626, height: 890 });
    const landscape = getBrowserGeometry(duo, { width: 890, height: 626 });
    expect(portrait.duoControls).toBe("top");
    expect(portrait.top).toBe(Math.max(portrait.status, portrait.address));
    expect(portrait.toolbar).toBe(0);
    expect(portrait.left + portrait.right).toBe(0);
    expect(landscape.duoControls).toBe("side");
    expect(landscape.top + landscape.bottom).toBe(0);
    expect(landscape.content.height).toBe(626);
    expect(landscape.duoToolbarSide).toBe("right");
    expect(landscape.right).toBe(landscape.toolbar);
    expect(landscape.left).toBe(76);
    // viewport-fit=cover must not put fixed page actions under our side controls.
    expect(getBrowserGeometry(duo, { width: 890, height: 626 }, {}, { viewportFit: "cover" })).toEqual(landscape);
    const bare = getBrowserGeometry(duo, { width: 890, height: 626 }, {}, { showStatusBar: false, showUrlBar: false });
    expect(bare.right).toBe(0);
    expect(bare.left).toBeLessThan(20); // home gesture clearance only
    expect(bare.status).toBe(0);
  });
  it("keeps the Duo outer camera clear while allowing the inner page to fill the screen", () => {
    const folded = devices.find(d => d.id === "apple-iphone-duo-folded-2026")!;
    const portrait = getBrowserGeometry(folded, { width: 466, height: 678 }, {}, { showStatusBar: false, showUrlBar: false });
    const landscape = getBrowserGeometry(folded, { width: 678, height: 466 }, {}, { showStatusBar: false, showUrlBar: false, viewportFit: "cover" });
    expect(portrait.top).toBe(80);
    expect(portrait.statusInsetRight).toBe(80);
    expect(landscape.right).toBe(80);
    expect(landscape.duoToolbarSide).toBe("left");
  });
  it("reserves Duo side controls through scrolling and keyboard presentation", () => {
    const duo = devices.find(d => d.id === "apple-iphone-duo-unfolded-2026")!;
    const screen = { width: 890, height: 626 };
    const expanded = getBrowserGeometry(duo, screen);
    const scrolled = getBrowserGeometry(duo, screen, { layout: "compact" }, { collapsed: 1 });
    const keyboard = getBrowserGeometry(duo, screen, {}, { keyboardHeight: 260 });
    expect(scrolled.duoControls).toBe("side"); // old saved phone preferences normalize
    expect(scrolled.left).toBe(expanded.left);
    expect(scrolled.right).toBe(expanded.right);
    expect(scrolled.content.width).toBe(expanded.content.width);
    expect(scrolled.pillHeight).toBe(0);
    expect(keyboard.left).toBe(expanded.left);
    expect(keyboard.right).toBe(expanded.right);
    expect(keyboard.content.height).toBe(expanded.content.height - 260);
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
