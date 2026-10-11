import type { ReactNode } from "react";
import type { ReleaseNoteIcon, VersionReleaseNotes } from "../../app/release-notes";
import { useI18n } from "../../app/i18n";
import {
  BugIcon, CameraIcon, ChevronRightIcon, ExpandIcon, EyeIcon, FixPromptIcon, GridIcon, GripIcon, NavigationSyncIcon,
  PlayIcon, RecordIcon, SearchIcon, SideBySideIcon, TextToolIcon, WhatsNewIcon, WorkspaceIcon,
} from "../icons";
import { Dialog } from "./Dialog";
import { cx, focusRing } from "./ui";

const icons: Record<ReleaseNoteIcon, ReactNode> = {
  workspace: <WorkspaceIcon size={18} />,
  drag: <GripIcon />,
  frames: <WorkspaceIcon size={15} />,
  step: <ChevronRightIcon size={15} />,
  picker: <SearchIcon size={15} />,
  focus: <EyeIcon size={15} />,
  expand: <ExpandIcon size={15} />,
  gallery: <GridIcon size={15} />,
  camera: <CameraIcon size={15} />,
  compare: <SideBySideIcon size={15} />,
  fixPrompt: <FixPromptIcon size={15} />,
  flow: <NavigationSyncIcon size={15} />,
  record: <RecordIcon size={15} />,
  languages: <TextToolIcon size={15} />,
  speed: <PlayIcon size={13} />,
  headers: <BugIcon size={15} />,
};

// A small sketch of the new layout: devices of different sizes on one baseline.
function LayoutSketch() {
  return (
    <svg aria-hidden="true" viewBox="0 0 132 64" className="h-16 w-[132px] shrink-0 text-accent-strong" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="38" width="14" height="18" rx="4" />
      <rect x="24" y="22" width="20" height="34" rx="3" />
      <rect x="50" y="12" width="20" height="44" rx="5" />
      <rect x="80" y="20" width="40" height="30" rx="2.5" />
      <path d="M75 52h50l-3 4H78z" fill="currentColor" stroke="none" opacity=".85" />
      <path d="M2 60h128" strokeLinecap="round" opacity=".35" />
    </svg>
  );
}

export function ReleaseNotesModal({ release, onClose }: { release: VersionReleaseNotes; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog icon={<WhatsNewIcon size={18} />} title={t("whatIsNew")} closeLabel={t("closeReleaseNotes")} onClose={onClose} size="lg"
      titleAddon={<span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[11px] font-medium text-muted">v{release.version}</span>}
      footer={<>
        <span className="flex-1" />
        <button type="button" onClick={onClose}
          className={cx("h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}>{t("startTesting")}</button>
      </>}
    >
      <div className="grid gap-5">
        <section className="flex items-center gap-4 rounded-xl border border-accent-line bg-accent-soft/60 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-accent-strong">{t(release.featured.title)}</h3>
            <p className="mt-1 text-xs leading-5 text-ink-2">{t(release.featured.description)}</p>
          </div>
          <span className="hidden sm:block"><LayoutSketch /></span>
        </section>
        {release.sections.map(section => (
          <section key={section.title}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t(section.title)}</h3>
            <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {section.notes.map(note => (
                <li key={note.title} className="flex min-w-0 gap-2.5">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-sunken text-ink-2">{icons[note.icon]}</span>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-semibold leading-5">{t(note.title)}</h4>
                    <p className="mt-0.5 text-xs leading-[18px] text-ink-2">{t(note.description)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
