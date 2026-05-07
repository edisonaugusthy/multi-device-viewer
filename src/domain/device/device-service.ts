import type { CustomDeviceInput, Device, DeviceFilters, DeviceType, Orientation, Size } from "./device.types";

const CUSTOM_PREFIX = "custom-";

export function toLandscapeAwareSize(size: Size, orientation: Orientation): Size {
  const width = orientation === "landscape" ? Math.max(size.width, size.height) : Math.min(size.width, size.height);
  const height = orientation === "landscape" ? Math.min(size.width, size.height) : Math.max(size.width, size.height);
  return { width, height };
}

export function mediaQueryFor(device: Device, orientation: Orientation): string {
  const size = toLandscapeAwareSize(device.cssViewport, orientation);
  return `@media (width: ${size.width}px) and (height: ${size.height}px) and (orientation: ${orientation})`;
}

export function createCustomDevice(input: CustomDeviceInput): Device {
  const safeName = input.name.trim() || `${input.width} x ${input.height}`;
  const id = `${CUSTOM_PREFIX}${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${input.width}x${input.height}`;

  return {
    id,
    name: safeName,
    brand: "Custom",
    family: "Custom",
    type: input.type,
    os: "Custom",
    cssViewport: { width: input.width, height: input.height },
    pixelRatio: input.pixelRatio,
    manufacturerResolution: {
      width: Math.round(input.width * input.pixelRatio),
      height: Math.round(input.height * input.pixelRatio)
    },
    mockupAssets: [],
    updatedAt: new Date().toISOString().slice(0, 10),
    tags: ["custom"]
  };
}

export function validateCustomDevice(input: CustomDeviceInput): string | null {
  if (input.width < 120 || input.width > 4000) return "Width must be between 120 and 4000.";
  if (input.height < 120 || input.height > 4000) return "Height must be between 120 and 4000.";
  if (input.pixelRatio < 1 || input.pixelRatio > 5) return "Pixel ratio must be between 1 and 5.";
  return null;
}

export function getDeviceBrands(devices: Device[]): string[] {
  return Array.from(new Set(devices.map((device) => device.brand))).sort((a, b) => a.localeCompare(b));
}

export function getDeviceTypes(devices: Device[]): DeviceType[] {
  return Array.from(new Set(devices.map((device) => device.type)));
}

export function filterDevices(devices: Device[], filters: DeviceFilters, favoriteIds: string[]): Device[] {
  const query = filters.query.trim().toLowerCase();
  const favoriteSet = new Set(favoriteIds);

  return devices.filter((device) => {
    if (filters.favoritesOnly && !favoriteSet.has(device.id)) return false;
    if (filters.type !== "all" && device.type !== filters.type) return false;
    if (filters.brand !== "all" && device.brand !== filters.brand) return false;
    if (!query) return true;

    const searchable = [
      device.name,
      device.brand,
      device.family,
      device.os,
      device.type,
      `${device.cssViewport.width}x${device.cssViewport.height}`,
      ...device.tags
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}
