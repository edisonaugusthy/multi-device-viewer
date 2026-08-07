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

  it("models iOS as an overlay and Android as a resized viewport", () => {
    expect(getMobileKeyboardOcclusion("ios", 310, 112)).toBe(198);
    expect(getMobileKeyboardOcclusion("android", 296, 36)).toBe(0);
  });

  it("lets iOS 26 page content continue behind the floating Safari pill", () => {
    expect(getSafariContentBottomInset("ios-liquid-glass", 112)).toBe(0);
    expect(getSafariContentBottomInset("ios-modern", 112)).toBe(112);
    expect(getSafariContentBottomInset("ios-classic", 62)).toBe(62);
  });

  it("covers the liquid-glass header seam without affecting older iPhone chrome", () => {
    expect(getIosTopSurfaceOverlap("ios-liquid-glass")).toBe(2);
    expect(getIosTopSurfaceOverlap("ios-liquid-glass", "apple-iphone-17e-2026")).toBe(3);
    expect(getIosTopSurfaceOverlap("ios-modern")).toBe(0);
    expect(getIosTopSurfaceOverlap("ios-classic")).toBe(0);
  });
});
