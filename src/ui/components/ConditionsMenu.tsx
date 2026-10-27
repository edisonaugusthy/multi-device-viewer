import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import { DEFAULT_CONDITIONS, type ColorScheme, type Conditions, type NetworkSpeed, type Vision } from "../../domain/simulator/preview-conditions";
import { CheckIcon, CloseIcon } from "../icons";
import { cx, focusRing, popoverPanel, positionStyle, Segmented, Switch, useAnchoredPosition, useDismiss } from "./ui";

const NETWORK: Array<[NetworkSpeed, TranslationKey]> = [["off", "conditionsOff"], ["fast4g", "conditionsFast4g"], ["slow4g", "conditionsSlow4g"], ["3g", "conditions3g"], ["offline", "conditionsOffline"]];
const CPU: Array<[Conditions["cpu"], TranslationKey]> = [[1, "conditionsFullSpeed"], [4, "conditionsCpu4"], [6, "conditionsCpu6"]];
const SCHEMES: Array<[ColorScheme, TranslationKey]> = [["system", "conditionsSystem"], ["light", "light"], ["dark", "dark"]];
export const VISION_LABELS: Record<Vision, TranslationKey> = {
  none: "conditionsVisionNormal", blurredVision: "conditionsVisionBlurred", reducedContrast: "conditionsVisionContrast",
  protanopia: "conditionsVisionNoRed", deuteranopia: "conditionsVisionNoGreen", tritanopia: "conditionsVisionNoBlue", achromatopsia: "conditionsVisionGrayscale",
};
export const TIMEZONES = ["Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "America/Sao_Paulo", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney", "UTC"];
export const LOCATIONS: Array<{ name: string; latitude: number; longitude: number }> = [
  { name: "London", latitude: 51.5072, longitude: -0.1276 }, { name: "Berlin", latitude: 52.52, longitude: 13.405 },
  { name: "New York", latitude: 40.7128, longitude: -74.006 }, { name: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
  { name: "São Paulo", latitude: -23.5505, longitude: -46.6333 }, { name: "Mumbai", latitude: 19.076, longitude: 72.8777 },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 }, { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
];

/** One-click combinations; a preset that is fully on turns its part back off. */
const PRESETS: Array<{ label: TranslationKey; glyph: ReactNode; set: Partial<Conditions> }> = [
  { label: "conditionsPresetSlowPhone", glyph: "◔", set: { network: "slow4g", cpu: 4 } },
  { label: "conditionsOffline", glyph: "⊘", set: { network: "offline" } },
  { label: "dark", glyph: "◐", set: { scheme: "dark" } },
  { label: "conditionsVisionGrayscale", glyph: "◑", set: { vision: "achromatopsia" } },
];

/** The header's short summary of what is on, such as "Slow 4G · Dark". */
export function useConditionsSummary(conditions: Conditions): string {
  const { t } = useI18n();
  const parts: string[] = [];
  const network = NETWORK.find(([id]) => id === conditions.network);
  if (conditions.network !== "off" && network) parts.push(t(network[1]));
  if (conditions.cpu !== 1) parts.push(t(conditions.cpu === 4 ? "conditionsCpu4" : "conditionsCpu6"));
  if (conditions.scheme !== "system") parts.push(t(conditions.scheme === "dark" ? "dark" : "light"));
  if (conditions.reducedMotion) parts.push(t("conditionsReducedMotion"));
  if (conditions.forcedColors) parts.push(t("conditionsHighContrast"));
  if (conditions.print) parts.push(t("conditionsPrint"));
  if (conditions.vision !== "none") parts.push(t(VISION_LABELS[conditions.vision]));
  if (conditions.timezone) parts.push(conditions.timezone.split("/").pop()!.replace(/_/g, " "));
  if (conditions.location) parts.push(LOCATIONS.find(place => place.latitude === conditions.location?.latitude)?.name ?? t("conditionsLocation"));
  return parts.join(" · ");
}

export function ConditionsMenu({ open, anchorRef, conditions, available, onChange, onClose }: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  conditions: Conditions;
  available: boolean;
  onChange: (change: Partial<Conditions>) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 420, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;
  const heading = "text-[11px] font-semibold uppercase tracking-wide text-muted";

  return (
    <div ref={panelRef} role="dialog" aria-label={t("conditionsTitle")} data-conditions-menu className={cx(popoverPanel, "fixed")} style={positionStyle(position)}>
      <div className="flex shrink-0 items-center py-2.5 pe-2 ps-3.5">
        <span className="flex-1 text-sm font-semibold">{t("conditionsTitle")}</span>
        <button type="button" onClick={onClose} aria-label={t("close")} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 gap-3.5 overflow-y-auto px-3.5 pb-3.5">
        {!available && <p role="status" className="rounded-lg bg-warn-soft px-3 py-2 text-xs leading-snug text-warn">{t("conditionsUnavailable")}</p>}
        <div role="group" aria-label={t("conditionsPresets")} className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(preset => {
            const on = Object.entries(preset.set).every(([key, value]) => conditions[key as keyof Conditions] === value);
            return (
              <button key={preset.label} type="button" data-preset={preset.label} aria-pressed={on}
                onClick={() => onChange(on ? Object.fromEntries(Object.keys(preset.set).map(key => [key, DEFAULT_CONDITIONS[key as keyof Conditions]])) : preset.set)}
                className={cx("flex h-[58px] flex-col items-center justify-center gap-1 rounded-[10px] border text-xs font-semibold",
                  on ? "border-accent bg-accent-soft text-accent-strong" : "border-line-soft bg-surface text-ink hover:bg-sunken", focusRing)}>
                <span aria-hidden="true" className="text-base leading-none">{preset.glyph}</span>{t(preset.label)}
              </button>
            );
          })}
        </div>
        <section className="grid gap-1.5">
          <h3 className={heading}>{t("conditionsNetwork")}</h3>
          <Segmented size="sm" label={t("conditionsNetwork")} value={conditions.network} onChange={network => onChange({ network })}
            options={NETWORK.map(([value, label]) => ({ value, label: t(label) }))} className="w-full [&>button]:flex-1 [&>button]:justify-center" />
        </section>
        <section className="grid gap-1.5">
          <h3 className={heading}>{t("conditionsProcessor")}</h3>
          <Segmented size="sm" label={t("conditionsProcessor")} value={String(conditions.cpu)} onChange={cpu => onChange({ cpu: Number(cpu) as Conditions["cpu"] })}
            options={CPU.map(([value, label]) => ({ value: String(value), label: t(label) }))} className="w-full [&>button]:flex-1 [&>button]:justify-center" />
        </section>
        <section className="grid gap-1">
          <h3 className={heading}>{t("conditionsDisplay")}</h3>
          <div className="flex items-center gap-2.5">
            <span className="w-24 text-[12.5px] font-semibold">{t("theme")}</span>
            <Segmented size="sm" label={t("theme")} value={conditions.scheme} onChange={scheme => onChange({ scheme })}
              options={SCHEMES.map(([value, label]) => ({ value, label: t(label) }))} className="flex-1 [&>button]:flex-1 [&>button]:justify-center" />
          </div>
          {([["reducedMotion", "conditionsReducedMotion"], ["forcedColors", "conditionsHighContrast"], ["print", "conditionsPrint"]] as const).map(([key, label]) => (
            <label key={key} className="flex h-[30px] items-center justify-between gap-2.5 text-[12.5px] font-semibold">
              {t(label)}<Switch size="sm" checked={conditions[key]} onChange={value => onChange({ [key]: value })} label={t(label)} />
            </label>
          ))}
        </section>
        <section className="grid gap-1.5">
          <h3 className={heading}>{t("conditionsVision")}</h3>
          <div role="radiogroup" aria-label={t("conditionsVision")} className="grid grid-cols-2 gap-1">
            {(Object.keys(VISION_LABELS) as Vision[]).map(vision => {
              const on = conditions.vision === vision;
              return (
                <button key={vision} type="button" role="radio" aria-checked={on} onClick={() => onChange({ vision })}
                  className={cx("flex h-8 items-center gap-2 rounded-lg border px-2 text-start text-xs font-medium", on ? "border-accent bg-accent-soft/50" : "border-line-soft bg-surface hover:bg-sunken", focusRing)}>
                  <span aria-hidden="true" className={cx("grid size-3.5 place-items-center rounded-full border-2", on ? "border-accent bg-accent text-on-accent" : "border-line")}>{on && <CheckIcon size={8} strokeWidth={4} />}</span>
                  {t(VISION_LABELS[vision])}
                </button>
              );
            })}
          </div>
        </section>
        <section className="grid gap-1.5">
          <h3 className={heading}>{t("conditionsRegion")}</h3>
          <label className="flex items-center gap-2.5 text-[12.5px] font-semibold">
            <span className="w-24">{t("conditionsTimezone")}</span>
            <select data-timezone value={conditions.timezone} onChange={event => onChange({ timezone: event.target.value })}
              className={cx("h-8 flex-1 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-medium text-ink", focusRing)}>
              <option value="">{t("conditionsDefault")}</option>
              {TIMEZONES.map(zone => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-[12.5px] font-semibold">
            <span className="w-24">{t("conditionsLocation")}</span>
            <select value={conditions.location ? LOCATIONS.findIndex(place => place.latitude === conditions.location?.latitude) : -1}
              onChange={event => { const place = LOCATIONS[Number(event.target.value)]; onChange({ location: place ? { latitude: place.latitude, longitude: place.longitude } : null }); }}
              className={cx("h-8 flex-1 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-medium text-ink", focusRing)}>
              <option value={-1}>{t("conditionsOff")}</option>
              {LOCATIONS.map((place, index) => <option key={place.name} value={index}>{place.name}</option>)}
            </select>
          </label>
        </section>
      </div>
    </div>
  );
}
