/** Explicit launch data prevents a website's query parameters from configuring the extension. */
export interface ViewerContext {
  root: HTMLElement;
  url: string;
  sourceTabId?: number;
  close: () => void;
}
let context: ViewerContext | undefined;
export function setViewerContext(value: ViewerContext | undefined) { context = value; }
export function getViewerContext() { return context; }
export function getViewerRoot(): ParentNode { return context?.root ?? document; }
// ShadowRoot dispatches the same DOM keyboard/pointer events as Document.
export function getViewerEventTarget(): Document { return (context?.root.getRootNode() ?? document) as Document; }
export function extensionAsset(path: string): string {
  return typeof chrome !== "undefined" && chrome.runtime?.getURL ? chrome.runtime.getURL(path.replace(/^\//, "")) : path;
}

export async function preparePreview(url: string): Promise<void> {
  if (!context || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  const result = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url });
  if (!result?.ok) throw new Error(result?.error ?? "Could not prepare the preview.");
}
