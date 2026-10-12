// Runs inside a preview frame: measures the page for the Layout check and
// draws its marks over the page in page pixels, so they scroll with it.
import { findOverflowOffenders, type OverflowCandidate } from "../domain/layout-check/layout-check";
import {
  MAX_PROBLEMS_PER_KIND, SMALL_TEXT_MIN, TAP_TARGET_MIN,
  type LayoutCheckOptions, type LayoutCheckReport, type LayoutMark, type LayoutProblem, type LayoutProblemKind,
} from "../domain/layout-check/layout-check.types";

const MARKS_ID = "mdv-layout-marks";
const COLORS: Record<LayoutProblemKind, string> = { overflow: "239, 68, 68", "tap-target": "180, 83, 9", "small-text": "37, 99, 235" };
const TAP_TARGET_SELECTOR = [
  'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="tab"]', '[role="menuitem"]', '[role="option"]',
].join(",");

const round = (value: number) => Math.round(value * 10) / 10;

function isOurs(element: Element) {
  return element.closest(`#${MARKS_ID}`) !== null;
}

function hasOwnText(element: Element) {
  return Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "");
}

/** Measures the current document. Selectors come from the bridge so they match its other messages. */
export function measureLayout(options: LayoutCheckOptions, buildSelector: (element: Element) => string): LayoutCheckReport {
  const root = document.documentElement;
  const viewportWidth = root.clientWidth || window.innerWidth;
  const viewportHeight = root.clientHeight || window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const problems: LayoutProblem[] = [];
  const ids = new Set<string>();
  let truncated = false;
  const add = (kind: LayoutProblemKind, element: Element, rect: DOMRect, extra: Partial<LayoutProblem> = {}) => {
    const selector = buildSelector(element);
    let id = `${kind}:${selector}`;
    for (let n = 2; ids.has(id); n++) id = `${kind}:${selector}#${n}`;
    ids.add(id);
    problems.push({
      id, kind, selector, tagName: element.tagName.toLowerCase(),
      x: round(rect.left + scrollX), y: round(rect.top + scrollY), width: round(rect.width), height: round(rect.height),
      ...extra,
    });
  };
  const body = document.body;
  if (!body) return { url: location.href, viewportWidth, viewportHeight, problems, truncated };

  // Overflow: every element in document order, so parents precede children.
  const elements = Array.from(body.querySelectorAll("*")).filter(element => !isOurs(element));
  const index = new Map<Element, number>();
  const rects: DOMRect[] = [];
  const candidates: OverflowCandidate[] = elements.map((element, i) => {
    index.set(element, i);
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    rects[i] = rect;
    const hidden = style.display === "none" || style.visibility === "hidden" || (rect.width === 0 && rect.height === 0);
    const left = rect.left + scrollX;
    let right = rect.right + scrollX;
    // Unbroken text runs past its box without widening it; the box's scroll width shows it.
    if (!hidden && element.childElementCount === 0 && style.overflowX === "visible" && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) {
      right = Math.max(right, left + element.scrollWidth);
    }
    return {
      parent: element.parentElement ? index.get(element.parentElement) ?? -1 : -1,
      left, right,
      clips: style.overflowX !== "visible",
      ignore: hidden || style.position === "fixed",
    };
  });
  const bodyStyle = getComputedStyle(body);
  const rootClips = getComputedStyle(root).overflowX !== "visible" || bodyStyle.overflowX !== "visible";
  if (!rootClips) {
    const offenders = findOverflowOffenders(candidates, viewportWidth, MAX_PROBLEMS_PER_KIND + 1);
    if (offenders.length > MAX_PROBLEMS_PER_KIND) { truncated = true; offenders.length = MAX_PROBLEMS_PER_KIND; }
    for (const i of offenders) {
      const { left, right } = candidates[i];
      add("overflow", elements[i], rects[i], {
        width: round(right - left),
        overflowRight: right > viewportWidth + 1 ? round(right - viewportWidth) : undefined,
        overflowLeft: left < -1 ? round(-left) : undefined,
      });
    }
  }

  if (options.tapTargets) {
    let count = 0;
    for (const element of body.querySelectorAll<HTMLElement>(TAP_TARGET_SELECTOR)) {
      if (isOurs(element)) continue;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) continue;
      if ((element as HTMLButtonElement).disabled || element.getAttribute("aria-hidden") === "true") continue;
      // Links inside running text are exempt; the line gives them room.
      if (style.display === "inline" && element.parentElement && hasOwnText(element.parentElement)) continue;
      // A checkbox or radio inside a big enough label is tapped through the label.
      const label = element.closest("label");
      if (label && label !== element) {
        const labelRect = label.getBoundingClientRect();
        if (labelRect.width >= TAP_TARGET_MIN && labelRect.height >= TAP_TARGET_MIN) continue;
      }
      if (rect.width >= TAP_TARGET_MIN - 0.5 && rect.height >= TAP_TARGET_MIN - 0.5) continue;
      if (count >= MAX_PROBLEMS_PER_KIND) { truncated = true; break; }
      count++;
      add("tap-target", element, rect);
    }
  }

  if (options.smallText) {
    let count = 0;
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if ((node.textContent ?? "").trim().length < 2) continue;
      const element = node.parentElement;
      if (!element || seen.has(element) || isOurs(element) || element.closest("script, style, noscript, template")) continue;
      seen.add(element);
      const style = getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);
      if (!(fontSize < SMALL_TEXT_MIN) || style.visibility === "hidden" || style.display === "none") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (count >= MAX_PROBLEMS_PER_KIND) { truncated = true; break; }
      count++;
      add("small-text", element, rect, { fontSize: round(fontSize) });
    }
  }

  return { url: location.href, viewportWidth, viewportHeight, problems, truncated };
}

/** Draws the marks, replacing any shown before. An empty list removes them. */
export function renderLayoutMarks(marks: LayoutMark[], viewportWidth: number) {
  clearLayoutMarks();
  if (marks.length === 0) return;
  const container = document.createElement("div");
  container.id = MARKS_ID;
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = "position:absolute!important;left:0!important;top:0!important;width:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important;z-index:2147483646!important;pointer-events:none!important;font:600 10.5px/1 ui-monospace,Menlo,Consolas,monospace!important;color-scheme:light!important;";
  if (marks.some(mark => mark.kind === "overflow")) {
    const strip = document.createElement("div");
    strip.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:6px;background:repeating-linear-gradient(135deg,rgba(239,68,68,.6) 0 4px,rgba(239,68,68,.12) 4px 8px);";
    container.appendChild(strip);
  }
  for (const mark of marks) {
    const color = COLORS[mark.kind] ?? COLORS.overflow;
    const box = document.createElement("div");
    box.dataset.layoutMark = mark.id;
    box.style.cssText = `position:absolute;left:${mark.x}px;top:${mark.y}px;width:${mark.width}px;height:${mark.height}px;box-sizing:border-box;border-radius:3px;`
      + `outline:${mark.selected ? 3 : 2}px solid rgb(${color});outline-offset:-1px;background:rgba(${color},.08);`
      + (mark.selected ? `box-shadow:0 0 0 5px rgba(${color},.3);` : "");
    const badge = document.createElement("span");
    badge.textContent = String(mark.number);
    badge.style.cssText = `position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:rgb(${color});color:#fff;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 ui-monospace,Menlo,Consolas,monospace;`;
    box.appendChild(badge);
    const overflow = Math.max(mark.overflowRight ?? 0, mark.overflowLeft ?? 0);
    if (mark.kind === "overflow" && overflow > 0) {
      const pill = document.createElement("span");
      pill.textContent = `+${Math.round(overflow)} px`;
      // Hugs the viewport edge the element crosses, level with the element's middle.
      const atRight = (mark.overflowRight ?? 0) >= (mark.overflowLeft ?? 0);
      pill.style.cssText = `position:absolute;top:${mark.y + mark.height / 2}px;${atRight ? `left:${viewportWidth}px;transform:translate(-100%,-50%);border-radius:12px 0 0 12px;padding:0 8px 0 10px;` : "left:0;transform:translateY(-50%);border-radius:0 12px 12px 0;padding:0 10px 0 8px;"}`
        + `height:24px;display:flex;align-items:center;background:rgb(${color});color:#fff;font:700 11px/1 ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;`;
      container.appendChild(pill);
    }
    if (mark.selected && mark.label) {
      const label = document.createElement("span");
      label.textContent = mark.label;
      const above = mark.y > 40;
      label.style.cssText = `position:absolute;left:0;${above ? "bottom:calc(100% + 8px)" : "top:calc(100% + 8px)"};max-width:min(70vw,420px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:6px 9px;border-radius:7px;background:#14171a;color:#fff;font:500 11.5px/1.3 ui-sans-serif,system-ui,sans-serif;box-shadow:0 8px 24px rgba(20,23,26,.25);`;
      box.appendChild(label);
    }
    container.appendChild(box);
  }
  document.documentElement.appendChild(container);
}

export function clearLayoutMarks() {
  document.getElementById(MARKS_ID)?.remove();
}

/** Scrolls the page so the mark sits in the middle of the viewport. */
export function scrollToLayoutMark(id: string) {
  const box = document.querySelector<HTMLElement>(`#${MARKS_ID} [data-layout-mark="${CSS.escape(id)}"]`);
  if (!box) return;
  const top = parseFloat(box.style.top) || 0;
  const height = parseFloat(box.style.height) || 0;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  window.scrollTo({ left: 0, top: Math.max(0, top + height / 2 - viewportHeight / 2), behavior: "smooth" });
}
