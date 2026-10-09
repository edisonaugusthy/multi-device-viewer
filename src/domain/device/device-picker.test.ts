import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { adjacentPickerDevices, buildPickerSections, pickerTypeOptions, PICKER_RECENT_LIMIT } from "./device-picker";

const ids = (list: { id: string }[]) => list.map(device => device.id);

describe("device picker sections", () => {
  it("lists starred and recent devices before every type without repeating recents that are starred", () => {
    const sections = buildPickerSections({
      devices,
      favorites: ["apple-iphone-18-pro-2026"],
      recents: ["apple-iphone-18-pro-2026", "apple-ipad-pro-13-m4-2024", "apple-ipad-pro-13-m4-2024"],
    });
    expect(sections[0]).toMatchObject({ key: "starred" });
    expect(ids(sections[0].devices)).toEqual(["apple-iphone-18-pro-2026"]);
    expect(sections[1]).toMatchObject({ key: "recent" });
    expect(ids(sections[1].devices)).toEqual(["apple-ipad-pro-13-m4-2024"]);
    expect(sections.slice(2).map(section => section.key)[0]).toBe("ios");
  });

  it("limits recent devices and skips empty sections", () => {
    const recents = devices.slice(0, 10).map(device => device.id);
    const sections = buildPickerSections({ devices, favorites: [], recents });
    expect(sections[0].key).toBe("recent");
    expect(sections[0].devices).toHaveLength(PICKER_RECENT_LIMIT);
    expect(sections.every(section => section.devices.length > 0)).toBe(true);
  });

  it("orders each type from the smallest to the largest screen", () => {
    const ios = buildPickerSections({ devices, favorites: [], recents: [], typeFilter: "ios" });
    expect(ios.map(section => section.key)).toEqual(["ios"]);
    const widths = ios[0].devices.map(device => device.cssViewport.width);
    expect(widths).toEqual([...widths].sort((left, right) => left - right));
  });

  it("drops starred and recent sections while searching", () => {
    const sections = buildPickerSections({ devices, favorites: ["apple-iphone-18-pro-2026"], recents: [], query: "ipad pro" });
    expect(sections.some(section => section.key === "starred" || section.key === "recent")).toBe(false);
    const results = sections.flatMap(section => section.devices);
    expect(results.map(device => device.id)).toContain("apple-ipad-pro-13-m4-2024");
    expect(results.every(device => device.type === "tablet")).toBe(true);
  });

  it("keeps custom sizes out of the type filter", () => {
    expect(pickerTypeOptions(devices)).not.toContain("custom");
    expect(pickerTypeOptions(devices)[0]).toBe("ios");
  });

  it("steps to the neighbouring devices of the same type, smallest screen first", () => {
    const ios = buildPickerSections({ devices, favorites: [], recents: [], typeFilter: "ios" })[0].devices;
    const middle = ios[1];

    expect(adjacentPickerDevices(devices, middle.id)).toEqual({ previous: ios[0], next: ios[2] });
    expect(adjacentPickerDevices(devices, ios[0].id).previous).toBeUndefined();
    expect(adjacentPickerDevices(devices, ios.at(-1)!.id).next).toBeUndefined();
    expect(adjacentPickerDevices(devices, "missing-device")).toEqual({});
  });
});
