import type { CSSProperties } from "react";

export interface ProductTourStep {
  title: string;
  text: string;
  target?: string;
  /** The tour revision that introduced this step; the first tour's steps have none. */
  since?: string;
}

export interface HighlightRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type TargetRect = HighlightRect;

// The top bar from left to right, then a device: one step for each control,
// saying everything it holds.
export const FIRST_RUN_TOUR_STEPS: ProductTourStep[] = [
  { title: "Workspace, One and All", text: "See your devices together, one at a time, or every device at once.", target: '[data-tour="views"]', since: "0.5.0" },
  { title: "Sync between devices", text: "Scroll or open a page once, and every device follows.", target: '[data-tour="sync"]' },
  { title: "Capture", text: "Screenshots, video, recorded flows and tracked changes, all here.", target: '[data-tour="screenshot"]', since: "0.5.0" },
  { title: "Compare with design", text: "Check a device against a design image, side by side or overlaid.", target: '[data-tour="design"]', since: "0.5.0" },
  { title: "Issues", text: "Errors, sideways scrolling and a fix prompt for your AI coding tool.", target: '[data-tour="issues"]', since: "0.5.0" },
  { title: "Focus mode", text: "Hide all controls for clean reviews. Press Esc to exit.", target: "[data-view-only-toggle]" },
  { title: "Add device", text: "Add up to four devices to compare side by side.", target: '[data-tour="add-viewport"]' },
  { title: "Move and change devices", text: "Drag a device anywhere, resize it from its corner, or switch it.", target: '[data-tour="device-controls"]', since: "0.5.0" },
  { title: "Before & after", text: "Save a “before” picture in the device menu, then see what changed.", target: '[data-tour="device-controls"] [data-device-menu-toggle]', since: "0.4.0" },
];

const versionParts = (version: string) => version.split(".").map(part => Number.parseInt(part, 10) || 0);
function newerThan(version: string, than: string) {
  const [a, b] = [versionParts(version), versionParts(than)];
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) > (b[index] ?? 0);
  }
  return false;
}

/**
 * The steps someone who last saw the tour at `seenTour` has not seen yet, so an
 * update shows only what is new. Without a seen tour, every step.
 */
export function tourStepsSince<T extends Pick<ProductTourStep, "since">>(steps: T[], seenTour: string | null): T[] {
  if (!seenTour) return steps;
  const added = steps.filter(step => step.since && newerThan(step.since, seenTour));
  return added.length ? added : steps;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 170;
const EDGE_GAP = 12;
const TARGET_GAP = 16;
const HIGHLIGHT_EDGE_GAP = 3;
const HIGHLIGHT_PADDING = 6;
const SHORT_TARGET = 64;

export function highlightRectForTarget(
  target: TargetRect,
  viewportWidth: number,
  viewportHeight: number,
): HighlightRect {
  const maxLeft = viewportWidth - HIGHLIGHT_EDGE_GAP;
  const maxTop = viewportHeight - HIGHLIGHT_EDGE_GAP;
  const left = Math.min(
    maxLeft,
    Math.max(HIGHLIGHT_EDGE_GAP, target.left - HIGHLIGHT_PADDING),
  );
  const top = Math.min(
    maxTop,
    Math.max(HIGHLIGHT_EDGE_GAP, target.top - HIGHLIGHT_PADDING),
  );
  const right = Math.min(
    maxLeft,
    Math.max(HIGHLIGHT_EDGE_GAP, target.left + target.width + HIGHLIGHT_PADDING),
  );
  const bottom = Math.min(
    maxTop,
    Math.max(HIGHLIGHT_EDGE_GAP, target.top + target.height + HIGHLIGHT_PADDING),
  );

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function positionCard(
  highlight: HighlightRect | null,
  viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth,
  viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight,
): CSSProperties {
  const width = Math.min(CARD_WIDTH, viewportWidth - EDGE_GAP * 2);
  const height = Math.min(CARD_HEIGHT, viewportHeight - EDGE_GAP * 2);
  if (!highlight) {
    return {
      left: Math.max(EDGE_GAP, (viewportWidth - width) / 2),
      top: Math.max(EDGE_GAP, (viewportHeight - height) / 2),
    };
  }

  // A short control, such as a button in the top bar, gets the card just
  // below it, centred, so the card never covers the rest of the bar.
  if (highlight.height <= SHORT_TARGET && highlight.top + highlight.height + TARGET_GAP + height <= viewportHeight - EDGE_GAP) {
    return {
      left: Math.max(EDGE_GAP, Math.min(viewportWidth - width - EDGE_GAP, highlight.left + highlight.width / 2 - width / 2)),
      top: highlight.top + highlight.height + TARGET_GAP,
    };
  }

  const fitsRight =
    highlight.left + highlight.width + TARGET_GAP + width <=
    viewportWidth - EDGE_GAP;
  const fitsLeft = highlight.left - TARGET_GAP - width >= EDGE_GAP;
  const left = fitsRight
    ? highlight.left + highlight.width + TARGET_GAP
    : fitsLeft
      ? highlight.left - TARGET_GAP - width
      : Math.max(
          EDGE_GAP,
          Math.min(
            viewportWidth - width - EDGE_GAP,
            highlight.left + highlight.width / 2 - width / 2,
          ),
        );
  const preferredTop =
    !fitsRight && !fitsLeft
      ? highlight.top + highlight.height + TARGET_GAP
      : highlight.top + highlight.height / 2 - height / 2;
  const top =
    preferredTop + height <= viewportHeight - EDGE_GAP
      ? Math.max(EDGE_GAP, preferredTop)
      : Math.max(EDGE_GAP, highlight.top - height - TARGET_GAP);

  return { left, top };
}
