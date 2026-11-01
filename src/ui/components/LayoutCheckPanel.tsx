import { useEffect, useState } from "react";
import { useI18n } from "../../app/i18n";
import { formatOverflow, type LayoutProblemGroup } from "../../domain/layout-check/layout-check";
import { MAX_PROBLEMS } from "../../domain/layout-check/layout-check.types";
import type { LayoutCheckView } from "../hooks/useLayoutCheck";
import { formatCause } from "../../domain/layout-check/layout-cause";
import { AlertIcon, CheckIcon, CloseIcon, CopyIcon, FixPromptIcon, ReloadIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing, Switch } from "./ui";
import { useFormatters } from "./VisualChecks";

const button = cx("inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.5 text-xs font-semibold text-ink hover:bg-line-soft", focusRing);

/** The docked list of elements that make the page scroll sideways, one culprit per row with the devices it fails on. */
export function LayoutCheckPanel({ view, onClose, onCheckAgain, onSelect, onFixPrompt, onFixAll, onAfterReloadChange }: {
  view: LayoutCheckView;
  onClose: () => void;
  onCheckAgain: () => void;
  onSelect: (key: string | null) => void;
  onFixPrompt: (group: LayoutProblemGroup) => void;
  onFixAll: () => void;
  onAfterReloadChange: (on: boolean) => void;
}) {
  const { t } = useI18n();
  const format = useFormatters();
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const { totals, checking, groups } = view;
  const when = view.checkedAt ? format.ago(view.checkedAt) : "";
  const checkedDevices = view.devices.filter(device => device.status === "done");
  const problemsLabel = totals.problems === 1 ? t("layoutProblemOne") : t("layoutProblemMany", { count: totals.problems });
  const subtitle = checking
    ? t("layoutCheckingDevices", { count: totals.total })
    : checkedDevices.length === 0
      ? t("layoutNotChecked")
      : totals.problems > 0
        ? t("layoutSummary", { problems: problemsLabel, affected: totals.affected, total: totals.total, when })
        : t("layoutCleanSummary", { count: checkedDevices.length, when });

  return (
    <aside data-layout-check-panel aria-label={t("layoutCheck")} className="absolute bottom-3 end-3 top-2 z-40 flex w-[360px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-popover">
      <div className="flex items-start gap-2 pb-3 pe-2.5 ps-4 pt-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-[13px] font-semibold">{t("layoutCheck")}</h2>
          <p role="status" className="text-xs text-muted">{subtitle}</p>
        </div>
        {!checking && groups.length > 1 && (
          <button type="button" data-layout-fix-all onClick={onFixAll}
            className={cx("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-2.5 text-xs font-semibold text-on-accent hover:bg-accent-strong", focusRing)}>
            <FixPromptIcon size={13} />{t("problemsFixAll", { count: groups.length })}
          </button>
        )}
        {!checking && (
          <button type="button" onClick={onCheckAgain} aria-label={t("layoutCheckAgain")} title={t("layoutCheckAgain")} className={cx(button, groups.length > 1 && "w-7 px-0")}>
            <ReloadIcon size={13} strokeWidth={2.2} />{groups.length <= 1 && t("layoutCheckAgain")}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label={t("closeLayoutCheck")} title={t("closeLayoutCheck")}
          className={cx("grid size-7 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-t border-line-soft [scrollbar-width:none]">
        {checking ? (
          <ol className="grid gap-1 p-3">
            {view.devices.map(device => (
              <li key={device.slotId} className="flex h-9 items-center gap-2.5 px-1 text-[12.5px]">
                {device.status === "checking"
                  ? <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-accent-line border-t-accent motion-reduce:animate-none" />
                  : device.status === "done"
                    ? <span className="shrink-0 text-accent"><CheckIcon size={14} /></span>
                    : <span className="shrink-0 text-warn"><AlertIcon size={14} /></span>}
                <span className="font-semibold">{shortName(device.name)}</span>
                <span className="ms-auto text-muted">
                  {device.status === "checking" ? t("layoutChecking") : device.status === "done"
                    ? (device.count === 0 ? t("layoutFits") : device.count === 1 ? t("layoutProblemOne") : t("layoutProblemMany", { count: device.count }))
                    : t("layoutNotChecked")}
                </span>
              </li>
            ))}
          </ol>
        ) : groups.length > 0 ? (
          <ol className="grid gap-0.5 p-2">
            {groups.map(group => {
              const on = view.selected === group.key;
              const cause = view.causes[group.key];
              return (
                <li key={group.key} className="relative">
                  <button type="button" data-layout-fix onClick={() => onFixPrompt(group)} aria-label={t("problemsFixFor", { title: group.selector })}
                    className={cx("absolute end-2 top-2 z-[1] inline-flex h-[26px] items-center gap-1 rounded-full bg-sunken px-2.5 text-xs font-semibold text-ink hover:bg-line-soft", focusRing)}>
                    <FixPromptIcon size={12} />{t("problemsFix")}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    onClick={() => onSelect(on ? null : group.key)}
                    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(on ? null : group.key); } }}
                    className={cx("grid w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)] items-start gap-2.5 rounded-[10px] px-2 py-2.5 text-start hover:bg-sunken", on && "bg-surface shadow-[0_1px_2px_rgb(20_23_26/0.18),0_0_0_1px_var(--color-line-soft)]", focusRing)}
                  >
                    <span className="mt-px grid size-5 place-items-center rounded-full bg-red-500 font-mono text-[10.5px] font-bold text-white">{group.number}</span>
                    <span className="grid min-w-0 gap-1.5">
                      <span className="flex min-w-0 items-baseline gap-2 pe-16">
                        <span dir="ltr" className="truncate font-mono text-[12.5px] font-semibold">{group.selector}</span>
                        <span dir="ltr" className="shrink-0 text-[11px] text-faint">{Math.round(group.width)}×{Math.round(group.height)}</span>
                      </span>
                      <span className="text-[12.5px] leading-snug text-ink-2">{t(group.overflowLeft ? "layoutOverflowLeft" : "layoutOverflowRight")}</span>
                      <span className="flex flex-wrap gap-1.5">
                        {group.devices.map(device => (
                          <span key={device.slotId} className="inline-flex h-[22px] items-center gap-1 rounded-md bg-sunken px-2 text-[11.5px] font-semibold text-ink-2">
                            {shortName(device.deviceName)}
                            {device.overflow > 0 && <span dir="ltr" className="font-mono text-danger">{formatOverflow(device.overflow)}</span>}
                          </span>
                        ))}
                      </span>
                      {cause && (
                        <span data-layout-cause className="grid min-w-0 gap-0.5 overflow-hidden rounded-lg bg-sunken px-2 py-1.5">
                          <span className="flex min-w-0 items-baseline gap-2 text-[11px] text-muted">
                            <span className="shrink-0">{t("layoutCausedBy")}</span>
                            {cause.source && <span dir="ltr" title={cause.source} className="ms-auto min-w-0 truncate font-mono">{cause.source}</span>}
                          </span>
                          <code dir="ltr" className="break-all font-mono text-[11.5px] text-ink">{formatCause(cause)}</code>
                        </span>
                      )}
                      {on && (
                        <span className="mt-0.5 flex flex-wrap gap-1.5">
                          <button type="button" className={button}
                            onClick={event => { event.stopPropagation(); void navigator.clipboard.writeText(group.selector).then(() => setCopied(group.key)).catch(() => undefined); }}>
                            {copied === group.key ? <CheckIcon size={13} /> : <CopyIcon size={13} />}{copied === group.key ? t("copied") : t("layoutCopySelector")}
                          </button>
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
            {view.truncated && (
              <li className="px-3 py-2 text-xs text-muted">{t("layoutTruncated", { count: MAX_PROBLEMS })}</li>
            )}
            {checkedDevices.filter(device => device.count === 0).map(device => (
              <li key={device.slotId} className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                <span className="text-accent"><CheckIcon size={13} /></span>
                {t("layoutDeviceFits", { name: shortName(device.name) })}
              </li>
            ))}
            {view.devices.filter(device => device.status === "failed").map(device => (
              <li key={device.slotId} className="flex items-start gap-2 px-3 py-2 text-xs text-muted">
                <span className="mt-px text-warn"><AlertIcon size={13} /></span>
                <span><b className="font-semibold text-ink-2">{shortName(device.name)}</b> · {t("layoutNotChecked")}. {t("layoutNotCheckedHelp")}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-8 text-center">
            {checkedDevices.length > 0 ? <>
              <span aria-hidden="true" className="mb-1 grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><CheckIcon size={22} strokeWidth={2.6} /></span>
              <span role="status" className="text-base font-semibold">{t("layoutCleanTitle")}</span>
              <span className="max-w-[30ch] text-[13px] leading-snug text-muted">{t("layoutCleanHelp", { count: checkedDevices.length })}</span>
            </> : <>
              <span aria-hidden="true" className="mb-1 grid size-11 place-items-center rounded-full bg-warn-soft text-warn"><AlertIcon size={20} /></span>
              <span role="status" className="text-base font-semibold">{t("layoutNotChecked")}</span>
              <span className="max-w-[30ch] text-[13px] leading-snug text-muted">{t("layoutNotCheckedHelp")}</span>
            </>}
          </div>
        )}
      </div>

      <div className="border-t border-line-soft bg-surface-2 px-4 py-2.5" title={t("layoutCheckHelp")}>
        <label className="flex h-7 items-center justify-between gap-3 text-[12.5px] font-semibold">
          {t("layoutAfterReload")}
          <Switch size="sm" checked={view.afterReload} onChange={onAfterReloadChange} label={t("layoutAfterReload")} />
        </label>
      </div>
    </aside>
  );
}
