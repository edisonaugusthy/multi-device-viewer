import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import {
  CameraIcon,
  CloseIcon,
  CompareIcon,
  EyeIcon,
  FixPromptIcon,
  GridIcon,
  LayoutCheckIcon,
  LinkIcon,
  NavigationSyncIcon,
  PlusIcon,
  RecordIcon,
  ReloadIcon,
  ScrollSyncIcon,
  SettingsIcon,
  WorkspaceIcon,
} from "../icons";
import { BrandMark } from "./BrandMark";
import { cx, focusRing, IconButton, Segmented, Tooltip } from "./ui";

export interface WorkspaceHeaderProps {
  slotCount: number;
  catalogCount: number;
  canAdd: boolean;
  addRef: RefObject<HTMLButtonElement | null>;
  addOpen: boolean;
  workspaceRef: RefObject<HTMLButtonElement | null>;
  workspaceOpen: boolean;
  scrollSync: boolean;
  navigationSync: boolean;
  freeView: boolean;
  compare: boolean;
  capturing: boolean;
  recordRef: RefObject<HTMLButtonElement | null>;
  recordOpen: boolean;
  recordingActive: boolean;
  fixRef: RefObject<HTMLButtonElement | null>;
  fixOpen: boolean;
  layoutOpen: boolean;
  layoutChecking: boolean;
  layoutCount: number;
  settingsRef: RefObject<HTMLButtonElement | null>;
  settingsOpen: boolean;
  onAllDevices: () => void;
  onAdd: () => void;
  onWorkspace: () => void;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
  onFreeViewChange: (free: boolean) => void;
  onReloadAll: () => void;
  onCompare: () => void;
  onCapture: () => void;
  onFixPrompt: () => void;
  onLayoutCheck: () => void;
  onRecord: () => void;
  onViewMode: () => void;
  onSettings: () => void;
  onClose: () => void;
}

// Labels drop in stages until the toolbar fits, so long translations never
// push controls off screen: 1 hides the view and Add/Focus labels, 2 the word
// "Sync", 3 shows Scroll and Navigation as icons. Every control keeps its
// accessible name and tooltip.
const MAX_COMPACT = 3;

function useToolbarCompaction(locale: string) {
  const ref = useRef<HTMLElement>(null);
  const [level, setLevel] = useState(0);
  // A new width or language starts again from the full labels.
  useLayoutEffect(() => setLevel(0), [locale]);
  useLayoutEffect(() => {
    const header = ref.current;
    if (!header) return;
    let width = header.clientWidth;
    const observer = new ResizeObserver(() => {
      if (header.clientWidth === width) return;
      width = header.clientWidth;
      setLevel(0);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  // Runs before paint, stepping up one stage at a time while it overflows.
  useLayoutEffect(() => {
    const header = ref.current;
    if (header && level < MAX_COMPACT && header.scrollWidth > header.clientWidth + 1) setLevel(level + 1);
  });
  return { ref, level };
}

export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  const { t, locale } = useI18n();
  const { ref, level } = useToolbarCompaction(locale);
  return (
    <header ref={ref} data-main-toolbar data-compact={level || undefined} className="relative z-30 flex h-[52px] shrink-0 items-center gap-1.5 border-b border-line bg-surface px-2.5">
      <BrandMark size={28} />

      <nav aria-label={t("views")} className="flex shrink-0 rounded-[10px] bg-sunken p-[3px]">
        {/* The current view; clicking it opens the Add device picker here too. */}
        <Tooltip title={t("workspace")} description={t("tipAddDevice")} align="start">
          <button
            ref={props.workspaceRef}
            type="button"
            data-workspace-toggle
            aria-current="page"
            aria-haspopup="dialog"
            aria-expanded={props.workspaceOpen}
            aria-label={t("workspace")}
            onClick={props.onWorkspace}
            className={cx(
              "flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-surface px-2.5 text-[13px] font-semibold text-ink shadow-lift",
              props.workspaceOpen && "ring-1 ring-ink",
              focusRing,
            )}
          >
            <WorkspaceIcon size={15} />
            {level < 1 && <span>{t("workspace")}</span>}
            <CountBadge active>{props.slotCount}</CountBadge>
          </button>
        </Tooltip>
        <Tooltip title={t("allDevices")} description={t("tipAllDevices")} align="start">
          <button
            type="button"
            data-all-devices-toggle
            onClick={props.onAllDevices}
            disabled={props.capturing}
            aria-label={t("allDevices")}
            className={cx("flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold text-ink-2 hover:text-ink disabled:opacity-40", focusRing)}
          >
            <GridIcon size={15} />
            {level < 1 && <span>{t("allDevices")}</span>}
            <CountBadge>{props.catalogCount}</CountBadge>
          </button>
        </Tooltip>
      </nav>

      <Tooltip title={t("addDevice")} description={props.canAdd ? t("tipAddDevice") : t("slotsFull", { count: 4 })} align="start">
        <button
          ref={props.addRef}
          type="button"
          data-tour="add-viewport"
          aria-expanded={props.addOpen}
          aria-label={t("addDevice")}
          onClick={props.onAdd}
          className={cx(
            "flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border px-2.5 text-[13px] font-semibold text-ink",
            props.addOpen ? "border-ink bg-sunken" : "border-line bg-surface hover:bg-sunken",
            focusRing,
          )}
        >
          <PlusIcon size={15} />
          {level < 1 && <span>{t("addDevice")}</span>}
        </button>
      </Tooltip>

      <div className="min-w-2 flex-1" />

      <div role="group" data-tour="sync" aria-label={t("syncBetweenDevices")}
        className="flex h-[34px] shrink-0 items-center gap-0.5 rounded-[9px] border border-line pe-1 ps-2.5">
        <Tooltip title={t("syncBetweenDevices")} description={t("syncBetweenDevicesHint")}>
          <span className="flex items-center">
            <LinkIcon size={15} className="text-ink-2" />
            {level < 2 ? <span className="pe-1.5 ps-1 text-[12.5px] font-semibold text-ink-2">{t("sync")}</span> : <span className="w-1" />}
          </span>
        </Tooltip>
        <SyncCheckbox label={t("scroll")} icon={level >= 3 ? <ScrollSyncIcon size={15} /> : undefined} title={t("scrollSync")} description={t("scrollSyncHint")} checked={props.scrollSync} onChange={props.onScrollSyncChange} />
        <SyncCheckbox label={t("navigation")} icon={level >= 3 ? <NavigationSyncIcon size={15} /> : undefined} title={t("navigationSync")} description={t("navigationSyncHint")} checked={props.navigationSync} onChange={props.onNavigationSyncChange} />
      </div>

      <Segmented
        label={t("previewStyle")}
        value={props.freeView ? "free" : "device"}
        onChange={value => props.onFreeViewChange(value === "free")}
        options={[
          { value: "device", label: t("deviceView"), tooltip: t("tipDeviceView") },
          { value: "free", label: t("freeView"), tooltip: t("tipFreeView") },
        ]}
      />

      <Divider />
      <IconButton label={t("reloadAll")} tooltip={t("tipReloadAll")} onClick={props.onReloadAll}><ReloadIcon size={17} /></IconButton>
      <IconButton
        label={t("compareWithDesign")}
        tooltip={t("tipCompare")}
        pressed={props.compare}
        onClick={props.onCompare}
        className={props.compare ? "border-design-line bg-design-soft text-design-ink hover:bg-design-soft" : undefined}
      >
        <CompareIcon size={16} />
      </IconButton>
      <IconButton data-tour="screenshot" label={t("captureAndAnnotate")} tooltip={t("tipScreenshot")} onClick={props.onCapture} disabled={props.capturing}><CameraIcon size={16} /></IconButton>
      <IconButton ref={props.fixRef} data-tour="fix-prompt" label={t("fixPrompt")} tooltip={t("tipFixPrompt")} pressed={props.fixOpen} aria-expanded={props.fixOpen} onClick={props.onFixPrompt}><FixPromptIcon size={16} /></IconButton>
      <span className="relative shrink-0">
        <IconButton data-tour="layout-check" data-layout-check-toggle label={props.layoutCount > 0 ? `${t("checkLayout")} · ${props.layoutCount}` : t("checkLayout")} tooltip={t("tipCheckLayout")} pressed={props.layoutOpen} aria-expanded={props.layoutOpen} onClick={props.onLayoutCheck}>
          {props.layoutChecking
            ? <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-accent-line border-t-accent motion-reduce:animate-none" />
            : <LayoutCheckIcon size={16} />}
        </IconButton>
        {props.layoutCount > 0 && (
          <span aria-hidden="true" className="pointer-events-none absolute -end-1.5 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-surface bg-red-500 px-1 font-mono text-[10px] font-bold text-white">{props.layoutCount}</span>
        )}
      </span>
      <IconButton ref={props.recordRef} data-tour="record" label={t("record")} tooltip={t("tipRecord")} tooltipAlign="end" pressed={props.recordOpen} aria-expanded={props.recordOpen} onClick={props.onRecord}>
        <RecordIcon size={16} active={props.recordingActive} />
      </IconButton>
      <Divider />

      <Tooltip title={t("viewMode")} description={t("tipFocusMode")} align="end">
        <button
          type="button"
          data-view-only-toggle
          aria-label={t("viewMode")}
          onClick={props.onViewMode}
          className={cx("flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-2.5 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}
        >
          <EyeIcon size={16} />
          {level < 1 && <span>{t("viewMode")}</span>}
        </button>
      </Tooltip>
      <IconButton ref={props.settingsRef} label={t("settings")} tooltip={t("tipSettings")} tooltipAlign="end" pressed={props.settingsOpen} aria-expanded={props.settingsOpen} onClick={props.onSettings}><SettingsIcon size={16} /></IconButton>
      <IconButton label={t("closeViewer")} tooltip={t("tipCloseViewer")} tooltipAlign="end" onClick={props.onClose}><CloseIcon size={18} /></IconButton>
    </header>
  );
}

function CountBadge({ active = false, children }: { active?: boolean; children: ReactNode }) {
  return (
    <span className={cx("rounded-[5px] px-1.5 py-px font-mono text-[11.5px] font-semibold", active ? "bg-accent text-on-accent" : "bg-line text-ink-2")}>
      {children}
    </span>
  );
}

function SyncCheckbox({ label, icon, title, description, checked, onChange }: { label: string; icon?: ReactNode; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Tooltip title={title} description={description}>
      <SyncCheckboxControl label={label} icon={icon} checked={checked} onChange={onChange} />
    </Tooltip>
  );
}

// Receives the tooltip's aria-describedby so the checkbox itself is described.
function SyncCheckboxControl({ label, icon, checked, onChange, "aria-describedby": describedBy }: { label: string; icon?: ReactNode; checked: boolean; onChange: (checked: boolean) => void; "aria-describedby"?: string }) {
  return (
    <label className={cx(
      "flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 text-[12.5px] font-semibold text-ink has-focus-visible:ring-2 has-focus-visible:ring-accent",
      checked && "bg-accent-soft",
    )}>
      <input type="checkbox" checked={checked} aria-describedby={describedBy} onChange={event => onChange(event.target.checked)} className="size-[15px] cursor-pointer accent-accent outline-none" />
      {icon ? <>{icon}<span className="sr-only">{label}</span></> : label}
    </label>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-0.5 h-[22px] w-px shrink-0 bg-line" />;
}
