import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { useI18n } from "../../app/i18n";
import { NavigationSyncIcon, PlayIcon, RecordIcon, StopIcon, TrashIcon } from "../icons";
import { cx, focusRing, positionStyle, popoverPanel, SectionLabel, useAnchoredPosition, useDismiss } from "./ui";

export interface FlowStatus {
  text: string;
  tone: "neutral" | "success" | "warning" | "error";
}

export function RecordMenu({
  open, anchorRef, onClose,
  tabRecording, tabRecordingTime, canRecordTab, onToggleTabRecording,
  flowRecording, flowStepCount, onToggleFlowRecording, onReplayFlow, onClearFlow, flowStatus, canResumeFlow, onResumeFlow,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  tabRecording: boolean;
  tabRecordingTime: string;
  canRecordTab: boolean;
  onToggleTabRecording: () => void;
  flowRecording: boolean;
  flowStepCount: number;
  onToggleFlowRecording: () => void;
  onReplayFlow: () => void;
  onClearFlow: () => void;
  flowStatus?: FlowStatus;
  canResumeFlow: boolean;
  onResumeFlow: () => void;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 300, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;

  return (
    <div ref={panelRef} role="dialog" aria-label={t("record")} className={cx(popoverPanel, "fixed p-1.5")} style={positionStyle(position)}>
      <SectionLabel className="px-2 pb-1 pt-1.5">{t("recordSourceTab")}</SectionLabel>
      <MenuRow
        icon={tabRecording ? <StopIcon size={14} className="text-record" /> : <RecordIcon size={15} />}
        label={tabRecording ? t("stopAndSaveVideo") : t("recordTabVideo")}
        detail={tabRecording ? tabRecordingTime : undefined}
        active={tabRecording}
        disabled={!canRecordTab}
        onClick={onToggleTabRecording}
      />
      <div className="mx-2 my-1.5 h-px bg-line-soft" />
      <SectionLabel className="px-2 pb-1">{t("flowRecorder")}</SectionLabel>
      <div data-tour="record-user-flow">
        <MenuRow
          icon={flowRecording ? <StopIcon size={14} className="text-record" /> : <NavigationSyncIcon size={15} />}
          label={flowRecording ? t("stopAndSaveFlow", { count: flowStepCount }) : t("recordAFlow")}
          active={flowRecording}
          onClick={onToggleFlowRecording}
        />
      </div>
      {!flowRecording && (
        <MenuRow
          icon={<PlayIcon size={14} />}
          label={flowStepCount ? t("reloadAndRerunFlow", { count: flowStepCount }) : t("recordFlowToRerun")}
          disabled={!flowStepCount}
          onClick={onReplayFlow}
        />
      )}
      {canResumeFlow && <MenuRow icon={<PlayIcon size={14} />} label={t("resumeFlowAfterVerification")} onClick={onResumeFlow} />}
      {!flowRecording && flowStepCount > 0 && <MenuRow icon={<TrashIcon size={15} />} label={t("clearSavedFlow")} onClick={onClearFlow} />}
      {flowStatus && (
        <p role="status" aria-live="polite" className={cx(
          "px-2 pb-1 pt-1.5 text-xs font-semibold",
          flowStatus.tone === "success" && "text-accent",
          flowStatus.tone === "error" && "text-danger",
          flowStatus.tone === "warning" && "text-warn",
          flowStatus.tone === "neutral" && "text-muted",
        )}>{flowStatus.text}</p>
      )}
    </div>
  );
}

// Shown under the toolbar for as long as a recording runs, so it is always
// clear what is being recorded and how to stop it.
export function RecordingBar({ tabRecording, tabRecordingTime, onStopTab, flowRecording, flowDevice, flowStepCount, onStopFlow }: {
  tabRecording: boolean;
  tabRecordingTime: string;
  onStopTab: () => void;
  flowRecording: boolean;
  /** The device the flow is recorded from; null until the first step. */
  flowDevice: string | null;
  flowStepCount: number;
  onStopFlow: () => void;
}) {
  const { t } = useI18n();
  if (!tabRecording && !flowRecording) return null;
  return (
    <div data-recording-bar className="pointer-events-none fixed inset-x-0 top-[60px] z-[90] flex flex-col items-center gap-1.5 px-4">
      {tabRecording && (
        <RecordingPill label={t("recordingTabNow")} detail={tabRecordingTime} action={t("stopAndSaveVideo")} onStop={onStopTab} />
      )}
      {flowRecording && (
        <RecordingPill label={flowDevice ? t("recordingFlowNow", { name: flowDevice }) : t("recordingFlowAny")} detail={t("flowSteps", { count: flowStepCount })} action={t("stopAndSave")} onStop={onStopFlow} />
      )}
    </div>
  );
}

function RecordingPill({ label, detail, action, onStop }: { label: string; detail: string; action: string; onStop: () => void }) {
  return (
    <div role="group" aria-label={label} className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border border-record/30 bg-surface py-1 pe-1 ps-3 text-[13px] font-medium text-ink shadow-float">
      <span aria-hidden="true" className="size-2.5 shrink-0 animate-pulse rounded-full bg-record" />
      <span className="min-w-0 truncate">{label}</span>
      <span dir="ltr" className="shrink-0 font-mono text-xs text-muted">{detail}</span>
      <button type="button" onClick={onStop} className={cx("flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-record px-3 text-xs font-semibold text-white hover:brightness-110", focusRing)}>
        <StopIcon size={11} />{action}
      </button>
    </div>
  );
}

function MenuRow({ icon, label, detail, active = false, disabled = false, onClick }: {
  icon: ReactNode; label: string; detail?: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active || undefined}
      onClick={onClick}
      className={cx(
        "flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-record/10 text-record" : "text-ink hover:bg-sunken",
        focusRing,
      )}
    >
      <span className="grid w-4 shrink-0 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {detail && <span className="shrink-0 font-mono text-xs">{detail}</span>}
    </button>
  );
}
