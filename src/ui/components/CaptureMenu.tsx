import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { CameraIcon, GridIcon } from "../icons";
import { cx, focusRing, popoverPanel, positionStyle, Switch, useAnchoredPosition, useDismiss } from "./ui";

function Item({ icon, label, onClick, attr }: { icon: ReactNode; label: string; onClick: () => void; attr: string }) {
  return (
    <button type="button" {...{ [attr]: "" }} onClick={onClick}
      className={cx("flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium text-ink hover:bg-sunken", focusRing)}>
      <span className="grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
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
  const position = useAnchoredPosition(anchorRef, open, children ? 300 : 260, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;
  const run = (action: () => void) => { onClose(); action(); };
  return (
    <div ref={panelRef} role="dialog" aria-label={t("captureMenu")} data-capture-menu className={cx(popoverPanel, "fixed overflow-y-auto p-1.5")} style={positionStyle(position)}>
      <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold text-muted">{t("captureAndAnnotate")}</p>
      {deviceName && <Item attr="data-capture-device" icon={<CameraIcon size={15} />} label={deviceName} onClick={() => run(onDevice)} />}
      <Item attr="data-capture-workspace" icon={<GridIcon size={15} />} label={t("captureWorkspace")} onClick={() => run(onWorkspace)} />
      <div data-track-toggle={tracking ? "on" : "off"} className="mt-1 flex items-center justify-between gap-2.5 border-t border-line-soft px-2 pb-1 pt-2">
        <span className="grid gap-px">
          <span className="text-[13px] font-medium">{t("trackChanges")}</span>
          <span className="text-[11.5px] text-muted">{t("trackTip")}</span>
        </span>
        <Switch size="sm" checked={tracking} onChange={onTracking} label={t("trackChanges")} />
      </div>
      {children && <div className="mt-1 border-t border-line-soft pt-0.5">{children}</div>}
    </div>
  );
}
