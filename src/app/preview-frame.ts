export const PREVIEW_SANDBOX = "allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation";
const FRAME_NAME = /^mdv-(?:mobile-)?preview-([\w-]+)$/;

export function previewFrameName(slotId: string, hideScrollbars: boolean): string {
  return `${hideScrollbars ? "mdv-mobile-preview-" : "mdv-preview-"}${slotId}`;
}

export function slotIdFromFrameName(name: string): string | undefined {
  return FRAME_NAME.exec(name)?.[1];
}

/** A web page URL from a message or query, or nothing. */
export function webPageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
