import { ArrowLeft, ArrowUpRight, ExternalLink, Grid2X2, Link2, LoaderCircle, Maximize2, Minimize2, Minus, Moon, MoreVertical, Plus, RefreshCw, Route, Smartphone, Square, Sun } from "lucide-react";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n, type TranslationKey } from "../../app/i18n";
import { SimulatorScopeProvider, useSimulator } from "../../app/SimulatorProvider";
import { getViewerEventTarget } from "../../app/viewer-context";
import { groupGalleryDevices, type DeviceGalleryGroupId, type DeviceGalleryGroup } from "../../domain/device/device-gallery";
import { createGalleryLoadQueue, type GalleryLoadSnapshot, type GalleryLoadStatus, type GalleryLoadResult } from "../../domain/device/gallery-load-queue";
import { getDefaultOrientation } from "../../domain/device/device-service";
import { getBrowserGeometry, type BrowserPreferences } from "../../domain/device/browser-geometry";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import type { Device } from "../../domain/device/device.types";
import { nextZoom } from "../../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { BrowserAppearanceSettings } from "./BrowserAppearanceSettings";
import { PreviewCard } from "./PreviewCard";
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

interface AllDevicesViewProps {
  url: string;
  onClose: () => void;
  onOpenDevice: (deviceId: string, url: string) => void;
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

function GalleryPage({ url, onClose, onOpenDevice, group, groups, onSelectGroup, focusCategory,
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
  const [toolbarOptionsOpen, setToolbarOptionsOpen] = useState(false);
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
  const toolbarOptionsRef = useRef<HTMLButtonElement>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);
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
  const loading = !currentLoads || [...currentLoads.states.values()].some(status => status === "queued" || status === "loading" || status === "slow");
  const dark = simulator.display.darkMode;
  // The workspace pauses its bridges while this surface uses the same settings.
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
  const previewUrl = display.navigationSync ? getSlotUrl(syncSourceId) : url;
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
    setToolbarOptionsOpen(false);
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
  const scope = useMemo(() => ({
    slots: liveSlots, activeSlotId: syncSourceId, display, setActiveSlot, observeSlotUrl, getSlotUrl, reloadSlot, zoomSlot, setSlotZoomMode, setSlotBrowserPreferences,
    setSlotUrl: queueNavigation,
  }), [liveSlots, syncSourceId, display, observeSlotUrl, getSlotUrl, reloadSlot, zoomSlot, setSlotZoomMode, setSlotBrowserPreferences, queueNavigation]);
  const openDevice = useCallback((id: string) => onOpenDevice(id, getSlotUrl(`gallery-${id}`)), [getSlotUrl, onOpenDevice]);

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
  useLayoutEffect(() => {
    if (toolbarOptionsOpen) toolbarMenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [toolbarOptionsOpen]);
  useEffect(() => {
    if (!toolbarOptionsOpen) return;
    const closeOutside = (event: Event) => {
      if (!toolbarMenuRef.current?.contains(event.target as Node) && !toolbarOptionsRef.current?.contains(event.target as Node)) setToolbarOptionsOpen(false);
    };
    const target = getViewerEventTarget();
    target.addEventListener("pointerdown", closeOutside);
    return () => target.removeEventListener("pointerdown", closeOutside);
  }, [toolbarOptionsOpen]);
  useEffect(() => {
    const close = () => expandedDeviceId ? setExpandedDevice(null) : onClose();
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
  }, [expandedDeviceId, onClose]);

  const quiet = dark ? "border-white/15 text-slate-300 hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-100";
  const syncControls = [
    { key: "scrollSync" as const, icon: <Link2 size={14}/>, label: t("scrollSync"), title: t(display.scrollSync ? "turnOffScrollSync" : "turnOnScrollSync") },
    { key: "navigationSync" as const, icon: <Route size={14}/>, label: t("navigationSync"), title: t(display.navigationSync ? "turnOffNavigationSync" : "turnOnNavigationSync") },
  ];
  const jumpToGroup = (id: DeviceGalleryGroupId) => {
    if (id !== selectedGroup) onSelectGroup(id, display.navigationSync ? getSlotUrl(syncSourceId) : url);
  };
  return (
    <SimulatorScopeProvider value={scope}>
      <div ref={rootRef} data-all-devices-view data-gallery-page={selectedGroup} role={expandedDeviceId ? undefined : "dialog"} aria-modal={expandedDeviceId ? undefined : true} aria-label={expandedDeviceId ? undefined : t("allDevices")}
        className={`@container/gallery absolute inset-0 z-40 flex min-h-0 flex-col ${dark ? "bg-[#0b0d12] text-slate-100" : "bg-[#f5f7fa] text-slate-900"}`}>
        <header inert={expandedDeviceId !== null} aria-hidden={expandedDeviceId !== null || undefined}
          className={["relative flex h-11 min-w-0 shrink-0 items-center gap-1.5 border-b px-2 @min-[600px]/gallery:px-4 @min-[1280px]/gallery:px-6", dark ? "border-white/10 bg-[#11141a]" : "border-slate-200 bg-white"].join(" ")}>
            <button ref={backRef} type="button" onClick={onClose} aria-label={t("backToWorkspace")} title={t("backToWorkspace")}
              className={["grid h-7 w-7 shrink-0 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500", quiet].join(" ")}>
              <ArrowLeft size={14}/>
            </button>
              <h1 title={`${t("allDevices")} · ${previewUrl}`} className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-tight">
                <Grid2X2 size={14} className="hidden shrink-0 text-teal-500 @min-[600px]/gallery:block"/><span className="truncate">{t("allDevices")}</span>
                <span data-gallery-load-progress aria-label={t("galleryLoadedPreviews", { loaded: loadedCount, count })} title={t("galleryLoadedPreviews", { loaded: loadedCount, count })}
                  className={["hidden shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium tracking-normal @min-[600px]/gallery:inline-flex", dark ? "bg-white/8 text-slate-400" : "bg-slate-100 text-slate-500"].join(" ")}>
                  {loading && !loadingPaused && <LoaderCircle size={10} className="animate-spin"/>}{loadedCount}/{count}{incompleteIds.length > 0 && ` · ${t("galleryIncompletePreviews", { count: incompleteIds.length })}`}{loadingPaused && ` · ${t("galleryLoadingPaused")}`}
                </span>
              </h1>
            <div className="min-w-[76px] flex-1">
            <select aria-label={t("deviceCategories")} value={selectedGroup ?? ""} onChange={event => jumpToGroup(event.target.value as DeviceGalleryGroupId)}
              className={["h-7 w-full max-w-36 min-w-0 truncate rounded-md border px-1 text-[10px] font-semibold focus-visible:outline-2 focus-visible:outline-teal-500 @min-[1280px]/gallery:hidden", dark ? "border-white/10 bg-[#11141a] text-slate-300" : "border-slate-200 bg-white text-slate-600"].join(" ")}>
              {groups.map(group => <option key={group.id} value={group.id}>{t(groupLabels[group.id])} · {group.devices.length}</option>)}
            </select>
            <nav aria-label={t("deviceCategories")} className="hidden min-w-0 items-center gap-0.5 @min-[1280px]/gallery:flex">
              {groups.map(group => <button type="button" key={group.id} aria-current={selectedGroup === group.id ? "page" : undefined}
                onClick={() => jumpToGroup(group.id)}
                className={["h-7 min-w-0 truncate rounded-md px-2 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-teal-500",
                  selectedGroup === group.id ? dark ? "bg-teal-400/10 text-teal-300" : "bg-teal-50 text-teal-700" : quiet].join(" ")}>
                {t(groupLabels[group.id])}
              </button>)}
            </nav>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div role="group" aria-label={t("previewStyle")} className={["flex rounded-md border p-0.5", dark ? "border-white/10 bg-black/10" : "border-slate-200 bg-slate-100/70"].join(" ")}>
                {[{free:false, label:t("deviceView"), icon:<Smartphone size={13}/>}, {free:true, label:t("freeView"), icon:<Square size={13}/>}].map(({free, label, icon}) =>
                  <button key={label} type="button" aria-label={label} title={label} aria-pressed={(display.previewStyle === "free") === free}
                    onClick={() => simulator.updateDisplay(current => ({ ...current, previewStyle: free ? "free" : "device" }))}
                    className={["flex h-6 w-6 items-center justify-center gap-1 rounded text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-teal-500 @min-[600px]/gallery:w-auto @min-[600px]/gallery:px-2",
                      (display.previewStyle === "free") === free ? dark ? "bg-white/10 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm" : quiet].join(" ")}>
                    {icon}<span className="hidden @min-[600px]/gallery:inline">{label}</span>
                  </button>)}
              </div>
              <span className={["hidden h-4 w-px @min-[600px]/gallery:block", dark ? "bg-white/10" : "bg-slate-200"].join(" ")}/>
              <div className="hidden items-center gap-1 @min-[600px]/gallery:flex">
              {syncControls.map(({key, icon, label, title}) =>
                <button key={key} type="button" aria-label={label} title={title} aria-pressed={display[key]}
                  onClick={() => simulator.updateDisplay(current => ({ ...current, [key]: !current[key] }))}
                  className={["grid h-7 w-7 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500",
                    display[key] ? dark ? "bg-teal-400/10 text-teal-300" : "bg-teal-50 text-teal-700" : quiet].join(" ")}>
                  {icon}
                </button>)}
              </div>
              <button type="button" aria-label={t("reloadAll")} title={t("resetGalleryPreviews")} onClick={refreshAll}
                className={["grid h-7 w-7 place-items-center rounded-md text-teal-600 hover:bg-teal-500/10 focus-visible:outline-2 focus-visible:outline-teal-500", dark ? "text-teal-300" : ""].join(" ")}><RefreshCw size={14}/></button>
              <button type="button" aria-label={dark ? t("lightTheme") : t("darkTheme")} title={dark ? t("lightTheme") : t("darkTheme")}
                onClick={() => simulator.updateDisplay(current => ({ ...current, darkMode: !current.darkMode }))}
                className={["hidden h-7 w-7 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500 @min-[600px]/gallery:grid", quiet].join(" ")}>{dark ? <Sun size={14}/> : <Moon size={14}/>}</button>
              <button ref={toolbarOptionsRef} type="button" aria-label={t("sessionTools")} title={t("sessionTools")} aria-expanded={toolbarOptionsOpen}
                onClick={() => setToolbarOptionsOpen(value => !value)} className={["grid h-7 w-7 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500", quiet].join(" ")}><MoreVertical size={14}/></button>
            </div>
            {toolbarOptionsOpen && <div ref={toolbarMenuRef} role="group" aria-label={t("sessionTools")} onKeyDown={event => {
              if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setToolbarOptionsOpen(false); toolbarOptionsRef.current?.focus({ preventScroll: true }); }
            }} className={["absolute end-2 top-full z-30 mt-1 w-64 max-w-[calc(100%-16px)] rounded-lg border p-2 shadow-xl", dark ? "border-white/10 bg-[#171a21]" : "border-slate-200 bg-white"].join(" ")}>
              <label className="flex flex-col gap-1 px-2 py-1 text-xs font-medium">
                {t("galleryLoadingMode")}
                <select aria-label={t("galleryLoadingMode")} disabled={loadingMode === null} value={loadingMode ?? "fast"}
                  onChange={event => changeLoadingMode(event.target.value as GalleryLoadingMode)}
                  className={`h-8 rounded-md border px-2 focus-visible:outline-teal-500 ${dark ? "border-white/15 bg-[#171a21]" : "border-slate-200 bg-white"}`}>
                  <option value="fast">{t("galleryFastLoading")}</option>
                  <option value="gentle">{t("galleryGentleLoading")}</option>
                </select>
              </label>
              <p className="px-2 py-1 text-[11px] opacity-75">{t("galleryLoadingHelp")}</p>
              {incompleteIds.length > 0 && <button type="button" onClick={() => incompleteIds.forEach(reloadSlot)}
                className={`flex min-h-8 w-full items-center rounded-md px-2 text-xs focus-visible:outline-teal-500 ${quiet}`}>{t("retryIncompletePreviews")}</button>}
              <button type="button" onClick={onToggleLoading}
                className={`flex min-h-8 w-full items-center rounded-md px-2 text-xs focus-visible:outline-teal-500 ${quiet}`}>
                {t(loadingPaused ? "galleryResumeLoading" : "galleryPauseLoading")}
              </button>
              <p className="border-t border-current/10 px-2 pt-2 text-[11px] opacity-75">{t("galleryVerificationHelp")}</p>
              <button type="button" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
                className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-xs text-teal-500 hover:bg-teal-500/10"><ExternalLink size={14}/>{t("openInTab")}</button>
              <div className="@min-[600px]/gallery:hidden">
              {syncControls.map(({key, icon, label, title}) => <button key={key} type="button" aria-label={label} title={title} aria-pressed={display[key]}
                onClick={() => simulator.updateDisplay(current => ({ ...current, [key]: !current[key] }))}
                className={["flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs focus-visible:outline-2 focus-visible:outline-teal-500", display[key] ? dark ? "bg-teal-400/10 text-teal-300" : "bg-teal-50 text-teal-700" : quiet].join(" ")}>{icon}{label}</button>)}
              <button type="button" onClick={() => simulator.updateDisplay(current => ({ ...current, darkMode: !current.darkMode }))}
                className={["flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs focus-visible:outline-2 focus-visible:outline-teal-500", quiet].join(" ")}>{dark ? <Sun size={14}/> : <Moon size={14}/>}<span>{dark ? t("lightTheme") : t("darkTheme")}</span></button>
              </div>
            </div>}
        </header>
        <div ref={scrollRef} data-gallery-scroll tabIndex={expandedDeviceId ? -1 : 0} aria-label={t("allDevices")}
          className={`min-h-0 flex-1 ${expandedDeviceId ? "overflow-hidden" : "overflow-y-auto"} overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500`}>
          <div className="space-y-6 px-4 pb-8 sm:px-6">
            <section key={group.id} data-gallery-group={group.id} aria-labelledby={expandedDeviceId ? undefined : `gallery-heading-${group.id}`}>
              <header inert={expandedDeviceId !== null} aria-hidden={expandedDeviceId !== null || undefined} className={`sticky top-0 z-20 mb-2 flex items-center justify-between border-b py-2 ${dark ? "border-white/10 bg-[#0b0d12]" : "border-slate-200 bg-[#f5f7fa]"}`}>
                <h2 id={`gallery-heading-${group.id}`} className="text-xs font-bold">{t(groupLabels[group.id])}<span className="ms-2 font-normal opacity-60">{group.devices.length}</span></h2>
                <span className="font-mono text-[10px] opacity-60">{group.devices[0].cssViewport.width}{group.devices[0].cssViewport.width !== group.devices.at(-1)!.cssViewport.width && `–${group.devices.at(-1)!.cssViewport.width}`} CSS px</span>
              </header>
              <div data-gallery-grid className="grid grid-cols-1 gap-4 @min-[600px]/gallery:grid-cols-2 @min-[900px]/gallery:grid-cols-3 @min-[1200px]/gallery:grid-cols-4">
                {group.devices.map(device => <GalleryCard key={`${device.id}-${refreshVersion}`} device={device} slot={slotsByDevice.get(device.id)!} display={display} scrollRef={scrollRef}
                  expanded={expandedDeviceId === device.id} inactive={expandedDeviceId !== null && expandedDeviceId !== device.id}
                  loadRequest={currentLoads?.requests.get(`gallery-${device.id}`)} loadStatus={currentLoads?.states.get(`gallery-${device.id}`) ?? "queued"}
                  onPreviewLoad={previewLoaded} onOpenTab={openTab} onOpen={openDevice} onReload={reloadSlot} onEnlarge={setExpandedDevice} onLiveChange={setSlotLive}/>)}
              </div>
            </section>
          </div>
        </div>
        {expandedDeviceId && <div aria-hidden="true" data-gallery-backdrop onClick={() => setExpandedDevice(null)} className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"/>}
      </div>
    </SimulatorScopeProvider>
  );
}

const GalleryCard = memo(function GalleryCard({ device, slot, display, scrollRef, expanded, inactive, loadRequest, loadStatus, onPreviewLoad, onOpenTab, onOpen, onReload, onEnlarge, onLiveChange }: {
  device: Device; slot: PreviewSlot; display: DisplaySettings; scrollRef: RefObject<HTMLDivElement | null>;
  expanded: boolean; inactive: boolean;
  loadRequest?: number; loadStatus: GalleryLoadStatus;
  onPreviewLoad: (id: string, request: number, status: GalleryLoadResult) => void;
  onOpenTab: (id: string) => void;
  onOpen: (id: string) => void; onReload: (id: string) => void; onEnlarge: (id: string | null) => void;
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
  const { zoomSlot, setSlotZoomMode, setActiveSlot } = useSimulator();
  const live = !inactive && (visible || expanded);
  const previewDisplay = useMemo(() => live ? display : { ...display, scrollSync: false, navigationSync: false }, [display, live]);
  const loaded = useCallback((id: string, status: GalleryLoadResult) => {
    if (loadRequest !== undefined) onPreviewLoad(id, loadRequest, status);
  }, [loadRequest, onPreviewLoad]);
  useEffect(() => {
    onLiveChange(slot.id, live);
    return () => onLiveChange(slot.id, false);
  }, [live, onLiveChange, slot.id]);
  const size = device.cssViewport;
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
    if (optionsOpen) optionsMenuRef.current?.querySelector<HTMLElement>("select, button")?.focus({ preventScroll: true });
  }, [optionsOpen]);
  useLayoutEffect(() => {
    if (expanded) setVisible(true);
    else if (wasExpanded.current) {
      const card = ref.current?.getBoundingClientRect();
      const viewport = scrollRef.current?.getBoundingClientRect();
      if (card && viewport && (card.bottom <= viewport.top || card.top >= viewport.bottom)) {
        ref.current?.scrollIntoView({ block: "nearest" });
      }
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
  const quiet = display.darkMode ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
  // The grid placeholder and live preview stay mounted while the same card
  // grows over the gallery, preserving both the row and the iframe document.
  return <div ref={ref} data-gallery-device-id={device.id} data-gallery-width={size.width} data-gallery-height={size.height} data-gallery-load-state={loadStatus}
    inert={inactive} aria-hidden={inactive || undefined} className={`${device.type === "watch" ? "h-[320px]" : "h-[560px]"} min-w-0`}>
    <article ref={articleRef} data-gallery-expanded={expanded || undefined} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined}
      onPointerDownCapture={() => setActiveSlot(slot.id)} onFocusCapture={() => setActiveSlot(slot.id)}
      aria-labelledby={expanded ? `gallery-device-name-${device.id}` : undefined}
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border ${expanded ? "fixed inset-3 z-50 shadow-2xl sm:inset-6" : "h-full"} ${display.darkMode ? "border-white/10 bg-[#11141a]" : "border-slate-200 bg-white"}`}>
    {expanded && <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => {
      const controls = articleRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), select, iframe");
      controls?.[controls.length - 1]?.focus({ preventScroll: true });
    }}/>}
    <header className={`relative shrink-0 border-b ${display.darkMode ? "border-white/10" : "border-slate-100"}`}>
      <div className="flex h-9 min-w-0 items-center gap-1 px-2">
        <h3 id={`gallery-device-name-${device.id}`} title={device.name} className={`min-w-0 flex-1 truncate font-semibold ${expanded ? "text-sm" : "text-[11px]"}`}>{device.name}</h3>
        <span title={`${size.width} × ${size.height} CSS px`} aria-label={`${size.width} × ${size.height} CSS px`} className="shrink-0 font-mono text-[9px] tracking-tight opacity-50">{size.width}×{size.height}</span>
        <div role="group" aria-label={`${t("previewStyle")} · ${device.name}`} className={`flex shrink-0 items-center rounded-md border ${display.darkMode ? "border-white/10 bg-white/3" : "border-slate-200/80 bg-slate-50"}`}>
          <button type="button" aria-label={`${t("zoomOut")} · ${device.name}`} title={t("zoomOut")} disabled={slot.zoom <= 0.2} onClick={() => zoomSlot(slot.id, "out")}
            className={`grid h-6 w-5 place-items-center rounded-s-md focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-30 ${quiet}`}><Minus size={11}/></button>
          <button type="button" aria-label={`${t("resetFit")} · ${device.name}`} title={t("resetFit")} onClick={() => setSlotZoomMode(slot.id, "fit")}
            className={`h-6 min-w-8 px-0.5 font-mono text-[9px] focus-visible:outline-2 focus-visible:outline-teal-500 ${quiet}`}>{scale === null ? "–" : `${Math.round(scale * 100)}%`}</button>
          <button type="button" aria-label={`${t("zoomIn")} · ${device.name}`} title={t("zoomIn")} disabled={slot.zoom >= 1.6} onClick={() => zoomSlot(slot.id, "in")}
            className={`grid h-6 w-5 place-items-center rounded-e-md focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-30 ${quiet}`}><Plus size={11}/></button>
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" aria-label={`${t("reloadPreview")} · ${device.name}`} title={t("reloadPreview")} onClick={() => { setOptionsOpen(false); onReload(slot.id); }} className={`grid h-6 w-6 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500 ${quiet}`}><RefreshCw size={12}/></button>
          <button ref={resizeRef} type="button" aria-label={`${t(expanded ? "backToGallery" : "enlargePreview")} · ${device.name}`} title={t(expanded ? "backToGallery" : "enlargePreview")} aria-expanded={expanded}
            onClick={() => { setOptionsOpen(false); onEnlarge(expanded ? null : device.id); }} className={`flex h-6 min-w-6 items-center justify-center gap-1 rounded-md ${expanded ? "px-1" : "w-6"} text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-teal-500 ${quiet}`}>
            {expanded ? <><Minimize2 size={12}/><span className="hidden sm:inline">{t("backToGallery")}</span></> : <Maximize2 size={12}/>}
          </button>
          <button ref={optionsButtonRef} type="button" aria-label={`${t("viewportOptions")} · ${device.name}`} title={t("viewportOptions")} aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen(value => !value)} className={`grid h-6 w-6 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-teal-500 ${optionsOpen ? "bg-teal-500/10 text-teal-500" : quiet}`}><MoreVertical size={13}/></button>
        </div>
      </div>
      {optionsOpen && <div ref={optionsMenuRef} role="group" aria-label={t("viewportOptions")} onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeOptions(); }
      }} className={`absolute end-2 top-full z-30 mt-1 w-60 rounded-xl border p-3 shadow-xl ${display.darkMode ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        {ios && <BrowserAppearanceSettings device={device} slot={slot} geometry={geometry} onClose={closeOptions}/>}
        <button type="button" onClick={() => { setOptionsOpen(false); onOpen(device.id); }}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-xs text-teal-500 hover:bg-teal-500/10 focus-visible:outline-2 focus-visible:outline-teal-500 ${ios ? "mt-3 border-t border-current/10" : ""}`}><ArrowUpRight size={14} className="shrink-0"/>{t("openDeviceInWorkspace", { name: device.name })}</button>
        <button type="button" title={t("galleryVerificationHelp")} onClick={() => { setOptionsOpen(false); onOpenTab(device.id); }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-xs text-teal-500 hover:bg-teal-500/10 focus-visible:outline-2 focus-visible:outline-teal-500"><ExternalLink size={14} className="shrink-0"/>{t("openInTab")}</button>
      </div>}
    </header>
    <div className={`relative min-h-0 flex-1 ${display.darkMode ? "bg-[#101217]" : "bg-[#f5f5f3]"}`}>
      {loadRequest !== undefined ? <PreviewCard slot={slot} device={device} display={previewDisplay} visualsActive={live} onLoadStateChange={loaded} onScaleChange={setScale} showToolbar={false} removable={false} focused={false} first last/>
        : <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><LoaderCircle size={20} className="animate-spin"/><span className="px-4 text-center text-[11px]">{t("galleryQueuedPreview")}</span></div>}
      {loadRequest !== undefined && (loadStatus === "queued" || loadStatus === "loading" || loadStatus === "slow") && <div className={`pointer-events-none absolute bottom-2 end-2 z-20 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-md px-2 py-1 text-[10px] shadow-sm ${display.darkMode ? "bg-[#171a21]/90 text-slate-300" : "bg-white/90 text-slate-500"}`}>
        <LoaderCircle size={11} className="shrink-0 animate-spin"/><span className="truncate">{t(loadStatus === "queued" ? "galleryQueuedPreview" : "galleryLoadingPreview")}</span>
      </div>}
    </div>
    {expanded && <span tabIndex={0} aria-hidden="true" className="sr-only" onFocus={() => articleRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true })}/>}
    </article>
  </div>;
});
