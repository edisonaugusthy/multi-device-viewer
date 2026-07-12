import { ClipboardPaste, Eye, GripVertical, ImagePlus, Layers, Lock, Move, Pencil, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

export type ReferenceMode = "side-by-side" | "overlay";

export interface ReferenceViewport {
  id: string;
  label: string;
}

interface DesignReferencePanelProps {
  dark: boolean;
  viewports: ReferenceViewport[];
  activeViewportId: string;
  references: Record<string, string>;
  mode: ReferenceMode;
  opacity: number;
  adjustingOverlay: boolean;
  width: number;
  onActiveViewportChange: (id: string) => void;
  onReferenceChange: (id: string, image?: string) => void;
  onModeChange: (mode: ReferenceMode) => void;
  onOpacityChange: (opacity: number) => void;
  onAdjustingOverlayChange: (adjusting: boolean) => void;
  onResetOverlay: () => void;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onMarkFeedback: (image: string) => void;
}

export function DesignReferencePanel(props: DesignReferencePanelProps) {
  const { dark, viewports, activeViewportId, references, mode, opacity, adjustingOverlay, width, onActiveViewportChange, onReferenceChange, onModeChange, onOpacityChange, onAdjustingOverlayChange, onResetOverlay, onWidthChange, onClose, onMarkFeedback } = props;
  const [dragging, setDragging] = useState(false);
  const [referencePlacements, setReferencePlacements] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const referenceImage = references[activeViewportId];
  const referencePlacement = referencePlacements[activeViewportId] ?? { x: 0, y: 0, width: 100, height: 100 };

  function loadReference(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onReferenceChange(activeViewportId, reader.result);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));
      if (image) loadReference(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeViewportId]);

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    loadReference(Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/")));
  }

  function startPanelResize(event: React.PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = width;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      window.removeEventListener("blur", finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || (moveEvent.buttons & 1) !== 1) return finish();
      onWidthChange(Math.max(260, Math.min(Math.min(760, window.innerWidth - 340), startWidth + moveEvent.clientX - startX)));
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
    window.addEventListener("blur", finish);
    target.setPointerCapture(pointerId);
  }

  function updateReferencePlacement(next: { x: number; y: number; width: number; height: number }) {
    setReferencePlacements((current) => ({ ...current, [activeViewportId]: next }));
  }

  function scaleReference(delta: number) {
    const width = Math.max(5, Math.min(600, referencePlacement.width + delta));
    const height = Math.max(5, Math.min(600, referencePlacement.height + delta));
    updateReferencePlacement({
      x: referencePlacement.x - (width - referencePlacement.width) / 2,
      y: referencePlacement.y - (height - referencePlacement.height) / 2,
      width,
      height,
    });
  }

  function startReferenceAdjustment(event: React.PointerEvent, kind: "move" | "width" | "height" | "both") {
    if (!referenceImage || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    const canvas = target.closest("[data-reference-canvas]")?.getBoundingClientRect();
    if (!canvas) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = referencePlacement;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      window.removeEventListener("blur", finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || (moveEvent.buttons & 1) !== 1) return finish();
      const deltaX = ((moveEvent.clientX - startX) / canvas.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / canvas.height) * 100;
      if (kind === "move") {
        updateReferencePlacement({ ...initial, x: Math.max(-initial.width + 5, Math.min(95, initial.x + deltaX)), y: Math.max(-initial.height + 5, Math.min(95, initial.y + deltaY)) });
      } else {
        updateReferencePlacement({
          ...initial,
          width: kind === "width" || kind === "both" ? Math.max(5, Math.min(600, initial.width + deltaX)) : initial.width,
          height: kind === "height" || kind === "both" ? Math.max(5, Math.min(600, initial.height + deltaY)) : initial.height,
        });
      }
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
    window.addEventListener("blur", finish);
    target.setPointerCapture(pointerId);
  }

  return (
    <aside style={{ width }} className={`relative flex shrink-0 flex-col border-r ${dark ? "border-white/10 bg-[#101217] text-white" : "border-slate-200 bg-[#f8fafc] text-slate-900"}`} aria-label="Design reference">
      <div role="separator" aria-label="Resize design reference panel" aria-orientation="vertical" onPointerDown={startPanelResize} className="group absolute -right-2 inset-y-0 z-50 w-4 cursor-col-resize touch-none"><span className={`absolute inset-y-0 left-1/2 w-px group-hover:bg-[#0f9f8f] ${dark ? "bg-white/10" : "bg-slate-200"}`} /><span className={`absolute left-1/2 top-1/2 grid h-10 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-sm group-hover:border-[#0f9f8f] group-hover:bg-[#0f9f8f] group-hover:text-white ${dark ? "border-white/20 bg-[#1a1e27] text-slate-400" : "border-slate-300 bg-white text-slate-500"}`}><GripVertical size={13} /></span></div>
      <header className={`flex h-11 shrink-0 items-center gap-2 border-b px-3 ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div className="min-w-0"><h2 className="text-[11px] font-extrabold">Design reference</h2><p className={`truncate text-[9px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Match the intended design against the live page.</p></div>
        <button type="button" onClick={onClose} aria-label="Close design reference" className={`ml-auto grid h-8 w-8 place-items-center rounded-lg ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}><X size={15} /></button>
      </header>

      <div className="flex gap-1 overflow-x-auto px-3 pt-3" aria-label="Reference viewport">
        {viewports.map((viewport) => <button key={viewport.id} type="button" onClick={() => onActiveViewportChange(viewport.id)} className={`h-7 shrink-0 rounded-md px-2 text-[9px] font-bold ${activeViewportId === viewport.id ? "bg-[#0f9f8f] text-white" : dark ? "bg-white/[0.06] text-slate-400" : "bg-white text-slate-500"}`}>{viewport.label}{references[viewport.id] ? " •" : ""}</button>)}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={() => fileInput.current?.click()} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold ${dark ? "border-white/10 hover:bg-white/[0.05]" : "border-slate-200 bg-white hover:bg-slate-50"}`}><ImagePlus size={14} />{referenceImage ? "Replace design" : "Choose design"}</button>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => loadReference(event.target.files?.[0])} />
        <button type="button" disabled={!referenceImage} onClick={() => referenceImage && onMarkFeedback(referenceImage)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-35 ${dark ? "border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Pencil size={14} />Mark feedback</button>
        {referenceImage && <button type="button" onClick={() => onReferenceChange(activeViewportId)} className={`h-9 rounded-lg px-2 text-[10px] font-bold ${dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>Remove</button>}
      </div>

      {referenceImage && <div className="flex items-center gap-2 px-3 pb-3">
        <div className={`flex rounded-lg border p-0.5 ${dark ? "border-white/10" : "border-slate-200 bg-white"}`}>
          <button type="button" onClick={() => onModeChange("side-by-side")} className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[9px] font-bold ${mode === "side-by-side" ? "bg-[#0f9f8f] text-white" : dark ? "text-slate-400" : "text-slate-500"}`}><Eye size={12} />Side by side</button>
          <button type="button" onClick={() => { onModeChange("overlay"); onAdjustingOverlayChange(true); }} className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[9px] font-bold ${mode === "overlay" ? "bg-[#0f9f8f] text-white" : dark ? "text-slate-400" : "text-slate-500"}`}><Layers size={12} />Overlay</button>
        </div>
        {mode === "overlay" && <label className="flex min-w-0 flex-1 items-center gap-2 text-[9px] font-bold"><span>Opacity</span><input aria-label="Design overlay opacity" type="range" min="10" max="90" value={opacity} onChange={(event) => onOpacityChange(Number(event.target.value))} className="min-w-20 flex-1 accent-[#0f9f8f]" /><span>{opacity}%</span></label>}
      </div>}

      {referenceImage && <div className="flex items-center gap-1 px-3 pb-3" aria-label="Design reference zoom">
        <button type="button" aria-label="Zoom design out" onClick={() => scaleReference(-25)} className={`grid h-8 w-8 place-items-center rounded-lg border ${dark ? "border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}><ZoomOut size={14} /></button>
        <span className={`w-12 text-center text-[9px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>Scale</span>
        <button type="button" aria-label="Zoom design in" onClick={() => scaleReference(25)} className={`grid h-8 w-8 place-items-center rounded-lg border ${dark ? "border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}><ZoomIn size={14} /></button>
        <button type="button" onClick={() => updateReferencePlacement({ x: 0, y: 0, width: 100, height: 100 })} className={`ml-1 h-8 rounded-lg px-2 text-[9px] font-bold ${dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>Reset</button>
        <span className={`ml-auto text-[9px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Drag or resize image</span>
      </div>}

      {referenceImage && mode === "overlay" && <div className="flex items-center gap-2 px-3 pb-3">
        <button type="button" aria-pressed={adjustingOverlay} onClick={() => onAdjustingOverlayChange(true)} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-bold ${adjustingOverlay ? "bg-amber-500 text-white" : dark ? "border border-white/10 text-slate-300" : "border border-slate-200 bg-white text-slate-600"}`}><Move size={12} />Adjust overlay</button>
        <button type="button" aria-pressed={!adjustingOverlay} onClick={() => onAdjustingOverlayChange(false)} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[9px] font-bold ${!adjustingOverlay ? dark ? "border-teal-500/50 bg-teal-500/15 text-teal-300" : "border-teal-200 bg-teal-50 text-teal-700" : dark ? "border-white/10 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}><Lock size={12} />Lock & use page</button>
        <button type="button" onClick={onResetOverlay} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-bold ${dark ? "text-slate-400 hover:bg-white/[0.05]" : "text-slate-500 hover:bg-white"}`}><RotateCcw size={12} />Reset fit</button>
      </div>}
      {referenceImage && mode === "overlay" && <p className={`px-3 pb-3 text-[9px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{adjustingOverlay ? "Adjust mode captures dragging. Lock the overlay when you want to scroll, click, and type in the live page." : "Overlay is locked. You can now scroll, click, and type in the live page underneath."}</p>}

      <div className="min-h-0 flex-1 p-3 pt-0">
        <div data-reference-canvas onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={`relative grid h-full touch-none place-items-center overflow-hidden rounded-xl border-2 border-dashed transition ${dragging ? "border-[#0f9f8f] bg-[#0f9f8f]/10" : dark ? "border-white/10 bg-[#07090d]" : "border-slate-200 bg-white"}`} aria-label={referenceImage ? "Adjust design reference preview" : undefined}>
          {referenceImage ? <div className="absolute cursor-move select-none border-2 border-sky-400 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" style={{ left: `${referencePlacement.x}%`, top: `${referencePlacement.y}%`, width: `${referencePlacement.width}%`, height: `${referencePlacement.height}%` }} onPointerDown={(event) => startReferenceAdjustment(event, "move")}><img src={referenceImage} alt="Imported design reference" draggable={false} className="block h-full w-full" /><button type="button" aria-label="Resize reference width" onPointerDown={(event) => startReferenceAdjustment(event, "width")} className="absolute -right-2 top-1/2 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-sky-500 shadow" /><button type="button" aria-label="Resize reference height" onPointerDown={(event) => startReferenceAdjustment(event, "height")} className="absolute -bottom-2 left-1/2 h-4 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-sky-500 shadow" /><button type="button" aria-label="Resize reference width and height" onPointerDown={(event) => startReferenceAdjustment(event, "both")} className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-sky-500 shadow" /></div> : <button type="button" onClick={() => fileInput.current?.click()} className="max-w-72 p-6 text-center"><ClipboardPaste className={`mx-auto ${dark ? "text-slate-700" : "text-slate-300"}`} size={30} /><p className="mt-3 text-xs font-extrabold">Drop, paste, or choose a design</p><p className={`mt-1 text-[10px] leading-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>Use a PNG, JPG, WebP, or SVG exported from Figma or another design tool. It stays on this device.</p></button>}
        </div>
      </div>
    </aside>
  );
}
