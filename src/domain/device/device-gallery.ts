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

// A search term matches the start of a word, so "pro" finds "iPhone 16 Pro"
// but not "Toughbook", and "fold" finds "Fold8".
function startsAWord(text: string, term: string) {
  for (let index = text.indexOf(term); index !== -1; index = text.indexOf(term, index + 1)) {
    if (index === 0 || !/[\p{L}\p{N}]/u.test(text[index - 1])) return true;
  }
  return false;
}

export function deviceMatchesSearch(device: Device, query: string) {
  const terms = searchText(query).split(/\s+/).filter(Boolean);
  const haystack = searchText(`${device.name} ${device.brand} ${device.family} ${device.os} ${device.type} ${device.tags.join(" ")} ${device.cssViewport.width}x${device.cssViewport.height}`);
  return terms.every(term => startsAWord(haystack, term));
}

/** True when the device name itself starts with the query (brand prefix optional). */
export function nameStartsWith(device: Device, query: string) {
  const term = searchText(query);
  if (!term) return false;
  const name = searchText(device.name);
  return name.startsWith(term) || name.slice(searchText(device.brand).length).trimStart().startsWith(term);
}

// Newest first: release year descending (presets without a year last), then
// the smaller screen, then the name.
export function newestFirst(left: Device, right: Device) {
  return (right.year ?? 0) - (left.year ?? 0)
    || left.cssViewport.width - right.cssViewport.width
    || left.cssViewport.height - right.cssViewport.height
    || left.name.localeCompare(right.name);
}

export function groupGalleryDevices(devices: Device[], query = ""): DeviceGalleryGroup[] {
  return galleryGroupOrder.flatMap(id => {
    const matches = devices.filter(device => {
      const os = device.os.trim().toLowerCase();
      const group = device.brand === "Custom" ? "custom"
        : device.type === "phone" && os.startsWith("ios") ? "ios"
        : device.type === "phone" && os.startsWith("android") ? "android"
        : device.type;
      return group === id && deviceMatchesSearch(device, query);
    }).sort((left, right) => left.cssViewport.width - right.cssViewport.width
      || left.cssViewport.height - right.cssViewport.height
      || left.name.localeCompare(right.name));
    return matches.length ? [{ id, devices: matches }] : [];
  });
}
