/** One element that crosses the viewport's edge, measured inside the preview in CSS pixels of the page. */
export interface LayoutProblem {
  /** Stable within one report: the element's selector, made unique. */
  id: string;
  selector: string;
  tagName: string;
  /** The element box in document coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** How far the box crosses the viewport's right or left edge. */
  overflowRight?: number;
  overflowLeft?: number;
}

export interface LayoutCheckReport {
  url: string;
  viewportWidth: number;
  viewportHeight: number;
  problems: LayoutProblem[];
  /** Some problems were left out because the check hit its limit. */
  truncated: boolean;
}

/** A mark the preview draws over the page, numbered like the panel's list. */
export interface LayoutMark {
  id: string;
  number: number;
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

/** Per page; a page with hundreds of offenders needs one fix, not a long list. */
export const MAX_PROBLEMS = 20;
