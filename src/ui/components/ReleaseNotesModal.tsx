import type { VersionReleaseNotes } from "../../app/release-notes";
import { useI18n } from "../../app/i18n";
import { WhatsNewIcon } from "../icons";
import { Dialog } from "./Dialog";
import { cx, focusRing } from "./ui";

export function ReleaseNotesModal({ release, onClose }: { release: VersionReleaseNotes; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog icon={<WhatsNewIcon size={18} />} title={t("whatIsNew")} closeLabel={t("closeReleaseNotes")} onClose={onClose}
      titleAddon={<span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[11px] font-medium text-muted">v{release.version}</span>}
      footer={<>
        <span className="flex-1" />
        <button type="button" onClick={onClose}
          className={cx("h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}>{t("startTesting")}</button>
      </>}
    >
      <ul className="grid gap-1.5">
        {release.notes.map(note => (
          <li key={note.title} className={cx("rounded-xl border px-3.5 py-3", note.featured ? "border-accent-line bg-accent-soft/60" : "border-line-soft")}>
            <h3 className={cx("text-[13px] font-semibold", note.featured && "text-accent-strong")}>{t(note.title)}</h3>
            <p className="mt-1 text-xs leading-5 text-ink-2">{t(note.description)}</p>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
