export type LayoutProblemKind = "overflow" | "tap-target" | "small-text";

/** One element that fails a check, measured inside the preview in CSS pixels of the page. */
export interface LayoutProblem {
  /** Stable within one report: the kind and the element's selector. */
  id: string;
  kind: LayoutProblemKind;
  selector: string;
  tagName: string;
  /** The element box in document coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Overflow: how far the box crosses the viewport's right or left edge. */
  overflowRight?: number;
  overflowLeft?: number;
  /** Small text: the computed font size. */
  fontSize?: number;
}

export interface LayoutCheckOptions {
  tapTargets: boolean;
  smallText: boolean;
}

export interface LayoutCheckReport {
  url: string;
  viewportWidth: number;
  viewportHeight: number;
  problems: LayoutProblem[];
  /** Some problems were left out because a check hit its limit. */
  truncated: boolean;
}

/** A mark the preview draws over the page, numbered like the panel's list. */
export interface LayoutMark {
  id: string;
  number: number;
  kind: LayoutProblemKind;
  x: number;
  y: number;
  width: number;
  height: number;
  overflowRight?: number;
  overflowLeft?: number;
  /** Shown beside the selected mark. */
  label?: string;
  selected?: boolean;
}

/** Apple's and Material's recommended minimum, in CSS pixels. */
export const TAP_TARGET_MIN = 44;
export const SMALL_TEXT_MIN = 12;
/** Per check and page; a page with hundreds of offenders needs one fix, not a long list. */
export const MAX_PROBLEMS_PER_KIND = 20;
