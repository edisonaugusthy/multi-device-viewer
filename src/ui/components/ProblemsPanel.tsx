import { useEffect, useState } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { DownloadType, ProblemKind } from "../../domain/simulator/preview-diagnostics";
import type { ProblemGroup, ProblemsTab, DeviceDownload } from "../hooks/useProblems";
import { CheckIcon, CloseIcon, CopyIcon, FixPromptIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing } from "./ui";
import { useFormatters } from "./VisualChecks";

const KIND_FILTERS: Array<[ProblemKind, TranslationKey]> = [["error", "problemsErrors"], ["request", "problemsRequests"], ["warning", "problemsWarnings"]];
const DOWNLOAD_TYPES: Array<[DownloadType, TranslationKey, string]> = [
  ["image", "downloadImages", "bg-accent"], ["script", "downloadScripts", "bg-[#3e63dd]"], ["style", "downloadStyles", "bg-warn"],
  ["font", "downloadFonts", "bg-[#8e4ec6]"], ["other", "downloadOther", "bg-faint"],
];
const smallButton = cx("inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-sunken", focusRing);

/** The docked Problems panel: errors and failed requests per device, and what each device downloaded. */
export function ProblemsPanel({ view, onClose, onFix, onFixAll }: {
  view: {
    tab: ProblemsTab; device: string | null; kinds: ReadonlySet<ProblemKind>; groups: ProblemGroup[]; total: number; warnings: number;
    downloads: DeviceDownload[]; clean: Array<{ slotId: string; name: string }>; available: boolean;
    setTab: (tab: ProblemsTab) => void; setDevice: (slotId: string | null) => void; toggleKind: (kind: ProblemKind) => void;
  };
  onClose: () => void;
  onFix: (group: ProblemGroup) => void;
  onFixAll: () => void;
}) {
  const { t } = useI18n();
  const format = useFormatters();
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [weightDevice, setWeightDevice] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const deviceName = view.device ? view.downloads.find(item => item.slotId === view.device)?.name ?? view.clean.find(item => item.slotId === view.device)?.name : undefined;
  const largest = Math.max(1, ...view.downloads.map(item => item.download.bytes));
  const selectedDownload = view.downloads.find(item => item.slotId === weightDevice) ?? view.downloads[view.downloads.length - 1];
  const tab = (id: ProblemsTab, label: string, badge?: number) => (
    <button type="button" role="tab" aria-selected={view.tab === id} onClick={() => view.setTab(id)}
      className={cx("flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[7px] text-[12.5px] font-semibold", view.tab === id ? "bg-surface text-ink shadow-lift" : "text-ink-2 hover:text-ink", focusRing)}>
      {label}{badge ? <span className="rounded-[5px] bg-red-500 px-1.5 font-mono text-[10.5px] font-bold text-white">{badge}</span> : null}
    </button>
  );

  return (
    <aside data-problems-panel aria-label={t("problemsTitle")} className="flex w-[384px] shrink-0 flex-col border-s border-line bg-surface text-ink">
      <div className="flex items-center gap-2 pb-2.5 pe-2.5 ps-3 pt-3">
        <div role="tablist" aria-label={t("problemsTitle")} className="flex flex-1 rounded-[9px] bg-sunken p-[3px]">
          {tab("problems", t("problemsTitle"), view.total)}
          {tab("download", t("downloadSizeTitle"))}
        </div>
        <button type="button" onClick={onClose} aria-label={t("problemsClose")} title={t("problemsClose")}
          className={cx("grid size-[30px] shrink-0 place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      {!view.available ? (
        <p role="status" className="border-t border-line-soft px-4 py-6 text-[13px] leading-snug text-muted">{t("problemsUnavailable")}</p>
      ) : view.tab === "problems" ? <>
        <div className="grid gap-2.5 px-3 pb-2.5">
          <div className="flex min-h-[30px] items-center gap-2">
            {deviceName && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-ink pe-1 ps-2.5 text-xs font-semibold text-surface">
                {shortName(deviceName)}
                <button type="button" onClick={() => view.setDevice(null)} aria-label={t("problemsShowAll")} title={t("problemsShowAll")}
                  className={cx("grid size-[22px] place-items-center rounded-full hover:bg-white/15", focusRing)}><CloseIcon size={11} strokeWidth={2.8} /></button>
              </span>
            )}
            <span className="flex-1" />
            {view.groups.length > 0 && (
              <button type="button" onClick={onFixAll}
                className={cx("inline-flex h-[30px] items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-on-accent hover:bg-accent-strong", focusRing)}>
                <FixPromptIcon size={13} />{t("problemsFixAll", { count: view.groups.length })}
              </button>
            )}
          </div>
          <div role="group" aria-label={t("problemsShow")} className="flex flex-wrap gap-1.5">
            {KIND_FILTERS.map(([kind, label]) => {
              const on = view.kinds.has(kind);
              return (
                <button key={kind} type="button" aria-pressed={on} onClick={() => view.toggleKind(kind)}
                  className={cx("inline-flex h-7 items-center gap-1.5 rounded-full border pe-2.5 ps-1.5 text-xs font-semibold", on ? "border-accent-line bg-accent-soft text-accent-strong" : "border-line bg-surface text-muted", focusRing)}>
                  <span className={cx("grid size-3.5 place-items-center rounded-full", on ? "bg-accent text-on-accent" : "bg-line")}>{on && <CheckIcon size={9} strokeWidth={4.5} />}</span>
                  {t(label)}{kind === "warning" && view.warnings > 0 && <span className="font-mono text-[11px] text-faint">{view.warnings}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <ol className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain border-t border-line-soft p-2 [scrollbar-width:none]">
          {view.groups.map(group => {
            const expanded = open === group.key;
            const hasDetail = Boolean(group.stack?.length || group.response);
            return (
              <li key={group.key} className={cx("relative rounded-[10px]", expanded && "bg-surface shadow-[0_1px_2px_rgb(20_23_26/0.18),0_0_0_1px_var(--color-line-soft)]")}>
                <button type="button" onClick={() => onFix(group)} aria-label={t("problemsFixFor", { title: group.title })}
                  className={cx("absolute end-2 top-2 z-[1] inline-flex h-[26px] items-center gap-1 rounded-[7px] border border-line bg-surface px-2 text-xs font-semibold text-ink hover:bg-sunken", focusRing)}>
                  <FixPromptIcon size={12} />{t("problemsFix")}
                </button>
                <button type="button" aria-expanded={hasDetail ? expanded : undefined} disabled={!hasDetail}
                  onClick={() => setOpen(expanded ? null : group.key)}
                  className={cx("grid w-full grid-cols-[22px_minmax(0,1fr)] items-start gap-2.5 rounded-[10px] px-2 py-2.5 text-start", hasDetail && "hover:bg-sunken", focusRing)}>
                  <span aria-hidden="true" className={cx("mt-px grid h-[22px] place-items-center rounded-md font-mono text-[10px] font-bold",
                    group.kind === "warning" ? "bg-warn-soft text-warn" : "bg-red-500/10 text-danger")}>
                    {group.kind === "request" ? (group.status ?? "!") : group.kind === "warning" ? "!" : "JS"}
                  </span>
                  <span className="grid min-w-0 gap-1">
                    <span dir="ltr" className="break-words pe-14 font-mono text-[12.5px] font-semibold leading-snug">{group.title}</span>
                    {group.where && <span dir="ltr" className="break-words text-[11.5px] text-muted">{group.where}</span>}
                    <span className="flex flex-wrap gap-1.5">
                      {group.devices.map(device => (
                        <span key={device.slotId} className="inline-flex h-[22px] items-center gap-1 rounded-md bg-sunken px-2 text-[11.5px] font-semibold text-ink-2">
                          {shortName(device.name)}{device.count > 1 && <span className="font-mono text-[11px] text-faint">×{device.count}</span>}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
                {expanded && (
                  <div className="grid gap-2 pb-3 pe-2.5 ps-10">
                    <pre dir="ltr" className="whitespace-pre-wrap break-words rounded-lg border border-line-soft bg-surface-2 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink-2">{[...group.stack ?? [], group.response ?? ""].filter(Boolean).join("\n")}</pre>
                    <button type="button" className={cx(smallButton, "justify-self-start")}
                      onClick={() => void navigator.clipboard.writeText([group.title, group.where, ...group.stack ?? [], group.response ?? ""].filter(Boolean).join("\n")).then(() => setCopied(group.key)).catch(() => undefined)}>
                      {copied === group.key ? <CheckIcon size={13} /> : <CopyIcon size={13} />}{copied === group.key ? t("copied") : t("problemsCopy")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {view.groups.length === 0 && (
            <li role="status" className="flex flex-col items-center gap-1.5 px-5 py-8 text-center">
              <span aria-hidden="true" className="mb-1 grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><CheckIcon size={22} strokeWidth={2.6} /></span>
              <span className="text-base font-semibold">{t("problemsNone")}</span>
            </li>
          )}
          {!view.device && view.groups.length > 0 && view.clean.map(device => (
            <li key={device.slotId} className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
              <span className="text-accent"><CheckIcon size={13} /></span>{t("problemsDeviceClean", { name: shortName(device.name) })}
            </li>
          ))}
        </ol>
      </> : (
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain border-t border-line-soft px-4 py-3.5 [scrollbar-width:none]">
          <ul className="grid gap-3">
            {view.downloads.map(item => {
              const on = selectedDownload?.slotId === item.slotId;
              const { download } = item;
              return (
                <li key={item.slotId}>
                  <button type="button" aria-pressed={on} onClick={() => setWeightDevice(item.slotId)}
                    className={cx("grid w-full gap-1.5 rounded-[10px] border p-2.5 text-start", on ? "border-accent-line bg-accent-soft/40" : "border-line-soft bg-surface hover:bg-sunken", focusRing)}>
                    <span className="text-[12.5px] font-semibold">{shortName(item.name)}</span>
                    <span aria-hidden="true" className="flex h-2.5 gap-px overflow-hidden rounded-[3px]" style={{ width: `${Math.max(4, Math.round(download.bytes / largest * 100))}%` }}>
                      {DOWNLOAD_TYPES.map(([type, , color]) => download.byType[type] > 0 && <span key={type} className={color} style={{ flex: download.byType[type] }} />)}
                    </span>
                    <span className="text-xs text-ink-2">{t("downloadSummary", { size: format.size(download.bytes), count: format.integer(download.requests) })}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {view.downloads.length === 0 && <p className="text-[13px] text-muted">{t("downloadNone")}</p>}
          {view.downloads.length > 0 && (
            <div aria-label={t("downloadLegend")} className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11.5px] text-ink-2">
              {DOWNLOAD_TYPES.map(([type, label, color]) => <span key={type} className="inline-flex items-center gap-1.5"><span className={cx("size-2.5 rounded-[2px]", color)} />{t(label)}</span>)}
            </div>
          )}
          {selectedDownload && selectedDownload.download.largest.length > 0 && (
            <div className="grid gap-1.5 border-t border-line-soft pt-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("downloadLargest", { name: shortName(selectedDownload.name) })}</h3>
              {selectedDownload.download.largest.map(file => (
                <span key={file.url} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 text-xs">
                  <span dir="ltr" className="truncate font-mono">{file.url}</span>
                  <span className="font-mono font-semibold text-ink-2">{format.size(file.bytes)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
