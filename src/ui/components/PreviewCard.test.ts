import { describe, expect, it } from "vitest";
import { devices } from "../../domain/device/device-catalog";
import { menuGroupFor } from "./PreviewCard";

describe("device picker categories", () => {
  it.each([
    "apple-iphone-18-pro-2026",
    "apple-iphone-18-pro-max-2026",
    "apple-iphone-duo-folded-2026",
    "apple-iphone-duo-unfolded-2026",
  ])("shows %s in iOS with its new tag", id => {
    const device = devices.find(device => device.id === id)!;
    expect(menuGroupFor(device)).toBe("ios");
    expect(device.tags).toContain("new");
  });

  it("groups versioned phone operating systems without moving tablets or custom devices", () => {
    const phone = devices.find(device => device.id === "apple-iphone-18-pro-2026")!;
    expect(menuGroupFor({ ...phone, os: " iOS 27.1 " })).toBe("ios");
    expect(menuGroupFor({ ...phone, brand: "Google", os: "Android 17" })).toBe("android");
    expect(menuGroupFor({ ...phone, os: "iOS", type: "tablet" })).toBe("tablet");
    expect(menuGroupFor({ ...phone, brand: "Custom" })).toBe("custom");
  });
});
