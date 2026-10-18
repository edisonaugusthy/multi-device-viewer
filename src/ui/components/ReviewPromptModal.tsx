import { useState } from "react";
import { useI18n } from "../../app/i18n";
import { OpenInTabIcon, StarIcon } from "../icons";
import { Dialog, DialogError, Spinner } from "./Dialog";
import { cx, focusRing } from "./ui";

interface ReviewPromptModalProps {
  storageError?: boolean;
  onReview: () => Promise<void>;
  onNotNow: () => void;
  onNever: () => void;
}

// Five stars that settle in one after another. Decoration only: every
// button leads to the same honest review, whatever someone would rate it.
function Stars() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1 rounded-full border border-line-soft bg-surface px-3 py-1.5 shadow-float">
      {[0, 1, 2, 3, 4].map(index => (
        <StarIcon key={index} filled size={20} className="animate-star-in text-star motion-reduce:animate-none" style={{ animationDelay: `${120 + index * 70}ms` }} />
      ))}
    </span>
  );
}

export function ReviewPromptModal({ storageError = false, onReview, onNotNow, onNever }: ReviewPromptModalProps) {
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
    <Dialog hero={<Stars />} title={t("reviewTitle")} dismissOnBackdrop={false}
      description={<><strong className="font-semibold text-ink">{t("reviewOpenSource")}</strong>{" "}{t("reviewBody")}</>}
      busy={opening} onClose={onNotNow}
      footer={<>
        <button type="button" onClick={onNever} disabled={opening}
          className={cx("h-8 rounded-lg px-2 text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50", focusRing)}>{t("reviewNever")}</button>
        <span className="flex-1" />
        <button type="button" onClick={onNotNow} disabled={opening}
          className={cx("h-8 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-50", focusRing)}>{t("reviewNotNow")}</button>
      </>}
    >
      <button type="button" onClick={openReview} disabled={opening} aria-busy={opening}
        className={cx("flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent shadow-float transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-70", focusRing)}>
        {opening ? <Spinner /> : <StarIcon filled size={16} />}
        {opening ? t("openingReview") : t("reviewCta")}
        {!opening && <OpenInTabIcon size={14} className="opacity-70" />}
      </button>
      {(failed || storageError) && <DialogError>{t(failed ? "reviewOpenError" : "reviewStatusError")}</DialogError>}
    </Dialog>
  );
}
