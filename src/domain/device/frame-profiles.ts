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
}

export function getFrameProfile(device: Device): DeviceFrameProfile {
  if (device.type === "watch") {
    return { kind: "watch", platform: "watch", radius: 44, shellPadding: 10, contentRadius: 32 };
  }

  if (device.type === "desktop" || device.type === "laptop" || device.type === "tv") {
    return { kind: "desktop", platform: "desktop", radius: 18, shellPadding: 10, contentRadius: 10 };
  }

  if (device.type === "tablet") {
    return {
      kind: "tablet",
      platform: isApple(device) ? "ios" : "android",
      radius: 38,
      shellPadding: 12,
      contentRadius: 26
    };
  }

  if (isAndroid(device)) {
    return {
      kind: device.tags.includes("foldable") ? "android-fold" : "android-modern",
      platform: "android",
      radius: device.tags.includes("foldable") ? 28 : 42,
      shellPadding: device.tags.includes("foldable") ? 8 : 9,
      contentRadius: device.tags.includes("foldable") ? 22 : 34
    };
  }

  if (device.id.includes("se") || device.tags.includes("legacy")) {
    return { kind: "iphone-classic", platform: "ios", radius: 32, shellPadding: 12, contentRadius: 18 };
  }

  if ((device.year ?? 0) >= 2023 || device.id.includes("air")) {
    return { kind: "iphone-dynamic-island", platform: "ios", radius: 55, shellPadding: 10, contentRadius: 42 };
  }

  return { kind: "iphone-notch", platform: "ios", radius: 48, shellPadding: 10, contentRadius: 36 };
}

function isApple(device: Device) {
  return device.brand.toLowerCase() === "apple" || /ios|ipados/i.test(device.os);
}

function isAndroid(device: Device) {
  return /android/i.test(device.os) || ["Samsung", "Google"].includes(device.brand);
}
