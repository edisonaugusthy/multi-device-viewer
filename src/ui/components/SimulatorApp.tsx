import { supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import { getViewerContext, getViewerEventTarget, getViewerRoot } from "../../app/viewer-context";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n } from "../../app/i18n";
import { useReviewPrompt } from "../../app/useReviewPrompt";
import { useSimulator } from "../../app/SimulatorProvider";
import { useDeviceSets } from "../../app/useDeviceSets";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import {
  LAST_SEEN_RELEASE_VERSION_KEY,
  PENDING_RELEASE_VERSION_KEY,
  decideStartupNotice,
  CURRENT_RELEASE_NOTES,
  type VersionReleaseNotes,
} from "../../app/release-notes";
import {
  captureTabWithOverlay,
  startTabRecording,
  stopTabRecording,
  type TabCaptureResult,
} from "../../domain/capture/capture-service";
import { extractMatte, type PixelRect } from "../../domain/capture/capture-matte";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import { defaultDeviceIds } from "../../domain/device/device-catalog";
import { adjacentPickerDevices } from "../../domain/device/device-picker";
import { appendRecordedStep } from "../../domain/flow/flow-service";
import type { FlowReplayRequest, FlowReplayResult, FlowStep } from "../../domain/flow/flow.types";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import { GripIcon } from "../icons";
import { AllDevicesView } from "./AllDevicesView";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { CompareBar, CompareControls, CompareLabel, DesignPane, readDesignFile, type CompareBlend, type CompareMode } from "./CompareMode";
import { DevicePicker, type PickerTarget } from "./DevicePicker";
import { FirstRunGuide } from "./FirstRunGuide";
import { FixPromptPopover, type FixPromptDevice } from "./FixPrompt";
import { HelpModal } from "./HelpModal";
import { PermissionsInfoModal } from "./PermissionsInfoModal";
import { PreviewCard, shortName } from "./PreviewCard";
import { RecordMenu, type FlowStatus } from "./RecordMenu";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { ReviewPromptModal } from "./ReviewPromptModal";
import { SettingsPopover, type BrowserBarPosition } from "./SettingsPopover";
import { cx } from "./ui";
import { useStableCallback } from "../hooks/useStableCallback";
import { ViewModeBar } from "./ViewModeBar";
import { WorkspaceHeader } from "./WorkspaceHeader";

type OverlayPlacement = { x: number; y: number; width: number; height: number };
type Popover = "picker" | "settings" | "fix" | "record" | null;

interface SavedWorkspaceView {
  widths?: number[];
  focusedSlotId?: string | null;
  showDesignReference?: boolean;
  referenceViewportId?: string;
  designReferences?: Record<string, string>;
  designNames?: Record<string, string>;
  referenceMode?: CompareMode;
  referenceOpacity?: number;
  overlayPlacements?: Record<string, OverlayPlacement>;
  overlayBlend?: CompareBlend;
  designScrollLinked?: boolean;
}

export function SimulatorApp() {
  const { t } = useI18n();
  const { devices, findDevice, removeCustomDevice } = useDeviceCatalog();
  const {
    ready,
    slots,
    activeSlotId,
    display,
    addSlot,
    removeSlot,
    applyDevicePreset,
    reloadAllSlots,
    updateDisplay,
    sourceTabId,
    useCount,
    setActiveSlot,
    setSlotDevice,
    setSlotUrl,
    getSlotUrl,
    setSlotBrowserPreferences,
    zoomSlot,
    setSlotZoomMode,
  } = useSimulator();
  const deviceSets = useDeviceSets(t);
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [annotationMeta, setAnnotationMeta] = useState<{
    title: string;
    url: string;
    devices: string[];
    includeBanner?: boolean;
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
  const [viewMode, setViewMode] = useState(false);
  const [viewSingle, setViewSingle] = useState(false);
  const [allDevicesUrl, setAllDevicesUrl] = useState<string | null>(null);
  const [narrowLayout, setNarrowLayout] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 760,
  );
  const [popover, setPopover] = useState<Popover>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>({ kind: "add" });
  const [fixDeviceIds, setFixDeviceIds] = useState<string[] | undefined>();
  const [showPermissions, setShowPermissions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [compare, setCompare] = useState(false);
  const [compareSlotId, setCompareSlotId] = useState(() => slots[0]?.id ?? "");
  const [designReferences, setDesignReferences] = useState<Record<string, string>>({});
  const [designNames, setDesignNames] = useState<Record<string, string>>({});
  const [compareMode, setCompareMode] = useState<CompareMode>("side-by-side");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [overlayBlend, setOverlayBlend] = useState<CompareBlend>("normal");
  const [overlayLocked, setOverlayLocked] = useState(true);
  const [overlayPlacements, setOverlayPlacements] = useState<Record<string, OverlayPlacement>>({});
  const [designScrollLinked, setDesignScrollLinked] = useState(true);
  const [designScrollTop, setDesignScrollTop] = useState(0);
  const [scales, setScales] = useState<Record<string, number>>({});
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<VersionReleaseNotes | null>(null);
  const [widths, setWidths] = useState<number[]>(() => slots.map(() => 100 / slots.length));
  const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
  const previousSlotCount = useRef(slots.length);
  const lastSuccessfulFlowRun = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const fixRef = useRef<HTMLButtonElement>(null);
  const recordRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const overlayFileInput = useRef<HTMLInputElement>(null);
  const dark = display.darkMode;
  const standalonePreview = Boolean(
    (window as Window & { __MDV_STANDALONE_PREVIEW__?: boolean }).__MDV_STANDALONE_PREVIEW__,
  );
  const reviewPromptPreview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("reviewPromptPreview");
  const reviewPrompt = useReviewPrompt({
    enabled: !standalonePreview,
    hasMultipleViewports: (slots.length >= 2 || allDevicesUrl !== null) && !showFirstRun && !releaseNotes,
    canPresent:
      !viewMode &&
      !annotationOpen &&
      popover === null &&
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
    if (results.length !== slots.length || !results.every((result) => result.status === "passed")) return;
    lastSuccessfulFlowRun.current = flowReplay.runId;
    reviewPrompt.noteSuccessfulAction();
  }, [flowReplay, flowResults, reviewPrompt.noteSuccessfulAction, slots.length]);

  useEffect(() => {
    void readStore<SavedWorkspaceView | null>("mdvWorkspaceView", null).then((saved) => {
      if (saved?.widths?.length === slots.length) setWidths(saved.widths);
      if (saved?.focusedSlotId && slots.some((slot) => slot.id === saved.focusedSlotId)) setFocusedSlotId(saved.focusedSlotId);
      if (saved?.showDesignReference) setCompare(true);
      if (saved?.referenceViewportId) setCompareSlotId(saved.referenceViewportId);
      if (saved?.designReferences) setDesignReferences(saved.designReferences);
      if (saved?.designNames) setDesignNames(saved.designNames);
      if (saved?.referenceMode) setCompareMode(saved.referenceMode);
      if (typeof saved?.referenceOpacity === "number") setOverlayOpacity(saved.referenceOpacity);
      if (saved?.overlayPlacements) setOverlayPlacements(saved.overlayPlacements);
      if (saved?.overlayBlend) setOverlayBlend(saved.overlayBlend);
      if (typeof saved?.designScrollLinked === "boolean") setDesignScrollLinked(saved.designScrollLinked);
      setWorkspaceHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!workspaceHydrated) return;
    void writeStore<SavedWorkspaceView>("mdvWorkspaceView", {
      widths,
      focusedSlotId,
      showDesignReference: compare,
      referenceViewportId: compareSlotId,
      designReferences,
      designNames,
      referenceMode: compareMode,
      referenceOpacity: overlayOpacity,
      overlayPlacements,
      overlayBlend,
      designScrollLinked,
    });
  }, [compare, compareMode, compareSlotId, designNames, designReferences, designScrollLinked, focusedSlotId, overlayBlend, overlayOpacity, overlayPlacements, widths, workspaceHydrated]);

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

  const exitViewMode = useCallback(() => {
    setViewMode(false);
    requestAnimationFrame(() => getViewerRoot().querySelector<HTMLButtonElement>("[data-view-only-toggle]")?.focus());
  }, []);

  function enterViewMode() {
    setPopover(null);
    setViewMode(true);
  }

  useLayoutEffect(() => {
    if (!viewMode) return;
    getViewerRoot().querySelector<HTMLElement>("[data-interface-layout]")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") exitViewMode(); };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "MDV_PREVIEW_ESCAPE") return;
      const owned = Array.from(getViewerRoot().querySelectorAll("iframe")).some(frame => frame.contentWindow === event.source);
      if (owned) exitViewMode();
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    return () => { target.removeEventListener("keydown", onKey); window.removeEventListener("message", onMessage); };
  }, [exitViewMode, viewMode]);

  // Escape leaves focus or compare mode when no popover is open.
  useEffect(() => {
    if (viewMode || popover !== null || (!focusedSlotId && !compare) || allDevicesUrl !== null || annotationOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (focusedSlotId) setFocusedSlotId(null);
      else setCompare(false);
    };
    const target = getViewerEventTarget();
    target.addEventListener("keydown", onKey);
    return () => target.removeEventListener("keydown", onKey);
  }, [allDevicesUrl, annotationOpen, compare, focusedSlotId, popover, viewMode]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setNarrowLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slots.some((slot) => slot.id === compareSlotId)) return;
    setCompareSlotId(slots[0]?.id ?? "");
  }, [compareSlotId, slots]);

  useEffect(() => {
    if (focusedSlotId && !slots.some(slot => slot.id === focusedSlotId)) setFocusedSlotId(null);
  }, [focusedSlotId, slots]);

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
      setReleaseNotes(CURRENT_RELEASE_NOTES);
      void Promise.all([
        writeStore(LAST_SEEN_RELEASE_VERSION_KEY, notice.version),
        writeStore<string | null>(PENDING_RELEASE_VERSION_KEY, null),
      ]);
    });
  }, [useCount]);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;
    const listener = (message: unknown) => {
      if (message && typeof message === "object" && (message as Record<string, unknown>).type === "OFFSCREEN_RECORDING_COMPLETE") setRecording(false);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  if (slots.length !== previousSlotCount.current) {
    previousSlotCount.current = slots.length;
    setWidths(slots.map(() => 100 / slots.length));
  }

  const startResize = useCallback((event: React.MouseEvent, index: number) => {
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
      const nextLeft = Math.min(combined - minimum, Math.max(minimum, left + delta));
      setWidths((current) => current.map((value, itemIndex) =>
        itemIndex === index ? nextLeft : itemIndex === index + 1 ? combined - nextLeft : value));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [widths]);

  async function takeScopedScreenshot(slotId?: string) {
    if (capturing) return;
    setCapturing(true);
    setCapturingSlotId(slotId);
    setCaptureError(null);
    setPopover(null);
    try {
      const card = slotId
        ? Array.from(getViewerRoot().querySelectorAll<HTMLElement>("[data-preview-slot-id]")).find((element) => element.dataset.previewSlotId === slotId)
        : undefined;
      const target = slotId
        ? card?.querySelector<HTMLElement>("[data-device-capture]")
        : getViewerRoot().querySelector<HTMLElement>("[data-capture-board]");
      if (!target) throw new Error(t("noScreenshot"));
      const capture = () => captureTabWithOverlay(sourceTabId);
      // One device is cut out with a transparent background; the workspace
      // screenshot keeps its background so the devices stay in context.
      const cropped = slotId
        ? await captureDeviceCutout(target, capture, t("noScreenshot"))
        : await cropScreenshotToElement(await capturedImage(capture, t("noScreenshot")), target);
      setAnnotationImage(cropped);
      setAnnotationMeta(captureMetaForSlot(slotId));
      setAnnotationOpen(true);
      reviewPrompt.noteSuccessfulAction();
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : t("noScreenshot"));
      window.setTimeout(() => setCaptureError(null), 4000);
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
    setFlowReplay({ runId: crypto.randomUUID(), steps: recordedFlow, startUrl: recordedFlow.find((step) => step.url)?.url });
  }

  function resumePausedFlow() {
    const pausedResults = Object.values(flowResults).filter((result) => result.status === "paused" && result.nextStep !== undefined);
    if (!pausedResults.length) return;
    const pausedSlotIds = new Set(pausedResults.map((result) => result.slotId));
    setFlowResults((current) => Object.fromEntries(Object.entries(current).filter(([slotId]) => !pausedSlotIds.has(slotId))));
    setFlowReplay({
      runId: crypto.randomUUID(),
      steps: recordedFlow,
      startUrl: recordedFlow.find((step) => step.url)?.url,
      startIndexes: Object.fromEntries(pausedResults.map((result) => [result.slotId, result.nextStep ?? 0])),
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
    if (window.parent !== window) return void window.parent.postMessage({ type: "CLOSE_SIMULATOR" }, "*");
    if (typeof chrome !== "undefined" && chrome.tabs?.getCurrent && chrome.tabs?.remove) {
      chrome.tabs.getCurrent((tab) => tab?.id ? void chrome.tabs.remove(tab.id) : window.close());
      return;
    }
    window.close();
  }

  function finishFirstRun() {
    setShowFirstRun(false);
    void writeStore("responsiveTesterFirstRunComplete", true);
  }

  function deleteCustomViewport(deviceId: string) {
    for (const slot of slots) {
      if (slot.deviceId === deviceId) setSlotDevice(slot.id, defaultDeviceIds[0]);
    }
    removeCustomDevice(deviceId);
  }

  function openAllDevices() {
    if (flowRecording) toggleFlowRecording();
    setFlowReplay(null);
    setPopover(null);
    setAllDevicesUrl(getSlotUrl(activeSlotId));
  }

  const closeAllDevices = useCallback(() => {
    setAllDevicesUrl(null);
    requestAnimationFrame(() => getViewerRoot().querySelector<HTMLButtonElement>("[data-all-devices-toggle]")?.focus());
  }, []);

  const openGalleryDevice = useCallback((deviceId: string, url: string) => {
    setSlotDevice(activeSlotId, deviceId);
    if (getSlotUrl(activeSlotId) !== url) setSlotUrl(activeSlotId, url);
    closeAllDevices();
  }, [activeSlotId, closeAllDevices, getSlotUrl, setSlotDevice, setSlotUrl]);

  const addGalleryDevice = useCallback((deviceId: string, url: string) => {
    if (slots.length >= maxPreviewSlots) {
      openGalleryDevice(deviceId, url);
      return;
    }
    addSlot(deviceId);
    closeAllDevices();
  }, [addSlot, closeAllDevices, openGalleryDevice, slots.length]);

  function togglePopover(next: Exclude<Popover, null>) {
    setPopover(current => current === next ? null : next);
  }

  function openPicker(target: PickerTarget) {
    setPickerTarget(target);
    setPopover("picker");
  }

  function openFixPrompt(deviceIds?: string[]) {
    setFixDeviceIds(deviceIds);
    setPopover("fix");
  }

  const closePopover = useCallback(() => setPopover(null), []);

  // Return focus to the control that opened the picker.
  const closePicker = useCallback(() => {
    setPopover(null);
    requestAnimationFrame(() => {
      const trigger = pickerTarget.kind === "replace"
        ? getViewerRoot().querySelector<HTMLButtonElement>(`[data-preview-slot-id="${CSS.escape(pickerTarget.slotId)}"] [data-testid="device-switcher-button"]`)
        : addRef.current;
      trigger?.focus({ preventScroll: true });
    });
  }, [pickerTarget]);

  function slotSize(slotId: string) {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return { width: 0, height: 0 };
    const device = findDevice(slot.deviceId);
    return supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport;
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
    const { width, height } = slotSize(slotId);
    return { title: `${PRODUCT_SHORT_NAME} · ${device.name}`, url: slot.url, devices: [`${device.name} (${width}x${height})`], includeBanner: false };
  }

  const reviewDevices: FixPromptDevice[] = slots.map((slot) => {
    const device = findDevice(slot.deviceId);
    const size = slotSize(slot.id);
    return { id: slot.id, name: device.name, width: size.width, height: size.height, orientation: slot.orientation };
  });

  const flowStatus = useMemo<FlowStatus | undefined>(() => {
    if (!flowReplay) return undefined;
    const results = Object.values(flowResults);
    const failed = results.find((result) => result.status === "failed");
    const passed = results.filter((result) => result.status === "passed").length;
    if (failed) return { tone: "error", text: t("flowFailed", { passed, count: slots.length, step: (failed.failedStep ?? 0) + 1 }) };
    if (results.some((result) => result.status === "paused")) return { tone: "warning", text: t("flowVerificationPaused") };
    if (results.length === slots.length && results.every((result) => result.status === "passed")) return { tone: "success", text: t("flowViewportsPassed", { count: slots.length }) };
    return { tone: "neutral", text: t("flowRunning", { count: slots.length }) };
  }, [flowReplay, flowResults, slots.length, t]);

  const iosPhoneSlots = slots.filter((slot) => {
    const device = findDevice(slot.deviceId);
    return device.type === "phone" && getFrameProfile(device).platform === "ios";
  });
  const browserBar: BrowserBarPosition = iosPhoneSlots[0]?.browserPreferences?.layout === "top" ? "top" : "bottom";
  function changeBrowserBar(position: BrowserBarPosition) {
    for (const slot of iosPhoneSlots) setSlotBrowserPreferences(slot.id, { layout: position });
  }

  const focusIndex = focusedSlotId ? slots.findIndex((slot) => slot.id === focusedSlotId) : -1;
  const focusMode = !viewMode && !compare && focusIndex >= 0;
  const viewOneMode = viewMode && viewSingle;
  const activeIndex = Math.max(0, slots.findIndex((slot) => slot.id === activeSlotId));
  const singleSlotId = compare && !viewMode ? compareSlotId : focusMode ? focusedSlotId : viewOneMode ? slots[activeIndex]?.id : null;
  const showChrome = !viewMode && !compare;

  function stepFocus(direction: 1 | -1) {
    if (!slots.length) return;
    const next = slots[(focusIndex + direction + slots.length) % slots.length];
    setFocusedSlotId(next.id);
    setActiveSlot(next.id);
  }

  function stepActive(direction: 1 | -1) {
    if (!slots.length) return;
    setActiveSlot(slots[(activeIndex + direction + slots.length) % slots.length].id);
  }

  const compareSlot = slots.find((slot) => slot.id === compareSlotId);
  const compareDevice = compareSlot ? findDevice(compareSlot.deviceId) : undefined;
  const compareSize = slotSize(compareSlotId);
  const compareImage = designReferences[compareSlotId];
  const compareScale = scales[compareSlotId] ?? 0;
  const comparePaneWidth = Math.max(160, Math.round(compareSize.width * compareScale));
  const comparePaneHeight = Math.max(160, Math.round(compareSize.height * compareScale));

  function setDesign(slotId: string, image?: string, name?: string) {
    setDesignReferences((current) => {
      const next = { ...current };
      if (image) next[slotId] = image; else delete next[slotId];
      return next;
    });
    setDesignNames((current) => {
      const next = { ...current };
      if (name) next[slotId] = name; else delete next[slotId];
      return next;
    });
  }

  const onComparePageScroll = useCallback((scrollTop: number) => setDesignScrollTop(scrollTop), []);

  // Cards are memoized, so every prop they share stays stable while the
  // workspace re-renders for column resizing, popovers or another card's scale.
  const workspaceDisplay = useMemo(() => allDevicesUrl !== null ? { ...display, scrollSync: false, navigationSync: false } : display, [allDevicesUrl, display]);
  const captureSlot = useStableCallback((slotId: string) => void takeScopedScreenshot(slotId));
  const changeSlotDevice = useStableCallback((slotId: string) => openPicker({ kind: "replace", slotId }));
  const switchSlotDevice = useCallback((slotId: string, deviceId: string) => setSlotDevice(slotId, deviceId), [setSlotDevice]);
  const neighbours = useMemo(() => new Map(slots.map(slot => [slot.id, adjacentPickerDevices(devices, slot.deviceId)])), [devices, slots]);
  const focusSlot = useStableCallback((slotId: string) => { setFocusedSlotId(slotId); setActiveSlot(slotId); });
  const fixPromptForSlot = useStableCallback((slotId: string) => openFixPrompt([slotId]));
  const updateScale = useCallback((scale: number, slotId: string) => setScales((current) => current[slotId] === scale ? current : { ...current, [slotId]: scale }), []);
  const focusPrevious = useStableCallback(() => stepFocus(-1));
  const focusNext = useStableCallback(() => stepFocus(1));
  const exitFocus = useCallback(() => setFocusedSlotId(null), []);
  const focusNavigation = useMemo(() => focusMode ? {
    position: `${focusIndex + 1} / ${slots.length}`,
    canStep: slots.length > 1,
    onPrevious: focusPrevious,
    onNext: focusNext,
    onExit: exitFocus,
  } : undefined, [exitFocus, focusIndex, focusMode, focusNext, focusPrevious, slots.length]);

  return (
    <div
      data-interface-layout="focus"
      data-view-only={viewMode || undefined}
      tabIndex={-1}
      className={cx("relative flex h-screen flex-col overflow-hidden bg-stage font-sans text-ink outline-none transition-colors", dark && "dark")}
    >
      <div className={cx("flex min-h-0 flex-1 flex-col", allDevicesUrl !== null && "invisible")} inert={allDevicesUrl !== null} aria-hidden={allDevicesUrl !== null || undefined}>
        {!viewMode && (
          <WorkspaceHeader
            slotCount={slots.length}
            catalogCount={devices.length}
            canAdd={slots.length < maxPreviewSlots}
            addRef={addRef}
            addOpen={popover === "picker" && pickerTarget.kind === "add"}
            scrollSync={display.scrollSync}
            navigationSync={display.navigationSync}
            freeView={display.previewStyle === "free"}
            compare={compare}
            capturing={capturing}
            recordRef={recordRef}
            recordOpen={popover === "record"}
            recordingActive={recording || flowRecording}
            fixRef={fixRef}
            fixOpen={popover === "fix"}
            settingsRef={settingsRef}
            settingsOpen={popover === "settings"}
            onAllDevices={openAllDevices}
            onAdd={() => popover === "picker" && pickerTarget.kind === "add" ? setPopover(null) : openPicker({ kind: "add" })}
            onScrollSyncChange={(enabled) => updateDisplay((current) => ({ ...current, scrollSync: enabled }))}
            onNavigationSyncChange={(enabled) => updateDisplay((current) => ({ ...current, navigationSync: enabled }))}
            onFreeViewChange={(free) => updateDisplay((current) => ({ ...current, previewStyle: free ? "free" : "device" }))}
            onReloadAll={reloadAllSlots}
            onCompare={() => { setPopover(null); setFocusedSlotId(null); setCompare((value) => !value); if (!compare) setCompareSlotId(activeSlotId); }}
            onCapture={() => void takeScopedScreenshot()}
            onFixPrompt={() => popover === "fix" ? setPopover(null) : openFixPrompt()}
            onRecord={() => togglePopover("record")}
            onViewMode={enterViewMode}
            onSettings={() => togglePopover("settings")}
            onClose={closeViewer}
          />
        )}
        {compare && !viewMode && (
          <CompareBar
            tabs={slots.map((slot) => ({ slotId: slot.id, label: shortName(findDevice(slot.deviceId).name), hasDesign: Boolean(designReferences[slot.id]) }))}
            activeSlotId={compareSlotId}
            mode={compareMode}
            onSelect={(slotId) => { setCompareSlotId(slotId); setActiveSlot(slotId); setDesignScrollTop(0); }}
            onModeChange={setCompareMode}
            onDone={() => setCompare(false)}
          />
        )}

        <main className="group/focusmode relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={boardRef}
            data-capture-board
            className={cx(
              "flex min-h-0 flex-1",
              narrowLayout && "flex-col",
              viewMode ? "px-6 pb-[100px] pt-6" : compare ? "gap-16 px-6 pb-[88px] pt-3" : "px-3 pb-1 pt-1",
            )}
          >
            {ready && slots.map((slot, index) => {
              const shown = singleSlotId === null || singleSlotId === slot.id;
              const comparing = compare && !viewMode && slot.id === compareSlotId;
              return (
                <div
                  key={slot.id}
                  className={cx("relative flex h-full min-w-0 shrink-0 flex-col hover:z-30 focus-within:z-30", !shown && "hidden", singleSlotId !== null && "flex-1")}
                  style={singleSlotId === null ? (narrowLayout ? { height: `${100 / slots.length}%`, width: "100%" } : { width: `${widths[index] ?? 100 / slots.length}%` }) : undefined}
                >
                  {comparing && (compareMode === "side-by-side"
                    ? <CompareLabel tone="live" title={t("livePage")} detail={slot.url} />
                    : <CompareLabel tone="live" title={t("livePage")}>
                        {compareImage && <>
                          <span className="text-xs text-muted">{t("under")}</span>
                          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-design" /><span className="font-semibold">{t("design")}</span></span>
                          {designNames[slot.id] && <span className="font-mono text-xs text-muted">{designNames[slot.id]}</span>}
                        </>}
                      </CompareLabel>)}
                  <PreviewCard
                    slot={slot}
                    device={findDevice(slot.deviceId)}
                    display={workspaceDisplay}
                    showToolbar={showChrome || focusMode}
                    showCaption={showChrome || focusMode}
                    align="bottom"
                    visualsActive={allDevicesUrl === null}
                    removable={slots.length > 1}
                    onCapture={captureSlot}
                    capturePending={capturing && capturingSlotId === slot.id}
                    focused={focusMode}
                    first={index === 0}
                    last={index === slots.length - 1}
                    revealToolbar={showFirstRun}
                    flowRecording={flowRecording && activeSlotId === slot.id}
                    flowReplay={flowReplay}
                    onFlowStep={recordFlowStep}
                    onFlowResult={receiveFlowResult}
                    onChangeDevice={changeSlotDevice}
                    previousDevice={neighbours.get(slot.id)?.previous}
                    nextDevice={neighbours.get(slot.id)?.next}
                    onSwitchDevice={switchSlotDevice}
                    positionKey={singleSlotId === null ? "all" : "one"}
                    onExpand={focusSlot}
                    onFixPrompt={fixPromptForSlot}
                    focusNavigation={focusNavigation}
                    onScaleChange={updateScale}
                    onPageScroll={comparing && compareMode === "side-by-side" && designScrollLinked ? onComparePageScroll : undefined}
                    designOverlay={comparing && compareMode === "overlay" && designReferences[slot.id] ? {
                      image: designReferences[slot.id],
                      opacity: overlayOpacity,
                      adjusting: !overlayLocked,
                      blend: overlayBlend,
                      placement: overlayPlacements[slot.id],
                      onPlacementChange: (placement) => setOverlayPlacements((current) => ({ ...current, [slot.id]: placement })),
                    } : undefined}
                  />
                  {showChrome && !focusMode && index < slots.length - 1 && !narrowLayout && (
                    <div
                      role="separator"
                      aria-label={t("resizeAdjacentViewports")}
                      aria-orientation="vertical"
                      title={t("resizeAdjacentViewports")}
                      onMouseDown={(event) => startResize(event, index)}
                      onDoubleClick={() => setWidths(slots.map(() => 100 / slots.length))}
                      className="group/grip absolute end-0 top-0 z-20 flex h-full w-7 translate-x-1/2 cursor-col-resize items-center justify-center pb-11 rtl:-translate-x-1/2"
                    >
                      <span className="grid h-9 w-4 place-items-center rounded-lg border border-line bg-surface text-faint shadow-lift transition-colors group-hover/grip:border-accent group-hover/grip:text-accent">
                        <GripIcon />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {compare && !viewMode && compareMode === "side-by-side" && compareDevice && (
              <div className="flex min-w-0 flex-1 flex-col">
                <DesignPane
                  image={compareImage}
                  fileName={designNames[compareSlotId]}
                  deviceName={compareDevice.name}
                  width={comparePaneWidth}
                  height={comparePaneHeight}
                  scrollTop={designScrollLinked ? designScrollTop * compareScale : undefined}
                  onImage={(image, name) => setDesign(compareSlotId, image, name)}
                  onRemove={() => setDesign(compareSlotId)}
                  onMarkUp={(image) => {
                    setAnnotationImage(image);
                    setAnnotationMeta(captureMetaForSlot(compareSlotId));
                    setAnnotationOpen(true);
                    reviewPrompt.noteSuccessfulAction();
                  }}
                />
              </div>
            )}
          </div>

          {compare && !viewMode && compareSlot && (
            <>
              <CompareControls
                mode={compareMode}
                opacity={overlayOpacity}
                blend={overlayBlend}
                locked={overlayLocked}
                scrollLinked={designScrollLinked}
                zoomLabel={`${Math.round(compareScale * 100)}%`}
                hasDesign={Boolean(compareImage)}
                onOpacityChange={setOverlayOpacity}
                onBlendChange={setOverlayBlend}
                onLockedChange={setOverlayLocked}
                onReset={() => setOverlayPlacements((current) => { const next = { ...current }; delete next[compareSlotId]; return next; })}
                onScrollLinkedChange={setDesignScrollLinked}
                onZoomOut={() => zoomSlot(compareSlotId, "out")}
                onZoomIn={() => zoomSlot(compareSlotId, "in")}
                onZoomReset={() => setSlotZoomMode(compareSlotId, "fit")}
                onAddDesign={() => overlayFileInput.current?.click()}
              />
              <input ref={overlayFileInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1}
                onChange={(event) => { readDesignFile(event.target.files?.[0], (image, name) => setDesign(compareSlotId, image, name)); event.target.value = ""; }} />
            </>
          )}

          {viewMode && (
            <ViewModeBar
              single={viewSingle}
              position={`${activeIndex + 1} / ${slots.length}`}
              canStep={slots.length > 1}
              onShowAll={() => setViewSingle(false)}
              onShowOne={() => setViewSingle(true)}
              onPrevious={() => stepActive(-1)}
              onNext={() => stepActive(1)}
              onExit={exitViewMode}
              zoomLabel={`${Math.round((scales[slots[activeIndex]?.id ?? ""] ?? 0) * 100)}%`}
              onZoomOut={() => zoomSlot(slots[activeIndex].id, "out")}
              onZoomIn={() => zoomSlot(slots[activeIndex].id, "in")}
              onZoomReset={() => setSlotZoomMode(slots[activeIndex].id, "fit")}
            />
          )}
        </main>
      </div>

      <DevicePicker
        open={popover === "picker"}
        anchorRef={addRef}
        target={pickerTarget}
        slots={slots}
        maxSlots={maxPreviewSlots}
        sets={deviceSets}
        onClose={closePicker}
        onAdd={(deviceId) => addSlot(deviceId)}
        onRemove={removeSlot}
        onReplace={(slotId, deviceId) => setSlotDevice(slotId, deviceId)}
        onAddInstead={() => setPickerTarget({ kind: "add" })}
        onApplySet={(deviceIds) => { applyDevicePreset(deviceIds); setFocusedSlotId(null); }}
        onDeleteCustom={deleteCustomViewport}
      />
      <SettingsPopover
        open={popover === "settings"}
        anchorRef={settingsRef}
        dark={dark}
        browserBar={browserBar}
        onClose={closePopover}
        onThemeChange={(nextDark) => updateDisplay((current) => ({ ...current, darkMode: nextDark }))}
        onBrowserBarChange={changeBrowserBar}
        onHelp={() => setShowHelp(true)}
        onTour={() => setShowFirstRun(true)}
        onWhatsNew={() => setReleaseNotes(CURRENT_RELEASE_NOTES)}
        onPermissions={() => setShowPermissions(true)}
      />
      <FixPromptPopover
        open={popover === "fix"}
        anchorRef={fixRef}
        onClose={closePopover}
        pageUrl={getSlotUrl(activeSlotId) || slots[0]?.url || ""}
        devices={reviewDevices}
        initialDeviceIds={fixDeviceIds}
      />
      <RecordMenu
        open={popover === "record"}
        anchorRef={recordRef}
        onClose={closePopover}
        tabRecording={recording}
        tabRecordingTime={formatDuration(recordingSeconds)}
        canRecordTab={Boolean(sourceTabId)}
        onToggleTabRecording={() => void toggleRecording()}
        flowRecording={flowRecording}
        flowStepCount={recordedFlow.length}
        onToggleFlowRecording={toggleFlowRecording}
        onReplayFlow={replayRecordedFlow}
        onClearFlow={clearRecordedFlow}
        flowStatus={flowStatus}
        canResumeFlow={Object.values(flowResults).some((result) => result.status === "paused")}
        onResumeFlow={resumePausedFlow}
      />

      {allDevicesUrl !== null && (
        <AllDevicesView
          key={allDevicesUrl}
          url={allDevicesUrl}
          onClose={closeAllDevices}
          onOpenDevice={openGalleryDevice}
          onAddDevice={addGalleryDevice}
          onCloseViewer={closeViewer}
          settings={{
            browserBar,
            onBrowserBarChange: changeBrowserBar,
            onHelp: () => setShowHelp(true),
            onTour: () => { closeAllDevices(); setShowFirstRun(true); },
            onWhatsNew: () => setReleaseNotes(CURRENT_RELEASE_NOTES),
            onPermissions: () => setShowPermissions(true),
          }}
        />
      )}

      {annotationOpen && (
        <AnnotationOverlay
          imageUrl={annotationImage}
          meta={annotationMeta ?? captureMeta}
          fixPrompt={{ pageUrl: annotationMeta?.url ?? captureMeta.url, devices: reviewDevices }}
          onClose={() => {
            setAnnotationOpen(false);
            setAnnotationMeta(undefined);
          }}
        />
      )}
      {captureError && (
        <div role="alert" className="fixed bottom-3 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-float">
          {captureError}
        </div>
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

async function capturedImage(capture: () => Promise<TabCaptureResult>, fallbackError: string): Promise<HTMLImageElement> {
  let result = await capture();
  // Chrome allows two tab captures per second; a cutout needs two in a row.
  if (result.error?.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND")) {
    await new Promise(resolve => window.setTimeout(resolve, 600));
    result = await capture();
  }
  if (!result.dataUrl) throw new Error(result.error ?? fallbackError);
  const image = new Image();
  image.src = result.dataUrl;
  await image.decode();
  return image;
}

// The element's bounds in screenshot pixels. Derive the size from both edges
// so fractional placement cannot add or drop a bottom/right row. `inner` keeps
// only pixels the element fully covers, for cutouts whose edges must not mix
// in whatever is painted beside the element.
function elementPixelRect(element: HTMLElement, image: HTMLImageElement, inner = false): PixelRect {
  const rect = inner ? visibleRect(element) : element.getBoundingClientRect();
  const scaleX = image.naturalWidth / window.innerWidth;
  const scaleY = image.naturalHeight / window.innerHeight;
  const start = inner ? Math.ceil : Math.floor;
  const end = inner ? Math.floor : Math.ceil;
  const x = Math.max(0, start(rect.left * scaleX));
  const y = Math.max(0, start(rect.top * scaleY));
  return {
    x,
    y,
    width: Math.min(image.naturalWidth, end(rect.right * scaleX)) - x,
    height: Math.min(image.naturalHeight, end(rect.bottom * scaleY)) - y,
  };
}

// The part of an element not clipped away by scrolling or overflow-hidden
// ancestors, e.g. a device slightly wider than its column.
function visibleRect(element: HTMLElement) {
  let { left, top, right, bottom } = element.getBoundingClientRect();
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (getComputedStyle(parent).overflow === "visible") continue;
    const clip = parent.getBoundingClientRect();
    left = Math.max(left, clip.left);
    top = Math.max(top, clip.top);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  return { left, top, right, bottom };
}

function cropToCanvas(image: HTMLImageElement, region: PixelRect) {
  if (region.width <= 0 || region.height <= 0) throw new Error("The device is outside the visible area. Zoom out and try again.");
  const canvas = document.createElement("canvas");
  canvas.width = region.width;
  canvas.height = region.height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  return { canvas, context };
}

async function cropScreenshotToElement(image: HTMLImageElement, element: HTMLElement): Promise<string> {
  return cropToCanvas(image, elementPixelRect(element, image)).canvas.toDataURL("image/png");
}

// Captures one device with only its frame and page: the same view over a white
// and then a black backdrop gives every pixel's opacity (see extractMatte).
async function captureDeviceCutout(target: HTMLElement, capture: () => Promise<TabCaptureResult>, fallbackError: string): Promise<string> {
  const shots: HTMLImageElement[] = [];
  try {
    for (const matte of ["white", "black"] as const) {
      target.dataset.captureMatte = matte;
      shots.push(await captureShowingMatte(target, matte, capture, fallbackError));
    }
  } finally {
    delete target.dataset.captureMatte;
  }
  const [onWhite, onBlack] = shots;
  const region = elementPixelRect(target, onBlack, true);
  const white = cropToCanvas(onWhite, region).context.getImageData(0, 0, region.width, region.height);
  const black = cropToCanvas(onBlack, region);
  const page = target.querySelector<HTMLElement>("[data-preview-surface]");
  const output = black.context.createImageData(region.width, region.height);
  output.data.set(extractMatte(white.data, black.context.getImageData(0, 0, region.width, region.height).data, region.width, page ? pageRect(page, region, onBlack) : undefined));
  black.context.putImageData(output, 0, 0);
  return black.canvas.toDataURL("image/png");
}

// A busy page can delay the compositor, so a tab capture may return a frame
// from before the backdrop (and the hidden controls) were painted. Mixing such
// a frame with a current one leaves menus and haze in the cutout, so retry
// until the capture shows the requested backdrop.
async function captureShowingMatte(target: HTMLElement, matte: "white" | "black", capture: () => Promise<TabCaptureResult>, fallbackError: string) {
  for (let attempt = 1; ; attempt++) {
    const image = await capturedImage(capture, fallbackError);
    if (attempt === 3 || showsMatte(image, target, matte)) return image;
    await new Promise(resolve => window.setTimeout(resolve, 250));
  }
}

// Samples the backdrop ring painted just outside each edge of the device.
function showsMatte(image: HTMLImageElement, target: HTMLElement, matte: "white" | "black") {
  const rect = target.getBoundingClientRect();
  const scaleX = image.naturalWidth / window.innerWidth;
  const scaleY = image.naturalHeight / window.innerHeight;
  const middleX = rect.left + rect.width / 2;
  const middleY = rect.top + rect.height / 2;
  const points = [[middleX, rect.top - 1.5], [middleX, rect.bottom + 1.5], [rect.left - 1.5, middleY], [rect.right + 1.5, middleY]]
    .filter(([x, y]) => x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight);
  if (points.length === 0) return true;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  const expected = matte === "white" ? 255 : 0;
  const matches = points.filter(([x, y]) => {
    context.clearRect(0, 0, 1, 1);
    context.drawImage(image, Math.floor(x * scaleX), Math.floor(y * scaleY), 1, 1, 0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    return [red, green, blue].every(channel => Math.abs(channel - expected) <= 6);
  });
  return matches.length * 2 >= points.length;
}

// The page area relative to the cutout, inset past its rounded screen corners.
function pageRect(page: HTMLElement, region: PixelRect, image: HTMLImageElement): PixelRect {
  const bounds = elementPixelRect(page, image);
  const inset = Math.ceil(16 * (image.naturalWidth / window.innerWidth));
  return {
    x: bounds.x - region.x + inset,
    y: bounds.y - region.y + inset,
    width: Math.max(0, bounds.width - inset * 2),
    height: Math.max(0, bounds.height - inset * 2),
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
