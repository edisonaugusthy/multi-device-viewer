export interface RgbaColor { r: number; g: number; b: number; a: number }
export interface SideSurfaceBand { offset: number; color: string; isDark: boolean }
const WHITE: RgbaColor = { r: 255, g: 255, b: 255, a: 1 };
const colors = new Map<string, RgbaColor>();
let context: CanvasRenderingContext2D | null | undefined;

/** Let the browser parse hex, rgb(), OKLCH and color() in the same sRGB space. */
export function resolveCssColor(value: string | null | undefined): RgbaColor | undefined {
  if (!value || !CSS.supports("color", value)) return undefined;
  const cached = colors.get(value);
  if (cached) return cached;
  if (context === undefined) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" });
  }
  if (!context) return undefined;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "transparent";
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
  const result = { r, g, b, a: alpha / 255 };
  if (colors.size >= 128) colors.clear();
  colors.set(value, result);
  return result;
}

export function compositeColors(front: RgbaColor, back: RgbaColor): RgbaColor {
  const a = front.a + back.a * (1 - front.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const channel = (key: "r" | "g" | "b") => (front[key] * front.a + back[key] * back.a * (1 - front.a)) / a;
  return { r: channel("r"), g: channel("g"), b: channel("b"), a };
}

export function prefersLightIcons(color: RgbaColor): boolean {
  const opaque = compositeColors(color, WHITE);
  const linear = (channel: number) => {
    const v = channel / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = linear(opaque.r) * 0.2126 + linear(opaque.g) * 0.7152 + linear(opaque.b) * 0.0722;
  return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05;
}

function renderedBackground(start: Element | null) {
  let color: RgbaColor = { r: 0, g: 0, b: 0, a: 0 };
  let painted = false;
  for (let element = start; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    const background = resolveCssColor(style.backgroundColor);
    if (background?.a) { color = compositeColors(color, background); painted = true; }
    // CSS opacity applies to the composed subtree, including its descendants.
    color = { ...color, a: color.a * Number(style.opacity) };
  }
  return { color: compositeColors(color, WHITE), painted };
}

function sampleEdge(bottom: boolean) {
  const y = bottom ? Math.max(0, innerHeight - 1) : 1;
  const points = [0.12, 0.5, 0.88].map(ratio => {
    const element = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, innerWidth * ratio)), y);
    return { ...renderedBackground(element), pinned: pinnedEdgeBackground(element, y) };
  });
  return { color: { r: points.reduce((n, p) => n + p.color.r, 0) / 3,
    g: points.reduce((n, p) => n + p.color.g, 0) / 3,
    b: points.reduce((n, p) => n + p.color.b, 0) / 3, a: 1 }, painted: points.some(p => p.painted),
    pinned: points.every(p => p.pinned && JSON.stringify(p.pinned) === JSON.stringify(points[0].pinned))
      ? points[0].pinned : undefined };
}

/** Extend a full-width, nearly opaque pinned surface, never a scrolling post. */
function pinnedEdgeBackground(start: Element | null, y: number): RgbaColor | undefined {
  for (let element = start; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.position !== "sticky" && style.position !== "fixed") continue;
    const rect = element.getBoundingClientRect();
    if (rect.top > y || rect.bottom <= y || rect.left > 1 || rect.right < innerWidth - 1) continue;
    const background = resolveCssColor(style.backgroundColor);
    // Common glass headers (for example bg-slate-950/95 + backdrop-blur)
    // have the same independently rounded sticky-layer edge as opaque ones.
    // Requiring alpha === 1 leaves that edge exposed on the newer iPhones.
    // Composite against the page before sealing it, as we do for browser tint;
    // keep genuinely transparent overlays unguarded.
    if (background && background.a >= 0.9 && Number(style.opacity) === 1) return renderedBackground(element).color;
  }
  return undefined;
}

function themeColor() {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (meta.media && !matchMedia(meta.media).matches) continue;
    const color = resolveCssColor(meta.content);
    if (color && color.a > 0) return compositeColors(color, WHITE);
  }
  return undefined;
}

const toCss = (color: RgbaColor) => `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;

/** Background colors beside the Duo gutter, with section boundaries refined to a pixel. */
function sampleRightEdge(): SideSurfaceBand[] {
  const height = Math.max(1, innerHeight);
  const sample = (y: number) => renderedBackground(document.elementFromPoint(Math.max(0, innerWidth - 1), Math.min(height - 1, y))).color;
  let previousY = 0;
  let previous = sample(0);
  const bands: SideSurfaceBand[] = [{ offset: 0, color: toCss(previous), isDark: prefersLightIcons(previous) }];
  // Bound DOM reads even on unusually tall custom viewports.
  const step = Math.max(16, Math.ceil(height / 64));
  for (let y = Math.min(step, height - 1); y > previousY; y = Math.min(y + step, height - 1)) {
    const current = sample(y);
    if (toCss(current) !== toCss(previous)) {
      let low = previousY, high = y;
      while (high - low > 0.5) {
        const middle = (low + high) / 2;
        if (toCss(sample(middle)) === toCss(previous)) low = middle;
        else high = middle;
      }
      bands.push({ offset: Math.round(high) / height, color: toCss(current), isDark: prefersLightIcons(current) });
    }
    previous = current;
    previousY = y;
  }
  return bands;
}

export function samplePageSurfaces(includeRightEdge = false) {
  const top = sampleEdge(false), bottom = sampleEdge(true);
  // Sample what is actually at the edge. A header elsewhere in the document
  // must not continue tinting the browser after it has scrolled out of view.
  const topColor = top.painted ? top.color : themeColor() ?? top.color;
  const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "";
  return {
    topColor: toCss(topColor), bottomColor: toCss(bottom.color),
    topGuardColor: top.pinned ? toCss(top.pinned) : undefined,
    bottomGuardColor: bottom.pinned ? toCss(bottom.pinned) : undefined,
    topIsDark: prefersLightIcons(topColor), bottomIsDark: prefersLightIcons(bottom.color),
    rightBands: includeRightEdge ? sampleRightEdge() : undefined,
    viewportFit: /viewport-fit\s*=\s*cover/i.test(viewportMeta) ? "cover" as const : "auto" as const,
  };
}
