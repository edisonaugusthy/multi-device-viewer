import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { hidesPageScrollbars } from "./device-service";

const byId = (id: string) => devices.find((device) => device.id === id)!;

describe("hidesPageScrollbars", () => {
  it("hides scrollbars on touchscreens, including the built-in touch panels", () => {
    for (const id of ["apple-homeview-2026", "sonoff-nspanel-pro", "apple-iphone-18-pro-2026"]) {
      expect(hidesPageScrollbars(byId(id)), id).toBe(true);
    }
  });

  it("keeps scrollbars on laptops and desktops", () => {
    expect(devices.filter((device) => device.type === "laptop" || device.type === "desktop").some(hidesPageScrollbars)).toBe(false);
  });
});
