import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import {
  BugIcon,
  CameraIcon,
  CloseIcon,
  CompareIcon,
  EyeIcon,
  FixPromptIcon,
  LayoutCheckIcon,
  LinkIcon,
  PlusIcon,
  RecordIcon,
  ReloadIcon,
  SettingsIcon,
} from "../icons";
import { cx, Tooltip } from "./ui";

/** Dock items whose menu opens while the pointer rests on them. */
export type DockMenu = "add" | "capture" | "record" | "fix" | "settings";

export interface WorkspaceDockProps {
  slotCount: number;
  catalogCount: number;
  canAdd: boolean;
  addRef: RefObject<HTMLButtonElement | null>;
  addOpen: boolean;
  workspaceRef: RefObject<HTMLButtonElement | null>;
  workspaceOpen: boolean;
  /** One device fills the space (focus on one device). */
  showingOne: boolean;
  scrollSync: boolean;
  navigationSync: boolean;
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
  problemsOpen: boolean;
  problemsCount: number;
  /** Track changes is on: a dot on the camera, whose menu holds the switch. */
  tracking: boolean;
  captureRef: RefObject<HTMLButtonElement | null>;
  captureOpen: boolean;
  settingsRef: RefObject<HTMLButtonElement | null>;
  settingsOpen: boolean;
  onProblems: () => void;
  onAllDevices: () => void;
  onAdd: () => void;
  onWorkspace: () => void;
  onShowOne: () => void;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
  onReloadAll: () => void;
  onCompare: () => void;
  onCapture: () => void;
  onFixPrompt: () => void;
  onLayoutCheck: () => void;
  onRecord: () => void;
  onViewMode: () => void;
  onSettings: () => void;
  onClose: () => void;
  /** The pointer rested on a dock item with a menu, or left it (`null`). */
  onMenuHover: (menu: DockMenu | null) => void;
}

// Labels drop in stages until the dock fits, so long translations and narrow
// windows never push controls off screen: 1 shows the tools as icons, 2 drops
// the view names (their counts stay), 3 the Add label. Every control keeps its
// accessible name and tooltip.
const MAX_COMPACT = 3;

function useDockCompaction(locale: string) {
  const ref = useRef<HTMLElement>(null);
  const [level, setLevel] = useState(0);
  useLayoutEffect(() => setLevel(0), [locale]);
  useLayoutEffect(() => {
    const dock = ref.current?.parentElement;
    if (!dock) return;
    let width = dock.clientWidth;
    const observer = new ResizeObserver(() => {
      if (dock.clientWidth === width) return;
      width = dock.clientWidth;
      setLevel(0);
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const nav = ref.current;
    if (nav && level < MAX_COMPACT && nav.scrollWidth > nav.clientWidth + 1) setLevel(level + 1);
  });
  return { ref, level };
}

// The one control surface of the workspace: a dark dock under the devices.
// Menus open while the pointer rests on an item and act on one click; a click
// also opens them, so the keyboard and touch work the same way.
export function WorkspaceDock(props: WorkspaceDockProps) {
  const { t, locale } = useI18n();
  const { ref, level } = useDockCompaction(locale);
  const iconsOnly = level >= 1;
  const hover = (menu: DockMenu) => ({
    onPointerEnter: (event: React.PointerEvent) => { if (event.pointerType === "mouse") props.onMenuHover(menu); },
    onPointerLeave: (event: React.PointerEvent) => { if (event.pointerType === "mouse") props.onMenuHover(null); },
  });

  return (
    <div className="relative z-30 flex shrink-0 justify-center px-3 pb-3 pt-1.5">
      <nav
        ref={ref}
        data-main-toolbar
        data-compact={level || undefined}
        aria-label={PRODUCT_SHORT_NAME}
        className="flex h-[62px] max-w-full items-center gap-1 rounded-[20px] bg-[#1a1c20] px-[7px] text-[#e6e8eb] shadow-[0_18px_44px_rgb(20_23_26/0.28),inset_0_0_0_1px_rgb(255_255_255/0.06)] dark:bg-[#20242b] dark:shadow-[0_18px_44px_rgb(0_0_0/0.5),inset_0_0_0_1px_rgb(255_255_255/0.1)]"
      >
        <DockButton label={t("reloadAll")} tooltip={t("tipReloadAll")} iconsOnly={iconsOnly} onClick={props.onReloadAll} align="start">
          <ReloadIcon size={18} />
        </DockButton>

        <DockDivider />

        <div role="group" aria-label={t("views")} className="flex h-12 shrink-0 items-center gap-0.5 rounded-[14px] bg-white/[0.08] p-1">
          {/* The current view; clicking it again opens the Add device picker here too. */}
          <Tooltip title={t("workspace")} description={t("tipAddDevice")} align="start" side="top">
            <button
              ref={props.workspaceRef}
              type="button"
              data-workspace-toggle
              aria-current={props.showingOne ? undefined : "page"}
              aria-haspopup="dialog"
              aria-expanded={props.workspaceOpen}
              aria-label={t("workspace")}
              onClick={props.onWorkspace}
              className={cx(viewButton, !props.showingOne ? viewOn : viewOff, props.workspaceOpen && "ring-2 ring-[#8e7de0]")}
            >
              {level < 2 && <span>{t("workspace")}</span>}
              <span className={cx("font-mono text-[11.5px] font-medium", !props.showingOne ? "text-[#575e66]" : "text-[#a3a9b1]")}>{props.slotCount}</span>
            </button>
          </Tooltip>
          <Tooltip title={t("focusDevice")} align="center" side="top">
            <button type="button" aria-pressed={props.showingOne} aria-label={t("focusDevice")} onClick={props.onShowOne}
              className={cx(viewButton, props.showingOne ? viewOn : viewOff)}>
              {t("viewOne")}
            </button>
          </Tooltip>
          <Tooltip title={t("allDevices")} description={t("tipAllDevices")} align="center" side="top">
            <button type="button" data-all-devices-toggle onClick={props.onAllDevices} disabled={props.capturing} aria-label={t("allDevices")}
              className={cx(viewButton, viewOff, "disabled:opacity-40")}>
              {level < 2 && <span>{t("viewAll")}</span>}
              <span className="font-mono text-[11.5px] font-medium text-[#a3a9b1]">{props.catalogCount}</span>
            </button>
          </Tooltip>
        </div>

        <DockDivider />

        <Tooltip title={t("addDevice")} description={props.canAdd ? t("tipAddDevice") : t("slotsFull", { count: 4 })} align="center" side="top">
          <button
            ref={props.addRef}
            type="button"
            data-tour="add-viewport"
            aria-expanded={props.addOpen}
            aria-label={t("addDevice")}
            onClick={props.onAdd}
            {...hover("add")}
            className={cx(
              "me-1 flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3.5 text-[13px] font-semibold text-[#14171a] outline-none hover:bg-[#f1f2f4] focus-visible:ring-2 focus-visible:ring-accent",
              props.addOpen && "ring-[3px] ring-[#8e7de0]/60",
            )}
          >
            <PlusIcon size={16} strokeWidth={2.5} />
            {level < 3 && <span>{t("addDevice")}</span>}
          </button>
        </Tooltip>

        <SyncControl
          iconsOnly={iconsOnly}
          scrollSync={props.scrollSync}
          navigationSync={props.navigationSync}
          onScrollSyncChange={props.onScrollSyncChange}
          onNavigationSyncChange={props.onNavigationSyncChange}
        />

        <DockButton
          buttonRef={props.captureRef}
          data-tour="screenshot"
          data-capture-toggle
          label={t("captureMenu")}
          ariaLabel={props.tracking ? `${t("captureMenu")} · ${t("trackChanges")}` : t("captureAndAnnotate")}
          tooltip={props.tracking ? t("trackTip") : t("tipScreenshot")}
          iconsOnly={iconsOnly}
          active={props.captureOpen}
          expanded={props.captureOpen}
          disabled={props.capturing}
          onClick={props.onCapture}
          dot={props.tracking ? "#8e7de0" : undefined}
          hoverHandlers={hover("capture")}
        >
          <CameraIcon size={18} />
        </DockButton>
        <DockButton buttonRef={props.recordRef} data-tour="record" label={t("record")} tooltip={t("tipRecord")} iconsOnly={iconsOnly}
          active={props.recordOpen} expanded={props.recordOpen} onClick={props.onRecord} hoverHandlers={hover("record")}>
          <RecordIcon size={18} active={props.recordingActive} />
        </DockButton>
        <DockButton label={t("design")} ariaLabel={t("compareWithDesign")} tooltip={t("tipCompare")} iconsOnly={iconsOnly}
          active={props.compare} pressed={props.compare} onClick={props.onCompare}>
          <CompareIcon size={18} />
        </DockButton>
        <DockButton buttonRef={props.fixRef} data-tour="fix-prompt" label={t("fixPrompt")} tooltip={t("tipFixPrompt")} iconsOnly={iconsOnly}
          active={props.fixOpen} expanded={props.fixOpen} onClick={props.onFixPrompt} hoverHandlers={hover("fix")}>
          <FixPromptIcon size={18} />
        </DockButton>
        {FEATURES.layoutCheck && (
          <DockButton data-tour="layout-check" data-layout-check-toggle label={t("checkLayout")}
            ariaLabel={props.layoutCount > 0 ? `${t("checkLayout")} · ${props.layoutCount}` : t("checkLayout")}
            tooltip={t("tipCheckLayout")} iconsOnly={iconsOnly} active={props.layoutOpen} expanded={props.layoutOpen}
            onClick={props.onLayoutCheck} badge={props.layoutCount}>
            {props.layoutChecking
              ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
              : <LayoutCheckIcon size={18} />}
          </DockButton>
        )}
        <DockButton data-problems-toggle label={t("problemsTitle")}
          ariaLabel={props.problemsCount > 0 ? `${t("problemsTitle")} · ${props.problemsCount}` : t("problemsTitle")}
          tooltip={t("problemsTip")} iconsOnly={iconsOnly} active={props.problemsOpen} expanded={props.problemsOpen}
          onClick={props.onProblems} badge={props.problemsCount}>
          <BugIcon size={18} />
        </DockButton>

        <DockDivider />

        <DockButton data-view-only-toggle label={t("viewMode")} tooltip={t("tipFocusMode")} iconsOnly={iconsOnly} onClick={props.onViewMode} align="end">
          <EyeIcon size={18} />
        </DockButton>
        <DockButton buttonRef={props.settingsRef} label={t("settings")} tooltip={t("tipSettings")} iconsOnly={iconsOnly}
          active={props.settingsOpen} expanded={props.settingsOpen} onClick={props.onSettings} hoverHandlers={hover("settings")} align="end">
          <SettingsIcon size={18} />
        </DockButton>
        <Tooltip title={t("closeViewer")} description={t("tipCloseViewer")} align="end" side="top">
          <button type="button" aria-label={t("closeViewer")} onClick={props.onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[#a3a9b1] outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent">
            <CloseIcon size={17} />
          </button>
        </Tooltip>
      </nav>
    </div>
  );
}

const viewButton = "flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent";
const viewOn = "bg-white text-[#14171a]";
const viewOff = "text-[#e6e8eb] hover:bg-white/10";

type DataAttributes = { [key: `data-${string}`]: string | boolean | undefined };

function DockButton({ label, ariaLabel, tooltip, iconsOnly, active, pressed, expanded, disabled, badge, dot, align = "center", buttonRef, hoverHandlers, onClick, children, ...data }: {
  label: string;
  ariaLabel?: string;
  tooltip?: string;
  iconsOnly: boolean;
  active?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  badge?: number;
  dot?: string;
  align?: "start" | "center" | "end";
  buttonRef?: RefObject<HTMLButtonElement | null>;
  hoverHandlers?: { onPointerEnter: (event: React.PointerEvent) => void; onPointerLeave: (event: React.PointerEvent) => void };
  onClick: () => void;
  children: ReactNode;
} & DataAttributes) {
  return (
    <Tooltip title={ariaLabel ?? label} description={tooltip} align={align} side="top">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel ?? label}
        aria-pressed={pressed}
        aria-expanded={expanded}
        disabled={disabled}
        onClick={onClick}
        {...hoverHandlers}
        {...data}
        className={cx(
          "relative flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold leading-none text-[#f3f4f6] outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40",
          iconsOnly ? "size-11" : "h-[50px] min-w-[58px] px-1.5",
          active && "bg-white/[0.14]",
        )}
      >
        {children}
        {!iconsOnly && <span className="whitespace-nowrap">{label}</span>}
        {badge ? (
          <span aria-hidden="true" className="pointer-events-none absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-[#1a1c20]">{badge}</span>
        ) : null}
        {dot && <span aria-hidden="true" data-track-dot className="pointer-events-none absolute end-3 top-1.5 size-[7px] rounded-full ring-2 ring-[#1a1c20]" style={{ background: dot }} />}
      </button>
    </Tooltip>
  );
}

// Sync: one click turns it on or off for everything; resting on it (or
// tabbing into it) shows Scroll and Navigation separately.
function SyncControl({ iconsOnly, scrollSync, navigationSync, onScrollSyncChange, onNavigationSyncChange }: {
  iconsOnly: boolean;
  scrollSync: boolean;
  navigationSync: boolean;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const on = scrollSync || navigationSync;
  const show = () => { window.clearTimeout(timer.current); setOpen(true); };
  const hide = (delay: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), delay); };
  return (
    <div
      data-tour="sync"
      className="relative shrink-0"
      onPointerEnter={event => { if (event.pointerType === "mouse") show(); }}
      onPointerLeave={event => { if (event.pointerType === "mouse") hide(250); }}
      onFocus={show}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide(0); }}
      onKeyDown={event => { if (event.key === "Escape" && open) { event.stopPropagation(); hide(0); } }}
    >
      <button
        type="button"
        aria-label={t("syncBetweenDevices")}
        aria-pressed={on}
        title={t("syncBetweenDevicesHint")}
        onClick={() => { onScrollSyncChange(!on); onNavigationSyncChange(!on); }}
        className={cx(
          "relative flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold leading-none outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent",
          on ? "text-[#f3f4f6]" : "text-[#a3a9b1]",
          iconsOnly ? "size-11" : "h-[50px] min-w-[58px] px-1.5",
          open && "bg-white/[0.14]",
        )}
      >
        <LinkIcon size={18} />
        {!iconsOnly && <span className="whitespace-nowrap">{t("sync")}</span>}
        <span aria-hidden="true" className={cx("pointer-events-none absolute end-3 top-1.5 size-[7px] rounded-full ring-2 ring-[#1a1c20]", on ? "bg-[#7bd88f]" : "bg-[#6b7178]")} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-[60] -translate-x-1/2 pb-3">
          <div role="group" aria-label={t("syncBetweenDevices")} className="flex w-60 flex-col gap-0.5 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-popover">
            <p className="px-2 pb-1 pt-1 text-xs text-muted">{t("syncBetweenDevicesHint")}</p>
            <SyncRow label={t("scroll")} hint={t("scrollSyncHint")} checked={scrollSync} onChange={onScrollSyncChange} />
            <SyncRow label={t("navigation")} hint={t("navigationSyncHint")} checked={navigationSync} onChange={onNavigationSyncChange} />
          </div>
        </div>
      )}
    </div>
  );
}

function SyncRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label title={hint} className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[13px] font-semibold hover:bg-sunken has-focus-visible:ring-2 has-focus-visible:ring-accent">
      <span className="flex-1">{label}</span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-4 cursor-pointer accent-accent outline-none" />
    </label>
  );
}

function DockDivider() {
  return <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-white/[0.12]" />;
}
