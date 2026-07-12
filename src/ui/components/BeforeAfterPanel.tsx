import { Camera, ImagePlus, Pencil, X } from "lucide-react";
import { useState } from "react";

interface BeforeAfterPanelProps {
  dark: boolean;
  onClose: () => void;
  onCaptureCurrent: () => void;
  onAnnotateReference: (image: string) => void;
}

export function BeforeAfterPanel({ dark, onClose, onCaptureCurrent, onAnnotateReference }: BeforeAfterPanelProps) {
  const [referenceImage, setReferenceImage] = useState<string>();

  function loadReference(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  return (
    <aside className={`flex w-[42%] min-w-[320px] max-w-[620px] shrink-0 flex-col border-r ${dark ? "border-white/10 bg-[#101217] text-white" : "border-slate-200 bg-[#f8fafc] text-slate-900"}`} aria-label="Before reference image">
      <header className={`flex h-11 shrink-0 items-center gap-2 border-b px-3 ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div className="min-w-0"><h2 className="text-[11px] font-extrabold">Before: reference image</h2><p className={`truncate text-[9px] ${dark ? "text-slate-500" : "text-slate-400"}`}>The live device previews remain on the right.</p></div>
        <button type="button" onClick={onClose} aria-label="Close before and after comparison" className={`ml-auto grid h-8 w-8 place-items-center rounded-lg ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}><X size={15} /></button>
      </header>

      <div className="flex flex-wrap items-center gap-2 p-3">
        <label className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[10px] font-bold ${dark ? "border-white/10 hover:bg-white/[0.05]" : "border-slate-200 bg-white hover:bg-slate-50"}`}><ImagePlus size={14} />{referenceImage ? "Replace image" : "Choose before image"}<input type="file" accept="image/*" className="sr-only" onChange={(event) => loadReference(event.target.files?.[0])} /></label>
        <button type="button" onClick={onCaptureCurrent} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold ${dark ? "border-white/10 hover:bg-white/[0.05]" : "border-slate-200 bg-white hover:bg-slate-50"}`}><Camera size={14} />Capture current</button>
        <button type="button" disabled={!referenceImage} onClick={() => referenceImage && onAnnotateReference(referenceImage)} className="flex h-9 items-center gap-2 rounded-lg bg-[#0f9f8f] px-3 text-[10px] font-bold text-white hover:bg-[#0c8b7e] disabled:cursor-not-allowed disabled:opacity-35"><Pencil size={14} />Annotate before</button>
      </div>

      <div className="min-h-0 flex-1 p-3 pt-0">
        <div className={`grid h-full place-items-center overflow-auto rounded-xl border ${dark ? "border-white/10 bg-[#07090d]" : "border-slate-200 bg-white"}`}>
          {referenceImage ? <img src={referenceImage} alt="Before reference for responsive comparison" className="max-h-full max-w-full object-contain" /> : <div className="max-w-64 p-6 text-center"><ImagePlus className={`mx-auto ${dark ? "text-slate-700" : "text-slate-300"}`} size={30} /><p className="mt-3 text-xs font-extrabold">Add the previous design</p><p className={`mt-1 text-[10px] leading-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>Choose a downloaded screenshot, approved mockup, or earlier version. The current website stays live on the right.</p></div>}
        </div>
      </div>
    </aside>
  );
}
