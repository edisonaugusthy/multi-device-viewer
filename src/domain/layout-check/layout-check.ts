import type { LayoutCheckReport, LayoutProblem } from "./layout-check.types";

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
  overflow: number;
}

/** One culprit, listed once with every device it fails on. */
export interface LayoutProblemGroup {
  key: string;
  number: number;
  selector: string;
  tagName: string;
  width: number;
  height: number;
  /** It crosses the left edge on at least one device. */
  overflowLeft: boolean;
  devices: LayoutProblemDevice[];
}

export function layoutProblemKey(problem: Pick<LayoutProblem, "selector">): string {
  return problem.selector;
}

/** Merges every device's report into one numbered list, widest overrun first. */
export function groupLayoutProblems(reports: DeviceLayoutReport[]): LayoutProblemGroup[] {
  const groups = new Map<string, LayoutProblemGroup>();
  for (const { slotId, deviceName, report } of reports) {
    for (const problem of report.problems) {
      const key = layoutProblemKey(problem);
      let group = groups.get(key);
      if (!group) {
        group = {
          key, number: 0, selector: problem.selector, tagName: problem.tagName,
          width: problem.width, height: problem.height, overflowLeft: false, devices: [],
        };
        groups.set(key, group);
      }
      if ((problem.overflowLeft ?? 0) > (problem.overflowRight ?? 0)) group.overflowLeft = true;
      group.devices.push({
        slotId, deviceName, problemId: problem.id, width: problem.width, height: problem.height,
        overflow: Math.max(problem.overflowRight ?? 0, problem.overflowLeft ?? 0),
      });
    }
  }
  const widest = (group: LayoutProblemGroup) => Math.max(0, ...group.devices.map(device => device.overflow));
  return [...groups.values()]
    .sort((a, b) => widest(b) - widest(a) || a.selector.localeCompare(b.selector))
    .map((group, index) => ({ ...group, number: index + 1 }));
}

export function formatOverflow(amount: number): string {
  return `+${Math.round(amount)} px`;
}
