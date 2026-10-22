import type { PreviewIdentity } from "../domain/simulator/preview-identity";

/** What a reopened viewer shows again after its page reloaded with it open. */
export interface ViewerRestoreState {
  allDevices?: { category: string; scrollTop: number } | null;
}
/** Explicit launch data prevents a website's query parameters from configuring the extension. */
export interface ViewerContext {
  root: HTMLElement;
  url: string;
  sourceTabId?: number;
  restore?: ViewerRestoreState;
  close: () => void;
}
let context: ViewerContext | undefined;
const pendingPreviews = new Map<string, Promise<void>>();
export function setViewerContext(value: ViewerContext | undefined) {
  context = value;
  pendingPreviews.clear();
}
export function getViewerContext() { return context; }
export function getViewerRoot(): ParentNode { return context?.root ?? document; }
// ShadowRoot dispatches the same DOM keyboard/pointer events as Document.
export function getViewerEventTarget(): Document { return (context?.root.getRootNode() ?? document) as Document; }
export function extensionAsset(path: string): string {
  return typeof chrome !== "undefined" && chrome.runtime?.getURL ? chrome.runtime.getURL(path.replace(/^\//, "")) : path;
}

/**
 * Lets the tab frame the site and, with an identity, makes preview frames in
 * the tab identify as that device's browser (null: the browser's own; absent:
 * unchanged). Resolves once the frame can load.
 */
export async function preparePreview(url: string, identity?: PreviewIdentity | null): Promise<void> {
  if (!context || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  // Gallery frames share this setup, but still load independent documents.
  // Only coalesce in-flight work: a later reload rechecks the session rules.
  const key = `${identity === undefined ? "" : JSON.stringify(identity)}\n${url}`;
  const pending = pendingPreviews.get(key);
  if (pending) return pending;
  const preparation = (async () => {
    const result = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url, identity });
    if (!result?.ok) throw new Error(result?.error ?? "Could not prepare the preview.");
  })();
  pendingPreviews.set(key, preparation);
  try { await preparation; }
  finally { if (pendingPreviews.get(key) === preparation) pendingPreviews.delete(key); }
}
