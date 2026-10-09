import { useI18n } from "../../app/i18n";
import { useSimulatorRef } from "../../app/SimulatorProvider";
import { supportsIos26, type BrowserGeometry, type SafariLayout } from "../../domain/device/browser-geometry";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import type { Device } from "../../domain/device/device.types";
import type { PreviewSlot } from "../../domain/simulator/simulator.types";
import { CloseIcon } from "../icons";
import { Dropdown, IconButton } from "./ui";

// Both preview surfaces edit the same Safari preferences and geometry.
export function BrowserAppearanceSettings({ device, slot, geometry, onClose }: {
  device: Device; slot: PreviewSlot; geometry: BrowserGeometry; onClose: () => void;
}) {
  const { t } = useI18n();
  const simulator = useSimulatorRef();
  const profile = getFrameProfile(device);
  const layouts: Array<{ value: SafariLayout; label: string }> = device.type === "tablet"
    ? [{ value: "tabs", label: t("separateTabs") }, { value: "compact-tabs", label: t("compactTabs") }]
    : [
      ...(geometry.variant === "ios-liquid-glass" ? [{ value: "compact" as const, label: t("compactBrowser") }] : []),
      { value: "bottom", label: t("bottomBrowser") },
      { value: "top", label: t("topBrowser") },
    ];
  return <div className="flex flex-col gap-2.5 text-ink">
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-semibold">{t("browserAppearance")}</span>
      <IconButton size="sm" label={t("closeBrowserSettings")} onClick={onClose}><CloseIcon size={14} /></IconButton>
    </div>
    {supportsIos26(device) && profile.osMajor < 26 && <Setting label={t("browserVersion")}>
      <Dropdown<"ios26" | "catalog"> label={t("browserVersion")} value={slot.browserPreferences?.version ?? "ios26"}
        onChange={version => simulator.current.setSlotBrowserPreferences(slot.id, { version, layout: undefined })}
        options={[{ value: "ios26", label: "Safari 26" }, { value: "catalog", label: t("catalogBrowserVersion", { version: profile.osMajor }) }]} />
    </Setting>}
    {geometry.duoControls
      ? <p className="text-xs text-ink-2">iPhone Duo · iOS 27</p>
      : <Setting label={t("browserLayout")}>
          <Dropdown<SafariLayout> label={t("browserLayout")} value={geometry.layout} options={layouts}
            onChange={layout => simulator.current.setSlotBrowserPreferences(slot.id, { layout })} />
        </Setting>}
    <p className="text-[11px] leading-4 text-muted">{t("browserPreviewNote")}</p>
  </div>;
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {children}
    </div>
  );
}
