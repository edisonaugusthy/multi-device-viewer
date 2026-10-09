import { useState, type ReactNode } from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { useReviewPrompt } from "../../app/useReviewPrompt";
import { SUPPORT_URL } from "../../domain/review/review-coordinator";
import { REVIEW_PROMPT_POLICY } from "../../domain/review/review-prompt";
import { BugIcon, ChevronRightIcon, HelpIcon, OpenInTabIcon, StarIcon } from "../icons";
import { Dialog, DialogError, Spinner } from "./Dialog";
import { cx, focusRing } from "./ui";

const reasonLabels: Record<string, TranslationKey> = {
  disabled: "reviewStatusDisabled", error: "reviewStatusError", loading: "reviewStatusLoading",
  age: "reviewStatusAge", sessions: "reviewStatusSessions", testing: "reviewStatusTesting",
  cooldown: "reviewStatusCooldown", "return-sessions": "reviewStatusReturnSessions",
  limit: "reviewStatusLimit", never: "reviewStatusNever", eligible: "reviewStatusEligible",
};

export function HelpModal({ review, onClose }: {
  review: ReturnType<typeof useReviewPrompt>; onClose: () => void;
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
  return (
    <Dialog icon={<HelpIcon size={18} />} title={t("helpAndFeedback")} description={t("helpIntro")} busy={busy} onClose={onClose}
      footer={<details className="group/status min-w-0 flex-1 text-xs">
        <summary className={cx("flex cursor-pointer list-none items-center gap-1 rounded font-medium text-muted hover:text-ink", focusRing)}>
          <ChevronRightIcon size={12} className="transition-transform group-open/status:rotate-90 rtl:rotate-180" />
          {t("reviewRequestStatus")}
        </summary>
        <div className="mt-2 space-y-1 leading-5 text-muted">
          <p className="text-ink-2">{t(reasonLabels[review.reason] ?? "reviewStatusLoading")}</p>
          {review.state && <>
            <p>{t("reviewProgress", { sessions: review.state.qualifiedSessions, requiredsessions: REVIEW_PROMPT_POLICY.minimumQualifiedSessions })}</p>
            <p>{t("reviewTracking", { prompts: review.state.promptCount, limit: REVIEW_PROMPT_POLICY.maximumPrompts, opens: review.state.openedCount, dismissals: review.state.postponedCount })}</p>
            <p>{t("reviewTrackingNote")}</p>
          </>}
        </div>
      </details>}
    >
      <div className="grid gap-2">
        <ActionRow primary icon={<StarIcon size={16} />} busy={opening === "review"} disabled={busy} onClick={() => void open("review")}>
          {opening === "review" ? t("openingReview") : t("leaveStoreReview")}
        </ActionRow>
        <ActionRow icon={<BugIcon size={16} />} busy={opening === "support"} disabled={busy} onClick={() => void open("support")}>
          {opening === "support" ? t("openingReview") : t("reportIssueGitHub")}
        </ActionRow>
      </div>
      {failed && <DialogError>{t("reviewOpenError")}</DialogError>}
    </Dialog>
  );
}

// A full-width action that opens a page outside the viewer.
function ActionRow({ primary = false, icon, busy, disabled, onClick, children }: {
  primary?: boolean; icon: ReactNode; busy: boolean; disabled: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button type="button" disabled={disabled} aria-busy={busy} onClick={onClick}
      className={cx(
        "flex min-h-11 items-center gap-3 rounded-xl border px-3.5 text-start text-[13px] font-semibold transition-colors disabled:opacity-60",
        primary ? "border-transparent bg-accent text-on-accent hover:opacity-90" : "border-line bg-surface text-ink hover:bg-sunken",
        focusRing,
      )}>
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      <span className="flex-1">{children}</span>
      {busy ? <Spinner /> : <OpenInTabIcon size={14} className={cx("shrink-0", !primary && "text-muted")} />}
    </button>
  );
}
