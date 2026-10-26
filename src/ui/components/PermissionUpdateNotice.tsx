import { useEffect, useState } from "react";
import { useI18n } from "../../app/i18n";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import { CloseIcon, ShieldIcon } from "../icons";
import { Dialog } from "./Dialog";
import { cx, focusRing, IconButton } from "./ui";

// Retire this announcement when the release requesting debugger ships.
const DISMISSED_KEY = "mdvDebuggerAdvanceNoticeDismissedV1";

export function PermissionUpdateNotice({ hidden, onDetails }: { hidden: boolean; onDetails: () => void }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("permissionNoticePreview");
    void readStore(DISMISSED_KEY, false)
      .catch(() => false)
      .then(dismissed => { if (active) setVisible(preview || !dismissed); });
    return () => { active = false; };
  }, []);

  if (!visible || hidden) return null;
  return (
    <section aria-label={t("permissionUpdateTitle")} className="mx-3 mb-1 mt-2 flex shrink-0 items-start gap-3 rounded-xl border border-accent-line bg-accent-soft px-3.5 py-3 text-ink">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent-strong"><ShieldIcon size={18} /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-semibold">{t("permissionUpdateTitle")}</h2>
        <p className="mt-0.5 text-xs leading-5 text-ink-2">{t("permissionUpdateSummary")}</p>
        <button type="button" onClick={onDetails} className={cx("mt-1 rounded text-xs font-semibold text-accent-strong underline underline-offset-2", focusRing)}>{t("permissionUpdateDetails")}</button>
      </div>
      <IconButton label={t("permissionUpdateDismiss")} size="sm" onClick={() => {
        setVisible(false);
        void writeStore(DISMISSED_KEY, true).catch(() => { /* Keep dismissal for this session if storage is unavailable. */ });
      }}><CloseIcon size={15} /></IconButton>
    </section>
  );
}

export function PermissionUpdateModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog size="lg" icon={<ShieldIcon size={18} />} title={t("permissionUpdateTitle")} description={t("permissionUpdateIntro")} onClose={onClose}
      footer={<><span className="flex-1" /><button type="button" onClick={onClose} className={cx("h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}>{t("permissionUpdateGotIt")}</button></>}
    >
      <div className="grid gap-4 text-[13px] leading-6 text-ink-2">
        <section>
          <h3 className="font-semibold text-ink">{t("permissionUpdateWhyTitle")}</h3>
          <p className="mt-1">{t("permissionUpdateWhy")}</p>
        </section>
        <section>
          <h3 className="font-semibold text-ink">{t("permissionUpdateWarningTitle")}</h3>
          <p className="mt-1">{t("permissionUpdateWarning")}</p>
        </section>
        <section className="rounded-xl border border-accent-line bg-accent-soft p-3.5">
          <h3 className="font-semibold text-ink">{t("permissionUpdateEnableTitle")}</h3>
          <p className="mt-1">{t("permissionUpdateEnableIntro")}</p>
          <ol className="mt-2 list-decimal space-y-1 ps-5">
            <li>{t("permissionUpdateStepOne")} <code className="select-all rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">chrome://extensions</code></li>
            <li>{t("permissionUpdateStepTwo")}</li>
            <li>{t("permissionUpdateStepThree")}</li>
          </ol>
        </section>
        <p className="text-xs text-muted">{t("permissionUpdateNoAction")}</p>
      </div>
    </Dialog>
  );
}
