import type { Device } from "./device.types";

export type FrameProfileKind =
  | "iphone-dynamic-island"
  | "iphone-notch"
  | "iphone-classic"
  | "android-modern"
  | "android-fold"
  | "tablet"
  | "watch"
  | "desktop";

export interface DeviceFrameProfile {
  kind: FrameProfileKind;
  platform: "ios" | "android" | "desktop" | "watch";
  radius: number;
  shellPadding: number;
  contentRadius: number;
  style: DeviceFrameStyle;
  imageChrome: ImageBackedChromeConfig;
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

function createProfile(device: Device, profile: Omit<DeviceFrameProfile, "style" | "imageChrome">): DeviceFrameProfile {
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

  return {
    ...profile,
    style,
    imageChrome: getImageBackedChromeConfig(device, profile)
  };
}

function getImageBackedChromeConfig(device: Device, profile: Omit<DeviceFrameProfile, "style" | "imageChrome">): ImageBackedChromeConfig {
  const isIos = profile.platform === "ios";
  const isAndroidDevice = profile.platform === "android";
  const isSpecial = device.tags.includes("special") || device.type === "custom" || device.type === "watch" || device.type === "tv";
  const isHandheldSpecial = device.brand === "Zebra" && device.id.includes("tc");

  if (isSpecial && !isHandheldSpecial) {
    return emptyImageChrome;
  }

  return {
    showStatusBar: isIos || isAndroidDevice,
    showAndroidTopBar: isAndroidDevice,
    showBottomBar: isIos || isAndroidDevice,
    showCutout: isIos && device.type === "phone",
    showTabletCamera: isIos && device.type === "tablet",
    showSafariBar: isIos,
    showAndroidBottomBar: isAndroidDevice,
    showHomeIndicator: isIos
  };
}
