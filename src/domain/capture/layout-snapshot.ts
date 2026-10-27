/**
 * The page's layout at a moment: each visible element's box and the few
 * styles people notice, keyed by a path that stays the same across reloads.
 * Two snapshots describe what changed in CSS terms ("Font size 44 → 36 px",
 * "Moved up 40 px · by .hero-art") next to the pixel comparison.
 */
export interface LayoutElement {
  key: string;
  /** A short selector people recognize: "h1.hero-title", "#nav", "section.recent". */
  label: string;
  x: number; y: number; width: number; height: number;
  fontSize: string; fontWeight: string; color: string; background: string; radius: string;
  /** A leaf element's own text, shortened. */
  text?: string;
}
export type LayoutSnapshot = LayoutElement[];

const MAX_ELEMENTS = 1500;
const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "HEAD", "TITLE", "NOSCRIPT", "TEMPLATE", "BR", "WBR", "svg", "path", "g"]);

function label(element: Element): string {
  if (element.id && /^[A-Za-z][\w-]{0,40}$/.test(element.id)) return `#${element.id}`;
  const classes = [...element.classList].filter(name => /^[A-Za-z][\w-]{0,40}$/.test(name)).slice(0, 2);
  return `${element.tagName.toLowerCase()}${classes.map(name => `.${name}`).join("")}`;
}

/** Runs inside the page (the preview bridge): reads boxes and computed styles only. */
export function snapshotLayout(doc: Document): LayoutSnapshot {
  const out: LayoutSnapshot = [];
  const scrollX = doc.defaultView?.scrollX ?? 0, scrollY = doc.defaultView?.scrollY ?? 0;
  const walk = (element: Element, path: string) => {
    if (out.length >= MAX_ELEMENTS || SKIP.has(element.tagName)) return;
    const box = element.getBoundingClientRect();
    const style = doc.defaultView!.getComputedStyle(element);
    const visible = box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    if (visible && element !== doc.documentElement && element !== doc.body) {
      const leaf = element.children.length === 0 ? element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) : undefined;
      out.push({
        key: path, label: label(element),
        x: Math.round(box.left + scrollX), y: Math.round(box.top + scrollY), width: Math.round(box.width), height: Math.round(box.height),
        fontSize: style.fontSize, fontWeight: style.fontWeight, color: style.color, background: style.backgroundColor, radius: style.borderRadius,
        ...(leaf ? { text: leaf } : {}),
      });
    }
    if (style.display === "none") return;
    const counts = new Map<string, number>();
    for (const child of element.children) {
      const tag = child.tagName.toLowerCase();
      const n = (counts.get(tag) ?? 0) + 1;
      counts.set(tag, n);
      walk(child, `${path}>${child.id && /^[A-Za-z][\w-]{0,40}$/.test(child.id) ? `#${child.id}` : `${tag}:${n}`}`);
    }
  };
  if (doc.documentElement) walk(doc.documentElement, "html");
  return out;
}

export interface LayoutChange { label: string; what: string; y: number }

const MAX_CHANGES = 10;
const MOVE = 4;
const rgb = (color: string) => {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(color);
  if (!match) return color;
  if (match[4] === "0") return "transparent";
  return `#${[match[1], match[2], match[3]].map(part => Number(part).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};
const px = (value: string) => value.replace(/(\d+(?:\.\d+)?)px/g, (_, n: string) => `${Math.round(Number(n) * 10) / 10}`);

/** What changed between two snapshots, outermost changes first and in page order. */
export function describeChanges(before: LayoutSnapshot, after: LayoutSnapshot): LayoutChange[] {
  const old = new Map(before.map(element => [element.key, element]));
  const changes: Array<LayoutChange & { key: string; dy: number; dx: number; resizedBy: number }> = [];
  for (const now of after) {
    const was = old.get(now.key);
    if (!was || was.label !== now.label) continue;
    const parts: string[] = [];
    if (was.fontSize !== now.fontSize) parts.push(`Font size ${px(was.fontSize)} → ${px(now.fontSize)} px`);
    if (was.fontWeight !== now.fontWeight) parts.push(`Weight ${was.fontWeight} → ${now.fontWeight}`);
    if (was.radius !== now.radius) parts.push(`Corners ${px(was.radius)} → ${px(now.radius)} px`);
    if (was.background !== now.background) parts.push(`Background ${rgb(was.background)} → ${rgb(now.background)}`);
    if (was.color !== now.color) parts.push(`Color ${rgb(was.color)} → ${rgb(now.color)}`);
    if (Math.abs(was.width - now.width) >= 2) parts.push(`Width ${was.width} → ${now.width} px`);
    if (Math.abs(was.height - now.height) >= 2) parts.push(`Height ${was.height} → ${now.height} px`);
    if (was.text !== undefined && now.text !== undefined && was.text !== now.text) parts.push(`“${was.text}” → “${now.text}”`);
    const dy = now.y - was.y, dx = now.x - was.x;
    if (parts.length) changes.push({ key: now.key, label: now.label, what: parts.join(" · "), y: now.y, dy: 0, dx: 0, resizedBy: now.height - was.height });
    else if (Math.abs(dy) >= MOVE || Math.abs(dx) >= MOVE) changes.push({ key: now.key, label: now.label, what: "", y: now.y, dy, dx, resizedBy: 0 });
  }
  // A move shared with the element around it is that element's move; a style
  // change inside a changed element is still its own.
  const kept = changes.filter(change => change.what || !changes.some(other =>
    other !== change && !other.what && change.key.startsWith(`${other.key}>`) && other.dy === change.dy && other.dx === change.dx));
  const resized = kept.filter(change => change.resizedBy !== 0);
  for (const change of kept) {
    if (change.what) continue;
    const direction = change.dy < 0 ? `Moved up ${-change.dy} px` : change.dy > 0 ? `Moved down ${change.dy} px` : change.dx < 0 ? `Moved left ${-change.dx} px` : `Moved right ${change.dx} px`;
    // Pushed by an element above it that grew or shrank by the same amount.
    const cause = change.dy ? resized.find(other => other.y < change.y && Math.abs(other.resizedBy - change.dy) <= 1 && !change.key.startsWith(`${other.key}>`)) : undefined;
    change.what = cause ? `${direction} · by ${cause.label}` : direction;
  }
  return kept.sort((a, b) => a.y - b.y).slice(0, MAX_CHANGES).map(({ label, what, y }) => ({ label, what, y }));
}
