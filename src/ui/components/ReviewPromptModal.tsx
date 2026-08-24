import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "../../app/i18n";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/mobile-view-device-emulat/jfcnekmenjickfihkniaoaklehjmdhdb";
interface ReviewPromptModalProps {
  dark: boolean;
  onReview: () => void;
  onNotNow: () => void;
  onNever: () => void;
}

export function ReviewPromptModal({
  dark,
  onReview,
  onNotNow,
  onNever,
}: ReviewPromptModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    reviewButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onNotNow();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNotNow]);

  const openReview = () => {
    window.open(CHROME_STORE_URL, "_blank", "noopener,noreferrer");
    onReview();
  };

  return (
    <div
      className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-title"
      aria-describedby="review-prompt-description"
    >
      <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center">
        <section
          ref={dialogRef}
          className={`w-full rounded-2xl border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-9 ${
            dark
              ? "border-white/10 bg-[#10141b] text-white"
              : "border-slate-200 bg-white text-slate-950"
          }`}
        >
          <h2
            id="review-prompt-title"
            className="text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl"
          >
            {t("reviewTitle")}
          </h2>
          <p
            id="review-prompt-description"
            className={`mt-3 text-sm leading-6 ${
              dark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {t("reviewBody")}
          </p>

          <div className="mt-7">
            <button
              ref={reviewButtonRef}
              type="button"
              onClick={openReview}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f9f8f] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0c8f81] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24c9b6]"
            >
              {t("reviewCta")}
              <ExternalLink size={15} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold">
            <button
              type="button"
              onClick={onNotNow}
              className={dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}
            >
              {t("reviewNotNow")}
            </button>
            <button
              type="button"
              onClick={onNever}
              className={dark ? "text-slate-500 hover:text-slate-200" : "text-slate-400 hover:text-slate-700"}
            >
              {t("reviewNever")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
