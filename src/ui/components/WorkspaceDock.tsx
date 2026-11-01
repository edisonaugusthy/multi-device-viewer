import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import {
  AlertIcon,
  BugIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompareIcon,
  EyeIcon,
  FixPromptIcon,
  LayoutCheckIcon,
  LinkIcon,
  NavigationSyncIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReloadIcon,
  ScrollSyncIcon,
  SettingsIcon,
} from "../icons";
import { cx, Tooltip } from "./ui";

/** Dock items whose menu opens while the pointer rests on them. */
export type DockMenu = "add" | "capture" | "settings";

/** All devices is showing: the bar's tools act on its previews. */
export interface GalleryBar {
  loaded: number;
  total: number;
  /** Previews that did not finish loading and can be tried again. */
  incomplete: number;
  paused: boolean;
  speed: "fast" | "gentle";
  onTogglePause: () => void;
  onSpeedChange: (speed: "fast" | "gentle") => void;
  onRetry: () => void;
  onReload: () => void;
  onViewMode: () => void;
}

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
  /** A menu from the bar is open, so tooltips stay out of its way. */
  menuOpen: boolean;
  /**
   * Sync or Issues is about to open its menu: close a menu the pointer opened
   * elsewhere in the bar (or any, when `force`, for a click). Returns whether
   * nothing else is left open.
   */
  onInnerMenuOpen: (force: boolean) => boolean;
  /** Showing one device: its place in the set, and stepping through it. */
  focusPosition?: string;
  canStepFocus?: boolean;
  onFocusPrevious?: () => void;
  onFocusNext?: () => void;
  /**
   * All devices is showing (with its previews' controls once they report):
   * All is the current view, and in place of Capture, Design and Issues, which
   * act on the workspace, the bar shows how far the previews have loaded.
   */
  allOpen?: boolean;
  gallery?: GalleryBar | null;
}

type InnerMenu = "sync" | "issues" | "loading";
/** Sent when a menu from the top bar opens. */
export const BAR_MENU_EVENT = "mdv-bar-menu";
// How long the pointer rests on an item before its menu opens.
const MENU_PAUSE = 140;
type InnerMenuControl = { open: boolean; toggle: () => void; close: () => void; handlers: Record<string, (event: never) => void> };

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
  // One menu from the bar at a time. Resting on an item for a moment opens its
  // menu, so passing over the bar opens nothing, and opening one closes the
  // other in the same step, so two never show together.
  const latest = useRef(props);
  latest.current = props;
  const [inner, setInner] = useState<InnerMenu | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => { window.clearTimeout(openTimer.current); window.clearTimeout(closeTimer.current); }, []);
  const quiet = props.menuOpen || inner !== null;
  // Exactly one of Workspace, One and All is current; All wins over a One left underneath.
  const view = props.allOpen ? "all" : props.showingOne ? "one" : "workspace";
  // A menu from the bar closes any menu open on a device, so only one shows.
  useEffect(() => { if (quiet) window.dispatchEvent(new Event(BAR_MENU_EVENT)); }, [quiet]);
  const openInner = (menu: InnerMenu, force = false) => {
    window.clearTimeout(closeTimer.current);
    if (latest.current.onInnerMenuOpen(force)) setInner(menu);
  };
  const closeInner = (menu: InnerMenu) => setInner(current => current === menu ? null : current);
  const innerMenu = (menu: InnerMenu) => ({
    open: inner === menu,
    toggle: () => { window.clearTimeout(openTimer.current); if (inner === menu) setInner(null); else openInner(menu, true); },
    close: () => closeInner(menu),
    handlers: {
      onPointerEnter: (event: React.PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(closeTimer.current);
        window.clearTimeout(openTimer.current);
        if (inner !== menu) openTimer.current = window.setTimeout(() => openInner(menu), MENU_PAUSE);
      },
      onPointerLeave: (event: React.PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(openTimer.current);
        closeTimer.current = window.setTimeout(() => closeInner(menu), 250);
      },
      onFocus: (event: React.FocusEvent) => { if ((event.target as HTMLElement).matches(":focus-visible")) openInner(menu); },
      onBlur: (event: React.FocusEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeInner(menu); },
      onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Escape" && inner === menu) { event.stopPropagation(); setInner(null); } },
    },
  });
  const hover = (menu: DockMenu) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(openTimer.current);
      openTimer.current = window.setTimeout(() => { setInner(null); latest.current.onMenuHover(menu); }, MENU_PAUSE);
    },
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(openTimer.current);
      latest.current.onMenuHover(null);
    },
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
        <div role="group" aria-label={t("views")} data-tour="views" className="flex shrink-0 items-center gap-1">
          {/* The current view; clicking it again opens the Add device picker here too. */}
          <Tooltip title={t("workspace")} description={t("tipAddDevice")} align="start" quiet={quiet}>
            <button
              ref={props.workspaceRef}
              type="button"
              data-workspace-toggle
              aria-current={view === "workspace" ? "page" : undefined}
              aria-haspopup="dialog"
              aria-expanded={props.workspaceOpen}
              aria-label={t("workspace")}
              onClick={props.onWorkspace}
              className={cx(viewButton, view === "workspace" ? viewOn : viewOff, props.workspaceOpen && "ring-2 ring-primary/25 ring-offset-2 ring-offset-surface")}
            >
              {level < 1 && <span>{t("workspace")}</span>}
              <span className="font-mono text-[11px] font-medium opacity-70">{props.slotCount}</span>
            </button>
          </Tooltip>
          {/* One keeps its width: showing one device, it steps through the set. */}
          {view === "one" && props.focusPosition ? (
            <div role="group" aria-label={t("focusDevice")} className={cx(viewButton, viewOn, "w-[88px] justify-between gap-0 px-0.5")}>
              <button type="button" aria-label={t("previousDevice")} title={t("previousDevice")} disabled={!props.canStepFocus} onClick={props.onFocusPrevious}
                className="grid size-5 place-items-center rounded-full outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40">
                <ChevronLeftIcon size={14} className="rtl:rotate-180" />
              </button>
              <span dir="ltr" data-focus-position className="font-mono text-[11.5px]">{props.focusPosition}</span>
              <button type="button" aria-label={t("nextDevice")} title={t("nextDevice")} disabled={!props.canStepFocus} onClick={props.onFocusNext}
                className="grid size-5 place-items-center rounded-full outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40">
                <ChevronRightIcon size={14} className="rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <Tooltip title={t("focusDevice")} align="center" quiet={quiet}>
              <button type="button" aria-pressed={view === "one"} aria-label={t("focusDevice")} onClick={props.onShowOne}
                className={cx(viewButton, "w-[88px] justify-center", view === "one" ? viewOn : viewOff)}>
                {t("viewOne")}
              </button>
            </Tooltip>
          )}
          <Tooltip title={t("allDevices")} description={t("tipAllDevices")} align="center" quiet={quiet}>
            <button type="button" data-all-devices-toggle onClick={props.onAllDevices} disabled={props.capturing} aria-label={t("allDevices")}
              aria-current={view === "all" ? "page" : undefined}
              className={cx(viewButton, view === "all" ? viewOn : viewOff, "disabled:opacity-40")}>
              {level < 1 && <span>{t("viewAll")}</span>}
              <span className="font-mono text-[11px] font-medium opacity-70">{props.catalogCount}</span>
            </button>
          </Tooltip>
        </div>

        <DockDivider />

        <DockButton label={t("reloadAll")} tooltip={t(props.allOpen ? "resetGalleryPreviews" : "tipReloadAll")} quiet={quiet}
          onClick={props.allOpen ? () => props.gallery?.onReload() : props.onReloadAll}>
          <ReloadIcon size={16} />
        </DockButton>
        <SyncControl
          scrollSync={props.scrollSync}
          navigationSync={props.navigationSync}
          onScrollSyncChange={props.onScrollSyncChange}
          onNavigationSyncChange={props.onNavigationSyncChange}
          menu={innerMenu("sync")}
        />
        {props.allOpen ? <LoadingControl gallery={props.gallery ?? null} menu={innerMenu("loading")} /> : <>
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
            noTooltip
          >
            <CameraIcon size={16} />
          </DockButton>
          <DockButton data-tour="design" label={t("design")} ariaLabel={t("compareWithDesign")} tooltip={t("tipCompare")} quiet={quiet}
            active={props.compare} pressed={props.compare} onClick={props.onCompare}>
            <CompareIcon size={16} />
          </DockButton>
          <IssuesControl {...props} menu={innerMenu("issues")} />
        </>}
        <DockButton data-view-only-toggle label={t("viewMode")} tooltip={t("tipFocusMode")} quiet={quiet}
          onClick={props.allOpen ? () => props.gallery?.onViewMode() : props.onViewMode}>
          <EyeIcon size={16} />
        </DockButton>
        <DockButton buttonRef={props.settingsRef} label={t("settings")} tooltip={t("tipSettings")} active={props.settingsOpen} expanded={props.settingsOpen}
          onClick={props.onSettings} hoverHandlers={hover("settings")} align="end" noTooltip>
          <SettingsIcon size={16} />
        </DockButton>

        {/* Its picker names it, so it has no tooltip to land on the picker. */}
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
              props.addOpen && "ring-2 ring-primary/25 ring-offset-2 ring-offset-surface",
            )}
          >
            <PlusIcon size={14} strokeWidth={2.6} />
            {level < 2 && <span>{t("add")}</span>}
          </button>
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

function DockButton({ label, ariaLabel, tooltip, quiet = false, noTooltip = false, active, pressed, expanded, disabled, badge, dot, align = "center", buttonRef, hoverHandlers, onClick, children, ...data }: {
  label: string;
  ariaLabel?: string;
  tooltip?: string;
  quiet?: boolean;
  /** Its menu opens on hover and names it, so a tooltip would only cover the menu. */
  noTooltip?: boolean;
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
  const button = (
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
  );
  if (noTooltip) return button;
  return <Tooltip title={ariaLabel ?? label} description={tooltip} align={align} quiet={quiet}>{button}</Tooltip>;
}

function Marks({ badge, dot }: { badge?: number; dot?: string }) {
  return <>
    {badge ? (
      <span aria-hidden="true" className="pointer-events-none absolute -end-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-surface">{badge}</span>
    ) : null}
    {dot && <span aria-hidden="true" data-track-dot className="pointer-events-none absolute -end-1 -top-1 size-[7px] rounded-full ring-2 ring-surface" style={{ background: dot }} />}
  </>;
}

// A menu under its item, titled with the item's name (the item has no tooltip).
function DockMenuPanel({ label, width, children }: { label: string; width: string; children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-full z-[60] -translate-x-1/2 pt-3">
      <div role="group" aria-label={label} className={cx("flex flex-col gap-0.5 rounded-2xl bg-surface p-1.5 text-ink shadow-popover", width)}>
        <div className="flex h-8 items-center px-2.5 text-[13px] font-semibold">{label}</div>
        {children}
      </div>
    </div>
  );
}

// Sync: one click turns it on or off for everything; resting on it (or
// tabbing into it) shows Scroll and Navigation separately.
function SyncControl({ scrollSync, navigationSync, onScrollSyncChange, onNavigationSyncChange, menu }: {
  scrollSync: boolean;
  navigationSync: boolean;
  onScrollSyncChange: (enabled: boolean) => void;
  onNavigationSyncChange: (enabled: boolean) => void;
  menu: InnerMenuControl;
}) {
  const { t } = useI18n();
  const on = scrollSync || navigationSync;
  return (
    <div data-tour="sync" className="relative shrink-0" {...menu.handlers}>
      <button
        type="button"
        aria-label={t("syncBetweenDevices")}
        aria-pressed={on}
        aria-expanded={menu.open}
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
        <DockMenuPanel label={t("sync")} width="w-[280px]">
          <SyncRow icon={<ScrollSyncIcon size={16} />} label={t("syncTogether")} checked={scrollSync} onChange={onScrollSyncChange} />
          <SyncRow icon={<NavigationSyncIcon size={16} />} label={t("syncPages")} checked={navigationSync} onChange={onNavigationSyncChange} />
        </DockMenuPanel>
      )}
    </div>
  );
}

// All devices: how far its previews have loaded, as wide as the three tools it
// stands in for, so the bar keeps its size. One click pauses or resumes the
// loading; resting on it shows the speed and retries what did not load.
function LoadingControl({ gallery, menu }: { gallery: GalleryBar | null; menu: InnerMenuControl }) {
  const { t } = useI18n();
  const loaded = gallery?.loaded ?? 0;
  const total = gallery?.total ?? 0;
  const incomplete = gallery?.incomplete ?? 0;
  const paused = gallery?.paused ?? false;
  const share = (count: number) => `${total ? (count / total) * 100 : 0}%`;
  return (
    <div className="relative shrink-0" {...menu.handlers}>
      <button
        type="button"
        data-gallery-load-progress
        aria-label={`${t("galleryLoadedPreviews", { loaded, count: total })} · ${t(paused ? "resumeLoading" : "pauseLoading")}`}
        aria-expanded={menu.open}
        disabled={!gallery}
        onClick={() => gallery?.onTogglePause()}
        className={cx("flex h-[34px] w-[110px] shrink-0 items-center gap-2 rounded-full px-2.5 text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40", menu.open && "bg-sunken")}
      >
        <span aria-hidden="true" className="flex h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-line-soft">
          <span className="bg-ink transition-[width]" style={{ width: share(loaded) }} />
          <span className="bg-warn transition-[width]" style={{ width: share(incomplete) }} />
        </span>
        <span dir="ltr" className="font-mono text-[11.5px] font-medium">{loaded}/{total}</span>
        <span aria-hidden="true" className="grid w-3 place-items-center text-ink-2">{paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}</span>
      </button>
      {menu.open && gallery && (
        <DockMenuPanel label={t("galleryLoadedPreviews", { loaded, count: total })} width="w-[260px]">
          <div role="radiogroup" aria-label={t("previewLoadingSpeed")} className="mx-1 mb-1 flex rounded-full bg-sunken p-[3px]">
            {(["fast", "gentle"] as const).map(speed => (
              <button key={speed} type="button" role="radio" aria-checked={gallery.speed === speed} title={t(speed === "fast" ? "galleryFastLoading" : "galleryGentleLoading")}
                onClick={() => gallery.onSpeedChange(speed)}
                className={cx("h-7 flex-1 rounded-full text-[12.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent", gallery.speed === speed ? "bg-primary text-on-primary" : "text-ink")}>
                {t(speed)}
              </button>
            ))}
          </div>
          <IssueRow icon={paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />} label={t(paused ? "resumeLoading" : "pauseLoading")}
            hint={t(paused ? "galleryResumeLoading" : "galleryPauseLoading")} onClick={gallery.onTogglePause} />
          {incomplete > 0 && (
            <IssueRow icon={<ReloadIcon size={14} />} label={t("retryCount", { count: incomplete })} hint={t("retryIncompletePreviews")} onClick={() => { menu.close(); gallery.onRetry(); }} />
          )}
        </DockMenuPanel>
      )}
    </div>
  );
}

// One kind of sync, named for what it does, with a switch.
function SyncRow({ icon, label, checked, onChange }: { icon: ReactNode; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 hover:bg-sunken has-focus-visible:ring-2 has-focus-visible:ring-accent">
      <span aria-hidden="true" className="grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{label}</span>
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)}
        className="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-line outline-none transition-colors before:absolute before:start-0.5 before:top-0.5 before:size-4 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-primary checked:before:bg-surface checked:before:translate-x-4 rtl:checked:before:-translate-x-4" />
    </label>
  );
}

// Issues: what went wrong on the devices, in one place. Resting on it lists
// the problems (script errors and failed requests), the layout check and the
// fix prompt, each one click away; its badge counts both kinds of problem.
function IssuesControl(props: WorkspaceDockProps & { menu: InnerMenuControl }) {
  const { t } = useI18n();
  const { menu } = props;
  const total = props.problemsCount + (FEATURES.layoutCheck ? props.layoutCount : 0);
  const run = (action: () => void) => () => { menu.close(); action(); };
  const active = menu.open || props.problemsOpen || props.layoutOpen || props.fixOpen;
  return (
    <div className="relative shrink-0" {...menu.handlers}>
      <button
          ref={props.fixRef}
          type="button"
          data-tour="issues"
          data-issues-toggle
          aria-label={total > 0 ? `${t("issues")} · ${total}` : t("issues")}
          aria-expanded={menu.open}
          onClick={menu.toggle}
          className={cx(dockItem, active && "bg-sunken")}
        >
          <span className="relative grid place-items-center">
            {props.layoutChecking
              ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none" />
              : <AlertIcon size={16} />}
            <Marks badge={total} />
          </span>
        </button>
      {menu.open && (
        <DockMenuPanel label={t("issues")} width="w-[280px]">
          <IssueRow data-problems-toggle icon={<BugIcon size={15} />} label={t("issuesErrors")} hint={t("problemsTip")} count={props.problemsCount}
            pressed={props.problemsOpen} onClick={run(props.onProblems)} />
          {FEATURES.layoutCheck && (
            <IssueRow data-layout-check-toggle icon={<LayoutCheckIcon size={15} />} label={t("checkSideways")} hint={t("tipCheckLayout")} count={props.layoutCount}
              pressed={props.layoutOpen} busy={props.layoutChecking} onClick={run(props.onLayoutCheck)} />
          )}
          <IssueRow icon={<FixPromptIcon size={15} />} label={t("writeFixPrompt")} hint={t("tipFixPrompt")} pressed={props.fixOpen} onClick={run(props.onFixPrompt)} />
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
      className={cx("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-start outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent", pressed && "bg-sunken")}>
      <span className="grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{label}</span>
      {busy
        ? <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none" />
        : count ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-red-500/10 px-1.5 font-mono text-[11px] font-bold text-danger">{count}</span> : null}
    </button>
  );
}

function DockDivider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line-soft" />;
}
