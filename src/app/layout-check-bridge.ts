// Runs inside a preview frame: finds what makes the page scroll sideways and
// draws the marks over the page in page pixels, so they scroll with it.
import { findOverflowOffenders, type OverflowCandidate } from "../domain/layout-check/layout-check";
import { MAX_PROBLEMS, type LayoutCheckReport, type LayoutMark, type LayoutProblem } from "../domain/layout-check/layout-check.types";

const MARKS_ID = "mdv-layout-marks";
const COLOR = "239, 68, 68";

const round = (value: number) => Math.round(value * 10) / 10;

function isOurs(element: Element) {
  return element.closest(`#${MARKS_ID}`) !== null;
}

/** Measures the current document. Selectors come from the bridge so they match its other messages. */
export function measureLayout(buildSelector: (element: Element) => string): LayoutCheckReport {
  const root = document.documentElement;
  const viewportWidth = root.clientWidth || window.innerWidth;
  const viewportHeight = root.clientHeight || window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const problems: LayoutProblem[] = [];
  const ids = new Set<string>();
  let truncated = false;
  const body = document.body;
  if (!body) return { url: location.href, viewportWidth, viewportHeight, problems, truncated };

  // Every element in document order, so parents precede children.
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
  // A page that clips the viewport itself cannot scroll sideways.
  const rootClips = getComputedStyle(root).overflowX !== "visible" || getComputedStyle(body).overflowX !== "visible";
  if (!rootClips) {
    const offenders = findOverflowOffenders(candidates, viewportWidth, MAX_PROBLEMS + 1);
    if (offenders.length > MAX_PROBLEMS) { truncated = true; offenders.length = MAX_PROBLEMS; }
    for (const i of offenders) {
      const { left, right } = candidates[i];
      const element = elements[i];
      const selector = buildSelector(element);
      let id = selector;
      for (let n = 2; ids.has(id); n++) id = `${selector}#${n}`;
      ids.add(id);
      problems.push({
        id, selector, tagName: element.tagName.toLowerCase(),
        x: round(left), y: round(rects[i].top + scrollY), width: round(right - left), height: round(rects[i].height),
        overflowRight: right > viewportWidth + 1 ? round(right - viewportWidth) : undefined,
        overflowLeft: left < -1 ? round(-left) : undefined,
      });
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
  const strip = document.createElement("div");
  strip.style.cssText = `position:fixed;top:0;right:0;bottom:0;width:6px;background:repeating-linear-gradient(135deg,rgba(${COLOR},.6) 0 4px,rgba(${COLOR},.12) 4px 8px);`;
  container.appendChild(strip);
  for (const mark of marks) {
    const box = document.createElement("div");
    box.dataset.layoutMark = mark.id;
    box.style.cssText = `position:absolute;left:${mark.x}px;top:${mark.y}px;width:${mark.width}px;height:${mark.height}px;box-sizing:border-box;border-radius:3px;`
      + `outline:${mark.selected ? 3 : 2}px solid rgb(${COLOR});outline-offset:-1px;background:rgba(${COLOR},.08);`
      + (mark.selected ? `box-shadow:0 0 0 5px rgba(${COLOR},.3);` : "");
    const badge = document.createElement("span");
    badge.textContent = String(mark.number);
    badge.style.cssText = `position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:rgb(${COLOR});color:#fff;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 ui-monospace,Menlo,Consolas,monospace;`;
    box.appendChild(badge);
    const overflow = Math.max(mark.overflowRight ?? 0, mark.overflowLeft ?? 0);
    if (overflow > 0) {
      const pill = document.createElement("span");
      pill.textContent = `+${Math.round(overflow)} px`;
      // Hugs the viewport edge the element crosses, level with the element's middle.
      const atRight = (mark.overflowRight ?? 0) >= (mark.overflowLeft ?? 0);
      pill.style.cssText = `position:absolute;top:${mark.y + mark.height / 2}px;${atRight ? `left:${viewportWidth}px;transform:translate(-100%,-50%);border-radius:12px 0 0 12px;padding:0 8px 0 10px;` : "left:0;transform:translateY(-50%);border-radius:0 12px 12px 0;padding:0 10px 0 8px;"}`
        + `height:24px;display:flex;align-items:center;background:rgb(${COLOR});color:#fff;font:700 11px/1 ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;`;
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
