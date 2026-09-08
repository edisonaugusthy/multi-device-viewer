import { describe, expect, it } from "vitest";
import {
  getMobileKeyboardHeight,
  getMobileKeyboardOcclusion,
  getIosTopSurfaceOverlap,
  getSafariContentBottomInset,
  resolveMobileKeyboardLayout,
} from "./DeviceFrame";

describe("mobile keyboard profiles", () => {
  it.each([
    [{ inputType: "email" }, "email"],
    [{ inputType: "tel", inputMode: "numeric" }, "number"],
    [{ inputType: "number", inputMode: "text" }, "text"],
    [{ inputType: "url" }, "url"],
    [{ inputType: "tel" }, "phone"],
    [{ inputType: "number" }, "number"],
    [{ inputMode: "decimal" }, "decimal"],
    [{ inputType: "text", inputMode: "search" }, "search"],
    [{ inputType: "text", enterKeyHint: "search" }, "search"],
    [{ inputType: "password" }, "text"],
  ] as const)("selects the correct layout for %o", (state, expected) => {
    expect(resolveMobileKeyboardLayout(state)).toBe(expected);
  });

  it("uses distinct iOS and Android portrait heights", () => {
    expect(getMobileKeyboardHeight("ios", false, false)).toBe(310);
    expect(getMobileKeyboardHeight("android", false, false)).toBe(296);
  });

  it("uses shorter phone keyboards in landscape", () => {
    expect(getMobileKeyboardHeight("ios", true, false)).toBeLessThan(getMobileKeyboardHeight("ios", false, false));
    expect(getMobileKeyboardHeight("android", true, false)).toBeLessThan(getMobileKeyboardHeight("android", false, false));
  });

  it("leaves space for the focused field on short landscape screens", () => {
    for (const platform of ["ios", "android"] as const) {
      expect(getMobileKeyboardHeight(platform, true, false, 320)).toBeLessThanOrEqual(180);
      expect(getMobileKeyboardHeight(platform, true, true, 360)).toBeLessThanOrEqual(220);
    }
  });

  it("models iOS as an overlay and Android as a resized viewport", () => {
    expect(getMobileKeyboardOcclusion("ios", 310, 112)).toBe(198);
    expect(getMobileKeyboardOcclusion("android", 296, 36)).toBe(0);
  });

  it("reserves space for the floating Safari controls", () => {
    expect(getSafariContentBottomInset("ios-liquid-glass", 112)).toBe(112);
    expect(getSafariContentBottomInset("ios-modern", 112)).toBe(112);
    expect(getSafariContentBottomInset("ios-classic", 62)).toBe(62);
  });

  it("never paints a header seam over page content", () => {
    expect(getIosTopSurfaceOverlap("ios-liquid-glass")).toBe(0);
    expect(getIosTopSurfaceOverlap("ios-liquid-glass", "apple-iphone-17e-2026")).toBe(0);
    expect(getIosTopSurfaceOverlap("ios-modern")).toBe(0);
    expect(getIosTopSurfaceOverlap("ios-classic")).toBe(0);
  });
});
