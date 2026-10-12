import type { CSSProperties } from "react";

export interface ProductTourStep {
  title: string;
  text: string;
  target?: string;
}

export interface HighlightRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type TargetRect = HighlightRect;

export const FIRST_RUN_TOUR_STEPS: ProductTourStep[] = [
  { title: "Add device", text: "Add up to four devices to compare side by side.", target: '[data-tour="add-viewport"]' },
  { title: "All devices", text: "Preview your page on every device in one click.", target: "[data-all-devices-toggle]" },
  { title: "Focus mode", text: "Hide all controls for clean reviews. Press Esc to exit.", target: "[data-view-only-toggle]" },
  { title: "Move and change devices", text: "Drag the grip to move a device, or use the arrows to switch it.", target: '[data-tour="device-controls"]' },
  { title: "Sync between devices", text: "Scroll or open a page once, and every device follows.", target: '[data-tour="sync"]' },
  { title: "Fix prompt", text: "Describe a bug and copy a prompt for your AI coding tool.", target: '[data-tour="fix-prompt"]' },
  { title: "Check layout", text: "Find what crosses the viewport edge or is too small to tap.", target: '[data-tour="layout-check"]' },
  { title: "Screenshot and annotate", text: "Capture your devices and mark them up.", target: '[data-tour="screenshot"]' },
  { title: "Record", text: "Record a video, or a user flow to replay on every device.", target: '[data-tour="record"]' },
];

const CARD_WIDTH = 320;
const CARD_HEIGHT = 170;
const EDGE_GAP = 12;
const TARGET_GAP = 16;
const HIGHLIGHT_EDGE_GAP = 3;
const HIGHLIGHT_PADDING = 6;

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
