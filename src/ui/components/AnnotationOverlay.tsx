import { ArrowUpRight, Check, Clipboard, Crop, Download, Pencil, Square, Type, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "pen" | "rect" | "arrow" | "text" | "crop";

interface Pt { x: number; y: number; }

interface PenMark   { kind: "pen";   color: string; width: number; points: Pt[]; }
interface RectMark  { kind: "rect";  color: string; width: number; start: Pt; end: Pt; }
interface ArrowMark { kind: "arrow"; color: string; width: number; start: Pt; end: Pt; }
interface TextMark  { kind: "text";  color: string; size: number;  pos: Pt; text: string; }

type Mark = PenMark | RectMark | ArrowMark | TextMark;

interface CropRect { x: number; y: number; w: number; h: number; } // normalised 0-1

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#111827", "#ffffff"];
const WIDTHS = [2, 4, 7];
const FONT_SIZES = [12, 16, 20, 28, 40];

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnotationOverlay({ imageUrl, onClose }: { imageUrl?: string; onClose: () => void }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const marksRef     = useRef<Mark[]>([]);
  const draftRef     = useRef<Mark | null>(null);

  const [tool,      setTool]      = useState<Tool>("pen");
  const [color,     setColor]     = useState(COLORS[4]);
  const [lineWidth, setLineWidth] = useState(WIDTHS[1]);
  const [fontSize,  setFontSize]  = useState(FONT_SIZES[1]);
  const [marks,     setMarks]     = useState<Mark[]>([]);
  const [draft,     setDraft]     = useState<Mark | null>(null);
  const [textPos,   setTextPos]   = useState<Pt | null>(null);
  const [textInput, setTextInput] = useState("");
  const [copied,    setCopied]    = useState(false);
  const [imgReady,  setImgReady]  = useState(false);
  // Crop
  const [cropDraft, setCropDraft] = useState<{ start: Pt; end: Pt } | null>(null);
  const [cropRect,  setCropRect]  = useState<CropRect | null>(null);
  const cropDraftRef = useRef<{ start: Pt; end: Pt } | null>(null);
  const cropRectRef  = useRef<CropRect | null>(null);
  useEffect(() => { cropDraftRef.current = cropDraft; }, [cropDraft]);
  useEffect(() => { cropRectRef.current  = cropRect;  }, [cropRect]);

  // Keep refs in sync for use inside event handlers without stale closures
  useEffect(() => { marksRef.current = marks; }, [marks]);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // ── Load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imageUrl) return;
    setImgReady(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Size the canvas to natural image pixels immediately
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setImgReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Redraw whenever image / marks / draft / crop change ───────────────────
  useEffect(() => {
    redraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgReady, marks, draft, cropDraft, cropRect]);

  function redraw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f5f5f3";
    ctx.fillRect(0, 0, W, H);
    if (img) ctx.drawImage(img, 0, 0, W, H);
    for (const m of marksRef.current) paintMark(ctx, m, W, H);
    if (draftRef.current) paintMark(ctx, draftRef.current, W, H);

    // Draw crop overlay: dim outside, dashed border inside
    const cd = cropDraftRef.current;
    const cr = cropRectRef.current;
    const sel = cd
      ? normRect(cd.start, cd.end)
      : cr ? cr : null;
    if (sel) {
      const sx = sel.x * W, sy = sel.y * H, sw = sel.w * W, sh = sel.h * H;
      // Dim outside
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0,  0,  W,  sy);           // top
      ctx.fillRect(0,  sy, sx, sh);           // left
      ctx.fillRect(sx + sw, sy, W - sx - sw, sh); // right
      ctx.fillRect(0,  sy + sh, W, H - sy - sh);  // bottom
      // Selection border
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
      // Corner handles
      const hs = 6;
      ctx.fillStyle = "#fff";
      [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]].forEach(([hx, hy]) => {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
      });
    }
  }

  function normRect(a: Pt, b: Pt): CropRect {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    };
  }

  // ── Focus textarea when text pos is set ───────────────────────────────────
  useEffect(() => {
    if (textPos) setTimeout(() => textareaRef.current?.focus(), 0);
  }, [textPos]);

  // ── Pointer helpers ────────────────────────────────────────────────────────
  function toPt(e: React.PointerEvent): Pt {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top)  / r.height,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (tool === "text") {
      if (textPos && textInput.trim()) commitText();
      setTextPos(toPt(e));
      setTextInput("");
      return;
    }
    if (tool === "crop") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const pt = toPt(e);
      setCropDraft({ start: pt, end: pt });
      setCropRect(null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toPt(e);
    const newDraft: Mark =
      tool === "pen"   ? { kind: "pen",   color, width: lineWidth, points: [pt] } :
      tool === "rect"  ? { kind: "rect",  color, width: lineWidth, start: pt, end: pt } :
                         { kind: "arrow", color, width: lineWidth, start: pt, end: pt };
    setDraft(newDraft);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (tool === "crop" && cropDraft) {
      setCropDraft((d) => d ? { ...d, end: toPt(e) } : d);
      return;
    }
    if (!draft) return;
    const pt = toPt(e);
    if (draft.kind === "pen")                    setDraft({ ...draft, points: [...draft.points, pt] });
    if (draft.kind === "rect" || draft.kind === "arrow") setDraft({ ...draft, end: pt });
  }

  function onPointerUp() {
    if (tool === "crop" && cropDraft) {
      const r = normRect(cropDraft.start, cropDraft.end);
      if (r.w > 0.01 && r.h > 0.01) setCropRect(r);
      setCropDraft(null);
      return;
    }
    if (!draft) return;
    if (draft.kind === "pen" && draft.points.length < 2) { setDraft(null); return; }
    setMarks((prev) => [...prev, draft]);
    setDraft(null);
  }

  function commitText() {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(""); return; }
    setMarks((prev) => [...prev, { kind: "text", color, size: fontSize, pos: textPos, text: textInput.trim() }]);
    setTextPos(null);
    setTextInput("");
  }

  function undo() {
    if (textPos) { setTextPos(null); setTextInput(""); return; }
    if (cropRect) { setCropRect(null); return; }
    setMarks((prev) => prev.slice(0, -1));
  }

  function applyCrop() {
    if (!cropRect || !imgReady) return;
    const canvas = canvasRef.current!;
    const W = canvas.width;
    const H = canvas.height;
    const sx = Math.round(cropRect.x * W);
    const sy = Math.round(cropRect.y * H);
    const sw = Math.round(cropRect.w * W);
    const sh = Math.round(cropRect.h * H);

    // 1. Composite current canvas (image + marks) into a temp canvas at crop size
    const tmp = document.createElement("canvas");
    tmp.width  = sw;
    tmp.height = sh;
    tmp.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    // 2. Get the cropped dataUrl synchronously
    const croppedDataUrl = tmp.toDataURL("image/png");

    // 3. Update imgRef SYNCHRONOUSLY before any state change triggers redraw.
    //    A data: URL image is already decoded — assign src then set the ref
    //    immediately so the next redraw uses the correct image.
    const newImg = new Image();
    newImg.src = croppedDataUrl;
    imgRef.current = newImg; // set immediately — data URL is available at once

    // 4. Resize the main canvas and draw the cropped result
    canvas.width  = sw;
    canvas.height = sh;
    canvas.getContext("2d")!.drawImage(tmp, 0, 0);

    // 5. Reset state — these trigger redraw(), which now uses the updated imgRef
    marksRef.current = [];
    cropRectRef.current  = null;
    cropDraftRef.current = null;
    setCropRect(null);
    setCropDraft(null);
    setMarks([]);
    setTool("pen");
  }

  function cancelCrop() {
    setCropRect(null);
    setCropDraft(null);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportPng(): string {
    return canvasRef.current!.toDataURL("image/png");
  }

  async function copyImage() {
    if (!imgReady) return;
    const dataUrl = exportPng();

    // The Clipboard API is blocked by Permissions Policy inside the extension
    // iframe. Route the write through the content script (page context) via
    // postMessage, which has clipboard access.
    const ok = await new Promise<boolean>((resolve) => {
      const onResult = (e: MessageEvent) => {
        if (e.data?.type === "COPY_IMAGE_RESULT") {
          window.removeEventListener("message", onResult);
          resolve(!!e.data.ok);
        }
      };
      window.addEventListener("message", onResult);
      // Post to parent content script
      window.parent.postMessage({ type: "COPY_IMAGE", dataUrl }, "*");
      // Timeout fallback after 4s
      setTimeout(() => {
        window.removeEventListener("message", onResult);
        resolve(false);
      }, 4000);
    });

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      // Clipboard failed — fall back to download so the user still gets the image
      await downloadDataUrl(dataUrl, screenshotFilename("annotated"));
    }
  }

  async function downloadImage() {
    if (!imgReady) return;
    await downloadDataUrl(exportPng(), screenshotFilename("annotated"));
  }

  const cursor =
    tool === "text" ? "text" :
    tool === "crop" ? "crosshair" : "crosshair";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#f5f5f3]">

      {/* ── Toolbar ── */}
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-black/[0.07] bg-white px-4 shadow-sm">

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          <ToolBtn active={tool === "pen"}   title="Pen"   onClick={() => { setTool("pen");   cancelCrop(); }}><Pencil size={14} /></ToolBtn>
          <ToolBtn active={tool === "rect"}  title="Box"   onClick={() => { setTool("rect");  cancelCrop(); }}><Square size={14} /></ToolBtn>
          <ToolBtn active={tool === "arrow"} title="Arrow" onClick={() => { setTool("arrow"); cancelCrop(); }}><ArrowUpRight size={14} /></ToolBtn>
          <ToolBtn active={tool === "text"}  title="Text"  onClick={() => { setTool("text");  cancelCrop(); }}><Type size={14} /></ToolBtn>
          <ToolBtn active={tool === "crop"}  title="Crop"  onClick={() => { setTool("crop");  setCropRect(null); }}><Crop size={14} /></ToolBtn>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Color swatches */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setColor(c)}
              className="h-[18px] w-[18px] shrink-0 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                outline: color === c ? "2px solid #3b82f6" : "2px solid transparent",
                outlineOffset: "1.5px",
                boxShadow: c === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)" : undefined,
              }}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {WIDTHS.map((w) => (
            <button
              key={w}
              title={`Size ${w}`}
              onClick={() => setLineWidth(w)}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition ${lineWidth === w ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <span className="rounded-full bg-current" style={{ width: w * 2.2, height: w * 2.2, display: "block" }} />
            </button>
          ))}
        </div>

        {/* Font size — only when text tool is active */}
        {tool === "text" && (
          <>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-slate-400 select-none pr-0.5">A</span>
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  title={`Font size ${s}`}
                  onClick={() => setFontSize(s)}
                  className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1 text-[11px] font-semibold transition ${fontSize === s ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="h-5 w-px bg-slate-200" />

        {/* Undo */}
        <button
          title="Undo"
          onClick={undo}
          disabled={marks.length === 0 && !textPos}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
        >
          <Undo2 size={14} />
        </button>

        <div className="flex-1" />

        {/* Copy & Download */}
        <button
          onClick={() => void copyImage()}
          disabled={!imgReady}
          className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Clipboard size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => void downloadImage()}
          disabled={!imgReady}
          className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[12px] font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          <Download size={13} />
          Download
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <button onClick={onClose} title="Close" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-800">
          <X size={15} />
        </button>
      </div>

      {/* ── Crop confirm bar ── */}
      {tool === "crop" && cropRect && (
        <div className="flex h-10 shrink-0 items-center justify-center gap-2 border-b border-black/[0.07] bg-amber-50">
          <span className="text-[12px] font-medium text-amber-700">Crop to selection?</span>
          <button
            onClick={applyCrop}
            className="flex h-7 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[12px] font-semibold text-white transition hover:bg-slate-700"
          >
            <Check size={12} /> Apply crop
          </button>
          <button
            onClick={cancelCrop}
            className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <X size={12} /> Cancel
          </button>
        </div>
      )}

      {/* ── Canvas area ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-8">
        <div className="relative inline-block rounded-xl shadow-[0_4px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "calc(100vh - 120px)",
              cursor,
              borderRadius: 12,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDraft(null)}
          />

          {/* Floating textarea for text tool */}
          {tool === "text" && textPos && (
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); }
                if (e.key === "Escape") { setTextPos(null); setTextInput(""); }
              }}
              onBlur={commitText}
              placeholder="Type here…"
              rows={1}
              style={{
                position: "absolute",
                left: `${textPos.x * 100}%`,
                top:  `${textPos.y * 100}%`,
                color,
                fontSize,
                background: "rgba(255,255,255,0.85)",
                border: `2px dashed ${color}`,
                borderRadius: 4,
                padding: "2px 6px",
                minWidth: 100,
                resize: "none",
                outline: "none",
                lineHeight: 1.4,
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}
            />
          )}

          {!imgReady && !imageUrl && (
            <div className="flex h-[500px] w-[800px] items-center justify-center rounded-xl bg-white text-slate-400">
              <span className="text-sm">No screenshot available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({ active, title, onClick, children }: { active: boolean; title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
    >
      {children}
    </button>
  );
}

// ─── Canvas paint ─────────────────────────────────────────────────────────────

function paintMark(ctx: CanvasRenderingContext2D, mark: Mark, W: number, H: number) {
  if (mark.kind === "text") {
    ctx.save();
    ctx.fillStyle = mark.color;
    ctx.font = `600 ${mark.size}px -apple-system, system-ui, sans-serif`;
    ctx.fillText(mark.text, mark.pos.x * W, mark.pos.y * H);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.strokeStyle = mark.color;
  ctx.lineWidth   = mark.width;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  if (mark.kind === "pen") {
    ctx.beginPath();
    mark.points.forEach((p, i) => {
      const x = p.x * W, y = p.y * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  } else if (mark.kind === "rect") {
    const x = Math.min(mark.start.x, mark.end.x) * W;
    const y = Math.min(mark.start.y, mark.end.y) * H;
    const w = Math.abs(mark.end.x - mark.start.x) * W;
    const h = Math.abs(mark.end.y - mark.start.y) * H;
    ctx.fillStyle = mark.color + "22";
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  } else if (mark.kind === "arrow") {
    const x1 = mark.start.x * W, y1 = mark.start.y * H;
    const x2 = mark.end.x   * W, y2 = mark.end.y   * H;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head  = Math.max(12, mark.width * 5);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = mark.color;
    ctx.fill();
  }

  ctx.restore();
}
