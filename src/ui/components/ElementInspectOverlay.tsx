import { MousePointer2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

// Guard against undefined/null values arriving from the content-script postMessage.
// TypeScript types say string/number, but at runtime fields can be missing.
const ss = (v: unknown, fallback = "—"): string =>
  v != null && v !== "" ? String(v) : fallback;
const sn = (v: unknown, fallback = 0): number =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

export interface InspectData {
  selector: string;
  tagName: string;
  id: string;
  classes: string[];
  breadcrumb: string;
  isVisibleInViewport: boolean;
  isClippedByViewport: boolean;
  visibilityReason: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  color: string;
  colorHex: string;
  backgroundColor: string;
  backgroundColorHex: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  borderWidth: string;
  borderColor: string;
  borderColorHex: string;
  width: number;
  height: number;
  display: string;
  position: string;
  overflow: string;
  overflowX: string;
  overflowY: string;
  transform: string;
  borderRadius: string;
  opacity: string;
  zIndex: string;
  boxShadow: string;
  // Flex container
  isFlexContainer: boolean;
  flexDirection: string;
  flexWrap: string;
  justifyContent: string;
  alignItems: string;
  gap: string;
  // Grid container
  isGridContainer: boolean;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  // Flex item
  isInFlex: boolean;
  flexGrow: string;
  flexShrink: string;
  flexBasis: string;
  alignSelf: string;
  // Grid item
  isInGrid: boolean;
  gridColumn: string;
  gridRow: string;
  // CSS snippet
  cssSnippet: string;
  x: number;
  y: number;
  rect: { top: number; left: number; width: number; height: number };
}

interface ElementInspectOverlayProps {
  data: InspectData | null;
  scale: number;
  dark: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

// ── Tooltip panel — only re-renders when element changes ─────────────────────

export function ElementInspectOverlay({
  data,
  dark,
  containerRef,
  iframeRef,
  scale,
}: ElementInspectOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 16, top: 16 });

  useLayoutEffect(() => {
    if (!data || !tooltipRef.current || !containerRef.current || !iframeRef.current) return;

    const cr = containerRef.current.getBoundingClientRect();
    const ir = iframeRef.current.getBoundingClientRect();
    const iframeLeft = ir.left - cr.left;
    const iframeTop = ir.top - cr.top;
    const targetLeft = iframeLeft + data.rect.left * scale;
    const targetTop = iframeTop + data.rect.top * scale;
    const targetWidth = data.rect.width * scale;
    const targetHeight = data.rect.height * scale;
    const targetRight = targetLeft + targetWidth;
    const targetBottom = targetTop + targetHeight;

    const containerW = containerRef.current.offsetWidth;
    const containerH = containerRef.current.offsetHeight;
    const ttW = tooltipRef.current.offsetWidth;
    const ttH = tooltipRef.current.offsetHeight;
    const GAP = 12;
    const PAD = 8;

    let left: number;
    let top: number;

    const centeredLeft = targetLeft + targetWidth / 2 - ttW / 2;

    if (targetTop - PAD >= ttH + GAP) {
      left = centeredLeft;
      top = targetTop - ttH - GAP;
    } else if (containerH - targetBottom - PAD >= ttH + GAP) {
      left = centeredLeft;
      top = targetBottom + GAP;
    } else if (containerW - targetRight - PAD >= ttW + GAP) {
      left = targetRight + GAP;
      top = targetTop;
    } else if (targetLeft - PAD >= ttW + GAP) {
      left = targetLeft - ttW - GAP;
      top = targetTop;
    } else {
      left = centeredLeft;
      top = targetTop - ttH - GAP;
    }

    setTooltipPos({
      left: Math.max(PAD, Math.min(left, containerW - ttW - PAD)),
      top: Math.max(PAD, Math.min(top, containerH - ttH - PAD)),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scale]);

  if (!data) return null;

  return (
    <div
      ref={tooltipRef}
      className={`absolute z-50 w-[240px] overflow-hidden rounded-lg border shadow-xl ${
        dark
          ? "border-white/15 bg-[#1a1f2e]"
          : "border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
      }`}
      style={{ left: tooltipPos.left, top: tooltipPos.top }}
    >
      <div className={`flex items-start justify-between gap-2 border-b px-2.5 py-2 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50/80"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MousePointer2 size={11} className={`shrink-0 ${dark ? "text-blue-400" : "text-blue-500"}`} />
            <span className={`min-w-0 truncate font-mono text-[11px] font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
              {ss(data.tagName, "?").toLowerCase()}
              {data.id && <span className={dark ? "text-blue-300" : "text-blue-600"}>#{data.id}</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="p-2.5">
        <div className={`grid grid-cols-2 gap-2 rounded border px-2 py-2 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
          <div className="min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>size</p>
            <p className={`mt-0.5 truncate font-mono text-[12px] font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
              {Math.round(sn(data.width))} × {Math.round(sn(data.height))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className={`text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>font size</p>
            <p className={`mt-0.5 truncate font-mono text-[12px] font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
              {ss(data.fontSize)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
