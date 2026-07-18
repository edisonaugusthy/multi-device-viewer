import {
  Camera,
  Focus,
  ChevronRight,
  GripVertical,
  Images,
  Link2,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Plus,
  RefreshCw,
  RotateCcw,
  Route,
  QrCode,
  ScanSearch,
  Settings2,
  Sun,
  Trash2,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
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
  captureTabWithOverlay,
  startTabRecording,
  stopTabRecording,
} from "../../domain/capture/capture-service";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import { defaultDeviceIds } from "../../domain/device/device-catalog";
import {
  readStore,
  writeStore,
} from "../../infrastructure/storage/local-store";
import { AnnotationOverlay } from "./AnnotationOverlay";
import {
  DesignReferencePanel,
  type ReferenceMode,
} from "./DesignReferencePanel";
import { BrandMark } from "./BrandMark";
import { CustomDeviceModal } from "./CustomDeviceModal";
import { FirstRunGuide } from "./FirstRunGuide";
import { PresetsManager } from "./PresetsManager";
import { PreviewCard } from "./PreviewCard";
import { ReviewIssueModal } from "./ReviewIssueModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { DeviceHandoffModal } from "./DeviceHandoffModal";

const QUICK_DEVICE_SETS = [
  {
    label: "Phone + tablet",
    devices: ["apple-iphone-14-pro-max-2022", "apple-ipad-air-4"],
  },
  {
    label: "iOS + Android",
    devices: ["apple-iphone-14-pro-max-2022", "samsung-galaxy-s24"],
  },
  {
    label: "Mobile + tablet + laptop",
    devices: [
      "macbook-air-2020-13",
      "apple-iphone-14-pro-max-2022",
      "apple-ipad-air-4",
    ],
  },
] as const;

export function SimulatorApp() {
  const { findDevice, customDevices, removeCustomDevice } = useDeviceCatalog();
  const {
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
    resetSession,
  } = useSimulator();
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [capturing, setCapturing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 760,
  );
  const [narrowLayout, setNarrowLayout] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 760,
  );
  const [showCustomDevice, setShowCustomDevice] = useState(false);
  const [showSavedSets, setShowSavedSets] = useState(false);
  const [showReviewIssue, setShowReviewIssue] = useState(false);
  const [showDesignReference, setShowDesignReference] = useState(false);
  const [showDeviceHandoff, setShowDeviceHandoff] = useState(false);
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
  const boardRef = useRef<HTMLDivElement>(null);
  const dark = display.darkMode;

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
        if (typeof saved?.sidebarOpen === "boolean" && !narrowLayout) setSidebarOpen(saved.sidebarOpen);
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

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setNarrowLayout(query.matches);
      if (query.matches) setSidebarOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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

  async function takeScreenshot() {
    if (capturing) return;
    setCapturing(true);
    try {
      const dataUrl = await captureTabWithOverlay();
      setAnnotationImage(dataUrl ?? undefined);
      setAnnotationOpen(true);
    } finally {
      setCapturing(false);
    }
  }

  async function takeScopedScreenshot(scope: "workspace" | "active" = "workspace") {
    if (capturing) return;
    setCapturing(true);
    try {
      const dataUrl = await captureTabWithOverlay();
      if (!dataUrl) return;
      const selector = scope === "active"
        ? `[data-preview-slot-id="${activeSlotId}"]`
        : "[data-capture-board]";
      const target = document.querySelector<HTMLElement>(selector);
      const cropped = target ? await cropScreenshotToElement(dataUrl, target) : dataUrl;
      setAnnotationImage(cropped);
      setAnnotationOpen(true);
    } finally {
      setCapturing(false);
    }
  }

  function startNewCheck() {
    setFocusedSlotId(null);
    setShowDesignReference(false);
    setDesignReferences({});
    setOverlayPlacements({});
    resetSession();
  }

  async function toggleRecording() {
    if (recording) {
      if (await stopTabRecording()) setRecording(false);
      return;
    }
    if (await startTabRecording(sourceTabId)) setRecording(true);
  }

  function closeViewer() {
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
      className={`flex h-screen flex-col overflow-hidden font-sans transition-colors ${dark ? "bg-[#0b0d12] text-slate-100" : "bg-[#eef0f3] text-slate-900"}`}
    >
      {sidebarOpen && <header
        data-main-toolbar
        className={`z-20 flex h-10 shrink-0 items-center gap-1.5 border-b px-2 ${dark ? "border-white/[0.08] bg-[#11141a]" : "border-slate-200 bg-white"}`}
      >
        <button
          type="button"
          className={`grid h-8 w-8 place-items-center rounded-lg lg:hidden ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open workspace setup"
        >
          <Menu size={15} />
        </button>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center"
          title={PRODUCT_SHORT_NAME}
        >
          <BrandMark size={27} />
        </div>
        <div
          className="ml-1 hidden items-center gap-1 md:flex"
          aria-label="Quick device sets"
        >
          {QUICK_DEVICE_SETS.map((set) => (
            <button
              key={set.label}
              type="button"
              title={`Open ${set.label}`}
              onClick={() => applyDevicePreset([...set.devices])}
              className={`h-7 rounded-[7px] border px-2 text-[10px] font-bold transition ${dark ? "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {set.label}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1" />
        <button
          type="button"
          disabled={slots.length >= maxPreviewSlots}
          onClick={() => addSlot()}
          className={`hidden h-7 items-center gap-1.5 rounded-[7px] px-2 text-[10px] font-bold sm:flex ${dark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <Plus size={12} />
          Add viewport
        </button>
        <button
          type="button"
          onClick={() => setShowReviewIssue(true)}
          className={`flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[10px] font-bold ${dark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <ScanSearch size={12} />
          <span className="hidden sm:inline">Copy fix prompt</span>
        </button>
        <button
          type="button"
          onClick={() => setShowDesignReference(true)}
          className={`hidden h-7 items-center gap-1.5 rounded-[7px] px-2 text-[10px] font-bold md:flex ${dark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <Images size={12} />
          Compare page to design
        </button>
        <button
          type="button"
          title={
            display.scrollSync ? "Turn off scroll sync" : "Turn on scroll sync"
          }
          aria-pressed={display.scrollSync}
          onClick={() =>
            updateDisplay((current) => ({
              ...current,
              scrollSync: !current.scrollSync,
            }))
          }
          className={`flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[10px] font-bold ${display.scrollSync ? "bg-[#0f9f8f] text-white" : dark ? "text-slate-500 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <Link2 size={12} />
          <span>Scroll sync</span>
        </button>
        <button
          type="button"
          title={display.navigationSync ? "Turn off navigation sync" : "Turn on navigation sync"}
          aria-pressed={display.navigationSync}
          onClick={() => updateDisplay((current) => ({ ...current, navigationSync: !current.navigationSync }))}
          className={`hidden h-7 items-center gap-1.5 rounded-[7px] px-2 text-[10px] font-bold lg:flex ${display.navigationSync ? "bg-[#0f9f8f] text-white" : dark ? "text-slate-500 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <Route size={12} />
          <span>Navigation sync</span>
        </button>
        <ToolbarButton
          label="Capture active viewport"
          dark={dark}
          onClick={() => void takeScopedScreenshot("active")}
        >
          <Camera size={14} />
        </ToolbarButton>
        <ToolbarButton label="Reload all" dark={dark} onClick={reloadAllSlots}>
          <RefreshCw size={15} />
        </ToolbarButton>
        <ToolbarButton
          label={dark ? "Light theme" : "Dark theme"}
          dark={dark}
          onClick={() =>
            updateDisplay((current) => ({
              ...current,
              darkMode: !current.darkMode,
            }))
          }
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </ToolbarButton>
        <ToolbarButton label="Close viewer" dark={dark} onClick={closeViewer}>
          <X size={16} />
        </ToolbarButton>
      </header>}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen && narrowLayout && (
          <button
            type="button"
            aria-label="Close workspace setup"
            className="absolute inset-0 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`z-40 flex shrink-0 flex-col border-r transition-[width,transform] duration-200 ${dark ? "border-white/[0.08] bg-[#11141a]" : "border-slate-200 bg-white"} ${sidebarOpen ? "w-60 translate-x-0" : "w-0 -translate-x-full overflow-hidden border-r-0"} ${narrowLayout ? "absolute inset-y-0 left-0 shadow-2xl" : "relative"}`}
        >
          {sidebarOpen && (
            <>
              <div
                className={`flex h-11 shrink-0 items-center justify-between border-b px-3 ${dark ? "border-white/[0.07]" : "border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={14} className="text-[#0f9f8f]" />
                  <span className="text-[11px] font-extrabold">
                    Workspace setup
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className={`grid h-7 w-7 place-items-center rounded-md ${dark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
                  aria-label="Collapse workspace setup"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
                <SidebarSection
                  title="Devices"
                  meta={`${slots.length} of ${maxPreviewSlots}`}
                  dark={dark}
                >
                  <button
                    type="button"
                    disabled={slots.length >= maxPreviewSlots}
                    onClick={() => addSlot()}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-[#0f9f8f] text-[11px] font-bold text-white shadow-sm hover:bg-[#0c8b7e] disabled:opacity-40"
                  >
                    <Plus size={14} />
                    Add viewport
                  </button>
                  <ActionRow
                    dark={dark}
                    icon={<PanelsTopLeft size={14} />}
                    onClick={() => setShowCustomDevice(true)}
                    label="Add custom viewport"
                  />
                </SidebarSection>

                {customDevices.length > 0 && (
                  <SidebarSection
                    title="Custom viewports"
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
                            title={`Add ${device.name} viewport`}
                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span className="min-w-0 flex-1 truncate text-[10px] font-bold">{device.name}</span>
                            <span className={`shrink-0 font-mono text-[8px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{device.cssViewport.width}×{device.cssViewport.height}</span>
                            <Plus size={10} className="shrink-0 text-[#0f9f8f]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomViewport(device.id)}
                            title={`Delete ${device.name}`}
                            aria-label={`Delete ${device.name}`}
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
                  title="Saved sets"
                  dark={dark}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowSavedSets((value) => !value)}
                      className="text-[9px] font-extrabold uppercase tracking-wider text-[#0f9f8f]"
                    >
                      {showSavedSets ? "Done" : "Manage"}
                    </button>
                  }
                >
                  <p
                    className={`text-[10px] leading-4 ${dark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Reuse device combinations for repeated checks.
                  </p>
                  {showSavedSets && (
                    <PresetsManager
                      dark={dark}
                      currentDeviceIds={slots.map((slot) => slot.deviceId)}
                      onApply={applyDevicePreset}
                    />
                  )}
                </SidebarSection>

                <SidebarSection title="Session tools" dark={dark}>
                  <ActionRow
                    dark={dark}
                    icon={<Focus size={14} />}
                    onClick={() => setFocusedSlotId(focusedSlotId ? null : activeSlotId)}
                    active={!!focusedSlotId}
                    label={focusedSlotId ? "Show all viewports" : "Focus active viewport"}
                  />
                  <ActionRow dark={dark} icon={<QrCode size={14} />} onClick={() => setShowDeviceHandoff(true)} label="Open on physical device" />
                  <ActionRow
                    dark={dark}
                    icon={<ScanSearch size={14} />}
                    onClick={() => setShowReviewIssue(true)}
                    label="Generate AI fix prompt"
                  />
                  <ActionRow
                    dark={dark}
                    icon={<Images size={14} />}
                    onClick={() => setShowDesignReference(true)}
                    label="Compare page to design"
                  />
                  <ActionRow
                    dark={dark}
                    icon={<Camera size={14} />}
                    onClick={() => void takeScopedScreenshot("workspace")}
                    label={
                      capturing
                        ? "Capturing comparison…"
                        : "Capture and annotate"
                    }
                  />
                  <ActionRow
                    dark={dark}
                    icon={<RotateCcw size={14} />}
                    onClick={startNewCheck}
                    label="Start a new check"
                  />
                  <ActionRow
                    dark={dark}
                    icon={<Video size={14} />}
                    onClick={() => void toggleRecording()}
                    disabled={!sourceTabId}
                    active={recording}
                    label={recording ? `Recording ${formatDuration(recordingSeconds)} — stop` : "Record source tab"}
                  />
                  {recording && (
                    <div role="status" aria-live="polite" className="flex h-7 items-center gap-2 rounded-lg bg-red-500/10 px-2 text-[10px] font-extrabold text-red-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      REC · {formatDuration(recordingSeconds)} · source tab
                    </div>
                  )}
                </SidebarSection>
              </div>
              <div
                className={`border-t p-3 ${dark ? "border-white/[0.07]" : "border-slate-100"}`}
              >
                <div
                  className={`rounded-[10px] p-2.5 ${dark ? "bg-white/[0.035]" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${dark ? "text-slate-600" : "text-slate-400"}`}
                  >
                    Current session
                  </p>
                  <p className="mt-1 truncate text-[10px] font-semibold">
                    {slots.length} viewports ·{" "}
                    {display.scrollSync ? "linked" : "independent"}
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open workspace setup"
            title="Show workspace controls"
            className={`absolute left-2 top-2 z-40 grid h-8 w-8 place-items-center rounded-lg border shadow-sm backdrop-blur transition ${dark ? "border-white/10 bg-[#171a21]/90 text-slate-400 hover:border-white/20 hover:text-white" : "border-slate-200 bg-white/90 text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}
          >
            <PanelLeftOpen size={15} />
          </button>
        )}

        {showDesignReference && (
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
              setAnnotationOpen(true);
            }}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            ref={boardRef}
            data-capture-board
            className={`flex min-h-0 flex-1 ${narrowLayout ? "flex-col" : ""}`}
          >
            {slots.map((slot, index) => (
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
                  showToolbar={sidebarOpen}
                  removable={slots.length > 1}
                  onCapture={() => void takeScopedScreenshot("active")}
                  focused={focusedSlotId === slot.id}
                  first={index === 0}
                  last={index === slots.length - 1}
                  onToggleFocus={() => setFocusedSlotId((current) => current === slot.id ? null : slot.id)}
                  designOverlay={
                    showDesignReference &&
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
                {!focusedSlotId && index < slots.length - 1 && !narrowLayout && (
                  <div
                    role="separator"
                    aria-label="Resize adjacent viewports"
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
          meta={captureMeta}
          onClose={() => setAnnotationOpen(false)}
        />
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
      {showFirstRun && <FirstRunGuide dark={dark} onClose={finishFirstRun} />}
      {showDeviceHandoff && <DeviceHandoffModal dark={dark} url={slots.find((slot) => slot.id === activeSlotId)?.url ?? slots[0]?.url ?? ""} onClose={() => setShowDeviceHandoff(false)} />}
      {releaseNotes && <ReleaseNotesModal dark={dark} release={releaseNotes} onClose={() => setReleaseNotes(null)} />}
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  dark,
  onClick,
}: {
  children: ReactNode;
  label: string;
  dark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-[8px] transition ${dark ? "text-slate-500 hover:bg-white/[0.07] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {children}
    </button>
  );
}

function SidebarSection({
  title,
  meta,
  action,
  dark,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  dark: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2
          className={`text-[9px] font-extrabold uppercase tracking-[0.13em] ${dark ? "text-slate-600" : "text-slate-400"}`}
        >
          {title}
        </h2>
        {action ??
          (meta && (
            <span
              className={`text-[9px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}
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
}: {
  icon: ReactNode;
  label: string;
  dark: boolean;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[11px] font-semibold transition disabled:opacity-35 ${active ? "bg-red-500/10 text-red-500" : dark ? "text-slate-400 hover:bg-white/[0.055] hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight size={11} className="shrink-0 opacity-35" />
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
