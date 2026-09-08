import { getViewerContext, getViewerEventTarget, getViewerRoot } from "../../app/viewer-context";
import {
  CircleHelp,
  Eye,
  Focus,
  ChevronRight,
  GripVertical,
  Images,
  Languages,
  PanelsTopLeft,
  Play,
  Plus,
  RefreshCw,
  Route,
  ScanSearch,
  Settings2,
  Square,
  Trash2,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { SUPPORTED_LOCALES, useI18n, type AppLocale } from "../../app/i18n";
import { useReviewPrompt } from "../../app/useReviewPrompt";
import { useSimulator } from "../../app/SimulatorProvider";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import {
  LAST_SEEN_RELEASE_VERSION_KEY,
  PENDING_RELEASE_VERSION_KEY,
  decideStartupNotice,
  releaseNotesFor,
  type VersionReleaseNotes,
} from "../../app/release-notes";
import {
  LOCAL_RECORDING_COMPLETE_EVENT,
  captureTabWithOverlay,
  startTabRecording,
  stopTabRecording,
} from "../../domain/capture/capture-service";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import { defaultDeviceIds, quickDevicePresetIds } from "../../domain/device/device-catalog";
import { appendRecordedStep } from "../../domain/flow/flow-service";
import type { FlowReplayRequest, FlowReplayResult, FlowStep } from "../../domain/flow/flow.types";
import {
  readStore,
  writeStore,
} from "../../infrastructure/storage/local-store";
import { AnnotationOverlay } from "./AnnotationOverlay";
import {
  DesignReferencePanel,
  type ReferenceMode,
} from "./DesignReferencePanel";
import { CustomDeviceModal } from "./CustomDeviceModal";
import { FirstRunGuide } from "./FirstRunGuide";
import { PresetsManager } from "./PresetsManager";
import { PermissionsInfoModal } from "./PermissionsInfoModal";
import { PreviewCard } from "./PreviewCard";
import { ReviewIssueModal } from "./ReviewIssueModal";
import { ReviewPromptModal } from "./ReviewPromptModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { HelpModal } from "./HelpModal";
import { FocusToolbar } from "./FocusToolbar";

const QUICK_DEVICE_SETS = [
  {
    labelKey: "phoneTablet" as const,
    devices: quickDevicePresetIds.phoneTablet,
  },
  {
    labelKey: "iosAndroid" as const,
    devices: quickDevicePresetIds.iosAndroid,
  },
  {
    labelKey: "mobileTabletLaptop" as const,
    devices: quickDevicePresetIds.mobileTabletLaptop,
  },
] as const;

export function SimulatorApp() {
  const { locale, setLocale, t } = useI18n();
  const { findDevice, customDevices, removeCustomDevice } = useDeviceCatalog();
  const {
    ready,
    slots,
    activeSlotId,
    display,
    addSlot,
    applyDevicePreset,
    reloadAllSlots,
    updateDisplay,
    sourceTabId,
    useCount,
    setSlotDevice,
  } = useSimulator();
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [annotationMeta, setAnnotationMeta] = useState<{
    title: string;
    url: string;
    devices: string[];
  }>();
  const [capturing, setCapturing] = useState(false);
  const [capturingSlotId, setCapturingSlotId] = useState<string | undefined>();
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [flowRecording, setFlowRecording] = useState(false);
  const [recordedFlow, setRecordedFlow] = useState<FlowStep[]>([]);
  const [flowReplay, setFlowReplay] = useState<FlowReplayRequest | null>(null);
  const [flowResults, setFlowResults] = useState<Record<string, FlowReplayResult>>({});
  const [viewOnly, setViewOnly] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [narrowLayout, setNarrowLayout] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 760,
  );
  const [showCustomDevice, setShowCustomDevice] = useState(false);
  const [showSavedSets, setShowSavedSets] = useState(false);
  const [showReviewIssue, setShowReviewIssue] = useState(false);
  const [showDesignReference, setShowDesignReference] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [referenceViewportId, setReferenceViewportId] = useState(
    () => slots[0]?.id ?? "",
  );
  const [designReferences, setDesignReferences] = useState<
    Record<string, string>
  >({});
  const [referenceMode, setReferenceMode] =
    useState<ReferenceMode>("side-by-side");
  const [referenceOpacity, setReferenceOpacity] = useState(50);
  const [adjustingOverlay, setAdjustingOverlay] = useState(true);
  const [overlayPlacements, setOverlayPlacements] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [designPanelWidth, setDesignPanelWidth] = useState(() =>
    Math.min(
      520,
      typeof window === "undefined" ? 520 : window.innerWidth * 0.42,
    ),
  );
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<VersionReleaseNotes | null>(null);
  const [widths, setWidths] = useState<number[]>(() =>
    slots.map(() => 100 / slots.length),
  );
  const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
  const previousSlotCount = useRef(slots.length);
  const lastSuccessfulFlowRun = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dark = display.darkMode;
  const standalonePreview = Boolean(
    (window as Window & { __MDV_STANDALONE_PREVIEW__?: boolean })
      .__MDV_STANDALONE_PREVIEW__,
  );
  const reviewPromptPreview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("reviewPromptPreview");
  const reviewPrompt = useReviewPrompt({
    enabled: !import.meta.env.FIREFOX && !standalonePreview,
    hasMultipleViewports: slots.length >= 2,
    canPresent:
      !viewOnly &&
      !annotationOpen &&
      !showCustomDevice &&
      !showReviewIssue &&
      !showPermissions &&
      !showHelp &&
      !showFirstRun &&
      !releaseNotes &&
      !capturing &&
      !recording &&
      !flowRecording,
  });

  useEffect(() => {
    void readStore<FlowStep[]>("mdvRecordedFlow", []).then(setRecordedFlow);
  }, []);

  useEffect(() => {
    if (!flowReplay || lastSuccessfulFlowRun.current === flowReplay.runId) return;
    const results = Object.values(flowResults);
    if (
      results.length !== slots.length ||
      !results.every((result) => result.status === "passed")
    )
      return;
    lastSuccessfulFlowRun.current = flowReplay.runId;
    reviewPrompt.noteSuccessfulAction();
  }, [flowReplay, flowResults, reviewPrompt.noteSuccessfulAction, slots.length]);

  useEffect(() => {
    void readStore<{
      widths?: number[];
      focusedSlotId?: string | null;
      sidebarOpen?: boolean;
      showDesignReference?: boolean;
      referenceViewportId?: string;
      designReferences?: Record<string, string>;
      referenceMode?: ReferenceMode;
      referenceOpacity?: number;
      overlayPlacements?: Record<string, { x: number; y: number; width: number; height: number }>;
      designPanelWidth?: number;
    } | null>("mdvWorkspaceView", null)
      .then((saved) => {
        if (saved?.widths?.length === slots.length) setWidths(saved.widths);
        if (saved?.focusedSlotId && slots.some((slot) => slot.id === saved.focusedSlotId)) setFocusedSlotId(saved.focusedSlotId);
        if (saved?.showDesignReference) setShowDesignReference(true);
        if (saved?.referenceViewportId) setReferenceViewportId(saved.referenceViewportId);
        if (saved?.designReferences) setDesignReferences(saved.designReferences);
        if (saved?.referenceMode) setReferenceMode(saved.referenceMode);
        if (typeof saved?.referenceOpacity === "number") setReferenceOpacity(saved.referenceOpacity);
        if (saved?.overlayPlacements) setOverlayPlacements(saved.overlayPlacements);
        if (typeof saved?.designPanelWidth === "number") setDesignPanelWidth(saved.designPanelWidth);
        setWorkspaceHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const update = () => setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!workspaceHydrated) return;
    void writeStore("mdvWorkspaceView", {
      widths,
      focusedSlotId,
      sidebarOpen,
      showDesignReference,
      referenceViewportId,
      designReferences,
      referenceMode,
      referenceOpacity,
      overlayPlacements,
      designPanelWidth,
    });
  }, [designPanelWidth, designReferences, focusedSlotId, overlayPlacements, referenceMode, referenceOpacity, referenceViewportId, showDesignReference, sidebarOpen, widths, workspaceHydrated]);

  function enterViewOnly() {
    setSidebarOpen(false);
    setViewOnly(true);
    setShowExitHint(true);
  }

  useLayoutEffect(() => {
    if (!viewOnly) return;
    getViewerRoot().querySelector<HTMLElement>("[data-interface-layout]")?.focus({ preventScroll: true });
    const timer = window.setTimeout(() => setShowExitHint(false), 2200);
    const restore = () => {
      setViewOnly(false);
      requestAnimationFrame(() => getViewerRoot().querySelector<HTMLButtonElement>("[data-view-only-toggle]")?.focus());
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") restore(); };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "MDV_PREVIEW_ESCAPE") return;
      const owned = Array.from(getViewerRoot().querySelectorAll("iframe")).some(frame => frame.contentWindow === event.source);
      if (owned) restore();
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    return () => { window.clearTimeout(timer); target.removeEventListener("keydown", onKey); window.removeEventListener("message", onMessage); };
  }, [viewOnly]);

  useEffect(() => {
    if (!sidebarOpen || showFirstRun) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSidebarOpen(false);
      getViewerRoot().querySelector<HTMLButtonElement>("[data-focused-toolbar] [aria-expanded]")?.focus();
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", closeOnEscape);
    return () => target.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen, showFirstRun]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setNarrowLayout(query.matches);
      if (query.matches && !showFirstRun) setSidebarOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [showFirstRun]);

  useEffect(() => {
    if (slots.some((slot) => slot.id === referenceViewportId)) return;
    setReferenceViewportId(slots[0]?.id ?? "");
  }, [referenceViewportId, slots]);

  useEffect(() => {
    if (useCount < 1) return;
    void Promise.all([
      readStore("responsiveTesterFirstRunComplete", false),
      readStore<string | null>(PENDING_RELEASE_VERSION_KEY, null),
      readStore<string | null>(LAST_SEEN_RELEASE_VERSION_KEY, null),
    ]).then(([firstRunComplete, pendingVersion, lastSeenVersion]) => {
      const notice = decideStartupNotice({ useCount, firstRunComplete, pendingVersion, lastSeenVersion });
      if (notice.kind === "welcome") {
        setShowFirstRun(true);
        return;
      }
      if (notice.kind !== "release") return;
      setReleaseNotes(releaseNotesFor(notice.version));
      void Promise.all([
        writeStore(LAST_SEEN_RELEASE_VERSION_KEY, notice.version),
        writeStore<string | null>(PENDING_RELEASE_VERSION_KEY, null),
      ]);
    });
  }, [useCount]);

  useEffect(() => {
    if (showFirstRun) setSidebarOpen(true);
  }, [showFirstRun]);

  useEffect(() => {
    const finishLocalRecording = () => setRecording(false);
    window.addEventListener(LOCAL_RECORDING_COMPLETE_EVENT, finishLocalRecording);
    return () => window.removeEventListener(LOCAL_RECORDING_COMPLETE_EVENT, finishLocalRecording);
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;
    const listener = (message: unknown) => {
      if (
        message &&
        typeof message === "object" &&
        (message as Record<string, unknown>).type ===
          "OFFSCREEN_RECORDING_COMPLETE"
      )
        setRecording(false);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  if (slots.length !== previousSlotCount.current) {
    previousSlotCount.current = slots.length;
    setWidths(slots.map(() => 100 / slots.length));
  }

  const startResize = useCallback(
    (event: React.MouseEvent, index: number) => {
      event.preventDefault();
      const board = boardRef.current;
      if (!board) return;
      const startX = event.clientX;
      const totalWidth = board.getBoundingClientRect().width;
      const left = widths[index];
      const right = widths[index + 1];
      const combined = left + right;
      const onMove = (moveEvent: MouseEvent) => {
        const delta = ((moveEvent.clientX - startX) / totalWidth) * 100;
        const minimum = (120 / totalWidth) * 100;
        const nextLeft = Math.min(
          combined - minimum,
          Math.max(minimum, left + delta),
        );
        setWidths((current) =>
          current.map((value, itemIndex) =>
            itemIndex === index
              ? nextLeft
              : itemIndex === index + 1
                ? combined - nextLeft
                : value,
          ),
        );
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [widths],
  );

  async function takeScopedScreenshot(slotId?: string) {
    if (capturing) return;
    setCapturing(true);
    setCapturingSlotId(slotId);
    setCaptureError(null);
    try {
      const capture = await captureTabWithOverlay(sourceTabId);
      if (!capture.dataUrl) {
        setCaptureError(capture.error ?? t("noScreenshot"));
        window.setTimeout(() => setCaptureError(null), 4000);
        return;
      }
      const card = slotId
        ? Array.from(getViewerRoot().querySelectorAll<HTMLElement>("[data-preview-slot-id]"))
            .find((element) => element.dataset.previewSlotId === slotId)
        : undefined;
      const target = slotId
        ? card?.querySelector<HTMLElement>("[data-device-frame]") ?? card
        : getViewerRoot().querySelector<HTMLElement>("[data-capture-board]");
      const cropped = target ? await cropScreenshotToElement(capture.dataUrl, target) : capture.dataUrl;
      setAnnotationImage(cropped);
      setAnnotationMeta(captureMetaForSlot(slotId));
      setAnnotationOpen(true);
      reviewPrompt.noteSuccessfulAction();
    } finally {
      setCapturing(false);
      setCapturingSlotId(undefined);
    }
  }

  async function toggleRecording() {
    if (recording) {
      if (await stopTabRecording()) setRecording(false);
      return;
    }
    if (await startTabRecording(sourceTabId)) setRecording(true);
  }

  const recordFlowStep = useCallback((step: Omit<FlowStep, "id">) => {
    setRecordedFlow((current) => appendRecordedStep(current, step));
  }, []);

  const receiveFlowResult = useCallback((result: FlowReplayResult) => {
    setFlowResults((current) => ({ ...current, [result.slotId]: result }));
  }, []);

  function toggleFlowRecording() {
    if (flowRecording) {
      setFlowRecording(false);
      void writeStore("mdvRecordedFlow", recordedFlow);
      return;
    }
    setFlowReplay(null);
    setFlowResults({});
    setRecordedFlow([]);
    setFlowRecording(true);
  }

  function replayRecordedFlow() {
    if (!recordedFlow.length || flowRecording) return;
    setFlowResults({});
    setFlowReplay({
      runId: crypto.randomUUID(),
      steps: recordedFlow,
      startUrl: recordedFlow.find((step) => step.url)?.url,
    });
  }

  function resumePausedFlow() {
    const pausedResults = Object.values(flowResults).filter(
      (result) => result.status === "paused" && result.nextStep !== undefined,
    );
    if (!pausedResults.length) return;
    const pausedSlotIds = new Set(pausedResults.map((result) => result.slotId));
    setFlowResults((current) => Object.fromEntries(
      Object.entries(current).filter(([slotId]) => !pausedSlotIds.has(slotId)),
    ));
    setFlowReplay({
      runId: crypto.randomUUID(),
      steps: recordedFlow,
      startUrl: recordedFlow.find((step) => step.url)?.url,
      startIndexes: Object.fromEntries(
        pausedResults.map((result) => [result.slotId, result.nextStep ?? 0]),
      ),
    });
  }

  function clearRecordedFlow() {
    setFlowRecording(false);
    setRecordedFlow([]);
    setFlowReplay(null);
    setFlowResults({});
    void writeStore<FlowStep[]>("mdvRecordedFlow", []);
  }

  function closeViewer() {
    if (getViewerContext()) return getViewerContext()!.close();
    if (window.parent !== window)
      return void window.parent.postMessage({ type: "CLOSE_SIMULATOR" }, "*");
    if (
      typeof chrome !== "undefined" &&
      chrome.tabs?.getCurrent &&
      chrome.tabs?.remove
    ) {
      chrome.tabs.getCurrent((tab) =>
        tab?.id ? void chrome.tabs.remove(tab.id) : window.close(),
      );
      return;
    }
    window.close();
  }

  function finishFirstRun() {
    setShowFirstRun(false);
    setSidebarOpen(false);
    void writeStore("responsiveTesterFirstRunComplete", true);
  }

  function deleteCustomViewport(deviceId: string) {
    for (const slot of slots) {
      if (slot.deviceId === deviceId) setSlotDevice(slot.id, defaultDeviceIds[0]);
    }
    removeCustomDevice(deviceId);
  }

  const captureMeta = {
    title: `${PRODUCT_SHORT_NAME} QA capture`,
    url: slots[0]?.url ?? "",
    devices: slots.map((slot) => {
      const device = findDevice(slot.deviceId);
      return `${device.name} (${device.cssViewport.width}x${device.cssViewport.height})`;
    }),
  };

  function captureMetaForSlot(slotId?: string) {
    if (!slotId) return captureMeta;
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return captureMeta;
    const device = findDevice(slot.deviceId);
    const portrait = device.cssViewport;
    const width = slot.orientation === "landscape" ? portrait.height : portrait.width;
    const height = slot.orientation === "landscape" ? portrait.width : portrait.height;
    return {
      title: `${PRODUCT_SHORT_NAME} · ${device.name}`,
      url: slot.url,
      devices: [`${device.name} (${width}x${height})`],
    };
  }

  const reviewDevices = slots.map((slot) => {
    const device = findDevice(slot.deviceId);
    const portrait = device.cssViewport;
    return {
      name: device.name,
      width:
        slot.orientation === "landscape" ? portrait.height : portrait.width,
      height:
        slot.orientation === "landscape" ? portrait.width : portrait.height,
      orientation: slot.orientation,
    };
  });

  return (
    <div
      data-interface-layout="focus"
      data-view-only={viewOnly || undefined}
      tabIndex={-1}
      className={`flex h-screen flex-col overflow-hidden outline-none font-sans transition-colors ${dark ? "bg-[#0b0d12] text-slate-100" : "bg-[#eef0f3] text-slate-900"}`}
    >
      {!viewOnly && <FocusToolbar dark={dark} freeView={display.previewStyle === "free"} scrollSync={display.scrollSync} navigationSync={display.navigationSync} toolsOpen={sidebarOpen}
        url={slots.find(slot => slot.id === activeSlotId)?.url ?? slots[0]?.url ?? ""}
        canAdd={slots.length < maxPreviewSlots} capturing={capturing}
        onViewChange={free => updateDisplay(current => ({ ...current, previewStyle: free ? "free" : "device" }))}
        onAdd={() => addSlot()} onSync={() => updateDisplay(current => ({ ...current, scrollSync: !current.scrollSync }))}
        onNavigationSync={() => updateDisplay(current => ({ ...current, navigationSync: !current.navigationSync }))} onReload={reloadAllSlots}
        onViewOnly={enterViewOnly} onCapture={() => void takeScopedScreenshot()} onTools={() => setSidebarOpen(value => !value)}
        onTheme={() => updateDisplay(current => ({ ...current, darkMode: !current.darkMode }))} onClose={closeViewer}/>}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen && !viewOnly && (
          <button
            type="button"
            aria-label={t("closeWorkspaceSetup")}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 z-30 bg-black/15"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`absolute inset-y-3 start-3 z-40 flex shrink-0 flex-col rounded-xl border shadow-xl ${dark ? "border-white/[0.12] bg-[#11141a]" : "border-slate-200 bg-white"} ${sidebarOpen && !viewOnly ? "w-72 max-w-[calc(100%-1.5rem)]" : "hidden"}`}
        >
          {sidebarOpen && (
            <>
              <div
                className={`flex h-11 shrink-0 items-center justify-between border-b px-3 ${dark ? "border-white/[0.07]" : "border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={14} className="text-[#0f9f8f]" />
                  <span className="text-[11px] font-extrabold">
                    {t("workspaceSetup")}
                  </span>
                </div>
                <button
                  data-tour="sidebar-collapse"
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className={`grid h-7 w-7 place-items-center rounded-md ${dark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
                  aria-label={t("collapseWorkspaceSetup")}
                >
                  <X size={14}/>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
                <SidebarSection title={t("quickDeviceSets")} dark={dark}>
                  {QUICK_DEVICE_SETS.map(set => <ActionRow key={set.labelKey} dark={dark} icon={<PanelsTopLeft size={14}/>} label={t(set.labelKey)} onClick={() => applyDevicePreset([...set.devices])}/>)}
                  <ActionRow dark={dark} icon={<Route size={14}/>} label={t("navigationSync")} active={display.navigationSync} activeTone="teal" onClick={() => updateDisplay(current => ({ ...current, navigationSync: !current.navigationSync }))}/>
                  <ActionRow dark={dark} icon={<RefreshCw size={14}/>} label={t("reloadAll")} onClick={reloadAllSlots}/>
                  <ActionRow dark={dark} icon={<CircleHelp size={14}/>} label={t("helpAndFeedback")} onClick={() => setShowHelp(true)}/>
                </SidebarSection>
                <div>
                  <SidebarSection
                    title={t("devices")}
                    meta={t("countOf", { count: slots.length, max: maxPreviewSlots })}
                    dark={dark}
                  >
                  <button
                    data-tour="add-viewport"
                    type="button"
                    disabled={slots.length >= maxPreviewSlots}
                    onClick={() => addSlot()}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-[#0f9f8f] text-[11px] font-bold text-white shadow-sm hover:bg-[#0c8b7e] disabled:opacity-40"
                  >
                    <Plus size={14} />
                    {t("addViewport")}
                  </button>
                  <ActionRow
                    dark={dark}
                    icon={<PanelsTopLeft size={14} />}
                    onClick={() => setShowCustomDevice(true)}
                    label={t("addCustomViewport")}
                  />
                  </SidebarSection>
                </div>

                {customDevices.length > 0 && (
                  <SidebarSection
                    title={t("customViewports")}
                    meta={`${customDevices.length}`}
                    dark={dark}
                  >
                    <div className="flex flex-col gap-1">
                      {customDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`flex h-8 min-w-0 items-center gap-1 rounded-lg border pl-2 pr-1 ${dark ? "border-white/[0.07] bg-white/[0.025]" : "border-slate-100 bg-slate-50"}`}
                        >
                          <button
                            type="button"
                            onClick={() => addSlot(device.id, device.cssViewport.width > device.cssViewport.height ? "landscape" : "portrait")}
                            disabled={slots.length >= maxPreviewSlots}
                            title={t("addNamedViewport", { name: device.name })}
                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span className="min-w-0 flex-1 truncate text-[10px] font-bold">{device.name}</span>
                            <span className={`shrink-0 font-mono text-[8px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{device.cssViewport.width}×{device.cssViewport.height}</span>
                            <Plus size={10} className="shrink-0 text-[#0f9f8f]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomViewport(device.id)}
                            title={t("deleteNamed", { name: device.name })}
                            aria-label={t("deleteNamed", { name: device.name })}
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${dark ? "text-slate-600 hover:bg-red-500/10 hover:text-red-400" : "text-slate-400 hover:bg-red-50 hover:text-red-600"}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </SidebarSection>
                )}

                <SidebarSection
                  title={t("savedSets")}
                  dark={dark}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowSavedSets((value) => !value)}
                      className="text-[9px] font-extrabold uppercase tracking-wider text-[#0f9f8f]"
                    >
                      {showSavedSets ? t("done") : t("manage")}
                    </button>
                  }
                >
                  <p
                    className={`text-[10px] leading-4 ${dark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {t("reuseDeviceCombinations")}
                  </p>
                  {showSavedSets && (
                    <PresetsManager
                      dark={dark}
                      currentDeviceIds={slots.map((slot) => slot.deviceId)}
                      onApply={applyDevicePreset}
                      onSaved={reviewPrompt.noteSuccessfulAction}
                    />
                  )}
                </SidebarSection>

                <div>
                  <SidebarSection title={t("sessionTools")} dark={dark}>
                  <ActionRow
                    dark={dark}
                    icon={<Focus size={14} />}
                    onClick={() => setFocusedSlotId(focusedSlotId ? null : activeSlotId)}
                    active={!!focusedSlotId}
                    label={focusedSlotId ? t("showAllViewports") : t("focusActiveViewport")}
                  />
                  <ActionRow
                    dark={dark}
                    icon={<ScanSearch size={14} />}
                    onClick={() => setShowReviewIssue(true)}
                    label={t("generateAiFixPrompt")}
                  />
                  <ActionRow
                    dark={dark}
                    icon={<Images size={14} />}
                    onClick={() => setShowDesignReference(true)}
                    label={t("comparePageDesign")}
                  />
                  <ActionRow
                    dark={dark}
                    icon={recording ? <Square size={13} fill="currentColor" /> : <Video size={14} />}
                    onClick={() => void toggleRecording()}
                    disabled={!sourceTabId}
                    active={recording}
                    label={recording ? t("recordingStop") : t("recordSourceTab")}
                  />
                  <ActionRow
                    dark={dark}
                    icon={<CircleHelp size={14} />}
                    onClick={() => setShowFirstRun(true)}
                    label={t("takeFeatureTour")}
                  />
                  {recording && (
                    <div role="status" aria-live="polite" className="flex h-7 items-center gap-2 rounded-lg bg-red-500/10 px-2 text-[10px] font-extrabold text-red-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      {t("recordingStatus", { time: formatDuration(recordingSeconds) })}
                    </div>
                  )}
                  </SidebarSection>
                </div>
                <SidebarSection
                  title={flowRecording ? t("stopAndSaveFlow", { count: recordedFlow.length }) : t("flowRecorder")}
                  dark={dark}
                  active={flowRecording}
                >
                  <div data-tour="record-user-flow">
                    <ActionRow
                      dark={dark}
                      icon={flowRecording ? <Square size={13} fill="currentColor" /> : <Route size={14} />}
                      onClick={toggleFlowRecording}
                      active={flowRecording}
                      label={flowRecording ? t("recordingStop") : t("recordAFlow")}
                    />
                  </div>
                  {!flowRecording && <ActionRow
                    dark={dark}
                    icon={<Play size={14} />}
                    onClick={replayRecordedFlow}
                    disabled={!recordedFlow.length}
                    label={recordedFlow.length ? t("reloadAndRerunFlow", { count: recordedFlow.length }) : t("recordFlowToRerun")}
                  />}
                  {!flowRecording && recordedFlow.length > 0 && (
                    <ActionRow dark={dark} icon={<Trash2 size={14} />} onClick={clearRecordedFlow} label={t("clearSavedFlow")} />
                  )}
                  {flowReplay && (
                    <p role="status" aria-live="polite" className={`px-2 text-[10px] font-bold ${Object.keys(flowResults).length === slots.length && Object.values(flowResults).every((result) => result.status === "passed") ? "text-emerald-500" : Object.values(flowResults).some((result) => result.status === "failed") ? "text-red-500" : Object.values(flowResults).some((result) => result.status === "paused") ? "text-amber-500" : dark ? "text-slate-400" : "text-slate-500"}`}>
                      {Object.values(flowResults).some((result) => result.status === "failed")
                        ? t("flowFailed", { passed: Object.values(flowResults).filter((result) => result.status === "passed").length, count: slots.length, step: (Object.values(flowResults).find((result) => result.status === "failed")?.failedStep ?? 0) + 1 })
                        : Object.values(flowResults).some((result) => result.status === "paused")
                          ? t("flowVerificationPaused")
                        : Object.keys(flowResults).length === slots.length
                          ? t("flowViewportsPassed", { count: slots.length })
                          : t("flowRunning", { count: slots.length })}
                    </p>
                  )}
                  {Object.values(flowResults).some((result) => result.status === "paused") && (
                    <ActionRow
                      dark={dark}
                      icon={<Play size={14} />}
                      onClick={resumePausedFlow}
                      label={t("resumeFlowAfterVerification")}
                    />
                  )}
                </SidebarSection>
              </div>
              <div
                className={`border-t p-3 ${dark ? "border-white/[0.07]" : "border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Languages size={13} className="shrink-0 text-[#0f9f8f]" />
                  <select
                    aria-label={t("language")}
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as AppLocale)}
                    className={`min-w-0 flex-1 rounded-md border px-2 py-1 text-[10px] font-bold outline-none ${dark ? "border-white/10 bg-[#171a21] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
                  >
                    {SUPPORTED_LOCALES.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowPermissions(true)}
                    aria-label={t("viewPermissions")}
                    title={t("viewPermissions")}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>

        {viewOnly && (
          <button type="button" data-exit-view-only aria-label={t("showWorkspaceControls")} title={`${t("showWorkspaceControls")} (Esc)`}
            onClick={() => setViewOnly(false)}
            className={`absolute start-3 top-3 z-50 flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold shadow-sm transition-opacity hover:opacity-100 focus:opacity-100 ${showExitHint ? "opacity-100" : "opacity-0"} ${dark ? "border-white/20 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            <Settings2 size={14}/>{t("showWorkspaceControls")} <kbd className="text-[10px] opacity-60">Esc</kbd>
          </button>
        )}

        {showDesignReference && !viewOnly && (
          <DesignReferencePanel
            dark={dark}
            viewports={slots.map((slot) => ({
              id: slot.id,
              label: findDevice(slot.deviceId).name,
            }))}
            activeViewportId={referenceViewportId || slots[0]?.id || ""}
            references={designReferences}
            mode={referenceMode}
            opacity={referenceOpacity}
            adjustingOverlay={adjustingOverlay}
            width={designPanelWidth}
            onActiveViewportChange={setReferenceViewportId}
            onReferenceChange={(id, image) =>
              setDesignReferences((current) => {
                const next = { ...current };
                if (image) next[id] = image;
                else delete next[id];
                return next;
              })
            }
            onModeChange={setReferenceMode}
            onOpacityChange={setReferenceOpacity}
            onAdjustingOverlayChange={setAdjustingOverlay}
            onResetOverlay={() =>
              setOverlayPlacements((current) => {
                const next = { ...current };
                delete next[referenceViewportId];
                return next;
              })
            }
            onWidthChange={setDesignPanelWidth}
            onClose={() => setShowDesignReference(false)}
            onMarkFeedback={(image) => {
              setAnnotationImage(image);
              setAnnotationMeta(captureMetaForSlot(referenceViewportId));
              setAnnotationOpen(true);
              reviewPrompt.noteSuccessfulAction();
            }}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={boardRef}
            data-capture-board
            className={`flex min-h-0 flex-1 ${narrowLayout ? "flex-col" : ""}`}
          >
            {ready && slots.map((slot, index) => (
              focusedSlotId && focusedSlotId !== slot.id ? null :
              <div
                key={slot.id}
                className="relative flex h-full min-w-0 flex-col overflow-visible"
                style={{
                  width: narrowLayout
                    ? "100%"
                    : focusedSlotId === slot.id
                      ? "100%"
                      : `${widths[index] ?? 100 / slots.length}%`,
                  height: narrowLayout ? `${100 / slots.length}%` : undefined,
                  flexShrink: 0,
                }}
              >
                <PreviewCard
                  slot={slot}
                  device={findDevice(slot.deviceId)}
                  display={display}
                  showToolbar={!viewOnly}
                  removable={slots.length > 1}
                  onCapture={() => void takeScopedScreenshot(slot.id)}
                  capturePending={capturing && capturingSlotId === slot.id}
                  focused={focusedSlotId === slot.id}
                  first={index === 0}
                  last={index === slots.length - 1}
                  flowRecording={flowRecording && activeSlotId === slot.id}
                  flowReplay={flowReplay}
                  onFlowStep={recordFlowStep}
                  onFlowResult={receiveFlowResult}
                  designOverlay={
                    !viewOnly && showDesignReference &&
                    referenceMode === "overlay" &&
                    referenceViewportId === slot.id &&
                    designReferences[slot.id]
                      ? {
                          image: designReferences[slot.id],
                          opacity: referenceOpacity,
                          adjusting: adjustingOverlay,
                          placement: overlayPlacements[slot.id],
                          onPlacementChange: (placement) =>
                            setOverlayPlacements((current) => ({
                              ...current,
                              [slot.id]: placement,
                            })),
                        }
                      : undefined
                  }
                />
                {!viewOnly && !focusedSlotId && index < slots.length - 1 && !narrowLayout && (
                  <div
                    role="separator"
                    aria-label={t("resizeAdjacentViewports")}
                    aria-orientation="vertical"
                    className="group absolute right-0 top-0 z-20 flex h-full w-4 translate-x-1/2 cursor-col-resize items-center justify-center"
                    onMouseDown={(event) => startResize(event, index)}
                  >
                    <div
                      className={`absolute inset-y-0 left-1/2 w-px transition-colors group-hover:bg-[#0f9f8f] ${dark ? "bg-white/20" : "bg-slate-300"}`}
                    />
                    <span
                      className={`relative grid h-9 w-4 place-items-center rounded-full border shadow-sm transition-colors group-hover:border-[#0f9f8f] group-hover:bg-[#0f9f8f] group-hover:text-white ${dark ? "border-white/20 bg-[#1a1e27] text-slate-400" : "border-slate-300 bg-white text-slate-500"}`}
                    >
                      <GripVertical size={12} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {annotationOpen && (
        <AnnotationOverlay
          imageUrl={annotationImage}
          meta={annotationMeta ?? captureMeta}
          onClose={() => {
            setAnnotationOpen(false);
            setAnnotationMeta(undefined);
          }}
        />
      )}
      {captureError && (
        <div role="alert" className={`fixed bottom-3 left-1/2 z-[100] -translate-x-1/2 rounded-md border px-3 py-2 text-xs font-semibold shadow-sm ${dark ? "border-white/10 bg-[#171b23] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
          {captureError}
        </div>
      )}
      {showCustomDevice && (
        <CustomDeviceModal
          dark={dark}
          onClose={() => setShowCustomDevice(false)}
          onCreated={(deviceId, orientation) => {
            addSlot(deviceId, orientation);
            setShowCustomDevice(false);
          }}
        />
      )}
      {showReviewIssue && (
        <ReviewIssueModal
          dark={dark}
          pageUrl={slots[0]?.url ?? ""}
          devices={reviewDevices}
          onClose={() => setShowReviewIssue(false)}
        />
      )}
      {showPermissions && <PermissionsInfoModal dark={dark} onClose={() => setShowPermissions(false)} />}
      {showHelp && <HelpModal dark={dark} review={reviewPrompt} onClose={() => setShowHelp(false)} />}
      {showFirstRun && <FirstRunGuide dark={dark} onClose={finishFirstRun} />}
      {releaseNotes && <ReleaseNotesModal dark={dark} release={releaseNotes} onClose={() => setReleaseNotes(null)} />}
      {(reviewPrompt.visible || reviewPromptPreview) && (
        <ReviewPromptModal
          dark={dark}
          storageError={reviewPrompt.error}
          onReview={reviewPrompt.openReview}
          onNotNow={reviewPrompt.postpone}
          onNever={reviewPrompt.optOut}
        />
      )}
    </div>
  );
}

function SidebarSection({
  title,
  meta,
  action,
  dark,
  active,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  dark: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h2
          role={active ? "status" : undefined}
          aria-live={active ? "polite" : undefined}
          className={`flex min-w-0 items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] ${active ? "text-red-500" : dark ? "text-slate-400" : "text-slate-500"}`}
        >
          {active && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current" />}
          {title}
        </h2>
        {action ??
          (meta && (
            <span
              className={`text-[9px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}
            >
              {meta}
            </span>
          ))}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function ActionRow({
  icon,
  label,
  dark,
  onClick,
  disabled,
  active,
  activeTone = "red",
}: {
  icon: ReactNode;
  label: string;
  dark: boolean;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  activeTone?: "red" | "teal";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      disabled={disabled}
      aria-pressed={active}
      className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[11px] font-semibold transition disabled:opacity-35 ${active ? activeTone === "teal" ? dark ? "bg-teal-500/10 text-teal-300" : "bg-teal-500/10 text-teal-700" : "bg-red-500/10 text-red-500" : dark ? "text-slate-400 hover:bg-white/[0.055] hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!active && <ChevronRight size={11} className="shrink-0 opacity-35" />}
    </button>
  );
}

async function cropScreenshotToElement(dataUrl: string, element: HTMLElement): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const rect = element.getBoundingClientRect();
  const scaleX = image.naturalWidth / window.innerWidth;
  const scaleY = image.naturalHeight / window.innerHeight;
  const sourceX = Math.max(0, Math.round(rect.left * scaleX));
  const sourceY = Math.max(0, Math.round(rect.top * scaleY));
  const sourceWidth = Math.min(image.naturalWidth - sourceX, Math.round(rect.width * scaleX));
  const sourceHeight = Math.min(image.naturalHeight - sourceY, Math.round(rect.height * scaleY));
  if (sourceWidth <= 0 || sourceHeight <= 0) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  canvas.getContext("2d")?.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );
  return canvas.toDataURL("image/png");
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
