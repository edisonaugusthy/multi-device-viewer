import type { ExactIdentities, PreviewIdentities } from "../domain/simulator/preview-identity";

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
const pendingPreviews = new Map<string, Promise<{ exact: boolean }>>();
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
 * Lets the tab frame the site and, with identities, makes each kind of
 * preview frame in the tab identify as that device's browser (null: the
 * browser's own; absent: unchanged). With `exact`, each named frame gets its
 * own device's browser through the debugger instead (null turns that off);
 * the result says whether the tab has that. Resolves once the frame can load.
 */
export async function preparePreview(url: string, identities?: PreviewIdentities | null, exact?: ExactIdentities | null): Promise<{ exact: boolean }> {
  if (!context || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return { exact: false };
  // Gallery frames share this setup, but still load independent documents.
  // Only coalesce in-flight work: a later reload rechecks the session rules.
  const key = `${identities === undefined ? "" : JSON.stringify(identities)}\n${exact === undefined ? "" : JSON.stringify(exact)}\n${url}`;
  const pending = pendingPreviews.get(key);
  if (pending) return pending;
  const preparation = (async () => {
    const result = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url, identities, exact });
    if (!result?.ok) throw new Error(result?.error ?? "Could not prepare the preview.");
    return { exact: result.exact === true };
  })();
  pendingPreviews.set(key, preparation);
  try { return await preparation; }
  finally { if (pendingPreviews.get(key) === preparation) pendingPreviews.delete(key); }
}

/**
 * The optional permission exact device identities need, asked for only when
 * the user turns them on. The viewer runs inside the website's page, which has
 * no permissions API, so the background answers for it; a request keeps the
 * user's click it was sent from, which Chrome's prompt requires.
 */
async function exactPermission(action: "contains" | "request"): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return false;
  const reply = await chrome.runtime.sendMessage({ type: "MDV_EXACT_PERMISSION", action }).catch(() => undefined);
  return reply?.granted === true;
}
export const hasExactPermission = () => exactPermission("contains");
/** Must run in direct response to the user's click, as Chrome shows its own prompt. */
export const requestExactPermission = () => exactPermission("request");
