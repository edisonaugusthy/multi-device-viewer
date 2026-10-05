import type { Device } from "./device.types";

export const galleryGroupOrder = ["ios", "android", "phone", "tablet", "laptop", "desktop", "tv", "custom", "watch"] as const;
export type DeviceGalleryGroupId = typeof galleryGroupOrder[number];

export interface DeviceGalleryGroup {
  id: DeviceGalleryGroupId;
  devices: Device[];
}

function searchText(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "")
    .replace(/×/g, "x").replace(/(\d)\s*x\s*(?=\d)/g, "$1x").trim();
}

export function groupGalleryDevices(devices: Device[], query = ""): DeviceGalleryGroup[] {
  const terms = searchText(query).split(/\s+/).filter(Boolean);
  return galleryGroupOrder.flatMap(id => {
    const matches = devices.filter(device => {
      const os = device.os.trim().toLowerCase();
      const group = device.brand === "Custom" ? "custom"
        : device.type === "phone" && os.startsWith("ios") ? "ios"
        : device.type === "phone" && os.startsWith("android") ? "android"
        : device.type;
      if (group !== id) return false;
      const haystack = searchText(`${device.name} ${device.brand} ${device.family} ${device.os} ${device.type} ${device.tags.join(" ")} ${device.cssViewport.width}x${device.cssViewport.height}`);
      return terms.every(term => haystack.includes(term));
    }).sort((left, right) => left.cssViewport.width - right.cssViewport.width
      || left.cssViewport.height - right.cssViewport.height
      || left.name.localeCompare(right.name));
    return matches.length ? [{ id, devices: matches }] : [];
  });
}
