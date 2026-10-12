import { useEffect, useState } from "react";
import { useI18n } from "../../app/i18n";
import { formatOverflow, type LayoutProblemGroup } from "../../domain/layout-check/layout-check";
import { SMALL_TEXT_MIN, TAP_TARGET_MIN, type LayoutProblemKind } from "../../domain/layout-check/layout-check.types";
import type { LayoutCheckSettings, LayoutCheckView } from "../hooks/useLayoutCheck";
import { AlertIcon, CheckIcon, CloseIcon, CopyIcon, FixPromptIcon, ReloadIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing, Switch } from "./ui";
import { useFormatters } from "./VisualChecks";

const MARK_COLOR: Record<LayoutProblemKind, string> = { overflow: "bg-red-500", "tap-target": "bg-amber-700", "small-text": "bg-blue-600" };
const button = cx("inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-sunken", focusRing);

/** The docked list of layout problems, one culprit per row with the devices it fails on. */
export function LayoutCheckPanel({ view, onClose, onCheckAgain, onSelect, onFixPrompt, onSettingsChange }: {
  view: LayoutCheckView;
  onClose: () => void;
  onCheckAgain: () => void;
  onSelect: (key: string | null) => void;
  onFixPrompt: (group: LayoutProblemGroup) => void;
  onSettingsChange: (change: Partial<LayoutCheckSettings>, recheck: boolean) => void;
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
    : totals.problems > 0
      ? t("layoutSummary", { problems: problemsLabel, affected: totals.affected, total: totals.total, when })
      : t("layoutCleanSummary", { count: checkedDevices.length, when });
  const describe = (group: LayoutProblemGroup) => group.kind === "overflow"
    ? t(group.overflowLeft ? "layoutOverflowLeft" : "layoutOverflowRight")
    : group.kind === "tap-target"
      ? t("layoutTapTarget", { size: TAP_TARGET_MIN })
      : t("layoutSmallText", { size: group.devices[0]?.fontSize ?? 0, min: SMALL_TEXT_MIN });

  return (
    <aside data-layout-check-panel aria-label={t("layoutCheck")} className="flex w-[360px] shrink-0 flex-col border-s border-line bg-surface text-ink">
      <div className="flex items-start gap-2 pb-2.5 pe-2.5 ps-4 pt-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t("layoutCheck")}</h2>
          <p role="status" className="text-xs text-muted">{subtitle}</p>
        </div>
        {!checking && (
          <button type="button" onClick={onCheckAgain} className={button}>
            <ReloadIcon size={13} strokeWidth={2.2} />{t("layoutCheckAgain")}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label={t("closeLayoutCheck")} title={t("closeLayoutCheck")}
          className={cx("grid size-[30px] shrink-0 place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      <div role="group" aria-label={t("layoutCheck")} className="flex flex-wrap gap-1.5 px-4 pb-3">
        <CheckChip label={t("layoutCheckOverflow")} on disabled />
        <CheckChip label={t("layoutCheckTapTargets")} on={view.settings.tapTargets} onToggle={on => onSettingsChange({ tapTargets: on }, true)} />
        <CheckChip label={t("layoutCheckSmallText")} on={view.settings.smallText} onToggle={on => onSettingsChange({ smallText: on }, true)} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-line-soft">
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
              return (
                <li key={group.key}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    onClick={() => onSelect(on ? null : group.key)}
                    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(on ? null : group.key); } }}
                    className={cx("grid w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)] items-start gap-2.5 rounded-[10px] px-2 py-2.5 text-start hover:bg-sunken", on && "bg-surface shadow-[0_1px_2px_rgb(20_23_26/0.18),0_0_0_1px_var(--color-line-soft)]", focusRing)}
                  >
                    <span className={cx("mt-px grid size-5 place-items-center rounded-full font-mono text-[10.5px] font-bold text-white", MARK_COLOR[group.kind])}>{group.number}</span>
                    <span className="grid min-w-0 gap-1.5">
                      <span className="flex items-baseline gap-2">
                        <span dir="ltr" className="truncate font-mono text-[12.5px] font-semibold">{group.selector}</span>
                        <span dir="ltr" className="shrink-0 text-[11px] text-faint">{Math.round(group.width)}×{Math.round(group.height)}</span>
                      </span>
                      <span className="text-[12.5px] leading-snug text-ink-2">{describe(group)}</span>
                      <span className="flex flex-wrap gap-1.5">
                        {group.devices.map(device => (
                          <span key={device.slotId} className="inline-flex h-[22px] items-center gap-1 rounded-md bg-sunken px-2 text-[11.5px] font-semibold text-ink-2">
                            {shortName(device.deviceName)}
                            {device.overflow !== undefined && device.overflow > 0 && <span dir="ltr" className="font-mono text-danger">{formatOverflow(device.overflow)}</span>}
                          </span>
                        ))}
                      </span>
                      {on && (
                        <span className="mt-0.5 flex flex-wrap gap-1.5">
                          <button type="button" onClick={event => { event.stopPropagation(); onFixPrompt(group); }}
                            className={cx("inline-flex h-7 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-xs font-semibold text-on-accent hover:bg-accent-strong", focusRing)}>
                            <FixPromptIcon size={13} />{t("fixPrompt")}
                          </button>
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

      <div className="grid gap-2.5 border-t border-line bg-surface-2 px-4 pb-3.5 pt-3">
        <label className="flex items-center justify-between gap-3 text-[12.5px] font-semibold">
          {t("layoutAfterReload")}
          <Switch size="sm" checked={view.settings.afterReload} onChange={on => onSettingsChange({ afterReload: on }, false)} label={t("layoutAfterReload")} />
        </label>
        <p className="text-[11.5px] leading-snug text-muted">{t("layoutCheckHelp")}</p>
      </div>
    </aside>
  );
}

function CheckChip({ label, on, disabled = false, onToggle }: { label: string; on: boolean; disabled?: boolean; onToggle?: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onToggle?.(!on)}
      className={cx("flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border pe-2.5 ps-1.5 text-xs font-semibold disabled:cursor-default",
        on ? "border-accent-line bg-accent-soft text-accent-strong" : "border-line bg-surface text-muted", focusRing)}>
      <span className={cx("grid size-3.5 place-items-center rounded-full text-on-accent", on ? "bg-accent" : "bg-line")}>
        {on && <CheckIcon size={9} strokeWidth={4} />}
      </span>
      {label}
    </button>
  );
}
