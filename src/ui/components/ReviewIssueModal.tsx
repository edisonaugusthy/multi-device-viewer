import { Check, Clipboard, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { ReviewDevice } from "../../domain/review/review-issue";
import { buildAiReviewPrompt } from "../../domain/review/review-issue";

interface ReviewIssueModalProps {
  dark: boolean;
  pageUrl: string;
  devices: ReviewDevice[];
  onClose: () => void;
}

export function ReviewIssueModal({ dark, pageUrl, devices, onClose }: ReviewIssueModalProps) {
  const [summary, setSummary] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [selector, setSelector] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => buildAiReviewPrompt({ pageUrl, summary, expected, actual, selector, notes, devices }), [actual, devices, expected, notes, pageUrl, selector, summary]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-xs outline-none transition focus:border-[#0f9f8f] ${dark ? "border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`;

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="review-issue-title">
      <div className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${dark ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
        <header className={`flex items-start justify-between border-b p-4 ${dark ? "border-white/10" : "border-slate-100"}`}>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f9f8f]">Generate a coding-agent prompt</p><h2 id="review-issue-title" className="mt-1 text-base font-extrabold">Generate AI fix prompt</h2><p className={`mt-1 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Describe the responsive problem here. The extension generates a ready-to-copy prompt with the active URL, devices, viewports, and expected result.</p></div>
          <button type="button" onClick={onClose} aria-label="Close issue review" className={`grid h-8 w-8 place-items-center rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><X size={16} /></button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <div className="space-y-3">
            <Field label="Issue summary"><input className={inputClass} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Navigation overlaps the hero heading" autoFocus /></Field>
            <Field label="Expected behavior"><textarea className={`${inputClass} min-h-20 resize-y`} value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Navigation should collapse below 768px." /></Field>
            <Field label="Actual behavior"><textarea className={`${inputClass} min-h-20 resize-y`} value={actual} onChange={(event) => setActual(event.target.value)} placeholder="Links wrap over the heading at 390px." /></Field>
            <Field label="CSS selector (optional)"><input className={inputClass} value={selector} onChange={(event) => setSelector(event.target.value)} placeholder="header nav" /></Field>
            <Field label="Additional context (optional)"><textarea className={`${inputClass} min-h-16 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Keep the desktop navigation unchanged." /></Field>
          </div>

          <div className="flex min-h-0 flex-col">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0f9f8f]">Prompt preview</p>
            <pre className={`mt-1 min-h-64 flex-1 whitespace-pre-wrap rounded-xl border p-3 font-mono text-[10px] leading-4 ${dark ? "border-white/10 bg-black/20 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{prompt}</pre>
          </div>
        </div>

        <footer className={`flex items-center justify-between gap-3 border-t p-4 ${dark ? "border-white/10" : "border-slate-100"}`}>
          <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Nothing is uploaded. Copy sends text only to your clipboard.</p>
          <button type="button" onClick={() => void copyPrompt()} className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#0f9f8f] px-4 text-xs font-extrabold text-white hover:bg-[#0c8b7e]">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : "Copy fix prompt"}</button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-bold">{label}</span>{children}</label>;
}
