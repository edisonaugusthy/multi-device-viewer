import { getViewerContext } from "./viewer-context";
import type { Conditions } from "../domain/simulator/preview-conditions";
import type { PreviewDiagnostics } from "../domain/simulator/preview-diagnostics";
import type { LayoutCause } from "../domain/layout-check/layout-cause";

/**
 * The viewer's side of the debugger features: the background holds Chrome's
 * debugger for the tab and answers here. Outside the in-page viewer (the
 * standalone simulator page) there is no tab to debug, and every call says so.
 */
type Diagnostics = Record<string, PreviewDiagnostics>;
let diagnostics: Diagnostics = {};
const listeners = new Set<() => void>();
const canAsk = () => Boolean(getViewerContext()) && typeof chrome !== "undefined" && Boolean(chrome.runtime?.sendMessage);

function setDiagnostics(next: Diagnostics) {
  diagnostics = next;
  for (const listener of listeners) listener();
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(message => {
    if (getViewerContext() && message?.type === "MDV_DIAGNOSTICS" && message.previews && typeof message.previews === "object") setDiagnostics(message.previews as Diagnostics);
  });
}

/** Each preview's problems and download size, by preview frame name; for useSyncExternalStore. */
export const diagnosticsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1 && canAsk()) {
      void chrome.runtime.sendMessage({ type: "MDV_DIAGNOSTICS_GET" }).then(result => {
        if (result?.ok && result.previews) setDiagnostics(result.previews as Diagnostics);
      }).catch(() => undefined);
    }
    return () => { listeners.delete(listener); };
  },
  get: () => diagnostics,
};

// A color scheme set in Conditions applies to the whole tab, the viewer included.
// The viewer keeps its own theme: scheme changes while one is set, and just
// after it is set or cleared, are not the system's.
let emulatedScheme: Conditions["scheme"] = "system";
let schemeQuietUntil = 0;
const SCHEME_SETTLE_MS = 1500;
export const colorSchemeEmulated = () => emulatedScheme !== "system" || Date.now() < schemeQuietUntil;

/** Apply conditions to the tab. False when the debugger is not attached. */
export async function applyConditions(conditions: Conditions): Promise<boolean> {
  if (!canAsk()) return false;
  if (conditions.scheme !== emulatedScheme) {
    emulatedScheme = conditions.scheme;
    schemeQuietUntil = Date.now() + SCHEME_SETTLE_MS;
  }
  const result = await chrome.runtime.sendMessage({ type: "MDV_CONDITIONS", conditions }).catch(() => undefined);
  return result?.ok === true && result.applied === true;
}

/** A PNG of part of the page, in CSS pixels of the viewer, drawn at `scale`; null without the debugger. */
export async function captureArea(clip: { x: number; y: number; width: number; height: number; scale: number }, still = false): Promise<string | null> {
  if (!canAsk()) return null;
  // Laying the page out past the window is needed only for an area the window does not show.
  const beyond = clip.x < scrollX || clip.y < scrollY || clip.x + clip.width > scrollX + innerWidth || clip.y + clip.height > scrollY + innerHeight;
  const result = await chrome.runtime.sendMessage({ type: "MDV_CAPTURE_FRAME", clip, still, beyond }).catch(() => undefined);
  return result?.ok && typeof result.dataUrl === "string" ? result.dataUrl : null;
}

/** The CSS rule behind a layout problem, or null when it cannot be found. */
export async function findLayoutCause(frameName: string, selector: string): Promise<LayoutCause | null> {
  if (!canAsk()) return null;
  const result = await chrome.runtime.sendMessage({ type: "MDV_LAYOUT_CAUSE", frameName, selector }).catch(() => undefined);
  return result?.ok ? result.cause ?? null : null;
}
