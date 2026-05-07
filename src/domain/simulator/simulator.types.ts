import type { Orientation } from "../device/device.types";

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
}

export interface DisplaySettings {
  showStatusBar: boolean;
  showBattery: boolean;
  showUrlBar: boolean;
  presentationMode: boolean;
  hideChrome: boolean;
}

export interface SimulatorState {
  slots: PreviewSlot[];
  activeSlotId: string;
  display: DisplaySettings;
}
