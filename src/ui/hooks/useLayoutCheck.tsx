import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getViewerRoot } from "../../app/viewer-context";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import {
  formatOverflow, groupLayoutProblems, layoutProblemKey,
  type DeviceLayoutReport, type LayoutProblemGroup,
} from "../../domain/layout-check/layout-check";
import type { LayoutCheckReport, LayoutMark, LayoutProblem } from "../../domain/layout-check/layout-check.types";
import type { Device, Size } from "../../domain/device/device.types";
import type { PreviewSlot } from "../../domain/simulator/simulator.types";
import type { FixPromptPrefill } from "../components/FixPrompt";

export interface LayoutSlotStatus {
  status: "checking" | "done" | "failed";
  count: number;
}

export interface LayoutDeviceRow {
  slotId: string;
  name: string;
  width: number;
  height: number;
  status: "checking" | "done" | "failed" | "idle";
  count: number;
}

export interface LayoutCheckView {
  open: boolean;
  checking: boolean;
  groups: LayoutProblemGroup[];
  selected: string | null;
  checkedAt: number | null;
  afterReload: boolean;
  devices: LayoutDeviceRow[];
  totals: { problems: number; affected: number; total: number };
  /** Some device hit the limit, so its list is incomplete. */
  truncated: boolean;
}

type SlotState =
  | { status: "checking"; requestId: string }
  | { status: "done"; report: LayoutCheckReport }
  | { status: "failed" };

const SETTINGS_KEY = "mdvLayoutCheck";
/** A preview that cannot answer (blocked, standalone, still loading) fails instead of hanging; a heavy page takes a while. */
const ANSWER_TIMEOUT_MS = 15000;
/** Lets a reloaded page lay out before it is measured again. */
const RELOAD_SETTLE_MS = 700;

function frameFor(slotId: string) {
  return getViewerRoot().querySelector<HTMLIFrameElement>(`[data-preview-slot-id="${CSS.escape(slotId)}"] iframe`);
}

function post(slotId: string, message: Record<string, unknown>) {
  frameFor(slotId)?.contentWindow?.postMessage({ ...message, slotId }, "*");
}

const joinNames = (names: string[]) => names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const isProblem = (problem: unknown): problem is LayoutProblem => typeof problem === "object" && problem !== null
  && typeof (problem as LayoutProblem).id === "string" && typeof (problem as LayoutProblem).selector === "string"
  && [(problem as LayoutProblem).x, (problem as LayoutProblem).y, (problem as LayoutProblem).width, (problem as LayoutProblem).height]
    .every(value => typeof value === "number" && Number.isFinite(value));

/** Runs the Layout check across the workspace's previews and owns its results, marks and setting. */
export function useLayoutCheck({ slots, findDevice, slotSize }: {
  slots: PreviewSlot[];
  findDevice: (deviceId: string) => Device;
  slotSize: (slotId: string) => Size;
}) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, SlotState>>({});
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [afterReload, setAfterReloadState] = useState(true);
  const statesRef = useRef(states); statesRef.current = states;
  const afterReloadRef = useRef(afterReload); afterReloadRef.current = afterReload;
  const slotsRef = useRef(slots); slotsRef.current = slots;
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let active = true;
    void readStore<{ afterReload?: boolean }>(SETTINGS_KEY, {}).then(stored => {
      if (active && typeof stored?.afterReload === "boolean") setAfterReloadState(stored.afterReload);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const run = useCallback((slotIds?: string[]) => {
    const ids = slotIds ?? slotsRef.current.map(slot => slot.id);
    setOpen(true);
    if (!slotIds) setSelected(null);
    setStates(current => {
      const next = { ...current };
      for (const slotId of ids) {
        const frame = frameFor(slotId);
        if (!frame?.contentWindow) { next[slotId] = { status: "failed" }; continue; }
        const requestId = crypto.randomUUID();
        next[slotId] = { status: "checking", requestId };
        frame.contentWindow.postMessage({ type: "MDV_LAYOUT_CHECK_REQUEST", slotId, requestId }, "*");
        clearTimeout(timers.current.get(slotId));
        timers.current.set(slotId, setTimeout(() => {
          setStates(latest => latest[slotId]?.status === "checking" && latest[slotId].requestId === requestId
            ? { ...latest, [slotId]: { status: "failed" } } : latest);
        }, ANSWER_TIMEOUT_MS));
      }
      return next;
    });
    setCheckedAt(Date.now());
  }, []);

  // Answers arrive from the preview frames; only the newest request per device counts.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "MDV_LAYOUT_CHECK_RESULT" || typeof data.slotId !== "string") return;
      const slotId: string = data.slotId;
      if (event.source !== frameFor(slotId)?.contentWindow) return;
      const pending = statesRef.current[slotId];
      if (!pending || pending.status !== "checking" || pending.requestId !== data.requestId) return;
      clearTimeout(timers.current.get(slotId));
      const problems: unknown[] | null = Array.isArray(data.problems) ? data.problems : null;
      const report: LayoutCheckReport | null = problems && typeof data.viewportWidth === "number" ? {
        url: typeof data.url === "string" ? data.url : "",
        viewportWidth: data.viewportWidth,
        viewportHeight: typeof data.viewportHeight === "number" ? data.viewportHeight : 0,
        problems: problems.filter(isProblem),
        truncated: data.truncated === true,
      } : null;
      setStates(current => ({ ...current, [slotId]: report ? { status: "done", report } : { status: "failed" } }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Forget devices that left the workspace. (Marks are re-sent on this key, not on
  // every zoom or rotation, which replaces the slot objects.)
  const slotIds = slots.map(slot => slot.id).join("\u0000");
  useEffect(() => {
    const keep = new Set(slotIds.split("\u0000"));
    setStates(current => {
      const stale = Object.keys(current).filter(id => !keep.has(id));
      if (stale.length === 0) return current;
      const next = { ...current };
      for (const id of stale) { delete next[id]; clearTimeout(timers.current.get(id)); }
      return next;
    });
  }, [slotIds]);

  const reports = useMemo<DeviceLayoutReport[]>(() => slots.flatMap(slot => {
    const state = states[slot.id];
    if (state?.status !== "done") return [];
    const size = slotSize(slot.id);
    return [{ slotId: slot.id, deviceName: findDevice(slot.deviceId).name, viewportWidth: size.width, viewportHeight: size.height, report: state.report }];
  }), [findDevice, slotSize, slots, states]);
  const groups = useMemo(() => groupLayoutProblems(reports), [reports]);
  const numberOf = useMemo(() => new Map(groups.map(group => [group.key, group.number])), [groups]);

  // Every device draws the marks of its own report, numbered like the panel.
  useEffect(() => {
    for (const slotId of slotIds.split("\u0000")) {
      if (!slotId) continue;
      const state = states[slotId];
      if (!open || state?.status !== "done") { post(slotId, { type: "MDV_LAYOUT_MARKS", marks: [] }); continue; }
      const marks: LayoutMark[] = state.report.problems.map(problem => {
        const key = layoutProblemKey(problem);
        const overflow = Math.max(problem.overflowRight ?? 0, problem.overflowLeft ?? 0);
        return {
          id: problem.id, number: numberOf.get(key) ?? 0,
          x: problem.x, y: problem.y, width: problem.width, height: problem.height,
          overflowRight: problem.overflowRight, overflowLeft: problem.overflowLeft,
          selected: key === selected,
          label: `${problem.selector} · ${Math.round(problem.width)}×${Math.round(problem.height)}${overflow ? ` · ${formatOverflow(overflow)}` : ""}`,
        };
      });
      post(slotId, { type: "MDV_LAYOUT_MARKS", marks });
    }
  }, [numberOf, open, selected, slotIds, states]);
  useEffect(() => () => { for (const slot of slotsRef.current) post(slot.id, { type: "MDV_LAYOUT_MARKS", marks: [] }); }, []);

  const select = useCallback((key: string | null) => {
    setSelected(key);
    const group = key ? groups.find(item => item.key === key) : undefined;
    for (const device of group?.devices ?? []) post(device.slotId, { type: "MDV_LAYOUT_SHOW", id: device.problemId });
  }, [groups]);

  const step = useCallback((delta: 1 | -1) => {
    if (groups.length === 0) return;
    const index = groups.findIndex(group => group.key === selected);
    const next = index < 0 ? (delta > 0 ? 0 : groups.length - 1) : (index + delta + groups.length) % groups.length;
    select(groups[next].key);
  }, [groups, select, selected]);

  const close = useCallback(() => { setOpen(false); setSelected(null); }, []);

  const setAfterReload = useCallback((on: boolean) => {
    afterReloadRef.current = on;
    setAfterReloadState(on);
    void writeStore(SETTINGS_KEY, { afterReload: on }).catch(() => undefined);
  }, []);

  // A reloaded page is measured again when the check is open, so the marks follow the edit.
  const onPageReady = useCallback((slotId: string) => {
    if (!afterReloadRef.current || !statesRef.current[slotId]) return;
    clearTimeout(timers.current.get(`ready:${slotId}`));
    timers.current.set(`ready:${slotId}`, setTimeout(() => run([slotId]), RELOAD_SETTLE_MS));
  }, [run]);
  useEffect(() => () => { for (const timer of timers.current.values()) clearTimeout(timer); }, []);

  const statusBySlot = useMemo(() => {
    const map = new Map<string, LayoutSlotStatus>();
    if (!open) return map;
    for (const [slotId, state] of Object.entries(states)) {
      map.set(slotId, { status: state.status, count: state.status === "done" ? state.report.problems.length : 0 });
    }
    return map;
  }, [open, states]);

  const view = useMemo<LayoutCheckView>(() => {
    const devices: LayoutDeviceRow[] = slots.map(slot => {
      const state = states[slot.id];
      const size = slotSize(slot.id);
      return {
        slotId: slot.id, name: findDevice(slot.deviceId).name, width: size.width, height: size.height,
        status: state?.status ?? "idle", count: state?.status === "done" ? state.report.problems.length : 0,
      };
    });
    const checked = devices.filter(device => device.status === "done");
    return {
      open, checking: devices.some(device => device.status === "checking"), groups, selected, checkedAt, afterReload, devices,
      totals: { problems: groups.length, affected: checked.filter(device => device.count > 0).length, total: devices.length },
      truncated: Object.values(states).some(state => state.status === "done" && state.report.truncated),
    };
  }, [afterReload, checkedAt, findDevice, groups, open, selected, slotSize, slots, states]);

  /** The fix prompt's fields for one culprit, in the prompt's own language. */
  const fixPromptFor = useCallback((group: LayoutProblemGroup): { deviceIds: string[]; prefill: FixPromptPrefill } => {
    const size = `${Math.round(group.width)}×${Math.round(group.height)}`;
    const side = group.overflowLeft ? "left" : "right";
    const sizeOf = (slotId: string) => { const s = slotSize(slotId); return `${s.width}×${s.height}`; };
    return {
      deviceIds: group.devices.map(device => device.slotId),
      prefill: {
        wrong: `${group.selector} (${size}) crosses the ${side} edge of the viewport by ${joinNames(group.devices.map(device => `${Math.round(device.overflow)} px on ${device.deviceName}`))}, so the page scrolls sideways.`,
        expected: "Nothing wider than the viewport. No sideways scrolling at any phone width.",
        selector: group.selector,
        findings: group.devices.map(device => `${device.deviceName} (${sizeOf(device.slotId)}): ${group.selector} is ${Math.round(device.width)} px wide, ${Math.round(device.overflow)} px past the ${side} edge`),
        source: { index: group.number, count: groups.length },
      },
    };
  }, [groups.length, slotSize]);

  return { view, statusBySlot, run, close, select, step, onPageReady, setAfterReload, fixPromptFor };
}
