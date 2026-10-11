/**
 * Capture the visible tab exactly as the user sees it — extension overlay included.
 * Used for the "Capture & Annotate" action so the annotator gets the full simulator view.
 */
export interface TabCaptureResult {
  dataUrl?: string;
  error?: string;
}

export async function captureTabWithOverlay(tabId?: number | null): Promise<TabCaptureResult> {
  // Let React dismiss capture menus, then let the browser paint the clean view.
  await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  const requestId = crypto.randomUUID();

  // The simulator normally runs in an extension iframe over the source page.
  // Route capture through that page's content script so the background worker
  // receives an authoritative sender.tab instead of guessing the active tab.
  if (window.parent !== window) {
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", onResult);
        resolve({ error: "Screenshot request timed out." });
      }, 10_000);
      const onResult = (event: MessageEvent) => {
        if (
          event.source !== window.parent ||
          event.data?.type !== "MDV_CAPTURE_TAB_RESULT" ||
          event.data.requestId !== requestId
        ) return;
        window.clearTimeout(timeout);
        window.removeEventListener("message", onResult);
        resolve({
          dataUrl: typeof event.data.dataUrl === "string" ? event.data.dataUrl : undefined,
          error: typeof event.data.error === "string" ? event.data.error : undefined,
        });
      };
      window.addEventListener("message", onResult);
      window.parent.postMessage({ type: "MDV_CAPTURE_TAB_REQUEST", requestId, tabId }, "*");
    });
  }

  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return { error: "Screenshot capture is unavailable." };
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "CAPTURE_TAB_WITH_OVERLAY",
        tabId: typeof tabId === "number" ? tabId : undefined,
      },
      (response: TabCaptureResult | undefined) => {
        const error = chrome.runtime.lastError?.message ?? response?.error;
        resolve({ dataUrl: response?.dataUrl, error });
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
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    const result = await chrome.runtime.sendMessage({ type: "MDV_DOWNLOAD", dataUrl, filename });
    if (!result?.ok) throw new Error(result?.error ?? "Download failed.");
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
  return `responsive-tester-${safeLabel || "capture"}-${date}.png`;
}
