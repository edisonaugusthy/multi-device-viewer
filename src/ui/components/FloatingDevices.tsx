import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { useI18n } from "../../app/i18n";
import { useDeviceSets } from "../../app/useDeviceSets";
import { getViewerContext } from "../../app/viewer-context";
import { defaultDeviceIds } from "../../domain/device/device-catalog";
import type { Device, Size } from "../../domain/device/device.types";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { CloseIcon, GripIcon, PlusIcon } from "../icons";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { estimateDeviceFrameSize } from "./DeviceFrame";
import { DevicePicker, type PickerTarget } from "./DevicePicker";
import { PreviewCard, shortName } from "./PreviewCard";
import { focusRing } from "./ui";

export const FLOATING_PICKER_EVENT = "mdv-open-floating-picker";
const addTarget: PickerTarget = { kind: "add" };
const windowSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight });
const gripHeight = 36;
const iconButton = "grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink " + focusRing;

export function FloatingDevices() {
  const viewer = getViewerContext()!;
  const { t } = useI18n();
  const { findDevice, removeCustomDevice } = useDeviceCatalog();
  const { slots, display, activeSlotId, addSlot, removeSlot, setSlotDevice, applyDevicePreset } = useSimulator();
  const sets = useDeviceSets(t);
  const [pickerOpen, setPickerOpen] = useState(slots.length === 0);
  const [bounds, setBounds] = useState(windowSize);
  const anchor = useRef<HTMLButtonElement>(null);
  const dismiss = useCallback(() => {
    if (!slots.length) viewer.close();
    else setPickerOpen(false);
  }, [slots.length, viewer]);

  useEffect(() => {
    const open = () => setPickerOpen(true);
    const resize = () => setBounds(windowSize());
    viewer.root.addEventListener(FLOATING_PICKER_EVENT, open);
    window.addEventListener("resize", resize);
    return () => {
      viewer.root.removeEventListener(FLOATING_PICKER_EVENT, open);
      window.removeEventListener("resize", resize);
    };
  }, [viewer]);

  useEffect(() => {
    if (!pickerOpen) return;
    const host = (viewer.root.getRootNode() as ShadowRoot).host;
    const outside = (event: PointerEvent) => { if (!event.composedPath().includes(host)) dismiss(); };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [pickerOpen, viewer, dismiss]);

  useEffect(() => {
    const floatingDevices = slots.map(({ deviceId, canvasPosition }) => ({ deviceId, canvasPosition }));
    void chrome.runtime.sendMessage({ type: "MDV_VIEWER_STATE", state: { floatingDevices } }).catch(() => {});
  }, [slots]);

  function remove(id: string) {
    if (slots.length === 1) viewer.close();
    else removeSlot(id);
  }

  return <div className={`pointer-events-none absolute inset-0 font-sans text-ink ${display.darkMode ? "dark" : ""}`}>
    <div className="pointer-events-auto absolute end-3 top-3 z-50 flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-float">
      <button type="button" ref={anchor} aria-expanded={pickerOpen} aria-haspopup="dialog"
        className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-sunken ${focusRing}`}
        onClick={() => pickerOpen ? dismiss() : setPickerOpen(true)}><PlusIcon size={15}/>{t("addDevice")}</button>
      <button type="button" aria-label={t("close")} title={t("close")} onClick={viewer.close} className={iconButton}><CloseIcon size={15}/></button>
    </div>
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
  const { setActiveSlot, setSlotCanvasPosition } = useSimulator();
  const startDrag = usePointerDrag();
  const frame = estimateDeviceFrameSize({ device, viewportSize: device.cssViewport, showFrame: true, showStatusBar: true, showUrlBar: true });
  const scale = Math.min(1, 440 / frame.width, 540 / frame.height,
    Math.max(1, bounds.width - 24) / frame.width, Math.max(1, bounds.height - gripHeight - 80) / frame.height);
  const width = Math.min(bounds.width, Math.max(154, Math.round(frame.width * scale) + 16));
  const height = Math.min(bounds.height, Math.round(frame.height * scale) + 16 + gripHeight);
  const limit = (x: number, y: number) => ({
    x: Math.max(0, Math.min(x, bounds.width - width)),
    y: Math.max(0, Math.min(y, bounds.height - height)),
  });
  const [position, setPosition] = useState(() => slot.canvasPosition ?? {
    x: bounds.width - width - 12 - index * 32, y: 64 + index * 32,
  });
  const at = limit(position.x, position.y);
  function commit(x: number, y: number) {
    const next = limit(x, y);
    setPosition(next);
    setSlotCanvasPosition(slot.id, next);
  }
  return <section aria-label={device.name} data-floating-device={device.id}
    className="pointer-events-auto absolute left-0 top-0 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
    style={{ width, height, zIndex: active ? 10 : 1, transform: `translate(${at.x}px,${at.y}px)` }}
    onPointerDownCapture={() => setActiveSlot(slot.id)} onFocusCapture={() => setActiveSlot(slot.id)}>
    <header className="flex shrink-0 items-center border-b border-line-soft ps-1" style={{ height: gripHeight }}>
      <button type="button" aria-label={`${t("moveDevice")} · ${device.name}`} title={t("moveDevice")}
        className={`flex h-full min-w-0 flex-1 cursor-grab touch-none items-center gap-1.5 rounded-lg px-1 text-start text-xs font-semibold select-none active:cursor-grabbing ${focusRing}`}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.currentTarget.focus({ preventScroll: true });
          let next = at;
          startDrag(event, (dx, dy) => { next = limit(at.x + dx, at.y + dy); setPosition(next); }, () => commit(next.x, next.y));
        }}
        onKeyDown={event => {
          const step = event.shiftKey ? 32 : 8;
          const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
          const delta = arrows[event.key];
          if (delta) { event.preventDefault(); commit(at.x + delta[0], at.y + delta[1]); }
        }}><GripIcon size={14}/><span className="truncate">{shortName(device.name)}</span></button>
      <button type="button" className={iconButton} onClick={onClose} aria-label={`${t("removeDevice")} · ${device.name}`}><CloseIcon size={15}/></button>
    </header>
    <div className="min-h-0 flex-1">
      <PreviewCard slot={slot} device={device} display={display} focused={false} first={false} last={false}
        showToolbar={false} externalDragHandle removable={false}/>
    </div>
  </section>;
}
