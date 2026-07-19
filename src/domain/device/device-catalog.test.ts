import { describe, expect, it } from "vitest";
import {
  estimateDeviceFrameSize,
  getMobileContentTop,
  getStatusHeight,
} from "../../ui/components/DeviceFrame";
import { devices } from "./device-catalog";
import { supportsOrientation } from "./device-service";
import { getFrameProfile } from "./frame-profiles";

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
      localPath: "/mockups/apple-iphone-se.png",
      viewport: {
        portrait: { left: 26, top: 93, width: 320, height: 568 },
        landscape: { left: 93, top: 26, width: 568, height: 320 },
      },
    });
    expect(profile).toMatchObject({ kind: "iphone-classic", safeAreaInsetTop: 20 });
    expect(getStatusHeight(profile.platform, profile.kind, true)).toBe(20);
    expect(getMobileContentTop(profile.safeAreaInsetTop, 0)).toBe(20);
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
      portrait: { left: 32, top: 116, width: 320, height: 568 },
      landscape: { left: 116, top: 32, width: 568, height: 320 },
    });
    expect(profile).toMatchObject({
      kind: "iphone-classic",
      chromeVariant: "ios-classic",
      safeAreaInsetTop: 20,
    });
    expect(getStatusHeight(profile.platform, profile.kind, true)).toBe(20);
    expect(getMobileContentTop(profile.safeAreaInsetTop, 0)).toBe(20);
  });

  it.each([
    "apple-iphone-11",
    "apple-iphone-11-pro",
    "apple-iphone-11-pro-max",
  ])("uses the measured notch-era top bar without an extra border for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);

    expect(profile).toMatchObject({ kind: "iphone-notch", safeAreaInsetTop: 44 });
    expect(getStatusHeight(profile.platform, profile.kind, false)).toBe(44);
    expect(getMobileContentTop(profile.safeAreaInsetTop, 0)).toBe(44);
  });

  it.each([
    ["samsung-galaxy-s26-2026", "Samsung Galaxy S26", 360, 780, "/mockups/samsung-galaxy-s26.png"],
    ["samsung-galaxy-z-fold7-unfolded-2025", "Samsung Galaxy Z Fold7 (unfolded)", 874, 787, "/mockups/samsung-galaxy-z-fold7-unfolded.png"],
    ["google-pixel-10-pro-xl-2025", "Google Pixel 10 Pro XL", 448, 997, "/mockups/google-pixel-10-pro-2026.png"],
    ["modern-laptop-15", "Modern Laptop 15 inch", 1440, 900, "/mockups/modern-laptop-15.png"],
  ])("includes calibrated current mockup %s", (id, name, width, height, localPath) => {
    const device = devices.find((candidate) => candidate.id === id);

    expect(device).toMatchObject({ name, cssViewport: { width, height } });
    expect(device?.mockupAssets[0]).toMatchObject({
      localPath,
      screenInset: {
        top: expect.any(Number),
        right: expect.any(Number),
        bottom: expect.any(Number),
        left: expect.any(Number),
      },
    });
  });

  it("keeps every image-backed device calibrated", () => {
    const imageBacked = devices.flatMap((device) => device.mockupAssets.map((asset) => ({ device, asset })));

    expect(imageBacked.length).toBeGreaterThan(80);
    for (const { device, asset } of imageBacked) {
      expect(asset.screenInset, `${device.id} is missing screen insets`).toBeDefined();
      expect(asset.viewport?.portrait, `${device.id} is missing portrait viewport geometry`).toBeDefined();
    }
  });

  it("keeps the Modern Laptop display below its webcam bezel in landscape orientation", () => {
    const device = devices.find((candidate) => candidate.id === "modern-laptop-15");

    expect(device).toBeDefined();
    expect(device?.mockupAssets[0]).toMatchObject({
      localPath: "/mockups/modern-laptop-15.png",
      screenInset: { top: 34, right: 120, bottom: 186, left: 148 },
      viewport: {
        portrait: {
          left: 148,
          top: 34,
          width: 1440,
          height: 900,
          enableRotation: false,
        },
      },
    });
    expect(device?.mockupAssets[0]?.viewport?.portrait?.occlusions).toBeUndefined();
    expect(supportsOrientation(device!)).toBe(false);
  });

  it.each([
    ["apple-iphone-air-2025", 420, 912, 1260, 2736],
    ["apple-iphone-16-plus-2024", 430, 932, 1290, 2796],
  ])("keeps Dynamic Island content edge-to-edge for %s", (id, width, height, panelWidth, panelHeight) => {
    const device = devices.find((candidate) => candidate.id === id);
    const asset = device?.mockupAssets[0];

    expect(device).toMatchObject({
      cssViewport: { width, height },
      pixelRatio: 3,
      manufacturerResolution: { width: panelWidth, height: panelHeight },
    });
    expect(getFrameProfile(device!).kind).toBe("iphone-dynamic-island");
    expect(asset?.viewport?.portrait?.paths?.portrait).toBeTruthy();
    expect(asset?.viewport?.landscape?.paths?.landscape).toBeTruthy();
  });

  it.each([
    "apple-iphone-17-pro-2025",
    "apple-iphone-air-2025",
    "apple-iphone-16-plus-2024",
  ])("reserves the exact Dynamic Island top bar for %s", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const profile = getFrameProfile(device);
    const statusHeight = Math.max(
      profile.safeAreaInsetTop,
      getStatusHeight(profile.platform, profile.kind, false),
    );

    expect(profile).toMatchObject({ kind: "iphone-dynamic-island", safeAreaInsetTop: 59 });
    expect(getMobileContentTop(statusHeight, 0)).toBe(59);
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
  ])("keeps the calibrated screen for %s inside its rendered frame", (id) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const asset = device.mockupAssets[0];
    const frameWidth = asset.width! / 2;
    const frameHeight = asset.height! / 2;
    const portrait = asset.viewport!.portrait!;

    expect(portrait.left).toBeGreaterThanOrEqual(0);
    expect(portrait.top).toBeGreaterThanOrEqual(0);
    expect(portrait.left + portrait.width).toBeLessThanOrEqual(frameWidth);
    expect(portrait.top + portrait.height).toBeLessThanOrEqual(frameHeight);

    for (const occlusion of portrait.occlusions ?? []) {
      expect(occlusion.left).toBeGreaterThanOrEqual(0);
      expect(occlusion.top).toBeGreaterThanOrEqual(0);
      expect(occlusion.left + occlusion.width).toBeLessThanOrEqual(portrait.width);
      expect(occlusion.top + occlusion.height).toBeLessThanOrEqual(portrait.height);
    }

    const landscape = asset.viewport!.landscape;
    if (!landscape) return;
    expect(landscape.left + landscape.width).toBeLessThanOrEqual(frameHeight);
    expect(landscape.top + landscape.height).toBeLessThanOrEqual(frameWidth);
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
    expect(device?.mockupAssets[0]?.localPath).toMatch(/^\/mockups\/.+\.png$/);
  });

  it.each([
    ["google-pixel-10-pro-xl-2025", 448, 997, 3, 1344, 2992],
    ["motorola-edge-60-pro-2025", 407, 904, 3, 1220, 2712],
    ["samsung-galaxy-xcover7-pro-2025", 360, 803, 3, 1080, 2408],
    ["samsung-galaxy-z-flip7-2025", 360, 840, 3, 1080, 2520],
    ["samsung-galaxy-z-fold7-unfolded-2025", 874, 787, 2.5, 2184, 1968],
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

  it("fits native-landscape foldable assets without rotating their outer box", () => {
    const fold = devices.find((device) => device.id === "samsung-galaxy-z-fold7-unfolded-2025")!;
    const phone = devices.find((device) => device.id === "samsung-galaxy-s26-2026")!;

    expect(estimateDeviceFrameSize({
      device: fold,
      showFrame: true,
      showStatusBar: true,
      showUrlBar: true,
      viewportSize: fold.cssViewport,
    })).toEqual({ width: 921, height: 843.5 });
    expect(estimateDeviceFrameSize({
      device: phone,
      showFrame: true,
      showStatusBar: true,
      showUrlBar: true,
      viewportSize: { width: phone.cssViewport.height, height: phone.cssViewport.width },
    })).toEqual({ width: 788.5, height: 373 });
  });

  it("does not show duplicate normalized models", () => {
    const keys = devices.map((device) => `${device.name.toLowerCase()}|${device.year ?? ""}|${device.type}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("suppresses renamed devices that render the same shell and viewport", () => {
    expect(devices.filter((device) => device.type === "watch").map((device) => device.id)).toEqual([
      "apple-watch-series-6-40",
    ]);
    for (const duplicateId of [
      "apple-watch-serie-6",
      "apple-macbook-air-13-m4-2025",
      "apple-iphone-17e-2026",
      "google-pixel-10a-2026",
      "samsung-galaxy-s26-plus-2026",
      "motorola-razr-60-ultra-2025",
      "motorola-thinkphone-25-2024",
      "honeywell-ct47-2023",
      "microsoft-surface-laptop-7-2024",
      "dell-xps-13-9350-2024",
    ]) {
      expect(devices.some((device) => device.id === duplicateId), duplicateId).toBe(false);
    }
  });

  it("keeps every image-backed render signature unique", () => {
    const distinctSameShellDeviceIds = new Set(["apple-iphone-16e-2025"]);
    const signatures = devices.flatMap((device) => device.mockupAssets
      .filter((asset) => asset.kind === "transparent-png" && asset.localPath)
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

  it("uses the matching notch shell and screen geometry for iPhone 16e", () => {
    const device = devices.find((candidate) => candidate.id === "apple-iphone-16e-2025");
    const asset = device?.mockupAssets.find((candidate) => candidate.kind === "transparent-png");

    expect(asset).toMatchObject({
      localPath: "/mockups/apple-iphone-14-2022.png",
      width: 870,
      height: 1772,
      screenInset: { top: 7, right: 8.5, bottom: 9.5, left: 10.5 },
      viewport: {
        portrait: { left: 23, top: 20, width: 390, height: 844 },
        landscape: { left: 20, top: 23, width: 844, height: 390 },
      },
    });
    expect(asset?.viewport?.portrait?.paths?.portrait).toBeTruthy();
  });

  it("uses the proportional Pixel 10 Pro shell for Pixel 10 Pro XL", () => {
    const device = devices.find((candidate) => candidate.id === "google-pixel-10-pro-xl-2025");
    const asset = device?.mockupAssets.find((candidate) => candidate.kind === "transparent-png");

    expect(asset).toMatchObject({
      localPath: "/mockups/google-pixel-10-pro-2026.png",
      width: 900,
      height: 1894,
      screenInset: { top: 7, right: 4, bottom: 7.5, left: 7 },
      viewport: {
        portrait: { left: 18, top: 17, width: 410, height: 912 },
        landscape: { left: 17, top: 18, width: 912, height: 410 },
      },
    });
    expect(asset?.viewport?.portrait?.paths?.portrait).toBeTruthy();
  });

  it("uses calibrated shells and unobstructed chrome for the newly added devices", () => {
    const motorola = devices.find((device) => device.id === "motorola-edge-60-pro-2025")!;
    const xcover = devices.find((device) => device.id === "samsung-galaxy-xcover7-pro-2025")!;
    const flip = devices.find((device) => device.id === "samsung-galaxy-z-flip7-2025")!;
    const onePlus = devices.find((device) => device.id === "oneplus-nord-2")!;
    const macbook = devices.find((device) => device.id === "apple-macbook-pro-14-m5-2025")!;

    expect(motorola.mockupAssets[0]).toMatchObject({
      localPath: "/mockups/xiaomi-12-2022.png",
      width: 770,
      height: 1670,
      viewport: { portrait: { left: 11, top: 15, width: 360, height: 800 } },
    });
    expect(xcover.mockupAssets[0]).toMatchObject({
      localPath: "/mockups/samsung-galaxy-a12-2021.png",
      width: 794,
      height: 1718,
      viewport: { portrait: { left: 17, top: 20, width: 360, height: 800 } },
    });
    expect(flip.mockupAssets[0].viewport).toMatchObject({
      portrait: {
        left: 17,
        top: 24,
        width: 360,
        height: 840,
        occlusions: [{ kind: "circle", left: 174, top: 12, width: 12, height: 12 }],
      },
      landscape: {
        left: 28.5,
        top: 17,
        width: 840,
        height: 360,
        occlusions: [{ kind: "circle", left: 816, top: 174, width: 12, height: 12 }],
      },
    });
    expect(getFrameProfile(onePlus).statusBarInsetLeft).toBe(30);
    expect(macbook.mockupAssets[0]).toMatchObject({
      localPath: "/mockups/apple-macbook-pro-16-2021.png",
      viewport: { portrait: { left: 197, top: 65, width: 1728, height: 1085 } },
    });
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
