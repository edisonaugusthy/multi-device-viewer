import { describe, expect, it } from "vitest";
import {
  FIRST_RUN_TOUR_STEPS,
  highlightRectForTarget,
  positionCard,
} from "./first-run-tour";

describe("first-run feature tour", () => {
  it("introduces the complete responsive-testing workflow", () => {
    expect(FIRST_RUN_TOUR_STEPS).toHaveLength(8);
    expect(FIRST_RUN_TOUR_STEPS.map((step) => step.target)).toEqual([
      undefined,
      '[data-tour="device-setup"]',
      '[data-tour="sidebar-collapse"]',
      '[data-tour="preview-controls"]',
      '[data-tour="sync-controls"]',
      '[data-tour="focus-active"]',
      '[data-tour="compare-design"]',
      '[data-tour="session-tools"]',
    ]);
    expect(FIRST_RUN_TOUR_STEPS.at(-1)?.text).toContain("AI-ready fix prompt");
    expect(FIRST_RUN_TOUR_STEPS[2]?.text).toContain("Collapse Workspace setup");
    expect(FIRST_RUN_TOUR_STEPS[5]?.text).toContain("only the selected preview");
    expect(FIRST_RUN_TOUR_STEPS[6]?.title).toContain("Compare");
  });

  it("centers the welcome card", () => {
    expect(positionCard(null, 1000, 700)).toEqual({
      left: 320,
      top: 185,
    });
  });

  it("places a targeted card beside the highlighted control when it fits", () => {
    expect(
      positionCard(
        { left: 20, top: 120, width: 240, height: 180 },
        1200,
        800,
      ),
    ).toEqual({ left: 276, top: 45 });
  });

  it("keeps the card on-screen on narrow displays", () => {
    const position = positionCard(
      { left: 12, top: 120, width: 336, height: 100 },
      360,
      640,
    );
    expect(position.left).toBe(12);
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
