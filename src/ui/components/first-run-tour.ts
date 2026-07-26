import type { CSSProperties } from "react";
import { PRODUCT_NAME } from "../../app/product";

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
    eyebrow: "Welcome",
    title: "Test every screen without leaving your page",
    text: `${PRODUCT_NAME} opens the current tab in several real device viewports, so responsive problems are easier to find and explain.`,
    hint: "This quick tour takes about one minute.",
  },
  {
    eyebrow: "Workspace",
    title: "Choose the screens that matter",
    text: "Add a preset phone, tablet, laptop, or your own custom viewport. Save combinations you use for repeated checks.",
    target: '[data-tour="device-setup"]',
    hint: "Start with Add viewport, then choose a device in its card.",
  },
  {
    eyebrow: "Clear canvas",
    title: "Hide setup when you need more room",
    text: "Collapse Workspace setup after choosing your devices to give every preview more horizontal space.",
    target: '[data-tour="sidebar-collapse"]',
    hint: "Use Open workspace setup whenever you need the sidebar again.",
  },
  {
    eyebrow: "Viewport",
    title: "Use each preview like the real page",
    text: "Change device, rotate, zoom, reload, focus one viewport, or resize the split between screens.",
    target: '[data-tour="preview-controls"]',
    hint: "The controls above each preview apply only to that viewport.",
  },
  {
    eyebrow: "Synchronization",
    title: "Check the same journey everywhere",
    text: "Scroll sync keeps matching pages aligned. Navigation sync follows links across viewports, so one action can reveal layout differences.",
    target: '[data-tour="sync-controls"]',
    hint: "Active sync controls turn green.",
  },
  {
    eyebrow: "Focus",
    title: "Inspect one viewport without distractions",
    text: "Focus active viewport temporarily shows only the selected preview, giving detailed layout and interaction checks the full canvas.",
    target: '[data-tour="focus-active"]',
    hint: "Choose Show all viewports in the same place to return to the comparison.",
  },
  {
    eyebrow: "Design review",
    title: "Compare the live page with its design",
    text: "Open Compare page to design to place an approved reference beside a viewport or overlay it directly on the live page.",
    target: '[data-tour="compare-design"]',
    hint: "Adjust the reference size, position, and opacity to spot visual differences.",
  },
  {
    eyebrow: "Handoff",
    title: "Turn a problem into a clear handoff",
    text: "Compare against a design, capture and annotate evidence, record the source tab, open it on a phone, or copy an AI-ready fix prompt.",
    target: '[data-tour="session-tools"]',
    hint: "You can replay this tour from Take a feature tour.",
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
