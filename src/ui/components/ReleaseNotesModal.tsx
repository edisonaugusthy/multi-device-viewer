import { X } from "lucide-react";
import type { VersionReleaseNotes } from "../../app/release-notes";
import { useI18n, type TranslationKey } from "../../app/i18n";

const RELEASE_NOTE_KEYS: Record<string, [TranslationKey, TranslationKey]> = {
  "Scroll without visible scrollbars": ["releaseScrollTitle", "releaseScrollDescription"],
  "Four new 2026 Galaxy devices, with every posture": ["releaseGalaxyTitle", "releaseGalaxyDescription"],
  "A guided first run": ["releaseTourTitle", "releaseTourDescription"],
  "Correct emulator night mode": ["releaseNightTitle", "releaseNightDescription"],
  "More current devices": ["releaseDevicesTitle", "releaseDevicesDescription"],
  "Clearer synchronized testing": ["releaseSyncTitle", "releaseSyncDescription"],
  "Actionable AI handoff": ["releaseAiTitle", "releaseAiDescription"],
  "Visible recording state": ["releaseRecordingTitle", "releaseRecordingDescription"],
  "Faster device switching": ["releaseSwitchingTitle", "releaseSwitchingDescription"],
  "Cleaner development workspace": ["releaseWorkspaceTitle", "releaseWorkspaceDescription"],
  "More reliable linked scrolling": ["releaseLinkedScrollTitle", "releaseLinkedScrollDescription"],
  "Capture and share clearly": ["releaseCaptureTitle", "releaseCaptureDescription"],
  "Flexible design references": ["releaseDesignTitle", "releaseDesignDescription"],
  "Latest improvements": ["releaseLatestTitle", "releaseLatestDescription"],
};

export function ReleaseNotesModal({ dark, release, onClose }: { dark: boolean; release: VersionReleaseNotes; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
      <div className={`w-full max-w-md overflow-hidden rounded-xl border shadow-xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/10" : "border-slate-200"}`}>
          <div className="flex items-baseline gap-2">
            <h2 id="release-notes-title" className="text-base font-bold">{t("whatIsNew")}</h2>
            <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>v{release.version}</span>
          </div>
          <button type="button" onClick={onClose} aria-label={t("closeReleaseNotes")} className={`grid h-8 w-8 place-items-center rounded-md ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><X size={15} /></button>
        </div>
        <div className={`divide-y px-5 ${dark ? "divide-white/10" : "divide-slate-200"}`}>
          {release.notes.map((note) => (
            <section
              key={note.title}
              className={`py-4 ${note.featured ? "my-2 rounded-xl border border-[#18b5a4]/25 bg-[#18b5a4]/10 px-3" : ""}`}
            >
              <h3 className={`text-sm font-semibold ${note.featured ? "text-[#0f9f8f]" : ""}`}>{RELEASE_NOTE_KEYS[note.title] ? t(RELEASE_NOTE_KEYS[note.title][0]) : note.title}</h3>
              <p className={`mt-1.5 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>{RELEASE_NOTE_KEYS[note.title] ? t(RELEASE_NOTE_KEYS[note.title][1]) : note.description}</p>
            </section>
          ))}
        </div>
        <div className={`flex justify-end border-t px-5 py-4 ${dark ? "border-white/10" : "border-slate-200"}`}>
          <button type="button" onClick={onClose} className={`h-9 rounded-md px-4 text-xs font-semibold ${dark ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-700"}`}>{t("startTesting")}</button>
        </div>
      </div>
    </div>
  );
}
