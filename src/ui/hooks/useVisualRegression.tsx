import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getViewerContext } from "../../app/viewer-context";
import { useI18n, type TranslationKey } from "../../app/i18n";
import { measureViewport } from "../../domain/visual-regression/capture-viewport";
import {
  baselineKey, VisualRegressionError,
  type BaselineIdentity, type BaselineMeta, type VisualComparison, type VisualRegressionErrorCode,
} from "../../domain/visual-regression/visual-regression.types";
import { requestVisualRegression } from "../../infrastructure/visual-regression/visual-regression-client";
import {
  baselineIndexVersion, clearBaselineIndex, hasBaseline, loadBaselineIndex, markBaseline, subscribeBaselineIndex,
} from "../../infrastructure/visual-regression/baseline-index";
import { CheckIcon, CompareIcon, ListIcon, ReloadIcon, SaveIcon, TrashIcon } from "../icons";
import { ComparisonPanel, ManageBaselines, useFormatters, visualButton, VisualDialog, visualPrimaryButton } from "../components/VisualChecks";
import { cx } from "../components/ui";

interface Options {
  slotId: string;
  deviceId: string;
  deviceName: string;
  orientation: "portrait" | "landscape";
  menuOpen: boolean;
  getFrame: () => HTMLIFrameElement | null | undefined;
  getUrl: () => string;
  dismissMenu: () => void;
  /** Scales the device by `factor` for a capture (null restores it), resolving once laid out. */
  scaleForCapture?: (factor: number | null) => Promise<void>;
}
type Dialog =
  | { kind: "comparison"; result: VisualComparison; updating?: boolean; accepted?: boolean; error?: TranslationKey }
  | { kind: "manage" }
  | { kind: "error"; error: TranslationKey };
const errors: Record<VisualRegressionErrorCode, TranslationKey> = {
  missing: "visualMissing", dimensions: "visualDimensions", storage: "visualStorageError", image: "visualImageError",
  engine: "visualEngineError", capture: "visualCaptureUnavailable", clipped: "visualCaptureClipped",
  changed: "visualPageChanged", expired: "visualExpired", unsupported: "visualUnsupportedPage",
};
const messageFor = (error: unknown): TranslationKey => error instanceof VisualRegressionError ? errors[error.code] ?? "visualEngineError" : "visualEngineError";
const DEFAULT_SENSITIVITY = 10;
const TOAST_MS = 6000;
// A page without the bridge never answers; capture it as it is.
const PREPARE_TIMEOUT_MS = 400;

/** Asks the preview to hide what the viewer draws inside the page (Layout check marks). */
function preparePage(frame: HTMLIFrameElement, slotId: string, hidden: boolean): Promise<void> {
  const target = frame.contentWindow;
  if (!target) return Promise.resolve();
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const done = () => { clearTimeout(timer); window.removeEventListener("message", onMessage); resolve(); };
    const onMessage = (event: MessageEvent) => {
      if (event.source === target && event.data?.type === "MDV_CAPTURE_PREPARED" && event.data.requestId === requestId) done();
    };
    const timer = setTimeout(done, PREPARE_TIMEOUT_MS);
    window.addEventListener("message", onMessage);
    target.postMessage({ type: "MDV_CAPTURE_PREPARE", slotId, requestId, hidden }, "*");
  });
}

function MenuButton({ icon, label, onClick, disabled = false, danger = false, strong = false }: {
  icon: ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean; strong?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} onClick={event => { event.stopPropagation(); onClick(); }}
      className={cx("flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40",
        danger ? "text-danger" : "text-ink", strong ? "font-semibold" : "font-medium")}>
      <span className={cx("grid w-4 shrink-0 place-items-center", danger ? "text-danger" : strong ? "text-accent" : "text-ink-2")}>{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

export function useVisualRegression(options: Options) {
  const { t } = useI18n();
  const format = useFormatters();
  const current = useRef(options); current.current = options;
  const mounted = useRef(true);
  const pending = useRef(false);
  const rediffRun = useRef(0);
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState<"saving" | "comparing" | null>(null);
  const [toast, setToast] = useState(false);
  // undefined while the menu's metadata read is in flight.
  const [baseline, setBaseline] = useState<BaselineMeta | null | undefined>(undefined);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [threshold, setThreshold] = useState(DEFAULT_SENSITIVITY);
  const closeRef = useRef<HTMLButtonElement>(null);
  useSyncExternalStore(subscribeBaselineIndex, baselineIndexVersion);
  useEffect(() => { mounted.current = true; loadBaselineIndex(); return () => { mounted.current = false; }; }, []);
  useEffect(() => { setDialog(null); setBaseline(undefined); }, [options.deviceId, options.orientation]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  function identity(): BaselineIdentity {
    const frame = current.current.getFrame();
    if (!frame || !frame.clientWidth || !frame.clientHeight) throw new VisualRegressionError("capture");
    return { deviceId: current.current.deviceId, url: current.current.getUrl(), orientation: current.current.orientation,
      viewportWidth: frame.clientWidth, viewportHeight: frame.clientHeight };
  }
  function remember(target: BaselineIdentity, meta: BaselineMeta | null) {
    setBaseline(meta);
    try { markBaseline(target, meta !== null); } catch { /* not a web page */ }
  }
  useEffect(() => {
    if (!options.menuOpen) return;
    let cancelled = false;
    setBaseline(undefined);
    // Metadata only: opening a menu never loads a screenshot.
    void (async () => {
      const target = identity();
      const meta = await requestVisualRegression({ action: "read", identity: target });
      if (!cancelled) remember(target, meta);
    })().catch(() => { if (!cancelled) setBaseline(null); });
    return () => { cancelled = true; };
  }, [options.menuOpen, options.deviceId, options.orientation]);
  useEffect(() => { if (dialog) closeRef.current?.focus(); }, [dialog?.kind]);
  function close() { setDialog(null); current.current.getFrame()?.focus({ preventScroll: true }); }

  /**
   * Hide our controls, then let the background capture and crop the tab.
   * With `zoom`, the device is shown at that zoom for the capture, so text is
   * drawn exactly as in the "before" picture; if that does not fit, as it is.
   */
  async function capture(zoom?: number) {
    current.current.dismissMenu();
    setDialog(null);
    setToast(false);
    setCapturing(true);
    const frame = current.current.getFrame();
    const { slotId, scaleForCapture } = current.current;
    let scaled = false;
    try {
      if (!frame) throw new VisualRegressionError("capture");
      // Unmount the menu, dialog and hover toolbar, and hide marks drawn in the page, before the screenshot.
      await Promise.all([
        preparePage(frame, slotId, true),
        new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      ]);
      const factor = zoom && frame.clientWidth ? zoom / (frame.getBoundingClientRect().width / frame.clientWidth) : 1;
      if (scaleForCapture && Math.abs(factor - 1) > 0.002) {
        await scaleForCapture(factor);
        scaled = true;
        try { measureViewport(frame); } catch { await scaleForCapture(null); scaled = false; }
      }
      const target = identity();
      const source = frame.getAttribute("src");
      const { captureId } = await requestVisualRegression({
        action: "capture", identity: target, deviceName: current.current.deviceName, frame: measureViewport(frame),
      });
      if (!frame.isConnected || frame.getAttribute("src") !== source || baselineKey(identity()) !== baselineKey(target)) {
        void requestVisualRegression({ action: "discard", captureId }).catch(() => {});
        throw new VisualRegressionError("changed");
      }
      return { captureId, target };
    } finally {
      if (scaled) void scaleForCapture?.(null);
      if (frame?.isConnected) void preparePage(frame, slotId, false);
      if (mounted.current) setCapturing(false);
    }
  }
  async function run(action: "save" | "compare") {
    if (pending.current) return;
    pending.current = true;
    try {
      // Compare at the zoom the "before" picture was taken at.
      const before = action === "compare" ? await requestVisualRegression({ action: "read", identity: identity() }).catch(() => null) : null;
      const { captureId, target } = await capture(before?.zoom);
      if (!mounted.current) return;
      setProgress(action === "save" ? "saving" : "comparing");
      if (action === "save") {
        const meta = await requestVisualRegression({ action: "save", captureId });
        if (!mounted.current) return;
        remember(target, meta);
        setToast(true);
      } else {
        const result = await requestVisualRegression({ action: "compare", captureId, threshold });
        if (!mounted.current) return;
        rediffRun.current++;
        remember(target, result.baseline);
        setDialog({ kind: "comparison", result });
      }
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof VisualRegressionError && error.code === "missing") {
        try { markBaseline(identity(), false); } catch { /* frame gone */ }
      }
      setDialog({ kind: "error", error: messageFor(error) });
    } finally {
      pending.current = false;
      if (mounted.current) setProgress(null);
    }
  }
  async function remove() {
    current.current.dismissMenu();
    try {
      const target = identity();
      await requestVisualRegression({ action: "delete", identity: target });
      if (mounted.current) remember(target, null);
      current.current.getFrame()?.focus({ preventScroll: true });
    } catch (error) {
      if (mounted.current) setDialog({ kind: "error", error: messageFor(error) });
    }
  }
  function updateComparison(comparisonId: string, change: (dialog: Extract<Dialog, { kind: "comparison" }>) => Dialog) {
    setDialog(open => open?.kind === "comparison" && open.result.comparisonId === comparisonId ? change(open) : open);
  }
  async function changeSensitivity(value: number) {
    setThreshold(value);
    if (dialog?.kind !== "comparison" || dialog.accepted) return;
    const { comparisonId, latestPreview, baselinePreview } = dialog.result;
    const runId = ++rediffRun.current;
    updateComparison(comparisonId, open => ({ ...open, updating: true, error: undefined }));
    try {
      const result = await requestVisualRegression({ action: "rediff", comparisonId, threshold: value });
      if (mounted.current && runId === rediffRun.current) updateComparison(comparisonId, open => ({ ...open, result: { ...result, latestPreview, baselinePreview }, updating: false }));
    } catch (error) {
      if (mounted.current && runId === rediffRun.current) updateComparison(comparisonId, open => ({ ...open, updating: false, error: messageFor(error) }));
    }
  }
  async function accept() {
    if (dialog?.kind !== "comparison") return;
    const { comparisonId, identity: target } = dialog.result;
    try {
      const meta = await requestVisualRegression({ action: "accept", comparisonId });
      if (!mounted.current) return;
      remember(target, meta);
      updateComparison(comparisonId, open => ({ ...open, accepted: true, error: undefined }));
    } catch (error) {
      if (mounted.current) updateComparison(comparisonId, open => ({ ...open, error: messageFor(error) }));
    }
  }
  /** Whether this device's current page has a "before" picture (from the shared index). */
  function hasBefore() {
    try { return hasBaseline(identity()); } catch { return false; }
  }

  const busy = capturing || progress !== null;
  const menuItems = <div className="my-1 grid gap-px border-y border-line-soft py-1.5" role="group" aria-label={t("visualChecks")}>
    <span className="px-2 pb-0.5 text-[11px] font-semibold text-muted">{t("visualChecks")}</span>
    {baseline ? <>
      <MenuButton strong icon={<CompareIcon size={15}/>} label={t("compareLatest")} disabled={busy} onClick={() => void run("compare")}/>
      <MenuButton icon={<ReloadIcon size={15}/>} label={t("replaceBaseline")} disabled={busy} onClick={() => void run("save")}/>
      <MenuButton icon={<TrashIcon size={15}/>} label={t("deleteBaseline")} disabled={busy} danger onClick={() => void remove()}/>
    </> : <MenuButton strong icon={<SaveIcon size={15}/>} label={t("saveBaseline")} disabled={busy || baseline === undefined} onClick={() => void run("save")}/>}
    <MenuButton icon={<ListIcon size={15}/>} label={t("manageBaselines")} onClick={() => { current.current.dismissMenu(); setDialog({ kind: "manage" }); }}/>
    {/* Help sits after the actions it explains. */}
    {baseline ? (
      <p className="mx-1 mt-1 grid gap-px rounded-lg bg-accent-soft px-2.5 py-1.5">
        <span className="text-xs font-semibold text-accent" title={format.date(baseline.savedAt)}>{t("baselineSavedAt", { when: format.ago(baseline.savedAt) })}</span>
        <span className="text-[11.5px] text-ink-2">{t("visualSavedHint")}</span>
      </p>
    ) : baseline === null && <p className="px-2 pt-1 text-[11.5px] leading-snug text-muted">{t("visualSaveHint")}</p>}
  </div>;

  const name = options.deviceName;
  let content: ReactNode = null;
  if (dialog?.kind === "comparison") {
    const { result } = dialog;
    content = <VisualDialog wide closeRef={closeRef} onClose={close}
      title={`${t("visualChecks")} · ${name}`}
      subtitle={<span title={format.date(result.baseline.savedAt)}>{t("visualComparedAt", { when: format.ago(result.baseline.savedAt) })} · {result.identity.url.replace(/^https?:\/\//, "")}</span>}
      footer={<>
        <p className="max-w-[62ch] text-xs leading-snug text-muted">{t(dialog.accepted ? "visualAcceptedHelp" : result.changedPixels ? "visualAcceptHelp" : "visualCaptureHelp")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {dialog.accepted && <span role="status" className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent"><CheckIcon size={11}/>{t("visualBaselineUpdated")}</span>}
          <button type="button" onClick={() => void run("compare")} className={visualButton}>{t("visualCompareAgain")}</button>
          {result.changedPixels > 0 && <button type="button" disabled={dialog.accepted} onClick={() => void accept()} className={visualPrimaryButton}>{t("useLatestBaseline")}</button>}
        </div>
      </>}>
      <ComparisonPanel result={result} threshold={threshold} onThreshold={value => void changeSensitivity(value)}
        updating={Boolean(dialog.updating)} accepted={Boolean(dialog.accepted)} error={dialog.error}/>
    </VisualDialog>;
  } else if (dialog?.kind === "manage") {
    content = <VisualDialog closeRef={closeRef} onClose={close} title={t("visualManageTitle")} subtitle={t("visualStoredLocally")}>
      <ManageBaselines onDeleted={deleted => {
        if (!deleted) { clearBaselineIndex(); setBaseline(null); return; }
        markBaseline(deleted, false);
        try { if (baselineKey(deleted) === baselineKey(identity())) setBaseline(null); } catch { /* frame gone */ }
      }}/>
    </VisualDialog>;
  } else if (dialog?.kind === "error") {
    content = <VisualDialog closeRef={closeRef} onClose={close} title={`${t("visualChecks")} · ${name}`}>
      <p role="alert" className="p-4 text-sm text-danger">{t(dialog.error)}</p>
    </VisualDialog>;
  } else if (progress || toast) {
    // Shown only after the capture, so it never appears in the screenshot.
    content = <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[200] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-ink-2 shadow-popover">
      {progress ? <>
        <span aria-hidden="true" className="size-3 shrink-0 animate-spin rounded-full border-2 border-accent-line border-t-accent motion-reduce:animate-none"/>
        <span className="font-semibold text-ink">{t(progress === "saving" ? "visualSaving" : "visualComparing")}</span>
      </> : <>
        <span className="shrink-0 text-accent"><CheckIcon size={14}/></span>
        <span><b className="font-semibold text-ink">{t("baselineSaved")}</b> {t("visualSavedToast")}</span>
      </>}
    </div>;
  }
  const portal = content && createPortal(content, (getViewerContext()?.root ?? document).querySelector("[data-interface-layout]") ?? document.body);
  return { capturing, busy, menuItems, dialog: portal, hasBefore, compare: () => void run("compare") };
}
