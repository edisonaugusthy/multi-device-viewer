import type { LayoutCheckReport, LayoutProblem, LayoutProblemKind } from "./layout-check.types";

/** One element of a page in document order, as the preview bridge measured it. */
export interface OverflowCandidate {
  /** Index of the parent element in the same list, or -1 at the top. */
  parent: number;
  /** Document coordinates of the element's left and right edges. */
  left: number;
  right: number;
  /** The element clips its children sideways (overflow-x is not visible). */
  clips: boolean;
  /** Hidden or fixed elements never make the page scroll. */
  ignore: boolean;
}

/**
 * The outermost elements that cross the viewport's edges. A clipped subtree
 * cannot widen the page, and the children of an offender are its symptoms,
 * not separate culprits.
 */
export function findOverflowOffenders(candidates: OverflowCandidate[], viewportWidth: number, limit = Infinity): number[] {
  const clipped: boolean[] = [];
  const covered: boolean[] = [];
  const offenders: number[] = [];
  candidates.forEach((candidate, index) => {
    const parent = candidate.parent >= 0 ? candidate.parent : -1;
    const parentClips = parent >= 0 && (clipped[parent] || candidates[parent].clips);
    clipped[index] = parentClips;
    covered[index] = parent >= 0 && (covered[parent] || offenders.includes(parent));
    if (candidate.ignore || parentClips || covered[index]) return;
    if (candidate.right > viewportWidth + 1 || candidate.left < -1) {
      if (offenders.length < limit) offenders.push(index);
      covered[index] = true;
    }
  });
  return offenders;
}

export interface DeviceLayoutReport {
  slotId: string;
  deviceName: string;
  viewportWidth: number;
  viewportHeight: number;
  report: LayoutCheckReport;
}

export interface LayoutProblemDevice {
  slotId: string;
  deviceName: string;
  problemId: string;
  width: number;
  height: number;
  /** How far past the edge, on this device. */
  overflow?: number;
  fontSize?: number;
}

/** One culprit, listed once with every device it fails on. */
export interface LayoutProblemGroup {
  key: string;
  number: number;
  kind: LayoutProblemKind;
  selector: string;
  tagName: string;
  width: number;
  height: number;
  /** The widest overrun or the smallest font size across devices. */
  overflowLeft: boolean;
  devices: LayoutProblemDevice[];
}

const KIND_ORDER: Record<LayoutProblemKind, number> = { overflow: 0, "tap-target": 1, "small-text": 2 };

export function layoutProblemKey(problem: Pick<LayoutProblem, "kind" | "selector">): string {
  return `${problem.kind}\u0000${problem.selector}`;
}

/**
 * Merges every device's report into one numbered list: overflow first, widest
 * overrun first, then tap targets and small text in page order.
 */
export function groupLayoutProblems(reports: DeviceLayoutReport[]): LayoutProblemGroup[] {
  const groups = new Map<string, LayoutProblemGroup & { y: number }>();
  for (const { slotId, deviceName, report } of reports) {
    for (const problem of report.problems) {
      const key = layoutProblemKey(problem);
      let group = groups.get(key);
      if (!group) {
        group = {
          key, number: 0, kind: problem.kind, selector: problem.selector, tagName: problem.tagName,
          width: problem.width, height: problem.height, overflowLeft: false, devices: [], y: problem.y,
        };
        groups.set(key, group);
      }
      if ((problem.overflowLeft ?? 0) > (problem.overflowRight ?? 0)) group.overflowLeft = true;
      const overflow = Math.max(problem.overflowRight ?? 0, problem.overflowLeft ?? 0);
      group.devices.push({
        slotId, deviceName, problemId: problem.id, width: problem.width, height: problem.height,
        overflow: problem.kind === "overflow" ? overflow : undefined,
        fontSize: problem.fontSize,
      });
    }
  }
  const widest = (group: LayoutProblemGroup) => Math.max(0, ...group.devices.map(device => device.overflow ?? 0));
  const sorted = [...groups.values()].sort((a, b) =>
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    || (a.kind === "overflow" ? widest(b) - widest(a) : a.y - b.y)
    || a.selector.localeCompare(b.selector));
  return sorted.map(({ y: _y, ...group }, index) => ({ ...group, number: index + 1 }));
}

export function formatOverflow(amount: number): string {
  return `+${Math.round(amount)} px`;
}
