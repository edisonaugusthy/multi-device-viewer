import { describe, expect, it } from "vitest";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  positionCard,
  tourStepsSince,
} from "./first-run-tour";

describe("first-run feature tour", () => {
  it("walks through the ten main features in order", () => {
    expect(FIRST_RUN_TOUR_STEPS.map((step) => step.target)).toEqual([
      '[data-tour="add-viewport"]',
      "[data-all-devices-toggle]",
      "[data-view-only-toggle]",
      '[data-tour="device-controls"]',
      '[data-tour="sync"]',
      '[data-tour="fix-prompt"]',
      '[data-tour="layout-check"]',
      '[data-tour="device-controls"] [data-device-menu-toggle]',
      '[data-tour="screenshot"]',
      '[data-tour="screenshot"]',
    ]);
    expect(FIRST_RUN_TOUR_STEPS.map((step) => step.title)).toEqual([
      "Add device",
      "All devices",
      "Focus mode",
      "Move and change devices",
      "Sync between devices",
      "Fix prompt",
      "Check layout",
      "Before & after",
      "Screenshot and annotate",
      "Record",
    ]);
    expect(FIRST_RUN_TOUR_STEPS.every((step) => step.text.length <= 70)).toBe(true);
  });

  it("shows an updated user only the steps added since their last tour", () => {
    // Saw the 0.3.0 tour: only Check layout and Before & after are new.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.3.0").map(step => step.title)).toEqual(["Check layout", "Before & after"]);
    // Never saw a tour, or a fresh install: every step.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, null)).toHaveLength(FIRST_RUN_TOUR_STEPS.length);
    // Nothing newer than the tour already seen falls back to the whole tour, for a manual replay.
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.4.0")).toHaveLength(FIRST_RUN_TOUR_STEPS.length);
    expect(tourStepsSince(FIRST_RUN_TOUR_STEPS, "0.3.10").map(step => step.title)).toEqual(["Check layout", "Before & after"]);
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
