import { getViewerContext, type ViewerRestoreState } from "./viewer-context";

let latest: ViewerRestoreState = {};
let pending: ReturnType<typeof setTimeout> | undefined;

/**
 * Tell the background what to show again if this page reloads while the
 * viewer is open (a dev server's full reload, or F5). Only the in-page
 * viewer reports; the standalone simulator page is not affected by reloads.
 */
export function reportViewerState(state: Partial<ViewerRestoreState>) {
  if (!getViewerContext() || typeof chrome === "undefined" || !chrome.runtime?.id) return;
  latest = { ...latest, ...state };
  clearTimeout(pending);
  pending = setTimeout(() => {
    void chrome.runtime.sendMessage({ type: "MDV_VIEWER_STATE", state: latest }).catch(() => undefined);
  }, 200);
}
