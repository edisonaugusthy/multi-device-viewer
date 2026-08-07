import type { FlowStep } from "./flow.types";

const FINAL_VALUE_KINDS = new Set<FlowStep["kind"]>(["input", "change", "scroll"]);

export function appendRecordedStep(steps: FlowStep[], incoming: Omit<FlowStep, "id">): FlowStep[] {
  if (incoming.kind === "keydown" && incoming.key && incoming.key.length === 1) return steps;

  const next: FlowStep = {
    ...incoming,
    id: crypto.randomUUID(),
  };
  const previous = steps.at(-1);
  const sameTarget = previous?.selector === next.selector
    && previous?.scrollTargetSelector === next.scrollTargetSelector;

  if (previous && sameTarget && FINAL_VALUE_KINDS.has(previous.kind) && FINAL_VALUE_KINDS.has(next.kind)) {
    return [...steps.slice(0, -1), next];
  }
  return [...steps, next];
}

export function flowStepLabel(step: FlowStep, index: number): string {
  const target = step.ariaLabel || step.text || step.name || step.selector || "page";
  return `${index + 1}. ${step.kind} ${target}`;
}
