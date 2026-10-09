import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { buildAiReviewPrompt, type ReviewDevice } from "../../domain/review/review-issue";
import { CheckIcon, ChevronRightIcon, CloseIcon, CopyIcon } from "../icons";
import { shortName } from "./PreviewCard";
import { cx, focusRing, positionStyle, popoverPanel, useAnchoredPosition, useDismiss } from "./ui";

export interface FixPromptDevice extends ReviewDevice {
  id: string;
}

function summarize(text: string) {
  const firstLine = text.trim().split(/\n|(?<=[.!?])\s/)[0] ?? "";
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}…` : firstLine;
}

// The short form behind every fix prompt: what is wrong, where, and optional detail.
export function FixPromptForm({ pageUrl, devices, initialDeviceIds, onClose, compact = false }: {
  pageUrl: string;
  devices: FixPromptDevice[];
  initialDeviceIds?: string[];
  onClose?: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [wrong, setWrong] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [selector, setSelector] = useState("");
  const [notes, setNotes] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState(() => new Set(initialDeviceIds ?? devices.map(device => device.id)));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { setCopied(false); }, [wrong, expected, steps, selector, notes, selected]);

  const prompt = useMemo(() => buildAiReviewPrompt({
    pageUrl,
    summary: summarize(wrong),
    expected,
    actual: wrong,
    reproduction: steps,
    selector,
    notes,
    devices: devices.filter(device => selected.has(device.id)),
  }), [devices, expected, notes, pageUrl, selected, selector, steps, wrong]);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
  }

  const field = "w-full rounded-[9px] border border-line bg-surface px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start gap-2.5 pb-2.5 pe-2 ps-3.5 pt-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t("fixPrompt")}</h2>
          <p className="text-xs text-muted">{t("fixPromptHelp")}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label={t("closeFixPrompt")} title={t("closeFixPrompt")} className={cx("grid size-[30px] shrink-0 place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">{t("whatsWrong")}</span>
          <textarea
            ref={textareaRef}
            rows={3}
            value={wrong}
            onChange={event => setWrong(event.target.value)}
            placeholder={t("whatsWrongPlaceholder")}
            className={cx(field, "resize-y py-2 leading-relaxed")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">{t("whatShouldHappen")} <span className="font-medium text-faint">{t("optional")}</span></span>
          <input value={expected} onChange={event => setExpected(event.target.value)} placeholder={t("whatShouldHappenPlaceholder")} className={cx(field, "h-[34px]")} />
        </label>

        {!compact && devices.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold">{t("whereItHappens")}</span>
            <div role="group" aria-label={t("devicesToInclude")} className="flex flex-wrap gap-1.5">
              {devices.map(device => {
                const on = selected.has(device.id);
                return (
                  <button
                    key={device.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelected(current => {
                      const next = new Set(current);
                      if (on) next.delete(device.id); else next.add(device.id);
                      return next;
                    })}
                    className={cx(
                      "flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border pe-2.5 ps-1.5 text-xs font-semibold",
                      on ? "border-accent-line bg-accent-soft text-accent-strong" : "border-line bg-surface text-muted",
                      focusRing,
                    )}
                  >
                    <span className={cx("grid size-3.5 place-items-center rounded-full text-on-accent", on ? "bg-accent" : "bg-line")}>
                      {on && <CheckIcon size={9} strokeWidth={4} />}
                    </span>
                    {shortName(device.name)}
                    <span className="font-mono text-[11px] font-medium text-faint">{device.width}×{device.height}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(value => !value)}
          className={cx("flex h-7 items-center gap-1.5 self-start rounded px-1 text-[12.5px] font-semibold text-ink-2", focusRing)}
        >
          <ChevronRightIcon size={13} strokeWidth={2.4} className={cx("transition-transform", moreOpen && "rotate-90")} />
          {t("moreDetails")}
          <span className="font-medium text-faint">{t("moreDetailsHint")}</span>
        </button>
        {moreOpen && (
          <div className="-mt-1 flex flex-col gap-2 border-s-2 border-sunken ps-2.5">
            <input aria-label={t("reproductionSteps")} value={steps} onChange={event => setSteps(event.target.value)} placeholder={t("reproductionSteps")} className={cx(field, "h-8 px-2.5")} />
            <input aria-label={t("cssSelector")} value={selector} onChange={event => setSelector(event.target.value)} placeholder={t("selectorPlaceholder")} className={cx(field, "h-8 px-2.5 font-mono")} />
            <input aria-label={t("constraintsContext")} value={notes} onChange={event => setNotes(event.target.value)} placeholder={t("constraintsShortPlaceholder")} className={cx(field, "h-8 px-2.5")} />
          </div>
        )}

        {previewOpen && (
          <pre aria-label={t("promptPreview")} className="m-0 max-h-[170px] overflow-auto whitespace-pre-wrap break-words rounded-[9px] border border-line-soft bg-surface-2 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink-2">
            {prompt}
          </pre>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line-soft px-3.5 py-2.5">
        <button type="button" aria-expanded={previewOpen} onClick={() => setPreviewOpen(value => !value)}
          className={cx("h-[34px] rounded-[9px] px-2.5 text-[12.5px] font-semibold text-ink-2 hover:bg-sunken", focusRing)}>
          {previewOpen ? t("hidePreview") : t("preview")}
        </button>
        <span className="flex-1" />
        <button type="button" onClick={() => void copy()}
          className={cx("flex h-9 items-center gap-1.5 rounded-[9px] px-4 text-[13px] font-semibold text-on-accent", copied ? "bg-accent-strong" : "bg-accent", focusRing)}>
          {copied ? <CheckIcon size={14} strokeWidth={2.4} /> : <CopyIcon size={14} />}
          {copied ? t("copied") : t("copyPrompt")}
        </button>
      </div>
    </div>
  );
}

export function FixPromptPopover({ open, anchorRef, onClose, ...form }: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  pageUrl: string;
  devices: FixPromptDevice[];
  initialDeviceIds?: string[];
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 420, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;
  return (
    <div ref={panelRef} role="dialog" aria-label={t("fixPrompt")} className={cx(popoverPanel, "fixed")} style={positionStyle(position)}>
      <FixPromptForm key={(form.initialDeviceIds ?? []).join()} {...form} onClose={onClose} />
    </div>
  );
}
