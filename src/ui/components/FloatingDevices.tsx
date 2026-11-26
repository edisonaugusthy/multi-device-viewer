import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { useI18n } from "../../app/i18n";
import { useDeviceSets } from "../../app/useDeviceSets";
import { getViewerContext } from "../../app/viewer-context";
import { usePopOut } from "../../app/popout";
import { useAutoReload, useAutoReloadSetting } from "../../app/useAutoReload";
import { useFloatingPlacement } from "../hooks/useFloatingPlacement";
import { defaultDeviceIds } from "../../domain/device/device-catalog";
import { supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import { clampZoom, maxPreviewSlots } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { CloseIcon, PopOutIcon } from "../icons";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { displayControlGap, estimateDeviceFrameSize, framedDisplayRect } from "./DeviceFrame";
import { DevicePicker, type PickerTarget } from "./DevicePicker";
import { PreviewCard } from "./PreviewCard";
import { focusRing } from "./ui";

export const FLOATING_PICKER_EVENT = "mdv-open-floating-picker";
const addTarget: PickerTarget = { kind: "add" };
const windowSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight });
const floatingControl = "mdv-floating-control absolute z-20 outline-none";
// The move-and-close tab sits this far above the screen, and needs this much room in the window.
const tabGap = 6;
const tabHeight = 16;
const tabRoom = tabGap + tabHeight + 4;

export function FloatingDevices() {
  const viewer = getViewerContext()!;
  const { t } = useI18n();
  const { findDevice, removeCustomDevice } = useDeviceCatalog();
  const { slots, display, activeSlotId, addSlot, removeSlot, setSlotDevice, setActiveSlot, applyDevicePreset, getSlotUrl, reloadAllSlots } = useSimulator();
  const sets = useDeviceSets(t);
  const popOut = usePopOut();
  // Chosen in the workspace's settings; floating devices have no settings of their own.
  const [autoReload] = useAutoReloadSetting();
  useAutoReload({ enabled: autoReload, awake: popOut.slotId !== null, pages: () => slots.map(slot => getSlotUrl(slot.id)), onChange: reloadAllSlots });
  const placement = useFloatingPlacement(viewer.placement);
  const choosePlacement = placement?.onChange;
  const onTop = placement?.value === "top";
  // A reload that finds nothing left on the page (its only device was in the
  // on-top window, which Chrome closed with the reload) leaves the page alone.
  const nothingToRestore = viewer.restore?.floatingDevices?.length === 0;
  useEffect(() => { if (nothingToRestore) viewer.close(); }, [nothingToRestore, viewer]);
  const [pickerOpen, setPickerOpen] = useState(slots.length === 0 && !nothingToRestore);
  const [bounds, setBounds] = useState(windowSize);
  const anchor = useRef<HTMLSpanElement>(null);
  const dismiss = useCallback(() => {
    if (!slots.length) viewer.close();
    else setPickerOpen(false);
  }, [slots.length, viewer]);

  useEffect(() => {
    const open = (event: Event) => {
      const { deviceId, placement: asked } = (event as CustomEvent<{ deviceId?: string; placement?: "page" | "top" }>).detail ?? {};
      if (asked) choosePlacement?.(asked);
      if (!deviceId) { setPickerOpen(true); return; }
      const existing = slots.find(slot => slot.deviceId === deviceId);
      if (existing) setActiveSlot(existing.id);
      else if (slots.length < maxPreviewSlots) addSlot(deviceId);
      else { setPickerOpen(true); return; }
      setPickerOpen(false);
    };
    const resize = () => setBounds(windowSize());
    viewer.root.addEventListener(FLOATING_PICKER_EVENT, open);
    window.addEventListener("resize", resize);
    return () => {
      viewer.root.removeEventListener(FLOATING_PICKER_EVENT, open);
      window.removeEventListener("resize", resize);
    };
  }, [viewer, slots, setActiveSlot, addSlot, choosePlacement]);

  useEffect(() => {
    if (!pickerOpen) return;
    const host = (viewer.root.getRootNode() as ShadowRoot).host;
    const outside = (event: PointerEvent) => { if (!event.composedPath().includes(host)) dismiss(); };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [pickerOpen, viewer, dismiss]);

  useEffect(() => {
    // A device in the on-top window is not remembered: once that window is gone, so is the device.
    const floatingDevices = slots.filter(slot => slot.id !== popOut.slotId)
      .map(({ deviceId, canvasPosition, zoom, zoomMode }) => ({ deviceId, canvasPosition, scale: zoomMode === "custom" ? zoom : undefined }));
    void chrome.runtime.sendMessage({ type: "MDV_VIEWER_STATE", state: { floatingDevices } }).catch(() => {});
  }, [slots, popOut.slotId]);

  function remove(id: string) {
    if (slots.length === 1) viewer.close();
    else removeSlot(id);
  }

  return <div className={`pointer-events-none absolute inset-0 font-sans text-ink ${display.darkMode ? "dark" : ""}`}>
    <span ref={anchor} aria-hidden="true" className="absolute end-3 top-3" />
    {/* A device in its own always-on-top window is not on the page; closing that window closes the device. */}
    {slots.map((slot, index) => slot.id === popOut.slotId ? null : <FloatingDevice key={slot.id} slot={slot} index={index} device={findDevice(slot.deviceId)}
      display={display} bounds={bounds} active={slot.id === activeSlotId} onClose={() => remove(slot.id)}
      onPopOut={popOut.supported ? () => popOut.open(slot.id) : undefined}/>)}
    <div className="pointer-events-auto contents">
      {/* With "on top" chosen, a pick opens the window in that same click: a
          new device goes straight into it, and one already on the page moves there. */}
      <DevicePicker open={pickerOpen} anchorRef={anchor} target={addTarget} slots={slots} maxSlots={maxPreviewSlots} placement={placement}
        sets={sets} onClose={dismiss} onAdd={id => { if (onTop) popOut.openDevice(id); addSlot(id); setPickerOpen(false); }}
        onRemove={id => { if (onTop) { popOut.open(id); setPickerOpen(false); } else remove(id); }}
        onReplace={(slot, id) => { setSlotDevice(slot, id); setPickerOpen(false); }}
        onApplySet={ids => { applyDevicePreset(ids); setPickerOpen(false); }}
        onDeleteCustom={id => {
          slots.filter(slot => slot.deviceId === id).forEach(slot => setSlotDevice(slot.id, defaultDeviceIds[0]));
          removeCustomDevice(id);
        }}/>
    </div>
  </div>;
}

function FloatingDevice({ slot, device, display, bounds, index, active, onClose, onPopOut }: {
  slot: PreviewSlot; device: Device; display: DisplaySettings; bounds: Size; index: number; active: boolean; onClose: () => void; onPopOut?: () => void;
}) {
  const { t } = useI18n();
  const { setActiveSlot, setSlotCanvasPosition, setSlotZoom } = useSimulator();
  const startDrag = usePointerDrag();
  // Pointer capture sets focus before the browser's usual mouse focus action.
  const [pointerFocus, setPointerFocus] = useState(false);
  const canRotate = supportsOrientation(device);
  const orientation = canRotate ? slot.orientation : "portrait";
  const viewportSize = canRotate ? toLandscapeAwareSize(device.cssViewport, orientation) : device.cssViewport;
  const frame = estimateDeviceFrameSize({ device, viewportSize, showFrame: true, showStatusBar: true, showUrlBar: true });
  const screen = framedDisplayRect(device, frame, viewportSize, orientation);
  const panel = screen ?? { left: 0, top: 0, ...frame };
  const resizeGrip = useRef<HTMLDivElement>(null);
  // Leave room for the corner bracket at the window edges.
  const inset = Math.min(screen ? 9 + displayControlGap : 20, (Math.min(bounds.width, bounds.height) - 1) / 2);
  const maxScale = Math.min(1.6, (bounds.width - 2 * inset) / frame.width, (bounds.height - 2 * inset) / frame.height);
  const clampScale = (value: number) => Math.min(maxScale, Math.max(0.2, value));
  const defaultScale = clampScale(Math.min(1, 440 / frame.width, 540 / frame.height));
  const [liveScale, setLiveScale] = useState<number | null>(null);
  const scale = Math.min(maxScale, liveScale ?? (slot.zoomMode === "custom" ? slot.zoom : defaultScale));
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);
  const clampPosition = (x: number, y: number, w = width, h = height) => {
    // Keep the tab above the screen inside the window too.
    const top = Math.min(Math.max(inset, tabRoom - panel.top * (w / frame.width)), Math.max(inset, bounds.height - h - inset));
    return {
      x: Math.max(inset, Math.min(x, bounds.width - w - inset)),
      y: Math.max(top, Math.min(y, bounds.height - h - inset)),
    };
  };
  const [livePosition, setLivePosition] = useState<{ x: number; y: number } | null>(null);
  const position = livePosition ?? slot.canvasPosition ?? {
    x: bounds.width - width - 16 - index * 32, y: 16 + index * 32,
  };
  const at = clampPosition(position.x, position.y);

  function move(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as Element).closest("button, a, input, textarea, select, [data-mobile-keyboard]")) return;
    event.currentTarget.focus({ preventScroll: true });
    let next = at;
    startDrag(event, (dx, dy) => {
      next = clampPosition(at.x + dx, at.y + dy);
      setLivePosition(next);
    }, () => {
      setSlotCanvasPosition(slot.id, next);
      setLivePosition(null);
    });
  }

  // The lower-left bracket resizes around the screen's upper-right corner, which stays put.
  function resizedPosition(next: number) {
    return clampPosition(at.x + (scale - next) * (panel.left + panel.width), at.y + (scale - next) * panel.top,
      Math.round(frame.width * next), Math.round(frame.height * next));
  }
  function saveScale(next: number) {
    next = clampScale(clampZoom(next));
    setSlotZoom(slot.id, next);
    setSlotCanvasPosition(slot.id, resizedPosition(next));
  }
  function resize(event: React.PointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();
    resizeGrip.current?.focus({ preventScroll: true });
    let next = scale;
    const axisX = -panel.width, axisY = panel.height;
    startDrag(event, (dx, dy) => {
      const delta = (dx * axisX + dy * axisY) / (axisX * axisX + axisY * axisY);
      next = clampScale(scale + delta);
      setLiveScale(next);
      setLivePosition(resizedPosition(next));
    }, () => {
      if (next !== scale) saveScale(next);
      setLiveScale(null);
      setLivePosition(null);
    });
  }
  function resizeWithKeys(event: React.KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.025;
    const sizes: Record<string, number> = {
      ArrowRight: scale + step, ArrowUp: scale + step, ArrowLeft: scale - step, ArrowDown: scale - step,
      Home: 0.2, End: maxScale,
    };
    const next = sizes[event.key];
    if (typeof next !== "number") return;
    event.preventDefault();
    saveScale(next);
  }

  return <section aria-label={`${device.name} · ${t("moveDevice")}`} tabIndex={0} data-floating-device={device.id}
    data-pointer-focus={pointerFocus || undefined}
    className={`absolute left-0 top-0 cursor-grab touch-none rounded-2xl active:cursor-grabbing ${pointerFocus ? "outline-none" : focusRing}`}
    style={{ width, height, zIndex: active ? 10 : 1, transform: `translate(${at.x}px,${at.y}px)` }}
    onPointerDownCapture={() => { setPointerFocus(true); setActiveSlot(slot.id); }}
    onKeyDownCapture={() => setPointerFocus(false)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPointerFocus(false); }}
    onFocusCapture={() => setActiveSlot(slot.id)}
    onPointerDown={move} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      const step = event.shiftKey ? 32 : 8;
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const delta = arrows[event.key];
      if (!delta) return;
      event.preventDefault();
      setSlotCanvasPosition(slot.id, clampPosition(at.x + delta[0], at.y + delta[1]));
    }}>
    <PreviewCard slot={slot} device={device} display={display} focused={false} first={false} last={false}
      showToolbar={false} floatingScale={scale} removable={false}/>
    {/* A small tab above the screen: the dots drag the device, the window icon keeps it on top of other apps, the × closes it. */}
    <div data-floating-tab className={`${floatingControl} flex -translate-x-1/2 items-center rounded-full bg-surface ps-[3px] pe-px text-muted shadow-[0_0_0_1px_var(--mdv-line),0_1px_4px_rgb(20_23_26/0.12)]`}
      style={{ left: (panel.left + panel.width / 2) * scale, top: panel.top * scale - tabGap - tabHeight, height: tabHeight }}>
      <span aria-hidden="true" title={t("moveDevice")} className="grid h-4 w-[18px] cursor-grab place-items-center text-faint">
        <svg width="10" height="4" viewBox="0 0 10 4" fill="currentColor"><circle cx="1.2" cy="0.9" r="0.8"/><circle cx="5" cy="0.9" r="0.8"/><circle cx="8.8" cy="0.9" r="0.8"/><circle cx="1.2" cy="3.1" r="0.8"/><circle cx="5" cy="3.1" r="0.8"/><circle cx="8.8" cy="3.1" r="0.8"/></svg>
      </span>
      <span aria-hidden="true" className="mx-px h-2 w-px bg-line-soft"/>
      {onPopOut && <>
        <button type="button" data-floating-popout onClick={onPopOut}
          className="group/pop -my-[5px] grid h-6 w-[18px] cursor-pointer place-items-center rounded-full outline-none"
          aria-label={`${t("popOut")} · ${device.name}`} title={t("popOut")}>
          <span className="grid size-3.5 place-items-center rounded-full group-hover/pop:bg-sunken group-hover/pop:text-ink"><PopOutIcon size={9} strokeWidth={2.6}/></span>
        </button>
        <span aria-hidden="true" className="mx-px h-2 w-px bg-line-soft"/>
      </>}
      {/* The visible × is 14 px; its target reaches 24 px past the tab's edges. */}
      <button type="button" data-floating-close onClick={onClose}
        className="group/close -m-[5px] grid size-6 cursor-pointer place-items-center rounded-full outline-none"
        aria-label={`${t("close")} · ${device.name}`} title={t("close")}>
        <span className="grid size-3.5 place-items-center rounded-full group-hover/close:bg-sunken group-hover/close:text-ink"><CloseIcon size={6} strokeWidth={3.4}/></span>
      </button>
    </div>
    {/* A white bracket hugging the lower-left screen corner resizes from that corner. */}
    <div ref={resizeGrip} data-floating-resize role="slider" tabIndex={0}
      className={`${floatingControl} size-6 cursor-nesw-resize touch-none`}
      style={{ left: panel.left * scale - 8, top: (panel.top + panel.height) * scale - 16 }}
      title={t("resizeDevice")} aria-label={`${t("resizeDevice")} · ${device.name}`}
      aria-valuemin={Math.round(clampScale(0.2) * 100)} aria-valuemax={Math.round(maxScale * 100)}
      aria-valuenow={Math.round(scale * 100)} aria-valuetext={`${Math.round(scale * 100)}%`}
      onKeyDown={resizeWithKeys} onPointerDown={resize}>
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 6v13h13" stroke="rgb(20 23 26 / 0.18)" strokeWidth="5.5"/>
        <path d="M5 6v13h13" stroke="var(--mdv-surface)" strokeWidth="3.5"/>
      </svg>
    </div>
  </section>;
}
