import {
  Camera,
  Check,
  Crosshair,
  ChevronDown,
  LayoutGrid,
  Link2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Plus,
  RectangleHorizontal,
  RotateCw,
  Signal,
  Star,
  Sun,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { captureTabWithOverlay } from "../../domain/capture/capture-service";
import { maxPreviewSlots, normalizeUrl } from "../../domain/simulator/simulator-service";
import type { InspectData } from "./ElementInspectOverlay";
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
    workbenchIssue,
    addSlot,
    applyDevicePreset,
    reloadAllSlots,
    updateDisplay,
    updateWorkbenchIssue,
    setAllSlotsUrl,
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
  const [inspectSnapshots, setInspectSnapshots] = useState<Record<string, InspectData | null>>({});
  const [inspectResetToken, setInspectResetToken] = useState(0);
  const copyResetTimerRef = useRef<number | undefined>(undefined);
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy prompt");
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
    return () => window.clearTimeout(copyResetTimerRef.current);
  }, []);

  // ── URL bar state ─────────────────────────────────────────────────────────
  const activeSlot = slots.find((s) => s.id === activeSlotId) ?? slots[0];
  const [urlDraft, setUrlDraft] = useState(activeSlot?.url ?? "");
  const activeInspect = inspectSnapshots[activeSlotId] ?? null;
  const compareSlot = slots.find((slot) => slot.id === workbenchIssue.compareSlotId) ?? null;
  const compareInspect = compareSlot ? inspectSnapshots[compareSlot.id] ?? null : null;

  // Keep draft in sync when active slot URL changes (e.g. after Apply)
  useEffect(() => {
    setUrlDraft(activeSlot?.url ?? "");
  }, [activeSlot?.url]);

  function applyUrl(raw: string) {
    const normalized = normalizeUrl(raw);
    setUrlDraft(normalized);
    setAllSlotsUrl(normalized);
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyUrl(urlDraft);
    }
    if (e.key === "Escape") {
      setUrlDraft(activeSlot?.url ?? "");
      (e.target as HTMLInputElement).blur();
    }
  }

  const updateInspectSnapshot = useCallback((slotId: string, data: InspectData) => {
    setInspectSnapshots((current) => ({ ...current, [slotId]: data }));
  }, []);

  const resetInspectHover = useCallback(() => {
    setInspectResetToken((current) => current + 1);
  }, []);

  const captureReport = useCallback(async () => {
    if (!activeSlot) return;
    window.clearTimeout(copyResetTimerRef.current);
    const lines = buildIssueReport({
      url: activeSlot.url,
      activeSlot,
      activeDevice: findDevice(activeSlot.deviceId),
      activeInspect,
      compareSlot,
      compareDevice: compareSlot ? findDevice(compareSlot.deviceId) : null,
      compareInspect,
      display,
      workbenchIssue,
    });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyButtonLabel("Copied");
      updateWorkbenchIssue((current) => ({
        ...current,
        lastCapturedAt: new Date().toISOString(),
      }));
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopyButtonLabel("Copy prompt");
      }, 5000);
    } catch {
      console.warn("Failed to copy report");
    }
  }, [activeInspect, activeSlot, compareInspect, compareSlot, display, findDevice, updateWorkbenchIssue, workbenchIssue]);

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
                  active={display.showStatusBar}
                  dark={dark}
                  icon={<Signal size={15} />}
                  onClick={() => updateDisplay((c) => ({ ...c, showStatusBar: !c.showStatusBar }))}
                >
                  Status bar
                </Toggle>
                <Toggle
                  active={display.showUrlBar}
                  dark={dark}
                  icon={<RectangleHorizontal size={15} />}
                  onClick={() => updateDisplay((c) => ({ ...c, showUrlBar: !c.showUrlBar }))}
                >
                  Browser chrome
                </Toggle>
                <Toggle
                  active={display.scrollSync}
                  dark={dark}
                  icon={<Link2 size={15} />}
                  onClick={() => {
                    resetInspectHover();
                    updateDisplay((c) => ({ ...c, scrollSync: !c.scrollSync }));
                  }}
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
                <Toggle
                  active={display.inspectMode}
                  dark={dark}
                  icon={<Crosshair size={15} />}
                  onClick={() => updateDisplay((c) => ({ ...c, inspectMode: !c.inspectMode }))}
                >
                  Inspect element
                </Toggle>
              </div>
            </div>

            {/* Workbench */}
            <div>
              <Label dark={dark}>Generate prompt for AI</Label>
              <div className="mt-1.5 space-y-1">
                <textarea
                  value={workbenchIssue.note}
                  onChange={(e) => updateWorkbenchIssue((current) => ({ ...current, note: e.target.value }))}
                  placeholder="Describe the issue for AI. This will copy with all device details; it does not show results here."
                  className={`min-h-[4.5rem] w-full resize-none rounded-md border px-2 py-1.5 text-[11px] outline-none transition ${
                    dark
                      ? "border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
                <div className={`relative rounded-md border ${dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
                  <select
                    value={workbenchIssue.compareSlotId}
                    onChange={(e) => updateWorkbenchIssue((current) => ({ ...current, compareSlotId: e.target.value }))}
                    className={`h-7 w-full appearance-none rounded-md bg-transparent px-3 pr-9 text-[11px] outline-none transition ${dark ? "text-white" : "text-slate-800"}`}
                  >
                    <option value="">Compare device</option>
                    {slots
                      .filter((slot) => slot.id !== activeSlotId)
                      .map((slot) => {
                        const device = findDevice(slot.deviceId);
                        return (
                          <option key={slot.id} value={slot.id}>
                            {device.name}
                          </option>
                        );
                      })}
                  </select>
                  <ChevronDown
                    size={13}
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void captureReport()}
                  className={`flex h-8 w-full items-center justify-center rounded-md border px-3 text-[12px] font-semibold transition ${
                    dark
                      ? "border-teal-400/30 bg-teal-400/10 text-teal-100 hover:bg-teal-400/15"
                      : "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100"
                  }`}
                >
                  {copyButtonLabel}
                </button>
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

        {/* ── Right pane: URL bar + preview canvas ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden max-[720px]:pl-10">

          {/* ── Global URL bar ── */}
          <div className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 ${dark ? "border-white/10 bg-[#151922]" : "border-black/[0.06] bg-white"}`}>
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => applyUrl(e.target.value)}
              placeholder="Enter URL…"
              spellCheck={false}
              className={`min-w-0 flex-1 rounded-lg border px-3 py-1.5 font-mono text-[12px] font-medium outline-none transition ${
                dark
                  ? "border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:bg-white/[0.08]"
                  : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
              }`}
            />
            <button
              type="button"
              onClick={() => applyUrl(urlDraft)}
              className={`h-8 shrink-0 rounded-lg px-3 text-[12px] font-black transition ${
                dark ? "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30" : "bg-teal-500 text-white hover:bg-teal-400"
              }`}
            >
              Go
            </button>
          </div>

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
                    compareTargetSlotId={compareSlot?.id}
                    compareSelector={activeInspect?.selector}
                    onInspectData={updateInspectSnapshot}
                    inspectResetToken={inspectResetToken}
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

function buildIssueReport({
  url,
  activeSlot,
  activeDevice,
  activeInspect,
  compareSlot,
  compareDevice,
  compareInspect,
  display,
  workbenchIssue,
}: {
  url: string;
  activeSlot: { id: string; deviceId: string; orientation: string; zoomMode: string; zoom: number; reloadToken: number; showFrame: boolean };
  activeDevice: { name: string; cssViewport: { width: number; height: number }; pixelRatio: number; type: string; os: string; brand: string } | null;
  activeInspect: InspectData | null;
  compareSlot: { id: string; deviceId: string } | null;
  compareDevice: { name: string; cssViewport: { width: number; height: number }; pixelRatio: number; type: string; os: string; brand: string } | null;
  compareInspect: InspectData | null;
  display: { scrollSync: boolean; darkMode: boolean; inspectMode: boolean; showUrlBar: boolean; showStatusBar: boolean; hideChrome: boolean; presentationMode: boolean };
  workbenchIssue: { note: string; compareSlotId: string; lastCapturedAt: string | null; lastCaptureLabel: string };
}) {
  const lines: string[] = [];
  lines.push(`# Multi Device Viewer Issue Report`);
  lines.push("");
  lines.push(`URL: ${url}`);
  lines.push(`Note: ${workbenchIssue.note || "Describe the issue here."}`);
  lines.push(`Compare device: ${compareDevice?.name ?? "None"}`);
  lines.push("");
  lines.push(`## Active device`);
  lines.push(`- Device: ${activeDevice?.name ?? "Unknown"}`);
  lines.push(`- Viewport: ${activeDevice ? `${activeDevice.cssViewport.width} x ${activeDevice.cssViewport.height}` : "Unknown"}`);
  lines.push(`- DPR: ${activeDevice?.pixelRatio ?? "Unknown"}`);
  lines.push(`- Orientation: ${activeSlot.orientation}`);
  lines.push(`- Zoom: ${activeSlot.zoomMode} (${activeSlot.zoom})`);
  lines.push(`- Chrome: ${display.showUrlBar ? "Visible" : "Hidden"}`);
  lines.push(`- Scroll sync: ${display.scrollSync ? "On" : "Off"}`);
  lines.push(`- Inspect mode: ${display.inspectMode ? "On" : "Off"}`);
  lines.push("");
  lines.push(`## Selected element`);
  if (activeInspect) {
    lines.push(`- Selector: ${activeInspect.selector}`);
    lines.push(`- Breadcrumb: ${activeInspect.breadcrumb}`);
    lines.push(`- Visibility: ${activeInspect.isVisibleInViewport ? "Visible" : `Hidden (${activeInspect.visibilityReason})`}`);
    lines.push(`- Size: ${Math.round(activeInspect.width)} x ${Math.round(activeInspect.height)}`);
    lines.push(`- Layout: ${activeInspect.display}, ${activeInspect.position}, overflow ${activeInspect.overflowX}/${activeInspect.overflowY}`);
    lines.push(`- Font: ${activeInspect.fontFamily}`);
    lines.push(`- Color: ${activeInspect.colorHex}`);
    lines.push(`- Background: ${activeInspect.backgroundColorHex}`);
    lines.push("");
    lines.push(`### Computed CSS`);
    lines.push("```css");
    lines.push(activeInspect.cssSnippet);
    lines.push("```");
  } else {
    lines.push(`- No inspected element captured yet.`);
  }
  lines.push("");
  lines.push(`## Compare device`);
  if (compareSlot && compareDevice) {
    lines.push(`- Device: ${compareDevice.name}`);
    lines.push(`- Viewport: ${compareDevice.cssViewport.width} x ${compareDevice.cssViewport.height}`);
    lines.push(`- DPR: ${compareDevice.pixelRatio}`);
    lines.push(`- Element selector: ${compareInspect?.selector ?? activeInspect?.selector ?? "Not captured"}`);
    if (compareInspect) {
      lines.push(`- Visibility: ${compareInspect.isVisibleInViewport ? "Visible" : `Hidden (${compareInspect.visibilityReason})`}`);
      lines.push(`- Size: ${Math.round(compareInspect.width)} x ${Math.round(compareInspect.height)}`);
    }
  } else {
    lines.push(`- No compare device selected.`);
  }
  lines.push("");
  lines.push(`## AI prompt`);
  lines.push(`Please inspect the selected element across devices, explain any responsive issue, and suggest the smallest code change that fixes it without breaking the layout.`);
  return lines;
}

function Toggle({ active, children, dark, icon, onClick }: { active: boolean; children: ReactNode; dark: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 w-full items-center gap-2 rounded-[8px] border px-2.5 text-[12px] font-semibold transition ${
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
