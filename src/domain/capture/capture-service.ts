/**
 * Capture the visible tab exactly as the user sees it — extension overlay included.
 * Used for the "Capture & Annotate" action so the annotator gets the full simulator view.
 */
export async function captureTabWithOverlay(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_TAB_WITH_OVERLAY" }, (response: { dataUrl?: string; error?: string } | undefined) => {
      if (chrome.runtime.lastError || !response?.dataUrl) resolve(null);
      else resolve(response.dataUrl);
    });
  });
}

export interface ViewportCaptureRequest {
  width: number;
  height: number;
  contentHeight?: number;
  deviceScaleFactor?: number;
  mobile?: boolean;
  scrollToTop?: boolean;
  tabId?: number | null;
}

export interface LivePreviewCaptureResult {
  dataUrl: string | null;
  activeUrl?: string;
  activeTabId?: number;
  error?: string;
}

export async function captureTabForViewport(
  request: ViewportCaptureRequest,
): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "CAPTURE_TAB_FOR_VIEWPORT", ...request },
      (response: { dataUrl?: string; error?: string } | undefined) => {
        if (chrome.runtime.lastError || !response?.dataUrl) resolve(null);
        else resolve(response.dataUrl);
      },
    );
  });
}

export async function captureLivePreview(
  request: ViewportCaptureRequest,
): Promise<LivePreviewCaptureResult> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return { dataUrl: null, error: "runtime unavailable" };
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "CAPTURE_LIVE_TAB_PREVIEW", ...request },
      (response: LivePreviewCaptureResult | undefined) => {
        if (chrome.runtime.lastError || !response) {
          resolve({
            dataUrl: null,
            error: chrome.runtime.lastError?.message ?? "capture failed",
          });
          return;
        }
        resolve(response);
      },
    );
  });
}

export async function startTabRecording(tabId?: number | null): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return false;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "START_RECORDING", tabId }, (response: { ok?: boolean } | undefined) => {
      resolve(Boolean(response?.ok) && !chrome.runtime.lastError);
    });
  });
}

export async function stopTabRecording(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return false;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "STOP_RECORDING" }, (response: { ok?: boolean } | undefined) => {
      resolve(Boolean(response?.ok) && !chrome.runtime.lastError);
    });
  });
}

/** Download a data URL as a file via chrome.downloads or an <a> click fallback. */
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

/** Generate a timestamped filename for a screenshot. */
export function screenshotFilename(label: string): string {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `multi-device-viewer-${safeLabel || "capture"}-${date}.png`;
}
