import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  estimateDeviceFrameSize,
  fitViewportToScreen,
} from "../../ui/components/DeviceFrame";
import { currentDeviceId, defaultDeviceIds, devices, quickDevicePresetIds } from "./device-catalog";
import { getDefaultOrientation, getMockupViewport, nextOrientation, normalizeOrientation, orientations, supportsOrientation, toLandscapeAwareSize } from "./device-service";
import { getFrameProfile } from "./frame-profiles";
import { getBrowserGeometry } from "./browser-geometry";

const assetPath = (id: string) => `/mockups/${id}.webp`;

// Photo apertures retain source pixels; logical browser dimensions remain exact.
function expectPhotoFit(screen: { width: number; height: number }, logical: { width: number; height: number }) {
  expect(Math.abs(screen.width / screen.height / (logical.width / logical.height) - 1)).toBeLessThan(0.03);
  const fit = fitViewportToScreen(logical, { left: 0, top: 0, ...screen });
  expect(fit.scaleX).toBe(fit.scaleY);
  expect(logical.width * fit.scaleX).toBeLessThanOrEqual(screen.width + 1e-6);
  expect(logical.height * fit.scaleY).toBeLessThanOrEqual(screen.height + 1e-6);
}

describe("device catalog imports", () => {
  it("keeps the Fold7 center crease interactive while retaining the camera cutout", () => {
    const fold = devices.find(device => device.id === "samsung-galaxy-z-fold7-unfolded-2025")!;
    const viewport = fold.mockupAssets[0].viewport!.portrait!;
    expect(viewport.occlusions?.some(hole => hole.kind === "rect" && hole.top === 0 && hole.height >= viewport.height)).toBe(false);
    expect(viewport.occlusions?.some(hole => hole.kind === "circle")).toBe(true);
  });

  it("uses the latest requested devices for startup and quick presets", () => {
    expect(defaultDeviceIds).toEqual([
      "apple-iphone-18-pro-2026",
      "apple-iphone-duo-folded-2026",
      "apple-macbook-pro-14-m5-2025",
    ]);
    expect(quickDevicePresetIds).toEqual({
      phoneTablet: [
        "apple-iphone-18-pro-2026",
        "apple-ipad-pro-13-m4-2024",
      ],
      iosAndroid: [
        "apple-iphone-18-pro-2026",
        "samsung-galaxy-s26-ultra-2026",
      ],
      mobileTabletLaptop: [
        "apple-iphone-18-pro-2026",
        "apple-ipad-pro-13-m4-2024",
        "apple-macbook-pro-14-m5-2025",
      ],
    });
    for (const id of new Set([...defaultDeviceIds, ...Object.values(quickDevicePresetIds).flat()])) {
      expect(devices.some((device) => device.id === id), id).toBe(true);
    }
  });

  it.each([
    ["samsung-galaxy-z-fold8-ultra-folded-2026", "Samsung Galaxy Z Fold8 Ultra (folded)", 360, 840, 1080, 2520],
    ["samsung-galaxy-z-fold8-ultra-unfolded-2026", "Samsung Galaxy Z Fold8 Ultra (unfolded)", 902, 1002, 2256, 2504],
    ["samsung-galaxy-z-fold8-folded-2026", "Samsung Galaxy Z Fold8 (folded)", 416, 657, 1248, 1972],
    ["samsung-galaxy-z-fold8-unfolded-2026", "Samsung Galaxy Z Fold8 (unfolded)", 979, 739, 2448, 1848],
    ["samsung-galaxy-z-flip8-folded-2026", "Samsung Galaxy Z Flip8 (folded)", 316, 349, 948, 1048],
    ["samsung-galaxy-z-flip8-unfolded-2026", "Samsung Galaxy Z Flip8 (unfolded)", 360, 840, 1080, 2520],
    ["samsung-galaxy-a27-5g-2026", "Samsung Galaxy A27 5G", 360, 780, 1080, 2340],
  ])("keeps the previous announced device %s without a stale new badge", (id, name, width, height, panelWidth, panelHeight) => {
    expect(devices.find((candidate) => candidate.id === id)).toMatchObject({
      name,
      year: 2026,
      cssViewport: { width, height },
      manufacturerResolution: { width: panelWidth, height: panelHeight },
      tags: expect.arrayContaining(["android"]),
    });
    expect(devices.find((candidate) => candidate.id === id)?.tags).not.toContain("new");
  });

  it.each([
    ["apple-iphone-18-pro-2026", 402, 874, 1206, 2622],
    ["apple-iphone-18-pro-max-2026", 440, 956, 1320, 2868],
    ["apple-iphone-duo-folded-2026", 466, 678, 1398, 2034],
    ["apple-iphone-duo-unfolded-2026", 890, 626, 2670, 1878],
  ])("keeps Apple panel geometry and both orientations for %s", (id, width, height, panelWidth, panelHeight) => {
    const device = devices.find(candidate => candidate.id === id)!;
    expect(device).toMatchObject({
      cssViewport: { width, height },
      manufacturerResolution: { width: panelWidth, height: panelHeight },
      pixelRatio: 3,
      displayReferenceUrl: expect.stringMatching(/^https:\/\/www\.apple\.com\/.*\/specs\/$/),
    });
    expect(supportsOrientation(device)).toBe(true);
    expect(getFrameProfile(device).chromeVariant).toBe("ios-liquid-glass");
    const asset = device.mockupAssets[0];
    for (const orientation of ["portrait", "landscape"] as const) {
      const viewport = asset.viewport![orientation]!;
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
      expect(viewport.enableRotation).not.toBe(false);
      expect(viewport.width < viewport.height).toBe(orientation === "portrait");
      const logical = orientation === "portrait"
        ? { width: Math.min(width, height), height: Math.max(width, height) }
        : { width: Math.max(width, height), height: Math.min(width, height) };
      // Raster apertures include subpixel rounding; live CSS geometry stays independent.
      expect(Math.abs(viewport.width / logical.width - 1)).toBeLessThan(0.01);
      expect(Math.abs(viewport.height / logical.height - 1)).toBeLessThan(0.01);
      const frame = estimateDeviceFrameSize({ device, viewportSize: logical, showFrame: true, showStatusBar: true, showUrlBar: true });
      expect(viewport.left).toBeGreaterThan(0);
      expect(viewport.top).toBeGreaterThan(0);
      expect(viewport.left + viewport.width).toBeLessThanOrEqual(frame.width);
      expect(viewport.top + viewport.height).toBeLessThanOrEqual(frame.height);
    }
  });

  it("marks only the latest device batch as new", () => {
    expect(
      devices
        .filter((device) => device.tags.includes("new"))
        .map((device) => device.id)
        .sort(),
    ).toEqual([
      "apple-iphone-18-pro-2026",
      "apple-iphone-18-pro-max-2026",
      "apple-iphone-duo-folded-2026",
      "apple-iphone-duo-unfolded-2026",
    ]);
  });

  it.each([
    ["samsung-galaxy-z-fold8-ultra-folded-2026", "/mockups/samsung-galaxy-z-fold8-ultra-folded-2026.webp"],
    ["samsung-galaxy-z-fold8-ultra-unfolded-2026", "/mockups/samsung-galaxy-z-fold8-ultra-unfolded-2026.webp"],
    ["samsung-galaxy-z-fold8-folded-2026", "/mockups/samsung-galaxy-z-fold8-folded-2026.webp"],
    ["samsung-galaxy-z-fold8-unfolded-2026", "/mockups/samsung-galaxy-z-fold8-unfolded-2026.webp"],
    ["samsung-galaxy-z-flip8-folded-2026", "/mockups/samsung-galaxy-z-flip8-folded-2026.webp"],
    ["samsung-galaxy-z-flip8-unfolded-2026", "/mockups/samsung-galaxy-z-flip8-unfolded-2026.webp"],
    ["samsung-galaxy-a27-5g-2026", "/mockups/samsung-galaxy-a27-5g-2026.webp"],
  ])("uses a product-specific replacement frame for %s", (id, localPath) => {
    const asset = devices.find((candidate) => candidate.id === id)?.mockupAssets[0];

    expect(asset?.localPath).toBe(localPath);
    expect(asset?.viewport?.portrait).toBeDefined();
  });

  it.each([
    ["apple-iphone-17e-2026", "Apple iPhone 17e", "phone", 390, 844, 1170, 2532, "/mockups/apple-iphone-17e-2026.webp"],
    ["google-pixel-10a-2026", "Google Pixel 10a", "phone", 412, 924, 1080, 2424, "/mockups/google-pixel-10a-2026.webp"],
    ["samsung-galaxy-s26-plus-2026", "Samsung Galaxy S26+", "phone", 384, 832, 1440, 3120, "/mockups/samsung-galaxy-s26-plus-2026.webp"],
    ["apple-macbook-neo-13-2026", "Apple MacBook Neo 13-inch", "laptop", 1204, 753, 2408, 1506, "/mockups/apple-macbook-neo-13-2026.webp"],
    ["microsoft-surface-laptop-8-13-8-2026", "Microsoft Surface Laptop 13.8-inch (8th Edition)", "laptop", 1152, 768, 2304, 1536, "/mockups/microsoft-surface-laptop-8-13-8-2026.webp"],
    ["apple-studio-display-xdr-27-2026", "Apple Studio Display XDR 27-inch", "desktop", 2560, 1440, 5120, 2880, "/mockups/apple-studio-display-xdr-27-2026.webp"],
  ])("includes manufacturer-photo frame %s", (id, name, type, width, height, panelWidth, panelHeight, localPath) => {
    expect(devices.find((device) => device.id === id)).toMatchObject({
      name,
      type,
      cssViewport: { width, height },
      manufacturerResolution: { width: panelWidth, height: panelHeight },
      tags: expect.not.arrayContaining(["new"]),
      mockupAssets: [expect.objectContaining({ localPath })],
    });
    const asset = devices.find((device) => device.id === id)?.mockupAssets[0];
    expect(asset?.renderScale).toBeGreaterThan(0);
  });

  it("clips the page around the drawn iPhone notch", () => {
    const asset = devices.find(d => d.id === "apple-iphone-17e-2026")!.mockupAssets[0];
    expect(asset.viewport?.portrait?.occlusions).toEqual([expect.objectContaining({ kind: "rounded-rect", top: 0 })]);
    expect(asset.viewport?.landscape?.occlusions).toHaveLength(1);
  });

  it("loads every mockup from an existing local asset without remote sources", () => {
    for (const device of devices) for (const asset of device.mockupAssets) {
      expect(asset).not.toHaveProperty("sourceUrl");
      if (asset.localPath) {
        expect(asset.localPath).toMatch(/^\/mockups\//);
        // Mockups are private exports in ignored internal/artwork/, copied in at build time.
        expect(existsSync(`internal/artwork${asset.localPath}`), asset.localPath).toBe(true);
      }
    }
  });

  it("starts phones upright and wide unfolded displays in landscape", () => {
    for (const [id, expected] of [
      ["apple-iphone-18-pro-2026", "portrait"],
      ["apple-iphone-duo-folded-2026", "portrait"],
      ["apple-iphone-duo-unfolded-2026", "landscape"],
      ["samsung-galaxy-z-fold8-unfolded-2026", "landscape"],
    ]) {
      expect(getDefaultOrientation(devices.find(device => device.id === id))).toBe(expected);
    }
  });

  it("migrates previously saved inverted orientations to the two supported states", () => {
    expect(normalizeOrientation("portrait-inverted")).toBe("portrait");
    expect(normalizeOrientation("landscape-inverted")).toBe("landscape");
    const wide = devices.find(device => device.id === "apple-iphone-duo-unfolded-2026")!;
    expect(normalizeOrientation("unknown", wide)).toBe("landscape");
  });

  it.each(devices.filter(supportsOrientation))("rotates $id between portrait and landscape using the same local image", device => {
    let orientation = device.cssViewport.width > device.cssViewport.height ? "landscape" as const : "portrait" as const;
    const first = orientation;
    const visited = new Set<string>();
    for (let turn = 0; turn < 2; turn++) {
      visited.add(orientation);
      const viewport = getMockupViewport(device.mockupAssets[0], orientation);
      const size = toLandscapeAwareSize(device.cssViewport, orientation);
      expect(size.width > size.height).toBe(orientation.startsWith("landscape"));
      if (device.mockupAssets[0]?.viewport) {
        expect(viewport).toBeDefined();
        expect(viewport!.width).toBeGreaterThan(0);
        expect(viewport!.height).toBeGreaterThan(0);
        const upright = getMockupViewport(device.mockupAssets[0], orientation.startsWith("landscape") ? "landscape" : "portrait")!;
        expect(viewport!.width).toBe(upright.width);
        expect(viewport!.height).toBe(upright.height);
      }
      orientation = nextOrientation(orientation) as typeof orientation;
    }
    expect([...visited].sort()).toEqual([...orientations].sort());
    expect(orientation).toBe(first);
  });

  it("keeps unfolded foldables free of synthetic hinge seams", () => {
    for (const id of [
      "samsung-galaxy-z-fold8-unfolded-2026",
      "samsung-galaxy-z-fold8-ultra-unfolded-2026",
    ]) {
      const portrait = devices.find((device) => device.id === id)!.mockupAssets[0].viewport!.portrait!;
      expect(portrait.occlusions?.some((occlusion) => occlusion.kind === "rect")).toBe(false);
      expect(portrait.occlusions).toHaveLength(1);
      expect(portrait.occlusions![0].kind).toBe("circle");
    }
  });

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
    expect(device?.mockupAssets[0]?.localPath).toBe(assetPath(id));
    const viewport = device?.mockupAssets[0]?.viewport;
    // A screen is a rounded rectangle (its radius) or carries its own clip path.
    expect(viewport?.portrait?.paths?.portrait ?? viewport?.portrait?.cornerRadius).toBeDefined();
    expect(viewport?.landscape?.paths?.landscape ?? viewport?.landscape?.cornerRadius).toBeDefined();
  });

  it.each([
    ["google-pixel-11-2026", "Google Pixel 11", 412, 924, 1080, 2424],
    ["google-pixel-11-pro-2026", "Google Pixel 11 Pro", 410, 914, 1280, 2856],
    ["google-pixel-11-pro-xl-2026", "Google Pixel 11 Pro XL", 448, 997, 1344, 2992],
    ["google-pixel-11-pro-fold-2026", "Google Pixel 11 Pro Fold", 791, 823, 2076, 2160],
  ])("includes announced Pixel 11 profile %s", (id, name, width, height, resolutionWidth, resolutionHeight) => {
    expect(devices.find((candidate) => candidate.id === id)).toMatchObject({
      name,
      year: 2026,
      cssViewport: { width, height },
      manufacturerResolution: { width: resolutionWidth, height: resolutionHeight },
      tags: expect.arrayContaining(["android"]),
    });
  });

  it.each([
    ["google-pixel-11-2026", "/mockups/google-pixel-11-2026.webp", "https://store.google.com/us/config/pixel_11?hl=en-US"],
    ["google-pixel-11-pro-2026", "/mockups/google-pixel-11-pro-2026.webp", "https://store.google.com/us/config/pixel_11_pro?hl=en-US"],
    ["google-pixel-11-pro-xl-2026", "/mockups/google-pixel-11-pro-xl-2026.webp", "https://store.google.com/us/config/pixel_11_pro?hl=en-US"],
    ["google-pixel-11-pro-fold-2026", "/mockups/google-pixel-11-pro-fold-2026.webp", "https://store.google.com/us/config/pixel_11_pro_fold?hl=en-US"],
  ])("uses the drawn Google device frame for %s", (id, localPath) => {
    expect(devices.find((candidate) => candidate.id === id)?.mockupAssets[0]).toMatchObject({
      localPath,
      viewport: {
        portrait: expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
        landscape: expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
      },
    });
  });

  it("keeps the google-pixel-11-pro-2026 camera centered and rotated with its screen", () => {
    const device = devices.find(d => d.id === "google-pixel-11-pro-2026")!;
    const asset = device.mockupAssets[0];
    const portrait = asset.viewport!.portrait!, landscape = asset.viewport!.landscape!;
    const camera = portrait.occlusions![0], rotated = landscape.occlusions![0];
    expectPhotoFit(portrait, device.cssViewport);
    expect(Math.abs(camera.left + camera.width / 2 - portrait.width / 2)).toBeLessThan(2);
    expect(rotated.left).toBeCloseTo(portrait.height - camera.top - camera.height);
    expect(rotated.top).toBe(camera.left);
    expect(rotated.width).toBe(camera.height);
    expect(rotated.height).toBe(camera.width);
  });

  it("keeps the google-pixel-11-2026 camera centered and rotated with its screen", () => {
    const device = devices.find(d => d.id === "google-pixel-11-2026")!;
    const asset = device.mockupAssets[0];
    const portrait = asset.viewport!.portrait!, landscape = asset.viewport!.landscape!;
    const camera = portrait.occlusions![0], rotated = landscape.occlusions![0];
    expectPhotoFit(portrait, device.cssViewport);
    expect(Math.abs(camera.left + camera.width / 2 - portrait.width / 2)).toBeLessThan(2);
    expect(rotated.left).toBeCloseTo(portrait.height - camera.top - camera.height);
    expect(rotated.top).toBe(camera.left);
    expect(rotated.width).toBe(camera.height);
    expect(rotated.height).toBe(camera.width);
  });

  it("keeps the Pixel 11 Pro Fold camera clear of its status icons", () => {
    const device = devices.find(d => d.id === "google-pixel-11-pro-fold-2026")!;
    const screen = device.mockupAssets[0].viewport!.portrait!;
    const camera = screen.occlusions![0];
    expectPhotoFit(screen, device.cssViewport);
    expect(camera.left).toBeGreaterThan(screen.width * .9);
    expect((camera.top + camera.height) * device.cssViewport.height / screen.height).toBeLessThan(getBrowserGeometry(device, device.cssViewport).status);
    expect(getFrameProfile(device).statusBarInsetRight).toBe(44);
  });

  it("keeps the first-generation iPhone SE top hardware and classic status bar separate", () => {
    const device = devices.find((candidate) => candidate.id === "apple-iphone-se-2018");
    const asset = device?.mockupAssets[0];
    const profile = getFrameProfile(device!);

    expect(device).toMatchObject({
      name: "Apple iPhone SE (1st generation)",
      cssViewport: { width: 320, height: 568 },
      pixelRatio: 2,
      manufacturerResolution: { width: 640, height: 1136 },
    });
    expect(asset).toMatchObject({
      localPath: "/mockups/apple-iphone-se.webp",
      viewport: {
        portrait: { cornerRadius: 0 },
        landscape: { cornerRadius: 0 },
      },
    });
    expect(profile).toMatchObject({ kind: "iphone-classic", safeAreaInsetTop: 20 });
    expect(getBrowserGeometry(device!, device!.cssViewport).status).toBe(20);
  });

  it("renders iPhone 5 with its pre-notch status bar and classic Safari chrome", () => {
    const device = devices.find((candidate) => candidate.id === "apple-iphone-5")!;
    const asset = device.mockupAssets[0];
    const profile = getFrameProfile(device);

    expect(device).toMatchObject({
      name: "Apple iPhone 5",
      cssViewport: { width: 320, height: 568 },
      pixelRatio: 2,
    });
    expect(asset.viewport).toMatchObject({
      portrait: { cornerRadius: 0 },
      landscape: { cornerRadius: 0 },
    });
    expect(profile).toMatchObject({
      kind: "iphone-classic",
      chromeVariant: "ios-classic",
      safeAreaInsetTop: 20,
    });
    expect(getBrowserGeometry(device!, device!.cssViewport).status).toBe(20);
  });

  it.each([
    "apple-iphone-11",
    "apple-iphone-11-pro",
    "apple-iphone-11-pro-max",
  ])("uses the measured notch-era top bar without an extra border for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);

    expect(profile).toMatchObject({ kind: "iphone-notch", safeAreaInsetTop: 44 });
    expect(getBrowserGeometry(device, device.cssViewport).status).toBe(44);
  });

  it.each([
    ["samsung-galaxy-s26-2026", "Samsung Galaxy S26", 360, 780, "/mockups/samsung-galaxy-s26-2026.webp"],
    ["samsung-galaxy-z-fold7-unfolded-2025", "Samsung Galaxy Z Fold7 (unfolded)", 787, 874, "/mockups/samsung-galaxy-z-fold7-unfolded-2025.webp"],
    ["google-pixel-10-pro-xl-2025", "Google Pixel 10 Pro XL", 448, 997, "/mockups/google-pixel-10-pro-xl-2025.webp"],
    ["modern-laptop-15", "Modern Laptop 15 inch", 1440, 900, "/mockups/modern-laptop-15.webp"],
  ])("includes calibrated current mockup %s", (id, name, width, height, localPath) => {
    const device = devices.find((candidate) => candidate.id === id);

    expect(device).toMatchObject({ name, cssViewport: { width, height } });
    expect(device?.mockupAssets[0]).toMatchObject({
      localPath,
      viewport: { portrait: expect.objectContaining({ width: expect.any(Number) }), landscape: expect.objectContaining({ width: expect.any(Number) }) },
    });
  });

  it("keeps every image-backed device calibrated", () => {
    const imageBacked = devices.flatMap((device) => device.mockupAssets.map((asset) => ({ device, asset })));

    expect(imageBacked.length).toBeGreaterThan(80);
    for (const { device, asset } of imageBacked) {
      expect(asset.viewport?.portrait, `${device.id} is missing portrait viewport geometry`).toBeDefined();
      expect(asset.viewport?.landscape, `${device.id} is missing landscape viewport geometry`).toBeDefined();
    }
  });

  it("keeps the Modern Laptop webcam outside the live display", () => {
    const device = devices.find(d => d.id === "modern-laptop-15")!;
    const screen = device.mockupAssets[0].viewport!.landscape!;
    expectPhotoFit(screen, device.cssViewport);
    expect(screen.enableRotation).toBe(false);
    expect(screen.top).toBeGreaterThan(20);
    expect(screen.occlusions).toBeUndefined();
    expect(supportsOrientation(device)).toBe(false);
  });

  it.each([
    ["apple-iphone-air-2025", 420, 912, 1260, 2736],
    ["apple-iphone-16-plus-2024", 430, 932, 1290, 2796],
  ])("keeps Dynamic Island screen geometry edge-to-edge for %s", (id, width, height, panelWidth, panelHeight) => {
    const device = devices.find((candidate) => candidate.id === id);
    const asset = device?.mockupAssets[0];

    expect(device).toMatchObject({
      cssViewport: { width, height },
      pixelRatio: 3,
      manufacturerResolution: { width: panelWidth, height: panelHeight },
    });
    expect(getFrameProfile(device!).kind).toBe("iphone-dynamic-island");
    expect(asset?.viewport?.portrait?.paths?.portrait ?? asset?.viewport?.portrait?.cornerRadius).toBeDefined();
    expect(asset?.viewport?.landscape?.paths?.landscape ?? asset?.viewport?.landscape?.cornerRadius).toBeDefined();
  });

  it.each([
    "apple-iphone-17-pro-2025",
    "apple-iphone-air-2025",
    "apple-iphone-16-plus-2024",
  ])("keeps the exact Dynamic Island safe area for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);
    expect(profile).toMatchObject({ kind: "iphone-dynamic-island", safeAreaInsetTop: 59 });
    expect(getBrowserGeometry(device, device.cssViewport).status).toBe(59);
  });

  it.each([
    "apple-iphone-17e-2026",
    "apple-iphone-17-2025",
    "apple-iphone-17-pro-2025",
    "apple-iphone-17-pro-max-2025",
    "apple-iphone-air-2025",
  ])("keeps page content below the iPhone status bar for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);
    expect(profile.platform).toBe("ios");
    expect(getBrowserGeometry(device, device.cssViewport).top).toBeGreaterThanOrEqual(profile.safeAreaInsetTop);
  });

  it.each([
    "apple-iphone-17e-2026",
    "apple-iphone-17-2025",
    "apple-iphone-17-pro-2025",
    "apple-iphone-17-pro-max-2025",
    "apple-iphone-air-2025",
  ])("uses iOS 26 Liquid Glass Safari chrome for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);

    expect(profile).toMatchObject({
      platform: "ios",
      osMajor: 26,
      chromeVariant: "ios-liquid-glass",
      safeAreaInsetBottom: 34,
      imageChrome: { showSafariBar: true },
    });
  });

  it.each([
    "samsung-galaxy-s26-2026",
    "samsung-galaxy-z-fold7-unfolded-2025",
    "google-pixel-10-pro-xl-2025",
    "modern-laptop-15",
    "apple-iphone-16e-2025",
    "apple-ipad-pro-13-m4-2024",
    "samsung-galaxy-z-flip7-2025",
    "samsung-galaxy-tab-s11-ultra-2025",
    "samsung-galaxy-xcover7-pro-2025",
    "motorola-edge-60-pro-2025",
    "zebra-tc58-2022",
    "panasonic-toughbook-s1-2021",
    "apple-iphone-17e-2026",
    "google-pixel-10a-2026",
    "samsung-galaxy-s26-plus-2026",
    "apple-macbook-neo-13-2026",
    "microsoft-surface-laptop-8-13-8-2026",
    "apple-studio-display-xdr-27-2026",
  ])("keeps the calibrated screen for %s inside its rendered frame", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const asset = device.mockupAssets[0];
    const renderScale = asset.renderScale ?? 0.5;
    const frameWidth = asset.width! * renderScale;
    const frameHeight = asset.height! * renderScale;
    const portrait = asset.viewport!.portrait!;

    expect(portrait.left).toBeGreaterThanOrEqual(0);
    expect(portrait.top).toBeGreaterThanOrEqual(0);
    // A fixed wide fold keeps its upright frame under both keys.
    const portraitRotates = (device.type === "phone" || device.type === "tablet") && frameWidth > frameHeight && portrait.enableRotation !== false;
    expect(portrait.left + portrait.width).toBeLessThanOrEqual(portraitRotates ? frameHeight : frameWidth);
    expect(portrait.top + portrait.height).toBeLessThanOrEqual(portraitRotates ? frameWidth : frameHeight);

    for (const occlusion of portrait.occlusions ?? []) {
      expect(occlusion.left).toBeGreaterThanOrEqual(0);
      expect(occlusion.top).toBeGreaterThanOrEqual(0);
      expect(occlusion.left + occlusion.width).toBeLessThanOrEqual(portrait.width);
      expect(occlusion.top + occlusion.height).toBeLessThanOrEqual(portrait.height);
    }

    const landscape = asset.viewport!.landscape;
    if (!landscape) return;
    const rotates = (device.type === "phone" || device.type === "tablet") && frameWidth < frameHeight && landscape.enableRotation !== false;
    expect(landscape.left + landscape.width).toBeLessThanOrEqual(rotates ? frameHeight : frameWidth);
    expect(landscape.top + landscape.height).toBeLessThanOrEqual(rotates ? frameWidth : frameHeight);
  });

  it.each([
    "apple-iphone-17e-2026",
    "google-pixel-10a-2026",
    "samsung-galaxy-s26-plus-2026",
    "apple-macbook-neo-13-2026",
    "microsoft-surface-laptop-8-13-8-2026",
    "apple-studio-display-xdr-27-2026",
  ])("keeps the generated screen inside its frame for %s", (id) => {
    const asset = devices.find((candidate) => candidate.id === id)!.mockupAssets[0];
    const frameWidth = asset.width! * asset.renderScale!;
    const frameHeight = asset.height! * asset.renderScale!;
    const native = frameWidth > frameHeight ? "landscape" : "portrait";
    const viewport = asset.viewport![native]!;

    expect(viewport.left).toBeGreaterThan(0);
    expect(viewport.top).toBeGreaterThan(0);
    expect(viewport.left + viewport.width).toBeLessThan(frameWidth);
    expect(viewport.top + viewport.height).toBeLessThan(frameHeight);
  });

  it("keeps the iPhone 17e page below its notch", () => {
    const device = devices.find(d => d.id === "apple-iphone-17e-2026")!;
    const screen = device.mockupAssets[0].viewport!.portrait!;
    expectPhotoFit(screen, device.cssViewport);
    expect(screen.occlusions![0].top + screen.occlusions![0].height).toBeLessThanOrEqual(getFrameProfile(device).safeAreaInsetTop);
  });

  it("keeps the google-pixel-10a-2026 camera centered and rotated with its screen", () => {
    const device = devices.find(d => d.id === "google-pixel-10a-2026")!;
    const asset = device.mockupAssets[0];
    const portrait = asset.viewport!.portrait!, landscape = asset.viewport!.landscape!;
    const camera = portrait.occlusions![0], rotated = landscape.occlusions![0];
    expectPhotoFit(portrait, device.cssViewport);
    expect(Math.abs(camera.left + camera.width / 2 - portrait.width / 2)).toBeLessThan(2);
    expect(rotated.left).toBeCloseTo(portrait.height - camera.top - camera.height);
    expect(rotated.top).toBe(camera.left);
    expect(rotated.width).toBe(camera.height);
    expect(rotated.height).toBe(camera.width);
  });

  it("fits the Surface Laptop content without stretching", () => {
    const device = devices.find(d => d.id === "microsoft-surface-laptop-8-13-8-2026")!;
    const screen = device.mockupAssets[0].viewport!.landscape!;
    expectPhotoFit(screen, device.cssViewport);
    expect(screen.enableRotation).toBe(false);
    expect(screen.occlusions).toBeUndefined();
  });

  it.each([
    ["apple-iphone-16-pro-2024", "Apple iPhone 16 Pro", "phone", 402, 874],
    ["apple-iphone-16e-2025", "Apple iPhone 16e", "phone", 390, 844],
    ["apple-ipad-pro-13-m4-2024", "Apple iPad Pro 13-inch (M4)", "tablet", 1032, 1376],
    ["apple-ipad-air-13-m4-2026", "Apple iPad Air 13-inch (M4)", "tablet", 1024, 1366],
    ["apple-ipad-mini-a17-pro-2024", "Apple iPad mini (A17 Pro)", "tablet", 744, 1133],
    ["apple-macbook-pro-14-m5-2025", "Apple MacBook Pro 14-inch (M5)", "laptop", 1512, 982],
    ["samsung-galaxy-z-flip7-2025", "Samsung Galaxy Z Flip7", "phone", 360, 840],
    ["samsung-galaxy-tab-s11-ultra-2025", "Samsung Galaxy Tab S11 Ultra", "tablet", 924, 1480],
    ["samsung-galaxy-xcover7-pro-2025", "Samsung Galaxy XCover7 Pro", "phone", 360, 803],
    ["motorola-edge-60-pro-2025", "Motorola Edge 60 Pro", "phone", 407, 904],
    ["zebra-tc58-2022", "Zebra TC58", "phone", 412, 823],
    ["panasonic-toughbook-s1-2021", "Panasonic Toughbook S1", "tablet", 533, 853],
  ])("includes expanded device %s", (id, name, type, width, height) => {
    const device = devices.find((candidate) => candidate.id === id);

    expect(device).toMatchObject({ name, type, cssViewport: { width, height } });
    expect(device?.mockupAssets[0]?.localPath).toMatch(/^\/mockups\/.+\.(webp|svg)$/);
  });

  it.each([
    ["google-pixel-10-pro-xl-2025", 448, 997, 3, 1344, 2992],
    ["motorola-edge-60-pro-2025", 407, 904, 3, 1220, 2712],
    ["samsung-galaxy-xcover7-pro-2025", 360, 803, 3, 1080, 2408],
    ["samsung-galaxy-z-flip7-2025", 360, 840, 3, 1080, 2520],
    ["samsung-galaxy-z-fold7-unfolded-2025", 787, 874, 2.5, 1968, 2184],
    ["oneplus-nord-2", 412, 915, 2.625, 1080, 2400],
    ["apple-macbook-pro-14-m5-2025", 1512, 982, 2, 3024, 1964],
    ["modern-laptop-15", 1440, 900, 1, 1440, 900],
    ["apple-iphone-16e-2025", 390, 844, 3, 1170, 2532],
    ["apple-iphone-16-pro-2024", 402, 874, 3, 1206, 2622],
  ])("keeps the verified display report for %s", (id, cssWidth, cssHeight, pixelRatio, panelWidth, panelHeight) => {
    expect(devices.find((device) => device.id === id)).toMatchObject({
      cssViewport: { width: cssWidth, height: cssHeight },
      pixelRatio,
      manufacturerResolution: { width: panelWidth, height: panelHeight },
    });
  });

  it("marks enterprise and foldable hardware for discovery", () => {
    expect(devices.find((device) => device.id === "zebra-tc58-2022")?.tags).toContain("rugged");
    expect(devices.find((device) => device.id === "panasonic-toughbook-s1-2021")?.tags).toContain("rugged");
    expect(devices.find((device) => device.id === "samsung-galaxy-z-flip7-2025")?.tags).toContain("foldable");
    expect(devices.find((device) => device.id === "motorola-razr-70-ultra-2026")?.tags).toContain("foldable");
  });

  it("fits native-landscape foldables and rotated phones in their outer boxes", () => {
    for (const id of ["samsung-galaxy-z-fold8-unfolded-2026", "samsung-galaxy-s26-2026"]) {
      const device = devices.find(d => d.id === id)!;
      const asset = device.mockupAssets[0];
      const scale = asset.renderScale!;
      const expected = asset.width! > asset.height!
        ? { width: asset.width! * scale, height: asset.height! * scale }
        : { width: asset.height! * scale, height: asset.width! * scale };
      expect(estimateDeviceFrameSize({ device, showFrame: true, showStatusBar: true, showUrlBar: true,
        viewportSize: { width: Math.max(device.cssViewport.width, device.cssViewport.height), height: Math.min(device.cssViewport.width, device.cssViewport.height) },
      })).toEqual(expected);
    }
  });

  it("does not show duplicate normalized models", () => {
    const keys = devices.map((device) => `${device.name.toLowerCase()}|${device.year ?? ""}|${device.type}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("suppresses renamed devices that render the same shell and viewport", () => {
    expect(devices.filter((device) => device.type === "watch").map((device) => device.id)).toEqual([
      "apple-watch-series-12-46mm",
      "apple-watch-series-12-42mm",
      "apple-watch-ultra-4",
    ]);
    for (const duplicateId of [
      "apple-watch-series-6-40",
      "apple-macbook-air-13-m4-2025",
      "motorola-razr-60-ultra-2025",
      "motorola-thinkphone-25-2024",
      "honeywell-ct47-2023",
      "microsoft-surface-laptop-7-2024",
      "dell-xps-13-9350-2024",
    ]) {
      expect(devices.some((device) => device.id === duplicateId), duplicateId).toBe(false);
    }
  });

  it("opens retired presets as their replacement", () => {
    expect(currentDeviceId("apple-watch-series-6-40")).toBe("apple-watch-series-12-42mm");
    expect(devices.some((device) => device.id === currentDeviceId("apple-watch-series-6-40"))).toBe(true);
    expect(currentDeviceId("apple-iphone-18-pro-2026")).toBe("apple-iphone-18-pro-2026");
    for (const retired of ["motorola-razr-60-ultra-2025", "apple-macbook-air-13-m4-2025", "microsoft-surface-laptop-7-2024"]) {
      expect(devices.some((device) => device.id === currentDeviceId(retired)), retired).toBe(true);
    }
  });

  it("keeps every image-backed render signature unique", () => {
    const distinctSameShellDeviceIds = new Set(["apple-iphone-16e-2025", "apple-iphone-16-pro-2024", "apple-iphone-17-pro-2025", "apple-ipad-mini-6", "apple-ipad-mini-a17-pro-2024"]);
    const signatures = devices.flatMap((device) => device.mockupAssets
      .filter((asset) => asset.localPath)
      .map((asset) => [
        device.type,
        asset.localPath,
        `${asset.width ?? 0}x${asset.height ?? 0}`,
        `${device.cssViewport.width}x${device.cssViewport.height}`,
        Object.keys(asset.viewport ?? {}).sort().join(","),
        distinctSameShellDeviceIds.has(device.id) ? device.id : "",
      ].join("|")));

    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("uses a dedicated notch frame for iPhone 16e", () => {
    const device = devices.find(d => d.id === "apple-iphone-16e-2025")!;
    const asset = device.mockupAssets[0];
    expect(asset.localPath).toBe("/mockups/apple-iphone-16e-2025.webp");
    expectPhotoFit(asset.viewport!.portrait!, device.cssViewport);
    expect(asset.viewport?.portrait?.occlusions?.[0]).toMatchObject({ kind: "rounded-rect", top: 0 });
  });

  it("uses a dedicated proportional frame for Pixel 10 Pro XL", () => {
    const device = devices.find(d => d.id === "google-pixel-10-pro-xl-2025")!;
    const pro = devices.find(d => d.id === "google-pixel-10-pro-2026")!;
    expect(device.mockupAssets[0].localPath).not.toBe(pro.mockupAssets[0].localPath);
    expectPhotoFit(device.mockupAssets[0].viewport!.portrait!, { width: 448, height: 997 });
  });

  it("uses model-specific frames and unobstructed chrome for expanded devices", () => {
    for (const id of ["motorola-edge-60-pro-2025", "samsung-galaxy-xcover7-pro-2025", "samsung-galaxy-z-flip7-2025", "oneplus-nord-2", "apple-macbook-pro-14-m5-2025"]) {
      const device = devices.find(d => d.id === id)!;
      expect(device.mockupAssets[0].localPath).toBe(assetPath(id));
      expectPhotoFit(device.mockupAssets[0].viewport!.portrait!, device.cssViewport);
    }
    expect(getFrameProfile(devices.find(d => d.id === "oneplus-nord-2")!).statusBarInsetLeft).toBe(30);
  });

  it.each([
    ["google-pixel-10-pro-xl-2025", 162.8 / 76.6],
    ["motorola-edge-60-pro-2025", 160.69 / 73.06],
    ["samsung-galaxy-xcover7-pro-2025", 168.6 / 79.9],
    ["samsung-galaxy-z-flip7-2025", 166.7 / 75.2],
    ["oneplus-nord-2", 158.9 / 73.2],
    ["apple-iphone-16e-2025", 146.7 / 71.5],
    ["apple-iphone-16-pro-2024", 149.6 / 71.5],
  ])("keeps the %s shell proportion close to its physical body", (id, physicalRatio) => {
    const asset = devices.find((device) => device.id === id)!.mockupAssets[0];
    const assetRatio = Math.max(asset.width!, asset.height!) / Math.min(asset.width!, asset.height!);

    expect(Math.abs(assetRatio - physicalRatio)).toBeLessThan(0.06);
  });

  it("normalizes legacy and model-suffix names", () => {
    expect(devices.find((device) => device.id === "apple-iphone-se-2018")).toMatchObject({
      name: "Apple iPhone SE (1st generation)",
      year: 2016,
    });
    expect(devices.find((device) => device.id === "apple-iphone-14-max-2022")?.name).not.toContain("MAX");
    expect(devices.find((device) => device.id === "zebra-mc330")?.name).toBe("Zebra MC330");
    expect(devices.find((device) => device.id === "zebra-tc78")?.name).toBe("Zebra TC78");
    expect(devices.find((device) => device.id === "samsung-galaxy-z-flip3-2021")?.name).toBe("Samsung Galaxy Z Flip3");
    expect(devices.find((device) => device.id === "samsung-galaxy-note20-ultra")?.name).toBe("Samsung Galaxy Note20 Ultra");
    expect(devices.find((device) => device.id === "google-pixel-10-2026")?.year).toBe(2025);
  });
});
