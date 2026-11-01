import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { diagnosticsStore } from "../../app/preview-reports";
import type { PreviewDiagnostics, PreviewProblem, ProblemKind } from "../../domain/simulator/preview-diagnostics";
import type { PreviewSlot } from "../../domain/simulator/simulator.types";
import type { FixPromptPrefill } from "../components/FixPrompt";

export interface ProblemGroup extends Omit<PreviewProblem, "count" | "firstAt"> {
  devices: Array<{ slotId: string; name: string; count: number }>;
}

const COUNTED: readonly ProblemKind[] = ["error", "request"];

/** Each preview's problems, reported from inside its page and merged across devices for the Problems panel. */
export function useProblems({ slots, deviceName }: { slots: PreviewSlot[]; deviceName: (slot: PreviewSlot) => string }) {
  const all = useSyncExternalStore(diagnosticsStore.subscribe, diagnosticsStore.get);
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [kinds, setKinds] = useState<ReadonlySet<ProblemKind>>(() => new Set(COUNTED));

  const bySlot = useMemo(() => {
    const map = new Map<string, PreviewDiagnostics>();
    const live = new Set(slots.map(slot => slot.id));
    for (const [slotId, diagnostics] of Object.entries(all)) if (live.has(slotId)) map.set(slotId, diagnostics);
    return map;
  }, [all, slots]);

  /** The same problem on several devices is one row, listing each device and how often. */
  const groups = useMemo(() => {
    const merged = new Map<string, ProblemGroup>();
    for (const slot of slots) {
      for (const problem of bySlot.get(slot.id)?.problems ?? []) {
        const group = merged.get(problem.key) ?? { ...problem, devices: [] };
        group.devices.push({ slotId: slot.id, name: deviceName(slot), count: problem.count });
        merged.set(problem.key, group);
      }
    }
    return [...merged.values()];
  }, [bySlot, deviceName, slots]);

  const counted = (problem: { kind: ProblemKind }) => COUNTED.includes(problem.kind);
  const countFor = useCallback((slotId: string) => (bySlot.get(slotId)?.problems ?? []).filter(counted).length, [bySlot]);
  const onDevice = groups.filter(group => !device || group.devices.some(item => item.slotId === device));
  /** How many of each kind the panel's filters would show for the chosen device. */
  const counts: Record<ProblemKind, number> = { error: 0, request: 0, warning: 0 };
  for (const group of onDevice) counts[group.kind] += 1;
  const warnings = groups.filter(group => group.kind === "warning").length;
  const shown = onDevice.filter(group => kinds.has(group.kind));
  const total = groups.filter(counted).length;
  const clean = slots.filter(slot => bySlot.has(slot.id) && countFor(slot.id) === 0).map(slot => ({ slotId: slot.id, name: deviceName(slot) }));
  /** Devices with problems, in workspace order: the panel filters by one of them. */
  const devices = slots.filter(slot => countFor(slot.id) > 0).map(slot => ({ slotId: slot.id, name: deviceName(slot), count: countFor(slot.id) }));

  const toggleKind = useCallback((kind: ProblemKind) => setKinds(current => {
    const next = new Set(current);
    if (next.has(kind)) next.delete(kind); else next.add(kind);
    return next;
  }), []);
  const show = useCallback((slotId?: string) => { setOpen(true); setDevice(slotId ?? null); }, []);
  const close = useCallback(() => setOpen(false), []);

  /** The fix prompt's fields for some problems, in the prompt's own language. */
  const fixPromptFor = useCallback((items: ProblemGroup[]): { deviceIds: string[]; prefill: FixPromptPrefill } => {
    const deviceIds = [...new Set(items.flatMap(item => item.devices.map(entry => entry.slotId)))];
    const findings = items.flatMap(item => [
      `${item.kind === "request" ? "Failed request" : item.kind === "warning" ? "Warning" : "Error"}: ${item.title}${item.where ? ` (${item.where})` : ""} · ${item.devices.map(entry => `${entry.name}${entry.count > 1 ? ` ×${entry.count}` : ""}`).join(", ")}`,
      ...(item.stack ?? []).map(line => `  ${line}`),
      ...(item.response ? [`  Response: ${item.response.replace(/\s+/g, " ").slice(0, 200)}`] : []),
    ]);
    const first = items[0];
    return {
      deviceIds,
      prefill: {
        wrong: items.length === 1 && first ? `${first.title}${first.where ? ` (${first.where})` : ""}` : `${items.length} errors and failed requests in the page.`,
        findings,
        findingsTitle: "Errors and failed requests (from the browser):",
      },
    };
  }, []);

  return {
    open, device, devices, kinds, counts, groups: shown, total, warnings, clean,
    countFor, setDevice, toggleKind, show, close, fixPromptFor,
  };
}
