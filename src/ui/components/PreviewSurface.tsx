import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Seal the raster edge of independently composited sticky/fixed page layers. */
export function PreviewSurface({ children, guardEdges, scale, topColor, bottomColor }: {
  children: ReactNode;
  guardEdges: boolean;
  scale: number;
  topColor: string;
  bottomColor: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !guardEdges) return;
    const update = () => {
      const rect = surface.getBoundingClientRect();
      if (!rect.height || !surface.clientHeight) return;
      // Sticky layers round their raster bounds independently of the iframe.
      // Paint through whole display-pixel boundaries, plus three guard rows.
      // The extra row covers Firefox's downscaled offscreen-surface rounding.
      // Clipping the iframe instead moves Chromium's sticky-layer raster seam
      // to the new clip boundary. These pointer-transparent surface strips are
      // painted across the boundary, so their own antialiasing stays outside
      // the join, without changing iframe layout or scroll position.
      const dpr = window.devicePixelRatio;
      const pixelsPerCssPixel = rect.height * dpr / surface.clientHeight;
      const top = (Math.ceil(rect.top * dpr) + 3 - rect.top * dpr) / pixelsPerCssPixel;
      const bottom = (rect.bottom * dpr - Math.floor(rect.bottom * dpr) + 3) / pixelsPerCssPixel;
      surface.style.setProperty("--preview-top-inset", `${top}px`);
      surface.style.setProperty("--preview-bottom-inset", `${bottom}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [guardEdges, scale]);

  // Composite the iframe and its edge strips together before the hardware mask.
  // Firefox otherwise antialiases them separately and lets a faint content row
  // show through their shared clipped edge. Opacity stays fully opaque.
  return <div ref={surfaceRef} data-preview-surface
    className={`relative h-full w-full ${guardEdges ? "overflow-visible" : "overflow-hidden"}`}
    style={guardEdges ? { filter: "opacity(1)" } : undefined}>
    {children}
    {guardEdges && <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10"
        style={{ top: "calc(0px - var(--preview-top-inset, 0px))", height: "calc(var(--preview-top-inset, 0px) * 2)", backgroundColor: topColor }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10"
        style={{ bottom: "calc(0px - var(--preview-bottom-inset, 0px))", height: "calc(var(--preview-bottom-inset, 0px) * 2)", backgroundColor: bottomColor }} />
    </>}
  </div>;
}
