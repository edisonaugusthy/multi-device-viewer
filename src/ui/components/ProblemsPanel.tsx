import { useEffect, useState } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { ProblemKind } from "../../domain/simulator/preview-diagnostics";
import type { ProblemGroup } from "../hooks/useProblems";
import { CheckIcon, CloseIcon, CopyIcon, FixPromptIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing } from "./ui";

const KIND_FILTERS: Array<[ProblemKind, TranslationKey]> = [["error", "problemsErrors"], ["request", "problemsRequests"], ["warning", "problemsWarnings"]];
const smallButton = cx("inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.5 text-xs font-semibold text-ink hover:bg-line-soft", focusRing);

/** The docked Problems panel: errors and failed requests per device. */
export function ProblemsPanel({ view, onClose, onFix, onFixAll }: {
  view: {
    device: string | null; kinds: ReadonlySet<ProblemKind>; groups: ProblemGroup[]; total: number; warnings: number;
    clean: Array<{ slotId: string; name: string }>;
    devices: Array<{ slotId: string; name: string; count: number }>;
    setDevice: (slotId: string | null) => void; toggleKind: (kind: ProblemKind) => void;
  };
  onClose: () => void;
  onFix: (group: ProblemGroup) => void;
  onFixAll: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const deviceName = view.device ? view.groups.flatMap(group => group.devices).find(item => item.slotId === view.device)?.name ?? view.clean.find(item => item.slotId === view.device)?.name : undefined;

  return (
    <aside data-problems-panel aria-label={t("problemsTitle")} className="absolute bottom-3 end-3 top-2 z-40 flex w-[384px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-popover">
      <div className="flex items-center gap-2 pb-2.5 pe-2.5 ps-3 pt-3">
        <h2 className="flex flex-1 items-center gap-2 ps-1 text-[13px] font-semibold">
          {t("problemsTitle")}
          {view.total > 0 && <span className="rounded-full bg-red-500 px-1.5 font-mono text-[10.5px] font-bold text-white">{view.total}</span>}
        </h2>
        {/* Beside the title, so device filters below never squeeze it. */}
        {view.groups.length > 0 && (
          <button type="button" onClick={onFixAll}
            className={cx("inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 text-xs font-semibold text-on-accent hover:bg-accent-strong", focusRing)}>
            <FixPromptIcon size={13} />{t("problemsFixAll", { count: view.groups.length })}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label={t("problemsClose")} title={t("problemsClose")}
          className={cx("grid size-7 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      <>
        <div className="grid gap-2.5 px-3 pb-2.5">
          {/* Each device with problems; one click shows only its problems, again shows every device's. */}
          {(view.devices.length > 1 || deviceName) && (
            <div role="group" aria-label={t("devices")} className="flex min-w-0 flex-wrap gap-1.5">
              {view.devices.map(device => {
                const on = view.device === device.slotId;
                return (
                  <button key={device.slotId} type="button" aria-pressed={on} onClick={() => view.setDevice(on ? null : device.slotId)}
                    title={on ? t("problemsShowAll") : device.name}
                    className={cx("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold", on ? "bg-ink text-surface" : "bg-sunken text-ink hover:bg-line-soft", focusRing)}>
                    {shortName(device.name)}<span className={cx("font-mono text-[11px]", on ? "opacity-70" : "text-faint")}>{device.count}</span>
                  </button>
                );
              })}
              {deviceName && !view.devices.some(device => device.slotId === view.device) && (
                <button type="button" aria-pressed onClick={() => view.setDevice(null)} title={t("problemsShowAll")}
                  className={cx("inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-xs font-semibold text-surface", focusRing)}>
                  {shortName(deviceName)}<CloseIcon size={11} strokeWidth={2.8} />
                </button>
              )}
            </div>
          )}
          <div role="group" aria-label={t("problemsShow")} className="flex flex-wrap gap-1.5">
            {KIND_FILTERS.map(([kind, label]) => {
              const on = view.kinds.has(kind);
              return (
                <button key={kind} type="button" aria-pressed={on} onClick={() => view.toggleKind(kind)}
                  className={cx("inline-flex h-7 items-center gap-1.5 rounded-full border pe-2.5 ps-1.5 text-xs font-semibold", on ? "border-transparent bg-sunken text-ink" : "border-line bg-surface text-muted", focusRing)}>
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
                  className={cx("absolute end-2 top-2 z-[1] inline-flex h-[26px] items-center gap-1 rounded-full bg-sunken px-2.5 text-xs font-semibold text-ink hover:bg-line-soft", focusRing)}>
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
      </>
    </aside>
  );
}
