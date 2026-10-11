const r2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The SVG path of a screen that is one rounded rectangle, written exactly as
 * the frame generator writes it, so the page clip matches the
 * opening drawn in the frame image.
 */
export function roundedScreenPath(width: number, height: number, radius: number): string {
  const r = r2(Math.max(0, Math.min(radius, width / 2, height / 2)));
  const arc = (x: number, y: number) => (r ? `A${r} ${r} 0 0 1 ${r2(x)} ${r2(y)}` : "");
  return `M${r} 0H${r2(width - r)}${arc(width, r)}V${r2(height - r)}${arc(width - r, height)}H${r}${arc(0, height - r)}V${r}${arc(r, 0)}Z`;
}
