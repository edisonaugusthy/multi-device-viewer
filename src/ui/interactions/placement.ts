export interface Placement { x: number; y: number; width: number; height: number }
export type PlacementAdjustment = "move" | "width" | "height" | "both";
interface PlacementBounds {
  x: readonly [number, number];
  y: readonly [number, number];
  size: readonly [number, number];
}

const clamp = (value: number, [min, max]: readonly [number, number]) => Math.max(min, Math.min(max, value));

/** Deltas and placements are percentages of the containing surface. */
export function adjustPlacement(initial: Placement, kind: PlacementAdjustment, deltaX: number, deltaY: number, bounds: PlacementBounds): Placement {
  if (kind === "move") return {
    ...initial,
    x: clamp(initial.x + deltaX, bounds.x),
    y: clamp(initial.y + deltaY, bounds.y),
  };
  return {
    ...initial,
    width: kind === "width" || kind === "both" ? clamp(initial.width + deltaX, bounds.size) : initial.width,
    height: kind === "height" || kind === "both" ? clamp(initial.height + deltaY, bounds.size) : initial.height,
  };
}
