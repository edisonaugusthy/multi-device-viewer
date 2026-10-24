import type { PreviewIdentities } from "../domain/simulator/preview-identity";

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
const pendingPreviews = new Map<string, Promise<{ headers: boolean }>>();
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

/** Wait until this card's document/API header rule and embedding exception are installed. */
export async function preparePreview(url: string, identities?: PreviewIdentities): Promise<{ headers: boolean }> {
  if (!context || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return { headers: false };
  // Only coalesce in-flight work: a later reload rechecks the session rules.
  const key = `${JSON.stringify(identities)}\n${url}`;
  const pending = pendingPreviews.get(key);
  if (pending) return pending;
  const preparation = (async () => {
    const result = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url, identities });
    if (!result?.ok) throw new Error(result?.error ?? "Could not prepare the preview.");
    return { headers: result.headers === true };
  })();
  pendingPreviews.set(key, preparation);
  try { return await preparation; }
  finally { if (pendingPreviews.get(key) === preparation) pendingPreviews.delete(key); }
}
