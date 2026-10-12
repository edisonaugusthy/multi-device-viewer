export interface BaselineIdentity {
  deviceId: string;
  url: string;
  orientation: "portrait" | "landscape";
  viewportWidth: number;
  viewportHeight: number;
}
/** Where the webpage sits inside a cropped capture, in raster pixels: the
 *  fractional origin left by whole-pixel cropping and the exact content size. */
export interface CaptureCrop { x: number; y: number; width: number; height: number }
export interface BaselineMeta {
  identity: BaselineIdentity;
  deviceName: string;
  savedAt: number;
  /** Raster size of the stored capture. */
  width: number;
  height: number;
  crop: CaptureCrop;
  /** Stored bytes (lossless PNG plus display preview). */
  bytes: number;
}
export interface ChangedRegion { x: number; y: number; width: number; height: number; pixels: number }
export interface VisualComparison {
  comparisonId: string;
  identity: BaselineIdentity;
  baseline: BaselineMeta;
  /** Size both captures were compared at. */
  width: number;
  height: number;
  threshold: number;
  changedPixels: number;
  totalPixels: number;
  cellSize: number;
  columns: number;
  rows: number;
  /** Base64 bit mask of changed cells (columns × rows, LSB first). */
  mask: string;
  regions: ChangedRegion[];
  regionCount: number;
  /** JPEG data URLs sized for display. Omitted on a re-diff. */
  latestPreview?: string;
  baselinePreview?: string;
}
/** The iframe's rectangle and the window size, both in CSS pixels. */
export interface CaptureFrame {
  rect: { left: number; top: number; width: number; height: number };
  viewport: { width: number; height: number };
}
export type VisualRegressionCommand =
  | { action: "read"; identity: BaselineIdentity }
  | { action: "list" }
  | { action: "delete"; identity: BaselineIdentity }
  | { action: "clear" }
  | { action: "capture"; identity: BaselineIdentity; deviceName: string; frame: CaptureFrame }
  | { action: "discard"; captureId: string }
  | { action: "save"; captureId: string }
  | { action: "compare"; captureId: string; threshold: number }
  | { action: "rediff"; comparisonId: string; threshold: number }
  | { action: "accept"; comparisonId: string };
export interface VisualRegressionResults {
  read: BaselineMeta | null;
  list: BaselineMeta[];
  delete: null;
  clear: null;
  capture: { captureId: string };
  discard: null;
  save: BaselineMeta;
  compare: VisualComparison;
  rediff: VisualComparison;
  accept: BaselineMeta;
}
export type VisualRegressionAction = VisualRegressionCommand["action"];
export type VisualRegressionErrorCode =
  | "missing" | "dimensions" | "storage" | "image" | "engine"
  | "capture" | "clipped" | "changed" | "expired" | "unsupported";
export class VisualRegressionError extends Error {
  constructor(public code: VisualRegressionErrorCode) { super(code); }
}
export const MAX_IMAGE_PIXELS = 4_000_000;
export const MAX_BASELINES = 100;
export const MAX_BASELINE_BYTES = 64 * 1024 * 1024;

export function baselineKey(identity: BaselineIdentity): string {
  let url: URL;
  try { url = new URL(identity.url); } catch { throw new VisualRegressionError("unsupported"); }
  if (!/^https?:$/.test(url.protocol)) throw new VisualRegressionError("unsupported");
  if (!identity.deviceId || identity.deviceId.length > 160
    || identity.url.length > 4096 || !["portrait", "landscape"].includes(identity.orientation)
    || ![identity.viewportWidth, identity.viewportHeight].every(n => Number.isInteger(n) && n > 0 && n <= 16384)) {
    throw new VisualRegressionError("image");
  }
  // Keep query strings and SPA hashes: distinct pages need distinct baselines.
  return JSON.stringify([identity.deviceId, url.href, identity.orientation, identity.viewportWidth, identity.viewportHeight]);
}
