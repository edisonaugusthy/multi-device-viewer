import { BookOpen, ChevronLeft, ChevronRight, Copy, Lock, Plus, RefreshCw, Share } from "lucide-react";
import type { BrowserGeometry } from "../../domain/device/browser-geometry";

/** Decorative browser controls use the very same geometry as the page viewport. */
export function SafariChrome({ geometry: g, hostname, dark, keyboard, topColor, bottomColor, topDark }: {
  geometry: BrowserGeometry; hostname: string; dark: boolean; keyboard: boolean; topColor: string; bottomColor: string; topDark: boolean;
}) {
  const glass = dark ? "rgba(35,38,43,.92)" : "rgba(246,247,250,.93)";
  const ink = dark ? "#f3f4f6" : "#263142";
  const topInk = topDark ? "#f3f4f6" : "#263142";
  const topGlass = `color-mix(in srgb, ${topColor} 15%, ${topDark ? "#23262b" : "#f6f7fa"})`;
  const bottomGlass = `color-mix(in srgb, ${bottomColor} 15%, ${glass})`;
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
