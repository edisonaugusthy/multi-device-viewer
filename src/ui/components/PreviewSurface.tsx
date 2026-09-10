import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Seal the raster edge of independently composited sticky/fixed page layers. */
export function PreviewSurface({ children, guardEdges, scale, topColor, bottomColor }: {
  children: ReactNode;
  guardEdges: boolean;
  scale: number;
  topColor?: string;
  bottomColor?: string;
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
  }, [guardEdges, scale, topColor, bottomColor]);

  return <div ref={surfaceRef} data-preview-surface
    className={`relative h-full w-full ${guardEdges ? "overflow-visible" : "overflow-hidden"}`}>
    {children}
    {guardEdges && <>
      {topColor && <div aria-hidden data-preview-edge="top" className="pointer-events-none absolute inset-x-0 z-10"
        style={{ top: "calc(0px - var(--preview-top-inset, 0px))", height: "calc(var(--preview-top-inset, 0px) * 2)", backgroundColor: topColor }} />}
      {bottomColor && <div aria-hidden data-preview-edge="bottom" className="pointer-events-none absolute inset-x-0 z-10"
        style={{ bottom: "calc(0px - var(--preview-bottom-inset, 0px))", height: "calc(var(--preview-bottom-inset, 0px) * 2)", backgroundColor: bottomColor }} />}
    </>}
  </div>;
}
