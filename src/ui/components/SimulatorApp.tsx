import { Camera, Check, Link2, LayoutGrid, Moon, PanelLeftClose, PanelLeftOpen, PanelsTopLeft, RectangleHorizontal, RotateCw, Signal, Sun, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { captureTabWithOverlay } from "../../domain/capture/capture-service";
import { PreviewCard } from "./PreviewCard";
import { AnnotationOverlay } from "./AnnotationOverlay";

export function SimulatorApp() {
  const { findDevice } = useDeviceCatalog();
  const { slots, display, activeSlotId, addSlot, applyDevicePreset, reloadAllSlots, updateDisplay } = useSimulator();
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [capturing, setCapturing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window === "undefined" ? true : window.innerWidth > 720
  ));
  const [narrowLayout, setNarrowLayout] = useState(() => (
    typeof window === "undefined" ? false : window.innerWidth <= 720
  ));

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

  // ── Resizable panel widths (percentages, always sum to 100) ──────────────
  const [widths, setWidths] = useState<number[]>(() =>
    slots.map(() => 100 / slots.length)
  );
  // Keep widths in sync when slots are added/removed
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
      const minPct = (120 / totalW) * 100; // 120px minimum panel
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

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${display.darkMode ? "bg-[#111318]" : "bg-[#f5f5f3]"}`}>

      {/* ── Left sidebar ── */}
      <aside
          className={`flex shrink-0 flex-col border-r transition-all duration-200 max-[720px]:absolute max-[720px]:inset-y-0 max-[720px]:left-0 max-[720px]:z-30 max-[720px]:shadow-2xl ${
            display.darkMode ? "border-white/10 bg-[#151922]" : "border-black/[0.07] bg-white"
          } ${sidebarOpen ? "w-64" : "w-10"}`}
        >
        {/* Logo / brand + toggle */}
        <div className={`flex h-12 shrink-0 items-center gap-1 border-b px-2 ${display.darkMode ? "border-white/10" : "border-slate-100"}`}>
          {sidebarOpen && (
            <span className={`flex-1 pl-2 text-[13px] font-black tracking-tight ${display.darkMode ? "text-white" : "text-slate-800"}`}>Device Viewer</span>
          )}
          <button
            type="button"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setSidebarOpen((v) => !v)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
              display.darkMode ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        <div className={`flex flex-1 flex-col gap-5 overflow-y-auto p-3.5 pb-0 ${sidebarOpen ? "" : "hidden"}`}>
          {/* Display */}
          <div>
            <Label dark={display.darkMode}>Display</Label>
            <div className="mt-2 flex flex-col gap-2">
              <Toggle
                active={display.showStatusBar}
                dark={display.darkMode}
                icon={<Signal size={15} />}
                onClick={() => updateDisplay((current) => ({ ...current, showStatusBar: !current.showStatusBar }))}
              >
                Status bar
              </Toggle>
              <Toggle
                active={display.showUrlBar}
                dark={display.darkMode}
                icon={<RectangleHorizontal size={15} />}
                onClick={() => updateDisplay((current) => ({ ...current, showUrlBar: !current.showUrlBar }))}
              >
                Browser chrome
              </Toggle>
              <Toggle
                active={display.scrollSync}
                dark={display.darkMode}
                icon={<Link2 size={15} />}
                onClick={() => updateDisplay((current) => ({ ...current, scrollSync: !current.scrollSync }))}
              >
                Scroll sync
              </Toggle>
              <Toggle
                active={display.darkMode}
                dark={display.darkMode}
                icon={display.darkMode ? <Moon size={15} /> : <Sun size={15} />}
                onClick={() => updateDisplay((current) => ({ ...current, darkMode: !current.darkMode }))}
              >
                Dark mode
              </Toggle>
            </div>
          </div>

          {/* Devices */}
          <div>
            <Label dark={display.darkMode}>Devices</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              <SidebarBtn
                dark={display.darkMode}
                icon={<RotateCw size={14} />}
                onClick={() => reloadAllSlots()}
              >
                Reload all
              </SidebarBtn>
              {slots.length < 4 && (
                <SidebarBtn dark={display.darkMode} icon={<PanelsTopLeft size={14} />} onClick={() => addSlot()}>
                  Add device
                </SidebarBtn>
              )}
            </div>
          </div>

          {/* Layout presets */}
          <div>
            <Label dark={display.darkMode}>Presets</Label>
            <div className="mt-1.5 grid grid-cols-1 gap-1">
              <SidebarBtn
                dark={display.darkMode}
                icon={<LayoutGrid size={14} />}
                onClick={() => applyDevicePreset(["apple-iphone-14-pro-max-2022", "apple-ipad-air-4"])}
              >
                Mobile vs Tablet
              </SidebarBtn>
              <SidebarBtn
                dark={display.darkMode}
                icon={<LayoutGrid size={14} />}
                onClick={() => applyDevicePreset(["apple-iphone-14-pro-max-2022", "samsung-galaxy-s24"])}
              >
                iOS standard vs Android
              </SidebarBtn>
              <SidebarBtn
                dark={display.darkMode}
                icon={<LayoutGrid size={14} />}
                onClick={() => applyDevicePreset(["samsung-galaxy-s24", "apple-ipad-air-4", "macbook-air-2020-13"])}
              >
                Android + iOS tablet + laptop
              </SidebarBtn>
            </div>
          </div>

          {/* Capture */}
          <div>
            <Label dark={display.darkMode}>Capture</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              <SidebarBtn dark={display.darkMode} icon={<Camera size={14} />} onClick={() => void takeScreenshot()} disabled={capturing}>
                {capturing ? "Capturing…" : "Capture & Annotate"}
              </SidebarBtn>
            </div>
          </div>
        </div>

        {/* Close button — at the bottom of the sidebar */}
        <div className={`shrink-0 border-t p-3 ${display.darkMode ? "border-white/10" : "border-slate-100"} ${sidebarOpen ? "" : "hidden"}`}>
          <button
            type="button"
            onClick={() => window.parent.postMessage({ type: "CLOSE_SIMULATOR" }, "*")}
            className={`flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition ${
              display.darkMode ? "text-slate-300 hover:bg-red-500/10 hover:text-red-200" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <X size={14} className="shrink-0" />
            Close viewer
          </button>
        </div>
      </aside>

      {/* ── Preview canvas (resizable panels) ── */}
      <main className="flex min-w-0 flex-1 overflow-hidden max-[720px]:pl-10">
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
              {/* Drag handle — rendered on the right edge of every panel except the last */}
              {i < slots.length - 1 && !narrowLayout && (
                <div
                  className="group absolute right-0 top-0 z-10 flex h-full w-[9px] cursor-col-resize flex-col items-center justify-center"
                  onMouseDown={(e) => startResize(e, i)}
                >
                  {/* Divider line */}
                  <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-black/[0.07] transition-all group-hover:w-[2px] group-hover:bg-slate-400/70" />
                  {/* Grip pill — three dots centered vertically */}
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

      {annotationOpen && <AnnotationOverlay imageUrl={annotationImage} meta={captureMeta} onClose={() => setAnnotationOpen(false)} />}
    </div>
  );
}

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
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        dark ? "text-slate-200 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={`shrink-0 ${dark ? "text-slate-400" : "text-slate-500"}`}>{icon}</span>
      {children}
    </button>
  );
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
