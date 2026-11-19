import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import {
  PopOutContext, offerPopOut, onPopOutOffer, popOutApi, popOutScale, popOutWindowSize, preparePopOutWindow, takePopOut,
  type PopOutValue, type PopOutWindow,
} from "../../app/popout";
import { getViewerContext } from "../../app/viewer-context";
import { supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { estimateDeviceFrameSize } from "./DeviceFrame";
import { PreviewCard } from "./PreviewCard";
import { cx } from "./ui";

interface Open { slotId: string; win: PopOutWindow; container: HTMLElement | null }

type Shown = Pick<PreviewSlot, "orientation" | "showFrame">;
function viewportOf(slot: Shown, device: Device): Size {
  return supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport;
}
function frameOf(slot: Shown, device: Device, display: DisplaySettings): Size {
  const viewportSize = viewportOf(slot, device);
  if (display.previewStyle === "free") return viewportSize;
  return estimateDeviceFrameSize({ device, viewportSize, showFrame: slot.showFrame, showStatusBar: true, showUrlBar: true });
}

/** Moves a floating device into an always-on-top window, and renders that window. */
export function PopOutProvider({ children }: { children: ReactNode }) {
  const { slots, display, removeSlot } = useSimulator();
  const { findDevice } = useDeviceCatalog();
  const [open, setOpen] = useState<Open | null>(null);
  const latest = useRef({ slots, display, findDevice, open, removeSlot });
  latest.current = { slots, display, findDevice, open, removeSlot };
  const supported = Boolean(popOutApi());
  // Windows the viewer closed itself. Any other close is the person's (the
  // window's own close or back-to-tab button), and closes the device with it.
  const closedHere = useRef(new WeakSet<PopOutWindow>());
  const shut = (win: PopOutWindow) => { closedHere.current.add(win); win.close(); };

  const close = useCallback(() => {
    const win = latest.current.open?.win;
    if (win) shut(win);
    setOpen(null);
  }, []);
  // Closing the window closes its device for good: it does not come back onto
  // the page. The last device takes the floating view with it.
  const dismiss = useCallback((slotId: string) => {
    const { slots, removeSlot } = latest.current;
    if (!slots.some(slot => slot.id === slotId)) return;
    if (slots.length === 1) getViewerContext()?.close();
    else removeSlot(slotId);
  }, []);
  const adopt = useCallback((slotId: string, win: PopOutWindow) => {
    const styles = getViewerContext()?.styles;
    if (!styles) { win.close(); return; }
    setOpen({ slotId, win, container: null });
    win.addEventListener("pagehide", () => {
      setOpen(current => current?.win === win ? null : current);
      if (!closedHere.current.has(win)) dismiss(slotId);
    }, { once: true });
    preparePopOutWindow(win, styles)
      .then(container => setOpen(current => current?.win === win ? { ...current, container } : current))
      // A window that could not be set up closes; its device stays where it was.
      .catch(error => { console.warn("Mobile View:", error); shut(win); });
  }, [dismiss]);
  const screenSize = () => ({ width: window.screen.availWidth, height: window.screen.availHeight });
  // Chrome shows one such window at a time and closes the last one itself.
  const show = useCallback((slotId: string) => {
    const api = popOutApi();
    const { slots, display, findDevice } = latest.current;
    const slot = slots.find(candidate => candidate.id === slotId);
    if (!api || !slot) return;
    void api.requestWindow(popOutWindowSize(frameOf(slot, findDevice(slot.deviceId), display), screenSize()))
      .then(win => adopt(slotId, win)).catch(() => undefined);
  }, [adopt]);
  const showDevice = useCallback((deviceId: string) => {
    const api = popOutApi();
    if (!api) return;
    const { display, findDevice } = latest.current;
    const frame = frameOf({ orientation: "portrait", showFrame: true }, findDevice(deviceId), display);
    void api.requestWindow(popOutWindowSize(frame, screenSize())).then(win => offerPopOut({ win, deviceId })).catch(() => undefined);
  }, []);

  // The floating view takes a window opened for a device once that device is
  // on the page. The workspace never does: choosing there replaces it.
  const floating = getViewerContext()?.mode === "floating";
  const [offers, setOffers] = useState(0);
  useEffect(() => floating ? onPopOutOffer(() => setOffers(count => count + 1)) : undefined, [floating]);
  useEffect(() => {
    if (!floating) return;
    const taken = takePopOut(deviceId => slots.some(slot => slot.deviceId === deviceId));
    if (taken) adopt(slots.findLast(slot => slot.deviceId === taken.deviceId)!.id, taken.win);
  }, [floating, slots, offers, adopt]);

  // A removed device takes its window with it; so does closing the viewer.
  const missing = open !== null && !slots.some(slot => slot.id === open.slotId);
  useEffect(() => { if (missing) close(); }, [missing, close]);
  useEffect(() => () => { const win = latest.current.open?.win; if (win) shut(win); }, []);

  const value = useMemo<PopOutValue>(() => ({ supported, slotId: open?.slotId ?? null, open: show, openDevice: showDevice, close }), [supported, open?.slotId, show, showDevice, close]);
  const slot = open && slots.find(candidate => candidate.id === open.slotId);
  return <PopOutContext.Provider value={value}>
    {children}
    {open?.container && slot && createPortal(
      <PopOutDevice slot={slot} device={findDevice(slot.deviceId)} display={display} win={open.win}/>, open.container)}
  </PopOutContext.Provider>;
}

/** The window shows the device and nothing else, on the viewer's usual
 * background. Chrome's own title bar closes it or sends it back to the tab. */
function PopOutDevice({ slot, device, display, win }: {
  slot: PreviewSlot; device: Device; display: DisplaySettings; win: PopOutWindow;
}) {
  const [bounds, setBounds] = useState<Size>(() => ({ width: win.innerWidth, height: win.innerHeight }));
  const frame = frameOf(slot, device, display);
  const shape = `${frame.width}x${frame.height}`;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  // The window hugs the device, so nothing shows beside it. Chrome may have
  // reopened the window at a size the person left it at, or the device may
  // have turned: `fresh` asks for the device's own size, otherwise the
  // device's shape at about the window's current size.
  const hug = useCallback((fresh: boolean) => {
    const frame = frameRef.current;
    const inner = { width: win.innerWidth, height: win.innerHeight };
    const next = fresh
      ? popOutWindowSize(frame, { width: win.screen.availWidth, height: win.screen.availHeight })
      : (() => { const scale = popOutScale(frame, inner); return { width: Math.round(frame.width * scale), height: Math.round(frame.height * scale) }; })();
    if (Math.abs(next.width - inner.width) < 2 && Math.abs(next.height - inner.height) < 2) return;
    try { win.resizeTo(next.width + win.outerWidth - inner.width, next.height + win.outerHeight - inner.height); } catch { /* Chrome refused; the device still fits. */ }
  }, [win]);
  useEffect(() => {
    let settle: number | undefined;
    const resize = () => {
      setBounds({ width: win.innerWidth, height: win.innerHeight });
      // After the person resizes the window, close up the space beside the device.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => hug(false), 350);
    };
    win.addEventListener("resize", resize);
    resize();
    return () => { win.removeEventListener("resize", resize); window.clearTimeout(settle); };
  }, [win, hug]);
  const firstShape = useRef(shape);
  useEffect(() => {
    if (firstShape.current === shape) return;
    firstShape.current = shape;
    hug(true);
  }, [shape, hug]);
  useEffect(() => { win.document.title = device.name; }, [win, device.name]);
  const scale = popOutScale(frame, bounds);

  return <div data-popout-device={device.id} className={cx("flex h-full items-center justify-center bg-stage", display.darkMode && "dark")}>
    <div className="shrink-0" style={{ width: Math.round(frame.width * scale), height: Math.round(frame.height * scale) }}>
      <PreviewCard slot={slot} device={device} display={display} focused={false} first={false} last={false}
        showToolbar={false} floatingScale={scale} removable={false}/>
    </div>
  </div>;
}
