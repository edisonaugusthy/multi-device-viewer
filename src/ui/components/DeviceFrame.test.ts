import { describe, expect, it } from "vitest";
import {
  getMobileKeyboardHeight,
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
});
