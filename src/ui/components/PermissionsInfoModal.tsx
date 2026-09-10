import { ShieldCheck, X } from "lucide-react";
import { useI18n, type TranslationKey } from "../../app/i18n";

type PermissionExplanation = { name: string; description: TranslationKey };

const PERMISSIONS: PermissionExplanation[] = [
  { name: "activeTab", description: "permissionActiveTab" },
  { name: "http://*/*, https://*/*", description: "permissionWebsiteAccess" },
  {
    name: "declarativeNetRequestWithHostAccess",
    description: "permissionFrameHeaders",
  },
  { name: "scripting", description: "permissionScripting" },
  { name: "storage", description: "permissionStorage" },
  { name: "downloads", description: "permissionDownloads" },
  { name: "contextMenus", description: "permissionContextMenus" },
  { name: "tabCapture", description: "permissionTabCapture" },
  { name: "offscreen", description: "permissionOffscreen" },
];

export function PermissionsInfoModal({
  dark,
  onClose,
}: {
  dark: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-title"
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0f9f8f]/10 text-[#0f9f8f]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 id="permissions-title" className="text-sm font-extrabold">{t("permissionsTitle")}</h2>
              <p className={`mt-1 text-[11px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{t("permissionsIntro")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t("closePermissions")} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PERMISSIONS.map((permission) => (
            <div key={permission.name} className={`rounded-xl p-3 ${dark ? "bg-white/[0.045]" : "bg-slate-50"}`}>
              <p className="break-all text-[10px] font-extrabold text-[#0f9f8f]">{permission.name}</p>
              <p className={`mt-1 text-[10px] leading-4 ${dark ? "text-slate-400" : "text-slate-600"}`}>{t(permission.description)}</p>
            </div>
          ))}
        </div>
        <p className={`mt-4 text-[10px] leading-4 ${dark ? "text-slate-500" : "text-slate-500"}`}>{t("permissionsPrivacy")}</p>
      </section>
    </div>
  );
}
