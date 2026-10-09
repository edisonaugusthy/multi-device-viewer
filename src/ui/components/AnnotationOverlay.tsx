import { useEffect, useRef, useState, type ReactNode } from "react";
import { downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { useI18n } from "../../app/i18n";
import { ArrowToolIcon, BackIcon, CheckIcon, CloseIcon, CopyIcon, CropIcon, DownloadIcon, FixPromptIcon, PencilIcon, RectangleIcon, TextToolIcon, UndoIcon } from "../icons";
import { FixPromptForm, type FixPromptDevice } from "./FixPrompt";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "pen" | "rect" | "arrow" | "text" | "crop";

interface Pt { x: number; y: number; }

interface PenMark   { kind: "pen";   color: string; width: number; points: Pt[]; }
interface RectMark  { kind: "rect";  color: string; width: number; start: Pt; end: Pt; }
interface ArrowMark { kind: "arrow"; color: string; width: number; start: Pt; end: Pt; }
interface TextMark  { kind: "text";  color: string; size: number;  pos: Pt; text: string; }

type Mark = PenMark | RectMark | ArrowMark | TextMark;

interface CropRect { x: number; y: number; w: number; h: number; } // normalised 0-1
interface CaptureMeta {
  title: string;
  url: string;
  devices: string[];
  includeBanner?: boolean;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#111827", "#ffffff"];
const WIDTHS = [2, 4, 7];
const FONT_SIZES = [12, 16, 20, 28, 40];

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnotationOverlay({ imageUrl, meta, fixPrompt, onClose }: {
  imageUrl?: string;
  meta?: CaptureMeta;
  fixPrompt?: { pageUrl: string; devices: FixPromptDevice[] };
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [showFix, setShowFix] = useState(Boolean(fixPrompt));
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
    // Keep transparent pixels (a device cutout) transparent in the export.
    ctx.clearRect(0, 0, W, H);
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
    const source = canvasRef.current!;
    if (!meta || meta.includeBanner === false) return source.toDataURL("image/png");

    const headerH = 112;
    const pad = 28;
    const output = document.createElement("canvas");
    output.width = source.width;
    output.height = source.height + headerH;
    const ctx = output.getContext("2d")!;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, output.width, headerH);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH - 0.5);
    ctx.lineTo(output.width, headerH - 0.5);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(meta.title, pad, 36);

    ctx.fillStyle = "#475569";
    ctx.font = "500 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(truncateText(ctx, meta.url, output.width - pad * 2), pad, 62);

    ctx.fillStyle = "#64748b";
    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    const deviceText = meta.devices.join("  |  ");
    ctx.fillText(truncateText(ctx, deviceText, output.width - pad * 2), pad, 88);

    ctx.textAlign = "right";
    ctx.fillText(new Date().toLocaleString(), output.width - pad, 36);
    ctx.textAlign = "left";

    ctx.drawImage(source, 0, headerH);
    return output.toDataURL("image/png");
  }

  async function copyImage() {
    if (!imgReady) return;
    const dataUrl = exportPng();

    let ok = false;
    try {
      // Direct user action in the top-level viewer preserves clipboard activation.
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      ok = true;
    } catch { /* The download fallback remains available on restricted pages. */ }

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

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-stage text-ink">

      {/* ── Toolbar ── */}
      <div className="flex min-h-[52px] shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <button type="button" onClick={onClose} className="flex h-[34px] items-center gap-1.5 rounded-[9px] border border-line pe-2.5 ps-2 text-[13px] font-semibold text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent">
          <BackIcon size={15} />{t("workspace")}
        </button>

        <div className="flex min-w-0 flex-1 justify-center">
          <div role="toolbar" aria-label={t("annotate")} className="flex h-10 items-center gap-0.5 rounded-[11px] border border-line-soft bg-field px-1.5">
            <ToolBtn active={tool === "pen"}   title={t("pen")}   onClick={() => { setTool("pen");   cancelCrop(); }}><PencilIcon size={17} /></ToolBtn>
            <ToolBtn active={tool === "rect"}  title={t("box")}   onClick={() => { setTool("rect");  cancelCrop(); }}><RectangleIcon size={17} /></ToolBtn>
            <ToolBtn active={tool === "arrow"} title={t("arrow")} onClick={() => { setTool("arrow"); cancelCrop(); }}><ArrowToolIcon size={17} /></ToolBtn>
            <ToolBtn active={tool === "text"}  title={t("text")}  onClick={() => { setTool("text");  cancelCrop(); }}><TextToolIcon size={17} /></ToolBtn>
            <ToolBtn active={tool === "crop"}  title={t("crop")}  onClick={() => { setTool("crop");  setCropRect(null); }}><CropIcon size={17} /></ToolBtn>
            <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-line" />
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={c}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`mx-[3px] size-5 shrink-0 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-offset-2 ring-offset-field" : ""} ${c === "#ffffff" ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" : ""}`}
                style={{ background: c, ["--tw-ring-color" as string]: c === "#ffffff" ? "#9aa1aa" : c }}
              />
            ))}
            <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-line" />
            {WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                title={t("size", { size: w })}
                aria-pressed={lineWidth === w}
                onClick={() => setLineWidth(w)}
                className={`grid size-8 place-items-center rounded-lg transition ${lineWidth === w ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-sunken"}`}
              >
                <span className={`block rounded-full bg-current ${w === 2 ? "size-1" : w === 4 ? "size-2" : "size-3"}`} />
              </button>
            ))}
            {tool === "text" && <>
              <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-line" />
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  title={t("fontSize", { size })}
                  aria-pressed={fontSize === size}
                  onClick={() => setFontSize(size)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-xs font-semibold transition ${fontSize === size ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-sunken"}`}
                >
                  {size}
                </button>
              ))}
            </>}
            <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-line" />
            <ToolBtn active={false} title={t("undo")} onClick={undo} disabled={marks.length === 0 && !textPos}><UndoIcon size={17} /></ToolBtn>
          </div>
        </div>

        {fixPrompt && (
          <button type="button" aria-pressed={showFix} onClick={() => setShowFix((value) => !value)} title={t("fixPrompt")}
            className={`flex h-[34px] items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-semibold ${showFix ? "border-ink bg-sunken text-ink" : "border-line bg-surface text-ink hover:bg-sunken"}`}>
            <FixPromptIcon size={15} />{t("fixPrompt")}
          </button>
        )}
        <button
          type="button"
          onClick={() => void copyImage()}
          disabled={!imgReady}
          className="flex h-[34px] items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-sunken disabled:opacity-40"
        >
          {copied ? <CheckIcon size={14} className="text-accent" /> : <CopyIcon size={14} />}
          {copied ? t("copiedBang") : t("copy")}
        </button>
        <button
          type="button"
          onClick={() => void downloadImage()}
          disabled={!imgReady}
          className="flex h-[34px] items-center gap-1.5 rounded-[9px] bg-primary px-3.5 text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-40"
        >
          <DownloadIcon size={15} />
          {t("download")}
        </button>
        <button type="button" onClick={onClose} title={t("close")} aria-label={t("close")} className="grid size-[34px] place-items-center rounded-[9px] text-ink hover:bg-sunken">
          <CloseIcon size={18} />
        </button>
      </div>

      {/* ── Crop confirm bar ── */}
      {tool === "crop" && cropRect && (
        <div className="flex h-10 shrink-0 items-center justify-center gap-2 border-b border-warn-line bg-warn-soft">
          <span className="text-xs font-medium text-warn">{t("cropSelection")}</span>
          <button type="button" onClick={applyCrop} className="flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary">
            <CheckIcon size={12} /> {t("applyCrop")}
          </button>
          <button type="button" onClick={cancelCrop} className="flex h-7 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-2">
            <CloseIcon size={12} /> {t("cancel")}
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── Canvas area ── */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-8">
          <div className="relative inline-block rounded-xl shadow-[0_4px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
            <canvas
              ref={canvasRef}
              className={`block max-h-[calc(100vh-120px)] max-w-full rounded-xl bg-[conic-gradient(var(--color-sunken)_25%,var(--color-surface)_0_50%,var(--color-sunken)_0_75%,var(--color-surface)_0)] bg-[length:16px_16px] ${tool === "text" ? "cursor-text" : "cursor-crosshair"}`}
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
                placeholder={t("typeHere")}
                rows={1}
                className="absolute min-w-[100px] resize-none rounded border-2 border-dashed bg-white/85 px-1.5 py-0.5 font-semibold leading-[1.4] outline-none backdrop-blur"
                style={{ left: `${textPos.x * 100}%`, top: `${textPos.y * 100}%`, color, fontSize, borderColor: color }}
              />
            )}

            {!imgReady && !imageUrl && (
              <div className="flex h-[500px] w-[800px] items-center justify-center rounded-xl bg-surface text-muted">
                <span className="text-sm">{t("noScreenshot")}</span>
              </div>
            )}
          </div>
        </div>

        {fixPrompt && showFix && (
          <aside aria-label={t("fixPrompt")} className="flex w-[360px] max-w-[45%] shrink-0 flex-col border-s border-line bg-surface">
            <FixPromptForm pageUrl={fixPrompt.pageUrl} devices={fixPrompt.devices} initialDeviceIds={fixPrompt.devices.map((device) => device.id)} onClose={() => setShowFix(false)} />
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({ active, title, onClick, disabled = false, children }: { active: boolean; title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg transition disabled:opacity-30 ${active ? "bg-primary text-on-primary" : "text-ink hover:bg-sunken"}`}
    >
      {children}
    </button>
  );
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 8 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -8);
  }
  return `${next.trim()}...`;
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
