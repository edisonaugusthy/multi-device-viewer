import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { groupGalleryDevices } from "./device-gallery";
import type { Device } from "./device.types";

const device = (id: string, width: number, height: number, overrides: Partial<Device> = {}): Device => ({
  ...devices[0], id, name: id, type: "phone", os: "iOS", cssViewport: { width, height }, ...overrides,
});

describe("all-device gallery", () => {
  it("includes every catalog device once, keeps types together, and orders by CSS viewport", () => {
    const groups = groupGalleryDevices(devices);
    expect(groups.flatMap(group => group.devices)).toHaveLength(devices.length);
    expect(new Set(groups.flatMap(group => group.devices.map(item => item.id))).size).toBe(devices.length);
    for (const group of groups) {
      const type = group.id === "ios" || group.id === "android" ? "phone" : group.id;
      expect(group.devices.every(item => item.type === type)).toBe(true);
      for (let index = 1; index < group.devices.length; index++) {
        const previous = group.devices[index - 1].cssViewport;
        const current = group.devices[index].cssViewport;
        expect(current.width >= previous.width).toBe(true);
        if (current.width === previous.width) expect(current.height >= previous.height).toBe(true);
      }
    }
  });

  it("sorts equal widths by height without reordering the source or collapsing matching screens", () => {
    const input = [device("wide", 430, 800), device("tall", 375, 900), device("short", 375, 700), device("another", 375, 700)];
    expect(groupGalleryDevices(input)[0].devices.map(item => item.id)).toEqual(["another", "short", "tall", "wide"]);
    expect(input.map(item => item.id)).toEqual(["wide", "tall", "short", "another"]);
  });

  it("keeps user-defined devices in Custom and supports combined name and dimension searches", () => {
    const input = [device("Café phone", 375, 700), device("custom phone", 320, 600, { brand: "Custom" })];
    expect(groupGalleryDevices(input).map(group => group.id)).toEqual(["ios", "custom"]);
    expect(groupGalleryDevices(input, "cafe 375 × 700").flatMap(group => group.devices.map(item => item.id))).toEqual(["Café phone"]);
    expect(groupGalleryDevices(input, "not found")).toEqual([]);
  });

  it("starts with iOS and Android phones, keeps tablets together, and leaves watches last", () => {
    const input = [
      device("watch", 162, 197, { type: "watch", os: "watchOS" }),
      device("android tablet", 800, 1280, { type: "tablet", os: "Android" }),
      device("android phone", 360, 800, { os: "Android 16" }),
      device("iPad", 820, 1180, { type: "tablet", os: "iPadOS" }),
      device("iPhone", 390, 844, { os: "iOS 26" }),
      device("laptop", 1440, 900, { type: "laptop", os: "macOS" }),
      device("other phone", 320, 600, { os: "Other" }),
      device("desktop", 1920, 1080, { type: "desktop" }),
      device("TV", 2560, 1440, { type: "tv" }),
      device("custom iOS", 320, 480, { brand: "Custom" }),
    ];
    const groups = groupGalleryDevices(input);
    expect(groups.map(group => group.id)).toEqual(["ios", "android", "phone", "tablet", "laptop", "desktop", "tv", "custom", "watch"]);
    expect(groups.find(group => group.id === "ios")!.devices.map(item => item.id)).toEqual(["iPhone"]);
    expect(groups.find(group => group.id === "android")!.devices.map(item => item.id)).toEqual(["android phone"]);
    expect(groups.find(group => group.id === "tablet")!.devices.map(item => item.id)).toEqual(["android tablet", "iPad"]);
    expect(groups.flatMap(group => group.devices)).toHaveLength(input.length);
  });
});
