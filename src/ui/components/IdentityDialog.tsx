import { useEffect, useRef, useState } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { PreviewIdentity } from "../../domain/simulator/preview-identity";
import { CheckIcon, CopyIcon } from "../icons";
import { cx, focusRing } from "./ui";
import { visualButton, VisualDialog } from "./VisualChecks";

export interface IdentityColumn { slotId: string; name: string; size: string; identity?: PreviewIdentity }

type Row = { label: TranslationKey; source: string; value: (identity: Described) => string; highlight?: boolean };
interface Described { browser: string; system: string; model: string; mobile: boolean; language: string; density: string; width: string; touch: string; hints: boolean; userAgent: string }

const major = (pattern: RegExp, text: string) => pattern.exec(text)?.[1];

/** What a device's browser reports, in plain words. */
export function describeIdentity(identity: PreviewIdentity, browserLanguage: string): Described {
  const ua = identity.userAgent;
  const safari = major(/Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari/, ua);
  const chrome = major(/Chrome\/(\d+)/, ua);
  const browser = /SMART-TV|Tizen/.test(ua) ? "Tizen browser" : safari && !/Chrome\//.test(ua) ? `Safari ${safari}` : chrome ? `Chrome ${chrome}` : ua.split(" ")[0];
  const version = identity.details?.platformVersion;
  const system = identity.platform === "iOS" ? `iOS ${major(/OS (\d+)_/, ua) ?? ""}`.trim()
    : identity.platform === "Android" ? `Android ${version?.split(".")[0] ?? ""}`.trim()
    : identity.platform === "Windows" ? `Windows ${version && Number(version.split(".")[0]) >= 13 ? 11 : 10}`
    : identity.platform === "Chrome OS" ? "ChromeOS"
    : identity.platform === "Linux" && /Tizen/.test(ua) ? "Tizen" : identity.platform;
  return {
    browser, system, model: identity.details?.model || "—", mobile: identity.mobile,
    language: identity.language ?? browserLanguage,
    density: identity.density ? `${identity.density.dpr}×` : "—", width: identity.density ? String(identity.density.width) : "—",
    touch: String(identity.touchPoints ?? 0), hints: identity.hints, userAgent: ua,
  };
}

/** This browser, the baseline every device is compared with. */
function describeBrowser(): Described {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  return {
    browser: `Chrome ${major(/Chrome\/(\d+)/, nav.userAgent) ?? ""}`.trim(), system: nav.userAgentData?.platform || nav.platform, model: "—",
    mobile: Boolean(nav.userAgentData?.mobile), language: nav.language, density: `${Math.round(window.devicePixelRatio * 1000) / 1000}×`,
    width: String(window.innerWidth), touch: String(nav.maxTouchPoints), hints: true, userAgent: nav.userAgent,
  };
}

export function IdentityDialog({ columns, onClose }: { columns: IdentityColumn[]; onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const mine = describeBrowser();
  const yes = (value: boolean) => t(value ? "identityYes" : "identityNo");
  const rows: Row[] = [
    { label: "identityBrowser", source: "User-Agent", value: d => d.browser },
    { label: "identitySystem", source: "Sec-CH-UA-Platform", value: d => d.system },
    { label: "identityModel", source: "Sec-CH-UA-Model", value: d => d.model },
    { label: "identityMobile", source: "Sec-CH-UA-Mobile", value: d => yes(d.mobile) },
    { label: "language", source: "Accept-Language", value: d => d.language },
    { label: "identityDensity", source: "Sec-CH-DPR", value: d => d.density },
    // Every device has its own width, so a highlight there would say nothing.
    { label: "identityWidth", source: "Sec-CH-Viewport-Width", value: d => d.width, highlight: false },
    { label: "identityTouch", source: "navigator.maxTouchPoints", value: d => d.touch },
    { label: "identityHints", source: "Sec-CH-UA-*", value: d => t(d.hints ? "identityHintsAll" : "identityHintsNone") },
  ];
  const described = columns.map(column => ({ column, described: column.identity ? describeIdentity(column.identity, mine.language) : mine }));
  const grid = { gridTemplateColumns: `180px repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))` };
  const copy = (key: string, text: string) => void navigator.clipboard.writeText(text).then(() => setCopied(key)).catch(() => undefined);
  const json = JSON.stringify(Object.fromEntries(columns.map(column => [column.name, column.identity ?? null])), null, 2);

  return (
    <VisualDialog size="wide" closeRef={closeRef} onClose={onClose} title={t("identitiesTitle")}
      subtitle={<span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-[3px] border border-accent-line bg-accent-soft" />{t("identitiesDifferent", { browser: `${mine.browser} · ${mine.system} · ${mine.language}` })}</span>}
      footer={<>
        <span className="flex-1" />
        <button type="button" onClick={() => copy("json", json)} className={visualButton}>
          {copied === "json" ? <CheckIcon size={13} /> : <CopyIcon size={13} />}{copied === "json" ? t("copied") : t("identitiesCopyJson")}
        </button>
      </>}>
      <div role="table" aria-label={t("identitiesTitle")} data-identity-table className="grid px-5 pb-2">
        <div role="row" className="grid items-end border-b border-line" style={grid}>
          <span role="columnheader" className="py-3" />
          {columns.map(column => (
            <span key={column.slotId} role="columnheader" className="grid gap-0.5 px-3.5 py-3">
              <span className="truncate text-[13.5px] font-semibold">{column.name}</span>
              <span dir="ltr" className="font-mono text-[11.5px] text-faint">{column.size}</span>
            </span>
          ))}
        </div>
        {rows.map(row => (
          <div key={row.label} role="row" className="grid items-stretch border-b border-line-soft" style={grid}>
            <span role="rowheader" className="grid content-center gap-0.5 py-2 pe-3">
              <span className="text-[13px] font-semibold">{t(row.label)}</span>
              <span dir="ltr" className="font-mono text-[10.5px] text-faint">{row.source}</span>
            </span>
            {described.map(({ column, described: d }) => {
              const value = row.value(d);
              const changed = row.highlight !== false && Boolean(column.identity) && value !== row.value(mine);
              return (
                <span key={column.slotId} role="cell" dir="auto"
                  className={cx("m-1 flex items-center rounded-[7px] px-2.5 text-[13.5px]", changed ? "bg-accent-soft font-semibold text-accent-strong" : "font-medium text-ink-2")}>
                  {column.identity ? value : t("identityBrowserOwn")}
                </span>
              );
            })}
          </div>
        ))}
        <div role="row" className="grid items-stretch" style={grid}>
          <span role="rowheader" className="grid content-center gap-0.5 py-2.5 pe-3">
            <span className="text-[13px] font-semibold">{t("identityFullString")}</span>
            <span dir="ltr" className="font-mono text-[10.5px] text-faint">User-Agent</span>
          </span>
          {described.map(({ column, described: d }) => (
            <span key={column.slotId} role="cell" className="m-1 flex items-start gap-1.5 rounded-[7px] bg-surface-2 py-2 pe-1.5 ps-2.5">
              <span dir="ltr" title={d.userAgent} className="line-clamp-2 min-w-0 flex-1 break-all font-mono text-[11px] leading-normal text-ink-2">{d.userAgent}</span>
              <button type="button" onClick={() => copy(column.slotId, d.userAgent)} aria-label={t("identityCopyUserAgent", { name: column.name })} title={t("identityCopyUserAgent", { name: column.name })}
                className={cx("grid size-6 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-sunken", focusRing)}>
                {copied === column.slotId ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              </button>
            </span>
          ))}
        </div>
      </div>
    </VisualDialog>
  );
}
