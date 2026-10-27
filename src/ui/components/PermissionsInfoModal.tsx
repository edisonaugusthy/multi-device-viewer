import { useI18n, type TranslationKey } from "../../app/i18n";
import { ShieldIcon } from "../icons";
import { Dialog } from "./Dialog";

type PermissionExplanation = { name: string; description: TranslationKey };

const PERMISSIONS: PermissionExplanation[] = [
  { name: "activeTab", description: "permissionActiveTab" },
  { name: "http://*/*, https://*/*", description: "permissionWebsiteAccess" },
  { name: "declarativeNetRequestWithHostAccess", description: "permissionFrameHeaders" },
  { name: "scripting", description: "permissionScripting" },
  { name: "storage", description: "permissionStorage" },
  { name: "downloads", description: "permissionDownloads" },
  { name: "contextMenus", description: "permissionContextMenus" },
  { name: "tabCapture", description: "permissionTabCapture" },
  { name: "offscreen", description: "permissionOffscreen" },
];

export function PermissionsInfoModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog size="lg" icon={<ShieldIcon size={18} />} title={t("permissionsTitle")} description={t("permissionsIntro")}
      closeLabel={t("closePermissions")} onClose={onClose}
      footer={<p className="text-xs leading-5 text-muted">{t("permissionsPrivacy")}</p>}
    >
      <dl className="divide-y divide-line-soft rounded-xl border border-line-soft">
        {PERMISSIONS.map(permission => (
          <div key={permission.name} className="grid gap-1 px-3.5 py-2.5">
            <dt><code className="break-all rounded bg-sunken px-1.5 py-0.5 font-mono text-[11px] font-medium text-accent-strong">{permission.name}</code></dt>
            <dd className="text-xs leading-5 text-ink-2">{t(permission.description)}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
