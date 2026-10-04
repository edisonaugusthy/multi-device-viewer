import { describe, expect, it } from "vitest";
import { devices } from "../../domain/device/device-catalog";
import { getDeviceMenuSections, menuGroupFor } from "./PreviewCard";

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

describe("device navigation order", () => {
  const currentDeviceId = "apple-iphone-18-pro-2026";
  const favorite = "apple-iphone-18-pro-max-2026";
  const recent = "apple-iphone-duo-unfolded-2026";
  const olderRecent = "apple-iphone-17-2025";
  const android = "google-pixel-10-2026";

  it("continues from favorites through recents into the category without duplicate devices", () => {
    const sections = getDeviceMenuSections({
      devices, currentDeviceId, activeGroup: "ios",
      favorites: [favorite, android],
      recents: [favorite, recent, recent, android, olderRecent, currentDeviceId, "deleted-device"],
    });
    expect(sections.map(section => section.key)).toEqual(["favorite", "recent", "ios"]);
    const ids = sections.flatMap(section => section.devices.map(device => device.id));
    expect(ids.slice(0, 3)).toEqual([favorite, recent, olderRecent]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(android);
    expect(ids).toContain(currentDeviceId);
    expect(new Set(ids)).toEqual(new Set(devices.filter(device => menuGroupFor(device) === "ios").map(device => device.id)));
  });

  it.each(["ios", "android", "tablet", "laptop", "desktop", "other", "custom"] as const)(
    "keeps the %s navigation list inside the selected category", activeGroup => {
      const catalog = [...devices, { ...devices[0], id: "custom-navigation", brand: "Custom" }];
      const sections = getDeviceMenuSections({ devices: catalog, currentDeviceId, activeGroup, favorites: [favorite], recents: [recent, android] });
      const listed = sections.flatMap(section => section.devices);
      expect(listed.every(device => menuGroupFor(device) === activeGroup)).toBe(true);
      expect(new Set(listed.map(device => device.id))).toEqual(new Set(catalog.filter(device => menuGroupFor(device) === activeGroup).map(device => device.id)));
    },
  );

  it("uses the search result order when choosing a filtered device", () => {
    const sections = getDeviceMenuSections({ devices, currentDeviceId, activeGroup: "android", favorites: [favorite], recents: [recent], query: "iPhone Duo" });
    expect(sections.map(section => section.key)).toEqual(["search"]);
    expect(sections[0].devices.map(device => device.id)).toEqual([
      "apple-iphone-duo-folded-2026", "apple-iphone-duo-unfolded-2026",
    ]);
  });
});
