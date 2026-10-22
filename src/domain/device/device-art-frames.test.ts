import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";
import { supportsOrientation } from "./device-service";
import baseline from "./device-behavior.fixture.json";

describe("replacement frame migration", () => {
  it("preserves every existing device and its simulation contract", () => {
    expect(devices.map(d => ({
      id: d.id, name: d.name, cssViewport: d.cssViewport, pixelRatio: d.pixelRatio,
      manufacturerResolution: d.manufacturerResolution, rotate: supportsOrientation(d),
    }))).toEqual(baseline);
  });

  it("uses replacement artwork with transparent hardware overlays and unchanged logical viewports", () => {
    for (const device of devices) {
      expect(device.mockupAssets).toHaveLength(1);
      const frame = device.mockupAssets[0];
      expect(frame.localPath).toMatch(/^\/mockups\/[a-z0-9-]+\.webp$/);
      expect(frame.cssViewport).toEqual(device.cssViewport);
      const native = device.cssViewport.width > device.cssViewport.height ? "landscape" : "portrait";
      expect(frame.viewport?.[native]?.width).toBeGreaterThan(0);
      expect(frame.viewport?.[native]?.height).toBeGreaterThan(0);
    }
  });

  it("opens a menu bar strip above the page of every notched Mac, and only those", () => {
    const notched = ["apple-macbook-pro-16-2021", "apple-macbook-pro-14-m5-2025", "apple-macbook-air-13-m4-2025"];
    for (const device of devices) {
      const frame = device.mockupAssets[0];
      const screen = frame.viewport?.landscape;
      if (notched.some(id => frame.localPath === `/mockups/${id}.webp`)) {
        // The display's rounded corners move to the top of the menu bar; the page below is square.
        expect(screen?.menuBar, device.id).toEqual({ height: 32, cornerRadius: expect.any(Number) });
        expect(screen?.menuBar?.cornerRadius, device.id).toBeGreaterThan(10);
        expect(screen?.cornerRadius, device.id).toBe(0);
        expect(screen!.top, device.id).toBeGreaterThan(screen!.menuBar!.height);
      } else expect(screen?.menuBar, device.id).toBeUndefined();
    }
  });

  it("keeps the unfolded Duo page uninterrupted and models the Surface Duo physical gap", () => {
    const open = devices.find(d => d.id === "apple-iphone-duo-unfolded-2026")!;
    expect(open.mockupAssets[0].viewport?.landscape?.occlusions).toBeUndefined();
    const dual = devices.find(d => d.id === "microsoft-surface-duo")!;
    expect(dual.mockupAssets[0].viewport?.landscape?.occlusions).toEqual([
      expect.objectContaining({ kind: "rect", top: 0, height: dual.cssViewport.height }),
    ]);
  });
});
