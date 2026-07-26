import { X } from "lucide-react";
import type { VersionReleaseNotes } from "../../app/release-notes";

export function ReleaseNotesModal({ dark, release, onClose }: { dark: boolean; release: VersionReleaseNotes; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
      <div className={`w-full max-w-md overflow-hidden rounded-xl border shadow-xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/10" : "border-slate-200"}`}>
          <div className="flex items-baseline gap-2">
            <h2 id="release-notes-title" className="text-base font-bold">What’s new</h2>
            <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>v{release.version}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close release notes" className={`grid h-8 w-8 place-items-center rounded-md ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><X size={15} /></button>
        </div>
        <div className={`divide-y px-5 ${dark ? "divide-white/10" : "divide-slate-200"}`}>
          {release.notes.map((note) => (
            <section key={note.title} className="py-4">
              <h3 className="text-sm font-semibold">{note.title}</h3>
              <p className={`mt-1.5 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>{note.description}</p>
            </section>
          ))}
        </div>
        <div className={`flex justify-end border-t px-5 py-4 ${dark ? "border-white/10" : "border-slate-200"}`}>
          <button type="button" onClick={onClose} className={`h-9 rounded-md px-4 text-xs font-semibold ${dark ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-700"}`}>Start testing</button>
        </div>
      </div>
    </div>
  );
}
