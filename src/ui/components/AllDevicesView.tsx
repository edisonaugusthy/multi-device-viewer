import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n, type TranslationKey } from "../../app/i18n";
import { SimulatorScopeProvider, useSimulator, useSimulatorRef } from "../../app/SimulatorProvider";
import { getViewerEventTarget } from "../../app/viewer-context";
import { groupGalleryDevices, type DeviceGalleryGroupId, type DeviceGalleryGroup } from "../../domain/device/device-gallery";
import { createGalleryLoadQueue, type GalleryLoadSnapshot, type GalleryLoadStatus, type GalleryLoadResult } from "../../domain/device/gallery-load-queue";
import { getDefaultOrientation, nextOrientation, supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import { getBrowserGeometry, type BrowserPreferences } from "../../domain/device/browser-geometry";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import type { Device } from "../../domain/device/device.types";
import { nextZoom } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import {
  AlertIcon,
  BackIcon,
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
import { PreviewCard, shortName } from "./PreviewCard";
import { SettingsPopover, type BrowserBarPosition } from "./SettingsPopover";
import { cx, focusRing, IconButton, Segmented, Tooltip } from "./ui";
import { ViewModeBar } from "./ViewModeBar";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";

type GalleryLoadingMode = "fast" | "gentle";
const LOADING_MODE_KEY = "mdvGalleryLoadingMode";
const loadingPolicy = (mode: GalleryLoadingMode | null, paused: boolean) => ({
  concurrency: mode === "gentle" ? 2 : undefined,
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
  onCloseViewer: () => void;
  settings: GallerySettings;
}

export function AllDevicesView(props: AllDevicesViewProps) {
  const { devices } = useDeviceCatalog();
  const groups = useMemo(() => groupGalleryDevices(devices), [devices]);
  const [page, setPage] = useState<{ id: DeviceGalleryGroupId; url: string; focusCategory: boolean }>({ id: "ios", url: props.url, focusCategory: false });
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

function GalleryPage({ url, onClose, onOpenDevice, onAddDevice, onCloseViewer, settings, group, groups, onSelectGroup, focusCategory,
  loadingMode, changeLoadingMode, loadingPaused, onToggleLoading }: AllDevicesViewProps & {
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
  const loadPolicy = useRef(loadingPolicy(loadingMode, loadingPaused));
  loadPolicy.current = loadingPolicy(loadingMode, loadingPaused);
  const [expandedDeviceId, setExpandedDevice] = useState<string | null>(null);
  const [activeSlotId, setActiveSlot] = useState("");
  const [changes, setChanges] = useState<Record<string, PreviewSlot>>({});
  const [liveSlotIds, setLiveSlotIds] = useState(() => new Set<string>());
  const [loadState, setLoadState] = useState<GalleryLoadSnapshot & { generation: number }>(() => ({ generation: -1, states: new Map(), requests: new Map() }));
  const loadQueueRef = useRef<{ generation: number; queue: ReturnType<typeof createGalleryLoadQueue> } | null>(null);
  const pendingNavigation = useRef(new Map<string, string>());
  const [initialPreferences] = useState(() => new Map(simulator.slots.map(slot => [slot.deviceId, slot.browserPreferences])));
  const observedUrls = useRef(new Map<string, string>());
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const baseSlots = useMemo(() => devices.map(device => ({
    id: `gallery-${device.id}`, deviceId: device.id, url,
    orientation: getDefaultOrientation(device), zoom: 0.58,
    zoomMode: "fit" as const, reloadToken: 0, showFrame: true,
    browserPreferences: initialPreferences.get(device.id),
  })), [devices, initialPreferences, url]);
  const slots = useMemo(() => baseSlots.map(slot => changes[slot.id] ?? slot), [baseSlots, changes]);
  const liveSlots = useMemo(() => slots.filter(slot => liveSlotIds.has(slot.id) && loadState.generation === refreshVersion && loadState.requests.has(slot.id)), [slots, liveSlotIds, loadState.generation, loadState.requests, refreshVersion]);
  const syncSourceId = liveSlots.some(slot => slot.id === activeSlotId) ? activeSlotId : liveSlots[0]?.id ?? "";
  const setSlotLive = useCallback((id: string, live: boolean) => {
    // Visibility controls bridge activity, never the iframe's lifetime or src.
    setLiveSlotIds(current => {
      if (current.has(id) === live) return current;
      const next = new Set(current);
      if (live) next.add(id); else next.delete(id);
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
    setChanges(current => {
      const slot = current[id] ?? baseSlots.find(candidate => candidate.id === id);
      return slot ? { ...current, [id]: update(slot) } : current;
    });
  }, [baseSlots]);
  const observeSlotUrl = useCallback((id: string, nextUrl: string) => { observedUrls.current.set(id, nextUrl); }, []);
  const getSlotUrl = useCallback((id: string) => observedUrls.current.get(id) ?? slots.find(slot => slot.id === id)?.url ?? url, [slots, url]);
  useEffect(() => {
    const queue = createGalleryLoadQueue(loadOrder, {
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
  useEffect(() => { loadQueueRef.current?.queue.configure(loadingPolicy(loadingMode, loadingPaused)); }, [loadingMode, loadingPaused]);
  useEffect(() => { loadQueueRef.current?.queue.prioritize(liveSlotIds); }, [liveSlotIds, refreshVersion]);
  const previewLoaded = useCallback((id: string, request: number, status: GalleryLoadResult) => {
    if (loadQueueRef.current?.generation === refreshVersion) loadQueueRef.current.queue.settle(id, request, status);
  }, [refreshVersion]);
  const queueNavigation = useCallback((id: string, nextUrl: string) => {
    if ((pendingNavigation.current.get(id) ?? getSlotUrl(id)) === nextUrl) return;
    pendingNavigation.current.set(id, nextUrl);
    loadQueueRef.current?.queue.enqueue(id);
  }, [getSlotUrl]);
  const openTab = useCallback((id: string) => window.open(getSlotUrl(`gallery-${id}`), "_blank", "noopener,noreferrer"), [getSlotUrl]);
  const reloadSlot = useCallback((id: string) => {
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
  const openDevice = useCallback((id: string) => onOpenDevice(id, getSlotUrl(`gallery-${id}`)), [getSlotUrl, onOpenDevice]);
  const addDevice = useCallback((id: string) => onAddDevice(id, getSlotUrl(`gallery-${id}`)), [getSlotUrl, onAddDevice]);

  useEffect(() => {
    if (!display.navigationSync) return;
    const followNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ slotId: string; url: string }>).detail;
      if (!detail || !baseSlots.some(slot => slot.id === detail.slotId)) return;
      pendingNavigation.current.delete(detail.slotId);
      loadQueueRef.current?.queue.cancelPending(detail.slotId);
      // Follow across this category, including offscreen previews. Keep the
      // source document intact and coalesce fast navigation to the latest URL.
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
    const close = () => viewMode ? setViewMode(false) : expandedDeviceId ? setExpandedDevice(null) : onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); close(); }
    };
    const closeFromPreview = (event: MessageEvent) => {
      if (event.data?.type !== "MDV_PREVIEW_ESCAPE") return;
      if (Array.from(rootRef.current?.querySelectorAll("iframe") ?? []).some(frame => frame.contentWindow === event.source)) close();
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", closeOnEscape);
    window.addEventListener("message", closeFromPreview);
    return () => { target.removeEventListener("keydown", closeOnEscape); window.removeEventListener("message", closeFromPreview); };
  }, [expandedDeviceId, onClose, viewMode]);

  const jumpToGroup = (id: DeviceGalleryGroupId) => {
    if (id !== selectedGroup) onSelectGroup(id, display.navigationSync ? getSlotUrl(syncSourceId) : url);
  };
  const toggleSync = (key: "scrollSync" | "navigationSync") => simulator.updateDisplay(current => ({ ...current, [key]: !current[key] }));
  const widthRange = `${group.devices[0].cssViewport.width}${group.devices[0].cssViewport.width !== group.devices.at(-1)!.cssViewport.width ? `–${group.devices.at(-1)!.cssViewport.width}` : ""}`;

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

          <div className="min-w-[90px] flex-1">
            <label className="sr-only" htmlFor="mdv-gallery-category">{t("deviceCategories")}</label>
            <select id="mdv-gallery-category" aria-label={t("deviceCategories")} value={selectedGroup ?? ""} onChange={event => jumpToGroup(event.target.value as DeviceGalleryGroupId)}
              className={cx("h-8 w-full max-w-48 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-semibold text-ink @min-[1200px]/gallery:hidden", focusRing)}>
              {groups.map(item => <option key={item.id} value={item.id}>{t(groupLabels[item.id])} · {item.devices.length}</option>)}
            </select>
            <nav aria-label={t("deviceCategories")} className="hidden min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] @min-[1200px]/gallery:flex">
              {groups.map(item => {
                const current = selectedGroup === item.id;
                return (
                  <button type="button" key={item.id} aria-current={current ? "page" : undefined} onClick={() => jumpToGroup(item.id)}
                    className={cx("flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px]",
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
            <IconButton label={t("closeViewer")} tooltip={t("tipCloseViewer")} tooltipAlign="end" onClick={onCloseViewer}><CloseIcon size={18} /></IconButton>
          </div>
        </header>}

        <div ref={scrollRef} data-gallery-scroll tabIndex={expandedDeviceId ? -1 : 0} aria-label={t("allDevices")}
          className={cx("min-h-0 flex-1 overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent", expandedDeviceId ? "overflow-hidden" : "overflow-y-auto")}>
          <section key={group.id} data-gallery-group={group.id} aria-labelledby={expandedDeviceId ? undefined : `gallery-heading-${group.id}`}
            className={cx("flex flex-col gap-4 px-6 pb-8", viewMode ? "pt-6" : "pt-[18px]")}>
            {!viewMode && <div inert={expandedDeviceId !== null} className="flex flex-wrap items-baseline gap-2.5">
              <h1 id={`gallery-heading-${group.id}`} className="text-lg font-semibold tracking-tight">{t(groupLabels[group.id])}</h1>
              <span className="font-mono text-xs text-muted">{t("galleryWidthRange", { range: widthRange })}</span>
            </div>}
            <div data-gallery-grid className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-end gap-x-6 gap-y-10">
              {group.devices.map(device => <GalleryCard key={`${device.id}-${refreshVersion}`} device={device} slot={slotsByDevice.get(device.id)!} display={display} scrollRef={scrollRef}
                expanded={expandedDeviceId === device.id} inactive={expandedDeviceId !== null && expandedDeviceId !== device.id}
                captions={!viewMode}
                loadRequest={currentLoads?.requests.get(`gallery-${device.id}`)} loadStatus={currentLoads?.states.get(`gallery-${device.id}`) ?? "queued"}
                onPreviewLoad={previewLoaded} onOpenTab={openTab} onOpen={openDevice} onAdd={addDevice} onReload={reloadSlot} onEnlarge={setExpandedDevice} onLiveChange={setSlotLive}/>)}
            </div>
          </section>
        </div>
        {expandedDeviceId && <div aria-hidden="true" data-gallery-backdrop onClick={() => setExpandedDevice(null)} className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px]"/>}
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

const GalleryCard = memo(function GalleryCard({ device, slot, display, scrollRef, expanded, inactive, captions, loadRequest, loadStatus, onPreviewLoad, onOpenTab, onOpen, onAdd, onReload, onEnlarge, onLiveChange }: {
  device: Device; slot: PreviewSlot; display: DisplaySettings; scrollRef: RefObject<HTMLDivElement | null>;
  expanded: boolean; inactive: boolean; captions: boolean;
  loadRequest?: number; loadStatus: GalleryLoadStatus;
  onPreviewLoad: (id: string, request: number, status: GalleryLoadResult) => void;
  onOpenTab: (id: string) => void;
  onOpen: (id: string) => void; onAdd: (id: string) => void; onReload: (id: string) => void; onEnlarge: (id: string | null) => void;
  onLiveChange: (id: string, live: boolean) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const resizeRef = useRef<HTMLButtonElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const wasExpanded = useRef(false);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState<number | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const simulator = useSimulatorRef();
  const live = !inactive && (visible || expanded);
  const previewDisplay = useMemo(() => live ? display : { ...display, scrollSync: false, navigationSync: false }, [display, live]);
  const enlarge = useCallback(() => onEnlarge(device.id), [device.id, onEnlarge]);
  const loaded = useCallback((id: string, status: GalleryLoadResult) => {
    if (loadRequest !== undefined) onPreviewLoad(id, loadRequest, status);
  }, [loadRequest, onPreviewLoad]);
  useEffect(() => {
    onLiveChange(slot.id, live);
    return () => onLiveChange(slot.id, false);
  }, [live, onLiveChange, slot.id]);
  const size = supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport;
  const ios = getFrameProfile(device).platform === "ios";
  const geometry = getBrowserGeometry(device, size, slot.browserPreferences, { orientation: slot.orientation });
  const closeOptions = () => { setOptionsOpen(false); optionsButtonRef.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!optionsOpen) return;
    const closeOutside = (event: Event) => {
      if (!optionsMenuRef.current?.contains(event.target as Node) && !optionsButtonRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    };
    const target = getViewerEventTarget();
    target.addEventListener("pointerdown", closeOutside);
    return () => target.removeEventListener("pointerdown", closeOutside);
  }, [optionsOpen]);
  useLayoutEffect(() => {
    if (expanded) setVisible(true);
    else if (wasExpanded.current) {
      const card = ref.current?.getBoundingClientRect();
      const viewport = scrollRef.current?.getBoundingClientRect();
      if (card && viewport && (card.bottom <= viewport.top || card.top >= viewport.bottom)) ref.current?.scrollIntoView({ block: "nearest" });
    }
    if (expanded || wasExpanded.current) resizeRef.current?.focus({ preventScroll: true });
    wasExpanded.current = expanded;
  }, [expanded, scrollRef]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(expanded || entry.isIntersecting), { root: scrollRef.current, rootMargin: "600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, scrollRef]);

  const incomplete = loadStatus === "incomplete" || loadStatus === "error";
  const settled = incomplete || loadStatus === "loaded";
  const statusDot = loadStatus === "loaded" ? "bg-accent" : incomplete ? "bg-warn" : loadStatus === "queued" ? "border-[1.5px] border-faint" : "bg-sky-500";
  const statusText = loadStatus === "loaded" ? (scale === null ? "" : `${Math.round(scale * 100)}%`)
    : incomplete ? t("incomplete") : loadStatus === "queued" ? t("queuedPosition") : t("loading");

  // The grid placeholder and live preview stay mounted while the same card
  // grows into a popup, preserving both the row and the iframe document.
  return <div ref={ref} data-gallery-device-id={device.id} data-gallery-width={size.width} data-gallery-height={size.height} data-gallery-load-state={loadStatus}
    inert={inactive} aria-hidden={inactive || undefined} className={cx(device.type === "watch" ? "h-[400px]" : "h-[620px]", "group/device relative min-w-0",
      // The popup lives inside this card, so the card itself must sit above the
      // backdrop while expanded; otherwise the hover/focus lift traps it below.
      expanded ? "z-50" : "hover:z-20 focus-within:z-20",
      // Far-offscreen cards whose page has settled skip style, layout and paint
      // (and their pages' rendering) while keeping each document and its state.
      // Pages still loading keep rendering so they can report completion.
      !visible && !expanded && settled && "[content-visibility:hidden]")}>
    <article ref={articleRef} data-gallery-expanded={expanded || undefined} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined}
      onPointerDownCapture={() => simulator.current.setActiveSlot(slot.id)} onFocusCapture={() => simulator.current.setActiveSlot(slot.id)}
      aria-labelledby={expanded ? `gallery-device-name-${device.id}` : undefined}
      className={cx("group/card flex min-h-0 min-w-0 flex-col",
        expanded ? "fixed inset-x-4 bottom-6 top-[72px] z-50 mx-auto overflow-hidden rounded-2xl bg-stage shadow-[0_30px_80px_rgb(20_23_26/0.35)]" : "h-full",
        // Landscape screens (laptops, desktops, TVs) get a wider popup.
        expanded && (size.width > size.height ? "max-w-[1280px]" : "max-w-[720px]"))}>
      {expanded && <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => {
        const controls = articleRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), select, iframe");
        controls?.[controls.length - 1]?.focus({ preventScroll: true });
      }}/>}
      {expanded && (
        <header className="relative flex shrink-0 items-center gap-1 border-b border-line-soft bg-surface py-2.5 pe-2.5 ps-4">
          <h2 id={`gallery-device-name-${device.id}`} className="min-w-0 truncate text-sm font-semibold">{shortName(device.name)}</h2>
          <span className="px-1.5 font-mono text-xs text-muted">{size.width}×{size.height}</span>
          <span className="flex-1" />
          {supportsOrientation(device) && <IconButton size="sm" label={t("rotate")} onClick={() => simulator.current.rotateSlot(slot.id)}><RotateIcon size={16} /></IconButton>}
          <IconButton size="sm" label={t("zoomOut")} disabled={slot.zoom <= 0.2} onClick={() => simulator.current.zoomSlot(slot.id, "out")}><MinusIcon size={14} /></IconButton>
          <button type="button" title={t("resetFit")} onClick={() => simulator.current.setSlotZoomMode(slot.id, "fit")} className={cx("h-7 min-w-12 rounded-[7px] bg-sunken px-1 font-mono text-xs text-ink", focusRing)}>{scale === null ? "–" : `${Math.round(scale * 100)}%`}</button>
          <IconButton size="sm" label={t("zoomIn")} disabled={slot.zoom >= 1.6} onClick={() => simulator.current.zoomSlot(slot.id, "in")}><PlusIcon size={14} strokeWidth={2.4} /></IconButton>
          <IconButton size="sm" label={t("reloadPreview")} onClick={() => onReload(slot.id)}><ReloadIcon size={15} /></IconButton>
          <IconButton size="sm" label={t("openInTab")} title={t("galleryVerificationHelp")} onClick={() => onOpenTab(device.id)}><OpenInTabIcon size={15} /></IconButton>
          <div className="relative">
            <IconButton ref={optionsButtonRef} size="sm" label={t("viewportOptions")} aria-expanded={optionsOpen} pressed={optionsOpen} onClick={() => setOptionsOpen(value => !value)}><MoreIcon size={16} /></IconButton>
            {optionsOpen && <div ref={optionsMenuRef} role="group" aria-label={t("viewportOptions")} onKeyDown={event => {
              if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeOptions(); }
            }} className="absolute end-0 top-full z-30 mt-1 flex w-64 flex-col gap-1 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-popover">
              <button type="button" onClick={() => { setOptionsOpen(false); onOpen(device.id); }}
                className={cx("flex h-9 items-center rounded-[7px] px-2 text-start text-[13px] font-medium hover:bg-sunken", focusRing)}>{t("openDeviceInWorkspace", { name: shortName(device.name) })}</button>
              {ios && <div className="border-t border-line-soft p-1.5"><BrowserAppearanceSettings device={device} slot={slot} geometry={geometry} onClose={closeOptions}/></div>}
            </div>}
          </div>
          <button type="button" onClick={() => onAdd(device.id)} className={cx("h-8 rounded-lg bg-accent px-3 text-[12.5px] font-semibold text-on-accent", focusRing)}>{t("addToWorkspace")}</button>
          <IconButton ref={resizeRef} size="sm" label={t("backToGallery")} aria-expanded={expanded} onClick={() => onEnlarge(null)}><CloseIcon size={16} /></IconButton>
        </header>
      )}

      {!expanded && captions && incomplete && (
        <div role="alert" className="mx-auto mb-2.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-warn-line bg-warn-soft py-1 pe-1 ps-2.5 text-xs font-semibold text-warn">
          <AlertIcon size={13} />
          {t("scriptErrors")}
          <button type="button" onClick={() => onReload(slot.id)} className={cx("h-6 rounded-md bg-surface px-2 text-xs font-semibold text-warn", focusRing)}>{t("retry")}</button>
        </div>
      )}

      <div className={cx("relative min-h-0 flex-1", expanded && "p-6")}>
        {loadRequest !== undefined
          ? <PreviewCard slot={slot} device={device} display={previewDisplay} visualsActive={live} onLoadStateChange={loaded} onScaleChange={setScale}
              showToolbar={!expanded && captions} onExpand={enlarge} expandLabel={t("enlargePreview")}
              align={expanded ? "center" : "bottom"} removable={false} focused={false} first last/>
          : <div className="flex h-full flex-col items-center justify-end gap-2 pb-8 text-muted">
              <span className="text-[11px]">{t("galleryQueuedPreview")}</span>
            </div>}
      </div>

      {!expanded && captions && (
        <button type="button" onClick={() => onEnlarge(device.id)}
          className={cx("mx-auto mt-2.5 flex max-w-full shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-0.5 text-center", focusRing)}>
          <span className="max-w-full truncate text-[13px] font-semibold">{shortName(device.name)}</span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <span aria-hidden="true" className={cx("size-[7px] rounded-full", statusDot)} />
            {size.width}×{size.height}{statusText && ` · ${statusText}`}
          </span>
        </button>
      )}
      {expanded && <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => articleRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true })}/>}
    </article>
  </div>;
});
