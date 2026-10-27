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
const pendingPreviews = new Map<string, Promise<{ identities: boolean }>>();
export function setViewerContext(value: ViewerContext | undefined) {
  context = value;
  pendingPreviews.clear();
  setDeviceIdentities(true);
}

/**
 * Whether this tab's previews are their own devices. Off when Chrome's
 * debugger could not attach or its bar was cancelled; reopening the viewer
 * turns them back on.
 */
let deviceIdentities = true;
const identityListeners = new Set<(active: boolean) => void>();
function setDeviceIdentities(active: boolean) {
  if (deviceIdentities === active) return;
  deviceIdentities = active;
  for (const listener of identityListeners) listener(active);
}
export function deviceIdentitiesActive() { return deviceIdentities && Boolean(context); }
export function onDeviceIdentitiesChange(listener: (active: boolean) => void) {
  identityListeners.add(listener);
  return () => { identityListeners.delete(listener); };
}
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(message => {
    if (context && message?.type === "MDV_DEVICE_IDENTITIES" && typeof message.active === "boolean") setDeviceIdentities(message.active);
  });
}
export function getViewerContext() { return context; }
export function getViewerRoot(): ParentNode { return context?.root ?? document; }
// ShadowRoot dispatches the same DOM keyboard/pointer events as Document.
export function getViewerEventTarget(): Document { return (context?.root.getRootNode() ?? document) as Document; }
export function extensionAsset(path: string): string {
  return typeof chrome !== "undefined" && chrome.runtime?.getURL ? chrome.runtime.getURL(path.replace(/^\//, "")) : path;
}

/** Wait until this card's identity and embedding exception are in place, so the frame's first request is the device's. */
export async function preparePreview(url: string, identities?: PreviewIdentities): Promise<{ identities: boolean }> {
  if (!context || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return { identities: false };
  // Only coalesce in-flight work: a later reload rechecks the session rules.
  const key = `${JSON.stringify(identities)}\n${url}`;
  const pending = pendingPreviews.get(key);
  if (pending) return pending;
  const preparation = (async () => {
    const result = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url, identities });
    if (!result?.ok) throw new Error(result?.error ?? "Could not prepare the preview.");
    const active = result.identities === true;
    if (context) setDeviceIdentities(active);
    return { identities: active };
  })();
  pendingPreviews.set(key, preparation);
  try { return await preparation; }
  finally { if (pendingPreviews.get(key) === preparation) pendingPreviews.delete(key); }
}
