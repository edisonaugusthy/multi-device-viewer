import type { CustomDeviceInput, Device, MockupAsset, MockupViewportConfig, Orientation, Size } from "./device.types";

const CUSTOM_PREFIX = "custom-";

export const orientations: readonly Orientation[] = ["portrait", "landscape"];

export function isLandscapeOrientation(orientation: Orientation): boolean {
  return orientation === "landscape";
}

export function getDefaultOrientation(device?: Pick<Device, "cssViewport">): Orientation {
  return device && device.cssViewport.width > device.cssViewport.height ? "landscape" : "portrait";
}

export function nextOrientation(orientation: Orientation): Orientation {
  return orientation === "portrait" ? "landscape" : "portrait";
}

/** Migrate older saved turns without reintroducing upside-down rendering. */
export function normalizeOrientation(value: unknown, device?: Device): Orientation {
  if (device && !supportsOrientation(device)) return getDefaultOrientation(device);
  if (value === "portrait" || value === "portrait-inverted") return "portrait";
  if (value === "landscape" || value === "landscape-inverted") return "landscape";
  return getDefaultOrientation(device);
}

export function getMockupViewport(asset: MockupAsset | undefined, orientation: Orientation): MockupViewportConfig | undefined {
  return asset?.viewport?.[orientation];
}

export function toLandscapeAwareSize(size: Size, orientation: Orientation): Size {
  const width = isLandscapeOrientation(orientation) ? Math.max(size.width, size.height) : Math.min(size.width, size.height);
  const height = isLandscapeOrientation(orientation) ? Math.min(size.width, size.height) : Math.max(size.width, size.height);
  return { width, height };
}

export function supportsOrientation(device: Device): boolean {
  const imageFrame = device.mockupAssets.find((asset) => (asset.kind === "transparent-png" || asset.kind === "transparent-svg") && asset.localPath);
  if (imageFrame) {
    if (!imageFrame.viewport) return false;
    if (imageFrame.viewport.portrait?.enableRotation === false) return false;
    return Boolean(imageFrame.viewport.landscape);
  }

  return device.type === "phone" || device.type === "tablet";
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
