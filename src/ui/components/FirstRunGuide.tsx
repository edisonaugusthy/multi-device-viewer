import {
  ArrowLeft,
  ArrowRight,
  Check,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  positionCard,
  type HighlightRect,
} from "./first-run-tour";

export function FirstRunGuide({
  dark,
  onClose,
}: {
  dark: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const step = FIRST_RUN_TOUR_STEPS[stepIndex];
  const finalStep = stepIndex === FIRST_RUN_TOUR_STEPS.length - 1;

  const updateHighlight = useCallback(() => {
    if (!step.target) {
      setHighlight(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(step.target);
    if (!target) {
      setHighlight(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setHighlight(
      highlightRectForTarget(
        {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        window.innerWidth,
        window.innerHeight,
      ),
    );
  }, [step.target]);

  useLayoutEffect(() => {
    const target = step.target
      ? document.querySelector<HTMLElement>(step.target)
      : null;
    target?.scrollIntoView({ block: "center", inline: "nearest" });
    const frame = window.requestAnimationFrame(updateHighlight);
    return () => window.cancelAnimationFrame(frame);
  }, [step.target, updateHighlight]);

  useEffect(() => {
    if (!step.target) return;
    const target = document.querySelector<HTMLElement>(step.target);
    if (!target) return;
    const resizeObserver = new ResizeObserver(updateHighlight);
    resizeObserver.observe(target);
    const settledLayoutTimer = window.setTimeout(updateHighlight, 250);
    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(settledLayoutTimer);
    };
  }, [step.target, updateHighlight]);

  useEffect(() => {
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [updateHighlight]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        if (finalStep) onClose();
        else setStepIndex((current) => current + 1);
      }
      if (event.key === "ArrowLeft")
        setStepIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finalStep, onClose]);

  const cardStyle = positionCard(highlight);

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-title"
    >
      <div
        className={`fixed inset-0 transition-colors ${
          highlight ? "bg-transparent" : "bg-black/55"
        }`}
        aria-hidden="true"
      />
      {highlight && (
        <div
          data-testid="tour-highlight"
          className="pointer-events-none fixed rounded-xl border-2 border-[#32c9b8] shadow-[0_0_0_9999px_rgba(2,6,15,0.68),0_0_0_5px_rgba(15,159,143,0.2)] transition-all duration-200"
          style={highlight}
          aria-hidden="true"
        />
      )}

      <section
        className={`fixed flex max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[360px] flex-col overflow-y-auto rounded-2xl border p-5 shadow-2xl transition-[left,top] duration-200 ${
          dark
            ? "border-white/10 bg-[#171a21] text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#18b5a4]">
              {step.eyebrow} · {stepIndex + 1} of{" "}
              {FIRST_RUN_TOUR_STEPS.length}
            </p>
            <h2
              id="first-run-title"
              className="mt-1 text-lg font-extrabold leading-6"
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip feature tour"
            title="Skip tour"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
              dark ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <p
          className={`mt-3 text-xs leading-5 ${
            dark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {step.text}
        </p>

        {step.hint && (
          <div
            className={`mt-4 flex gap-2.5 rounded-xl p-3 ${
              dark ? "bg-white/[0.05]" : "bg-slate-50"
            }`}
          >
            {stepIndex === 0 ? (
              <ShieldCheck
                className="mt-0.5 shrink-0 text-[#18b5a4]"
                size={17}
              />
            ) : (
              <MousePointerClick
                className="mt-0.5 shrink-0 text-[#18b5a4]"
                size={17}
              />
            )}
            <p
              className={`text-[11px] leading-4 ${
                dark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {stepIndex === 0 && (
                <strong
                  className={dark ? "text-slate-200" : "text-slate-700"}
                >
                  Private and local.{" "}
                </strong>
              )}
              {step.hint}
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div
            className="flex gap-1.5"
            aria-label={`Tour step ${stepIndex + 1} of ${FIRST_RUN_TOUR_STEPS.length}`}
          >
            {FIRST_RUN_TOUR_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStepIndex(index)}
                aria-label={`Go to step ${index + 1}: ${item.title}`}
                aria-current={index === stepIndex ? "step" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex
                    ? "w-5 bg-[#18b5a4]"
                    : dark
                      ? "w-1.5 bg-white/20 hover:bg-white/40"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
                className={`grid h-9 w-9 place-items-center rounded-xl ${
                  dark
                    ? "bg-white/[0.07] hover:bg-white/10"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
                aria-label="Previous tour step"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                finalStep
                  ? onClose()
                  : setStepIndex((current) => current + 1)
              }
              className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0f9f8f] px-4 text-xs font-extrabold text-white hover:bg-[#0c8b7e]"
            >
              {finalStep ? (
                <>
                  <Check size={15} />
                  Start testing
                </>
              ) : stepIndex === 0 ? (
                <>
                  <Sparkles size={15} />
                  Show me
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
