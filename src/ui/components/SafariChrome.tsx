import { useId, type CSSProperties } from "react";
import { AlignLeft, X, BookOpen, ChevronLeft, ChevronRight, Copy, Info, Lock, Plus, RefreshCw, Share, Wifi } from "lucide-react";
import type { BrowserGeometry } from "../../domain/device/browser-geometry";

/** Extend adjacent composited page pixels into a reserved browser edge. */
function DuoGlassEdge({ edge, size, dark, bottom = 0 }: {
  edge: "right" | "top" | "bottom"; size: number; dark: boolean; bottom?: number;
}) {
  const filterId = useId().replaceAll(":", "");
  const right = edge === "right";
  const top = edge === "top";
  return <>
    <svg width="0" height="0" className="absolute"><defs>
      <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feOffset dx={right ? size : 0} dy={right ? 0 : top ? -size : size}/>
        <feGaussianBlur stdDeviation="18"/>
        <feColorMatrix type="saturate" values="1.35"/>
      </filter>
    </defs></svg>
    <div data-duo-glass={edge} className="absolute" style={{
      // Capture an adjacent strip of the real iframe, then clip the filtered
      // output to the chrome. Unlike box reflections, backdrop filters include
      // cross-origin iframe surfaces. The page viewport remains unobscured.
      ...(right
        ? { top: 0, right: 0, bottom, width: size * 2, clipPath: `inset(0 0 0 ${size}px)` }
        : { left: 0, right: 0, height: size * 2, ...(top
          ? { top: 0, clipPath: `inset(0 0 ${size}px 0)` }
          : { bottom: 0, clipPath: `inset(${size}px 0 0 0)` }) }),
      background: dark ? "rgba(24,27,33,.32)" : "rgba(255,255,255,.3)",
      backdropFilter: `url(#${filterId})`,
      WebkitBackdropFilter: `url(#${filterId})`,
    }}/>
  </>;
}

/** Decorative browser controls use the very same geometry as the page viewport. */
export function SafariChrome({ geometry: g, hostname, dark, keyboard, topColor, bottomColor, topDark, showBattery = true }: {
  geometry: BrowserGeometry; hostname: string; dark: boolean; keyboard: boolean; topColor: string; bottomColor: string; topDark: boolean; showBattery?: boolean;
}) {
  const glass = dark ? "rgba(35,38,43,.92)" : "rgba(246,247,250,.93)";
  const ink = dark ? "#f3f4f6" : "#263142";
  const topInk = topDark ? "#f3f4f6" : "#263142";
  const topGlass = `color-mix(in srgb, ${topColor} 15%, ${topDark ? "#23262b" : "#f6f7fa"})`;
  const bottomGlass = `color-mix(in srgb, ${bottomColor} 15%, ${glass})`;
  if (g.duoControls) {
    const side = g.duoControls === "side";
    // Duo navigation remains stationary while the webpage scrolls.
    const buttonSize = 36;
    const iconRight = (g.duoIconCenterRight ?? g.right / 2) - buttonSize / 2;
    const frost = (isDark: boolean): CSSProperties => ({
      background: isDark ? "rgba(24,27,33,.32)" : "rgba(255,255,255,.3)",
      backdropFilter: "blur(18px) saturate(1.35)",
      WebkitBackdropFilter: "blur(18px) saturate(1.35)",
    });
    const buttonStyle: CSSProperties = { width: buttonSize, height: buttonSize, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", ...frost(topDark), boxShadow: "inset 0 1px 1px #ffffff65, inset 0 -1px 1px #00000018, 0 2px 8px #00000018" };
    const status = <div data-browser-control="duo-status" className="flex shrink-0 items-center gap-2" style={{ flexDirection: side ? "column" : "row", justifySelf: "end" }}>
      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, whiteSpace: "nowrap" }}>9:41</span>
      <div style={{ position: "relative", width: 32, height: 32, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {showBattery && <svg viewBox="0 0 32 32" className="absolute inset-0" width="32" height="32"><path d="M 6 25 A 13 13 0 1 1 26 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>}
        <Wifi size={15} style={{ marginTop: -3 }}/>
        <span className="absolute flex gap-1" style={{ bottom: 0 }}>{[0, 1, 2, 3].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }}/>)}</span>
      </div>
    </div>;
    return <div aria-hidden data-safari-style={`duo-${g.duoControls}`} data-browser-collapsed={g.collapse > 0 ? "true" : "false"} className="pointer-events-none absolute inset-0 z-20" style={{ color: topInk }}>
      {side && g.right > 0 && <DuoGlassEdge edge="right" size={g.right} dark={topDark} bottom={g.bottom}/>}
      {!side && g.top > 0 && <DuoGlassEdge edge="top" size={g.top} dark={topDark}/>}
      {!keyboard && g.bottom > 0 && <DuoGlassEdge edge="bottom" size={g.bottom} dark={dark}/>}
      {g.status > 0 && <div className="absolute flex justify-center" style={{
        top: g.duoStatusTop, right: side ? iconRight : g.statusInsetRight, width: side ? buttonSize : undefined,
      }}>{status}</div>}
      {side && g.toolbar > 0 && <div data-browser-control="side-toolbar" className="absolute flex flex-col items-center gap-3" style={{
        top: (g.duoStatusTop ?? 24) + g.status + 24, right: iconRight, width: buttonSize,
      }}>
        <span style={buttonStyle}><ChevronLeft size={18}/></span>
        <span style={buttonStyle}><BookOpen size={18}/></span>
      </div>}
      {!keyboard && g.address > 0 && g.duoFullWidthBottom && <>
        <div data-browser-control="new-tab" className="absolute grid place-items-center" style={{ right: iconRight, bottom: 12 + g.address, width: buttonSize, height: 44 }}><Plus size={18}/></div>
        <div data-browser-control="bottom-address" className="absolute flex items-center" style={{ left: 0, right: 0, bottom: 12, height: g.address, color: ink }}>
          <div className="flex min-w-0 flex-1 items-center gap-4 px-5" style={{ fontSize: 12 }}>
            <AlignLeft size={17} className="shrink-0"/><span className="min-w-0 flex-1 truncate text-center">{hostname}</span><X size={16} className="shrink-0"/>
          </div>
          <span data-browser-control="tab-switcher" className="grid shrink-0 place-items-center" style={{ width: buttonSize, marginRight: iconRight, height: g.address }}><Copy size={19}/></span>
        </div>
      </>}
      {!keyboard && g.address > 0 && !g.duoFullWidthBottom && <div data-browser-control="bottom-address" className="absolute flex items-center gap-3 px-4" style={{
        left: 0, right: g.right, bottom: 12 + (side ? 0 : g.toolbar), height: g.address, color: ink,
      }}>
        <Info size={17} className="shrink-0"/>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-3" style={{ height: 34, ...frost(dark), fontSize: 12 }}>
          <Lock size={10} className="shrink-0"/><span className="min-w-0 flex-1 truncate text-center">{hostname}</span><RefreshCw size={12} className="shrink-0"/>
        </div>
        <Plus size={18} className="shrink-0"/>
      </div>}
      {!side && !keyboard && g.toolbar > 0 && <div data-browser-control="bottom-toolbar" className="absolute flex items-center justify-around" style={{
        left: 0, right: g.right, bottom: 12, height: g.toolbar, color: ink,
      }}><ChevronLeft size={18}/><ChevronRight size={18}/><Share size={17}/><BookOpen size={17}/><Copy size={17}/></div>}
      {!keyboard && g.homeIndicator && <div data-browser-control="home-indicator" className="absolute rounded-full" style={{
        bottom: 4, left: "42%", width: "16%", height: 4, background: ink, opacity: .5,
      }}/>}

    </div>;
  }
  const address = (height: number, atTop = false) => <div className="flex h-full items-center gap-3 px-4" style={{ color: atTop ? topInk : ink }}>
    {g.family === "ipad" && <><ChevronLeft size={17}/><ChevronRight size={17}/></>}
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3" style={{ height: Math.max(18, height - 10), background: dark ? "#ffffff12" : "#00000008", fontSize: 12 }}>
      <Lock size={10}/><span className="truncate">{hostname}</span><RefreshCw size={12}/>
    </div>
    {g.family === "ipad" && <><Share size={17}/><Plus size={17}/><Copy size={17}/></>}
  </div>;
  const toolbar = <div className="flex h-full items-center justify-around" style={{ color: dark ? "#8dccff" : "#007aff" }}><ChevronLeft size={18}/><ChevronRight size={18}/><Share size={17}/><BookOpen size={17}/><Copy size={17}/></div>;

  return <div aria-hidden data-safari-style={g.family === "ipad" ? `ipad-${g.layout}` : `${g.variant}-${g.layout}`}
    data-browser-collapsed={g.collapse > 0 ? "true" : "false"} className="pointer-events-none absolute inset-0 z-20">
    {g.family === "ipad" && g.tabStrip > 0 && <div data-browser-control="tabs" className="absolute inset-x-0 flex items-center gap-4 border-b border-slate-500/15 px-5 text-[11px]" style={{ top: g.status, height: g.tabStrip, background: topGlass, color: topInk }}><span className="max-w-[70%] truncate">{hostname}</span><Plus size={12}/></div>}
    {(g.family === "ipad" || g.layout === "top") && g.address > 0 && <div data-browser-control="top-address" className="absolute inset-x-0 border-b border-slate-500/10 backdrop-blur-xl" style={{ top: g.status + g.tabStrip, height: g.address, background: topGlass }}>{address(g.address, true)}</div>}
    {!keyboard && g.layout === "compact" && <div data-browser-control="bottom-address" className="absolute flex items-center gap-2 overflow-hidden rounded-full px-4 ring-1 ring-slate-400/15 backdrop-blur-xl" style={{
      bottom: g.pillBottom, height: g.pillHeight, left: `${g.collapse ? 28 : 9}%`, width: `${g.collapse ? 44 : 82}%`,
      background: dark ? "rgba(35,38,43,.78)" : "rgba(255,255,255,.82)", color: ink,
      boxShadow: "0 4px 16px #00000018, inset 0 1px 0 #ffffff65", fontSize: g.collapse ? 10 : 13,
    }}><ChevronLeft size={g.collapse ? 11 : 16}/><Lock size={10}/><span className="min-w-0 flex-1 truncate text-center">{hostname}</span>{!g.collapse && <RefreshCw size={14}/>}</div>}
    {!keyboard && g.family === "iphone" && g.layout !== "compact" && <>
      {g.layout === "bottom" && g.address > 0 && <div data-browser-control="bottom-address" className="absolute inset-x-0 backdrop-blur-xl" style={{ bottom: g.bottom - g.address, height: g.address, background: bottomGlass }}>{address(g.address)}</div>}
      {g.toolbar > 0 && <div data-browser-control="bottom-toolbar" className="absolute inset-x-0 backdrop-blur-xl" style={{ bottom: g.bottom - g.toolbar - (g.layout === "bottom" ? g.address : 0), height: g.toolbar, background: bottomGlass }}>{toolbar}</div>}
    </>}
    {!keyboard && g.homeIndicator && <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 6 }}><span className="h-1 w-28 rounded-full" style={{ background: dark ? "#ffffff80" : "#00000055" }}/></div>}
  </div>;
}
