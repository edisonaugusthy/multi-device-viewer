import { Lock, MousePointer2 } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

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
  locked: boolean;
  scale: number;
  dark: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

// ── small helpers ─────────────────────────────────────────────────────────────

function Row({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <p className="grid grid-cols-[78px_1fr] gap-2 font-mono text-[10px]">
      <span className={`font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>{label} </span>
      <span className={dark ? "text-slate-200" : "text-slate-700"}>{value}</span>
    </p>
  );
}

function Section({ label, children, dark }: { label: string; children: ReactNode; dark: boolean }) {
  return (
    <div className="space-y-1">
      <p className={`text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-600" : "text-slate-400"}`}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

function BoxModelDiagram({ data, dark }: { data: InspectData; dark: boolean }) {
  const v = (raw: unknown): string => {
    const str = ss(raw, "0px");
    return str === "0px" ? "0" : str.replace(/px$/, "");
  };

  const margin = {
    top: v(data.marginTop),
    right: v(data.marginRight),
    bottom: v(data.marginBottom),
    left: v(data.marginLeft),
  };
  const padding = {
    top: v(data.paddingTop),
    right: v(data.paddingRight),
    bottom: v(data.paddingBottom),
    left: v(data.paddingLeft),
  };
  const border = v(data.borderWidth);

  const layer = dark
    ? {
        margin: "border-amber-400/25 bg-amber-400/10 text-amber-200",
        border: "border-orange-400/30 bg-orange-400/10 text-orange-200",
        padding: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        content: "border-blue-400/30 bg-blue-400/10 text-blue-200",
        muted: "text-slate-500",
      }
    : {
        margin: "border-amber-200 bg-amber-50 text-amber-800",
        border: "border-orange-200 bg-orange-50 text-orange-800",
        padding: "border-emerald-200 bg-emerald-50 text-emerald-800",
        content: "border-blue-200 bg-blue-50 text-blue-800",
        muted: "text-slate-400",
      };

  const edgeLabel = `absolute rounded px-1 font-mono text-[9px] font-semibold leading-none`;

  return (
    <div className={`rounded border p-1.5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
      <div className={`relative h-[118px] rounded border ${layer.margin}`}>
        <span className={`${edgeLabel} left-1 top-1 ${layer.muted}`}>margin</span>
        <span className={`${edgeLabel} left-1/2 top-1 -translate-x-1/2`}>{margin.top}</span>
        <span className={`${edgeLabel} bottom-1 left-1/2 -translate-x-1/2`}>{margin.bottom}</span>
        <span className={`${edgeLabel} left-1 top-1/2 -translate-y-1/2`}>{margin.left}</span>
        <span className={`${edgeLabel} right-1 top-1/2 -translate-y-1/2`}>{margin.right}</span>

        <div className={`absolute inset-[18px] rounded border ${layer.border}`}>
          <span className={`${edgeLabel} left-1 top-1 ${layer.muted}`}>border {border}</span>

          <div className={`absolute inset-[14px] rounded border ${layer.padding}`}>
            <span className={`${edgeLabel} left-1 top-1 ${layer.muted}`}>padding</span>
            <span className={`${edgeLabel} left-1/2 top-1 -translate-x-1/2`}>{padding.top}</span>
            <span className={`${edgeLabel} bottom-1 left-1/2 -translate-x-1/2`}>{padding.bottom}</span>
            <span className={`${edgeLabel} left-1 top-1/2 -translate-y-1/2`}>{padding.left}</span>
            <span className={`${edgeLabel} right-1 top-1/2 -translate-y-1/2`}>{padding.right}</span>

            <div className={`absolute inset-x-[18px] inset-y-[24px] flex items-center justify-center rounded border ${layer.content}`}>
              <span className="whitespace-nowrap font-mono text-[10px] font-bold leading-none">
                w {Math.round(sn(data.width))} × h {Math.round(sn(data.height))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip panel — only re-renders when element changes ─────────────────────

export function ElementInspectOverlay({
  data,
  locked,
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
      className={`absolute z-50 w-[220px] overflow-hidden rounded-lg border shadow-xl ${
        dark
          ? "border-white/15 bg-[#1a1f2e]"
          : "border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
      }`}
      style={{ left: tooltipPos.left, top: tooltipPos.top }}
    >
      {/* Header */}
      <div className={`flex items-start justify-between gap-2 border-b px-2.5 py-2 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50/80"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MousePointer2 size={11} className={`shrink-0 ${dark ? "text-blue-400" : "text-blue-500"}`} />
            <span className={`min-w-0 truncate font-mono text-[11px] font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
              {ss(data.tagName, "?").toLowerCase()}
              {data.id && <span className={dark ? "text-blue-300" : "text-blue-600"}>#{data.id}</span>}
            </span>
          </div>
          {data.breadcrumb && (
            <p className={`mt-0.5 truncate font-mono text-[9px] ${dark ? "text-slate-600" : "text-slate-400"}`} title={data.breadcrumb}>
              {data.breadcrumb}
            </p>
          )}
        </div>
        {locked && (
          <span className="flex shrink-0 items-center gap-1 rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5">
            <Lock size={9} className="text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">locked</span>
          </span>
        )}
      </div>

      <div className="space-y-2 p-2.5">

        {/* ── 1. Size (quick glance) ── */}
        <div className={`flex items-baseline gap-2 rounded border px-2 py-1.5 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
          <span className={`text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>size</span>
          <span className={`font-mono text-[13px] font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
            {Math.round(sn(data.width))} × {Math.round(sn(data.height))}
          </span>
          <span className={`ml-auto text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>{ss(data.display)}</span>
        </div>

        <Section label="Typography" dark={dark}>
          <div className="space-y-0.5">
            <Row label="Font size" value={ss(data.fontSize)} dark={dark} />
            <Row label="Font weight" value={ss(data.fontWeight)} dark={dark} />
            <Row label="Line height" value={ss(data.lineHeight)} dark={dark} />
            {data.letterSpacing && data.letterSpacing !== "normal" && <Row label="Letter gap" value={ss(data.letterSpacing)} dark={dark} />}
            {data.textAlign && data.textAlign !== "start" && <Row label="Text align" value={ss(data.textAlign)} dark={dark} />}
          </div>
        </Section>

        <Section label="Box model" dark={dark}>
          <BoxModelDiagram data={data} dark={dark} />
        </Section>
      </div>
    </div>
  );
}
