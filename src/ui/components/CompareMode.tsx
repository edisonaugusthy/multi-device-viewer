import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { getViewerEventTarget } from "../../app/viewer-context";
import { BackIcon, LockIcon, MinusIcon, OverlayIcon, PencilIcon, PlusIcon, SideBySideIcon, UnlockIcon, UploadIcon, CloseIcon } from "../icons";
import { BrandMark } from "./BrandMark";
import { cx, focusRing, IconButton, Segmented, Switch } from "./ui";

export type CompareMode = "side-by-side" | "overlay";
export type CompareBlend = "normal" | "difference";

export interface CompareTab {
  slotId: string;
  label: string;
  hasDesign: boolean;
}

export function readDesignFile(file: File | undefined, onLoad: (image: string, name: string) => void) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => { if (typeof reader.result === "string") onLoad(reader.result, file.name); };
  reader.readAsDataURL(file);
}

// Compare replaces the main header: one bar with the way back on both ends.
export function CompareBar({ tabs, activeSlotId, mode, onSelect, onModeChange, onBack }: {
  tabs: CompareTab[];
  activeSlotId: string;
  mode: CompareMode;
  onSelect: (slotId: string) => void;
  onModeChange: (mode: CompareMode) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  return (
    <header data-compare-toolbar className="relative z-30 flex h-[52px] shrink-0 items-center gap-2.5 border-b border-line bg-surface px-2.5">
      <BrandMark size={28} />
      <button type="button" onClick={onBack} aria-label={t("backToWorkspace")} title={t("backToWorkspace")}
        className={cx("flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-line pe-2.5 ps-2 text-[13px] font-semibold text-ink hover:bg-sunken", focusRing)}>
        <BackIcon size={15} className="rtl:rotate-180" />{t("workspace")}
      </button>
      <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-line" />
      <span className="whitespace-nowrap text-[13px] font-semibold">{t("compareWithDesign")}</span>
      <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-line" />
      <div role="tablist" aria-label={t("deviceToCompare")} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const active = tab.slotId === activeSlotId;
          return (
            <button
              key={tab.slotId}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.slotId)}
              className={cx(
                "flex h-[34px] shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] border px-3 text-[13px] text-ink",
                active ? "border-ink bg-surface font-semibold" : "border-transparent font-medium hover:bg-sunken",
                focusRing,
              )}
            >
              {tab.label}
              <span className={cx(
                "rounded-full px-[7px] py-0.5 text-[11.5px] font-semibold",
                tab.hasDesign ? "bg-design-soft text-design-ink" : "bg-sunken text-muted",
              )}>
                {tab.hasDesign ? t("hasDesign") : t("noDesign")}
              </span>
            </button>
          );
        })}
      </div>
      <Segmented
        label={t("comparisonMode")}
        value={mode}
        onChange={onModeChange}
        options={[
          { value: "side-by-side", label: t("sideBySide"), icon: <SideBySideIcon size={16} /> },
          { value: "overlay", label: t("overlay"), icon: <OverlayIcon size={16} /> },
        ]}
      />
      <IconButton label={t("backToWorkspace")} tooltip={t("tipBackToWorkspace")} tooltipAlign="end" onClick={onBack}><CloseIcon size={18} /></IconButton>
    </header>
  );
}

// Labels above the live page and the design, so each side is obvious.
export function CompareLabel({ tone, title, detail, children }: { tone: "live" | "design"; title: string; detail?: string; children?: ReactNode }) {
  return (
    <div className="flex h-7 shrink-0 items-center justify-center gap-2 text-[13px]">
      <span aria-hidden="true" className={cx("size-2 rounded-full", tone === "live" ? "bg-accent" : "bg-design")} />
      <span className="font-semibold">{title}</span>
      {detail && <span className="max-w-60 truncate font-mono text-xs text-muted">{detail}</span>}
      {children}
    </div>
  );
}

export function DesignPane({ image, fileName, deviceName, width, height, scrollTop, onImage, onRemove, onMarkUp }: {
  image?: string;
  fileName?: string;
  deviceName: string;
  width: number;
  height: number;
  scrollTop?: number;
  onImage: (image: string, name: string) => void;
  onRemove: () => void;
  onMarkUp: (image: string) => void;
}) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (image) return;
    const onPaste = (event: Event) => {
      const file = Array.from((event as ClipboardEvent).clipboardData?.files ?? []).find(candidate => candidate.type.startsWith("image/"));
      if (file) readDesignFile(file, onImage);
    };
    const target = getViewerEventTarget();
    target.addEventListener("paste", onPaste);
    return () => target.removeEventListener("paste", onPaste);
  }, [image, onImage]);

  useEffect(() => {
    if (scrollTop !== undefined && scrollRef.current) scrollRef.current.scrollTop = scrollTop;
  }, [scrollTop]);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    readDesignFile(Array.from(event.dataTransfer.files).find(file => file.type.startsWith("image/")), onImage);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-3">
      <CompareLabel tone="design" title={t("design")} detail={image ? fileName : undefined}>
        {image && <>
          <button type="button" onClick={() => fileInput.current?.click()} className={cx("h-[26px] rounded-[7px] border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-sunken", focusRing)}>{t("replaceDesign")}</button>
          <button type="button" onClick={() => onMarkUp(image)} aria-label={t("markFeedback")} title={t("markFeedback")} className={cx("grid size-[26px] place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}><PencilIcon size={14} /></button>
          <button type="button" onClick={onRemove} aria-label={t("removeDesign")} title={t("removeDesign")} className={cx("grid size-[26px] place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}><CloseIcon size={13} strokeWidth={2.4} /></button>
        </>}
      </CompareLabel>
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1}
        onChange={event => { readDesignFile(event.target.files?.[0], onImage); event.target.value = ""; }} />
      <div className="flex min-h-0 w-full flex-1 items-end justify-center">
        {image ? (
          <div
            ref={scrollRef}
            className="overflow-y-auto overflow-x-hidden rounded-lg bg-surface shadow-[0_12px_30px_rgb(20_23_26/0.14)] [scrollbar-width:none]"
            style={{ width, height }}
          >
            <img src={image} alt={t("importedDesignReference")} draggable={false} className="block w-full" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragEnter={event => { event.preventDefault(); setDragging(true); }}
            onDragOver={event => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cx(
              "flex min-h-[220px] min-w-[220px] flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed p-4 text-center text-[13px] font-semibold text-ink",
              dragging ? "border-design bg-design-soft" : "border-faint bg-sunken",
              focusRing,
            )}
            style={{ width, height }}
          >
            <UploadIcon size={22} />
            {t("addDesignFor", { name: deviceName })}
            <span className="text-xs font-medium text-muted">{t("dropDesignHint")}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function CompareControls({ mode, opacity, blend, locked, scrollLinked, zoomLabel, hasDesign,
  onOpacityChange, onBlendChange, onLockedChange, onReset, onScrollLinkedChange, onZoomOut, onZoomIn, onZoomReset, onAddDesign }: {
  mode: CompareMode;
  opacity: number;
  blend: CompareBlend;
  locked: boolean;
  scrollLinked: boolean;
  zoomLabel: string;
  hasDesign: boolean;
  onOpacityChange: (opacity: number) => void;
  onBlendChange: (blend: CompareBlend) => void;
  onLockedChange: (locked: boolean) => void;
  onReset: () => void;
  onScrollLinkedChange: (linked: boolean) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomReset: () => void;
  onAddDesign: () => void;
}) {
  const { t } = useI18n();
  return (
    <div role="toolbar" aria-label={t("comparisonControls")}
      className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-[14px] border border-line bg-surface px-1.5 py-[5px] shadow-bar">
      {mode === "overlay" && (hasDesign ? <>
        <label className="flex items-center gap-2 ps-2 text-[12.5px] font-semibold">
          {t("opacity")}
          <input type="range" min={0} max={100} step={5} value={opacity} aria-label={t("designOverlayOpacity")}
            onChange={event => onOpacityChange(Number(event.target.value))} className="w-[120px] accent-design" />
        </label>
        <span className="w-10 font-mono text-xs text-ink-2">{opacity}%</span>
        <Divider />
        <Segmented label={t("blend")} value={blend} onChange={onBlendChange}
          options={[{ value: "normal", label: t("normal") }, { value: "difference", label: t("difference"), title: t("differenceHint") }]} />
        <Divider />
        <button type="button" aria-pressed={locked} title={t("lockOverlayHint")} onClick={() => onLockedChange(!locked)}
          className={cx("flex h-[34px] items-center gap-1.5 rounded-[9px] border px-2.5 text-[12.5px] font-semibold",
            locked ? "border-design-line bg-design-soft text-design-ink" : "border-line bg-surface text-ink", focusRing)}>
          {locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
          {locked ? t("locked") : t("unlocked")}
        </button>
        <button type="button" title={t("resetOverlayHint")} onClick={onReset} className={cx("h-[34px] rounded-[9px] px-2.5 text-[12.5px] font-semibold text-ink hover:bg-sunken", focusRing)}>{t("reset")}</button>
        <Divider />
      </> : <>
        <button type="button" onClick={onAddDesign} className={cx("h-[34px] rounded-[9px] border-[1.5px] border-dashed border-faint px-3.5 text-[13px] font-semibold text-ink", focusRing)}>{t("addDesignToOverlay")}</button>
        <Divider />
      </>)}
      {mode === "side-by-side" && <>
        <label className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[9px] px-2.5 text-[12.5px] font-semibold">
          {t("scrollDesignWithPage")}
          <Switch size="sm" checked={scrollLinked} onChange={onScrollLinkedChange} label={t("scrollDesignWithPage")} />
        </label>
        <Divider />
      </>}
      <button type="button" aria-label={t("zoomOut")} title={t("zoomOut")} onClick={onZoomOut} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink hover:bg-sunken", focusRing)}><MinusIcon size={14} /></button>
      <button type="button" title={t("resetFit")} onClick={onZoomReset} className={cx("h-7 min-w-12 rounded-[7px] bg-sunken font-mono text-xs text-ink", focusRing)}>{zoomLabel}</button>
      <button type="button" aria-label={t("zoomIn")} title={t("zoomIn")} onClick={onZoomIn} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink hover:bg-sunken", focusRing)}><PlusIcon size={14} strokeWidth={2.4} /></button>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-line" />;
}
