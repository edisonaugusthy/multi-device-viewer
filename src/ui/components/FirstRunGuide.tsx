import { getViewerEventTarget } from "../../app/viewer-context";
import { getViewerRoot } from "../../app/viewer-context";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PointerIcon, TourIcon } from "../icons";
import { cx, focusRing, IconButton } from "./ui";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useI18n, type TranslationKey } from "../../app/i18n";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  positionCard,
  type HighlightRect,
} from "./first-run-tour";

const TOUR_TRANSLATION_KEYS: Array<{
  eyebrow: TranslationKey;
  title: TranslationKey;
  text: TranslationKey;
  hint?: TranslationKey;
}> = [
  { eyebrow: "devices", title: "addDevice", text: "tourAddDeviceText", hint: "tourAddDeviceHint" },
  { eyebrow: "workspace", title: "syncBetweenDevices", text: "tourSyncText" },
  { eyebrow: "devices", title: "changeDevice", text: "tourChangeDeviceText" },
  { eyebrow: "devices", title: "allDevices", text: "tourAllDevicesText", hint: "tourAllDevicesHint" },
  { eyebrow: "flowRecorder", title: "recordAFlow", text: "tourRecordText" },
];

export function FirstRunGuide({ onClose }: { onClose: () => void }) {
  const { locale, t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const baseStep = FIRST_RUN_TOUR_STEPS[stepIndex];
  const stepKeys = TOUR_TRANSLATION_KEYS[stepIndex];
  const step = {
    ...baseStep,
    eyebrow: locale === "en" ? baseStep.eyebrow : t(stepKeys.eyebrow),
    title: locale === "en" ? baseStep.title : t(stepKeys.title),
    text: locale === "en" ? baseStep.text : t(stepKeys.text),
    hint: locale === "en"
      ? baseStep.hint
      : stepKeys.hint
        ? t(stepKeys.hint)
        : undefined,
  };
  const finalStep = stepIndex === FIRST_RUN_TOUR_STEPS.length - 1;

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

      <section
        className="fixed flex max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[360px] flex-col overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-popover transition-[left,top] duration-200"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-strong">
            <TourIcon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-strong">
              {step.eyebrow} · {t("tourStep", { current: stepIndex + 1, total: FIRST_RUN_TOUR_STEPS.length })}
            </p>
            <h2 id="first-run-title" className="mt-0.5 text-[15px] font-semibold leading-6 tracking-tight">{step.title}</h2>
          </div>
          <IconButton size="sm" label={t("skipFeatureTour")} onClick={onClose} className="-me-1.5 -mt-0.5">
            <CloseIcon size={16} />
          </IconButton>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{step.text}</p>

        {step.hint && (
          <div className="mt-3 flex gap-2.5 rounded-xl bg-surface-2 p-3">
            <PointerIcon size={16} className="mt-0.5 shrink-0 text-accent-strong" />
            <p className="text-xs leading-5 text-muted">{step.hint}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-label={t("tourStep", { current: stepIndex + 1, total: FIRST_RUN_TOUR_STEPS.length })}>
            {FIRST_RUN_TOUR_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStepIndex(index)}
                aria-label={t("goToTourStep", {
                  current: index + 1,
                  title: locale === "en" ? item.title : t(TOUR_TRANSLATION_KEYS[index].title),
                })}
                aria-current={index === stepIndex ? "step" : undefined}
                className={cx("h-1.5 rounded-full transition-all", index === stepIndex ? "w-5 bg-accent" : "w-1.5 bg-line hover:bg-faint", focusRing)}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            {stepIndex > 0 && (
              <IconButton tone="outline" label={t("previousTourStep")} onClick={() => setStepIndex(current => current - 1)}>
                <ChevronLeftIcon size={15} className="rtl:rotate-180" />
              </IconButton>
            )}
            <button
              type="button"
              onClick={() => finalStep ? onClose() : setStepIndex(current => current + 1)}
              className={cx("flex h-[34px] items-center justify-center gap-1.5 rounded-[9px] bg-primary px-3.5 text-[13px] font-semibold text-on-primary hover:opacity-90", focusRing)}
            >
              {finalStep
                ? <><CheckIcon size={14} />{t("startTesting")}</>
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
