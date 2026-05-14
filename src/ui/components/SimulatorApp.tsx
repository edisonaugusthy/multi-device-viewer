import { Camera, PanelsTopLeft, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { captureNodeToPng, downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { PreviewCard } from "./PreviewCard";
import { AnnotationOverlay } from "./AnnotationOverlay";

export function SimulatorApp() {
  const { findDevice } = useDeviceCatalog();
  const { slots, display, activeSlotId, addSlot, reloadAllSlots, updateDisplay } = useSimulator();
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();



  async function captureComparison(download = true) {
    const board = document.querySelector("[data-capture-board]") as HTMLElement | null;
    if (!board) return undefined;
    try {
      const dataUrl = await captureNodeToPng(board);
      if (download) await downloadDataUrl(dataUrl, screenshotFilename("comparison-board"));
      return dataUrl;
    } catch {
      return undefined;
    }
  }

  async function openAnnotation() {
    const dataUrl = await captureComparison(false);
    setAnnotationImage(dataUrl);
    setAnnotationOpen(true);
  }

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
    <div className="flex h-screen overflow-hidden bg-[#f5f5f3]">

      {/* ── Left sidebar ── */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-black/[0.07] bg-white">
        {/* Logo / brand */}
        <div className="flex h-11 items-center border-b border-slate-100 px-4">
          <span className="text-[12px] font-black tracking-tight text-slate-800">Device Viewer</span>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3 pb-0">
          {/* Display */}
          <div>
            <Label>Display</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              <Toggle
                active={display.showStatusBar}
                onClick={() => updateDisplay({ ...display, showStatusBar: !display.showStatusBar })}
              >
                Status bar
              </Toggle>
              <Toggle
                active={display.showUrlBar}
                onClick={() => updateDisplay({ ...display, showUrlBar: !display.showUrlBar })}
              >
                Browser chrome
              </Toggle>
            </div>
          </div>

          {/* Devices */}
          <div>
            <Label>Devices</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              <SidebarBtn
                icon={<RotateCw size={14} />}
                onClick={() => reloadAllSlots()}
              >
                Reload all
              </SidebarBtn>
              {slots.length < 4 && (
                <SidebarBtn icon={<PanelsTopLeft size={14} />} onClick={() => addSlot()}>
                  Add device
                </SidebarBtn>
              )}
            </div>
          </div>

          {/* Capture */}
          <div>
            <Label>Capture</Label>
            <div className="mt-1.5 flex flex-col gap-1">
              <SidebarBtn icon={<Camera size={14} />} onClick={() => void captureComparison(true)}>
                Screenshot all
              </SidebarBtn>
            </div>
          </div>
        </div>

        {/* Close button — at the bottom of the sidebar */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => window.parent.postMessage({ type: "CLOSE_SIMULATOR" }, "*")}
            className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <X size={14} className="shrink-0" />
            Close viewer
          </button>
        </div>
      </aside>

      {/* ── Preview canvas (resizable panels) ── */}
      <main className="flex min-w-0 flex-1 overflow-hidden">
        <div
          ref={boardRef}
          data-capture-board
          className="flex h-full w-full"
        >
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              className="relative flex h-full min-w-0 flex-col overflow-hidden"
              style={{ width: `${widths[i] ?? 100 / slots.length}%`, flexShrink: 0, flexGrow: 0 }}
            >
              <PreviewCard
                slot={slot}
                device={findDevice(slot.deviceId)}
                display={display}
                removable={slots.length > 1}
                onAnnotate={() => void openAnnotation()}
              />
              {/* Drag handle — rendered on the right edge of every panel except the last */}
              {i < slots.length - 1 && (
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

      {annotationOpen && <AnnotationOverlay imageUrl={annotationImage} onClose={() => setAnnotationOpen(false)} />}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{children}</p>
  );
}

function SidebarBtn({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <span className="shrink-0 text-slate-500">{icon}</span>
      {children}
    </button>
  );
}

function Toggle({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
    >
      <span>{children}</span>
      {/* pill toggle */}
      <span className={`relative h-4 w-7 rounded-full transition-colors ${active ? "bg-slate-900" : "bg-slate-200"}`}>
        <span
          className={`absolute top-[2px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-[14px]" : "translate-x-[2px]"}`}
        />
      </span>
    </button>
  );
}
