import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { blobToDataUrl, captureVisible, captureWholePage, dataUrlToBytes, safeFileName } from "../../app/preview-capture";
import { downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { createZip } from "../../domain/capture/zip";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import { CameraIcon, CheckIcon, CloseIcon, DownloadIcon, ExpandIcon, GridIcon } from "../icons";
import { cx, focusRing, popoverPanel, positionStyle, Switch, useAnchoredPosition, useDismiss } from "./ui";

/**
 * Screenshots through Chrome's debugger: the active device's visible screen
 * or whole page at its own pixel ratio, every device's whole page in a .zip,
 * or the workspace for annotating. Shown only while the debugger is attached.
 */
export interface CaptureTarget { slotId: string; name: string; dpr: number }
type RowState = "waiting" | "running" | "done" | "failed";
interface Progress { rows: Array<CaptureTarget & { state: RowState }>; cancelled: boolean }

const FRAME_KEY = "mdvCaptureFrame";

export function useCaptures() {
  const [withFrame, setWithFrameState] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [failed, setFailed] = useState(false);
  const cancelled = useRef(false);
  useEffect(() => { void readStore<unknown>(FRAME_KEY, false).then(value => setWithFrameState(value === true)).catch(() => undefined); }, []);
  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => setFailed(false), 4000);
    return () => clearTimeout(timer);
  }, [failed]);
  function setWithFrame(next: boolean) {
    setWithFrameState(next);
    void writeStore(FRAME_KEY, next).catch(() => undefined);
  }

  async function one(target: CaptureTarget, whole: boolean) {
    setProgress({ rows: [{ ...target, state: "running" }], cancelled: false });
    try {
      const dataUrl = whole
        ? await captureWholePage(target.slotId, target.dpr).then(blob => blob && blobToDataUrl(blob))
        : await captureVisible(target.slotId, target.dpr, { withFrame });
      if (!dataUrl) throw new Error("capture");
      setProgress(null);
      await downloadDataUrl(dataUrl, screenshotFilename(safeFileName(`${target.name} ${whole ? "page" : "screen"}`)));
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  }
  async function all(targets: CaptureTarget[]) {
    cancelled.current = false;
    let rows = targets.map(target => ({ ...target, state: "waiting" as RowState }));
    const show = () => setProgress({ rows, cancelled: cancelled.current });
    show();
    const files: Array<{ name: string; data: Uint8Array }> = [];
    const used = new Set<string>();
    try {
      for (const [index, target] of targets.entries()) {
        if (cancelled.current) return;
        rows = rows.map((row, i) => i === index ? { ...row, state: "running" } : row);
        show();
        const blob = await captureWholePage(target.slotId, target.dpr).catch(() => null);
        rows = rows.map((row, i) => i === index ? { ...row, state: blob ? "done" : "failed" } : row);
        show();
        if (!blob) continue;
        let name = safeFileName(target.name);
        for (let n = 2; used.has(name); n++) name = `${safeFileName(target.name)} ${n}`;
        used.add(name);
        files.push({ name: `${name}.png`, data: dataUrlToBytes(await blobToDataUrl(blob)) });
      }
      if (cancelled.current) return;
      if (!files.length) { setFailed(true); return; }
      const zip = await blobToDataUrl(new Blob([createZip(files) as BlobPart], { type: "application/zip" }));
      setProgress(null);
      await downloadDataUrl(zip, screenshotFilename("devices").replace(/\.png$/, ".zip"));
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  }
  return {
    withFrame, setWithFrame, progress, failed, busy: progress !== null,
    visible: (target: CaptureTarget) => void one(target, false),
    wholePage: (target: CaptureTarget) => void one(target, true),
    all: (targets: CaptureTarget[]) => void all(targets),
    cancel: () => { cancelled.current = true; setProgress(null); },
  };
}

function Item({ icon, label, detail, onClick, attr }: { icon: ReactNode; label: string; detail?: string; onClick: () => void; attr: string }) {
  return (
    <button type="button" {...{ [attr]: "" }} onClick={onClick}
      className={cx("flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium text-ink hover:bg-sunken", focusRing)}>
      <span className="grid w-4 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {detail && <span className="shrink-0 font-mono text-[11px] text-muted">{detail}</span>}
    </button>
  );
}

export function CaptureMenu({ open, anchorRef, onClose, active, targets, captures, onWorkspace }: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  active?: CaptureTarget;
  targets: CaptureTarget[];
  captures: ReturnType<typeof useCaptures>;
  onWorkspace: () => void;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 260, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;
  const heading = "px-2 pb-0.5 pt-1 text-[11px] font-semibold text-muted";
  const run = (action: () => void) => { onClose(); action(); };
  return (
    <div ref={panelRef} role="dialog" aria-label={t("captureMenu")} data-capture-menu className={cx(popoverPanel, "fixed p-1.5")} style={positionStyle(position)}>
      {active && <>
        <p className={heading}>{active.name}</p>
        <Item attr="data-capture-visible" icon={<CameraIcon size={15} />} label={t("captureVisible")} detail={`@${active.dpr}x`} onClick={() => run(() => captures.visible(active))} />
        <Item attr="data-capture-page" icon={<ExpandIcon size={15} />} label={t("captureWholePage")} onClick={() => run(() => captures.wholePage(active))} />
      </>}
      {targets.length > 1 && <>
        <p className={cx(heading, "mt-1 border-t border-line-soft pt-2")}>{t("captureEveryDevice")}</p>
        <Item attr="data-capture-all" icon={<DownloadIcon size={15} />} label={t("captureAllZip")} detail={String(targets.length)} onClick={() => run(() => captures.all(targets))} />
      </>}
      <div className="mt-1 border-t border-line-soft pt-1">
        <Item attr="data-capture-workspace" icon={<GridIcon size={15} />} label={t("captureWorkspace")} onClick={() => run(onWorkspace)} />
      </div>
      <label className="mt-1 flex h-9 items-center justify-between gap-2.5 border-t border-line-soft px-2 pt-1 text-[13px] font-medium">
        {t("captureDeviceFrame")}
        <Switch size="sm" checked={captures.withFrame} onChange={captures.setWithFrame} label={t("captureDeviceFrame")} />
      </label>
    </div>
  );
}

/** Progress for captures that take a moment, and why one failed. */
export function CaptureStatus({ captures }: { captures: ReturnType<typeof useCaptures> }) {
  const { t } = useI18n();
  const { progress, failed } = captures;
  if (!progress && !failed) return null;
  if (!progress) {
    return <div role="alert" className="fixed bottom-7 left-1/2 z-[200] -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-danger shadow-popover">{t("captureFailed")}</div>;
  }
  const done = progress.rows.filter(row => row.state === "done" || row.state === "failed").length;
  const labels: Record<RowState, string> = { waiting: t("captureWaiting"), running: t("captureRunning"), done: t("captureDone"), failed: t("captureFailedShort") };
  return (
    <div role="status" aria-live="polite" data-capture-progress className="fixed bottom-7 left-1/2 z-[200] w-[300px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl border border-line bg-surface p-2 text-[13px] shadow-popover">
      <div className="flex items-center gap-2 px-1.5 pb-1">
        <span aria-hidden="true" className="size-3 shrink-0 animate-spin rounded-full border-2 border-accent-line border-t-accent motion-reduce:animate-none" />
        <span className="flex-1 font-semibold">{progress.rows.length > 1 ? t("captureProgress", { done: Math.min(done + 1, progress.rows.length), total: progress.rows.length }) : t("captureRunning")}</span>
        {progress.rows.length > 1 && <button type="button" onClick={captures.cancel} aria-label={t("cancel")} className={cx("grid size-6 place-items-center rounded-md text-ink-2 hover:bg-sunken", focusRing)}><CloseIcon size={12} strokeWidth={2.6} /></button>}
      </div>
      {progress.rows.length > 1 && <ul className="grid gap-px">
        {progress.rows.map(row => (
          <li key={row.slotId} className="flex items-center gap-2 rounded-md px-1.5 py-1">
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className={cx("inline-flex items-center gap-1 text-xs", row.state === "done" ? "text-accent" : row.state === "failed" ? "text-danger" : "text-muted")}>
              {row.state === "done" && <CheckIcon size={11} strokeWidth={3} />}{labels[row.state]}
            </span>
          </li>
        ))}
      </ul>}
    </div>
  );
}
