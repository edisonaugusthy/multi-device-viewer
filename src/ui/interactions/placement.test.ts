import { describe, expect, it } from "vitest";
import { adjustPlacement } from "./placement";

describe("design placement adjustments", () => {
  const initial = { x: 10, y: 20, width: 80, height: 60 };
  const reference = { x: [-75, 95], y: [-55, 95], size: [5, 600] } as const;
  const overlay = { x: [-1000, 1000], y: [-1000, 1000], size: [1, 1000] } as const;

  it("keeps a reference reachable at every edge without changing its size", () => {
    expect(adjustPlacement(initial, "move", -500, 500, reference)).toEqual({ x: -75, y: 95, width: 80, height: 60 });
    expect(adjustPlacement(initial, "move", 500, -500, reference)).toEqual({ x: 95, y: -55, width: 80, height: 60 });
  });

  it("preserves the wider movement and resize range of the preview overlay", () => {
    expect(adjustPlacement(initial, "move", -2000, 2000, overlay)).toEqual({ x: -1000, y: 1000, width: 80, height: 60 });
    expect(adjustPlacement(initial, "both", -2000, 2000, overlay)).toEqual({ x: 10, y: 20, width: 1, height: 1000 });
    expect(adjustPlacement(initial, "both", -2000, 2000, reference)).toEqual({ x: 10, y: 20, width: 5, height: 600 });
  });

  it("stretches just the chosen axis and leaves the original placement intact", () => {
    expect(adjustPlacement(initial, "width", 25, 45, reference)).toEqual({ ...initial, width: 105 });
    expect(adjustPlacement(initial, "height", 25, 45, reference)).toEqual({ ...initial, height: 105 });
    expect(initial).toEqual({ x: 10, y: 20, width: 80, height: 60 });
  });
});
