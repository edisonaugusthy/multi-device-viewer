import { describe, expect, it } from "vitest";
import { devices } from "./device-catalog";

describe("device catalog imports", () => {
  it.each([
    ["google-pixel-10-2026", "Google Pixel 10", 412, 924, 2.625],
    ["google-pixel-10-pro-2026", "Google Pixel 10 Pro", 410, 912, 3.125],
    ["google-pixel-10-pro-fold-2026", "Google Pixel 10 Pro Fold", 412, 901, 2.625],
    ["samsung-galaxy-a17-2025", "Samsung Galaxy A17", 412, 892, 2.625],
    ["motorola-razr-70-ultra-2026", "Motorola Razr 70 Ultra", 412, 1008, 3],
    ["infinix-hot-70-2026", "Infinix Hot 70", 360, 788, 2],
  ])("includes %s with source geometry", (id, name, width, height, pixelRatio) => {
    const device = devices.find((candidate) => candidate.id === id);

    expect(device).toMatchObject({
      name,
      cssViewport: { width, height },
      pixelRatio,
    });
    expect(device?.mockupAssets[0]?.localPath).toBe(`/mockups/${id}.png`);
    const viewport = device?.mockupAssets[0]?.viewport;
    expect(viewport?.portrait?.paths?.portrait).toContain("M");
    expect(viewport?.landscape?.paths?.landscape).toContain("M");
  });
});
