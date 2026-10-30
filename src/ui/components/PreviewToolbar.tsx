import { forwardRef, type ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import {
  CameraIcon,
  ChangeDeviceIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  FixPromptIcon,
  GlobeIcon,
  GripIcon,
  LayoutCheckIcon,
  MinusIcon,
  MoreIcon,
  PlusIcon,
  ReloadIcon,
  RotateIcon,
  SideBySideIcon,
} from "../icons";
import { cx, focusRing } from "./ui";

export interface FocusNavigation {
  position: string;
  canStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
}

export interface PreviewToolbarProps {
  deviceName: string;
  /** The short name shown on the change-device button. */
  deviceLabel?: string;
  zoomLabel: string;
  canRotate: boolean;
  removable: boolean;
  reloading: boolean;
  revealed: boolean;
  menuOpen: boolean;
  tourTarget?: string;
  focusNavigation?: FocusNavigation;
  onChangeDevice?: () => void;
  /** Neighbouring devices of the same type, for stepping without the picker. */
  previousDeviceName?: string;
  nextDeviceName?: string;
  onPreviousDevice?: () => void;
  onNextDevice?: () => void;
  onRotate: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onReload: () => void;
  onOpenInTab: () => void;
  onExpand?: () => void;
  /** How far the device's centre is from the bar's, when the bar is kept on screen. */
  arrowOffset?: number;
  /** A screenshot of this device, opened in the annotation editor. */
  onScreenshot?: () => void;
  screenshotPending?: boolean;
  onFixPrompt?: () => void;
  /** Shown once this page has a "before" picture. */
  onCompareBefore?: () => void;
  compareBeforeLabel?: string;
  /** Shown once a layout check found problems on this device. */
  onLayoutProblems?: () => void;
  layoutProblemCount?: number;
  onMenu: () => void;
  /** The device's language button: its short code when one is set, and the picker it opens. */
  onLanguage?: () => void;
  languageCode?: string;
  languageLabel?: string;
  languageOpen?: boolean;
  languagePicker?: ReactNode;
  onRemove: () => void;
  onMoveStart?: (event: React.PointerEvent) => void;
  expandLabel?: string;
  menu?: ReactNode;
}

// The floating per-device toolbar. It fades in while the device itself is
// hovered (`revealed`, tracked by the card), and lingers briefly
// after the pointer leaves so it can be reached. Keyboard focus in the device
// shows it too; a click into the page doesn't.
export const PreviewToolbar = forwardRef<HTMLDivElement, PreviewToolbarProps>(function PreviewToolbar(props, ref) {
  const { t } = useI18n();
  const focus = props.focusNavigation;
  const visible = props.revealed || props.menuOpen || Boolean(props.languageOpen);
  return (
    <div
      ref={ref}
      data-device-toolbar
      onClick={event => event.stopPropagation()}
      className={cx(
        "absolute left-1/2 z-40 w-max -translate-x-1/2 transition duration-150 ease-out",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-1 opacity-0 duration-100 group-has-[:focus-visible]/device:pointer-events-auto group-has-[:focus-visible]/device:translate-y-0 group-has-[:focus-visible]/device:opacity-100",
      )}
    >
      <div role="toolbar" aria-label={t("deviceControls", { name: props.deviceName })} data-tour={props.tourTarget}
        className="flex h-[46px] items-center gap-1.5 whitespace-nowrap rounded-[14px] border-[1.5px] border-ink bg-surface px-1.5 shadow-[0_14px_34px_rgb(20_23_26/0.16)]">
        {(props.onMoveStart || props.onChangeDevice) && (
          <Group tinted>
            {props.onMoveStart && (
              <button type="button" data-move-handle aria-label={t("moveDevice")} title={t("moveDevice")} onPointerDown={props.onMoveStart}
                className={cx("grid h-[30px] w-5 cursor-grab touch-none place-items-center rounded-lg text-faint hover:text-ink active:cursor-grabbing", focusRing)}>
                <GripIcon />
              </button>
            )}
            {props.onChangeDevice && <>
              <ToolButton
                label={props.previousDeviceName ? `${t("previousInCategory")}: ${props.previousDeviceName}` : t("previousInCategory")}
                testId="previous-device-button" disabled={!props.onPreviousDevice} onClick={() => props.onPreviousDevice?.()}>
                <ChevronLeftIcon size={15} className="rtl:rotate-180" />
              </ToolButton>
              {props.deviceLabel ? (
                <button type="button" data-testid="device-switcher-button" onClick={props.onChangeDevice}
                  title={t("changeDevice")} aria-label={`${t("changeDevice")} · ${props.deviceLabel}`}
                  className={cx("flex h-[30px] w-44 items-center justify-between gap-1.5 rounded-lg pe-1.5 ps-2 text-[13px] font-semibold text-ink hover:bg-surface", focusRing)}>
                  {/* One width for every device, so the bar never changes size. */}
                  <span className="truncate">{props.deviceLabel}</span>
                  <ChevronDownIcon size={12} className="shrink-0 text-muted" />
                </button>
              ) : (
                <ToolButton label={t("changeDevice")} testId="device-switcher-button" onClick={props.onChangeDevice}>
                  <ChangeDeviceIcon size={16} />
                </ToolButton>
              )}
              <ToolButton
                label={props.nextDeviceName ? `${t("nextInCategory")}: ${props.nextDeviceName}` : t("nextInCategory")}
                testId="next-device-button" disabled={!props.onNextDevice} onClick={() => props.onNextDevice?.()}>
                <ChevronRightIcon size={15} className="rtl:rotate-180" />
              </ToolButton>
            </>}
          </Group>
        )}
        <Group>
          {/* Devices that cannot rotate keep the space, so switching devices
              never shifts the buttons under the pointer. */}
          {props.canRotate
            ? <ToolButton label={t("rotate")} onClick={props.onRotate}><RotateIcon size={15} /></ToolButton>
            : <span aria-hidden="true" className="size-[30px] shrink-0" />}
          <ToolButton label={t("zoomOut")} onClick={props.onZoomOut}><MinusIcon size={14} /></ToolButton>
          <button type="button" title={t("resetFit")} aria-label={`${t("resetFit")} · ${props.zoomLabel}`} onClick={props.onResetZoom}
            className={cx("h-[30px] min-w-11 rounded-lg px-1 font-mono text-[11.5px] font-semibold text-ink hover:bg-sunken", focusRing)}>
            {props.zoomLabel}
          </button>
          <ToolButton label={t("zoomIn")} onClick={props.onZoomIn}><PlusIcon size={14} strokeWidth={2.4} /></ToolButton>
        </Group>
        <Group>
          <ToolButton label={t("reloadPreview")} onClick={props.onReload}><ReloadIcon size={15} className={props.reloading ? "animate-spin" : undefined} /></ToolButton>
          {props.onScreenshot && <ToolButton label={t("captureAndAnnotate")} disabled={props.screenshotPending} onClick={props.onScreenshot}><CameraIcon size={15} /></ToolButton>}
          {props.onLanguage && (
            <div className="relative">
              <button type="button" data-language-toggle onClick={props.onLanguage} aria-expanded={props.languageOpen} aria-haspopup="dialog"
                title={props.languageLabel} aria-label={props.languageLabel}
                className={cx("flex h-[30px] items-center gap-1 rounded-lg px-[7px] font-mono text-[11px] font-bold", props.languageCode ? "text-accent-strong" : "text-ink", props.languageOpen ? "bg-sunken" : "hover:bg-sunken", focusRing)}>
                <GlobeIcon size={15} />{props.languageCode}
              </button>
              {props.languageOpen && props.languagePicker}
            </div>
          )}
          {/* Showing one device, the same button goes back to all of them. */}
          {focus
            ? <ToolButton label={t("showAllDevices")} onClick={focus.onExit}><CollapseIcon size={15} /></ToolButton>
            : props.onExpand && <ToolButton label={props.expandLabel ?? t("focusDevice")} onClick={props.onExpand}><ExpandIcon size={15} /></ToolButton>}
          {props.onFixPrompt && <ToolButton label={t("fixPromptForDevice")} onClick={props.onFixPrompt}><FixPromptIcon size={15} /></ToolButton>}
          {props.onCompareBefore && (
            <ToolButton label={props.compareBeforeLabel ?? ""} accent onClick={props.onCompareBefore}>
              {/* The dot says a "before" picture is waiting to be compared. */}
              <span className="relative grid size-7 place-items-center">
                <SideBySideIcon size={15} />
                <span aria-hidden="true" className="absolute right-[3px] top-[3px] size-1.5 rounded-full bg-accent" />
              </span>
            </ToolButton>
          )}
          {props.onLayoutProblems && (
            <ToolButton label={t("layoutShowProblems")} accent onClick={props.onLayoutProblems}>
              <span className="relative grid place-items-center">
                <LayoutCheckIcon size={15} />
                {props.layoutProblemCount ? <span aria-hidden="true" className="absolute -end-2 -top-2 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-[3px] font-mono text-[9px] font-bold text-white">{props.layoutProblemCount}</span> : null}
              </span>
            </ToolButton>
          )}
        </Group>
        <Group>
          <div className="relative">
            <ToolButton label={t("viewportOptions")} expanded={props.menuOpen} onClick={props.onMenu} menuToggle><MoreIcon size={16} /></ToolButton>
            {props.menuOpen && props.menu}
          </div>
          {props.removable && <ToolButton label={t("removeDevice")} danger onClick={props.onRemove} dataRemove><CloseIcon size={15} strokeWidth={2.2} /></ToolButton>}
        </Group>
      </div>
      {/* Points down at the device this bar belongs to. */}
      <span aria-hidden="true" data-toolbar-arrow
        className="absolute top-full -mt-[7px] size-3 rotate-45 border-b-[1.5px] border-r-[1.5px] border-ink bg-surface"
        style={{ left: `calc(50% + ${props.arrowOffset ?? 0}px - 6px)` }} />
    </div>
  );
});

// One set of related buttons; the device's own group sits on a tint.
function Group({ tinted = false, children }: { tinted?: boolean; children: ReactNode }) {
  return <div className={cx("flex h-[34px] items-center gap-px rounded-[10px] px-0.5", tinted && "bg-sunken")}>{children}</div>;
}

function ToolButton({ label, onClick, children, disabled, danger, accent, expanded, testId, dataRemove, menuToggle }: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  accent?: boolean;
  expanded?: boolean;
  testId?: string;
  dataRemove?: boolean;
  menuToggle?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      disabled={disabled}
      data-testid={testId}
      data-remove-viewport={dataRemove || undefined}
      data-device-menu-toggle={menuToggle || undefined}
      onClick={onClick}
      className={cx(
        "grid size-[30px] place-items-center rounded-lg disabled:opacity-30",
        danger ? "text-danger hover:bg-danger/10" : accent ? "bg-accent-soft text-accent hover:bg-accent-soft/70" : "text-ink hover:bg-sunken",
        expanded && "bg-sunken",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}
