import type { MockupAsset, MockupViewportConfig, Orientation, Size } from "./device.types";

/** One generated frame: the image is /mockups/<id>.webp, drawn at renderScale. */
export interface LocalMockupAsset {
  id: string;
  width: number;
  height: number;
  renderScale: number;
  viewport: Partial<Record<Orientation, MockupViewportConfig>>;
  cssViewport: Size;
}

import { deviceArtFrames } from "./device-art-frames";

// Every frame is an export of the private device drawings; the
// screen geometry comes from the same drawing, so pages line up exactly.
export const localMockupCatalog: LocalMockupAsset[] = deviceArtFrames;

const aliases: Record<string, string> = {
  "apple-iphone-14": "apple-iphone-14-2022",
  "apple-iphone-15": "apple-iphone-15-2023",
  "apple-iphone-13-mini": "apple-iphone-13-mini-2021",
  "apple-iphone-se-2018": "apple-iphone-se",
  "samsung-galaxy-s24": "samsung-galaxy-s24-2024",
  "samsung-galaxy-s24-ultra": "samsung-galaxy-s24-ultra-2024",
  "google-pixel-8": "google-pixel-8-2024",
  "samsung-galaxy-z-fold-2": "samsung-galaxy-fold2",
  "macbook-pro-16-2021": "apple-macbook-pro-16-2021",
  "macbook-air-2020-13": "macbook-air",
  "imac-24-2021": "apple-imac-24-inch-2021",
  "samsung-neo-qled-4k-55": "samsung-smart-tv"
};

export function resolveMockupId(deviceId: string): string {
  return aliases[deviceId] ?? deviceId;
}

export function getMockupAssets(deviceId: string): MockupAsset[] {
  // Both modern iPad minis share one shell; OS metadata stays per device.
  const lookupId = deviceId === "apple-ipad-mini-6" ? "apple-ipad-mini-a17-pro-2024" : resolveMockupId(deviceId);
  const asset = localMockupCatalog.find((candidate) => candidate.id === lookupId);
  if (!asset) return [];
  return [{
    localPath: `/mockups/${asset.id}.webp`,
    width: asset.width,
    height: asset.height,
    renderScale: asset.renderScale,
    viewport: asset.viewport,
    cssViewport: asset.cssViewport,
  }];
}

// Auto-derived from device reference data. Drives OS chrome (status bar, browser bar, safe areas).
export interface DeviceChromeMeta {
  osVersion: string;
  /** iOS 26+ (Liquid Glass) devices report a bottom safe-area inset in px */
  safeAreaInsetBottom?: number;
  /**
   * Top safe-area inset (CSS px) reserved by the browser presentation.
   * Content must start below this so it never renders under the hole-punch / notch.
   * These remain presentation estimates; otherwise generation constants are used.
   */
  safeAreaInsetTop?: number;
  /** Additional left padding for status-bar clocks that would overlap an off-centre camera. */
  statusBarInsetLeft?: number;
  /** Additional right padding for status icons that would overlap an off-centre camera. */
  statusBarInsetRight?: number;
  devicePixelRatio?: number;
}

export function getDeviceChromeMeta(deviceId: string): DeviceChromeMeta | undefined {
  return deviceChromeMeta[resolveMockupId(deviceId)];
}

const deviceChromeMeta: Record<string, DeviceChromeMeta> = {
  // New-device safe areas are presentation estimates pending native Safari validation.
  "apple-iphone-18-pro-2026": { osVersion: "27.0", devicePixelRatio: 3 },
  "apple-iphone-18-pro-max-2026": { osVersion: "27.0", devicePixelRatio: 3 },
  "apple-iphone-duo-folded-2026": { osVersion: "27.0", devicePixelRatio: 3, safeAreaInsetTop: 64, statusBarInsetRight: 64 },
  "apple-iphone-duo-unfolded-2026": { osVersion: "27.0", devicePixelRatio: 3 },
  "apple-watch-series-12-46mm": { osVersion: "27.0", devicePixelRatio: 2 },
  "apple-watch-series-12-42mm": { osVersion: "27.0", devicePixelRatio: 2 },
  "apple-watch-ultra-4": { osVersion: "27.0", devicePixelRatio: 2 },
  "samsung-galaxy-s20": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "xiaomi-mi-11i": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 33 },
  "huawei-p30-pro": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 28 },
  "google-pixel-5": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 49 },
  "oneplus-nord-2": { osVersion: "16.0", devicePixelRatio: 2.625, safeAreaInsetTop: 50, statusBarInsetLeft: 30 },
  "samsung-galaxy-fold2": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "apple-iphone-5": { osVersion: "14.0", devicePixelRatio: 2 },
  "apple-iphone-se": { osVersion: "14.0", devicePixelRatio: 2 },
  "apple-iphone-x": { osVersion: "14.0", devicePixelRatio: 3 },
  "apple-iphone-xr": { osVersion: "14.0", devicePixelRatio: 2 },
  "apple-ipad-mini-6": { osVersion: "14.0", devicePixelRatio: 2 },
  "apple-ipad-air-4": { osVersion: "14.0", devicePixelRatio: 2 },
  "apple-ipad-pro-11-2018": { osVersion: "14.0", devicePixelRatio: 2 },
  "samsung-galaxy-tab-s7": { osVersion: "14.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "macbook-air": { osVersion: "11.0", devicePixelRatio: 2 },
  "dell-latitude-14-3420": { osVersion: "11.0", devicePixelRatio: 1 },
  "apple-iphone-11": { osVersion: "14.0", devicePixelRatio: 2, safeAreaInsetTop: 44 },
  "apple-iphone-11-pro": { osVersion: "14.0", devicePixelRatio: 3, safeAreaInsetTop: 44 },
  "apple-iphone-11-pro-max": { osVersion: "14.0", devicePixelRatio: 3, safeAreaInsetTop: 44 },
  "apple-iphone-12-mini": { osVersion: "14.0", devicePixelRatio: 3 },
  "apple-iphone-12": { osVersion: "14.0", devicePixelRatio: 3 },
  "apple-iphone-12-pro": { osVersion: "14.0", devicePixelRatio: 3 },
  "apple-iphone-12-pro-max": { osVersion: "14.0", devicePixelRatio: 3 },
  "apple-iphone-13-mini-2021": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-13-2021": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-13-pro-2021": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-13-pro-max-2021": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-14-2022": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-14-max-2022": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-14-pro-2022": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-14-pro-max-2022": { osVersion: "16.0", devicePixelRatio: 3 },
  "apple-iphone-15-2023": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-15-plus-2023": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-15-pro-2023": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-15-pro-max-2023": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-16-2024": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-16-plus-2024": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-16-pro-max-2024": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-17-2025": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-air-2025": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-17-pro-2025": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-17-pro-max-2025": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-macbook-pro-16-2021": { osVersion: "15.3", devicePixelRatio: 2 },
  "samsung-galaxy-z-flip3-2021": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "oppo-find-x3-pro": { osVersion: "16.0", devicePixelRatio: 4, safeAreaInsetTop: 39, statusBarInsetLeft: 40 },
  "microsoft-surface-duo": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "samsung-galaxy-a12-2021": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "samsung-galaxy-s21-ultra": { osVersion: "16.0", devicePixelRatio: 4, safeAreaInsetTop: 33 },
  "google-pixel-6-pro": { osVersion: "16.0", devicePixelRatio: 4, safeAreaInsetTop: 36 },
  "xiaomi-12-2022": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "samsung-galaxy-note20-ultra": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 35 },
  "samsung-galaxy-s22-2022": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 32 },
  "samsung-galaxy-s22-plus-2022": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 32 },
  "samsung-galaxy-s22-ultra-2022": { osVersion: "16.0", devicePixelRatio: 4, safeAreaInsetTop: 38 },
  "google-pixel-8-2024": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 45 },
  "samsung-galaxy-s24-2024": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 35 },
  "samsung-galaxy-s24-ultra-2024": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 34 },
  "samsung-galaxy-s26-ultra-2026": { osVersion: "16.0", devicePixelRatio: 4, safeAreaInsetTop: 42 },
  "google-pixel-10-2026": { osVersion: "16.0", devicePixelRatio: 2.625, safeAreaInsetTop: 54 },
  "google-pixel-10-pro-2026": { osVersion: "16.0", devicePixelRatio: 3.125, safeAreaInsetTop: 50 },
  "google-pixel-10-pro-fold-2026": { osVersion: "16.0", devicePixelRatio: 2.625, safeAreaInsetTop: 48 },
  "google-pixel-11-2026": { osVersion: "17.0", devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-2026": { osVersion: "17.0", devicePixelRatio: 3.125, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-xl-2026": { osVersion: "17.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-fold-2026": { osVersion: "17.0", devicePixelRatio: 2.625, safeAreaInsetTop: 28, statusBarInsetRight: 44 },
  "samsung-galaxy-a17-2025": { osVersion: "16.0", devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "motorola-razr-70-ultra-2026": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 40 },
  "infinix-hot-70-2026": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 36 },
  "samsung-galaxy-s26-2026": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "samsung-galaxy-z-fold7-unfolded-2025": { osVersion: "16.0", devicePixelRatio: 2.5, safeAreaInsetTop: 28 },
  "google-pixel-10-pro-xl-2025": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "modern-laptop-15": { osVersion: "11.0", devicePixelRatio: 1 },
  "apple-imac-24-inch-2021": { osVersion: "15.3", devicePixelRatio: 2 },
  "samsung-smart-tv": { osVersion: "12.0", devicePixelRatio: 1, safeAreaInsetTop: 28 },
  "self-service-kiosk": { osVersion: "16.0", devicePixelRatio: 1, safeAreaInsetTop: 28 },
  "zebra-mc330": { osVersion: "10.0", devicePixelRatio: 1, safeAreaInsetTop: 28 },
  "zebra-tc78": { osVersion: "13.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "sonoff-nspanel-pro": { osVersion: "8.1.0", devicePixelRatio: 1, safeAreaInsetTop: 28 },
  "non-branded-android-smartphone": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 28 },
  "apple-iphone-16-pro-2024": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-16e-2025": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-17e-2026": { osVersion: "26.0", safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-ipad-pro-13-m4-2024": { osVersion: "26.0", devicePixelRatio: 2 },
  "apple-ipad-air-13-m4-2026": { osVersion: "26.0", devicePixelRatio: 2 },
  "apple-ipad-mini-a17-pro-2024": { osVersion: "26.0", devicePixelRatio: 2 },
  "apple-macbook-pro-14-m5-2025": { osVersion: "26.0", devicePixelRatio: 2 },
  "samsung-galaxy-s26-plus-2026": { osVersion: "16.0", devicePixelRatio: 3.75, safeAreaInsetTop: 36 },
  "samsung-galaxy-z-flip7-2025": { osVersion: "16.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "samsung-galaxy-tab-s11-ultra-2025": { osVersion: "16.0", devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "samsung-galaxy-xcover7-pro-2025": { osVersion: "15.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "google-pixel-10a-2026": { osVersion: "16.0", devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "motorola-edge-60-pro-2025": { osVersion: "15.0", devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "zebra-tc58-2022": { osVersion: "13.0", devicePixelRatio: 2.625, safeAreaInsetTop: 28 },
  "panasonic-toughbook-s1-2021": { osVersion: "11.0", devicePixelRatio: 1.5, safeAreaInsetTop: 28 },
  "apple-macbook-neo-13-2026": { osVersion: "26.0", devicePixelRatio: 2 },
  "microsoft-surface-laptop-8-13-8-2026": { osVersion: "11.0", devicePixelRatio: 2 },
  "apple-studio-display-xdr-27-2026": { osVersion: "26.0", devicePixelRatio: 2 },
};
