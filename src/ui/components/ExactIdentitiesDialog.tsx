import { useState } from "react";
import { useI18n } from "../../app/i18n";
import { requestExactPermission } from "../../app/viewer-context";
import { ShieldIcon } from "../icons";
import { Dialog } from "./Dialog";
import { cx, focusRing } from "./ui";

/**
 * Explains exact device identities and the debugging bar before Chrome's own
 * permission prompt, which must follow the user's click directly.
 */
export function ExactIdentitiesDialog({ onClose, onGranted }: { onClose: () => void; onGranted: () => void }) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  function allow() {
    setAsking(true);
    void requestExactPermission().then(granted => {
      setAsking(false);
      if (granted) onGranted();
      onClose();
    });
  }
  return (
    <Dialog icon={<ShieldIcon size={18} />} title={t("exactIdentities")} description={t("exactIdentitiesIntro")} busy={asking} onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cx("h-9 rounded-lg border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-sunken", focusRing)}>{t("cancel")}</button>
          <button type="button" onClick={allow} disabled={asking} className={cx("h-9 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50", focusRing)}>{t("exactIdentitiesAllow")}</button>
        </div>
      }>
      <p className="text-[13px] leading-6 text-ink-2">{t("exactIdentitiesBar")}</p>
    </Dialog>
  );
}
