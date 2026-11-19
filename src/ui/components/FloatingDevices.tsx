import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { useI18n } from "../../app/i18n";
import { useDeviceSets } from "../../app/useDeviceSets";
import { getViewerContext } from "../../app/viewer-context";
import { defaultDeviceIds } from "../../domain/device/device-catalog";
import { supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import { clampZoom, maxPreviewSlots } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { CloseIcon, ResizeGripIcon } from "../icons";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { displayControlGap, estimateDeviceFrameSize, framedDisplayRect } from "./DeviceFrame";
import { DevicePicker, type PickerTarget } from "./DevicePicker";
import { PreviewCard } from "./PreviewCard";
import { focusRing } from "./ui";

export const FLOATING_PICKER_EVENT = "mdv-open-floating-picker";
const addTarget: PickerTarget = { kind: "add" };
const windowSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight });
const cornerButton = "mdv-floating-control group/control absolute z-20 grid size-7 place-items-center rounded-full outline-none transition-opacity duration-100 motion-reduce:transition-none";
const cornerFace = "grid size-[18px] place-items-center rounded-full bg-surface text-muted ring-1 ring-line-soft shadow-lift group-hover/control:bg-surface-2 group-hover/control:text-ink";

export function FloatingDevices() {
  const viewer = getViewerContext()!;
  const { t } = useI18n();
  const { findDevice, removeCustomDevice } = useDeviceCatalog();
  const { slots, display, activeSlotId, addSlot, removeSlot, setSlotDevice, setActiveSlot, applyDevicePreset } = useSimulator();
  const sets = useDeviceSets(t);
  const [pickerOpen, setPickerOpen] = useState(slots.length === 0);
  const [bounds, setBounds] = useState(windowSize);
  const anchor = useRef<HTMLSpanElement>(null);
  const dismiss = useCallback(() => {
    if (!slots.length) viewer.close();
    else setPickerOpen(false);
  }, [slots.length, viewer]);

  useEffect(() => {
    const open = (event: Event) => {
      const deviceId = (event as CustomEvent<string | undefined>).detail;
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
  }, [viewer, slots, setActiveSlot, addSlot]);

  useEffect(() => {
    if (!pickerOpen) return;
    const host = (viewer.root.getRootNode() as ShadowRoot).host;
    const outside = (event: PointerEvent) => { if (!event.composedPath().includes(host)) dismiss(); };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [pickerOpen, viewer, dismiss]);

  useEffect(() => {
    const floatingDevices = slots.map(({ deviceId, canvasPosition, zoom, zoomMode }) => ({ deviceId, canvasPosition, scale: zoomMode === "custom" ? zoom : undefined }));
    void chrome.runtime.sendMessage({ type: "MDV_VIEWER_STATE", state: { floatingDevices } }).catch(() => {});
  }, [slots]);

  function remove(id: string) {
    if (slots.length === 1) viewer.close();
    else removeSlot(id);
  }

  return <div className={`pointer-events-none absolute inset-0 font-sans text-ink ${display.darkMode ? "dark" : ""}`}>
    <span ref={anchor} aria-hidden="true" className="absolute end-3 top-3" />
    {slots.map((slot, index) => <FloatingDevice key={slot.id} slot={slot} index={index} device={findDevice(slot.deviceId)}
      display={display} bounds={bounds} active={slot.id === activeSlotId} onClose={() => remove(slot.id)}/>)}
    <div className="pointer-events-auto contents">
      <DevicePicker open={pickerOpen} anchorRef={anchor} target={addTarget} slots={slots} maxSlots={maxPreviewSlots}
        sets={sets} onClose={dismiss} onAdd={id => { addSlot(id); setPickerOpen(false); }} onRemove={remove}
        onReplace={(slot, id) => { setSlotDevice(slot, id); setPickerOpen(false); }}
        onApplySet={ids => { applyDevicePreset(ids); setPickerOpen(false); }}
        onDeleteCustom={id => {
          slots.filter(slot => slot.deviceId === id).forEach(slot => setSlotDevice(slot.id, defaultDeviceIds[0]));
          removeCustomDevice(id);
        }}/>
    </div>
  </div>;
}

function FloatingDevice({ slot, device, display, bounds, index, active, onClose }: {
  slot: PreviewSlot; device: Device; display: DisplaySettings; bounds: Size; index: number; active: boolean; onClose: () => void;
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
  const controlRadius = 14;
  const inset = screen ? Math.min(controlRadius + displayControlGap, (Math.min(bounds.width, bounds.height) - 1) / 2) : 0;
  const maxScale = Math.min(1.6, (bounds.width - 2 * inset) / frame.width, (bounds.height - 2 * inset) / frame.height);
  const defaultScale = Math.min(1, 440 / frame.width, 540 / frame.height, maxScale);
  const clampScale = (value: number) => Math.min(maxScale, Math.max(0.2, value));
  const [liveScale, setLiveScale] = useState<number | null>(null);
  const scale = Math.min(maxScale, liveScale ?? (slot.zoomMode === "custom" ? slot.zoom : defaultScale));
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);
  const clampPosition = (x: number, y: number, w = width, h = height) => ({
    x: Math.max(inset, Math.min(x, bounds.width - w - inset)),
    y: Math.max(inset, Math.min(y, bounds.height - h - inset)),
  });
  const [livePosition, setLivePosition] = useState<{ x: number; y: number } | null>(null);
  const position = livePosition ?? slot.canvasPosition ?? {
    x: bounds.width - width - 16 - index * 32, y: 16 + index * 32,
  };
  const at = clampPosition(position.x, position.y);
  const resizedByDrag = useRef(false);
  const gripWidth = frame.width - (screen?.left ?? 0);
  const gripHeight = screen ? screen.top + screen.height : frame.height;

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

  // The lower-left grip grows toward the open page from the initial upper-right placement.
  function resizedPosition(next: number) {
    const w = Math.round(frame.width * next);
    return clampPosition(at.x + width - w, at.y, w, Math.round(frame.height * next));
  }
  function saveScale(next: number) {
    next = clampScale(clampZoom(next));
    setSlotZoom(slot.id, next);
    setSlotCanvasPosition(slot.id, resizedPosition(next));
    setLiveScale(null);
    setLivePosition(null);
  }
  function resize(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    resizedByDrag.current = false;
    let next = scale;
    startDrag(event, (dx, dy) => {
      if (!resizedByDrag.current && Math.hypot(dx, dy) < 3) return;
      resizedByDrag.current = true;
      const delta = (-dx * gripWidth + dy * gripHeight) / (gripWidth ** 2 + gripHeight ** 2);
      next = clampScale(scale + delta);
      setLiveScale(next);
      setLivePosition(resizedPosition(next));
    }, () => { if (resizedByDrag.current) saveScale(next); });
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
    <button type="button" data-floating-close className={`${cornerButton} right-0 top-0`} onClick={onClose}
      style={screen ? { right: (frame.width - screen.left - screen.width) * scale - controlRadius - displayControlGap, top: screen.top * scale - controlRadius - displayControlGap } : undefined}
      aria-label={`${t("removeDevice")} · ${device.name}`} title={t("removeDevice")}>
      <span className={cornerFace}><CloseIcon size={12}/></span>
    </button>
    <button type="button" data-floating-resize className={`${cornerButton} bottom-0 left-0 cursor-nesw-resize touch-none`}
      style={screen ? { left: screen.left * scale - controlRadius - displayControlGap, bottom: (frame.height - gripHeight) * scale - controlRadius - displayControlGap } : undefined}
      aria-label={`${t("resizeDevice")} · ${device.name}`} title={t("resizeDevice")}
      onPointerDown={resize} onClick={event => {
        if (event.detail > 0 && resizedByDrag.current) return;
        const alternate = defaultScale < maxScale - 0.01 ? defaultScale * 1.4 : defaultScale * 0.75;
        saveScale(clampScale(Math.abs(scale - defaultScale) < 0.01 ? alternate : defaultScale));
      }}
      onKeyDown={event => {
        const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        saveScale(clampScale(scale + direction * (event.shiftKey ? 0.1 : 0.025)));
      }}>
      <span className={cornerFace}><ResizeGripIcon size={10} className="-scale-x-100"/></span>
    </button>
  </section>;
}
