import { type CSSProperties } from "react";
import { AlignLeft, BookOpen, ChevronLeft, ChevronRight, Copy, Lock, Plus, RefreshCw, Share, Wifi } from "lucide-react";
import type { BrowserGeometry } from "../../domain/device/browser-geometry";
import type { SideSurfaceBand } from "../../domain/device/page-surfaces";

/** Decorative browser controls use the very same geometry as the page viewport. */
export function SafariChrome({ geometry: g, hostname, dark, keyboard, topColor, bottomColor, topDark, rightBands, showBattery = true }: {
  geometry: BrowserGeometry; hostname: string; dark: boolean; keyboard: boolean; topColor: string; bottomColor: string; topDark: boolean; rightBands?: SideSurfaceBand[]; showBattery?: boolean;
}) {
  const glass = dark ? "rgba(35,38,43,.92)" : "rgba(246,247,250,.93)";
  const ink = dark ? "#f3f4f6" : "#263142";
  const topInk = topDark ? "#f3f4f6" : "#263142";
  const topGlass = `color-mix(in srgb, ${topColor} 15%, ${topDark ? "#23262b" : "#f6f7fa"})`;
  const bottomGlass = `color-mix(in srgb, ${bottomColor} 15%, ${glass})`;
  if (g.duoControls) {
    const side = g.duoControls === "side";
    const minimized = g.collapse > 0.5;
    // Side navigation remains stationary while the bottom bar minimizes.
    const buttonSize = 28;
    const iconRight = (g.duoIconCenterRight ?? g.right / 2) - buttonSize / 2;
    // The same glass treatment follows the page behind each control group.
    const glassFor = (color: string, isDark: boolean): CSSProperties => ({
      background: `color-mix(in srgb, ${color} 30%, ${isDark ? "rgba(35,38,43,.28)" : "rgba(255,255,255,.26)"})`,
      color: isDark ? "#f3f4f6" : "#263142",
      backdropFilter: "blur(16px) saturate(1.5)",
      WebkitBackdropFilter: "blur(16px) saturate(1.5)",
      boxShadow: "inset 0 1px 1px #ffffff70, inset 0 -1px 1px #ffffff20, 0 2px 8px #00000010",
      borderRadius: 16,
    });
    const floatingGlass = glassFor(bottomColor, dark);
    const surfaceAt = (y: number) => rightBands?.findLast(band => band.offset <= (y - g.top) / g.content.height);
    const sideGlassAt = (y: number) => {
      const surface = surfaceAt(y);
      // Use the address bar's state, including its direction/jitter thresholds.
      // Scale the controls without changing their anchors or the page width.
      return { ...(surface ? glassFor(surface.color, surface.isDark) : floatingGlass), transform: minimized ? "scale(.7)" : "scale(1)" };
    };
    const controlsTop = (g.duoStatusTop ?? 24) + g.status + 24;
    const controlsBottom = g.duoFullWidthBottom ? 76 : 96;
    const screenHeight = g.top + g.content.height + g.bottom;
    const statusSurface = side ? surfaceAt((g.duoStatusTop ?? 0) + g.status / 2) : undefined;
    const sideBackground = rightBands?.length
      ? `linear-gradient(to bottom, ${rightBands.map((band, i) => `${band.color} ${band.offset * 100}% ${(rightBands[i + 1]?.offset ?? 1) * 100}%`).join(", ")})`
      : `linear-gradient(to bottom, ${topColor} ${controlsTop}px, ${bottomColor} ${controlsTop}px)`;
    const groupWidth = 36;
    const groupRight = iconRight - (groupWidth - buttonSize) / 2;
    const buttonStyle: CSSProperties = { width: buttonSize, height: buttonSize, flexShrink: 0, display: "grid", placeItems: "center" };
    const status = <div data-browser-control="duo-status" className="flex shrink-0 items-center gap-2" style={{ flexDirection: side ? "column" : "row", justifySelf: "end" }}>
      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, whiteSpace: "nowrap" }}>9:41</span>
      <div style={{ position: "relative", width: 32, height: 32, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {showBattery && <svg viewBox="0 0 32 32" className="absolute inset-0" width="32" height="32"><path d="M 6 25 A 13 13 0 1 1 26 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>}
        <Wifi size={15} style={{ marginTop: -3 }}/>
        <span className="absolute flex gap-1" style={{ bottom: 0 }}>{[0, 1, 2, 3].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }}/>)}</span>
      </div>
    </div>;
    return <div aria-hidden data-safari-style={`duo-${g.duoControls}`} data-browser-collapsed={g.collapse > 0 ? "true" : "false"} className="pointer-events-none absolute inset-0 z-20" style={{ color: topInk }}>
      {side && g.right > 0 && <div data-duo-side-surface className="absolute right-0" style={{
        // Seal independently rasterized iframe edges at fractional preview scales.
        top: g.top, height: g.content.height + 1, width: g.right + 1, backgroundImage: sideBackground,
      }}/>}
      {g.status > 0 && <div data-duo-control-group="status" className="absolute flex justify-center" style={{
        top: g.duoStatusTop, right: side ? groupRight : g.statusInsetRight,
        width: side ? groupWidth : undefined, padding: side ? "4px 0" : "0 8px",
        color: statusSurface ? statusSurface.isDark ? "#f3f4f6" : "#263142" : topInk,
        // Keep thin status strokes legible when a section boundary passes them.
        filter: `drop-shadow(0 0 .6px ${(statusSurface?.isDark ?? topDark) ? "#000000" : "#ffffff"})`,
      }}>{status}</div>}
      {side && g.toolbar > 0 && <div data-browser-control="side-toolbar" data-duo-control-group="navigation" data-controls-size={minimized ? "compact" : "expanded"} className="absolute flex flex-col items-center justify-between" style={{
        top: controlsTop, right: groupRight, width: groupWidth,
        // Independent upper buttons and a lower tab group share the page background.
        // Keep their positions stable on scroll and clear of the rotated camera.
        bottom: controlsBottom,
      }}>
        <div className="flex flex-col items-center gap-2">
          <span data-duo-glass-group="back" className="transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ ...buttonStyle, ...sideGlassAt(controlsTop + groupWidth / 2), width: groupWidth, height: groupWidth, borderRadius: "50%" }}><ChevronLeft size={16}/></span>
          <span data-duo-glass-group="bookmarks" className="transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ ...buttonStyle, ...sideGlassAt(controlsTop + groupWidth * 1.5 + 8), width: groupWidth, height: groupWidth, borderRadius: "50%" }}><BookOpen size={16}/></span>
        </div>
        {!keyboard && <div data-duo-glass-group="tabs" className="flex origin-bottom flex-col items-center p-1 transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ ...sideGlassAt(screenHeight - controlsBottom - (buttonSize + 4) * (minimized ? .7 : 1)), borderRadius: groupWidth / 2 }}>
          <span data-browser-control="new-tab" style={buttonStyle}><Plus size={16}/></span>
          <span data-browser-control="tab-switcher" style={buttonStyle}><Copy size={16}/></span>
        </div>}
      </div>}
      {!keyboard && g.address > 0 && <div data-browser-control={minimized ? "compact-address" : "bottom-address"} className="absolute flex justify-center" style={{
        left: 0, right: g.duoFullWidthBottom ? 0 : g.right,
        bottom: minimized ? 12 : 16,
        height: minimized ? g.address : g.address - 8, color: ink,
      }}>
        <div data-duo-glass-group="address" className="flex min-w-0 items-center gap-2 rounded-full px-4" style={{
          width: minimized ? "min(60%, 240px)" : "min(82%, 640px)", height: "100%", ...floatingGlass,
          borderRadius: 999, fontSize: minimized ? 11 : 13,
        }}>
          {!minimized && <AlignLeft size={17} className="shrink-0"/>}
          <Lock size={minimized ? 9 : 10} className="shrink-0"/>
          <span className="min-w-0 flex-1 truncate text-center">{hostname}</span>
          {!minimized && <RefreshCw size={14} className="shrink-0"/>}
        </div>
      </div>}
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
