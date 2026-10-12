import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import {
  baselineKey, MAX_BASELINE_BYTES, MAX_BASELINES,
  type BaselineIdentity, type BaselineMeta, type ChangedRegion, type VisualComparison,
} from "../../domain/visual-regression/visual-regression.types";
import { requestVisualRegression } from "../../infrastructure/visual-regression/visual-regression-client";
import { CheckIcon, CloseIcon } from "../icons";
import { cx, focusRing, Segmented } from "./ui";

export const SENSITIVITY_PRESETS = [
  { value: 0, label: "visualSensitivityExact", help: "visualSensitivityExactHelp" },
  { value: 16, label: "visualSensitivityNormal", help: "visualSensitivityHelp" },
  { value: 40, label: "visualSensitivityRelaxed", help: "visualSensitivityRelaxedHelp" },
] as const satisfies ReadonlyArray<{ value: number; label: TranslationKey; help: TranslationKey }>;
const MASK_COLOR = [239, 68, 68, 150];
const outline = cx("inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border bg-surface px-3 text-xs font-semibold hover:bg-sunken disabled:opacity-50", focusRing);
const button = cx(outline, "border-line text-ink");
const danger = cx(outline, "border-line text-danger");
const primary = cx("inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3 text-xs font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-50", focusRing);
const sectionTitle = "text-[11px] font-semibold uppercase tracking-wide text-muted";

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
export function useFormatters() {
  const { locale } = useI18n();
  return useMemo(() => {
    const tag = locale.replace("_", "-");
    const integer = new Intl.NumberFormat(tag);
    const megabytes = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
    const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    return {
      integer: (value: number) => integer.format(value),
      megabytes: (bytes: number) => bytes > 0 && bytes < 52429 ? `<${megabytes.format(0.1)}` : megabytes.format(bytes / 1048576),
      size: (bytes: number) => bytes < 1048576 ? `${integer.format(Math.max(1, Math.round(bytes / 1024)))} KB` : `${megabytes.format(bytes / 1048576)} MB`,
      date: (time: number) => new Date(time).toLocaleString(tag, { dateStyle: "full", timeStyle: "short" }),
      /** "2 hours ago", "yesterday", "now". */
      ago: (time: number) => {
        const seconds = (time - Date.now()) / 1000;
        for (const [unit, size] of UNITS) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
        return relative.format(0, "second");
      },
    };
  }, [locale]);
}

/** Modal shell: traps focus and closes on Escape; the hook owns its state. */
export function VisualDialog({ title, subtitle, onClose, closeRef, children, footer, wide = false }: {
  title: string; subtitle?: ReactNode; onClose: () => void; closeRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onPointerDown={event => event.stopPropagation()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="mdv-visual-title" data-visual-regression-result
        className={cx("flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-popover", wide ? "max-w-5xl" : "max-w-lg")}
        onKeyDown={event => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); return; }
          if (event.key === "Tab") {
            const controls = ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select");
            if (!controls?.length) return;
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
          }
        }}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div className="grid min-w-0 gap-0.5">
            <h2 id="mdv-visual-title" className="text-[15px] font-semibold">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={button}>{t("close")}</button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

/** Changed cells drawn from the worker's bit mask: no full-size mask image. */
function ChangeMask({ result }: { result: VisualComparison }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext("2d");
    if (!context) return;
    const bits = Uint8Array.from(atob(result.mask), character => character.charCodeAt(0));
    const image = new ImageData(result.columns, result.rows);
    for (let cell = 0; cell < result.columns * result.rows; cell++) {
      if (bits[cell >> 3] & (1 << (cell & 7))) image.data.set(MASK_COLOR, cell * 4);
    }
    context.putImageData(image, 0, 0);
  }, [result.mask, result.columns, result.rows]);
  return <canvas ref={ref} width={result.columns} height={result.rows} aria-hidden="true"
    className="pointer-events-none absolute left-0 top-0 [image-rendering:pixelated]"
    style={{ width: `${result.columns * result.cellSize / result.width * 100}%`, height: `${result.rows * result.cellSize / result.height * 100}%` }}/>;
}

/** The same spot cut from a preview, so a change can be read from the list. */
const CROP_W = 80, CROP_H = 36, CROP_PAD = 20;
function RegionCrop({ src, region, result, label }: { src?: string; region: ChangedRegion; result: VisualComparison; label: string }) {
  const scale = Math.min(CROP_W / (region.width + CROP_PAD * 2), CROP_H / (region.height + CROP_PAD * 2), 2);
  const x = (region.x + region.width / 2) * scale - CROP_W / 2, y = (region.y + region.height / 2) * scale - CROP_H / 2;
  return <span role="img" aria-label={label} title={label}
    className="block shrink-0 rounded-[5px] border border-line bg-white bg-no-repeat"
    style={{ width: CROP_W, height: CROP_H, backgroundImage: src ? `url("${src}")` : undefined,
      backgroundSize: `${result.width * scale}px ${result.height * scale}px`, backgroundPosition: `${-x}px ${-y}px` }}/>;
}

function zoomTransform(region: ChangedRegion | undefined, result: VisualComparison) {
  if (!region) return "none";
  const centerX = (region.x + region.width / 2) / result.width, centerY = (region.y + region.height / 2) / result.height;
  const scale = Math.min(4, Math.max(1, 0.6 / Math.max(region.width / result.width, region.height / result.height)));
  // Keep the zoomed page covering the frame instead of showing empty space.
  const offset = (center: number) => Math.min(0, Math.max(1 - scale, 0.5 - center * scale)) * 100;
  return `translate(${offset(centerX)}%, ${offset(centerY)}%) scale(${scale})`;
}
const whereKey = (region: ChangedRegion, height: number): TranslationKey => {
  const center = (region.y + region.height / 2) / height;
  return center < 1 / 3 ? "visualWhereTop" : center < 2 / 3 ? "visualWhereMiddle" : "visualWhereBottom";
};

type ComparisonViewMode = "changes" | "slider" | "before" | "after";
export function ComparisonPanel({ result, threshold, onThreshold, updating, accepted, error }: {
  result: VisualComparison; threshold: number; onThreshold: (value: number) => void; updating: boolean; accepted: boolean; error?: TranslationKey;
}) {
  const { t } = useI18n();
  const format = useFormatters();
  const [view, setView] = useState<ComparisonViewMode>("changes");
  const [selected, setSelected] = useState<number | null>(null);
  const [slider, setSlider] = useState(50);
  const regions = result.regions;
  const region = selected === null ? undefined : regions[selected];
  const before = result.baselinePreview, after = result.latestPreview;
  useEffect(() => { if (selected !== null && selected >= regions.length) setSelected(null); }, [regions.length, selected]);
  const step = (direction: 1 | -1) => {
    if (!regions.length) return;
    setView("changes");
    setSelected(current => current === null ? (direction > 0 ? 0 : regions.length - 1) : (current + direction + regions.length) % regions.length);
  };
  // N and P work from anywhere in the dialog, including the initially focused Close button.
  const root = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step); stepRef.current = step;
  useEffect(() => {
    const dialog = root.current?.closest<HTMLElement>("[role=dialog]");
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "n" || event.key === "N") { event.preventDefault(); stepRef.current(1); }
      if (event.key === "p" || event.key === "P") { event.preventDefault(); stepRef.current(-1); }
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, []);
  const preset = SENSITIVITY_PRESETS.find(item => item.value === threshold) ?? SENSITIVITY_PRESETS[1];
  const count = result.changedPixels ? Math.max(1, result.regionCount) : 0;
  const shown = view === "before" ? before : after;
  return (
    <div ref={root} className="grid min-h-0 md:grid-cols-[minmax(0,1fr)_272px]">
      <div className="grid min-w-0 content-start gap-3 border-line-soft p-4 md:border-e">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="status" aria-live="polite" className="grid gap-0.5" data-visual-changed-pixels={result.changedPixels}>
            <span className="flex items-center gap-2 text-[17px] font-semibold">
              {count ? t(count === 1 ? "visualChangedOne" : "visualChangedMany", { count: format.integer(count) }) : <>
                <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent"><CheckIcon size={12}/></span>
                {t("visualUnchanged")}
              </>}
              {updating && <span className="text-xs font-medium text-muted">{t("visualUpdating")}</span>}
            </span>
            <span className="text-xs text-muted">{t(count ? "visualChangedSub" : "visualUnchangedSub")}</span>
          </div>
          <Segmented size="sm" label={t("visualComparisonView")} value={view} onChange={value => { setView(value); if (value !== "changes") setSelected(null); }}
            options={[
              { value: "changes", label: t("visualChanges") },
              { value: "slider", label: t("visualSwipe") },
              { value: "before", label: t("visualBaseline") },
              { value: "after", label: t("visualLatest") },
            ]}/>
        </div>
        {/* Sized from the capture's aspect ratio, so overlays line up for any device shape. */}
        <div className="relative mx-auto overflow-hidden rounded-lg border border-line bg-white"
          style={{ aspectRatio: `${result.width} / ${result.height}`, width: `min(100%, calc(min(56dvh, 640px) * ${result.width / result.height}))` }}>
          <div className="relative size-full origin-top-left transition-transform duration-200 motion-reduce:transition-none" style={{ transform: zoomTransform(region, result) }}>
            <img src={shown ?? after} alt={t(view === "before" ? "visualBaseline" : "visualLatest")} draggable={false}
              className="block size-full"/>
            {view === "slider" && before && <>
              <img src={before} alt={t("visualBaseline")} draggable={false} className="absolute inset-0 size-full"
                style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}/>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-accent" style={{ left: `${slider}%` }}/>
              <span className="pointer-events-none absolute bottom-2 left-2 rounded-[5px] bg-black/70 px-1.5 py-0.5 text-[10.5px] font-semibold text-white">{t("visualBaseline")}</span>
              <span className="pointer-events-none absolute bottom-2 right-2 rounded-[5px] bg-black/70 px-1.5 py-0.5 text-[10.5px] font-semibold text-white">{t("visualLatest")}</span>
            </>}
            {view === "changes" && <>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/40"/>
              <ChangeMask result={result}/>
              {regions.map((item, index) => (
                <button key={`${item.x}:${item.y}`} type="button" aria-pressed={selected === index}
                  aria-label={`${t("visualAreaNumber", { index: index + 1 })}, ${t(whereKey(item, result.height))}`}
                  onClick={() => setSelected(current => current === index ? null : index)}
                  className={cx("absolute min-h-3 min-w-3 rounded-[3px] border-2 border-red-500 bg-red-500/10 outline-none focus-visible:ring-2 focus-visible:ring-accent", selected === index && "ring-[3px] ring-red-500/35")}
                  style={{ left: `${item.x / result.width * 100}%`, top: `${item.y / result.height * 100}%`, width: `${item.width / result.width * 100}%`, height: `${item.height / result.height * 100}%` }}>
                  <span className="absolute -left-2 -top-2 grid size-4 place-items-center rounded-full bg-red-500 font-mono text-[9.5px] font-bold text-white">{index + 1}</span>
                </button>
              ))}
            </>}
          </div>
        </div>
        {view === "slider" && (
          <label className="mx-auto flex w-full max-w-sm items-center gap-3 text-xs font-semibold text-ink-2">
            {t("visualBaseline")}
            <input type="range" min="0" max="100" value={slider} onChange={event => setSlider(Number(event.target.value))}
              aria-label={t("visualSwipePosition")} className="min-w-0 flex-1 accent-accent"/>
            {t("visualLatest")}
          </label>
        )}
        {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
      </div>
      <aside className="grid content-start gap-5 bg-surface-2 p-4">
        <section className="grid gap-1.5">
          <h3 className={sectionTitle}>{t("visualTolerance")}</h3>
          <Segmented size="sm" label={t("visualTolerance")} value={String(preset.value)} onChange={value => { if (!accepted) onThreshold(Number(value)); }}
            className={cx("w-full [&>button]:flex-1 [&>button]:justify-center", accepted && "pointer-events-none opacity-50")}
            options={SENSITIVITY_PRESETS.map(item => ({ value: String(item.value), label: t(item.label) }))}/>
          <p className="text-[11.5px] leading-snug text-muted">{t(preset.help)}</p>
        </section>
        {regions.length > 0 && <section className="grid gap-1.5">
          <h3 className={sectionTitle}>{t("visualChangedAreas")}</h3>
          <ol className="grid gap-1">
            {regions.map((item, index) => (
              <li key={`${item.x}:${item.y}`}>
                <button type="button" aria-pressed={selected === index} onClick={() => { setView("changes"); setSelected(current => current === index ? null : index); }}
                  className={cx("grid w-full grid-cols-[18px_minmax(0,1fr)] items-start gap-2 rounded-lg px-2 py-2 text-start hover:bg-sunken", selected === index && "bg-surface shadow-lift", focusRing)}>
                  <span className="mt-px grid size-[18px] place-items-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">{index + 1}</span>
                  <span className="grid min-w-0 gap-1.5">
                    <span className="text-[12.5px] font-semibold">{t(whereKey(item, result.height))}</span>
                    <span className="flex items-center gap-1.5">
                      <RegionCrop src={before} region={item} result={result} label={t("visualBaseline")}/>
                      <span aria-hidden="true" className="text-faint rtl:rotate-180">→</span>
                      <RegionCrop src={after} region={item} result={result} label={t("visualLatest")}/>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {result.regionCount > regions.length && <p className="px-2 text-xs text-muted">{t("visualMoreAreas", { count: format.integer(result.regionCount - regions.length) })}</p>}
          <p className="px-2 text-[11.5px] leading-snug text-muted">{t("visualStepHint")}</p>
          {selected !== null && <button type="button" onClick={() => setSelected(null)} className={cx(button, "mt-1 w-fit")}>{t("visualShowWhole")}</button>}
        </section>}
      </aside>
    </div>
  );
}

export function ManageBaselines({ onDeleted }: { onDeleted: (identity?: BaselineIdentity) => void }) {
  const { t } = useI18n();
  const format = useFormatters();
  const [items, setItems] = useState<BaselineMeta[] | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    let active = true;
    void requestVisualRegression({ action: "list" }).then(list => { if (active) setItems(list); })
      .catch(() => { if (active) { setItems([]); setError("visualStorageError"); } });
    return () => { active = false; };
  }, []);
  const groups = useMemo(() => {
    const byUrl = new Map<string, BaselineMeta[]>();
    for (const item of items ?? []) byUrl.set(item.identity.url, [...byUrl.get(item.identity.url) ?? [], item]);
    return [...byUrl.entries()];
  }, [items]);
  const used = (items ?? []).reduce((total, item) => total + item.bytes, 0);
  async function remove(identity?: BaselineIdentity) {
    try {
      if (identity) await requestVisualRegression({ action: "delete", identity });
      else await requestVisualRegression({ action: "clear" });
      setItems(current => identity ? (current ?? []).filter(item => baselineKey(item.identity) !== baselineKey(identity)) : []);
      setConfirming(false);
      onDeleted(identity);
    } catch { setError("visualStorageError"); }
  }
  if (!items) return <p className="p-4 text-sm text-muted">{t("loading")}</p>;
  return (
    <div className="grid">
      {!items.length && <p className="p-4 text-sm text-muted">{t("visualNoBaselines")}</p>}
      <ul className="grid">
        {groups.map(([url, metas]) => (
          <li key={url} className="grid gap-1.5 border-b border-line-soft px-4 py-3 last:border-b-0">
            <p className="break-all text-[13px] font-semibold">{url.replace(/^https?:\/\//, "")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {metas.map(meta => {
                const name = meta.deviceName || meta.identity.deviceId;
                return (
                  <li key={baselineKey(meta.identity)} title={`${meta.identity.viewportWidth}×${meta.identity.viewportHeight} · ${format.date(meta.savedAt)}`}
                    className="inline-flex items-center gap-1 rounded-md bg-sunken py-0.5 pe-0.5 ps-2 text-[11.5px] text-ink-2">
                    {name} <span className="text-faint">· {format.ago(meta.savedAt)}</span>
                    <button type="button" onClick={() => void remove(meta.identity)} aria-label={t("deleteNamed", { name: `${name} · ${url}` })}
                      className={cx("grid size-5 place-items-center rounded text-muted hover:bg-surface hover:text-danger", focusRing)}><CloseIcon size={11}/></button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 border-t border-line bg-surface-2 px-4 py-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-sunken" role="meter" aria-label={t("visualManageTitle")}
          aria-valuemin={0} aria-valuemax={MAX_BASELINE_BYTES} aria-valuenow={used}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, used / MAX_BASELINE_BYTES * 100)}%` }}/>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted">{t("visualUsage", { count: format.integer(items.length), max: MAX_BASELINES, used: format.megabytes(used), limit: format.megabytes(MAX_BASELINE_BYTES) })}</span>
          {items.length > 0 && (confirming
            ? <span className="flex gap-2">
                <button type="button" onClick={() => setConfirming(false)} className={button}>{t("cancel")}</button>
                <button type="button" onClick={() => void remove()} className={cx(outline, "border-danger text-danger")}>{t("visualDeleteAllConfirm", { count: format.integer(items.length) })}</button>
              </span>
            : <button type="button" onClick={() => setConfirming(true)} className={danger}>{t("visualDeleteAll")}</button>)}
        </div>
        {error && <p role="alert" className="text-xs text-danger">{t(error)}</p>}
      </div>
    </div>
  );
}

export { button as visualButton, primary as visualPrimaryButton };
