import type { Device } from "./device.types";

export type DeviceGroupId = "ios" | "android" | "tablet" | "desktop" | "special";

export const DEVICE_GROUP_ORDER: DeviceGroupId[] = [
  "ios",
  "android",
  "tablet",
  "desktop",
  "special"
];

export const DEVICE_GROUP_LABEL: Record<DeviceGroupId, string> = {
  ios: "iOS",
  android: "Android",
  tablet: "Tablets",
  desktop: "Desktop & Laptop",
  special: "Specials"
};

export function deviceGroupFor(device: Device): DeviceGroupId {
  const os = device.os.toLowerCase();
  const tags = device.tags.map((tag) => tag.toLowerCase());

  if (device.type === "tablet") return "tablet";
  if (device.type === "laptop" || device.type === "desktop") return "desktop";
  if (tags.includes("special") || device.type === "watch" || device.type === "tv" || device.type === "custom") {
    return "special";
  }
  if (os === "ios") return "ios";
  if (os === "android") return "android";
  return "special";
}

export function groupDevices(devices: Device[]): Array<[DeviceGroupId, Device[]]> {
  const grouped = new Map<DeviceGroupId, Device[]>();
  for (const group of DEVICE_GROUP_ORDER) grouped.set(group, []);

  for (const device of devices) {
    grouped.get(deviceGroupFor(device))!.push(device);
  }

  return DEVICE_GROUP_ORDER
    .map((group): [DeviceGroupId, Device[]] => [group, grouped.get(group)!])
    .filter(([, list]) => list.length > 0);
}
