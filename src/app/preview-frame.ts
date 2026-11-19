export const PREVIEW_SANDBOX = "allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation";

export function previewFrameName(slotId: string, hideScrollbars: boolean): string {
  return `${hideScrollbars ? "mdv-mobile-preview-" : "mdv-preview-"}${slotId}`;
}

export const POPOUT_RELAY = "MDV_POPOUT_RELAY";
export const POPOUT_RELAY_READY = "MDV_POPOUT_RELAY_READY";

/** Sends a viewer message to a preview frame. A frame in the pop-out window
 * only trusts its own parent, so the message goes through that window's relay
 * (public/popout-relay.js). */
export function postToPreview(frame: HTMLIFrameElement | null | undefined, message: unknown): void {
  const target = frame?.contentWindow;
  if (!frame || !target) return;
  const host = frame.ownerDocument.defaultView;
  if (host && host !== window) host.postMessage({ type: POPOUT_RELAY, frame: frame.name, message }, "*");
  else target.postMessage(message, "*");
}

/** The slot a preview frame name belongs to. */
export function slotIdFromFrameName(name: string): string | undefined {
  return /^mdv-(?:mobile-)?preview-([\w-]+)$/.exec(name)?.[1];
}

/** A web page URL from a message or query, or nothing. */
export function webPageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
