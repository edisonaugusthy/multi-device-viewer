import { forwardRef, type ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import {
  ChangeDeviceIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  FixPromptIcon,
  GripIcon,
  MinusIcon,
  MoreIcon,
  OpenInTabIcon,
  PlusIcon,
  ReloadIcon,
  RotateIcon,
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
  onFixPrompt?: () => void;
  onMenu: () => void;
  onRemove: () => void;
  onMoveStart?: (event: React.PointerEvent) => void;
  expandLabel?: string;
  menu?: ReactNode;
}

// The floating per-device toolbar. It fades in while the device is hovered or
// focused and lingers briefly after the pointer leaves so it can be reached.
export const PreviewToolbar = forwardRef<HTMLDivElement, PreviewToolbarProps>(function PreviewToolbar(props, ref) {
  const { t } = useI18n();
  const focus = props.focusNavigation;
  const visible = props.revealed || props.menuOpen;
  return (
    <div
      ref={ref}
      data-device-toolbar
      onClick={event => event.stopPropagation()}
      className={cx(
        "absolute left-1/2 z-40 w-max -translate-x-1/2 transition duration-200 ease-out",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-1 opacity-0 delay-[450ms] group-hover/device:pointer-events-auto group-hover/device:translate-y-0 group-hover/device:opacity-100 group-hover/device:delay-0 group-focus-within/device:pointer-events-auto group-focus-within/device:translate-y-0 group-focus-within/device:opacity-100 group-focus-within/device:delay-0",
      )}
    >
      <div role="toolbar" aria-label={t("deviceControls", { name: props.deviceName })}
        className={cx("flex items-center gap-px whitespace-nowrap rounded-[10px] border border-line bg-surface px-1 shadow-float", focus ? "h-10" : "h-9")}>
        {focus && <>
          <ToolButton label={t("previousDevice")} onClick={focus.onPrevious} disabled={!focus.canStep}><ChevronLeftIcon size={15} /></ToolButton>
          <span className="min-w-10 text-center font-mono text-xs text-ink-2">{focus.position}</span>
          <ToolButton label={t("nextDevice")} onClick={focus.onNext} disabled={!focus.canStep}><ChevronRightIcon size={15} /></ToolButton>
          <Separator />
        </>}
        {props.onMoveStart && (
          <button type="button" data-move-handle aria-label={t("moveDevice")} title={t("moveDevice")} onPointerDown={props.onMoveStart}
            className={cx("grid h-7 w-5 cursor-grab touch-none place-items-center rounded-[7px] text-faint hover:bg-sunken hover:text-ink active:cursor-grabbing", focusRing)}>
            <GripIcon />
          </button>
        )}
        {props.onChangeDevice && <>
          <ToolButton
            label={props.previousDeviceName ? `${t("previousInCategory")}: ${props.previousDeviceName}` : t("previousInCategory")}
            testId="previous-device-button" disabled={!props.onPreviousDevice} onClick={() => props.onPreviousDevice?.()}>
            <ChevronLeftIcon size={15} className="rtl:rotate-180" />
          </ToolButton>
          <ToolButton label={t("changeDevice")} testId="device-switcher-button" tourTarget={props.tourTarget} onClick={props.onChangeDevice}>
            <ChangeDeviceIcon size={16} />
          </ToolButton>
          <ToolButton
            label={props.nextDeviceName ? `${t("nextInCategory")}: ${props.nextDeviceName}` : t("nextInCategory")}
            testId="next-device-button" disabled={!props.onNextDevice} onClick={() => props.onNextDevice?.()}>
            <ChevronRightIcon size={15} className="rtl:rotate-180" />
          </ToolButton>
        </>}
        {/* Devices that cannot rotate keep the space, so switching devices
            never shifts the buttons under the pointer. */}
        {props.canRotate
          ? <ToolButton label={t("rotate")} onClick={props.onRotate}><RotateIcon size={16} /></ToolButton>
          : <span aria-hidden="true" className="size-7 shrink-0" />}
        <Separator />
        <ToolButton label={t("zoomOut")} onClick={props.onZoomOut}><MinusIcon size={14} /></ToolButton>
        <button type="button" title={t("resetFit")} aria-label={`${t("resetFit")} · ${props.zoomLabel}`} onClick={props.onResetZoom}
          className={cx("h-[26px] min-w-11 rounded-md bg-sunken px-1 font-mono text-[11.5px] font-medium text-ink", focusRing)}>
          {props.zoomLabel}
        </button>
        <ToolButton label={t("zoomIn")} onClick={props.onZoomIn}><PlusIcon size={14} strokeWidth={2.4} /></ToolButton>
        <Separator />
        <ToolButton label={t("reloadPreview")} onClick={props.onReload}><ReloadIcon size={15} className={props.reloading ? "animate-spin" : undefined} /></ToolButton>
        {focus && <ToolButton label={t("openInTab")} onClick={props.onOpenInTab}><OpenInTabIcon size={15} /></ToolButton>}
        {!focus && props.onExpand && <ToolButton label={props.expandLabel ?? t("focusDevice")} onClick={props.onExpand}><ExpandIcon size={15} /></ToolButton>}
        {props.onFixPrompt && <ToolButton label={t("fixPromptForDevice")} onClick={props.onFixPrompt}><FixPromptIcon size={15} /></ToolButton>}
        <div className="relative">
          <ToolButton label={t("viewportOptions")} expanded={props.menuOpen} onClick={props.onMenu}><MoreIcon size={16} /></ToolButton>
          {props.menuOpen && props.menu}
        </div>
        {focus ? (
          <button type="button" onClick={focus.onExit} title={t("showAllDevices")}
            className={cx("ms-1 flex h-[30px] items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[12.5px] font-semibold text-on-primary", focusRing)}>
            <CollapseIcon size={14} />{t("showAll")}
          </button>
        ) : props.removable && (
          <ToolButton label={t("removeDevice")} danger onClick={props.onRemove} dataRemove><CloseIcon size={15} strokeWidth={2.2} /></ToolButton>
        )}
      </div>
    </div>
  );
});

function ToolButton({ label, onClick, children, disabled, danger, expanded, testId, tourTarget, dataRemove }: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  expanded?: boolean;
  testId?: string;
  tourTarget?: string;
  dataRemove?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      disabled={disabled}
      data-testid={testId}
      data-tour={tourTarget}
      data-remove-viewport={dataRemove || undefined}
      onClick={onClick}
      className={cx(
        "grid size-7 place-items-center rounded-[7px] disabled:opacity-30",
        danger ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-sunken",
        expanded && "bg-sunken",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-0.5 h-[18px] w-px bg-line" />;
}
