import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import {
  AlertIcon,
  BugIcon,
  CameraIcon,
  CompareIcon,
  EyeIcon,
  FixPromptIcon,
  LayoutCheckIcon,
  LinkIcon,
  PlusIcon,
  ReloadIcon,
  SettingsIcon,
} from "../icons";
import { cx, Tooltip } from "./ui";

/** Dock items whose menu opens while the pointer rests on them. */
export type DockMenu = "add" | "capture" | "settings";

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
  /** A tab video or a user flow is recording: a red dot on Capture, whose menu holds the controls. */
  recordingActive: boolean;
  /** Track changes is on: a dot on Capture, whose menu holds the switch. */
  tracking: boolean;
  captureRef: RefObject<HTMLButtonElement | null>;
  captureOpen: boolean;
  /** The fix prompt opens over the Issues item. */
  fixRef: RefObject<HTMLButtonElement | null>;
  fixOpen: boolean;
  layoutOpen: boolean;
  layoutChecking: boolean;
  layoutCount: number;
  problemsOpen: boolean;
  problemsCount: number;
  settingsRef: RefObject<HTMLButtonElement | null>;
  settingsOpen: boolean;
  onReloadAll: () => void;
  onWorkspace: () => void;
  onShowOne: () => void;
  onAllDevices: () => void;
  onAdd: () => void;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
  onCapture: () => void;
  onCompare: () => void;
  onProblems: () => void;
  onLayoutCheck: () => void;
  onFixPrompt: () => void;
  onViewMode: () => void;
  onSettings: () => void;
  /** The pointer rested on a dock item with a menu, or left it (`null`). */
  onMenuHover: (menu: DockMenu | null) => void;
}

// Labels drop in stages until the dock fits, so long translations and narrow
// windows never push controls off screen: 1 drops the view names (their counts
// stay), 2 the Add label. Every control keeps its accessible name and tooltip.
const MAX_COMPACT = 2;

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
  // Measures only the dock's own items: an open menu hangs above the dock and
  // must not count as overflow.
  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav || level >= MAX_COMPACT) return;
    const style = getComputedStyle(nav);
    const items = Array.from(nav.children) as HTMLElement[];
    const gap = Number.parseFloat(style.columnGap) || 0;
    const used = items.reduce((sum, item) => {
      const margins = getComputedStyle(item);
      return sum + item.getBoundingClientRect().width + (Number.parseFloat(margins.marginLeft) || 0) + (Number.parseFloat(margins.marginRight) || 0);
    }, 0) + gap * Math.max(0, items.length - 1)
      + (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
    if (used > nav.clientWidth + 1) setLevel(level + 1);
  });
  return { ref, level };
}

// The one control surface of the workspace: a light pill above the devices.
// Its groups read left to right as what you see (the views), what you do with
// it (reload, sync, capture, compare, issues), the viewer itself (focus mode,
// settings) and Add. Menus open while the pointer rests on an item and act on
// one click; a click also opens them, so the keyboard and touch work the same way.
export function WorkspaceDock(props: WorkspaceDockProps & { end?: ReactNode }) {
  const { t, locale } = useI18n();
  const { ref, level } = useDockCompaction(locale);
  const hover = (menu: DockMenu) => ({
    onPointerEnter: (event: React.PointerEvent) => { if (event.pointerType === "mouse") props.onMenuHover(menu); },
    onPointerLeave: (event: React.PointerEvent) => { if (event.pointerType === "mouse") props.onMenuHover(null); },
  });

  return (
    <div className="relative z-30 flex shrink-0 justify-center px-14 pt-4">
      <nav
        ref={ref}
        data-main-toolbar
        data-compact={level || undefined}
        aria-label={PRODUCT_SHORT_NAME}
        className="flex h-11 max-w-full items-center gap-1 rounded-full bg-surface px-[5px] text-ink shadow-[0_0_0_1px_var(--color-line-soft),0_10px_28px_rgb(20_23_26/0.08)] dark:shadow-[0_0_0_1px_var(--color-line),0_10px_28px_rgb(0_0_0/0.4)]"
      >
        <div role="group" aria-label={t("views")} className="flex shrink-0 items-center gap-1">
          {/* The current view; clicking it again opens the Add device picker here too. */}
          <Tooltip title={t("workspace")} description={t("tipAddDevice")} align="start">
            <button
              ref={props.workspaceRef}
              type="button"
              data-workspace-toggle
              aria-current={props.showingOne ? undefined : "page"}
              aria-haspopup="dialog"
              aria-expanded={props.workspaceOpen}
              aria-label={t("workspace")}
              onClick={props.onWorkspace}
              className={cx(viewButton, !props.showingOne ? viewOn : viewOff, props.workspaceOpen && "ring-2 ring-[#8e7de0] ring-offset-1 ring-offset-surface")}
            >
              {level < 1 && <span>{t("workspace")}</span>}
              <span className="font-mono text-[11px] font-medium opacity-70">{props.slotCount}</span>
            </button>
          </Tooltip>
          <Tooltip title={t("focusDevice")} align="center">
            <button type="button" aria-pressed={props.showingOne} aria-label={t("focusDevice")} onClick={props.onShowOne}
              className={cx(viewButton, props.showingOne ? viewOn : viewOff)}>
              {t("viewOne")}
            </button>
          </Tooltip>
          <Tooltip title={t("allDevices")} description={t("tipAllDevices")} align="center">
            <button type="button" data-all-devices-toggle onClick={props.onAllDevices} disabled={props.capturing} aria-label={t("allDevices")}
              className={cx(viewButton, viewOff, "disabled:opacity-40")}>
              {level < 1 && <span>{t("viewAll")}</span>}
              <span className="font-mono text-[11px] font-medium opacity-70">{props.catalogCount}</span>
            </button>
          </Tooltip>
        </div>

        <DockDivider />

        <DockButton label={t("reloadAll")} tooltip={t("tipReloadAll")} onClick={props.onReloadAll}>
          <ReloadIcon size={16} />
        </DockButton>
        <SyncControl
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
          tooltip={props.tracking ? t("trackTip") : `${t("tipScreenshot")} ${t("tipRecord")}`}
          active={props.captureOpen}
          expanded={props.captureOpen}
          disabled={props.capturing}
          onClick={props.onCapture}
          dot={props.recordingActive ? "var(--color-record)" : props.tracking ? "#8e7de0" : undefined}
          hoverHandlers={hover("capture")}
        >
          <CameraIcon size={16} />
        </DockButton>
        <DockButton label={t("design")} ariaLabel={t("compareWithDesign")} tooltip={t("tipCompare")}
          active={props.compare} pressed={props.compare} onClick={props.onCompare}>
          <CompareIcon size={16} />
        </DockButton>
        <IssuesControl {...props} />
        <DockButton data-view-only-toggle label={t("viewMode")} tooltip={t("tipFocusMode")} onClick={props.onViewMode}>
          <EyeIcon size={16} />
        </DockButton>
        <DockButton buttonRef={props.settingsRef} label={t("settings")} tooltip={t("tipSettings")} active={props.settingsOpen} expanded={props.settingsOpen}
          onClick={props.onSettings} hoverHandlers={hover("settings")} align="end">
          <SettingsIcon size={16} />
        </DockButton>

        <Tooltip title={t("addDevice")} description={props.canAdd ? t("tipAddDevice") : t("slotsFull", { count: 4 })} align="end">
          <button
            ref={props.addRef}
            type="button"
            data-tour="add-viewport"
            aria-expanded={props.addOpen}
            aria-label={t("addDevice")}
            onClick={props.onAdd}
            {...hover("add")}
            className={cx(
              "ms-1 flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary pe-[13px] ps-[11px] text-[12.5px] font-semibold text-on-primary outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent",
              props.addOpen && "ring-[3px] ring-[#8e7de0]/60",
            )}
          >
            <PlusIcon size={14} strokeWidth={2.6} />
            {level < 2 && <span>{t("add")}</span>}
          </button>
        </Tooltip>
      </nav>
      {props.end}
    </div>
  );
}

const viewButton = "flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent";
const viewOn = "bg-primary text-on-primary";
const viewOff = "text-ink hover:bg-sunken";
// The tools are icons, named in their tooltips; only the views and Add carry text.
const dockItem = "relative grid size-[34px] shrink-0 place-items-center rounded-full text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40";

type DataAttributes = { [key: `data-${string}`]: string | boolean | undefined };
type HoverHandlers = { onPointerEnter: (event: React.PointerEvent) => void; onPointerLeave: (event: React.PointerEvent) => void };

function DockButton({ label, ariaLabel, tooltip, active, pressed, expanded, disabled, badge, dot, align = "center", buttonRef, hoverHandlers, onClick, children, ...data }: {
  label: string;
  ariaLabel?: string;
  tooltip?: string;
  active?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  badge?: number;
  dot?: string;
  align?: "start" | "center" | "end";
  buttonRef?: RefObject<HTMLButtonElement | null>;
  hoverHandlers?: HoverHandlers;
  onClick: () => void;
  children: ReactNode;
} & DataAttributes) {
  return (
    <Tooltip title={ariaLabel ?? label} description={tooltip} align={align}>
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
        className={cx(dockItem, active && "bg-sunken")}
      >
        <span className="relative grid place-items-center">
          {children}
          <Marks badge={badge} dot={dot} />
        </span>
      </button>
    </Tooltip>
  );
}

function Marks({ badge, dot }: { badge?: number; dot?: string }) {
  return <>
    {badge ? (
      <span aria-hidden="true" className="pointer-events-none absolute -end-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-surface">{badge}</span>
    ) : null}
    {dot && <span aria-hidden="true" data-track-dot className="pointer-events-none absolute -end-1 -top-1 size-[7px] rounded-full ring-2 ring-surface" style={{ background: dot }} />}
  </>;
}

// A small menu that opens while the pointer rests on its item, or while focus
// is inside it, and stays open while the pointer is over it.
function useRestingMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const show = () => { window.clearTimeout(timer.current); setOpen(true); };
  const hide = (delay: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), delay); };
  const handlers = {
    onPointerEnter: (event: React.PointerEvent) => { if (event.pointerType === "mouse") show(); },
    onPointerLeave: (event: React.PointerEvent) => { if (event.pointerType === "mouse") hide(250); },
    onFocus: show,
    onBlur: (event: React.FocusEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide(0); },
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Escape" && open) { event.stopPropagation(); hide(0); } },
  };
  return { open, setOpen, hide, handlers };
}

function DockMenuPanel({ label, width, children }: { label: string; width: string; children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-full z-[60] -translate-x-1/2 pt-3">
      <div role="group" aria-label={label} className={cx("flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-popover", width)}>
        {children}
      </div>
    </div>
  );
}

// Sync: one click turns it on or off for everything; resting on it (or
// tabbing into it) shows Scroll and Navigation separately.
function SyncControl({ scrollSync, navigationSync, onScrollSyncChange, onNavigationSyncChange }: {
  scrollSync: boolean;
  navigationSync: boolean;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
}) {
  const { t } = useI18n();
  const menu = useRestingMenu();
  const on = scrollSync || navigationSync;
  return (
    <div data-tour="sync" className="relative shrink-0" {...menu.handlers}>
      <button
        type="button"
        aria-label={t("syncBetweenDevices")}
        aria-pressed={on}
        title={t("syncBetweenDevicesHint")}
        onClick={() => { onScrollSyncChange(!on); onNavigationSyncChange(!on); }}
        className={cx(dockItem, menu.open && "bg-sunken")}
      >
        {/* Off reads as an ordinary control; on adds a green light. */}
        <span className="relative grid place-items-center">
          <LinkIcon size={16} />
          {on && <span aria-hidden="true" data-sync-on className="pointer-events-none absolute -end-1 -top-1 size-1.5 rounded-full bg-[#16a34a] ring-2 ring-surface" />}
        </span>
      </button>
      {menu.open && (
        <DockMenuPanel label={t("syncBetweenDevices")} width="w-60">
          <p className="px-2 pb-1 pt-1 text-xs text-muted">{t("syncBetweenDevicesHint")}</p>
          <SyncRow label={t("scroll")} hint={t("scrollSyncHint")} checked={scrollSync} onChange={onScrollSyncChange} />
          <SyncRow label={t("navigation")} hint={t("navigationSyncHint")} checked={navigationSync} onChange={onNavigationSyncChange} />
        </DockMenuPanel>
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

// Issues: what went wrong on the devices, in one place. Resting on it lists
// the problems (script errors and failed requests), the layout check and the
// fix prompt, each one click away; its badge counts both kinds of problem.
function IssuesControl(props: WorkspaceDockProps) {
  const { t } = useI18n();
  const menu = useRestingMenu();
  const total = props.problemsCount + (FEATURES.layoutCheck ? props.layoutCount : 0);
  const run = (action: () => void) => () => { menu.hide(0); action(); };
  const active = menu.open || props.problemsOpen || props.layoutOpen || props.fixOpen;
  return (
    <div data-tour="layout-check" className="relative shrink-0" {...menu.handlers}>
      <Tooltip title={t("issues")} align="center">
        <button
          ref={props.fixRef}
          type="button"
          data-tour="fix-prompt"
          data-issues-toggle
          aria-label={total > 0 ? `${t("issues")} · ${total}` : t("issues")}
          aria-expanded={menu.open}
          onClick={() => menu.setOpen(open => !open)}
          className={cx(dockItem, active && "bg-sunken")}
        >
          <span className="relative grid place-items-center">
            {props.layoutChecking
              ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none" />
              : <AlertIcon size={16} />}
            <Marks badge={total} />
          </span>
        </button>
      </Tooltip>
      {menu.open && (
        <DockMenuPanel label={t("issues")} width="w-72">
          <IssueRow data-problems-toggle icon={<BugIcon size={15} />} label={t("problemsTitle")} hint={t("problemsTip")} count={props.problemsCount}
            pressed={props.problemsOpen} onClick={run(props.onProblems)} />
          {FEATURES.layoutCheck && (
            <IssueRow data-layout-check-toggle icon={<LayoutCheckIcon size={15} />} label={t("checkLayout")} hint={t("tipCheckLayout")} count={props.layoutCount}
              pressed={props.layoutOpen} busy={props.layoutChecking} onClick={run(props.onLayoutCheck)} />
          )}
          <IssueRow icon={<FixPromptIcon size={15} />} label={t("fixPrompt")} hint={t("tipFixPrompt")} pressed={props.fixOpen} onClick={run(props.onFixPrompt)} />
        </DockMenuPanel>
      )}
    </div>
  );
}

function IssueRow({ icon, label, hint, count, pressed, busy, onClick, ...data }: {
  icon: ReactNode;
  label: string;
  hint: string;
  count?: number;
  pressed?: boolean;
  busy?: boolean;
  onClick: () => void;
} & DataAttributes) {
  return (
    <button type="button" aria-pressed={pressed} aria-label={count ? `${label} · ${count}` : label} title={hint} onClick={onClick} {...data}
      className={cx("flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-start outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent", pressed && "bg-sunken")}>
      <span className="mt-px grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="text-xs leading-snug text-muted">{hint}</span>
      </span>
      {busy
        ? <span aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 animate-spin rounded-full border-2 border-accent-line border-t-accent motion-reduce:animate-none" />
        : count ? <span className="mt-px grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-red-500/10 px-1.5 font-mono text-[11px] font-bold text-danger">{count}</span> : null}
    </button>
  );
}

function DockDivider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line-soft" />;
}
