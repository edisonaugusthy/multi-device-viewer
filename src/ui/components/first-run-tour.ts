import type { CSSProperties } from "react";

export interface ProductTourStep {
  eyebrow: string;
  title: string;
  text: string;
  target?: string;
  hint?: string;
}

export interface HighlightRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export type TargetRect = HighlightRect;

export const FIRST_RUN_TOUR_STEPS: ProductTourStep[] = [
  {
    eyebrow: "Devices",
    title: "Add viewport",
    text: "Add a phone, tablet, laptop, display, or your own custom viewport.",
    target: '[data-tour="add-viewport"]',
    hint: "Start with Add viewport, then choose the screen you need.",
  },
  {
    eyebrow: "Workspace",
    title: "Hide the toolbar to make space",
    text: "Collapse Workspace setup after adding your viewports to give every preview more room.",
    target: '[data-tour="sidebar-collapse"]',
    hint: "Open Workspace setup whenever you need the controls again.",
  },
  {
    eyebrow: "Devices",
    title: "Change the device",
    text: "Open the device selector in a viewport to switch to another screen size.",
    target: '[data-tour="change-device"]',
  },
  {
    eyebrow: "User flow",
    title: "Record user flow",
    text: "Record a journey once so you can rerun the same interactions across your viewports.",
    target: '[data-tour="record-user-flow"]',
  },
];

const CARD_WIDTH = 360;
const CARD_HEIGHT = 330;
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
