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
  cornerRadius?: number;
  paths?: Partial<Record<Orientation, string>>;
  occlusions?: MockupViewportOcclusion[];
  /** False for devices shown in one posture only; rotation is the default. */
  enableRotation?: false;
}

export interface MockupViewportOcclusion {
  kind: "circle" | "rounded-rect" | "rect";
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
}

export interface MockupAsset {
  localPath?: string;
  width?: number;
  height?: number;
  /** CSS pixels per source-image pixel. */
  renderScale?: number;
  viewport?: Partial<Record<Orientation, MockupViewportConfig>>;
  cssViewport?: Size;
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
  resolutionSource?: "reference" | "catalog" | "derived";
  displayReferenceUrl?: string;
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
