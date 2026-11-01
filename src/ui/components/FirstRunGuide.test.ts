import { describe, expect, it } from "vitest";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  positionCard,
  tourStepsSince,
} from "./first-run-tour";

describe("first-run feature tour", () => {
  it("walks the top bar from left to right, then a device", () => {
    expect(FIRST_RUN_TOUR_STEPS.map((step) => step.target)).toEqual([
      '[data-tour="views"]',
      '[data-tour="sync"]',
      '[data-tour="screenshot"]',
      '[data-tour="design"]',
      '[data-tour="issues"]',
      "[data-view-only-toggle]",
      '[data-tour="add-viewport"]',
      '[data-tour="device-controls"]',
      '[data-tour="device-controls"] [data-device-menu-toggle]',
    ]);
    expect(FIRST_RUN_TOUR_STEPS.map((step) => step.title)).toEqual([
      "Workspace, One and All",
      "Sync between devices",
      "Capture",
      "Compare with design",
      "Issues",
      "Focus mode",
      "Add device",
      "Move and change devices",
      "Before & after",
    ]);
    // One step for each control, so no two steps point at the same one.
    expect(new Set(FIRST_RUN_TOUR_STEPS.map((step) => step.target)).size).toBe(FIRST_RUN_TOUR_STEPS.length);
    expect(FIRST_RUN_TOUR_STEPS.every((step) => step.text.length <= 70)).toBe(true);
  });

  it("shows an updated user only the steps added since their last tour", () => {
    // Saw the 0.4.0 tour: the bar's new steps and moving devices are new.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.4.0").map(step => step.title)).toEqual(["Workspace, One and All", "Capture", "Compare with design", "Issues", "Move and change devices"]);
    // Saw the 0.3.0 tour: Before & after is new too.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.3.0").map(step => step.title)).toEqual(["Workspace, One and All", "Capture", "Compare with design", "Issues", "Move and change devices", "Before & after"]);
    // Never saw a tour, or a fresh install: every step.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, null)).toHaveLength(FIRST_RUN_TOUR_STEPS.length);
    // Nothing newer than the tour already seen falls back to the whole tour, for a manual replay.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.5.0")).toHaveLength(FIRST_RUN_TOUR_STEPS.length);
  });

  it("puts the card below a button in the top bar, so the bar stays visible", () => {
    // A 46 px tall highlight around a bar button at the top of a 1280 × 800 window.
    expect(positionCard({ left: 600, top: 15, width: 46, height: 46 }, 1280, 800)).toEqual({ left: 463, top: 77 });
    // Near the right edge, the card stays on screen.
    expect(positionCard({ left: 1200, top: 15, width: 60, height: 46 }, 1280, 800)).toEqual({ left: 948, top: 77 });
  });

  it("centers the welcome card", () => {
    expect(positionCard(null, 1000, 700)).toEqual({
      left: 340,
      top: 265,
    });
  });

  it("places a targeted card beside the highlighted control when it fits", () => {
    expect(
      positionCard(
        { left: 20, top: 120, width: 240, height: 180 },
        1200,
        800,
      ),
    ).toEqual({ left: 276, top: 125 });
  });

  it("keeps the card on-screen on narrow displays", () => {
    const position = positionCard(
      { left: 12, top: 120, width: 336, height: 100 },
      360,
      640,
    );
    expect(position.left).toBe(20);
    expect(position.top).toBe(236);
  });

  it("fully encloses controls that sit against a viewport edge", () => {
    expect(
      highlightRectForTarget(
        { left: 884, top: 5, width: 180, height: 28 },
        1280,
        720,
      ),
    ).toEqual({
      left: 878,
      top: 3,
      width: 192,
      height: 36,
    });
  });

  it("clips only the off-screen part of an oversized target", () => {
    expect(
      highlightRectForTarget(
        { left: -20, top: -10, width: 400, height: 700 },
        360,
        640,
      ),
    ).toEqual({
      left: 3,
      top: 3,
      width: 354,
      height: 634,
    });
  });
});
