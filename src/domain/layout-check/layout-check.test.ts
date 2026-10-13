import { describe, expect, it } from "vitest";
import { findOverflowOffenders, groupLayoutProblems, type DeviceLayoutReport, type OverflowCandidate } from "./layout-check";
import type { LayoutProblem } from "./layout-check.types";

const box = (parent: number, left: number, right: number, extra: Partial<OverflowCandidate> = {}): OverflowCandidate =>
  ({ parent, left, right, clips: false, ignore: false, ...extra });

describe("findOverflowOffenders", () => {
  it("reports the outermost element that crosses the right edge, not its children", () => {
    const candidates = [
      box(-1, 0, 390),          // body
      box(0, 20, 474),          // hero image, 84 px past a 390 px viewport
      box(1, 20, 474),          // its inner picture
      box(0, 20, 370),          // a paragraph that fits
    ];
    expect(findOverflowOffenders(candidates, 390)).toEqual([1]);
  });

  it("ignores subtrees that an ancestor clips sideways", () => {
    const candidates = [
      box(-1, 0, 390),
      box(0, 0, 390, { clips: true }), // a carousel with overflow-x: auto
      box(1, 0, 1200),                 // its wide track
      box(0, 20, 620),                 // a table outside the carousel
    ];
    expect(findOverflowOffenders(candidates, 390)).toEqual([3]);
  });

  it("skips hidden and fixed elements and elements crossing the left edge count too", () => {
    const candidates = [
      box(-1, 0, 390),
      box(0, -40, 350),                       // pulled left by a negative margin
      box(0, 0, 900, { ignore: true }),       // position: fixed banner
      box(0, 0, 500, { ignore: true }),       // display: none
    ];
    expect(findOverflowOffenders(candidates, 390)).toEqual([1]);
  });

  it("tolerates sub-pixel rounding and honours the limit", () => {
    const candidates = [box(-1, 0, 390.6), box(0, 0, 395), box(0, 0, 396), box(0, 0, 397)];
    expect(findOverflowOffenders(candidates, 390, 2)).toEqual([1, 2]);
  });
});

const problem = (partial: Partial<LayoutProblem> & Pick<LayoutProblem, "selector">): LayoutProblem => ({
  id: partial.selector, tagName: "div", x: 20, y: 300, width: 454, height: 240, ...partial,
});

const report = (slotId: string, deviceName: string, problems: LayoutProblem[]): DeviceLayoutReport => ({
  slotId, deviceName, viewportWidth: 390, viewportHeight: 844,
  report: { url: "http://localhost:5173/", viewportWidth: 390, viewportHeight: 844, problems, truncated: false },
});

describe("groupLayoutProblems", () => {
  it("lists each culprit once with the devices it fails on, widest overrun first", () => {
    const groups = groupLayoutProblems([
      report("a", "iPhone 15", [
        problem({ selector: ".hero__image", overflowRight: 84 }),
        problem({ selector: "table.pricing", y: 674, width: 602, height: 172, overflowRight: 232 }),
      ]),
      report("b", "Pixel 8", [
        problem({ selector: ".hero__image", overflowRight: 62 }),
        problem({ selector: ".promo", overflowLeft: 30 }),
      ]),
      report("c", "iPad Air", []),
    ]);

    expect(groups.map(group => [group.number, group.selector])).toEqual([
      [1, "table.pricing"],
      [2, ".hero__image"],
      [3, ".promo"],
    ]);
    expect(groups[1].devices.map(device => [device.deviceName, device.overflow])).toEqual([["iPhone 15", 84], ["Pixel 8", 62]]);
    expect(groups[0].devices.map(device => device.slotId)).toEqual(["a"]);
    expect(groups[2].overflowLeft).toBe(true);
    expect(groups[1].overflowLeft).toBe(false);
  });
});
