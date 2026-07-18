import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  supportsOrientation,
  toLandscapeAwareSize,
} from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import type {
  DisplaySettings,
  PreviewSlot,
} from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { DeviceFrame, estimateDeviceFrameSize } from "./DeviceFrame";

const CARD_PAD = 16;

interface ScrollSyncPayload {
  slotId: string;
  scrollLeft: number;
  scrollTop: number;
  deltaLeft: number;
  deltaTop: number;
  scrollHeight?: number;
  scrollWidth?: number;
  viewportHeight?: number;
  viewportWidth?: number;
  scrollTargetSelector?: string;
}

interface InteractionSyncPayload {
  slotId: string;
  kind: string;
  selector?: string;
  x?: number;
  y?: number;
  value?: string;
  checked?: boolean;
  inputType?: string;
  key?: string;
  code?: string;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

interface PreviewCardProps {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
  showToolbar?: boolean;
  removable: boolean;
  onCapture: () => void;
  focused: boolean;
  first: boolean;
  last: boolean;
  onToggleFocus: () => void;
  designOverlay?: {
    image: string;
    opacity: number;
    adjusting: boolean;
    placement?: { x: number; y: number; width: number; height: number };
    onPlacementChange: (placement: { x: number; y: number; width: number; height: number }) => void;
  };
}

type BridgeStatus = "checking" | "ready" | "unavailable" | "blocked";

export function PreviewCard({
  slot,
  device,
  display,
  showToolbar = true,
  removable,
  onCapture,
  focused,
  first,
  last,
  onToggleFocus,
  designOverlay,
}: PreviewCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bridgeStatusTimer = useRef<number | undefined>(undefined);
  const bridgeStatusRef = useRef<BridgeStatus>("checking");
  const previousScrollSyncRef = useRef(display.scrollSync);
  const previousNavigationUrlRef = useRef(slot.url);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [blocked, setBlocked] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("checking");
  const {
    activeSlotId,
    setActiveSlot,
    removeSlot,
    rotateSlot,
    zoomSlot,
    setSlotDevice,
    setSlotUrl,
    reloadSlot,
    moveSlot,
  } = useSimulator();

  const canRotate = supportsOrientation(device);
  const effectiveOrientation = canRotate ? slot.orientation : "portrait";
  const viewportSize = canRotate
    ? toLandscapeAwareSize(device.cssViewport, effectiveOrientation)
    : device.cssViewport;

  // Device chrome is always visible — no runtime toggle. Pass constants.
  const SHOW_CHROME = { showStatusBar: true, showUrlBar: true, showBattery: true } as const;

  const frameSize = estimateDeviceFrameSize({
    device,
    showFrame: slot.showFrame,
    showStatusBar: SHOW_CHROME.showStatusBar,
    showUrlBar: SHOW_CHROME.showUrlBar,
    viewportSize,
  });

  const horizontalPad = device.type === "laptop" || device.type === "desktop" ? 40 : CARD_PAD;
  const availW = Math.max(80, containerSize.width - horizontalPad);
  const availH = Math.max(80, containerSize.height - CARD_PAD);
  const fitScale = Math.min(
    1,
    availW / frameSize.width,
    availH / frameSize.height,
  );
  const scale =
    slot.zoomMode === "actual"
      ? 1
      : slot.zoomMode === "fit"
        ? fitScale
        : fitScale * (slot.zoom / 0.58);

  const fittedOverlayPlacement = {
    x: containerSize.width > 0 ? ((containerSize.width - frameSize.width * scale) / 2 / containerSize.width) * 100 : 0,
    y: containerSize.height > 0 ? ((containerSize.height - frameSize.height * scale) / 2 / containerSize.height) * 100 : 0,
    width: containerSize.width > 0 ? (frameSize.width * scale / containerSize.width) * 100 : 100,
    height: containerSize.height > 0 ? (frameSize.height * scale / containerSize.height) * 100 : 100,
  };
  const overlayPlacement = designOverlay?.placement ?? fittedOverlayPlacement;

  function startOverlayAdjustment(event: React.PointerEvent, kind: "move" | "width" | "height" | "both") {
    if (!designOverlay?.adjusting || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    const surface = event.currentTarget.closest("[data-design-overlay-surface]")?.getBoundingClientRect();
    if (!surface) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = overlayPlacement;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      window.removeEventListener("blur", finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || (moveEvent.buttons & 1) !== 1) return finish();
      const deltaX = ((moveEvent.clientX - startX) / surface.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / surface.height) * 100;
      if (kind === "move") {
        designOverlay.onPlacementChange({ ...initial, x: Math.max(-1000, Math.min(1000, initial.x + deltaX)), y: Math.max(-1000, Math.min(1000, initial.y + deltaY)) });
      } else {
        designOverlay.onPlacementChange({
          ...initial,
          width: kind === "width" || kind === "both" ? Math.max(1, Math.min(1000, initial.width + deltaX)) : initial.width,
          height: kind === "height" || kind === "both" ? Math.max(1, Math.min(1000, initial.height + deltaY)) : initial.height,
        });
      }
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
    window.addEventListener("blur", finish);
    target.setPointerCapture(pointerId);
  }

  const syncScrollBridge = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: display.scrollSync ? "MDV_SCROLL_SYNC_ENABLE" : "MDV_SCROLL_SYNC_DISABLE",
        slotId: slot.id,
      },
      "*",
    );
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setBlocked(false);
    setBridgeStatus("checking");
  }, [device.id, slot.reloadToken, slot.url]);

  useEffect(() => {
    bridgeStatusRef.current = bridgeStatus;
  }, [bridgeStatus]);

  // Register the iframe with the in-iframe scroll-sync bridge. The content script
  // is injected by extension-routes/messaging, so we only need to post the
  // registration + scroll-sync toggle here. Inspect / live features are removed.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const register = () => {
      setBridgeStatus("checking");
      iframe.contentWindow?.postMessage(
        { type: "MDV_PREVIEW_REGISTER", slotId: slot.id },
        "*",
      );
      syncScrollBridge(iframe);

      window.clearTimeout(bridgeStatusTimer.current);
      bridgeStatusTimer.current = window.setTimeout(() => {
        if (bridgeStatusRef.current === "checking") {
          setBlocked(true);
          setBridgeStatus("unavailable");
        }
      }, 6000);
    };

    iframe.addEventListener("load", register);
    register();

    return () => {
      iframe.removeEventListener("load", register);
      window.clearTimeout(bridgeStatusTimer.current);
    };
  }, [containerSize.width, slot.id, slot.reloadToken, slot.url]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.slotId !== slot.id) return;

      if (data.type === "MDV_PREVIEW_READY") {
        setBridgeStatus("ready");
        setBlocked(false);
        const nextUrl = typeof data.url === "string" ? data.url : "";
        if (
          display.navigationSync &&
          nextUrl &&
          nextUrl !== slot.url &&
          nextUrl !== previousNavigationUrlRef.current
        ) {
          previousNavigationUrlRef.current = nextUrl;
          window.dispatchEvent(new CustomEvent("MDV_NAVIGATION_EVENT", {
            detail: { slotId: slot.id, url: nextUrl },
          }));
        }
        return;
      }

      if (data.type === "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE") {
        setBridgeStatus("blocked");
        setBlocked(true);
        return;
      }

      if (data.type === "MDV_SCROLL_SYNC_EVENT") {
        setBridgeStatus("ready");
        // Device chrome (status/address/bottom bars) is intentionally STATIC — we no
        // longer collapse it on scroll. Doing so reflowed the iframe every frame.
        if (!display.scrollSync) return;
        broadcastScrollSync(data as ScrollSyncPayload);
        return;
      }

      if (data.type === "MDV_INTERACTION_EVENT") {
        if (!display.scrollSync) return;
        broadcastInteractionSync(data as InteractionSyncPayload);
        return;
      }

    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [display.navigationSync, display.scrollSync, slot.id, slot.url]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<ScrollSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id) return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "MDV_APPLY_SCROLL_SYNC",
          slotId: slot.id,
          scrollLeft: detail.scrollLeft,
          scrollTop: detail.scrollTop,
          deltaLeft: detail.deltaLeft,
          deltaTop: detail.deltaTop,
          scrollTargetSelector: detail.scrollTargetSelector,
        },
        "*",
      );
    };

    window.addEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
    return () => window.removeEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<InteractionSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id) return;
      const { slotId: _sourceSlotId, ...payload } = detail;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "MDV_APPLY_INTERACTION",
          slotId: slot.id,
          ...payload,
        },
        "*",
      );
    };

    window.addEventListener("MDV_INTERACTION_EVENT", onSync);
    return () => window.removeEventListener("MDV_INTERACTION_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useEffect(() => {
    syncScrollBridge(iframeRef.current);
    const enabling = display.scrollSync && !previousScrollSyncRef.current;
    if (enabling && activeSlotId === slot.id) {
      iframeRef.current?.contentWindow?.postMessage({
        type: "MDV_SCROLL_SYNC_SNAPSHOT",
        slotId: slot.id,
      }, "*");
    }
    previousScrollSyncRef.current = display.scrollSync;
  }, [display.scrollSync, slot.id]);

  useEffect(() => {
    if (!display.navigationSync) return;
    const onNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ slotId: string; url: string }>).detail;
      if (!detail || detail.slotId === slot.id || !detail.url || detail.url === slot.url) return;
      previousNavigationUrlRef.current = detail.url;
      setSlotUrl(slot.id, detail.url);
    };
    window.addEventListener("MDV_NAVIGATION_EVENT", onNavigation);
    return () => window.removeEventListener("MDV_NAVIGATION_EVENT", onNavigation);
  }, [display.navigationSync, setSlotUrl, slot.id, slot.url]);


  return (
    <section
      data-preview-slot-id={slot.id}
      className={`flex h-full min-h-0 flex-col overflow-visible border-t transition-colors ${activeSlotId === slot.id ? "border-t-teal-500" : "border-t-transparent"}`}
      style={{ minWidth: 0 }}
      onClick={() => setActiveSlot(slot.id)}
      onFocus={() => setActiveSlot(slot.id)}
    >
      {/* ── Per-card header ── */}
      {showToolbar && <div
        data-device-toolbar
        className={`flex h-9 shrink-0 flex-nowrap items-center gap-0.5 border-b px-1 transition-colors ${
          display.darkMode
            ? "border-white/10 bg-[#151922]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        <DeviceSwitcher
          currentDevice={device}
          dark={display.darkMode}
          onSwitch={(id) => setSlotDevice(slot.id, id)}
        />

        <span className={`shrink-0 px-1 text-[9px] font-bold ${display.darkMode ? "text-slate-500" : "text-slate-400"}`}>
          {viewportSize.width} × {viewportSize.height}
        </span>

        <CardBtn
          dark={display.darkMode}
          label="Reload preview"
          onClick={() => reloadSlot(slot.id)}
        >
          <RefreshCw size={14} className={bridgeStatus === "checking" ? "animate-spin" : ""} />
        </CardBtn>
        {!focused && !first && <CardBtn dark={display.darkMode} label="Move viewport left" onClick={() => moveSlot(slot.id, "left")}><ArrowLeft size={13} /></CardBtn>}
        {!focused && !last && <CardBtn dark={display.darkMode} label="Move viewport right" onClick={() => moveSlot(slot.id, "right")}><ArrowRight size={13} /></CardBtn>}
        <CardBtn dark={display.darkMode} label={focused ? "Show all viewports" : "Focus this viewport"} onClick={onToggleFocus}>
          {focused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </CardBtn>
        {canRotate && (
          <CardBtn
            dark={display.darkMode}
            label="Rotate"
            onClick={() => rotateSlot(slot.id)}
          >
            <RotateCw size={14} />
          </CardBtn>
        )}
        <CardBtn dark={display.darkMode} label="Zoom out" onClick={() => zoomSlot(slot.id, "out")}><Minus size={13} /></CardBtn>
        <CardBtn dark={display.darkMode} label="Zoom in" onClick={() => zoomSlot(slot.id, "in")}><Plus size={13} /></CardBtn>
        {removable && <CardBtn dark={display.darkMode} label="Remove device" onClick={() => removeSlot(slot.id)}><X size={13} /></CardBtn>}
      </div>}

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        data-design-overlay-surface
        className={`relative flex flex-1 items-center justify-center overflow-visible transition-colors ${display.darkMode ? "bg-[#101217]" : "bg-[#f5f5f3]"}`}
      >
        {containerSize.width > 0 && (
          <div
            className="origin-center"
            style={{
              width: frameSize.width,
              height: frameSize.height,
              transform: `scale(${scale})`,
              marginTop: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginBottom: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginLeft: `${(frameSize.width * scale - frameSize.width) / 2}px`,
              marginRight: `${(frameSize.width * scale - frameSize.width) / 2}px`,
            }}
          >
            <DeviceFrame
              device={device}
              showFrame={slot.showFrame}
              showStatusBar={SHOW_CHROME.showStatusBar}
              showBattery={SHOW_CHROME.showBattery}
              showUrlBar={SHOW_CHROME.showUrlBar}
              darkMode={display.darkMode}
              url={slot.url}
              viewportSize={viewportSize}
              orientation={effectiveOrientation}
              scrollProgress={0}
            >
              <div
                className="relative"
                style={{
                  width: viewportSize.width,
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {blocked ? (
                  <BlockedView
                    url={slot.url}
                    dark={display.darkMode}
                    onCapture={onCapture}
                    onReload={() => reloadSlot(slot.id)}
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    key={`${slot.id}-${slot.reloadToken}`}
                    title={`${device.name} preview`}
                    src={slot.url}
                    className={`block h-full w-full overflow-auto border-0 ${display.darkMode ? "bg-[#0f172a]" : "bg-white"}`}
                    style={{
                      width: "100%",
                      backgroundColor: "#ffffff",
                    }}
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    onError={() => setBlocked(true)}
                  />
                )}
              </div>
            </DeviceFrame>
          </div>
        )}
        {designOverlay && <div
          className={`absolute z-30 touch-none select-none ${designOverlay.adjusting ? "cursor-move border-2 border-amber-400 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" : "pointer-events-none"}`}
          style={{ left: `${overlayPlacement.x}%`, top: `${overlayPlacement.y}%`, width: `${overlayPlacement.width}%`, height: `${overlayPlacement.height}%`, opacity: designOverlay.opacity / 100 }}
          onPointerDown={(event) => startOverlayAdjustment(event, "move")}
          aria-label="Adjustable design overlay"
        >
          <img src={designOverlay.image} alt="Design overlay" draggable={false} className="block h-full w-full" />
          {designOverlay.adjusting && <>
            <button type="button" aria-label="Resize design overlay width" onPointerDown={(event) => startOverlayAdjustment(event, "width")} className="absolute -right-2 top-1/2 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-amber-500 shadow" />
            <button type="button" aria-label="Resize design overlay height" onPointerDown={(event) => startOverlayAdjustment(event, "height")} className="absolute -bottom-2 left-1/2 h-4 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-amber-500 shadow" />
            <button type="button" aria-label="Resize design overlay width and height" onPointerDown={(event) => startOverlayAdjustment(event, "both")} className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-amber-500 shadow" />
          </>}
        </div>}
      </div>
    </section>
  );
}

function broadcastScrollSync(detail: ScrollSyncPayload) {
  window.dispatchEvent(
    new CustomEvent<ScrollSyncPayload>("MDV_SCROLL_SYNC_EVENT", { detail }),
  );
}

function broadcastInteractionSync(detail: InteractionSyncPayload) {
  window.dispatchEvent(
    new CustomEvent<InteractionSyncPayload>("MDV_INTERACTION_EVENT", { detail }),
  );
}

// ─── Device switcher ──────────────────────────────────────────────────────────
// Device categories mirror the way responsive developers scan target hardware.
// Special-purpose hardware (kiosks, control panels, watches, TVs, custom) stays
// in Other instead of being mixed with tablets and computers.
type MenuGroupId = "ios" | "android" | "tablet" | "laptop" | "desktop" | "other" | "custom";
type MenuSection = { key: MenuGroupId | "favorite" | "recent" | "search"; label: string; devices: Device[] };

const MENU_GROUP_ORDER: MenuGroupId[] = ["ios", "android", "tablet", "laptop", "desktop", "other", "custom"];
const MENU_GROUP_LABEL: Record<MenuGroupId, string> = {
  ios: "iOS",
  android: "Android",
  tablet: "Tablets",
  laptop: "Laptops",
  desktop: "Desktops",
  other: "Other",
  custom: "Custom",
};

function menuGroupFor(device: Device): MenuGroupId {
  if (device.brand === "Custom") return "custom";
  if (device.type === "tablet") return "tablet";
  if (device.type === "laptop") return "laptop";
  if (device.type === "desktop") return "desktop";
  if (device.type === "phone") {
    const os = (device.os || "").toLowerCase();
    if (os === "ios") return "ios";
    if (os === "android") return "android";
  }
  return "other";
}

function newestDevicesFirst(left: Device, right: Device): number {
  const yearDifference = (right.year ?? -1) - (left.year ?? -1);
  if (yearDifference !== 0) return yearDifference;
  const updatedDifference = right.updatedAt.localeCompare(left.updatedAt);
  return updatedDifference || left.name.localeCompare(right.name);
}

const RECENT_LIMIT = 4;

function DeviceSwitcher({
  currentDevice,
  dark,
  onSwitch,
}: {
  currentDevice: Device;
  dark: boolean;
  onSwitch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<MenuGroupId>(() => menuGroupFor(currentDevice));
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const { devices, favorites, recents, addRecent, toggleFavorite, isFavorite } = useDeviceCatalog();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search and scroll active item into view when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveGroup(menuGroupFor(currentDevice));
      setTimeout(() => {
        inputRef.current?.focus();
        if (activeItemRef.current && listRef.current) {
          const list = listRef.current;
          const item = activeItemRef.current;
          const listTop = list.scrollTop;
          const listBottom = listTop + list.clientHeight;
          const itemTop = item.offsetTop;
          const itemBottom = itemTop + item.offsetHeight;
          if (itemTop < listTop) {
            list.scrollTop = itemTop - 8;
          } else if (itemBottom > listBottom) {
            list.scrollTop = itemBottom - list.clientHeight + 8;
          }
        }
      }, 0);
    }
  }, [open]);

  const sections = useMemo<MenuSection[]>(() => {
    const q = query.trim().toLowerCase();
    const filterByQuery = (list: Device[]): Device[] =>
      q
        ? list.filter((device) => `${device.name} ${device.brand} ${device.os} ${device.type} ${device.cssViewport.width}x${device.cssViewport.height}`.toLowerCase().includes(q))
        : list;

    const findById = (id: string) => devices.find((device) => device.id === id);
    const favoriteDevices = favorites.map(findById).filter((device): device is Device => !!device);
    const favoriteSection: MenuSection | null = favoriteDevices.length > 0
      ? { key: "favorite", label: "Favorites", devices: filterByQuery(favoriteDevices) }
      : null;

    // Recently used — most recent first, capped, never reorder when picking.
    const usedInRecents = new Set<string>();
    const recentDevices = recents
      .map(findById)
      .filter((d): d is Device => !!d && !usedInRecents.has(d.id) && (usedInRecents.add(d.id), true))
      .slice(0, RECENT_LIMIT);
    const recentSection: MenuSection | null = (() => {
      const filtered = filterByQuery(recentDevices).filter(
        (d) => d.id !== currentDevice.id,
      );
      if (filtered.length === 0) return null;
      return { key: "recent", label: "Recently used", devices: filtered };
    })();

    if (q) {
      const matches = filterByQuery(devices).sort(newestDevicesFirst);
      return matches.length > 0 ? [{ key: "search", label: "Search results", devices: matches }] : [];
    }

    const categoryDevices = devices
      .filter((device) => menuGroupFor(device) === activeGroup)
      .sort(newestDevicesFirst);
    const categorySection: MenuSection = {
      key: activeGroup,
      label: MENU_GROUP_LABEL[activeGroup],
      devices: categoryDevices,
    };

    return [favoriteSection, recentSection, categorySection].filter((section): section is MenuSection => !!section && section.devices.length > 0);
  }, [activeGroup, devices, favorites, query, recents, currentDevice.id]);

  const groupCounts = useMemo(() => Object.fromEntries(
    MENU_GROUP_ORDER.map((group) => [group, devices.filter((device) => menuGroupFor(device) === group).length]),
  ) as Record<MenuGroupId, number>, [devices]);

  return (
    <div ref={ref} className="relative min-w-0 flex-[1.45]">
      <button
        type="button"
        data-testid="device-switcher-button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex h-7 w-full min-w-0 items-center gap-1 whitespace-nowrap rounded-[7px] border px-1.5 text-[11px] font-semibold transition ${
          dark
            ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {shortName(currentDevice.name)}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 ${dark ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>

      {open && (
        <div
          data-testid="device-switcher-panel"
          className={`absolute left-0 top-full z-50 mt-1 flex w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.24)] ${
            dark ? "border-white/10 bg-[#171b24]" : "border-slate-200 bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`border-b p-2.5 ${dark ? "border-white/10" : "border-slate-100"}`}>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <p className={`text-[11px] font-extrabold ${dark ? "text-white" : "text-slate-800"}`}>Choose a device</p>
              <span className={`text-[9px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>{new Set(sections.flatMap((section) => section.devices.map((device) => device.id))).size} results</span>
            </div>
            <div className={`flex h-8 items-center gap-2 rounded-lg border px-2 ${dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-slate-50"}`}>
              <Search size={13} className={dark ? "text-slate-500" : "text-slate-400"} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                placeholder="Search name, OS, type, or size"
                className={`min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-400 ${dark ? "text-white" : "text-slate-800"}`}
              />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear device search" className={`grid h-5 w-5 place-items-center rounded ${dark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}><X size={11} /></button>}
            </div>
            {!query && <div className="mt-2 grid grid-cols-3 gap-1" role="tablist" aria-label="Device categories">
              {MENU_GROUP_ORDER.filter((group) => groupCounts[group] > 0).map((group) => <button
                key={group}
                type="button"
                role="tab"
                aria-selected={activeGroup === group}
                onClick={() => setActiveGroup(group)}
                className={`flex h-8 items-center justify-between rounded-lg px-2 text-[9px] font-extrabold transition ${activeGroup === group ? "bg-[#0f9f8f] text-white shadow-sm" : dark ? "bg-white/[0.045] text-slate-400 hover:bg-white/[0.08] hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"}`}
              ><span>{MENU_GROUP_LABEL[group]}</span><span className={activeGroup === group ? "text-white/70" : "opacity-50"}>{groupCounts[group]}</span></button>)}
            </div>}
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1.5">
            {sections.map((section) => (
              <div key={section.key}>
                <p className={`flex items-center justify-between px-3 pb-1 pt-2 text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  <span>{section.label}</span><span>{section.devices.length}</span>
                </p>
                <div className="flex flex-col gap-0.5 px-1.5">
                  {section.devices.map((d) => (
                    <DeviceSwitcherItem
                      key={d.id}
                      ref={d.id === currentDevice.id ? activeItemRef : undefined}
                      device={d}
                      active={d.id === currentDevice.id}
                      dark={dark}
                      favorite={isFavorite(d.id)}
                      onToggleFavorite={() => toggleFavorite(d.id)}
                      onPick={() => {
                        addRecent(d.id);
                        onSwitch(d.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="px-3 py-8 text-center text-[11px] text-slate-400">
                No devices match “{query}”
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const DeviceSwitcherItem = forwardRef<HTMLButtonElement, {
  device: Device;
  active: boolean;
  dark: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPick: () => void;
}>(function DeviceSwitcherItem({ device, active, dark, favorite, onToggleFavorite, onPick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      title={device.name}
      className={`group flex min-h-12 w-full min-w-0 items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition ${
        active
          ? dark ? "border-teal-400/20 bg-teal-400/15 text-teal-100" : "border-teal-100 bg-teal-50 text-teal-900"
          : dark
            ? "text-slate-200 hover:border-white/[0.06] hover:bg-white/[0.055]"
            : "text-slate-700 hover:border-slate-100 hover:bg-slate-50"
      }`}
      onClick={onPick}
    >
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2"><span className="min-w-0 flex-1 truncate text-[11px] font-bold leading-tight">{shortName(device.name)}</span>{device.year && <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold ${active ? dark ? "bg-teal-400/15 text-teal-300" : "bg-teal-100 text-teal-700" : dark ? "bg-white/[0.06] text-slate-500" : "bg-slate-100 text-slate-400"}`}>{device.year}</span>}</span>
        <span className={`mt-0.5 block truncate text-[9px] font-medium leading-tight ${active ? dark ? "text-teal-300/70" : "text-teal-700/70" : dark ? "text-slate-500" : "text-slate-400"}`}>
          {device.os.toLowerCase() === "android" ? `${device.brand} · ` : ""}{device.os} · {device.cssViewport.width} × {device.cssViewport.height}
        </span>
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label={favorite ? `Remove ${device.name} from favorites` : `Add ${device.name} to favorites`}
        onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onToggleFavorite(); } }}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${favorite ? "text-amber-400" : dark ? "text-slate-600 hover:text-slate-300" : "text-slate-300 hover:text-slate-600"}`}
      ><Star size={13} fill={favorite ? "currentColor" : "none"} /></span>
      {active && <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${dark ? "bg-teal-400/20 text-teal-300" : "bg-teal-100 text-teal-700"}`}><Check size={12} strokeWidth={2.5} /></span>}
    </button>
  );
});

function BlockedView({
  dark,
  onCapture,
  onReload,
  url,
}: {
  dark: boolean;
  onCapture: () => void;
  onReload: () => void;
  url: string;
}) {
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-3 p-6 text-center transition-colors ${dark ? "bg-[#0f172a] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <p className="text-sm font-black">
        This site blocks iframe preview.
      </p>
      <p className={`max-w-[250px] break-all text-[11px] font-semibold leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {url}
      </p>
      <p className={`max-w-[260px] text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        The page likely keeps frame protection, uses a restricted browser URL, or
        prevented the preview bridge from loading.
      </p>
      <div className="grid w-full max-w-[240px] gap-2">
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold text-white ${dark ? "bg-[#0f9f8f]" : "bg-slate-900"}`}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={13} /> Open in tab
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/10 bg-white/[0.06] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          onClick={onReload}
        >
          <RefreshCw size={13} /> Reload preview
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/10 bg-white/[0.06] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          onClick={onCapture}
        >
          Capture current tab instead
        </button>
      </div>
    </div>
  );
}

function CardBtn({
  dark,
  label,
  children,
  onClick,
  disabled = false,
}: {
  dark: boolean;
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${
        dark
          ? "text-slate-400 hover:bg-white/10 hover:text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      } ${disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-current" : ""}`}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function shortName(name: string) {
  return name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
}
