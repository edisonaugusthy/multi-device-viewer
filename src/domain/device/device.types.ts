export type DeviceType = "phone" | "tablet" | "laptop" | "desktop" | "watch" | "tv" | "custom";

export type Orientation = "portrait" | "landscape";

export interface Size {
  width: number;
  height: number;
}

export interface MockupAsset {
  kind: "transparent-png" | "frame";
  localPath?: string;
  width?: number;
  height?: number;
  screenInset?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface Device {
  id: string;
  name: string;
  brand: string;
  family: string;
  year?: number;
  type: DeviceType;
  os: string;
  cssViewport: Size;
  pixelRatio: number;
  manufacturerResolution: Size;
  mockupAssets: MockupAsset[];
  updatedAt: string;
  tags: string[];
}

export interface CustomDeviceInput {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  type: DeviceType;
}

export interface DeviceFilters {
  query: string;
  type: "all" | DeviceType;
  brand: "all" | string;
  favoritesOnly: boolean;
}
