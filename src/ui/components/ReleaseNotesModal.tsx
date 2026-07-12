import { Check, Sparkles, X } from "lucide-react";
import type { VersionReleaseNotes } from "../../app/release-notes";

export function ReleaseNotesModal({ dark, release, onClose }: { dark: boolean; release: VersionReleaseNotes; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
      <div className={`w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className={`border-b p-5 ${dark ? "border-white/10" : "border-slate-100"}`}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0f9f8f]/12 text-[#0f9f8f]"><Sparkles size={19} /></span>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0f9f8f]">What’s new</p><span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${dark ? "bg-white/[0.07] text-slate-400" : "bg-slate-100 text-slate-500"}`}>v{release.version}</span></div><h2 id="release-notes-title" className="mt-1 text-lg font-extrabold">{release.heading}</h2><p className={`mt-1 text-[11px] leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{release.summary}</p></div>
            <button type="button" onClick={onClose} aria-label="Close release notes" className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><X size={15} /></button>
          </div>
        </div>
        <div className="space-y-2 p-5">{release.notes.map((note) => <div key={note.title} className={`flex gap-3 rounded-xl border p-3 ${dark ? "border-white/[0.07] bg-white/[0.025]" : "border-slate-100 bg-slate-50"}`}><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0f9f8f] text-white"><Check size={11} strokeWidth={3} /></span><div><p className="text-xs font-extrabold">{note.title}</p><p className={`mt-0.5 text-[10px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{note.description}</p></div></div>)}</div>
        <div className={`flex items-center justify-between gap-4 border-t px-5 py-4 ${dark ? "border-white/10" : "border-slate-100"}`}><p className={`text-[9px] ${dark ? "text-slate-600" : "text-slate-400"}`}>Shown once after each update.</p><button type="button" onClick={onClose} className="h-9 rounded-lg bg-[#0f9f8f] px-4 text-xs font-extrabold text-white hover:bg-[#0c8b7e]">Start testing</button></div>
      </div>
    </div>
  );
}
