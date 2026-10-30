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
  /** The language this device asks for; the browser's own when left out. */
  language?: string;
  /** Whether this device tells sites its screen density (on unless turned off). */
  sendDensity?: boolean;
  /** Where the device was dragged on the workspace canvas, in CSS pixels from its default spot. */
  canvasPosition?: { x: number; y: number };
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
