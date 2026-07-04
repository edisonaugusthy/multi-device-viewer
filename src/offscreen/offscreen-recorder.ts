let activeRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;
let activeChunks: Blob[] = [];
let activeFilename = `multi-device-viewer-recording-${Date.now()}.webm`;

function getRecordingMimeType() {
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) return "video/webm;codecs=vp8";
  return "video/webm";
}

async function startRecording(streamId: string, filename?: string) {
  if (activeRecorder) return;

  activeFilename = filename || activeFilename;
  activeChunks = [];
  activeStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
  });

  activeRecorder = new MediaRecorder(activeStream, {
    mimeType: getRecordingMimeType(),
  });

  activeRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      activeChunks.push(event.data);
    }
  };

  activeRecorder.onstop = () => {
    const blob = new Blob(activeChunks, { type: activeRecorder?.mimeType || "video/webm" });
    const blobUrl = URL.createObjectURL(blob);
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_RECORDING_COMPLETE",
      blobUrl,
      filename: activeFilename,
      mimeType: blob.type,
    });

    activeStream?.getTracks().forEach((track) => track.stop());
    activeStream = null;
    activeRecorder = null;
    activeChunks = [];
  };

  activeRecorder.start(1000);
}

function stopRecording() {
  if (activeRecorder && activeRecorder.state !== "inactive") {
    activeRecorder.stop();
    return;
  }

  activeStream?.getTracks().forEach((track) => track.stop());
  activeStream = null;
  activeRecorder = null;
  activeChunks = [];
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "OFFSCREEN_START_RECORDING" && typeof message.streamId === "string") {
    void startRecording(
      message.streamId,
      typeof message.filename === "string" ? message.filename : undefined,
    );
  }

  if (message.type === "OFFSCREEN_STOP_RECORDING") {
    stopRecording();
  }
});
