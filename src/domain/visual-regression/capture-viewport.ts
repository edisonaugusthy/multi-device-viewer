import { VisualRegressionError, type CaptureFrame } from "./visual-regression.types";

/**
 * Where the webpage viewport sits on screen, in CSS pixels. The extension
 * background captures and crops the tab itself, so the page does no image work.
 */
export function measureViewport(frame: HTMLIFrameElement): CaptureFrame {
  if (!frame.isConnected || frame.getAttribute("src") === "about:blank") throw new VisualRegressionError("capture");
  const rect = frame.getBoundingClientRect();
  // Compare only the webpage. Device artwork and hover controls are excluded.
  // A clipped viewport is not a valid baseline for the complete device.
  if (rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.top < 0 || rect.right > innerWidth || rect.bottom > innerHeight) throw new VisualRegressionError("clipped");
  for (let parent = frame.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const clip = parent.getBoundingClientRect();
    if ((style.overflowX !== "visible" && (rect.left < clip.left - 1 || rect.right > clip.right + 1))
      || (style.overflowY !== "visible" && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1))) throw new VisualRegressionError("clipped");
  }
  return {
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    viewport: { width: innerWidth, height: innerHeight },
  };
}
