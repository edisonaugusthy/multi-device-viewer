import type { Device } from "./device.types";
import { getDeviceChromeMeta } from "./mockup-catalog";

export type FrameProfileKind =
  | "iphone-dynamic-island"
  | "iphone-notch"
  | "iphone-classic"
  | "android-modern"
  | "android-fold"
  | "tablet"
  | "watch"
  | "desktop";

/**
 * OS chrome generation. Determines how the browser bars / status bar look:
 * - "ios-liquid-glass": iOS 26+ — translucent floating Safari pill + bottom safe area (90px)
 * - "ios-modern": iOS 15–18 — solid Safari bottom bar + notch/island
 * - "ios-classic": iOS ≤14 with notch — legacy Safari bar
 * - "android-modern": Chrome top address bar + gesture nav pill
 * - "none": desktop / tv / watch / special
 */
export type ChromeVariant =
  | "ios-liquid-glass"
  | "ios-modern"
  | "ios-classic"
  | "android-modern"
  | "none";

export interface DeviceFrameProfile {
  kind: FrameProfileKind;
  platform: "ios" | "android" | "desktop" | "watch";
  radius: number;
  shellPadding: number;
  contentRadius: number;
  style: DeviceFrameStyle;
  imageChrome: ImageBackedChromeConfig;
  /** OS chrome generation used to select the correct browser/status bar look. */
  chromeVariant: ChromeVariant;
  /** Bottom safe-area inset in CSS px (iOS 26 Liquid Glass reports 90). */
  safeAreaInsetBottom: number;
  /**
   * Top safe-area inset in CSS px. This is the vertical space reserved for the
   * status bar + physical notch / Dynamic Island. Web content starts BELOW it,
   * so the page never renders under the camera cutout.
   */
  safeAreaInsetTop: number;
  /** OS major version parsed from reference data (e.g. 26, 16). */
  osMajor: number;
}

export interface DeviceFrameStyle {
  shellPadding?: number;
  innerPadding?: number;
  contentRadius?: number;
  cutoutTop?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  imageCutout?: ImageBackedCutoutStyle;
  imageStatusBarHeightRatio?: number;
  desktopChrome?: "safari" | "default";
  sideButtonColor?: string;
  shellGradient?: string;
}

export interface ImageBackedChromeConfig {
  showStatusBar: boolean;
  showAndroidTopBar: boolean;
  showBottomBar: boolean;
  showCutout: boolean;
  showTabletCamera: boolean;
  showSafariBar: boolean;
  showAndroidBottomBar: boolean;
  showHomeIndicator: boolean;
}

export interface ImageBackedCutoutStyle {
  topRatio: number;
  leftRatio?: number;
  widthRatio: number;
  heightRatio: number;
  minWidth?: number;
  minHeight?: number;
  lensTopRatio?: number;
  lensLeftRatio?: number;
  lensRightRatio?: number;
  lensSizeRatio?: number;
}

const defaultFrameStyles: Record<FrameProfileKind, DeviceFrameStyle> = {
  "iphone-dynamic-island": {
    shellPadding: 8,
    innerPadding: 7,
    contentRadius: 40,
    cutoutTop: 22,
    cutoutWidth: 118,
    cutoutHeight: 26,
    imageCutout: {
      topRatio: 0.014,
      widthRatio: 0.2,
      heightRatio: 0.041,
      minWidth: 72,
      minHeight: 32,
      lensRightRatio: 0.16,
      lensSizeRatio: 0.28
    },
    imageStatusBarHeightRatio: 0.07,
    sideButtonColor: "#a59672",
    shellGradient: "linear-gradient(135deg, #c8bc9a 0%, #111 52%, #f0e8d0 100%)"
  },
  "iphone-notch": {
    shellPadding: 9,
    innerPadding: 6,
    contentRadius: 35,
    cutoutTop: 15,
    cutoutWidth: 138,
    cutoutHeight: 25,
    sideButtonColor: "#8a7d60",
    shellGradient: "linear-gradient(135deg, #c8bc9a 0%, #111 52%, #f0e8d0 100%)"
  },
  "iphone-classic": {
    shellPadding: 12,
    innerPadding: 6,
    contentRadius: 18,
    cutoutTop: 12,
    cutoutWidth: 48,
    cutoutHeight: 4,
    sideButtonColor: "#8a7d60",
    shellGradient: "linear-gradient(135deg, #c8bc9a 0%, #111 52%, #f0e8d0 100%)"
  },
  "android-modern": {
    shellPadding: 9,
    innerPadding: 6,
    contentRadius: 34,
    cutoutTop: 12,
    cutoutWidth: 12,
    cutoutHeight: 12,
    sideButtonColor: "#2c333d",
    shellGradient: "linear-gradient(135deg, #313844 0%, #10141a 52%, #666e7a 100%)"
  },
  "android-fold": {
    shellPadding: 8,
    innerPadding: 6,
    contentRadius: 22,
    cutoutTop: 12,
    cutoutWidth: 12,
    cutoutHeight: 12,
    sideButtonColor: "#2c333d",
    shellGradient: "linear-gradient(135deg, #1e2228 0%, #0c0e12 52%, #3c424a 100%)"
  },
  tablet: {
    shellPadding: 12,
    innerPadding: 10,
    contentRadius: 26,
    shellGradient: "linear-gradient(135deg, #d0cdc6 0%, #111 52%, #e8e4d8 100%)"
  },
  watch: { shellPadding: 7, innerPadding: 0, contentRadius: 36 },
  desktop: { shellPadding: 10, innerPadding: 0, contentRadius: 10 }
};

const emptyImageChrome: ImageBackedChromeConfig = {
  showStatusBar: false,
  showAndroidTopBar: false,
  showBottomBar: false,
  showCutout: false,
  showTabletCamera: false,
  showSafariBar: false,
  showAndroidBottomBar: false,
  showHomeIndicator: false
};

export function getFrameProfile(device: Device): DeviceFrameProfile {
  if (device.type === "watch") {
    return createProfile(device, { kind: "watch", platform: "watch", radius: 44, shellPadding: 10, contentRadius: 32 });
  }

  if (device.type === "desktop" || device.type === "laptop" || device.type === "tv") {
    return createProfile(device, { kind: "desktop", platform: "desktop", radius: 18, shellPadding: 10, contentRadius: 10 });
  }

  if (device.type === "tablet") {
    return createProfile(device, {
      kind: "tablet",
      platform: isApple(device) ? "ios" : "android",
      radius: 38,
      shellPadding: 12,
      contentRadius: 26
    });
  }

  if (isAndroid(device)) {
    return createProfile(device, {
      kind: device.tags.includes("foldable") ? "android-fold" : "android-modern",
      platform: "android",
      radius: device.tags.includes("foldable") ? 28 : 42,
      shellPadding: device.tags.includes("foldable") ? 8 : 9,
      contentRadius: device.tags.includes("foldable") ? 22 : 34
    });
  }

  if (device.id.includes("se") || device.tags.includes("legacy")) {
    return createProfile(device, { kind: "iphone-classic", platform: "ios", radius: 32, shellPadding: 12, contentRadius: 18 });
  }

  if (hasDynamicIsland(device)) {
    return createProfile(device, { kind: "iphone-dynamic-island", platform: "ios", radius: 55, shellPadding: 10, contentRadius: 42 });
  }

  return createProfile(device, { kind: "iphone-notch", platform: "ios", radius: 48, shellPadding: 10, contentRadius: 36 });
}

function isApple(device: Device) {
  return device.brand.toLowerCase() === "apple" || /ios|ipados/i.test(device.os);
}

function isAndroid(device: Device) {
  return /android/i.test(device.os) || ["Samsung", "Google"].includes(device.brand);
}

function hasDynamicIsland(device: Device) {
  const id = device.id.toLowerCase();
  const name = device.name.toLowerCase();

  return (
    (device.year ?? 0) >= 2023 ||
    id.includes("iphone-air") ||
    id.includes("iphone-14-pro") ||
    name.includes("iphone 14 pro")
  );
}

function createProfile(device: Device, profile: Omit<DeviceFrameProfile, "style" | "imageChrome" | "chromeVariant" | "safeAreaInsetBottom" | "safeAreaInsetTop" | "osMajor">): DeviceFrameProfile {
  const desktopChrome: DeviceFrameStyle["desktopChrome"] =
    isApple(device) && (device.type === "laptop" || device.type === "desktop") ? "safari" : "default";
  const mockupFrameStyle = device.mockupAssets.find((asset) => asset.frameStyle)?.frameStyle;
  const style = {
    ...defaultFrameStyles[profile.kind],
    shellPadding: profile.shellPadding,
    contentRadius: profile.contentRadius,
    ...mockupFrameStyle,
    desktopChrome
  };

  const meta = getDeviceChromeMeta(device.id);
  const osMajor = parseOsMajor(meta?.osVersion ?? device.os);
  const safeAreaInsetBottom = meta?.safeAreaInsetBottom ?? 0;
  const chromeVariant = resolveChromeVariant(profile.platform, profile.kind, osMajor, safeAreaInsetBottom);
  const safeAreaInsetTop = resolveSafeAreaInsetTop(profile.platform, profile.kind, device.type, meta?.safeAreaInsetTop);

  return {
    ...profile,
    style,
    imageChrome: getImageBackedChromeConfig(device, profile),
    chromeVariant,
    safeAreaInsetBottom,
    safeAreaInsetTop,
    osMajor
  };
}

/**
 * Vertical space (CSS px) reserved at the top of the screen for the status bar plus
 * the physical notch / Dynamic Island. Content is pushed below this so it never sits
 * under the camera cutout. Values follow Apple's documented safe-area-inset-top.
 */
function resolveSafeAreaInsetTop(
  platform: DeviceFrameProfile["platform"],
  kind: FrameProfileKind,
  deviceType: Device["type"],
  measuredTop?: number
): number {
  if (platform === "android") {
    // Prefer the per-device value measured from the mockup's baked hole-punch cutout,
    // so content always clears the physical camera (which sits 24–50px down by device).
    if (measuredTop && measuredTop > 0) return measuredTop;
    return deviceType === "tablet" ? 28 : 32;
  }
  if (platform === "ios") {
    if (kind === "iphone-dynamic-island") return 59; // Dynamic Island generations
    if (kind === "iphone-notch") return 47;          // iPhone X–14 / XR notch
    if (kind === "iphone-classic") return 20;         // SE / legacy status bar
    if (kind === "tablet") return 24;                 // iPad status bar
  }
  return 0;
}

function parseOsMajor(version: string): number {
  const match = /(\d+)/.exec(version ?? "");
  return match ? Number(match[1]) : 0;
}

function resolveChromeVariant(
  platform: DeviceFrameProfile["platform"],
  kind: FrameProfileKind,
  osMajor: number,
  safeAreaInsetBottom: number
): ChromeVariant {
  if (platform === "android") return "android-modern";
  if (platform !== "ios") return "none";
  // iOS 26+ (or any device reporting the Liquid Glass bottom safe area) → Liquid Glass chrome.
  if (osMajor >= 26 || safeAreaInsetBottom >= 60) return "ios-liquid-glass";
  if (kind === "iphone-classic") return "ios-classic";
  return "ios-modern";
}

function getImageBackedChromeConfig(device: Device, profile: Pick<DeviceFrameProfile, "kind" | "platform">): ImageBackedChromeConfig {
  const isIos = profile.platform === "ios";
  const isAndroidDevice = profile.platform === "android";
  const isSpecial = device.tags.includes("special") || device.type === "custom" || device.type === "watch" || device.type === "tv";
  const isHandheldSpecial = device.brand === "Zebra" && device.id.includes("tc");
  if (isSpecial && !isHandheldSpecial) {
    return emptyImageChrome;
  }

  // The physical notch / Dynamic Island / hole-punch camera is baked into the device PNG.
  // We must NOT redraw our own cutout on top of an image-backed frame — doing so double-draws
  // the notch and, because it uses generic ratios, lands in the wrong spot on many devices.
  // (This was the root cause of the "sometimes correct, sometimes not" alignment bug.)
  return {
    showStatusBar: isIos || isAndroidDevice,
    showAndroidTopBar: isAndroidDevice,
    showBottomBar: isIos || isAndroidDevice,
    showCutout: false,
    showTabletCamera: false,
    showSafariBar: isIos,
    showAndroidBottomBar: isAndroidDevice,
    showHomeIndicator: isIos
  };
}
