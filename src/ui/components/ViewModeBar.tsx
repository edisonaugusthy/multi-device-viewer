import { useI18n } from "../../app/i18n";
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "../icons";
import { cx, focusRing, Kbd } from "./ui";

// Focus mode keeps only the devices on screen. Its controls appear while the
// pointer is over a device or near the bottom edge (or keyboard focus is
// inside), so Exit is always one glance away, and linger before fading. The
// device hover comes from the screen that renders this bar: its container is
// the named group "focusmode".
export function ViewModeBar({ single, position, canStep, onShowAll, onShowOne, onPrevious, onNext, onExit, showModes = true, zoomLabel, onZoomOut, onZoomIn, onZoomReset }: {
  showModes?: boolean;
  zoomLabel?: string;
  onZoomOut?: () => void;
  onZoomIn?: () => void;
  onZoomReset?: () => void;
  single: boolean;
  position: string;
  canStep: boolean;
  onShowAll: () => void;
  onShowOne: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="group/viewbar absolute inset-x-0 bottom-0 z-40 flex h-[120px] items-end justify-center pb-[18px]">
      <span aria-hidden="true" className={cx("absolute bottom-[18px] h-[5px] w-11 rounded-full bg-grip transition-opacity duration-300 group-has-[:focus-visible]/viewbar:opacity-0 group-hover/viewbar:opacity-0", "group-has-[[data-device-capture]:hover]/focusmode:opacity-0")} />
      <div
        role="toolbar"
        aria-label={t("viewModeControls")}
        className={cx(
          "flex items-center gap-1 whitespace-nowrap rounded-[14px] border border-line bg-surface p-[5px] shadow-bar",
          // Hidden: wait 1.5 s after the pointer leaves, then fade slowly, so
          // there is time to reach the bar. It stays clickable and focusable
          // throughout; its hover zone reveals it before any click lands.
          "translate-y-2 opacity-0 transition-[opacity,translate] delay-[1500ms] duration-500",
          "group-hover/viewbar:translate-y-0 group-hover/viewbar:opacity-100 group-hover/viewbar:delay-0 group-hover/viewbar:duration-200",
          "group-has-[:focus-visible]/viewbar:translate-y-0 group-has-[:focus-visible]/viewbar:opacity-100 group-has-[:focus-visible]/viewbar:delay-0 group-has-[:focus-visible]/viewbar:duration-200",
          "group-has-[[data-device-capture]:hover]/focusmode:translate-y-0 group-has-[[data-device-capture]:hover]/focusmode:opacity-100 group-has-[[data-device-capture]:hover]/focusmode:delay-0 group-has-[[data-device-capture]:hover]/focusmode:duration-200",
        )}
      >
        {showModes && <div role="group" aria-label={t("show")} className="flex rounded-[10px] bg-sunken p-[3px]">
          <ModeButton pressed={!single} onClick={onShowAll} label={t("viewAll")} icon={<AllGlyph />} />
          <ModeButton pressed={single} onClick={onShowOne} label={t("viewOne")} icon={<OneGlyph />} />
        </div>}
        {single && canStep && <>
          <button type="button" onClick={onPrevious} aria-label={t("previousDevice")} title={t("previousDevice")} className={cx("grid h-[34px] w-[30px] place-items-center rounded-[9px] text-ink hover:bg-sunken", focusRing)}>
            <ChevronLeftIcon size={15} />
          </button>
          <span className="min-w-[34px] text-center font-mono text-xs text-ink-2">{position}</span>
          <button type="button" onClick={onNext} aria-label={t("nextDevice")} title={t("nextDevice")} className={cx("grid h-[34px] w-[30px] place-items-center rounded-[9px] text-ink hover:bg-sunken", focusRing)}>
            <ChevronRightIcon size={15} />
          </button>
        </>}
        {single && onZoomOut && onZoomIn && <>
          <span aria-hidden="true" className="mx-0.5 h-[22px] w-px bg-line" />
          <button type="button" onClick={onZoomOut} aria-label={t("zoomOut")} title={t("zoomOut")} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink hover:bg-sunken", focusRing)}>
            <MinusIcon size={14} />
          </button>
          <button type="button" onClick={onZoomReset} title={t("resetFit")} className={cx("h-7 min-w-12 rounded-[7px] bg-sunken px-1 font-mono text-xs text-ink", focusRing)}>{zoomLabel}</button>
          <button type="button" onClick={onZoomIn} aria-label={t("zoomIn")} title={t("zoomIn")} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink hover:bg-sunken", focusRing)}>
            <PlusIcon size={14} strokeWidth={2.4} />
          </button>
          <span aria-hidden="true" className="mx-0.5 h-[22px] w-px bg-line" />
        </>}
        <button type="button" data-exit-view-only onClick={onExit} className={cx("ms-0.5 flex h-[34px] items-center gap-2 rounded-[9px] bg-primary pe-2 ps-3 text-[13px] font-semibold text-on-primary", focusRing)}>
          {t("exit")}<Kbd>Esc</Kbd>
        </button>
      </div>
    </div>
  );
}

function ModeButton({ pressed, onClick, label, icon }: { pressed: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick}
      className={cx("flex h-7 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold text-ink", pressed && "bg-surface shadow-lift", focusRing)}>
      {icon}{label}
    </button>
  );
}

function AllGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="5" height="12" rx="1.5" /><rect x="9" y="4" width="6" height="14" rx="1.5" /><rect x="17" y="8" width="5" height="10" rx="1.5" />
    </svg>
  );
}

function OneGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2" />
    </svg>
  );
}
