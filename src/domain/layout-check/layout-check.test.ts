import { describe, expect, it } from "vitest";
import { findOverflowOffenders, findSmallTapTargets, groupLayoutProblems, type DeviceLayoutReport, type OverflowCandidate } from "./layout-check";
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

describe("findSmallTapTargets", () => {
  const box = (left: number, top: number, width: number, height: number) => ({ left, top, width, height });

  it("accepts a wide button that is a little under 24 px tall", () => {
    expect(findSmallTapTargets([box(20, 300, 157, 20), box(20, 400, 120, 48)], 24)).toEqual([]);
  });

  it("flags small controls that crowd each other", () => {
    // Carousel dots: 8 px wide, 8 px apart, so their 24 px squares overlap.
    expect(findSmallTapTargets([box(100, 500, 8, 8), box(116, 500, 8, 8), box(132, 500, 8, 8)], 24)).toEqual([0, 1, 2]);
  });

  it("accepts an undersized control with clear space around it", () => {
    expect(findSmallTapTargets([box(300, 20, 16, 16), box(20, 20, 120, 40)], 24)).toEqual([]);
  });

  it("flags an undersized control whose square touches a neighbouring control", () => {
    // A 20 px icon right beside a 40 px button: the square reaches into the button.
    expect(findSmallTapTargets([box(20, 20, 120, 40), box(141, 30, 20, 20)], 24)).toEqual([1]);
  });
});

const problem = (partial: Partial<LayoutProblem> & Pick<LayoutProblem, "kind" | "selector">): LayoutProblem => ({
  id: `${partial.kind}:${partial.selector}`, tagName: "div", x: 20, y: 300, width: 454, height: 240, ...partial,
});

const report = (slotId: string, deviceName: string, problems: LayoutProblem[]): DeviceLayoutReport => ({
  slotId, deviceName, viewportWidth: 390, viewportHeight: 844,
  report: { url: "http://localhost:5173/", viewportWidth: 390, viewportHeight: 844, problems, truncated: false },
});

describe("groupLayoutProblems", () => {
  it("lists each culprit once with the devices it fails on, widest overflow first", () => {
    const groups = groupLayoutProblems([
      report("a", "iPhone 15", [
        problem({ kind: "tap-target", selector: "button.nav__menu", y: 38, width: 28, height: 28 }),
        problem({ kind: "overflow", selector: ".hero__image", overflowRight: 84 }),
        problem({ kind: "overflow", selector: "table.pricing", y: 674, width: 602, height: 172, overflowRight: 232 }),
      ]),
      report("b", "Pixel 8", [
        problem({ kind: "overflow", selector: ".hero__image", overflowRight: 62 }),
        problem({ kind: "tap-target", selector: "button.nav__menu", y: 38, width: 28, height: 28 }),
      ]),
      report("c", "iPad Air", []),
    ]);

    expect(groups.map(group => [group.number, group.kind, group.selector])).toEqual([
      [1, "overflow", "table.pricing"],
      [2, "overflow", ".hero__image"],
      [3, "tap-target", "button.nav__menu"],
    ]);
    expect(groups[1].devices.map(device => [device.deviceName, device.overflow])).toEqual([["iPhone 15", 84], ["Pixel 8", 62]]);
    expect(groups[2].devices.map(device => device.slotId)).toEqual(["a", "b"]);
    expect(groups[2].devices[0].overflow).toBeUndefined();
  });

  it("orders tap targets and small text by their position on the page", () => {
    const groups = groupLayoutProblems([
      report("a", "iPhone 15", [
        problem({ kind: "small-text", selector: "footer small", y: 900, fontSize: 10 }),
        problem({ kind: "tap-target", selector: "a.skip", y: 10, width: 20, height: 20 }),
        problem({ kind: "tap-target", selector: "button.close", y: 5, width: 20, height: 20 }),
      ]),
    ]);
    expect(groups.map(group => group.selector)).toEqual(["button.close", "a.skip", "footer small"]);
    expect(groups[2].devices[0].fontSize).toBe(10);
  });
});
