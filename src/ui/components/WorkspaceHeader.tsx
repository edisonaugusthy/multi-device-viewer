import type { ReactNode, RefObject } from "react";
import { useI18n } from "../../app/i18n";
import {
  CameraIcon,
  CloseIcon,
  CompareIcon,
  EyeIcon,
  FixPromptIcon,
  GridIcon,
  LinkIcon,
  PlusIcon,
  RecordIcon,
  ReloadIcon,
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
  settingsRef: RefObject<HTMLButtonElement | null>;
  settingsOpen: boolean;
  onAllDevices: () => void;
  onAdd: () => void;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
  onFreeViewChange: (free: boolean) => void;
  onReloadAll: () => void;
  onCompare: () => void;
  onCapture: () => void;
  onFixPrompt: () => void;
  onRecord: () => void;
  onViewMode: () => void;
  onSettings: () => void;
  onClose: () => void;
}

const wideOnly = "hidden @min-[1160px]/header:inline";

export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  const { t } = useI18n();
  return (
    <header data-main-toolbar className="@container/header relative z-30 flex h-[52px] shrink-0 items-center gap-1.5 border-b border-line bg-surface px-2.5">
      <BrandMark size={28} />

      <nav aria-label={t("views")} className="flex shrink-0 rounded-[10px] bg-sunken p-[3px]">
        <span aria-current="page" className="flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-surface px-2.5 text-[13px] font-semibold text-ink shadow-lift">
          <WorkspaceIcon size={15} />
          <span className={wideOnly}>{t("workspace")}</span>
          <CountBadge active>{props.slotCount}</CountBadge>
        </span>
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
            <span className={wideOnly}>{t("allDevices")}</span>
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
          <span className={wideOnly}>{t("addDevice")}</span>
        </button>
      </Tooltip>

      <div className="min-w-2 flex-1" />

      <div role="group" data-tour="sync" aria-label={t("syncBetweenDevices")}
        className="flex h-[34px] shrink-0 items-center gap-0.5 rounded-[9px] border border-line pe-1 ps-2.5">
        <Tooltip title={t("syncBetweenDevices")} description={t("syncBetweenDevicesHint")}>
          <span className="flex items-center">
            <LinkIcon size={15} className="text-ink-2" />
            <span className="pe-1.5 ps-1 text-[12.5px] font-semibold text-ink-2">{t("sync")}</span>
          </span>
        </Tooltip>
        <SyncCheckbox label={t("scroll")} title={t("scrollSync")} description={t("scrollSyncHint")} checked={props.scrollSync} onChange={props.onScrollSyncChange} />
        <SyncCheckbox label={t("navigation")} title={t("navigationSync")} description={t("navigationSyncHint")} checked={props.navigationSync} onChange={props.onNavigationSyncChange} />
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
      <IconButton label={t("captureAndAnnotate")} tooltip={t("tipScreenshot")} onClick={props.onCapture} disabled={props.capturing}><CameraIcon size={16} /></IconButton>
      <IconButton ref={props.fixRef} label={t("fixPrompt")} tooltip={t("tipFixPrompt")} pressed={props.fixOpen} aria-expanded={props.fixOpen} onClick={props.onFixPrompt}><FixPromptIcon size={16} /></IconButton>
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
          <span className={wideOnly}>{t("viewMode")}</span>
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

function SyncCheckbox({ label, title, description, checked, onChange }: { label: string; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Tooltip title={title} description={description}>
      <SyncCheckboxControl label={label} checked={checked} onChange={onChange} />
    </Tooltip>
  );
}

// Receives the tooltip's aria-describedby so the checkbox itself is described.
function SyncCheckboxControl({ label, checked, onChange, "aria-describedby": describedBy }: { label: string; checked: boolean; onChange: (checked: boolean) => void; "aria-describedby"?: string }) {
  return (
    <label className={cx(
      "flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 text-[12.5px] font-semibold text-ink has-focus-visible:ring-2 has-focus-visible:ring-accent",
      checked && "bg-accent-soft",
    )}>
      <input type="checkbox" checked={checked} aria-describedby={describedBy} onChange={event => onChange(event.target.checked)} className="size-[15px] cursor-pointer accent-accent outline-none" />
      {label}
    </label>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-0.5 h-[22px] w-px shrink-0 bg-line" />;
}
