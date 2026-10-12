/**
 * Where a design image sits over a device screen. Every value is in CSS
 * pixels of the screen, measured from its top-left corner, so a frame keeps
 * its meaning when the device is zoomed, dragged, or shown in another window.
 */
export interface DesignFrame { x: number; y: number; width: number; height: number }
export interface DesignSize { width: number; height: number }
export type DesignFit = "width" | "screen" | "stretch";
/** Compass points: corners resize, edges stretch one axis. */
export type DesignHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export const DESIGN_HANDLES: readonly DesignHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
export const MIN_DESIGN_SIZE = 8;
/** How much of the design must stay over the screen on each axis. */
export const MIN_DESIGN_VISIBLE = 16;

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** The first value within reach, so edges and centres line up without care. */
export function snapTo(value: number, targets: readonly number[], threshold: number): number {
  if (threshold <= 0) return value;
  let best = value;
  let distance = threshold;
  for (const target of targets) {
    const gap = Math.abs(target - value);
    if (gap <= distance) { best = target; distance = gap; }
  }
  return best;
}

/**
 * The starting places for a design. "width" matches the screen width from
 * the top (a full-screen export lands exactly; a partial one covers its part),
 * "screen" shows the whole design inside the screen, "stretch" fills it.
 */
export function fitDesign(image: DesignSize, screen: DesignSize, fit: DesignFit): DesignFrame {
  const usable = image.width > 0 && image.height > 0;
  if (fit === "stretch" || !usable) return { x: 0, y: 0, width: screen.width, height: screen.height };
  if (fit === "width") return { x: 0, y: 0, width: screen.width, height: round(screen.width * image.height / image.width) };
  const scale = Math.min(screen.width / image.width, screen.height / image.height);
  const width = round(image.width * scale);
  const height = round(image.height * scale);
  return { x: round((screen.width - width) / 2), y: round((screen.height - height) / 2), width, height };
}

export function isDefaultFit(frame: DesignFrame, image: DesignSize, screen: DesignSize): boolean {
  const fitted = fitDesign(image, screen, "width");
  return (["x", "y", "width", "height"] as const).every(key => Math.abs(frame[key] - fitted[key]) < 0.5);
}

/** Keep the design reachable: part of it always stays over the screen. */
export function placeDesign(frame: DesignFrame, position: Partial<Pick<DesignFrame, "x" | "y">>, screen: DesignSize): DesignFrame {
  const x = position.x ?? frame.x;
  const y = position.y ?? frame.y;
  return {
    ...frame,
    x: round(clamp(x, MIN_DESIGN_VISIBLE - frame.width, screen.width - MIN_DESIGN_VISIBLE)),
    y: round(clamp(y, MIN_DESIGN_VISIBLE - frame.height, screen.height - MIN_DESIGN_VISIBLE)),
  };
}

/** Move by a delta; within `snap` pixels the design lines up with the screen edges or centre. */
export function moveDesign(frame: DesignFrame, deltaX: number, deltaY: number, screen: DesignSize, snap = 0): DesignFrame {
  const x = snapTo(frame.x + deltaX, [0, (screen.width - frame.width) / 2, screen.width - frame.width], snap);
  const y = snapTo(frame.y + deltaY, [0, (screen.height - frame.height) / 2, screen.height - frame.height], snap);
  return placeDesign(frame, { x, y }, screen);
}

/** Set a size directly; with `keepRatio` the other side follows. */
export function sizeDesign(frame: DesignFrame, size: Partial<DesignSize>, keepRatio: boolean): DesignFrame {
  const ratio = frame.width > 0 ? frame.height / frame.width : 1;
  let width = Math.max(MIN_DESIGN_SIZE, size.width ?? frame.width);
  let height = Math.max(MIN_DESIGN_SIZE, size.height ?? frame.height);
  if (keepRatio && size.width !== undefined && size.height === undefined) height = Math.max(MIN_DESIGN_SIZE, width * ratio);
  else if (keepRatio && size.height !== undefined && size.width === undefined) width = Math.max(MIN_DESIGN_SIZE, ratio > 0 ? height / ratio : width);
  return { ...frame, width: round(width), height: round(height) };
}

/**
 * Drag one handle by a delta. The opposite side stays put. Corners keep the
 * proportions unless `free`; edges always stretch their own axis. Within
 * `snap` pixels a dragged side lines up with the matching screen edge.
 */
export function resizeDesign(
  frame: DesignFrame, handle: DesignHandle, deltaX: number, deltaY: number,
  options: { screen: DesignSize; free?: boolean; snap?: number },
): DesignFrame {
  const snap = options.snap ?? 0;
  let left = frame.x;
  let top = frame.y;
  let right = frame.x + frame.width;
  let bottom = frame.y + frame.height;
  const horizontal = handle.includes("e") ? "e" : handle.includes("w") ? "w" : undefined;
  const vertical = handle.includes("n") ? "n" : handle.includes("s") ? "s" : undefined;

  if (horizontal === "e") right = Math.max(left + MIN_DESIGN_SIZE, snapTo(right + deltaX, [options.screen.width], snap));
  if (horizontal === "w") left = Math.min(right - MIN_DESIGN_SIZE, snapTo(left + deltaX, [0], snap));
  if (vertical === "s") bottom = Math.max(top + MIN_DESIGN_SIZE, snapTo(bottom + deltaY, [options.screen.height], snap));
  if (vertical === "n") top = Math.min(bottom - MIN_DESIGN_SIZE, snapTo(top + deltaY, [0], snap));

  let width = right - left;
  let height = bottom - top;
  if (horizontal && vertical && !options.free && frame.width > 0 && frame.height > 0) {
    const ratio = frame.height / frame.width;
    const widthChange = Math.abs(width - frame.width) / frame.width;
    const heightChange = Math.abs(height - frame.height) / frame.height;
    if (widthChange >= heightChange) height = Math.max(MIN_DESIGN_SIZE, width * ratio);
    else width = Math.max(MIN_DESIGN_SIZE, height / ratio);
    if (horizontal === "w") left = right - width; else right = left + width;
    if (vertical === "n") top = bottom - height; else bottom = top + height;
  }
  return { x: round(left), y: round(top), width: round(right - left), height: round(bottom - top) };
}

const NUDGE_KEYS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

/** Arrow keys move by one pixel, ten with Shift; anything else returns undefined. */
export function nudgeDesign(frame: DesignFrame, key: string, shift: boolean, screen: DesignSize): DesignFrame | undefined {
  const step = NUDGE_KEYS[key];
  if (!step) return undefined;
  const distance = shift ? 10 : 1;
  return placeDesign(frame, { x: frame.x + step[0] * distance, y: frame.y + step[1] * distance }, screen);
}
