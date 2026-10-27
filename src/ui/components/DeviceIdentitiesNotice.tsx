import { useEffect, useState } from "react";
import { useI18n } from "../../app/i18n";
import { deviceIdentitiesActive, onDeviceIdentitiesChange } from "../../app/viewer-context";
import { AlertIcon, CloseIcon } from "../icons";
import { IconButton } from "./ui";

/** Says so when this tab's previews fall back to the browser's own identity, until the viewer is reopened. */
export function DeviceIdentitiesNotice({ hidden }: { hidden: boolean }) {
  const { t } = useI18n();
  const [active, setActive] = useState(deviceIdentitiesActive);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => onDeviceIdentitiesChange(next => { setActive(next); if (!next) setDismissed(false); }), []);

  if (active || dismissed || hidden) return null;
  return (
    <section role="status" aria-label={t("deviceIdentitiesOffTitle")} className="mx-3 mb-1 mt-2 flex shrink-0 items-start gap-3 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3 text-ink">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-warn"><AlertIcon size={18} /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-semibold">{t("deviceIdentitiesOffTitle")}</h2>
        <p className="mt-0.5 text-xs leading-5 text-ink-2">{t("deviceIdentitiesOffBody")}</p>
      </div>
      <IconButton label={t("deviceIdentitiesOffDismiss")} size="sm" onClick={() => setDismissed(true)}><CloseIcon size={15} /></IconButton>
    </section>
  );
}
