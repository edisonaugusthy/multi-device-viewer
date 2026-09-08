import { ExternalLink, LoaderCircle, Bug, Star } from "lucide-react";
import { useState } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { useReviewPrompt } from "../../app/useReviewPrompt";
import { SUPPORT_URL } from "../../domain/review/review-coordinator";
import { REVIEW_PROMPT_POLICY } from "../../domain/review/review-prompt";

import { FeedbackDialog, FeedbackError } from "./FeedbackDialog";

const reasonLabels: Record<string, TranslationKey> = {
  disabled: "reviewStatusDisabled", error: "reviewStatusError", loading: "reviewStatusLoading",
  age: "reviewStatusAge", sessions: "reviewStatusSessions", actions: "reviewStatusActions",
  cooldown: "reviewStatusCooldown", "return-sessions": "reviewStatusReturnSessions",
  limit: "reviewStatusLimit", opened: "reviewStatusOpened", never: "reviewStatusNever",
  dialog: "reviewStatusDialog", action: "reviewStatusAction", eligible: "reviewStatusEligible",
};

export function HelpModal({ dark, review, onClose }: {
  dark: boolean; review: ReturnType<typeof useReviewPrompt>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [opening, setOpening] = useState<"review" | "support" | null>(null);
  const busy = opening !== null;
  const [failed, setFailed] = useState(false);
  const open = async (kind: "review" | "support") => {
    if (busy) return;
    setOpening(kind); setFailed(false);
    try {
      if (kind === "review") await review.openReview();
      else if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        const result = await chrome.runtime.sendMessage({ type: "MDV_OPEN_SUPPORT" });
        if (!result?.ok) throw new Error("Support opening failed");
      } else window.open(SUPPORT_URL, "_blank", "noopener,noreferrer");
    } catch { setFailed(true); }
    finally { setOpening(null); }
  };
  return <FeedbackDialog dismissOnBackdrop dark={dark} title={t("helpAndFeedback")} description={t("helpIntro")} busy={busy} onClose={onClose}
    footer={<details className="text-xs">
      <summary className={`cursor-pointer rounded font-medium leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`}>{t("reviewRequestStatus")}</summary>
      <p className={`mt-2 leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{t(reasonLabels[review.reason] ?? "reviewStatusLoading")}</p>
      {review.state && <p className={`mt-2 leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{t("reviewProgress", { sessions: review.state.qualifiedSessions, requiredsessions: REVIEW_PROMPT_POLICY.minimumQualifiedSessions, actions: review.state.successfulActions, requiredactions: REVIEW_PROMPT_POLICY.minimumSuccessfulActions })}</p>}
    </details>}
  >
    <div className="grid gap-2">
      <button type="button" disabled={busy} aria-busy={opening === "review"} onClick={() => void open("review")}
        className="flex min-h-10 items-center gap-3 rounded-lg border border-teal-700 bg-teal-700 px-3 py-2.5 text-start text-[13px] font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-60">
        <Star size={16} className="shrink-0" aria-hidden="true" /><span className="flex-1">{opening === "review" ? t("openingReview") : t("leaveStoreReview")}</span>
        {opening === "review" ? <LoaderCircle size={14} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ExternalLink size={14} className="shrink-0" aria-hidden="true" />}
      </button>
      <button type="button" disabled={busy} aria-busy={opening === "support"} onClick={() => void open("support")}
        className={`flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-60 ${dark ? "border-slate-600 bg-slate-800/40 hover:bg-slate-800" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
        <Bug size={16} className="shrink-0" aria-hidden="true" /><span className="flex-1">{opening === "support" ? t("openingReview") : t("reportIssueGitHub")}</span>
        {opening === "support" ? <LoaderCircle size={14} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ExternalLink size={14} className="shrink-0" aria-hidden="true" />}
      </button>
    </div>
    {failed && <FeedbackError dark={dark}>{t("reviewOpenError")}</FeedbackError>}
  </FeedbackDialog>;
}
