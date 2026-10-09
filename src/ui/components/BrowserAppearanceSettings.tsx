import { X } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { useSimulatorRef } from "../../app/SimulatorProvider";
import { supportsIos26, type BrowserGeometry, type SafariLayout } from "../../domain/device/browser-geometry";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import type { Device } from "../../domain/device/device.types";
import type { PreviewSlot } from "../../domain/simulator/simulator.types";

// Both preview surfaces edit the same Safari preferences and geometry.
export function BrowserAppearanceSettings({ device, slot, geometry, onClose }: {
  device: Device; slot: PreviewSlot; geometry: BrowserGeometry; onClose: () => void;
}) {
  const { t } = useI18n();
  const simulator = useSimulatorRef();
  const profile = getFrameProfile(device);
  return <>
    <div className="mb-2 flex items-center justify-between text-xs font-bold">
      {t("browserAppearance")}
      <button type="button" aria-label={t("closeBrowserSettings")} onClick={onClose} className="rounded p-1 focus-visible:outline-2 focus-visible:outline-teal-500"><X size={14}/></button>
    </div>
    {supportsIos26(device) && profile.osMajor < 26 && <label className="mb-2 block text-xs">
      {t("browserVersion")}
      <select aria-label={t("browserVersion")} className="mt-1 w-full rounded border border-slate-500/25 bg-transparent p-1.5" value={slot.browserPreferences?.version ?? "ios26"}
        onChange={event => simulator.current.setSlotBrowserPreferences(slot.id, { version: event.target.value as "catalog" | "ios26", layout: undefined })}>
        <option value="ios26">Safari 26</option><option value="catalog">{t("catalogBrowserVersion", { version: profile.osMajor })}</option>
      </select>
    </label>}
    {geometry.duoControls ? <div className="text-xs">iPhone Duo · iOS 27</div> : <label className="block text-xs">
      {t("browserLayout")}
      <select aria-label={t("browserLayout")} className="mt-1 w-full rounded border border-slate-500/25 bg-transparent p-1.5" value={geometry.layout}
        onChange={event => simulator.current.setSlotBrowserPreferences(slot.id, { layout: event.target.value as SafariLayout })}>
        {device.type === "tablet" ? <><option value="tabs">{t("separateTabs")}</option><option value="compact-tabs">{t("compactTabs")}</option></>
          : <>{geometry.variant === "ios-liquid-glass" && <option value="compact">{t("compactBrowser")}</option>}<option value="bottom">{t("bottomBrowser")}</option><option value="top">{t("topBrowser")}</option></>}
      </select>
    </label>}
    <p className="mt-2 text-[10px] leading-4 opacity-60">{t("browserPreviewNote")}</p>
  </>;
}
