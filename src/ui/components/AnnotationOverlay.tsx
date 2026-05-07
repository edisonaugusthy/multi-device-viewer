import { ArrowUpRight, Check, Copy, Download, Image as ImageIcon, MessageSquareText, Pencil, Square, Undo2, X } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";

type AnnotationTool = "pen" | "rect" | "arrow";

interface Point {
  x: number;
  y: number;
}

interface BaseMark {
  id: string;
  tool: AnnotationTool;
}

interface PenMark extends BaseMark {
  tool: "pen";
  points: Point[];
}

interface ShapeMark extends BaseMark {
  tool: "rect" | "arrow";
  start: Point;
  end: Point;
}

type Mark = PenMark | ShapeMark;

export function AnnotationOverlay({
  imageUrl,
  onClose
}: {
  imageUrl?: string;
  onClose: () => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [note, setNote] = useState("Please review this responsive layout.");
  const [copied, setCopied] = useState<"note" | "image" | null>(null);
  const [tool, setTool] = useState<AnnotationTool>("pen");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [draft, setDraft] = useState<Mark | null>(null);

  const shareText = useMemo(() => {
    return [
      "Multi Device Viewer annotation",
      "",
      note.trim(),
      "",
      "The attached capture was generated locally from the simulator."
    ].join("\n");
  }, [note]);

  async function copyNote() {
    await navigator.clipboard.writeText(shareText);
    setCopied("note");
    window.setTimeout(() => setCopied(null), 1400);
  }

  async function copyImage() {
    if (!imageUrl || typeof ClipboardItem === "undefined") return;
    const dataUrl = await renderAnnotatedImage();
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    setCopied("image");
    window.setTimeout(() => setCopied(null), 1400);
  }

  async function downloadAnnotatedImage() {
    const dataUrl = await renderAnnotatedImage();
    if (dataUrl) await downloadDataUrl(dataUrl, screenshotFilename("annotated-capture"));
  }

  function pointFromEvent(event: PointerEvent) {
    const image = imageRef.current;
    if (!image) return null;
    const rect = image.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }

  function startMark(event: PointerEvent) {
    if (!imageUrl) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const id = `mark-${Date.now()}`;
    setDraft(tool === "pen" ? { id, tool, points: [point] } : { id, tool, start: point, end: point });
  }

  function updateMark(event: PointerEvent) {
    const point = pointFromEvent(event);
    if (!point || !draft) return;
    if (draft.tool === "pen") {
      setDraft({ ...draft, points: [...draft.points, point] });
      return;
    }
    setDraft({ ...draft, end: point });
  }

  function finishMark() {
    if (!draft) return;
    setMarks((current) => [...current, draft]);
    setDraft(null);
  }

  async function renderAnnotatedImage() {
    if (!imageUrl) return undefined;
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawMarks(context, [...marks, ...(draft ? [draft] : [])], canvas.width, canvas.height);
    if (note.trim()) drawNote(context, note.trim(), canvas.width);
    return canvas.toDataURL("image/png");
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white">
      <button
        className="fixed right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
        onClick={onClose}
        title="Close"
      >
        <X size={24} />
      </button>

      <div className="grid h-full grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-w-0 items-center justify-center bg-[#f7f8fb] p-10">
          <div className="relative max-h-full max-w-full rounded-[18px] bg-white p-3 shadow-[0_24px_80px_rgb(15_23_42/0.16)] ring-1 ring-slate-200">
            {imageUrl ? (
              <div
                className="relative inline-block touch-none select-none"
                onPointerDown={startMark}
                onPointerMove={updateMark}
                onPointerUp={finishMark}
                onPointerCancel={() => setDraft(null)}
              >
                <img ref={imageRef} src={imageUrl} alt="Current simulator capture" className="block max-h-[calc(100vh-96px)] max-w-full rounded-[12px] object-contain" draggable={false} />
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible rounded-[12px]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <marker id="annotation-arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
                      <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
                    </marker>
                  </defs>
                  {[...marks, ...(draft ? [draft] : [])].map((mark) => (
                    <AnnotationMark key={mark.id} mark={mark} />
                  ))}
                </svg>
              </div>
            ) : (
              <div className="flex h-[520px] w-[720px] max-w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-slate-300 bg-white text-center">
                <ImageIcon size={42} className="text-slate-300" />
                <p className="mt-4 text-lg font-black text-slate-900">Capture preview unavailable</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Some embedded pages cannot be captured by browser security rules. You can still write and copy the annotation text.
                </p>
              </div>
            )}
            {note.trim() && (
              <div className="absolute left-8 top-8 max-w-[360px] rounded-[14px] bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-blue-500">Annotation</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{note}</p>
              </div>
            )}
          </div>
        </main>

        <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-blue-50 text-blue-500">
                <MessageSquareText size={22} />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Annotate & share</h2>
                <p className="text-sm font-medium text-slate-500">Write a note, copy it, or download the capture.</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="mb-5 grid grid-cols-4 gap-2">
              <ToolButton active={tool === "pen"} label="Pen" onClick={() => setTool("pen")}>
                <Pencil size={17} />
              </ToolButton>
              <ToolButton active={tool === "rect"} label="Box" onClick={() => setTool("rect")}>
                <Square size={17} />
              </ToolButton>
              <ToolButton active={tool === "arrow"} label="Arrow" onClick={() => setTool("arrow")}>
                <ArrowUpRight size={17} />
              </ToolButton>
              <ToolButton active={false} label="Undo" onClick={() => setMarks((current) => current.slice(0, -1))} disabled={marks.length === 0}>
                <Undo2 size={17} />
              </ToolButton>
            </div>

            <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Message</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 h-44 w-full resize-none rounded-[12px] border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              placeholder="Write what needs to be checked..."
            />

            <div className="mt-4 space-y-2">
              <ActionButton onClick={copyNote}>
                {copied === "note" ? <Check size={17} /> : <Copy size={17} />} {copied === "note" ? "Copied note" : "Copy note"}
              </ActionButton>
              <ActionButton onClick={copyImage} disabled={!imageUrl || typeof ClipboardItem === "undefined"}>
                {copied === "image" ? <Check size={17} /> : <ImageIcon size={17} />} {copied === "image" ? "Copied image" : "Copy image"}
              </ActionButton>
              <ActionButton onClick={downloadAnnotatedImage} disabled={!imageUrl}>
                <Download size={17} /> Download PNG
              </ActionButton>
            </div>

            <div className="mt-5 rounded-[12px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Share text</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-600">{shareText}</pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AnnotationMark({ mark }: { mark: Mark }) {
  if (mark.tool === "pen") {
    const points = mark.points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ");
    return <polyline points={points} fill="none" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />;
  }

  if (mark.tool === "rect") {
    const x = Math.min(mark.start.x, mark.end.x) * 100;
    const y = Math.min(mark.start.y, mark.end.y) * 100;
    const width = Math.abs(mark.end.x - mark.start.x) * 100;
    const height = Math.abs(mark.end.y - mark.start.y) * 100;
    return <rect x={x} y={y} width={width} height={height} fill="rgba(37,99,235,0.08)" stroke="#2563eb" strokeWidth="0.7" rx="1.4" vectorEffect="non-scaling-stroke" />;
  }

  return (
    <line
      x1={mark.start.x * 100}
      y1={mark.start.y * 100}
      x2={mark.end.x * 100}
      y2={mark.end.y * 100}
      stroke="#2563eb"
      strokeLinecap="round"
      strokeWidth="0.75"
      markerEnd="url(#annotation-arrow)"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function ToolButton({
  active,
  children,
  disabled,
  label,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-10 items-center justify-center gap-1 rounded-[10px] text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ActionButton({
  children,
  disabled,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawMarks(context: CanvasRenderingContext2D, marks: Mark[], width: number, height: number) {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#2563eb";
  context.fillStyle = "rgba(37,99,235,0.08)";
  context.lineWidth = Math.max(4, Math.round(width * 0.006));

  for (const mark of marks) {
    if (mark.tool === "pen") {
      context.beginPath();
      mark.points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      continue;
    }

    const startX = mark.start.x * width;
    const startY = mark.start.y * height;
    const endX = mark.end.x * width;
    const endY = mark.end.y * height;

    if (mark.tool === "rect") {
      context.strokeRect(startX, startY, endX - startX, endY - startY);
      context.fillRect(startX, startY, endX - startX, endY - startY);
      continue;
    }

    drawArrow(context, startX, startY, endX, endY, width);
  }
}

function drawArrow(context: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, width: number) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const head = Math.max(18, width * 0.025);
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(endX - head * Math.cos(angle - Math.PI / 6), endY - head * Math.sin(angle - Math.PI / 6));
  context.lineTo(endX - head * Math.cos(angle + Math.PI / 6), endY - head * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fillStyle = "#2563eb";
  context.fill();
}

function drawNote(context: CanvasRenderingContext2D, note: string, width: number) {
  const padding = Math.round(width * 0.018);
  const x = Math.round(width * 0.025);
  const y = Math.round(width * 0.025);
  const boxWidth = Math.min(Math.round(width * 0.35), 520);
  const lines = wrapText(context, note, boxWidth - padding * 2);
  const lineHeight = Math.round(width * 0.018);
  const boxHeight = padding * 2 + lineHeight * (lines.length + 1);

  context.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(context, x, y, boxWidth, boxHeight, 18);
  context.fill();
  context.fillStyle = "#2563eb";
  context.font = `700 ${Math.max(14, Math.round(width * 0.012))}px sans-serif`;
  context.fillText("Annotation", x + padding, y + padding + lineHeight * 0.7);
  context.fillStyle = "#1e293b";
  context.font = `600 ${Math.max(16, Math.round(width * 0.014))}px sans-serif`;
  lines.forEach((line, index) => context.fillText(line, x + padding, y + padding + lineHeight * (index + 1.9)));
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 8);
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
