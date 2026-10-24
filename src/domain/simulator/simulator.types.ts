import type { Orientation } from "../device/device.types";
import type { BrowserPreferences } from "../device/browser-geometry";

export type ZoomMode = "fit" | "actual" | "custom";

export interface PreviewSlot {
  id: string;
  deviceId: string;
  url: string;
  orientation: Orientation;
  zoom: number;
  zoomMode: ZoomMode;
  reloadToken: number;
  showFrame: boolean;
  browserPreferences?: BrowserPreferences;
}

export interface DisplaySettings {
  scrollSync: boolean;
  navigationSync: boolean;
  darkMode: boolean;
  previewStyle?: "device" | "free";
}

export interface SimulatorState {
  slots: PreviewSlot[];
  activeSlotId: string;
  display: DisplaySettings;
  sourceTabId: number | null;
}
