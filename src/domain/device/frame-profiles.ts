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
 * - "ios-liquid-glass": iOS 26+ — translucent floating Safari pill + separate browser and hardware insets
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
  style: DeviceFrameStyle;
  imageChrome: ImageBackedChromeConfig;
  /** OS chrome generation used to select the correct browser/status bar look. */
  chromeVariant: ChromeVariant;
  /** Home-indicator safe area in CSS pixels; not the browser toolbar height. */
  safeAreaInsetBottom: number;
  /**
   * Top safe-area inset in CSS px. This is the vertical space reserved for the
   * status bar + physical notch / Dynamic Island. Web content starts BELOW it,
   * so the page never renders under the camera cutout.
   */
  safeAreaInsetTop: number;
  /** Extra left padding for image-backed status bars with an off-centre camera. */
  statusBarInsetLeft: number;
  /** Extra right padding for image-backed status bars with an off-centre camera. */
  statusBarInsetRight: number;
  /** OS major version parsed from reference data (e.g. 26, 16). */
  osMajor: number;
}

export interface DeviceFrameStyle {
  desktopChrome?: "safari" | "default";
}

export interface ImageBackedChromeConfig {
  showStatusBar: boolean;
  showAndroidTopBar: boolean;
  showSafariBar: boolean;
  showAndroidBottomBar: boolean;
}

const emptyImageChrome: ImageBackedChromeConfig = {
  showStatusBar: false,
  showAndroidTopBar: false,
  showSafariBar: false,
  showAndroidBottomBar: false
};

export function getFrameProfile(device: Device): DeviceFrameProfile {
  if (device.type === "watch") {
    return createProfile(device, { kind: "watch", platform: "watch" });
  }

  if (device.type === "desktop" || device.type === "laptop" || device.type === "tv") {
    return createProfile(device, { kind: "desktop", platform: "desktop" });
  }

  if (device.type === "tablet") {
    return createProfile(device, {
      kind: "tablet",
      platform: isApple(device) ? "ios" : "android"
    });
  }

  if (isAndroid(device)) {
    return createProfile(device, {
      kind: device.tags.includes("foldable") ? "android-fold" : "android-modern",
      platform: "android"
    });
  }

  if (isClassicIphone(device)) {
    return createProfile(device, { kind: "iphone-classic", platform: "ios" });
  }

  if (hasDynamicIsland(device)) {
    return createProfile(device, { kind: "iphone-dynamic-island", platform: "ios" });
  }

  return createProfile(device, { kind: "iphone-notch", platform: "ios" });
}

function isApple(device: Device) {
  return device.brand.toLowerCase() === "apple" || /ios|ipados/i.test(device.os);
}

function isClassicIphone(device: Device) {
  const id = device.id.toLowerCase();
  return id === "apple-iphone-5" || id.includes("iphone-se") || device.tags.includes("legacy");
}

function isAndroid(device: Device) {
  return /android/i.test(device.os) || ["Samsung", "Google"].includes(device.brand);
}

function hasDynamicIsland(device: Device) {
  const id = device.id.toLowerCase();
  const name = device.name.toLowerCase();

  // The value-focused e models retain the wide notch. Their release year alone
  // must not promote them to the Dynamic Island profile.
  if (id.includes("iphone-16e") || id.includes("iphone-17e")) return false;

  return (
    (device.year ?? 0) >= 2023 ||
    id.includes("iphone-air") ||
    id.includes("iphone-14-pro") ||
    name.includes("iphone 14 pro")
  );
}

function createProfile(device: Device, profile: Omit<DeviceFrameProfile, "style" | "imageChrome" | "chromeVariant" | "safeAreaInsetBottom" | "safeAreaInsetTop" | "statusBarInsetLeft" | "statusBarInsetRight" | "osMajor">): DeviceFrameProfile {
  const desktopChrome: DeviceFrameStyle["desktopChrome"] =
    isApple(device) && (device.type === "laptop" || device.type === "desktop") ? "safari" : "default";
  const style = { desktopChrome };

  const meta = getDeviceChromeMeta(device.id);
  const osMajor = parseOsMajor(meta?.osVersion ?? device.os);
  const safeAreaInsetBottom = profile.platform === "ios" ? profile.kind === "iphone-classic" ? 0 : device.type === "tablet" ? 20 : 34 : meta?.safeAreaInsetBottom ?? 0;
  const chromeVariant = resolveChromeVariant(profile.platform, profile.kind, osMajor);
  const legacyNotch = ["apple-iphone-x", "apple-iphone-xr", "apple-iphone-11", "apple-iphone-11-pro", "apple-iphone-11-pro-max"].includes(device.id);
  const safeAreaInsetTop = resolveSafeAreaInsetTop(profile.platform, profile.kind, device.type, legacyNotch ? 44 : meta?.safeAreaInsetTop);

  return {
    ...profile,
    style,
    imageChrome: getImageBackedChromeConfig(device, profile),
    chromeVariant,
    safeAreaInsetBottom,
    safeAreaInsetTop,
    statusBarInsetLeft: meta?.statusBarInsetLeft ?? 0,
    statusBarInsetRight: meta?.statusBarInsetRight ?? 0,
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
    if (measuredTop && measuredTop > 0) return measuredTop;
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
  osMajor: number
): ChromeVariant {
  if (platform === "android") return "android-modern";
  if (platform !== "ios") return "none";
  // Browser styling follows the OS version, not hardware safe-area dimensions.
  if (osMajor >= 26) return "ios-liquid-glass";
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
    showSafariBar: isIos,
    showAndroidBottomBar: isAndroidDevice
  };
}
