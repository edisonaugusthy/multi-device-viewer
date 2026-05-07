import { toPng } from "html-to-image";

export async function captureNodeToPng(node: HTMLElement): Promise<string> {
  return toPng(node, {
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: "#f5f7fb"
  });
}

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.downloads) {
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: true });
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export function screenshotFilename(label: string): string {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `multi-device-viewer-${safeLabel || "capture"}-${date}.png`;
}
