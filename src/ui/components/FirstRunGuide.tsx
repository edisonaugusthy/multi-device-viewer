import { getViewerEventTarget, getViewerRoot } from "../../app/viewer-context";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../icons";
import { cx, focusRing, IconButton } from "./ui";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useI18n } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  tourStepsSince,
  positionCard,
  type HighlightRect,
  type ProductTourStep,
} from "./first-run-tour";

const ALL_TOUR_STEPS = FIRST_RUN_TOUR_STEPS.filter(step => FEATURES.visualChecks || step.title !== "visualChecks");

/** `seenTour` is the tour revision this person saw last: an update shows only the steps added since. */
export function FirstRunGuide({ onClose, seenTour = null, floating, pictureInPicture }: {
  onClose: () => void;
  seenTour?: string | null;
  floating: boolean;
  pictureInPicture: boolean;
}) {
  const availability = { floating, pictureInPicture };
  const [steps] = useState(() => tourStepsSince(ALL_TOUR_STEPS, seenTour)
    .filter(step => !step.requires || availability[step.requires])
    .filter(step => !step.activateTarget || (step.target && getViewerRoot().querySelector(step.target))));
  useEffect(() => { if (!steps.length) onClose(); }, [steps, onClose]);
  return steps.length ? <TourCards steps={steps} onClose={onClose} /> : null;
}

function TourCards({ steps: TOUR_STEPS, onClose }: { steps: ProductTourStep[]; onClose: () => void }) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const step = TOUR_STEPS[stepIndex];
  const finalStep = stepIndex === TOUR_STEPS.length - 1;

  const findTarget = useCallback(() => {
    if (!step.target) return null;
    return Array.from(getViewerRoot().querySelectorAll<HTMLElement>(step.target))
      .find(target => {
        const rect = target.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }) ?? null;
  }, [step.target]);

  const updateHighlight = useCallback(() => {
    if (!step.target) {
      setHighlight(null);
      return;
    }
    const target = findTarget();
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
  }, [step.target, findTarget]);

  useLayoutEffect(() => {
    const target = findTarget();
    target?.scrollIntoView({ block: "center", inline: "nearest" });
    const frame = window.requestAnimationFrame(updateHighlight);
    return () => window.cancelAnimationFrame(frame);
  }, [findTarget, updateHighlight]);

  useEffect(() => {
    if (!step.target) return;
    const target = findTarget();
    if (!target) return;
    const resizeObserver = new ResizeObserver(updateHighlight);
    resizeObserver.observe(target);
    const settledLayoutTimer = window.setTimeout(updateHighlight, 250);
    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(settledLayoutTimer);
    };
  }, [step.target, findTarget, updateHighlight]);

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
    getViewerEventTarget().addEventListener("keydown", onKeyDown);
    return () => getViewerEventTarget().removeEventListener("keydown", onKeyDown);
  }, [finalStep, onClose]);

  const cardStyle = positionCard(highlight);
  function tryControl() {
    const control = findTarget();
    onClose();
    control?.click();
  }
  function advance() {
    if (!finalStep) setStepIndex(current => current + 1);
    else if (step.activateTarget) tryControl();
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="first-run-title">
      <div className={cx("fixed inset-0 transition-colors", highlight ? "bg-transparent" : "bg-black/45")} aria-hidden="true" />
      {highlight && (
        <div
          data-testid="tour-highlight"
          className="pointer-events-none fixed rounded-xl border-2 border-accent shadow-[0_0_0_9999px_rgb(10_12_16/0.6),0_0_0_6px_var(--color-accent-soft)] transition-all duration-200"
          style={highlight}
          aria-hidden="true"
        />
      )}
      {highlight && step.activateTarget && (
        <button type="button" aria-label={t(step.title)} className={cx("fixed cursor-pointer rounded-xl bg-transparent", focusRing)}
          style={highlight} onClick={tryControl} />
      )}

      <section
        className="fixed flex max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[320px] flex-col overflow-y-auto rounded-2xl bg-surface p-4 text-ink shadow-popover transition-[left,top] duration-200"
        style={cardStyle}
      >
        <div className="flex items-start gap-2">
          <h2 id="first-run-title" className="min-w-0 flex-1 text-[15px] font-semibold leading-6 tracking-tight">{t(step.title)}</h2>
          <IconButton size="sm" label={t("skipFeatureTour")} onClick={onClose} className="-me-2 -mt-1">
            <CloseIcon size={16} />
          </IconButton>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{t(step.text)}</p>

        {/* A long button label moves the buttons under the dots instead of wrapping. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
          <div className="flex gap-1" aria-label={t("tourStep", { current: stepIndex + 1, total: TOUR_STEPS.length })}>
            {TOUR_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStepIndex(index)}
                aria-label={t("goToTourStep", {
                  current: index + 1,
                  title: t(item.title),
                })}
                aria-current={index === stepIndex ? "step" : undefined}
                className={cx("h-1.5 rounded-full transition-all", index === stepIndex ? "w-5 bg-accent" : "w-1.5 bg-line hover:bg-faint", focusRing)}
              />
            ))}
          </div>
          <div className="ms-auto flex shrink-0 gap-1.5">
            {stepIndex > 0 && (
              <IconButton tone="outline" label={t("previousTourStep")} onClick={() => setStepIndex(current => current - 1)}>
                <ChevronLeftIcon size={15} className="rtl:rotate-180" />
              </IconButton>
            )}
            <button
              type="button"
              onClick={advance}
              className={cx("flex h-[34px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}
            >
              {finalStep
                ? step.activateTarget ? t("chooseFloatingDevice") : <><CheckIcon size={14} />{t("startTesting")}</>
                : stepIndex === 0
                  ? t("showMe")
                  : <>{t("next")}<ChevronRightIcon size={14} className="rtl:rotate-180" /></>}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
