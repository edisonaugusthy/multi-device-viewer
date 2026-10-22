/**
 * Phone previews load inside a small extension page (preview-frame.html) that
 * navigates the real page frame. A navigation started by the extension's
 * origin is told apart by the tab's request rules from one started by the
 * website, so phone previews get the phone identity and every other preview
 * the desktop one. The wrapper passes messages between the viewer and the
 * page unchanged, so the viewer still talks to the outer frame.
 */
export const PREVIEW_FRAME_PATH = "/preview-frame.html";
export const PREVIEW_SANDBOX = "allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation";
const FRAME_NAME = /^mdv-(?:mobile-)?preview-([\w-]+)$/;

export function previewFrameName(slotId: string, hideScrollbars: boolean): string {
  return `${hideScrollbars ? "mdv-mobile-preview-" : "mdv-preview-"}${slotId}`;
}

export function slotIdFromFrameName(name: string): string | undefined {
  return FRAME_NAME.exec(name)?.[1];
}

/** Only the in-page viewer wraps: the simulator page is the extension's own, where every frame already starts from it. */
export function canWrapPreviews(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id) && typeof location !== "undefined" && location.protocol !== "chrome-extension:";
}

export function previewFrameUrl(url: string, name: string): string {
  const params = new URLSearchParams({ url, name });
  return `${chrome.runtime.getURL(PREVIEW_FRAME_PATH)}?${params}`;
}

/** A web page URL from a message or query, or nothing. */
export function webPageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
