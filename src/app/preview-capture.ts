import { captureArea } from "./debugger-client";
import { getViewerRoot } from "./viewer-context";
import type { LayoutSnapshot } from "../domain/capture/layout-snapshot";

/**
 * Screenshots of a preview through Chrome's debugger: drawn again at the
 * device's own pixel ratio (3× for most iPhones) rather than enlarged, and
 * whether or not the window shows the whole device. A whole page is the
 * preview scrolled screen by screen and stitched, with bars fixed to the
 * screen shown only once.
 */
const REPLY_TIMEOUT_MS = 1500;
/** Chrome's canvas limit, with room to spare; taller pages are cut at this height. */
export const MAX_STITCH_PIXELS = 16000;

export const previewElements = (slotId: string) => {
  const card = getViewerRoot().querySelector<HTMLElement>(`[data-preview-slot-id="${CSS.escape(slotId)}"]`);
  return { frame: card?.querySelector<HTMLIFrameElement>("iframe") ?? null, device: card?.querySelector<HTMLElement>("[data-device-frame]") ?? null };
};

/** Ask the preview's bridge something and wait for its answer; null when it does not answer. */
export function askPreview<T extends Record<string, unknown>>(frame: HTMLIFrameElement, slotId: string, type: string, reply: string, extra: Record<string, unknown> = {}): Promise<T | null> {
  const target = frame.contentWindow;
  if (!target) return Promise.resolve(null);
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const done = (value: T | null) => { clearTimeout(timer); window.removeEventListener("message", onMessage); resolve(value); };
    const onMessage = (event: MessageEvent) => {
      if (event.source === target && event.data?.type === reply && event.data.requestId === requestId) done(event.data as T);
    };
    const timer = setTimeout(() => done(null), REPLY_TIMEOUT_MS);
    window.addEventListener("message", onMessage);
    target.postMessage({ type, slotId, requestId, ...extra }, "*");
  });
}

const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** The capture's scale: the device's pixel ratio over how large its screen is drawn right now. */
function scaleFor(frame: HTMLIFrameElement, dpr: number) {
  const rect = frame.getBoundingClientRect();
  return frame.clientWidth && rect.width ? dpr * frame.clientWidth / rect.width : dpr;
}

async function captureElement(element: HTMLElement, scale: number, still: boolean): Promise<string | null> {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  // Document coordinates: the capture reaches beyond the window.
  return captureArea({ x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height, scale }, still);
}

/** The preview's screen as it is now, or the whole device with its frame. */
export async function captureVisible(slotId: string, dpr: number, { withFrame = false, still = false } = {}): Promise<string | null> {
  const { frame, device } = previewElements(slotId);
  if (!frame) return null;
  await askPreview(frame, slotId, "MDV_CAPTURE_PREPARE", "MDV_CAPTURE_PREPARED", { hidden: true });
  try {
    return await captureElement(withFrame && device ? device : frame, scaleFor(frame, dpr), still);
  } finally {
    void askPreview(frame, slotId, "MDV_CAPTURE_PREPARE", "MDV_CAPTURE_PREPARED", { hidden: false });
  }
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("The capture could not be read."));
  image.src = src;
});

interface Scrolled extends Record<string, unknown> { scrollY: number; scrollHeight: number; innerHeight: number; innerWidth: number }

/** The whole page, top to bottom, as one PNG at the device's pixel ratio. */
export async function captureWholePage(slotId: string, dpr: number): Promise<Blob | null> {
  const { frame } = previewElements(slotId);
  if (!frame) return null;
  const start = await askPreview<Scrolled>(frame, slotId, "MDV_PAGE_SCROLL", "MDV_PAGE_SCROLLED");
  if (!start) return null;
  const scale = scaleFor(frame, dpr);
  const pageHeight = Math.min(start.scrollHeight, Math.floor(MAX_STITCH_PIXELS / dpr));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(start.innerWidth * dpr);
  canvas.height = Math.round(pageHeight * dpr);
  const context = canvas.getContext("2d");
  if (!context) return null;
  await askPreview(frame, slotId, "MDV_CAPTURE_PREPARE", "MDV_CAPTURE_PREPARED", { hidden: true });
  try {
    for (let y = 0, first = true; y < pageHeight; y += start.innerHeight, first = false) {
      const at = await askPreview<Scrolled>(frame, slotId, "MDV_PAGE_SCROLL", "MDV_PAGE_SCROLLED", { y });
      if (!at) return null;
      await nextPaint();
      const tile = await captureElement(frame, scale, true);
      if (!tile) return null;
      const image = await loadImage(tile);
      context.drawImage(image, 0, Math.round(at.scrollY * dpr), canvas.width, Math.round(image.height * canvas.width / image.width));
      // Fixed headers and buttons appear in the first screen only.
      if (first) await askPreview(frame, slotId, "MDV_FIXED_HIDE", "MDV_FIXED_HIDDEN", { hidden: true });
      if (at.scrollY + start.innerHeight >= pageHeight) break;
    }
  } finally {
    await askPreview(frame, slotId, "MDV_FIXED_HIDE", "MDV_FIXED_HIDDEN", { hidden: false });
    await askPreview(frame, slotId, "MDV_PAGE_SCROLL", "MDV_PAGE_SCROLLED", { y: start.scrollY });
    void askPreview(frame, slotId, "MDV_CAPTURE_PREPARE", "MDV_CAPTURE_PREPARED", { hidden: false });
  }
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

/** The page's layout now, for describing what changed between two captures. */
export async function snapshotPreview(slotId: string): Promise<LayoutSnapshot | null> {
  const { frame } = previewElements(slotId);
  if (!frame) return null;
  const result = await askPreview<{ elements: LayoutSnapshot }>(frame, slotId, "MDV_LAYOUT_SNAPSHOT", "MDV_LAYOUT_SNAPSHOT_RESULT");
  return Array.isArray(result?.elements) ? result.elements : null;
}

export const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export const dataUrlToBytes = (dataUrl: string) => Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(",") + 1)), char => char.charCodeAt(0));

/** A file name safe on every system: letters without accents, digits, spaces, dots and dashes. */
export const safeFileName = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w .-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "capture";
