import { ExternalLink, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../../app/i18n";
import { FeedbackDialog, FeedbackError } from "./FeedbackDialog";

interface ReviewPromptModalProps {
  dark: boolean;
  storageError?: boolean;
  onReview: () => Promise<void>;
  onNotNow: () => void;
  onNever: () => void;
}

export function ReviewPromptModal({ dark, storageError = false, onReview, onNotNow, onNever }: ReviewPromptModalProps) {
  const { t } = useI18n();
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const openReview = async () => {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    try { await onReview(); }
    catch { setFailed(true); }
    finally { setOpening(false); }
  };

  return (
    <FeedbackDialog dark={dark} title={t("reviewTitle")} description={t("reviewBody")} busy={opening} onClose={onNotNow}
      footer={<div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onNever} disabled={opening}
          className={`min-h-9 rounded-lg px-2 text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50 ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`}>{t("reviewNever")}</button>
        <button type="button" onClick={onNotNow} disabled={opening}
          className={`min-h-9 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50 ${dark ? "border-slate-600 bg-slate-800/60 hover:bg-slate-700" : "border-slate-300 bg-white hover:bg-slate-100"}`}>{t("reviewNotNow")}</button>
      </div>}
    >
      <button type="button" onClick={openReview} disabled={opening} aria-busy={opening}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-teal-700 bg-teal-700 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-wait disabled:opacity-70">
        {opening ? <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ExternalLink size={15} className="shrink-0" aria-hidden="true" />}
        {opening ? t("openingReview") : t("reviewCta")}
      </button>
      {(failed || storageError) && <FeedbackError dark={dark}>{t(failed ? "reviewOpenError" : "reviewStatusError")}</FeedbackError>}
    </FeedbackDialog>
  );
}
