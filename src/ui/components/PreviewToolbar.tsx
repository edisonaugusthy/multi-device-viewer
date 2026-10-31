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
import { DeviceGlyph, type GlyphKind } from "./DeviceGlyph";
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
  /** The device's outline and CSS width, shown with its name. */
  deviceGlyph?: GlyphKind;
  deviceWidth?: number;
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
        className="flex h-9 items-center gap-px whitespace-nowrap rounded-full bg-surface px-1 shadow-popover">
        {props.onMoveStart && (
          <button type="button" data-move-handle aria-label={t("moveDevice")} title={t("moveDevice")} onPointerDown={props.onMoveStart}
            className={cx("grid h-7 w-3.5 cursor-grab touch-none place-items-center rounded-full text-grip hover:text-ink active:cursor-grabbing", focusRing)}>
            <GripIcon />
          </button>
        )}
        {props.onChangeDevice && (
          // Which device: step to the previous or next of its type, or click the name to change it.
          <div className="flex h-7 items-center rounded-full bg-sunken px-px">
            <ToolButton narrow
              label={props.previousDeviceName ? `${t("previousInCategory")}: ${props.previousDeviceName}` : t("previousInCategory")}
              testId="previous-device-button" disabled={!props.onPreviousDevice} onClick={() => props.onPreviousDevice?.()}>
              <ChevronLeftIcon size={13} strokeWidth={2.5} className="rtl:rotate-180" />
            </ToolButton>
            {props.deviceLabel ? (
              <button type="button" data-testid="device-switcher-button" onClick={props.onChangeDevice}
                title={t("changeDevice")} aria-label={`${t("changeDevice")} · ${props.deviceLabel}`}
                className={cx("flex h-6 w-[168px] items-center gap-1.5 rounded-full px-[7px] text-[12.5px] font-semibold text-ink hover:bg-surface", focusRing)}>
                {/* One width for every device, so the bar never changes size. */}
                {props.deviceGlyph && <span aria-hidden="true" className="grid w-3.5 shrink-0 place-items-center text-ink-2"><DeviceGlyph kind={props.deviceGlyph} small /></span>}
                <span className="min-w-0 flex-1 truncate text-start">{props.deviceLabel}</span>
                {props.deviceWidth !== undefined && <span dir="ltr" className="shrink-0 font-mono text-[10.5px] font-medium text-muted">{props.deviceWidth}</span>}
                <ChevronDownIcon size={11} strokeWidth={2.6} className="shrink-0 text-muted" />
              </button>
            ) : (
              <ToolButton label={t("changeDevice")} testId="device-switcher-button" onClick={props.onChangeDevice}>
                <ChangeDeviceIcon size={15} />
              </ToolButton>
            )}
            <ToolButton narrow
              label={props.nextDeviceName ? `${t("nextInCategory")}: ${props.nextDeviceName}` : t("nextInCategory")}
              testId="next-device-button" disabled={!props.onNextDevice} onClick={() => props.onNextDevice?.()}>
              <ChevronRightIcon size={13} strokeWidth={2.5} className="rtl:rotate-180" />
            </ToolButton>
          </div>
        )}
        <Divider />
        {/* Devices that cannot rotate keep the space, so switching devices
            never shifts the buttons under the pointer. */}
        {props.canRotate
          ? <ToolButton label={t("rotate")} onClick={props.onRotate}><RotateIcon size={14} /></ToolButton>
          : <span aria-hidden="true" className="size-7 shrink-0" />}
        <div className="flex h-7 items-center rounded-full bg-sunken/70 px-px">
          <ToolButton small label={t("zoomOut")} onClick={props.onZoomOut}><MinusIcon size={12} strokeWidth={2.6} /></ToolButton>
          <button type="button" title={t("resetFit")} aria-label={`${t("resetFit")} · ${props.zoomLabel}`} onClick={props.onResetZoom}
            className={cx("h-6 min-w-[34px] rounded-full px-0.5 font-mono text-[11.5px] font-semibold text-ink hover:bg-surface", focusRing)}>
            {props.zoomLabel}
          </button>
          <ToolButton small label={t("zoomIn")} onClick={props.onZoomIn}><PlusIcon size={12} strokeWidth={2.6} /></ToolButton>
        </div>
        <Divider />
        <ToolButton label={t("reloadPreview")} onClick={props.onReload}><ReloadIcon size={14} className={props.reloading ? "animate-spin" : undefined} /></ToolButton>
        {props.onScreenshot && <ToolButton label={t("captureAndAnnotate")} disabled={props.screenshotPending} onClick={props.onScreenshot}><CameraIcon size={14} /></ToolButton>}
        {props.onLanguage && (
          <div className="relative">
            <button type="button" data-language-toggle onClick={props.onLanguage} aria-expanded={props.languageOpen} aria-haspopup="dialog"
              title={props.languageLabel} aria-label={props.languageLabel}
              className={cx("flex h-7 min-w-7 items-center justify-center gap-1 rounded-full px-[7px] font-mono text-[11px] font-bold", props.languageCode ? "text-accent-strong" : "text-ink", props.languageOpen ? "bg-sunken" : "hover:bg-sunken", focusRing)}>
              <GlobeIcon size={14} />{props.languageCode}
            </button>
            {props.languageOpen && props.languagePicker}
          </div>
        )}
        {/* Showing one device, the same button goes back to all of them. */}
        {focus
          ? <ToolButton label={t("showAllDevices")} onClick={focus.onExit}><CollapseIcon size={14} /></ToolButton>
          : props.onExpand && <ToolButton label={props.expandLabel ?? t("focusDevice")} onClick={props.onExpand}><ExpandIcon size={14} /></ToolButton>}
        {props.onFixPrompt && <ToolButton label={t("fixPromptForDevice")} onClick={props.onFixPrompt}><FixPromptIcon size={14} /></ToolButton>}
        {props.onCompareBefore && (
          <ToolButton label={props.compareBeforeLabel ?? ""} accent onClick={props.onCompareBefore}>
            {/* The dot says a "before" picture is waiting to be compared. */}
            <span className="relative grid size-6 place-items-center">
              <SideBySideIcon size={14} />
              <span aria-hidden="true" className="absolute right-[2px] top-[2px] size-1.5 rounded-full bg-accent" />
            </span>
          </ToolButton>
        )}
        {props.onLayoutProblems && (
          <ToolButton label={t("layoutShowProblems")} accent onClick={props.onLayoutProblems}>
            <span className="relative grid place-items-center">
              <LayoutCheckIcon size={14} />
              {props.layoutProblemCount ? <span aria-hidden="true" className="absolute -end-2 -top-2 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-[3px] font-mono text-[9px] font-bold text-white">{props.layoutProblemCount}</span> : null}
            </span>
          </ToolButton>
        )}
        <Divider />
        <div className="relative">
          <ToolButton label={t("viewportOptions")} expanded={props.menuOpen} onClick={props.onMenu} menuToggle><MoreIcon size={15} /></ToolButton>
          {props.menuOpen && props.menu}
        </div>
        {props.removable && <ToolButton label={t("removeDevice")} danger onClick={props.onRemove} dataRemove><CloseIcon size={14} strokeWidth={2.2} /></ToolButton>}
      </div>
    </div>
  );
});

// Between the bar's groups: which device, how it is shown, the page, more.
function Divider() {
  return <span aria-hidden="true" className="mx-[3px] h-4 w-px shrink-0 bg-line-soft" />;
}

function ToolButton({ label, onClick, children, disabled, danger, accent, expanded, testId, dataRemove, menuToggle, narrow, small }: {
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
  /** Inside the device capsule: the arrows either side of the name. */
  narrow?: boolean;
  /** Inside the zoom stepper. */
  small?: boolean;
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
        "grid shrink-0 place-items-center rounded-full disabled:opacity-30",
        narrow ? "h-[26px] w-[22px] text-muted hover:text-ink" : small ? "size-6 text-ink hover:bg-surface" : "size-7",
        // Remove stays quiet until the pointer is on it.
        danger ? "text-faint hover:bg-danger/10 hover:text-danger" : accent ? "bg-accent-soft text-accent hover:bg-accent-soft/70" : !narrow && !small && "text-ink hover:bg-sunken",
        expanded && "bg-sunken",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}
