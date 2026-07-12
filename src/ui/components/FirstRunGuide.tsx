import { Check, ShieldCheck, Sparkles, X } from "lucide-react";
import { PRODUCT_NAME } from "../../app/product";

export function FirstRunGuide({ dark, onClose }: { dark: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="first-run-title">
      <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f9f8f]">Start here</p>
            <h2 id="first-run-title" className="mt-1 text-lg font-extrabold">See every frontend change as you build</h2>
            <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{PRODUCT_NAME} works on the page already open in your tab.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close getting started" className={`grid h-8 w-8 place-items-center rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><X size={16} /></button>
        </div>

        <ol className="mt-5 space-y-3">
          <GuideStep number="1" title="Choose your everyday viewports" text="Start with a quick set, favorite devices you use often, or save your own combination." dark={dark} />
          <GuideStep number="2" title="Keep building beside it" text="Save your code and refresh the previews to see the same change across every selected screen." dark={dark} />
          <GuideStep number="3" title="Capture what needs discussion" text="Capture one viewport or the full workspace, mark the visual, and copy or download it for sharing." dark={dark} />
        </ol>

        <div className={`mt-5 flex gap-3 rounded-xl p-3 ${dark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
          <ShieldCheck className="mt-0.5 shrink-0 text-[#0f9f8f]" size={18} />
          <p className={`text-[11px] leading-4 ${dark ? "text-slate-400" : "text-slate-600"}`}><strong className={dark ? "text-slate-200" : "text-slate-800"}>Private by design.</strong> No account, tracking, telemetry, or remote logging. URLs, screenshots, issues, and settings stay in your browser.</p>
        </div>

        <button type="button" onClick={onClose} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f9f8f] text-xs font-extrabold text-white hover:bg-[#0c8b7e]"><Sparkles size={15} />Start developing</button>
      </div>
    </div>
  );
}

function GuideStep({ number, title, text, dark }: { number: string; title: string; text: string; dark: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0f9f8f] text-[11px] font-extrabold text-white">{number}</span>
      <div><p className="text-xs font-extrabold">{title}</p><p className={`mt-0.5 text-[11px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{text}</p></div>
      <Check className={`ml-auto mt-1 shrink-0 ${dark ? "text-slate-700" : "text-slate-200"}`} size={14} />
    </li>
  );
}
