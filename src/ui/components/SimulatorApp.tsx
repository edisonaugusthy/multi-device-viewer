import {
  Camera,
  Check,
  Link2,
  LayoutGrid,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Plus,
  RotateCw,
  Star,
  Sun,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import {
  captureTabWithOverlay,
  startTabRecording,
  stopTabRecording,
} from "../../domain/capture/capture-service";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import { PreviewCard } from "./PreviewCard";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { CustomDeviceModal } from "./CustomDeviceModal";
import { PresetsManager } from "./PresetsManager";

export function SimulatorApp() {
  const { findDevice } = useDeviceCatalog();
  const {
    slots,
    display,
    activeSlotId,
    addSlot,
    applyDevicePreset,
    reloadAllSlots,
    updateDisplay,
    sourceTabId,
    useCount,
  } = useSimulator();

  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [capturing, setCapturing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window === "undefined" ? true : window.innerWidth > 720
  ));
  const [narrowLayout, setNarrowLayout] = useState(() => (
    typeof window === "undefined" ? false : window.innerWidth <= 720
  ));
  const [showCustomDevice, setShowCustomDevice] = useState(false);
  const [showPresetsSection, setShowPresetsSection] = useState(false);
  const [showReviewBanner, setShowReviewBanner] = useState(false);
  const [recording, setRecording] = useState(false);
  const reviewUrl = "https://chromewebstore.google.com/detail/jfcnekmenjickfihkniaoaklehjmdhdb?utm_source=item-share-cbuse";

  const closeViewer = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "CLOSE_SIMULATOR" }, "*");
      return;
    }

    if (typeof chrome !== "undefined" && chrome.tabs?.getCurrent && chrome.tabs?.remove) {
      chrome.tabs.getCurrent((tab) => {
        if (tab?.id) {
          void chrome.tabs.remove(tab.id);
          return;
        }
        window.close();
      });
      return;
    }

    window.close();
  };

  // Show review prompt after 5 uses (only once)
  useEffect(() => {
    if (useCount < 5) return;
    void import("../../infrastructure/storage/local-store").then(({ readStore }) => {
      void readStore<boolean>("mdvReviewDismissed", false).then((dismissed) => {
        if (!dismissed) setShowReviewBanner(true);
      });
    });
  }, [useCount]);

  function dismissReview(permanent: boolean) {
    setShowReviewBanner(false);
    if (permanent) {
      void import("../../infrastructure/storage/local-store").then(({ writeStore }) => {
        void writeStore("mdvReviewDismissed", true);
      });
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 720px)");
    const syncSmallScreenLayout = () => {
      setNarrowLayout(query.matches);
      if (query.matches) setSidebarOpen(false);
    };
    syncSmallScreenLayout();
    query.addEventListener("change", syncSmallScreenLayout);
    return () => query.removeEventListener("change", syncSmallScreenLayout);
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;

    const listener = (message: unknown) => {
      if (!message || typeof message !== "object") return;
      if ((message as Record<string, unknown>).type === "OFFSCREEN_RECORDING_COMPLETE") {
        setRecording(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // ── Screenshots ───────────────────────────────────────────────────────────
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

  async function toggleRecordingCapture() {
    if (recording) {
      const stopped = await stopTabRecording();
      if (stopped) setRecording(false);
      return;
    }

    const started = await startTabRecording(sourceTabId);
    if (started) setRecording(true);
  }

  const captureMeta = {
    title: "Multi Device Viewer QA capture",
    url: slots[0]?.url ?? "",
    devices: slots.map((slot) => {
      const device = findDevice(slot.deviceId);
      return `${device.name} (${device.cssViewport.width}x${device.cssViewport.height})`;
    })
  };

  // ── Resizable panel widths ────────────────────────────────────────────────
  const [widths, setWidths] = useState<number[]>(() =>
    slots.map(() => 100 / slots.length)
  );
  const prevSlotCount = useRef(slots.length);
  if (slots.length !== prevSlotCount.current) {
    prevSlotCount.current = slots.length;
    const equal = 100 / slots.length;
    setWidths(slots.map(() => equal));
  }

  const boardRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent, handleIndex: number) => {
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;
    const startX = e.clientX;
    const totalW = board.getBoundingClientRect().width;
    const startLeft = widths[handleIndex];
    const startRight = widths[handleIndex + 1];
    const combined = startLeft + startRight;

    const onMove = (me: MouseEvent) => {
      const delta = ((me.clientX - startX) / totalW) * 100;
      const minPct = (120 / totalW) * 100;
      const newLeft = Math.min(combined - minPct, Math.max(minPct, startLeft + delta));
      const newRight = combined - newLeft;
      setWidths((prev) => {
        const next = [...prev];
        next[handleIndex] = newLeft;
        next[handleIndex + 1] = newRight;
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [widths]);

  const dark = display.darkMode;

  return (
    <div className={`flex h-screen flex-col overflow-hidden transition-colors ${dark ? "bg-[#111318]" : "bg-[#f5f5f3]"}`}>

      {/* ── Review prompt banner ── */}
      {showReviewBanner && (
        <div className={`flex shrink-0 items-center gap-3 border-b px-4 py-2 text-[12px] font-semibold ${dark ? "border-white/10 bg-teal-900/40 text-teal-100" : "border-teal-100 bg-teal-50 text-teal-900"}`}>
          <Star size={14} className="shrink-0 text-amber-400" />
          <span className="flex-1">Enjoying Multi Device Viewer? Leave us a review — it helps a lot!</span>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dismissReview(true)}
            className="rounded-md bg-teal-500 px-2.5 py-1 text-[11px] font-black text-white transition hover:bg-teal-400"
          >
            Rate it
          </a>
          <button
            type="button"
            onClick={() => dismissReview(true)}
            className={`grid h-6 w-6 shrink-0 place-items-center rounded transition ${dark ? "hover:bg-white/10" : "hover:bg-teal-100"}`}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Main row: sidebar + canvas ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside
          className={`flex shrink-0 flex-col border-r transition-all duration-200 max-[720px]:absolute max-[720px]:inset-y-0 max-[720px]:left-0 max-[720px]:z-30 max-[720px]:shadow-2xl ${
            dark ? "border-white/10 bg-[#151922]" : "border-black/[0.07] bg-white"
          } ${sidebarOpen ? "w-64" : "w-10"}`}
        >
          {/* Logo / brand + toggle */}
          <div className={`flex h-12 shrink-0 items-center gap-1 border-b px-2 ${dark ? "border-white/10" : "border-slate-100"}`}>
            {sidebarOpen && (
              <span className={`flex-1 pl-2 text-[13px] font-black tracking-tight ${dark ? "text-white" : "text-slate-800"}`}>Device Viewer</span>
            )}
            <button
              type="button"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              onClick={() => setSidebarOpen((v) => !v)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
          </div>

          <div className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 pb-0 ${sidebarOpen ? "" : "hidden"}`}>
            {/* Devices */}
            <div>
              <Label dark={dark}>Devices</Label>
              <div className="mt-1.5 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => addSlot()}
                  disabled={slots.length >= maxPreviewSlots}
                  className={`flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    dark
                      ? "border-teal-400/30 bg-teal-400/15 text-teal-100 hover:bg-teal-400/20"
                      : "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100"
                  }`}
                >
                  <Plus size={15} className="shrink-0" />
                  Add device
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <SidebarBtn compact dark={dark} icon={<RotateCw size={13} />} onClick={() => reloadAllSlots()}>
                    Reload all
                  </SidebarBtn>
                  <SidebarBtn compact dark={dark} icon={<PanelsTopLeft size={13} />} onClick={() => setShowCustomDevice(true)}>
                    Custom device
                  </SidebarBtn>
                </div>
              </div>
            </div>

            {/* Display */}
            <div>
              <Label dark={dark}>Display</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                <Toggle
                  active={display.scrollSync}
                  dark={dark}
                  icon={<Link2 size={15} />}
                  onClick={() => updateDisplay((c) => ({ ...c, scrollSync: !c.scrollSync }))}
                >
                  Scroll sync
                </Toggle>
                <Toggle
                  active={dark}
                  dark={dark}
                  icon={dark ? <Moon size={15} /> : <Sun size={15} />}
                  onClick={() => updateDisplay((c) => ({ ...c, darkMode: !c.darkMode }))}
                >
                  Dark mode
                </Toggle>
              </div>
            </div>

            {/* Layout presets */}
            <div>
              <div className="flex items-center justify-between">
                <Label dark={dark}>Presets</Label>
                <button
                  type="button"
                  onClick={() => setShowPresetsSection((v) => !v)}
                  className={`text-[10px] font-black uppercase tracking-widest transition ${dark ? "text-slate-600 hover:text-slate-400" : "text-slate-300 hover:text-slate-500"}`}
                >
                  {showPresetsSection ? "hide" : "manage"}
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-1 gap-1">
                <SidebarBtn
                  dark={dark}
                  icon={<LayoutGrid size={14} />}
                  onClick={() => applyDevicePreset(["apple-iphone-14-pro-max-2022", "apple-ipad-air-4"])}
                >
                  Mobile vs Tablet
                </SidebarBtn>
                <SidebarBtn
                  dark={dark}
                  icon={<LayoutGrid size={14} />}
                  onClick={() => applyDevicePreset(["apple-iphone-14-pro-max-2022", "samsung-galaxy-s24"])}
                >
                  iOS vs Android
                </SidebarBtn>
                <SidebarBtn
                  dark={dark}
                  icon={<LayoutGrid size={14} />}
                  onClick={() => applyDevicePreset(["macbook-air-2020-13", "apple-iphone-14-pro-max-2022", "apple-ipad-air-4"])}
                >
                  Laptop + Mobile + Tablet
                </SidebarBtn>
              </div>
              {showPresetsSection && (
                <div className="mt-2">
                  <PresetsManager
                    dark={dark}
                    currentDeviceIds={slots.map((s) => s.deviceId)}
                    onApply={applyDevicePreset}
                  />
                </div>
              )}
            </div>

            {/* Capture */}
            <div>
              <Label dark={dark}>Capture</Label>
              <div className="mt-1.5 flex flex-col gap-1">
                <SidebarBtn compact dark={dark} icon={<Camera size={13} />} onClick={() => void takeScreenshot()} disabled={capturing}>
                  {capturing ? "Capturing…" : "Capture & Annotate"}
                </SidebarBtn>
                <SidebarBtn
                  compact
                  dark={dark}
                  disabled={!sourceTabId}
                  icon={<Video size={13} />}
                  onClick={() => void toggleRecordingCapture()}
                >
                  {recording ? "Stop recording" : "Record source tab"}
                </SidebarBtn>
              </div>
            </div>

          </div>

          {/* Close button */}
          <div className={`shrink-0 border-t p-3 ${dark ? "border-white/10" : "border-slate-100"} ${sidebarOpen ? "" : "hidden"}`}>
            <button
              type="button"
              onClick={closeViewer}
              className={`flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition ${
                dark ? "text-slate-300 hover:bg-red-500/10 hover:text-red-200" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <X size={14} className="shrink-0" />
              Close viewer
            </button>
          </div>
        </aside>

        {/* ── Right pane: preview canvas ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden max-[720px]:pl-10">

          {/* ── Preview canvas (resizable panels) ── */}
          <main className="flex min-h-0 flex-1 overflow-hidden">
            <div
              ref={boardRef}
              data-capture-board
              className={`flex h-full w-full ${narrowLayout ? "flex-col" : ""}`}
            >
            {slots.map((slot, i) => (
                <div
                  key={slot.id}
                  className="relative flex h-full min-w-0 flex-col overflow-hidden"
                  style={{
                    width: narrowLayout ? "100%" : `${widths[i] ?? 100 / slots.length}%`,
                    height: narrowLayout ? `${100 / slots.length}%` : undefined,
                    flexShrink: 0,
                    flexGrow: 0
                  }}
                >
                  <PreviewCard
                    slot={slot}
                    device={findDevice(slot.deviceId)}
                    display={display}
                    removable={slots.length > 1}
                    onCapture={() => void takeScreenshot()}
                  />
                  {/* Drag handle */}
                  {i < slots.length - 1 && !narrowLayout && (
                    <div
                      className="group absolute right-0 top-0 z-10 flex h-full w-[9px] cursor-col-resize flex-col items-center justify-center"
                      onMouseDown={(e) => startResize(e, i)}
                    >
                      <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-black/[0.07] transition-all group-hover:w-[2px] group-hover:bg-slate-400/70" />
                      <div className="relative z-10 flex flex-col items-center gap-[3px] rounded-full bg-white px-[3px] py-[6px] shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08] transition-all group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.16)] group-hover:ring-black/[0.14]">
                        <span className="block h-[3px] w-[3px] rounded-full bg-slate-400 transition-colors group-hover:bg-slate-600" />
                        <span className="block h-[3px] w-[3px] rounded-full bg-slate-400 transition-colors group-hover:bg-slate-600" />
                        <span className="block h-[3px] w-[3px] rounded-full bg-slate-400 transition-colors group-hover:bg-slate-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {annotationOpen && <AnnotationOverlay imageUrl={annotationImage} meta={captureMeta} onClose={() => setAnnotationOpen(false)} />}

      {showCustomDevice && (
        <CustomDeviceModal
          dark={dark}
          onClose={() => setShowCustomDevice(false)}
          onCreated={() => setShowCustomDevice(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, dark }: { children: ReactNode; dark: boolean }) {
  return (
    <p className={`text-[10px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>{children}</p>
  );
}

function SidebarBtn({
  icon,
  children,
  onClick,
  disabled,
  dark,
  compact = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dark: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex ${compact ? "h-7 text-[12px] px-2" : "h-8 px-2.5 text-[13px]"} w-full items-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        dark ? "text-slate-200 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={`shrink-0 ${dark ? "text-slate-400" : "text-slate-500"}`}>{icon}</span>
      {children}
    </button>
  );
}

function Toggle({
  active,
  children,
  dark,
  icon,
  onClick,
  disabled = false,
}: {
  active: boolean;
  children: ReactNode;
  dark: boolean;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-10 w-full items-center gap-2 rounded-[8px] border px-2.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? dark ? "border-teal-400/40 bg-teal-400/10 text-teal-100" : "border-teal-200 bg-teal-50 text-teal-900"
          : dark ? "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${active ? "bg-teal-500 text-white" : dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">{children}</span>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
        active
          ? "border-teal-500 bg-teal-500 text-white"
          : dark ? "border-white/20 bg-transparent text-transparent" : "border-slate-300 bg-white text-transparent"
      }`}>
        <Check size={13} strokeWidth={3} />
      </span>
    </button>
  );
}
