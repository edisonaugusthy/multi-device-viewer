export type DeviceType = "phone" | "tablet" | "laptop" | "desktop" | "watch" | "tv" | "custom";

export type Orientation = "portrait" | "landscape";

export interface Size {
  width: number;
  height: number;
}

export interface MockupViewportConfig {
  left: number;
  top: number;
  width: number;
  height: number;
  paths?: Partial<Record<Orientation, string | string[]>>;
  enableRotation?: boolean;
}

export interface MockupFrameStyle {
  cutoutTop?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  imageCutout?: {
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
  };
  imageStatusBarHeightRatio?: number;
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
  viewport?: Partial<Record<Orientation, MockupViewportConfig>>;
  frameStyle?: MockupFrameStyle;
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
