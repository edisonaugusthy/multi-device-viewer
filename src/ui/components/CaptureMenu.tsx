import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { CameraIcon, GridIcon, ReloadIcon } from "../icons";
import { cx, focusRing, popoverPanel, positionStyle, SectionLabel, Switch, useAnchoredPosition, useDismiss } from "./ui";

// Each choice is named for what it makes.
function Item({ icon, label, onClick, attr }: { icon: ReactNode; label: string; onClick: () => void; attr: string }) {
  return (
    <button type="button" {...{ [attr]: "" }} onClick={onClick}
      className={cx("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-start text-ink hover:bg-sunken", focusRing)}>
      <span className="grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{label}</span>
    </button>
  );
}

/**
 * The camera's menu: a screenshot of the active device or of the whole
 * workspace, either opening the annotation editor, the Track changes switch,
 * and (as `children`) the recording controls.
 */
export function CaptureMenu({ open, anchorRef, onClose, deviceName, onDevice, onWorkspace, tracking, onTracking, children }: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** The active device, shown as the first choice. */
  deviceName?: string;
  onDevice: () => void;
  onWorkspace: () => void;
  /** Track changes: each reload compared with the one before. */
  tracking: boolean;
  onTracking: (on: boolean) => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 300, "center");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;
  const run = (action: () => void) => { onClose(); action(); };
  return (
    <div ref={panelRef} role="dialog" aria-label={t("captureMenu")} data-capture-menu className={cx(popoverPanel, "fixed overflow-y-auto p-1.5")} style={positionStyle(position)}>
      <p className="flex h-8 items-center px-2.5 text-[13px] font-semibold">{t("captureMenu")}</p>
      <SectionLabel className="px-2.5 pb-1 pt-1">{t("captureScreenshotHeading")}</SectionLabel>
      {deviceName && <Item attr="data-capture-device" icon={<CameraIcon size={15} />} label={t("screenshotNamed", { name: deviceName })} onClick={() => run(onDevice)} />}
      <Item attr="data-capture-workspace" icon={<GridIcon size={15} />} label={t("screenshotAllDevices")} onClick={() => run(onWorkspace)} />
      {children && <div className="mt-1 border-t border-line-soft pt-1">{children}</div>}
      <div data-track-toggle={tracking ? "on" : "off"} className="mt-1 flex h-10 items-center gap-2.5 border-t border-line-soft px-2.5 pt-1">
        <span aria-hidden="true" className="grid w-4 shrink-0 place-items-center text-ink-2"><ReloadIcon size={15} /></span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{t("trackOnReload")}</span>
        <Switch size="sm" checked={tracking} onChange={onTracking} label={t("trackChanges")} />
      </div>
    </div>
  );
}
