import { Camera, Focus, Link2, Moon, Plus, RefreshCw, Route, Settings2, Smartphone, Square, Sun, X } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { BrandMark } from "./BrandMark";

export function FocusToolbar({ dark, freeView, scrollSync, navigationSync, toolsOpen, url, canAdd, capturing, onViewChange, onViewOnly, onAdd, onSync, onNavigationSync, onReload, onCapture, onTools, onTheme, onClose }: {
  dark: boolean; freeView: boolean; scrollSync: boolean; navigationSync: boolean; toolsOpen: boolean;
  url: string; canAdd: boolean; capturing: boolean;
  onViewChange: (free: boolean) => void;
  onViewOnly: () => void;
  onAdd: () => void; onSync: () => void; onNavigationSync: () => void; onReload: () => void; onCapture: () => void;
  onTools: () => void; onTheme: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const quiet = dark ? "border-white/15 text-slate-300 hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-100";
  const action = (label: string, icon: ReactNode, onClick: () => void, disabled = false) => (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className={`grid h-7 w-8 shrink-0 place-items-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-40 ${quiet}`}>
      {icon}
    </button>
  );
  return (
    <header data-main-toolbar data-focused-toolbar
      className={`relative z-30 grid grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] h-10 shrink-0 items-center gap-1.5 border-b px-2 sm:px-3 ${dark ? "border-white/10 bg-[#11141a]" : "border-slate-200 bg-white"}`}>
      <div className="flex shrink-0 items-center gap-1">
        <span title={url} className="me-1 hidden shrink-0 min-[480px]:inline"><BrandMark size={25}/></span>
        <button type="button" aria-label={toolsOpen ? t("closeWorkspaceSetup") : t("openWorkspaceSetup")} aria-expanded={toolsOpen} onClick={onTools}
          className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition ${toolsOpen ? `${dark ? "text-teal-300" : "text-teal-700"} border-teal-500/35 bg-teal-500/10` : quiet}`}>
          <Settings2 size={14}/><span className="hidden sm:inline">{t("tools")}</span>
        </button>
        <button type="button" data-view-only-toggle aria-label={t("viewOnly")} title={t("viewOnly")} onClick={onViewOnly}
          className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold ${quiet}`}>
          <Focus size={15}/><span className="hidden md:inline">{t("viewOnly")}</span>
        </button>
        <span className="hidden sm:contents">{action(t("addViewport"), <Plus size={16}/>, onAdd, !canAdd)}</span>
        <span className="hidden sm:contents">{action(t("captureAndAnnotate"), <Camera size={15}/>, onCapture, capturing)}</span>
      </div>
      <div role="group" aria-label={t("previewStyle")} className={`flex shrink-0 gap-0.5 rounded-lg border p-0.5 ${dark ? "border-white/15 bg-black/20" : "border-slate-200 bg-slate-100/70"}`}>
        {[{free: false, label: t("deviceView"), icon: <Smartphone size={13}/>}, {free: true, label: t("freeView"), icon: <Square size={13}/>}].map(({free, label, icon}) => (
          <button key={label} type="button" title={label} aria-label={label} aria-pressed={freeView === free} onClick={() => onViewChange(free)}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-teal-500 ${freeView === free ? dark ? "bg-white/15 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm" : dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
            {icon}<span className="hidden min-[480px]:inline">{label}</span>
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-self-end gap-1">
        <button type="button" aria-label={t("scrollSync")} title={scrollSync ? t("turnOffScrollSync") : t("turnOnScrollSync")} aria-pressed={scrollSync} onClick={onSync}
          className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition ${scrollSync ? `${dark ? "text-teal-300" : "text-teal-700"} border-teal-500/35 bg-teal-500/10` : quiet}`}>
          <Link2 size={14}/><span className="hidden lg:inline">{t("scrollSync")}</span>
        </button>
        <button type="button" aria-label={t("navigationSync")} title={navigationSync ? t("turnOffNavigationSync") : t("turnOnNavigationSync")} aria-pressed={navigationSync} onClick={onNavigationSync}
          className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition ${navigationSync ? `${dark ? "text-teal-300" : "text-teal-700"} border-teal-500/35 bg-teal-500/10` : quiet}`}>
          <Route size={14}/><span className="hidden lg:inline">{t("navigationSync")}</span>
        </button>
        {action(t("reloadAll"), <RefreshCw size={15}/>, onReload)}
        {action(dark ? t("lightTheme") : t("darkTheme"), dark ? <Sun size={15}/> : <Moon size={15}/>, onTheme)}
        {action(t("closeViewer"), <X size={16}/>, onClose)}
      </div>
    </header>
  );
}
