import {
  clearBaselines, listBaselines, readBaselineImage, readBaselineMeta, writeBaseline,
} from "../../infrastructure/visual-regression/baseline-store";
import { getPixelDiffer } from "./pixel-diff";
import {
  baselineKey, MAX_IMAGE_PIXELS, VisualRegressionError,
  type BaselineIdentity, type BaselineMeta, type CaptureCrop, type CaptureFrame, type VisualComparison,
  type VisualRegressionAction, type VisualRegressionCommand, type VisualRegressionResults,
} from "./visual-regression.types";

/** What the extension background provides: the visible tab that sent the command, as PNG. */
export interface VisualRegressionHost { captureTab(): Promise<Blob> }

// Everything below runs in the extension service worker (or the development
// worker). The page only sends rectangles and receives stats, regions, a bit
// mask and small previews, so no screenshot is decoded or encoded on the
// website's main thread.
const SESSION_TTL_MS = 120_000;
const MAX_SESSIONS = 3;
const PREVIEW_EDGE = 1400;
const THRESHOLD_LIMIT = 255;

interface Comparison { baseline: BaselineMeta; a: Uint8ClampedArray; b: Uint8ClampedArray; width: number; height: number }
interface Session {
  id: string;
  identity: BaselineIdentity;
  deviceName: string;
  image: ImageBitmap;
  crop: CaptureCrop;
  timer?: ReturnType<typeof setTimeout>;
  comparison?: Comparison;
}
const sessions = new Map<string, Session>();

function release(id: string) {
  const session = sessions.get(id);
  if (!session) return;
  clearTimeout(session.timer);
  session.image.close();
  sessions.delete(id);
}
function touch(session: Session) {
  clearTimeout(session.timer);
  session.timer = setTimeout(() => release(session.id), SESSION_TTL_MS);
}
function remember(session: Session) {
  // Captures hold full-resolution pixels; keep only the most recent few.
  while (sessions.size >= MAX_SESSIONS) release(sessions.keys().next().value!);
  sessions.set(session.id, session);
  touch(session);
}
function sessionFor(id: unknown): Session {
  const session = typeof id === "string" ? sessions.get(id) : undefined;
  if (!session) throw new VisualRegressionError("expired");
  touch(session);
  return session;
}
function threshold(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > THRESHOLD_LIMIT) throw new VisualRegressionError("image");
  return value as number;
}

async function pngSize(blob: Blob) {
  const header = new DataView(await blob.slice(0, 24).arrayBuffer());
  // PNG signature, then the IHDR chunk with big-endian width and height.
  if (header.byteLength < 24 || header.getUint32(0) !== 0x89504e47 || header.getUint32(12) !== 0x49484452) throw new VisualRegressionError("capture");
  return { width: header.getUint32(16), height: header.getUint32(20) };
}
function validFrame(frame: CaptureFrame) {
  const values = [frame?.rect?.left, frame?.rect?.top, frame?.rect?.width, frame?.rect?.height, frame?.viewport?.width, frame?.viewport?.height];
  if (!values.every(value => typeof value === "number" && Number.isFinite(value))) throw new VisualRegressionError("image");
  const { rect, viewport } = frame;
  if (rect.width <= 0 || rect.height <= 0 || viewport.width <= 0 || viewport.height <= 0
    || rect.left < 0 || rect.top < 0 || rect.left + rect.width > viewport.width + 0.5 || rect.top + rect.height > viewport.height + 0.5) {
    throw new VisualRegressionError("clipped");
  }
  return frame;
}
async function capture(identity: BaselineIdentity, deviceName: unknown, frame: CaptureFrame, host: VisualRegressionHost) {
  baselineKey(identity);
  const { rect, viewport } = validFrame(frame);
  const shot = await host.captureTab();
  const size = await pngSize(shot);
  const sx = size.width / viewport.width, sy = size.height / viewport.height;
  const left = Math.ceil(rect.left * sx), top = Math.ceil(rect.top * sy);
  const crop = { x: left - rect.left * sx, y: top - rect.top * sy, width: rect.width * sx, height: rect.height * sy };
  // Keep raster dimensions stable when a device moves by a fractional pixel.
  const width = Math.floor(rect.width * sx) - 1, height = Math.floor(rect.height * sy) - 1;
  if (width <= 0 || height <= 0 || left + width > size.width || top + height > size.height) throw new VisualRegressionError("clipped");
  if (width * height > MAX_IMAGE_PIXELS) throw new VisualRegressionError("image");
  // Crop while decoding: the rest of the tab is never rasterised into a canvas.
  const image = await createImageBitmap(shot, left, top, width, height).catch(() => { throw new VisualRegressionError("image"); });
  const session: Session = { id: crypto.randomUUID(), identity, deviceName: typeof deviceName === "string" ? deviceName.slice(0, 160) : "", image, crop };
  remember(session);
  return { captureId: session.id };
}

function canvas(width: number, height: number) {
  const surface = new OffscreenCanvas(width, height);
  return { surface, context: surface.getContext("2d", { willReadFrequently: true })! };
}
function pixels(image: ImageBitmap, width: number, height: number, source = { x: 0, y: 0, width: image.width, height: image.height }) {
  const { context } = canvas(width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}
/**
 * The part of a larger capture showing the same webpage area as the smaller
 * one. Whole-pixel cropping leaves each capture at a different fractional
 * offset, so map through content coordinates instead of stretching edge to edge.
 */
export function alignedSource(small: { width: number; height: number; crop: CaptureCrop }, large: { crop: CaptureCrop }) {
  const kx = large.crop.width / small.crop.width, ky = large.crop.height / small.crop.height;
  return { x: small.crop.x * kx - large.crop.x, y: small.crop.y * ky - large.crop.y, width: small.width * kx, height: small.height * ky };
}
function preview(image: ImageBitmap) {
  const scale = Math.min(1, PREVIEW_EDGE / Math.max(image.width, image.height));
  const small = canvas(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
  small.context.fillStyle = "#fff";
  small.context.fillRect(0, 0, small.surface.width, small.surface.height);
  small.context.imageSmoothingQuality = "high";
  small.context.drawImage(image, 0, 0, small.surface.width, small.surface.height);
  return small.surface.convertToBlob({ type: "image/jpeg", quality: 0.85 });
}
async function encode(image: ImageBitmap) {
  const lossless = canvas(image.width, image.height);
  lossless.context.drawImage(image, 0, 0);
  const [png, small] = await Promise.all([lossless.surface.convertToBlob({ type: "image/png" }), preview(image)]);
  return { png, preview: small };
}
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  return btoa(binary);
}
async function dataUrl(blob: Blob) {
  return `data:${blob.type};base64,${base64(new Uint8Array(await blob.arrayBuffer()))}`;
}
async function store(session: Session) {
  const images = await encode(session.image);
  const meta = await writeBaseline(session.identity, {
    meta: { identity: session.identity, deviceName: session.deviceName, savedAt: Date.now(), width: session.image.width, height: session.image.height, crop: session.crop },
    images,
  });
  return meta!;
}

/** Same size, or the same shape within rounding: compare at the smaller size. */
export function commonSize(a: { width: number; height: number }, b: { width: number; height: number }) {
  if (a.width === b.width && a.height === b.height) return { width: a.width, height: a.height, resized: false };
  // Crops lose up to two pixels to rounding at each scale.
  if (Math.abs(a.width * b.height - b.width * a.height) > 2 * Math.max(a.width, a.height, b.width, b.height)) throw new VisualRegressionError("dimensions");
  const smaller = a.width * a.height <= b.width * b.height ? a : b;
  return { width: smaller.width, height: smaller.height, resized: true };
}
async function compare(session: Session, tolerance: number): Promise<VisualComparison> {
  const baseline = await readBaselineMeta(session.identity);
  const png = baseline && await readBaselineImage(session.identity, "png");
  if (!baseline || !png) throw new VisualRegressionError("missing");
  const previous = await createImageBitmap(png).catch(() => { throw new VisualRegressionError("image"); });
  try {
    const size = commonSize(previous, session.image);
    const old = { width: previous.width, height: previous.height, crop: baseline.crop };
    const latest = { width: session.image.width, height: session.image.height, crop: session.crop };
    const baselineSmaller = old.width * old.height <= latest.width * latest.height;
    // Captures of the same shape at another zoom are aligned and compared
    // at the smaller size; glyph edges can still differ slightly.
    const a = pixels(previous, size.width, size.height, size.resized && !baselineSmaller ? alignedSource(latest, old) : undefined);
    const b = pixels(session.image, size.width, size.height, size.resized && baselineSmaller ? alignedSource(old, latest) : undefined);
    // Only one comparison dialog is open at a time: keep one pair of pixel
    // arrays resident. Older captures stay available for Accept.
    for (const other of sessions.values()) other.comparison = undefined;
    session.comparison = { baseline, width: size.width, height: size.height, a, b };
  } finally { previous.close(); }
  const stored = await readBaselineImage(session.identity, "preview");
  const [latestPreview, baselinePreview] = await Promise.all([
    dataUrl(await preview(session.image)),
    stored ? dataUrl(stored) : Promise.resolve(undefined),
  ]);
  return { ...await rediff(session, tolerance), latestPreview, baselinePreview };
}
async function rediff(session: Session, tolerance: number): Promise<VisualComparison> {
  const comparison = session.comparison;
  if (!comparison) throw new VisualRegressionError("expired");
  const { a, b, width, height, baseline } = comparison;
  // The comparison object keeps both images resident in WASM memory, so a
  // sensitivity change only re-runs the diff.
  const diff = (await getPixelDiffer())(a, b, width, height, tolerance, comparison);
  return {
    comparisonId: session.id, identity: session.identity, baseline, width, height, threshold: tolerance,
    changedPixels: diff.changedPixels, totalPixels: diff.totalPixels, cellSize: diff.cellSize, columns: diff.columns, rows: diff.rows,
    mask: base64(diff.mask), regions: diff.regions, regionCount: diff.regionCount,
  };
}

export async function handleVisualRegression<A extends VisualRegressionAction>(
  command: Extract<VisualRegressionCommand, { action: A }>, host: VisualRegressionHost,
): Promise<VisualRegressionResults[A]>;
export async function handleVisualRegression(command: VisualRegressionCommand, host: VisualRegressionHost): Promise<VisualRegressionResults[VisualRegressionAction]> {
  switch (command?.action) {
    case "read": return await readBaselineMeta(command.identity) ?? null;
    case "list": return listBaselines();
    case "delete": await writeBaseline(command.identity); return null;
    case "clear": await clearBaselines(); return null;
    case "capture": return capture(command.identity, command.deviceName, command.frame, host);
    case "discard": if (typeof command.captureId === "string") release(command.captureId); return null;
    case "save": {
      const session = sessionFor(command.captureId);
      try { return await store(session); } finally { release(session.id); }
    }
    case "compare": return compare(sessionFor(command.captureId), threshold(command.threshold));
    case "rediff": return rediff(sessionFor(command.comparisonId), threshold(command.threshold));
    case "accept": {
      const session = sessionFor(command.comparisonId);
      try { return await store(session); } finally { release(session.id); }
    }
    default: throw new VisualRegressionError("image");
  }
}
