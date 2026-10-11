export type FlowStepKind = "click" | "input" | "change" | "keydown" | "scroll";

export interface FlowStep {
  id: string;
  kind: FlowStepKind;
  selector?: string;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  name?: string;
  text?: string;
  value?: string;
  checked?: boolean;
  inputType?: string;
  key?: string;
  code?: string;
  scrollLeft?: number;
  scrollTop?: number;
  scrollTargetSelector?: string;
  url?: string;
}

export interface FlowReplayRequest {
  runId: string;
  steps: FlowStep[];
  startUrl?: string;
  startIndexes?: Record<string, number>;
}

export interface FlowReplayResult {
  runId: string;
  slotId: string;
  status: "passed" | "failed" | "paused";
  failedStep?: number;
  nextStep?: number;
  reason?: "verification-required";
  url?: string;
  error?: string;
}
