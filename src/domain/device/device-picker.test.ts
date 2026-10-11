import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { groupGalleryDevices } from "./device-gallery";
import { adjacentPickerDevices, availablePickerTabs, buildPickerSections, PICKER_RECENT_LIMIT } from "./device-picker";

const ids = (list: { id: string }[]) => list.map(device => device.id);

describe("device picker sections", () => {
  const byId = (id: string) => devices.find(device => device.id === id)!;

  it("pins the devices on screen, then starred devices, then every device not on screen", () => {
    const sections = buildPickerSections({
      devices,
      favorites: ["apple-iphone-18-pro-2026", "apple-ipad-pro-13-m4-2024"],
      onScreen: [byId("apple-ipad-pro-13-m4-2024"), byId("google-pixel-10-2026"), byId("google-pixel-10-2026")],
    });
    expect(sections.map(section => section.key)).toEqual(["onScreen", "starred", "all"]);
    expect(ids(sections[0].devices)).toEqual(["apple-ipad-pro-13-m4-2024", "google-pixel-10-2026"]);
    expect(ids(sections[1].devices)).toEqual(["apple-iphone-18-pro-2026"]);
    const all = ids(sections[2].devices);
    expect(all).toContain("apple-iphone-18-pro-2026");
    expect(all).not.toContain("google-pixel-10-2026");
    expect(all).toHaveLength(new Set(all).size);
  });

  it("shows recent devices when nothing starred is left to show", () => {
    const recents = ["apple-iphone-18-pro-2026", ...devices.slice(0, 10).map(device => device.id)];
    const onScreen = [byId("apple-iphone-18-pro-2026")];
    const withoutStars = buildPickerSections({ devices, favorites: [], recents, onScreen });
    expect(withoutStars.map(section => section.key)).toEqual(["onScreen", "recent", "all"]);
    expect(withoutStars[1].devices).toHaveLength(PICKER_RECENT_LIMIT);
    expect(ids(withoutStars[1].devices)).not.toContain("apple-iphone-18-pro-2026");
    // A starred device that is already on screen leaves room for recent devices.
    expect(buildPickerSections({ devices, favorites: ["apple-iphone-18-pro-2026"], recents, onScreen })[1].key).toBe("recent");
    expect(buildPickerSections({ devices, favorites: ["apple-ipad-pro-13-m4-2024"], recents, onScreen })[1].key).toBe("starred");
  });

  it("lists the newest devices of a tab first", () => {
    const ios = buildPickerSections({ devices, favorites: [], tab: "ios" });
    expect(ios.map(section => section.key)).toEqual(["matches"]);
    const years = ios[0].devices.map(device => device.year ?? 0);
    expect(years).toEqual([...years].sort((left, right) => right - left));
    expect(ios[0].devices[0].year).toBe(2026);
    expect(ios[0].devices.at(-1)!.id).toBe("apple-iphone-5");
  });

  it("groups laptops and desktops as computers", () => {
    const types = new Set(buildPickerSections({ devices, favorites: [], tab: "computer" })[0].devices.map(device => device.type));
    expect([...types].sort()).toEqual(["desktop", "laptop"]);
  });

  it("matches the start of words and ranks names that start with the query first", () => {
    const matches = (query: string) => buildPickerSections({ devices, favorites: [], query }).flatMap(section => section.devices);
    expect(ids(matches("fold"))).toContain("samsung-galaxy-z-fold8-unfolded-2026");
    // "pro" starts a word in "iPhone 16 Pro", but only occurs mid-word in "Toughbook".
    expect(matches("pro").some(device => device.id === "panasonic-toughbook-s1-2021")).toBe(false);
    expect(ids(matches("ook"))).toEqual([]);
    const pixel = matches("pixel 1");
    expect(pixel.length).toBeGreaterThan(0);
    expect(pixel.every(device => device.name.startsWith("Google Pixel 1"))).toBe(true);
    const galaxy = matches("galaxy s2");
    expect(galaxy[0].name).toMatch(/^Samsung Galaxy S2/);
  });

  it("shows one plain list while searching", () => {
    const sections = buildPickerSections({ devices, favorites: ["apple-iphone-18-pro-2026"], onScreen: [byId("apple-iphone-18-pro-2026")], query: "ipad pro" });
    expect(sections.map(section => section.key)).toEqual(["matches"]);
    expect(ids(sections[0].devices)).toContain("apple-ipad-pro-13-m4-2024");
    expect(sections[0].devices.every(device => device.type === "tablet")).toBe(true);
  });

  it("keeps saved custom sizes out of the device list", () => {
    const custom = { ...byId("apple-iphone-18-pro-2026"), id: "custom-390x700", name: "390 × 700", brand: "Custom" };
    const listed = buildPickerSections({ devices: [...devices, custom], favorites: [] }).flatMap(section => ids(section.devices));
    expect(listed).not.toContain("custom-390x700");
    expect(availablePickerTabs(devices)).toEqual(["all", "ios", "android", "tablet", "computer", "other"]);
  });

  it("steps to the neighbouring devices of the same type, smallest screen first", () => {
    const ios = groupGalleryDevices(devices).find(group => group.id === "ios")!.devices;
    const middle = ios[1];

    expect(adjacentPickerDevices(devices, middle.id)).toEqual({ previous: ios[0], next: ios[2] });
    expect(adjacentPickerDevices(devices, ios[0].id).previous).toBeUndefined();
    expect(adjacentPickerDevices(devices, ios.at(-1)!.id).next).toBeUndefined();
    expect(adjacentPickerDevices(devices, "missing-device")).toEqual({});
  });
});
