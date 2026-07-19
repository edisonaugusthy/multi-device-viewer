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

export async function startTabRecording(tabId?: number | null): Promise<boolean> {
  if (import.meta.env.FIREFOX) return startLocalDisplayRecording();
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return false;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "START_RECORDING", tabId }, (response: { ok?: boolean } | undefined) => {
      resolve(Boolean(response?.ok) && !chrome.runtime.lastError);
    });
  });
}

export async function stopTabRecording(): Promise<boolean> {
  if (import.meta.env.FIREFOX) {
    if (!localRecorder || localRecorder.state === "inactive") return false;
    localRecorder.stop();
    return true;
  }
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return false;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "STOP_RECORDING" }, (response: { ok?: boolean } | undefined) => {
      resolve(Boolean(response?.ok) && !chrome.runtime.lastError);
    });
  });
}

async function startLocalDisplayRecording(): Promise<boolean> {
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") return false;
  if (localRecorder && localRecorder.state !== "inactive") return true;

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const preferredType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
    localRecordingStream = stream;
    localRecordingChunks = [];
    localRecorder = recorder;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) localRecordingChunks.push(event.data);
    });
    recorder.addEventListener("stop", finishLocalDisplayRecording, { once: true });
    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      if (recorder.state !== "inactive") recorder.stop();
    }, { once: true });
    recorder.start(1000);
    return true;
  } catch {
    localRecordingStream?.getTracks().forEach((track) => track.stop());
    localRecordingStream = null;
    localRecorder = null;
    localRecordingChunks = [];
    return false;
  }
}

function finishLocalDisplayRecording() {
  const mimeType = localRecorder?.mimeType || "video/webm";
  const blob = new Blob(localRecordingChunks, { type: mimeType });
  localRecordingStream?.getTracks().forEach((track) => track.stop());
  localRecordingStream = null;
  localRecorder = null;
  localRecordingChunks = [];

  if (blob.size > 0) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `multi-device-viewer-recording-${Date.now()}.webm`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  window.dispatchEvent(new Event(LOCAL_RECORDING_COMPLETE_EVENT));
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
  return `responsive-tester-${safeLabel || "capture"}-${date}.png`;
}
export const LOCAL_RECORDING_COMPLETE_EVENT = "MDV_LOCAL_RECORDING_COMPLETE";

let localRecorder: MediaRecorder | null = null;
let localRecordingStream: MediaStream | null = null;
let localRecordingChunks: Blob[] = [];
