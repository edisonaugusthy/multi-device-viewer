import { useEffect, useState } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { ProblemKind } from "../../domain/simulator/preview-diagnostics";
import type { ProblemGroup } from "../hooks/useProblems";
import { CheckIcon, ChevronDownIcon, CloseIcon, CopyIcon, FixPromptIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing } from "./ui";

const KIND_FILTERS: Array<[ProblemKind, TranslationKey]> = [["error", "problemsErrors"], ["request", "problemsRequests"], ["warning", "problemsWarnings"]];
const smallButton = cx("inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.5 text-xs font-semibold text-ink hover:bg-line-soft", focusRing);

/**
 * The Problems panel, floating over the devices: errors and failed requests
 * per device. The header picks the device, one row picks the kinds, each
 * problem is one quiet row with its own Fix, and Fix all closes the panel.
 */
export function ProblemsPanel({ view, onClose, onFix, onFixAll }: {
  view: {
    device: string | null; kinds: ReadonlySet<ProblemKind>; counts: Record<ProblemKind, number>; groups: ProblemGroup[]; total: number;
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
  const filtered = view.device !== null && !view.devices.some(device => device.slotId === view.device);

  return (
    <aside data-problems-panel aria-label={t("problemsTitle")}
      className="absolute end-3 top-2 z-40 flex max-h-[calc(100%-20px)] w-[384px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-popover">
      <div className="flex shrink-0 items-center gap-2 pb-2 pe-2.5 ps-4 pt-3">
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-semibold">
          {t("problemsTitle")}
          {view.total > 0 && <span className="rounded-full bg-red-500 px-1.5 font-mono text-[10.5px] font-bold text-white">{view.total}</span>}
        </h2>
        {/* Every device's problems, or one device's. */}
        {(view.devices.length > 1 || view.device) && (
          <label className="relative flex min-w-0 shrink items-center">
            <span className="sr-only">{t("devices")}</span>
            <select value={view.device ?? ""} onChange={event => view.setDevice(event.target.value || null)} title={deviceName}
              className={cx("h-7 min-w-0 max-w-[170px] cursor-pointer appearance-none truncate rounded-full bg-sunken pe-7 ps-3 text-xs font-semibold text-ink hover:bg-line-soft", focusRing)}>
              <option value="">{t("allDevices")}</option>
              {view.devices.map(device => <option key={device.slotId} value={device.slotId}>{shortName(device.name)} · {device.count}</option>)}
              {filtered && deviceName && <option value={view.device!}>{shortName(deviceName)}</option>}
            </select>
            <ChevronDownIcon size={12} className="pointer-events-none absolute end-2.5 text-ink-2" />
          </label>
        )}
        <button type="button" onClick={onClose} aria-label={t("problemsClose")} title={t("problemsClose")}
          className={cx("grid size-7 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      <div role="group" aria-label={t("problemsShow")} className="flex shrink-0 gap-1 px-3 pb-2.5">
        {KIND_FILTERS.map(([kind, label]) => {
          const on = view.kinds.has(kind);
          return (
            <button key={kind} type="button" aria-pressed={on} onClick={() => view.toggleKind(kind)}
              className={cx("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors", on ? "bg-sunken text-ink" : "text-muted hover:text-ink-2", focusRing)}>
              <span aria-hidden="true" className={cx("size-1.5 rounded-full", !on ? "bg-line" : kind === "warning" ? "bg-warn" : "bg-danger")} />
              {t(label)}<span className={cx("font-mono text-[11px]", on ? "text-ink-2" : "text-faint")}>{view.counts[kind]}</span>
            </button>
          );
        })}
      </div>

      <ol className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-t border-line-soft px-2 py-1 [scrollbar-width:thin]">
        {view.groups.map(group => {
          const expanded = open === group.key;
          const hasDetail = Boolean(group.stack?.length || group.response);
          const devices = group.devices.map(device => `${shortName(device.name)}${device.count > 1 ? ` ×${device.count}` : ""}`).join(", ");
          return (
            <li key={group.key} className="border-b border-line-soft py-1 last:border-b-0">
              <div className="flex items-start gap-1">
                <button type="button" aria-expanded={hasDetail ? expanded : undefined} disabled={!hasDetail}
                  onClick={() => setOpen(expanded ? null : group.key)}
                  className={cx("grid min-w-0 flex-1 grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 rounded-[10px] px-2 py-2 text-start", hasDetail && "hover:bg-sunken", focusRing)}>
                  <span aria-hidden="true" className={cx("grid h-5 place-items-center rounded-md font-mono text-[10px] font-bold",
                    group.kind === "warning" ? "bg-warn-soft text-warn" : "bg-red-500/10 text-danger")}>
                    {group.kind === "request" ? (group.status ?? "!") : group.kind === "warning" ? "!" : "JS"}
                  </span>
                  <span className="grid min-w-0 gap-1">
                    {/* Long addresses wrap anywhere and stop at two lines until opened. */}
                    <span dir="ltr" title={group.title}
                      className={cx("font-mono text-[12px] font-semibold leading-snug [overflow-wrap:anywhere]", !expanded && "line-clamp-2")}>{group.title}</span>
                    <span className="truncate text-[11.5px] text-muted">
                      {group.where && <span dir="ltr">{group.where} · </span>}{devices}
                    </span>
                  </span>
                </button>
                <button type="button" onClick={() => onFix(group)} aria-label={t("problemsFixFor", { title: group.title })} title={t("problemsFixFor", { title: group.title })}
                  className={cx("mt-1.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-2 hover:bg-sunken hover:text-ink", focusRing)}>
                  <FixPromptIcon size={12} />{t("problemsFix")}
                </button>
              </div>
              {expanded && (
                <div className="grid gap-2 pb-2 pe-2 ps-[46px]">
                  <pre dir="ltr" className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{[...group.stack ?? [], group.response ?? ""].filter(Boolean).join("\n")}</pre>
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
          <li key={device.slotId} className="flex items-center gap-2 px-2 py-2 text-xs text-muted">
            <span className="text-accent"><CheckIcon size={13} /></span>{t("problemsDeviceClean", { name: shortName(device.name) })}
          </li>
        ))}
      </ol>

      {view.groups.length > 0 && (
        <div className="shrink-0 border-t border-line-soft p-2.5">
          <button type="button" onClick={onFixAll}
            className={cx("flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}>
            <FixPromptIcon size={14} />{t("problemsFixAll", { count: view.groups.length })}
          </button>
        </div>
      )}
    </aside>
  );
}
