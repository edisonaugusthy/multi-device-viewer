import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n, type TranslationKey } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import { SimulatorScopeProvider, useSimulator, useSimulatorRef } from "../../app/SimulatorProvider";
import { getViewerEventTarget } from "../../app/viewer-context";
import { groupGalleryDevices, newestFirst, type DeviceGalleryGroupId, type DeviceGalleryGroup } from "../../domain/device/device-gallery";
import { createGalleryLoadQueue, isLocalDevelopmentUrl, LOCAL_GALLERY_CONCURRENCY, type GalleryLoadSnapshot, type GalleryLoadStatus, type GalleryLoadResult } from "../../domain/device/gallery-load-queue";
import { getDefaultOrientation, nextOrientation, supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import { getBrowserGeometry, type BrowserPreferences } from "../../domain/device/browser-geometry";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import type { Device } from "../../domain/device/device.types";
import { nextZoom } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import {
  AlertIcon,
  BackIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  MinusIcon,
  MoreIcon,
  NavigationSyncIcon,
  OpenInTabIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReloadIcon,
  RotateIcon,
  ScrollSyncIcon,
  SettingsIcon,
} from "../icons";
import { BrowserAppearanceSettings } from "./BrowserAppearanceSettings";
import { estimateDeviceFrameSize } from "./DeviceFrame";
import { PreviewCard, shortName } from "./PreviewCard";
import { SettingsPopover, type BrowserBarPosition } from "./SettingsPopover";
import { cx, focusRing, IconButton, Segmented, Tooltip } from "./ui";
import { ViewModeBar } from "./ViewModeBar";
import { useVisualRegression } from "../hooks/useVisualRegression";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";

type GalleryLoadingMode = "fast" | "gentle";
const POPUP_SLOT_ID = "gallery-popup";
// Gallery cards: the tallest preview area, and the name and size underneath.
const GALLERY_PREVIEW_MAX = 568;
const GALLERY_WATCH_PREVIEW_MAX = 348;
const GALLERY_CAPTION_HEIGHT = 52;
const GALLERY_TOOLBAR_SPACE = 56;
// Cards this far outside the viewport keep their page; further away they give
// it back to the queue, so a category never runs every page at once.
const GALLERY_KEEP_MARGIN = 800;
const GALLERY_UNLOAD_DELAY_MS = 1000;
const LOADING_MODE_KEY = "mdvGalleryLoadingMode";
const loadingPolicy = (mode: GalleryLoadingMode | null, paused: boolean, local: boolean) => ({
  concurrency: mode === "gentle" ? 2 : local ? LOCAL_GALLERY_CONCURRENCY : undefined,
  intervalMs: mode === "gentle" ? 1000 : 0,
  paused: paused || mode === null,
});

const groupLabels: Record<DeviceGalleryGroupId, TranslationKey> = {
  ios: "iosPhones", android: "androidPhones", phone: "phones", tablet: "tablets", laptop: "laptops", watch: "watches",
  desktop: "desktops", tv: "televisions", custom: "customViewports",
};

// Category tabs use short names so every category fits in one row.
const tabLabels: Record<DeviceGalleryGroupId, TranslationKey | "Android"> = {
  ...groupLabels, android: "Android", custom: "custom",
};

export interface GallerySettings {
  browserBar: BrowserBarPosition;
  onBrowserBarChange: (position: BrowserBarPosition) => void;
  onHelp: () => void;
  onTour: () => void;
  onWhatsNew: () => void;
  onPermissions: () => void;
}

interface AllDevicesViewProps {
  url: string;
  onClose: () => void;
  onOpenDevice: (deviceId: string, url: string) => void;
  onAddDevice: (deviceId: string, url: string) => void;
  /** Screenshot of one device, cut out of the page; resolves when the capture is done. */
  onCaptureDevice: (target: HTMLElement, device: Device, url: string, slot: PreviewSlot, size: { width: number; height: number }) => Promise<void>;
  settings: GallerySettings;
  /** After the page reloaded with the gallery open: where to return to. */
  restore?: { category: string; scrollTop: number };
  onStateChange?: (state: { category: DeviceGalleryGroupId; scrollTop: number }) => void;
}

export function AllDevicesView(props: AllDevicesViewProps) {
  const { devices } = useDeviceCatalog();
  // Each category lists the latest devices first.
  const groups = useMemo(() => groupGalleryDevices(devices).map(group => ({ ...group, devices: [...group.devices].sort(newestFirst) })), [devices]);
  const [page, setPage] = useState<{ id: DeviceGalleryGroupId; url: string; focusCategory: boolean }>(() => ({
    id: groups.some(group => group.id === props.restore?.category) ? props.restore!.category as DeviceGalleryGroupId : "ios",
    url: props.url, focusCategory: false,
  }));
  const [loadingMode, setLoadingMode] = useState<GalleryLoadingMode | null>(null);
  const [loadingPaused, setLoadingPaused] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void readStore<unknown>(LOADING_MODE_KEY, "fast").catch(() => "fast").then(mode => {
      if (!cancelled) setLoadingMode(mode === "gentle" ? "gentle" : "fast");
    });
    return () => { cancelled = true; };
  }, []);
  const changeLoadingMode = (mode: GalleryLoadingMode) => {
    setLoadingMode(mode);
    void writeStore(LOADING_MODE_KEY, mode).catch(() => {});
  };
  const group = groups.find(candidate => candidate.id === page.id) ?? groups[0];
  if (!group) return null;
  // A category owns its documents and queue. Changing the key tears both down;
  // hidden categories must never retain iframes or continue background loading.
  return <GalleryPage key={group.id} {...props} url={page.url} group={group} groups={groups}
    focusCategory={page.focusCategory} onSelectGroup={(id, url) => setPage({ id, url, focusCategory: true })}
    loadingMode={loadingMode} changeLoadingMode={changeLoadingMode} loadingPaused={loadingPaused}
    onToggleLoading={() => setLoadingPaused(current => !current)}/>;
}

function GalleryPage({ url, onClose, onOpenDevice, onAddDevice, onCaptureDevice, settings, group, groups, onSelectGroup, focusCategory,
  loadingMode, changeLoadingMode, loadingPaused, onToggleLoading, restore, onStateChange }: AllDevicesViewProps & {
  focusCategory: boolean;
  group: DeviceGalleryGroup;
  groups: DeviceGalleryGroup[];
  onSelectGroup: (id: DeviceGalleryGroupId, url: string) => void;
  loadingMode: GalleryLoadingMode | null;
  changeLoadingMode: (mode: GalleryLoadingMode) => void;
  loadingPaused: boolean;
  onToggleLoading: () => void;
}) {
  const { t } = useI18n();
  const devices = group.devices;
  const simulator = useSimulator();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const local = useMemo(() => isLocalDevelopmentUrl(url), [url]);
  const loadPolicy = useRef(loadingPolicy(loadingMode, loadingPaused, local));
  loadPolicy.current = loadingPolicy(loadingMode, loadingPaused, local);
  // The enlarged device lives in its own popup slot with its own document,
  // so opening it never pulls the card out of the grid behind it.
  const [popup, setPopup] = useState<PreviewSlot | null>(null);
  const popupRef = useRef(popup);
  popupRef.current = popup;
  const expandedDeviceId = popup?.deviceId ?? null;
  const [activeSlotId, setActiveSlot] = useState("");
  const [changes, setChanges] = useState<Record<string, PreviewSlot>>({});
  const [liveSlotIds, setLiveSlotIds] = useState(() => new Set<string>());
  const [nearSlotIds, setNearSlotIds] = useState(() => new Set<string>());
  const [loadState, setLoadState] = useState<GalleryLoadSnapshot & { generation: number }>(() => ({ generation: -1, states: new Map(), requests: new Map() }));
  const loadQueueRef = useRef<{ generation: number; queue: ReturnType<typeof createGalleryLoadQueue> } | null>(null);
  const pendingNavigation = useRef(new Map<string, string>());
  const [initialPreferences] = useState(() => new Map(simulator.slots.map(slot => [slot.deviceId, slot.browserPreferences])));
  const observedUrls = useRef(new Map<string, string>());
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const categoryNavRef = useRef<HTMLElement>(null);
  // Category tabs show only when every tab fits; otherwise the dropdown does.
  const [categoryTabsFit, setCategoryTabsFit] = useState(true);
  const baseSlots = useMemo(() => devices.map(device => ({
    id: `gallery-${device.id}`, deviceId: device.id, url,
    orientation: getDefaultOrientation(device), zoom: 0.58,
    zoomMode: "fit" as const, reloadToken: 0, showFrame: true,
    browserPreferences: initialPreferences.get(device.id),
  })), [devices, initialPreferences, url]);
  const slots = useMemo(() => baseSlots.map(slot => changes[slot.id] ?? slot), [baseSlots, changes]);
  const liveSlots = useMemo(() => popup ? [popup]
    : slots.filter(slot => liveSlotIds.has(slot.id) && loadState.generation === refreshVersion && loadState.requests.has(slot.id)), [popup, slots, liveSlotIds, loadState.generation, loadState.requests, refreshVersion]);
  const syncSourceId = popup ? POPUP_SLOT_ID : liveSlots.some(slot => slot.id === activeSlotId) ? activeSlotId : liveSlots[0]?.id ?? "";
  const setSlotLive = useCallback((id: string, live: boolean) => {
    // Visibility controls bridge activity, never the iframe's lifetime or src.
    setLiveSlotIds(current => {
      if (current.has(id) === live) return current;
      const next = new Set(current);
      if (live) next.add(id); else next.delete(id);
      return next;
    });
  }, []);
  const setSlotNear = useCallback((id: string, near: boolean) => {
    setNearSlotIds(current => {
      if (current.has(id) === near) return current;
      const next = new Set(current);
      if (near) next.add(id); else next.delete(id);
      return next;
    });
  }, []);
  const slotsByDevice = useMemo(() => new Map(slots.map(slot => [slot.deviceId, slot])), [slots]);
  const count = devices.length;
  const loadOrder = useMemo(() => devices.map(device => `gallery-${device.id}`), [devices]);
  const currentLoads = loadState.generation === refreshVersion ? loadState : undefined;
  const loadedCount = [...(currentLoads?.states.values() ?? [])].filter(status => status === "loaded").length;
  const incompleteIds = [...(currentLoads?.states.entries() ?? [])].filter(([, status]) => status === "incomplete" || status === "error").map(([id]) => id);
  const display = simulator.display;
  const selectedGroup = group.id;

  const updateSlot = useCallback((id: string, update: (slot: PreviewSlot) => PreviewSlot) => {
    if (id === POPUP_SLOT_ID) { setPopup(current => current && update(current)); return; }
    setChanges(current => {
      const slot = current[id] ?? baseSlots.find(candidate => candidate.id === id);
      return slot ? { ...current, [id]: update(slot) } : current;
    });
  }, [baseSlots]);
  const observeSlotUrl = useCallback((id: string, nextUrl: string) => { observedUrls.current.set(id, nextUrl); }, []);
  const getSlotUrl = useCallback((id: string) => observedUrls.current.get(id)
    ?? (id === POPUP_SLOT_ID ? popupRef.current?.url : slots.find(slot => slot.id === id)?.url) ?? url, [slots, url]);
  useEffect(() => {
    const queue = createGalleryLoadQueue(loadOrder, {
      // Loading every offscreen iframe multiplies the site's scripts, timers
      // and network requests. Start only the rows the user is approaching.
      visibleOnly: true,
      onChange: snapshot => setLoadState({ ...snapshot, generation: refreshVersion }),
      onStart: id => {
        const nextUrl = pendingNavigation.current.get(id);
        if (!nextUrl) return;
        pendingNavigation.current.delete(id);
        observedUrls.current.set(id, nextUrl);
        updateSlot(id, slot => ({ ...slot, url: nextUrl, reloadToken: slot.reloadToken + 1 }));
      },
    });
    loadQueueRef.current = { generation: refreshVersion, queue };
    queue.configure(loadPolicy.current);
    queue.start();
    return () => { queue.dispose(); if (loadQueueRef.current?.queue === queue) loadQueueRef.current = null; };
  }, [loadOrder, refreshVersion, updateSlot]);
  useEffect(() => { loadQueueRef.current?.queue.configure(loadingPolicy(loadingMode, loadingPaused, local)); }, [loadingMode, loadingPaused, local]);
  useEffect(() => { loadQueueRef.current?.queue.prioritize(liveSlotIds); }, [liveSlotIds, refreshVersion]);
  // Pages far from the viewport go back to the queue once they have been far
  // for a moment, so a quick scroll past a row does not reload pages the user
  // is about to come back to. Each page gets its own grace period.
  const startedIds = currentLoads?.requests;
  const farSince = useRef(new Map<string, number>());
  useEffect(() => {
    if (!startedIds) return;
    const now = Date.now();
    for (const id of startedIds.keys()) {
      if (nearSlotIds.has(id) || liveSlotIds.has(id)) farSince.current.delete(id);
      else if (!farSince.current.has(id)) farSince.current.set(id, now);
    }
    for (const id of farSince.current.keys()) if (!startedIds.has(id)) farSince.current.delete(id);
    const due = [...farSince.current.values()].map(since => since + GALLERY_UNLOAD_DELAY_MS - now);
    if (!due.length) return;
    const timer = setTimeout(() => {
      const current = loadQueueRef.current;
      if (!current || current.generation !== refreshVersion) return;
      const cutoff = Date.now() - GALLERY_UNLOAD_DELAY_MS;
      for (const [id, since] of farSince.current) if (since <= cutoff) { farSince.current.delete(id); current.queue.unload(id); }
    }, Math.max(0, Math.min(...due)));
    return () => clearTimeout(timer);
  }, [startedIds, nearSlotIds, liveSlotIds, refreshVersion]);
  // After a reload with the viewer open, return to where the gallery was, and
  // keep the background told where that is.
  const restoreScroll = useRef(restore?.category === group.id ? restore.scrollTop : 0);
  useEffect(() => {
    const top = restoreScroll.current;
    restoreScroll.current = 0;
    if (!top) return;
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = top; }); });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!onStateChange || !scroller) return;
    onStateChange({ category: group.id, scrollTop: scroller.scrollTop });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(() => onStateChange({ category: group.id, scrollTop: scroller.scrollTop }), 300); };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); scroller.removeEventListener("scroll", onScroll); };
  }, [group.id, onStateChange]);
  const previewLoaded = useCallback((id: string, request: number, status: GalleryLoadResult) => {
    if (loadQueueRef.current?.generation === refreshVersion) loadQueueRef.current.queue.settle(id, request, status);
  }, [refreshVersion]);
  const previewReady = useCallback((id: string, request: number) => {
    if (loadQueueRef.current?.generation === refreshVersion) loadQueueRef.current.queue.release(id, request);
  }, [refreshVersion]);
  const queueNavigation = useCallback((id: string, nextUrl: string) => {
    if (id === POPUP_SLOT_ID) return;
    if ((pendingNavigation.current.get(id) ?? getSlotUrl(id)) === nextUrl) return;
    pendingNavigation.current.set(id, nextUrl);
    loadQueueRef.current?.queue.enqueue(id);
  }, [getSlotUrl]);
  const reloadSlot = useCallback((id: string) => {
    if (id === POPUP_SLOT_ID) {
      const pageUrl = observedUrls.current.get(id);
      setPopup(current => current && { ...current, url: pageUrl ?? current.url, reloadToken: current.reloadToken + 1 });
      return;
    }
    pendingNavigation.current.set(id, getSlotUrl(id));
    loadQueueRef.current?.queue.retry(id);
  }, [getSlotUrl]);
  const refreshAll = useCallback(() => {
    loadQueueRef.current?.queue.dispose();
    pendingNavigation.current.clear();
    observedUrls.current.clear();
    setChanges({});
    setActiveSlot("");
    // Remount every preview to clear page scroll, drafts, and bridge state,
    // and restart using the selected loading mode (remaining paused if requested).
    setRefreshVersion(version => version + 1);
  }, []);
  const zoomSlot = useCallback((id: string, direction: "in" | "out") => updateSlot(id, slot => ({
    ...slot, zoom: nextZoom(slot.zoom, direction), zoomMode: "custom",
  })), [updateSlot]);
  const setSlotZoomMode = useCallback((id: string, zoomMode: PreviewSlot["zoomMode"]) => updateSlot(id, slot => ({
    ...slot, zoomMode, zoom: zoomMode === "actual" ? 1 : zoomMode === "fit" ? 0.58 : slot.zoom,
  })), [updateSlot]);
  const setSlotBrowserPreferences = useCallback((id: string, preferences: BrowserPreferences) => updateSlot(id, slot => ({
    ...slot, browserPreferences: { ...slot.browserPreferences, ...preferences },
  })), [updateSlot]);
  const rotateSlot = useCallback((id: string) => updateSlot(id, slot => ({ ...slot, orientation: nextOrientation(slot.orientation) })), [updateSlot]);
  const scope = useMemo(() => ({
    slots: liveSlots, activeSlotId: syncSourceId, display, setActiveSlot, observeSlotUrl, getSlotUrl, reloadSlot, zoomSlot, setSlotZoomMode, setSlotBrowserPreferences, rotateSlot,
    setSlotUrl: queueNavigation,
  }), [liveSlots, syncSourceId, display, observeSlotUrl, getSlotUrl, reloadSlot, zoomSlot, setSlotZoomMode, setSlotBrowserPreferences, rotateSlot, queueNavigation]);
  // The popup steps through this category in gallery order, keeping the page
  // it is showing. The button that was used keeps focus on the next device.
  const stepFocus = useRef<"previous" | "next" | null>(null);
  const expandedIndex = expandedDeviceId ? devices.findIndex(device => device.id === expandedDeviceId) : -1;
  const popupSlot = useCallback((deviceId: string, pageUrl: string): PreviewSlot => {
    const card = slotsByDevice.get(deviceId)!;
    return { ...card, id: POPUP_SLOT_ID, url: pageUrl, zoom: 0.58, zoomMode: "fit", reloadToken: 0 };
  }, [slotsByDevice]);
  const enlarge = useCallback((id: string) => {
    stepFocus.current = null;
    observedUrls.current.delete(POPUP_SLOT_ID);
    setPopup(popupSlot(id, getSlotUrl(`gallery-${id}`)));
    setActiveSlot(POPUP_SLOT_ID);
  }, [getSlotUrl, popupSlot]);
  const stepExpanded = useCallback((direction: "previous" | "next") => {
    const current = popupRef.current;
    const index = current ? devices.findIndex(device => device.id === current.deviceId) : -1;
    const target = index < 0 ? undefined : devices[index + (direction === "next" ? 1 : -1)];
    if (!target) return;
    const pageUrl = getSlotUrl(POPUP_SLOT_ID);
    observedUrls.current.delete(POPUP_SLOT_ID);
    stepFocus.current = direction;
    setPopup(popupSlot(target.id, pageUrl));
  }, [devices, getSlotUrl, popupSlot]);
  const closePopup = useCallback(() => {
    const current = popupRef.current;
    if (!current) return;
    const pageUrl = getSlotUrl(POPUP_SLOT_ID);
    observedUrls.current.delete(POPUP_SLOT_ID);
    // With navigation sync, the gallery follows a page opened in the popup.
    if (display.navigationSync && pageUrl !== current.url) for (const base of baseSlots) queueNavigation(base.id, pageUrl);
    setPopup(null);
    setActiveSlot("");
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-gallery-device-id="${current.deviceId}"] [data-gallery-enlarge]`)?.focus({ preventScroll: true }));
  }, [baseSlots, display.navigationSync, getSlotUrl, queueNavigation]);

  useEffect(() => {
    if (!display.navigationSync) return;
    const followNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ slotId: string; url: string }>).detail;
      if (!detail || !baseSlots.some(slot => slot.id === detail.slotId)) return;
      pendingNavigation.current.delete(detail.slotId);
      loadQueueRef.current?.queue.cancelPending(detail.slotId);
      // Queue the latest URL across this category, applying it to offscreen
      // previews when they approach the viewport. Keep the source intact.
      for (const base of baseSlots) if (base.id !== detail.slotId) queueNavigation(base.id, detail.url);
    };
    window.addEventListener("MDV_NAVIGATION_EVENT", followNavigation);
    return () => window.removeEventListener("MDV_NAVIGATION_EVENT", followNavigation);
  }, [baseSlots, display.navigationSync, queueNavigation]);

  useLayoutEffect(() => {
    if (!focusCategory) { backRef.current?.focus({ preventScroll: true }); return; }
    const category = rootRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const target = category?.getClientRects().length ? category : rootRef.current?.querySelector("select");
    target?.focus({ preventScroll: true });
  }, [focusCategory]);
  useEffect(() => {
    const close = () => viewMode ? setViewMode(false) : expandedDeviceId ? closePopup() : onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); close(); return; }
      if (!expandedDeviceId || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.composedPath()[0];
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='slider']"))) return;
      const rtl = rootRef.current?.closest("[dir='rtl']") !== null;
      event.preventDefault();
      stepExpanded((event.key === "ArrowRight") !== rtl ? "next" : "previous");
    };
    const closeFromPreview = (event: MessageEvent) => {
      if (event.data?.type !== "MDV_PREVIEW_ESCAPE") return;
      if (Array.from(rootRef.current?.querySelectorAll("iframe") ?? []).some(frame => frame.contentWindow === event.source)) close();
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", closeOnEscape);
    window.addEventListener("message", closeFromPreview);
    return () => { target.removeEventListener("keydown", closeOnEscape); window.removeEventListener("message", closeFromPreview); };
  }, [closePopup, expandedDeviceId, onClose, stepExpanded, viewMode]);

  // The tabs stay laid out (invisibly) while the dropdown shows, so they can be
  // measured at the same width and come back once the header is wide enough.
  useLayoutEffect(() => {
    const nav = categoryNavRef.current;
    if (!nav) return;
    const measure = () => setCategoryTabsFit(nav.scrollWidth <= nav.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [viewMode, groups, t]);

  const jumpToGroup = (id: DeviceGalleryGroupId) => {
    if (id !== selectedGroup) onSelectGroup(id, display.navigationSync ? getSlotUrl(syncSourceId) : url);
  };
  const toggleSync = (key: "scrollSync" | "navigationSync") => simulator.updateDisplay(current => ({ ...current, [key]: !current[key] }));
  // Groups are sorted newest first, so the narrowest and widest can be anywhere.
  const groupWidths = group.devices.map(device => device.cssViewport.width);
  const [narrowest, widest] = [Math.min(...groupWidths), Math.max(...groupWidths)];
  const widthRange = narrowest === widest ? `${narrowest}` : `${narrowest}–${widest}`;

  return (
    <SimulatorScopeProvider value={scope}>
      <div ref={rootRef} data-all-devices-view data-gallery-page={selectedGroup} role={expandedDeviceId ? undefined : "dialog"} aria-modal={expandedDeviceId ? undefined : true} aria-label={expandedDeviceId ? undefined : t("allDevices")}
        className="group/focusmode @container/gallery absolute inset-0 z-40 flex min-h-0 flex-col bg-stage text-ink">
        {!viewMode && <header inert={expandedDeviceId !== null} aria-hidden={expandedDeviceId !== null || undefined}
          className="relative z-10 flex min-h-[52px] min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
          <button ref={backRef} type="button" onClick={onClose} aria-label={t("backToWorkspace")} title={t("backToWorkspace")}
            className={cx("flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-line pe-2.5 ps-2 text-[13px] font-semibold text-ink hover:bg-sunken", focusRing)}>
            <BackIcon size={15} />{t("workspace")}
          </button>

          <div className="relative min-w-[90px] flex-1">
            {!categoryTabsFit && <>
              <label className="sr-only" htmlFor="mdv-gallery-category">{t("deviceCategories")}</label>
              <select id="mdv-gallery-category" aria-label={t("deviceCategories")} value={selectedGroup ?? ""} onChange={event => jumpToGroup(event.target.value as DeviceGalleryGroupId)}
                className={cx("h-8 w-full max-w-48 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-semibold text-ink", focusRing)}>
                {groups.map(item => <option key={item.id} value={item.id}>{t(groupLabels[item.id])} · {item.devices.length}</option>)}
              </select>
            </>}
            <nav ref={categoryNavRef} aria-label={t("deviceCategories")} aria-hidden={!categoryTabsFit || undefined}
              className={cx("flex min-w-0 items-center gap-0.5 overflow-hidden", !categoryTabsFit && "invisible absolute inset-x-0 top-1/2 -translate-y-1/2")}>
              {groups.map(item => {
                const current = selectedGroup === item.id;
                return (
                  <button type="button" key={item.id} aria-current={current ? "page" : undefined} onClick={() => jumpToGroup(item.id)}
                    className={cx("flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[13px]",
                      current ? "bg-primary font-semibold text-on-primary" : "font-medium text-ink-2 hover:bg-sunken hover:text-ink", focusRing)}>
                    {tabLabels[item.id] === "Android" ? "Android" : t(tabLabels[item.id] as TranslationKey)}
                    <span className={cx("font-mono text-[11.5px]", current ? "opacity-75" : "text-muted")}>{item.devices.length}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <div data-gallery-load-progress title={t("galleryLoadedPreviews", { loaded: loadedCount, count })}
              className="flex h-[34px] items-center gap-2 rounded-[9px] border border-line pe-1 ps-2.5">
              <span aria-hidden="true" className="flex h-[5px] w-16 overflow-hidden rounded-full bg-line-soft">
                <span className="bg-accent transition-[width]" style={{ width: `${count ? (loadedCount / count) * 100 : 0}%` }} />
                <span className="bg-warn transition-[width]" style={{ width: `${count ? (incompleteIds.length / count) * 100 : 0}%` }} />
              </span>
              <span className="font-mono text-xs">{loadedCount}/{count}</span>
              {loadingPaused && <span className="text-xs text-muted">{t("galleryLoadingPaused")}</span>}
              <button type="button" onClick={onToggleLoading} aria-label={t(loadingPaused ? "resumeLoading" : "pauseLoading")} title={t(loadingPaused ? "galleryResumeLoading" : "galleryPauseLoading")}
                className={cx("grid size-7 place-items-center rounded-[7px] bg-sunken text-ink", focusRing)}>
                {loadingPaused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
              </button>
            </div>
            {incompleteIds.length > 0 && (
              <button type="button" title={t("retryIncompletePreviews")} onClick={() => incompleteIds.forEach(reloadSlot)}
                className={cx("h-[34px] rounded-[9px] border border-warn-line bg-warn-soft px-2.5 text-[13px] font-semibold text-warn", focusRing)}>
                {t("retryCount", { count: incompleteIds.length })}
              </button>
            )}
            <Segmented label={t("previewLoadingSpeed")} value={loadingMode ?? "fast"} onChange={changeLoadingMode}
              options={[{ value: "fast", label: t("fast"), title: t("galleryFastLoading") }, { value: "gentle", label: t("gentle"), title: t("galleryGentleLoading") }]} />
            <Segmented label={t("previewStyle")} value={display.previewStyle === "free" ? "free" : "device"}
              onChange={value => simulator.updateDisplay(current => ({ ...current, previewStyle: value === "free" ? "free" : "device" }))}
              options={[
                { value: "device", label: t("deviceView"), tooltip: t("tipDeviceView") },
                { value: "free", label: t("freeView"), tooltip: t("tipFreeView") },
              ]} />
            <div role="group" aria-label={t("syncBetweenDevices")} className="flex h-[34px] items-center gap-0.5 rounded-[9px] bg-sunken px-[3px]">
              <SyncToggle label={t("scrollSync")} description={t("scrollSyncHint")} pressed={display.scrollSync} onClick={() => toggleSync("scrollSync")}><ScrollSyncIcon size={14} /></SyncToggle>
              <SyncToggle label={t("navigationSync")} description={t("navigationSyncHint")} pressed={display.navigationSync} onClick={() => toggleSync("navigationSync")}><NavigationSyncIcon size={14} /></SyncToggle>
            </div>
            <IconButton label={t("reloadAll")} tooltip={t("resetGalleryPreviews")} onClick={refreshAll}><ReloadIcon size={16} /></IconButton>
            <IconButton label={t("viewMode")} tooltip={t("tipFocusMode")} tooltipAlign="end" tone="primary" onClick={() => setViewMode(true)}><EyeIcon size={16} /></IconButton>
            <IconButton ref={settingsRef} label={t("settings")} tooltip={t("tipSettings")} tooltipAlign="end" pressed={settingsOpen} aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}><SettingsIcon size={16} /></IconButton>
            {/* Only the workspace closes the viewer; here × goes back to it. */}
            <IconButton label={t("backToWorkspace")} tooltip={t("tipBackToWorkspace")} tooltipAlign="end" onClick={onClose}><CloseIcon size={18} /></IconButton>
          </div>
        </header>}

        <div ref={scrollRef} data-gallery-scroll tabIndex={expandedDeviceId ? -1 : 0} aria-label={t("allDevices")}
          className={cx("min-h-0 flex-1 overscroll-contain outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent", expandedDeviceId ? "overflow-hidden" : "overflow-y-auto")}>
          <section key={group.id} data-gallery-group={group.id} aria-labelledby={expandedDeviceId ? undefined : `gallery-heading-${group.id}`}
            className={cx("flex flex-col gap-4 px-6 pb-8", viewMode ? "pt-6" : "pt-[18px]")}>
            {!viewMode && <div inert={expandedDeviceId !== null} className="flex flex-wrap items-baseline gap-2.5">
              <h1 id={`gallery-heading-${group.id}`} className="text-lg font-semibold tracking-tight">{t(groupLabels[group.id])}</h1>
              <span className="font-mono text-xs text-muted">{t("galleryWidthRange", { range: widthRange })}</span>
            </div>}
            <div data-gallery-grid className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-end gap-x-6 gap-y-10">
              {group.devices.map(device => <GalleryCard key={`${device.id}-${refreshVersion}`} device={device} slot={slotsByDevice.get(device.id)!} display={display} scrollRef={scrollRef}
                inactive={expandedDeviceId !== null}
                captions={!viewMode}
                loadRequest={currentLoads?.requests.get(`gallery-${device.id}`)} loadStatus={currentLoads?.states.get(`gallery-${device.id}`) ?? "queued"}
                onPreviewLoad={previewLoaded} onPreviewReady={previewReady} onReload={reloadSlot} onEnlarge={enlarge} onLiveChange={setSlotLive} onNearChange={setSlotNear}/>)}
            </div>
          </section>
        </div>
        {popup && <>
          <div aria-hidden="true" data-gallery-backdrop onClick={closePopup} className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px]"/>
          <GalleryPopup device={devices[expandedIndex]} slot={popup} display={display} index={expandedIndex} count={count} stepFocus={stepFocus}
            onStep={stepExpanded} onClose={closePopup} onReload={() => reloadSlot(POPUP_SLOT_ID)}
            onOpenTab={() => window.open(getSlotUrl(POPUP_SLOT_ID), "_blank", "noopener,noreferrer")}
            onOpen={() => onOpenDevice(popup.deviceId, getSlotUrl(POPUP_SLOT_ID))}
            onAdd={() => onAddDevice(popup.deviceId, getSlotUrl(POPUP_SLOT_ID))}
            onCapture={(target, size) => onCaptureDevice(target, devices[expandedIndex], getSlotUrl(POPUP_SLOT_ID), popup, size)}/>
        </>}
        {viewMode && <ViewModeBar showModes={false} single={false} position="" canStep={false} onShowAll={() => {}} onShowOne={() => {}} onPrevious={() => {}} onNext={() => {}} onExit={() => setViewMode(false)} />}
        <SettingsPopover
          open={settingsOpen}
          anchorRef={settingsRef}
          dark={display.darkMode}
          browserBar={settings.browserBar}
          onClose={() => setSettingsOpen(false)}
          onThemeChange={dark => simulator.updateDisplay(current => ({ ...current, darkMode: dark }))}
          onBrowserBarChange={settings.onBrowserBarChange}
          onHelp={settings.onHelp}
          onTour={settings.onTour}
          onWhatsNew={settings.onWhatsNew}
          onPermissions={settings.onPermissions}
        />
      </div>
    </SimulatorScopeProvider>
  );
}

function SyncToggle({ label, description, pressed, onClick, children }: { label: string; description: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip title={label} description={description}>
      <button type="button" aria-label={label} aria-pressed={pressed} onClick={onClick}
        className={cx("grid h-7 w-[30px] place-items-center rounded-[7px]", pressed ? "bg-accent-soft text-accent-strong" : "text-ink-2 hover:text-ink", focusRing)}>
        {children}
      </button>
    </Tooltip>
  );
}

const GalleryCard = memo(function GalleryCard({ device, slot, display, scrollRef, inactive, captions, loadRequest, loadStatus, onPreviewLoad, onPreviewReady, onReload, onEnlarge, onLiveChange, onNearChange }: {
  device: Device; slot: PreviewSlot; display: DisplaySettings; scrollRef: RefObject<HTMLDivElement | null>;
  /** True while the enlarged popup is open: the card stays in place but goes quiet. */
  inactive: boolean; captions: boolean;
  loadRequest?: number; loadStatus: GalleryLoadStatus;
  onPreviewLoad: (id: string, request: number, status: GalleryLoadResult) => void;
  onPreviewReady: (id: string, request: number) => void;
  onReload: (id: string) => void; onEnlarge: (id: string) => void;
  onLiveChange: (id: string, live: boolean) => void;
  /** Within the keep zone around the viewport: the card may keep its page. */
  onNearChange: (id: string, near: boolean) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [near, setNear] = useState(false);
  const [scale, setScale] = useState<number | null>(null);
  const simulator = useSimulatorRef();
  const live = !inactive && visible;
  const previewDisplay = useMemo(() => live ? display : { ...display, scrollSync: false, navigationSync: false }, [display, live]);
  const enlarge = useCallback(() => onEnlarge(device.id), [device.id, onEnlarge]);
  const loaded = useCallback((id: string, status: GalleryLoadResult) => {
    if (loadRequest !== undefined) onPreviewLoad(id, loadRequest, status);
  }, [loadRequest, onPreviewLoad]);
  const ready = useCallback((id: string) => {
    if (loadRequest !== undefined) onPreviewReady(id, loadRequest);
  }, [loadRequest, onPreviewReady]);
  useEffect(() => {
    onLiveChange(slot.id, live);
    return () => onLiveChange(slot.id, false);
  }, [live, onLiveChange, slot.id]);
  useEffect(() => {
    onNearChange(slot.id, near);
    return () => onNearChange(slot.id, false);
  }, [near, onNearChange, slot.id]);
  const size = supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport;
  // Each card is as tall as its device needs at the column width, so wide
  // laptops, desktops and TVs do not sit under a phone-sized gap. Rows take
  // their tallest card; phones still reach the same cap as before.
  const [cardWidth, setCardWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setCardWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const frame = display.previewStyle === "free" ? size
    : estimateDeviceFrameSize({ device, showFrame: slot.showFrame, showStatusBar: true, showUrlBar: true, viewportSize: size });
  const previewCap = device.type === "watch" ? GALLERY_WATCH_PREVIEW_MAX : GALLERY_PREVIEW_MAX;
  const sidePad = device.type === "laptop" || device.type === "desktop" ? 40 : 16;
  // The preview keeps room above the device for its hover toolbar.
  const toolbarSpace = captions ? GALLERY_TOOLBAR_SPACE : 0;
  const previewHeight = cardWidth > 0 ? Math.min(previewCap, Math.ceil((cardWidth - sidePad) * frame.height / frame.width) + 16 + toolbarSpace) : previewCap;
  const cardHeight = previewHeight + (captions ? GALLERY_CAPTION_HEIGHT : 0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { root: scrollRef.current, rootMargin: "200px 0px" });
    const keep = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { root: scrollRef.current, rootMargin: `${GALLERY_KEEP_MARGIN}px 0px` });
    observer.observe(element);
    keep.observe(element);
    return () => { observer.disconnect(); keep.disconnect(); };
  }, [scrollRef]);

  const incomplete = loadStatus === "incomplete" || loadStatus === "error";
  const settled = incomplete || loadStatus === "loaded";
  const deferredNavigation = loadStatus === "queued" && loadRequest !== undefined;
  const statusDot = loadStatus === "loaded" ? "bg-accent" : incomplete ? "bg-warn" : loadStatus === "queued" ? "border-[1.5px] border-faint" : "bg-sky-500";
  const statusText = loadStatus === "loaded" ? (scale === null ? "" : `${Math.round(scale * 100)}%`)
    : incomplete ? t("incomplete") : loadStatus === "queued" ? t("queuedPosition") : t("loading");

  // The card never leaves the grid: enlarging opens a separate popup above the
  // backdrop, so the gallery behind it keeps every device in place.
  return <div ref={ref} data-gallery-device-id={device.id} data-gallery-width={size.width} data-gallery-height={size.height} data-gallery-load-state={loadStatus}
    inert={inactive} aria-hidden={inactive || undefined} style={{ height: cardHeight }} className={cx("group/device relative min-w-0",
      !inactive && "hover:z-20 focus-within:z-20",
      // Far-offscreen cards whose page has settled skip style, layout and paint
      // (and their pages' rendering) while keeping each document and its state.
      // Retained documents awaiting navigation also stay quiet; pages still
      // loading keep rendering so they can report completion.
      !visible && (settled || deferredNavigation) && "[content-visibility:hidden]")}>
    <article onPointerDownCapture={() => simulator.current.setActiveSlot(slot.id)} onFocusCapture={() => simulator.current.setActiveSlot(slot.id)}
      className="group/card flex h-full min-h-0 min-w-0 flex-col">
      {captions && incomplete && (
        <div role="alert" className="mx-auto mb-2.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-warn-line bg-warn-soft py-1 pe-1 ps-2.5 text-xs font-semibold text-warn">
          <AlertIcon size={13} />
          {t("scriptErrors")}
          <button type="button" onClick={() => onReload(slot.id)} className={cx("h-6 rounded-md bg-surface px-2 text-xs font-semibold text-warn", focusRing)}>{t("retry")}</button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {loadRequest !== undefined
          ? <PreviewCard slot={slot} device={device} display={previewDisplay} visualsActive={live} onLoadStateChange={loaded} onPageReady={ready} onScaleChange={setScale}
              showToolbar={captions} onExpand={enlarge} expandLabel={t("enlargePreview")}
              align="bottom" removable={false} focused={false} first last/>
          : <div className="flex h-full flex-col items-center justify-end gap-2 pb-8 text-muted">
              <span className="text-[11px]">{t("queuedPosition")}</span>
            </div>}
      </div>

      {captions && (
        <button type="button" data-gallery-enlarge onClick={enlarge}
          className={cx("mx-auto mt-2.5 flex max-w-full shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-0.5 text-center", focusRing)}>
          <span className="max-w-full truncate text-[13px] font-semibold">{shortName(device.name)}</span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <span aria-hidden="true" className={cx("size-[7px] rounded-full", statusDot)} />
            {/* Sizes stay width×height in right-to-left languages too. */}
            <span dir="ltr">{size.width}×{size.height}</span>{statusText && ` · ${statusText}`}
          </span>
        </button>
      )}
    </article>
  </div>;
});

type StepDirection = "previous" | "next";

// One enlarged device at a time, always the same size whatever the device or
// its orientation; the device scales to fit inside it.
function GalleryPopup({ device, slot, display, index, count, stepFocus, onStep, onClose, onOpenTab, onOpen, onAdd, onReload, onCapture }: {
  device: Device; slot: PreviewSlot; display: DisplaySettings;
  index: number; count: number; stepFocus: RefObject<StepDirection | null>;
  onStep: (direction: StepDirection) => void; onClose: () => void;
  onOpenTab: () => void; onOpen: () => void; onAdd: () => void; onReload: () => void;
  onCapture: (target: HTMLElement, size: { width: number; height: number }) => Promise<void>;
}) {
  const { t } = useI18n();
  const simulator = useSimulatorRef();
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const visualChecks = useVisualRegression({
    slotId: slot.id, deviceId: device.id, deviceName: device.name, orientation: slot.orientation,
    menuOpen: optionsOpen, getFrame: () => popupRef.current?.querySelector("iframe"),
    getUrl: () => simulator.current.getSlotUrl(slot.id), dismissMenu: () => setOptionsOpen(false),
  });
  const size = supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport;
  const ios = getFrameProfile(device).platform === "ios";
  const geometry = getBrowserGeometry(device, size, slot.browserPreferences, { orientation: slot.orientation });
  const closeOptions = () => { setOptionsOpen(false); optionsButtonRef.current?.focus({ preventScroll: true }); };

  // Keep focus on the step button that was used, so repeated presses keep
  // walking the category; otherwise start on close.
  useLayoutEffect(() => {
    setScale(null);
    setOptionsOpen(false);
    const step = stepFocus.current === "previous" ? previousRef.current : stepFocus.current === "next" ? nextRef.current : null;
    (step && !step.disabled ? step : closeRef.current)?.focus({ preventScroll: true });
  }, [device.id, stepFocus]);
  useEffect(() => {
    if (!optionsOpen) return;
    const closeOutside = (event: Event) => {
      if (!optionsMenuRef.current?.contains(event.target as Node) && !optionsButtonRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    };
    const target = getViewerEventTarget();
    target.addEventListener("pointerdown", closeOutside);
    return () => target.removeEventListener("pointerdown", closeOutside);
  }, [optionsOpen]);
  const cycleFocus = (last: boolean) => {
    const controls = popupRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), select, iframe");
    controls?.[last ? controls.length - 1 : 0]?.focus({ preventScroll: true });
  };
  const menuItem = cx("flex h-9 items-center rounded-[7px] px-2 text-start text-[13px] font-medium hover:bg-sunken", focusRing);
  const capture = () => {
    const target = popupRef.current?.querySelector<HTMLElement>("[data-device-capture]");
    if (!target || capturing) return;
    setOptionsOpen(false);
    setCapturing(true);
    void onCapture(target, size).finally(() => setCapturing(false));
  };

  return (
    <div ref={popupRef} data-gallery-expanded data-gallery-popup-device={device.id} role="dialog" aria-modal="true" aria-labelledby="gallery-popup-name"
      onPointerDownCapture={() => simulator.current.setActiveSlot(slot.id)}
      className="@container/popup fixed inset-x-4 bottom-6 top-[72px] z-50 mx-auto flex max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-stage shadow-[0_30px_80px_rgb(20_23_26/0.35)]">
      <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => cycleFocus(true)}/>
      <header className="relative flex h-[52px] shrink-0 items-center gap-1 border-b border-line-soft bg-surface px-2.5">
        <div role="group" aria-label={t("galleryPosition", { index: index + 1, count })}
          className="me-1.5 flex shrink-0 items-center gap-0.5 rounded-[9px] bg-sunken p-[3px]">
          <IconButton ref={previousRef} size="sm" data-gallery-step="previous" disabled={index <= 0}
            label={t("previousInCategory")} onClick={() => onStep("previous")}><ChevronLeftIcon size={15} className="rtl:rotate-180" /></IconButton>
          <span aria-hidden="true" className="min-w-11 text-center font-mono text-xs tabular-nums text-ink-2">{index + 1}/{count}</span>
          <IconButton ref={nextRef} size="sm" data-gallery-step="next" disabled={index >= count - 1}
            label={t("nextInCategory")} onClick={() => onStep("next")}><ChevronRightIcon size={15} className="rtl:rotate-180" /></IconButton>
        </div>
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <h2 id="gallery-popup-name" className="min-w-0 truncate text-sm font-semibold">{shortName(device.name)}</h2>
          <span dir="ltr" className="shrink-0 font-mono text-xs text-muted @max-[560px]/popup:hidden">{size.width}×{size.height}</span>
        </div>
        {/* Secondary tools fold into the menu on narrow popups, so the primary
            action and close always stay on screen. */}
        <div className="flex shrink-0 items-center gap-1">
          {supportsOrientation(device) && <IconButton size="sm" label={t("rotate")} onClick={() => simulator.current.rotateSlot(slot.id)}><RotateIcon size={16} /></IconButton>}
          <IconButton size="sm" data-gallery-capture label={t("captureAndAnnotate")} disabled={capturing} onClick={capture}><CameraIcon size={15} /></IconButton>
          <div className="flex items-center gap-1 @max-[720px]/popup:hidden">
            <IconButton size="sm" label={t("zoomOut")} disabled={slot.zoom <= 0.2} onClick={() => simulator.current.zoomSlot(slot.id, "out")}><MinusIcon size={14} /></IconButton>
            <button type="button" title={t("resetFit")} onClick={() => simulator.current.setSlotZoomMode(slot.id, "fit")} className={cx("h-7 min-w-12 rounded-[7px] bg-sunken px-1 font-mono text-xs text-ink", focusRing)}>{scale === null ? "–" : `${Math.round(scale * 100)}%`}</button>
            <IconButton size="sm" label={t("zoomIn")} disabled={slot.zoom >= 1.6} onClick={() => simulator.current.zoomSlot(slot.id, "in")}><PlusIcon size={14} strokeWidth={2.4} /></IconButton>
          </div>
          <div className="flex items-center gap-1 @max-[620px]/popup:hidden">
            <IconButton size="sm" label={t("reloadPreview")} onClick={onReload}><ReloadIcon size={15} /></IconButton>
            <IconButton size="sm" label={t("openInTab")} title={t("galleryVerificationHelp")} onClick={onOpenTab}><OpenInTabIcon size={15} /></IconButton>
          </div>
          <div className="relative">
            <IconButton ref={optionsButtonRef} size="sm" label={t("viewportOptions")} aria-expanded={optionsOpen} pressed={optionsOpen} onClick={() => setOptionsOpen(value => !value)}><MoreIcon size={16} /></IconButton>
            {optionsOpen && <div ref={optionsMenuRef} role="group" aria-label={t("viewportOptions")} onKeyDown={event => {
              if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeOptions(); }
            }} className="absolute end-0 top-full z-30 mt-1 flex w-64 flex-col gap-1 whitespace-normal rounded-xl border border-line bg-surface p-1.5 text-ink shadow-popover">
              <button type="button" onClick={() => { setOptionsOpen(false); onOpen(); }} className={menuItem}>{t("openDeviceInWorkspace", { name: shortName(device.name) })}</button>
              {FEATURES.visualChecks && visualChecks.menuItems}
              <button type="button" onClick={() => { setOptionsOpen(false); simulator.current.setSlotZoomMode(slot.id, "fit"); }} className={cx(menuItem, "hidden @max-[720px]/popup:flex")}>{t("resetFit")}</button>
              <button type="button" onClick={() => { setOptionsOpen(false); onReload(); }} className={cx(menuItem, "hidden @max-[620px]/popup:flex")}>{t("reloadPreview")}</button>
              <button type="button" onClick={() => { setOptionsOpen(false); onOpenTab(); }} className={cx(menuItem, "hidden @max-[620px]/popup:flex")}>{t("openInTab")}</button>
              {ios && <div className="border-t border-line-soft p-1.5"><BrowserAppearanceSettings device={device} slot={slot} geometry={geometry} onClose={closeOptions}/></div>}
            </div>}
          </div>
          <button type="button" onClick={onAdd} className={cx("h-8 shrink-0 whitespace-nowrap rounded-lg bg-accent px-3 text-[12.5px] font-semibold text-on-accent", focusRing)}>{t("addToWorkspace")}</button>
          <IconButton ref={closeRef} size="sm" label={t("backToGallery")} onClick={onClose}><CloseIcon size={16} /></IconButton>
        </div>
      </header>
      {visualChecks.dialog}
      <div className="relative min-h-0 flex-1 p-6">
        {/* A fresh document per device: the popup keeps its own page, while
            the gallery card behind it keeps its own. */}
        <PreviewCard key={device.id} slot={slot} device={device} display={display} onScaleChange={setScale}
          capturePending={capturing} showToolbar={false} align="center" removable={false} focused={false} first last/>
      </div>
      <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => cycleFocus(false)}/>
    </div>
  );
}
