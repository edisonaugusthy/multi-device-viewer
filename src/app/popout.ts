// One device in its own always-on-top window (Chrome's Document
// Picture-in-Picture), so it stays visible above an editor or any other app.
// The window belongs to the website tab: its document has the website's
// origin, so a preview inside it keeps the tab's login like one on the page.
import { createContext, useContext } from "react";
import type { Size } from "../domain/device/device.types";
import { registerViewerFonts } from "../ui/fonts";
import { POPOUT_RELAY_READY } from "./preview-frame";
import { getViewerContext } from "./viewer-context";

export type PopOutWindow = Window & typeof globalThis;
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<PopOutWindow>;
}

export interface PopOutValue {
  /** Whether this page can show a device in its own window. */
  supported: boolean;
  /** The device shown in that window now. */
  slotId: string | null;
  /** Call from a click: Chrome opens the window only on a user action. */
  open: (slotId: string) => void;
  /** Opens the window for a device about to be added as a floating preview. Call from a click. */
  openDevice: (deviceId: string) => void;
  close: () => void;
}
export const PopOutContext = createContext<PopOutValue>({ supported: false, slotId: null, open() {}, openDevice() {}, close() {} });
export const usePopOut = () => useContext(PopOutContext);

/** Chrome offers the window only to secure pages (HTTPS or localhost), from Chrome 116. */
export function popOutApi(): DocumentPictureInPicture | undefined {
  if (typeof window === "undefined" || typeof chrome === "undefined" || !chrome.runtime?.id) return undefined;
  if (!getViewerContext()?.styles) return undefined;
  return (window as Window & { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture;
}

/** Where a device chosen for a floating preview goes: over this page, or its own window above every app. */
export type FloatingPlacement = "page" | "top";

// A window opened by the click that chose a device, before that device has a
// preview to show in it. Choosing from the workspace replaces the workspace
// with the floating view, so the window waits here for that view to take it.
export interface PopOutOffer { win: PopOutWindow; deviceId: string }
let offer: PopOutOffer | null = null;
const offerListeners = new Set<() => void>();
export function offerPopOut(next: PopOutOffer): void {
  offer = next;
  const drop = () => { if (offer === next) offer = null; };
  next.win.addEventListener("pagehide", drop, { once: true });
  // An unclaimed window (the preview failed to open) does not stay empty.
  window.setTimeout(() => { if (offer === next) { drop(); next.win.close(); } }, 8000);
  offerListeners.forEach(listener => listener());
}
export function takePopOut(accepts: (deviceId: string) => boolean): PopOutOffer | null {
  if (!offer || !accepts(offer.deviceId)) return null;
  const taken = offer;
  offer = null;
  return taken;
}
export function onPopOutOffer(listener: () => void): () => void {
  offerListeners.add(listener);
  return () => { offerListeners.delete(listener); };
}

/** Chrome's own title bar on the window, which its height limit (about 80% of the screen) includes. */
const WINDOW_TITLE_BAR = 34;

/** A window the device's own shape, so the device fills it, without covering much of the screen. */
export function popOutWindowSize(frame: Size, screen: Size): Size {
  const maxWidth = Math.max(240, Math.min(560, screen.width * 0.5));
  const maxHeight = Math.max(240, Math.min(800, screen.height * 0.8 - WINDOW_TITLE_BAR));
  const scale = Math.min(1, maxWidth / frame.width, maxHeight / frame.height);
  return { width: Math.round(frame.width * scale), height: Math.round(frame.height * scale) };
}

/** The largest scale at which the whole device fits the window. */
export function popOutScale(frame: Size, bounds: Size): number {
  return Math.max(0.1, Math.min(1.6, bounds.width / frame.width, bounds.height / frame.height));
}

/**
 * Gives the new window the viewer's styles and fonts, passes its preview
 * frames' messages on to the viewer, and loads the relay that sends the
 * viewer's messages to those frames. Resolves with the element to render into.
 */
export function preparePopOutWindow(win: PopOutWindow, styles: string): Promise<HTMLElement> {
  const doc = win.document;
  const sheet = new win.CSSStyleSheet();
  sheet.replaceSync(`${styles}\nhtml,body,#root{height:100%;overflow:hidden}`);
  doc.adoptedStyleSheets = [sheet];
  registerViewerFonts(path => chrome.runtime.getURL(`/${path}`), win);
  const container = doc.createElement("div");
  container.id = "root";
  doc.body.append(container);
  // A preview frame reports to its parent, which is the new window. The
  // viewer listens on the website tab's window, so hand each report over.
  win.addEventListener("message", (event: MessageEvent) => {
    if (!event.source || event.source === window) return;
    window.dispatchEvent(new MessageEvent("message", { data: event.data, origin: event.origin, source: event.source }));
  });
  return new Promise((resolve, reject) => {
    const finish = (ready: boolean) => {
      window.removeEventListener("message", onReady);
      window.clearTimeout(timer);
      if (ready) resolve(container); else reject(new Error("The pop-out window could not load its relay."));
    };
    const onReady = (event: MessageEvent) => { if (event.source === win && event.data?.type === POPOUT_RELAY_READY) finish(true); };
    window.addEventListener("message", onReady);
    const timer = window.setTimeout(() => finish(false), 3000);
    const script = doc.createElement("script");
    script.src = chrome.runtime.getURL("/popout-relay.js");
    script.onerror = () => finish(false);
    doc.head.append(script);
  });
}
