import type { Orientation } from "../device/device.types";

export type ZoomMode = "fit" | "actual" | "custom";
export type PreviewMode = "iframe" | "live";

export interface PreviewSlot {
  id: string;
  deviceId: string;
  url: string;
  orientation: Orientation;
  zoom: number;
  zoomMode: ZoomMode;
  reloadToken: number;
  showFrame: boolean;
  inspectEnabled: boolean;
  inspectLocked: boolean;
}

export interface WorkbenchIssue {
  note: string;
  compareSlotId: string;
  lastCapturedAt: string | null;
  lastCaptureLabel: string;
}

export interface DisplaySettings {
  showStatusBar: boolean;
  showBattery: boolean;
  showUrlBar: boolean;
  scrollSync: boolean;
  darkMode: boolean;
  presentationMode: boolean;
  hideChrome: boolean;
  inspectMode: boolean;
  previewMode: PreviewMode;
  liveReloadMs: number;
}

export interface SimulatorState {
  slots: PreviewSlot[];
  activeSlotId: string;
  display: DisplaySettings;
  workbenchIssue: WorkbenchIssue;
  sourceTabId: number | null;
}
