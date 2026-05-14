import { defineContentScript } from "wxt/utils/define-content-script";

const OVERLAY_ID = "multi-device-viewer-overlay";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  runAt: "document_idle",
  main() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message !== null && typeof message === "object") {
        if (message.type === "OPEN_SIMULATOR") {
          toggleSimulator(typeof message.url === "string" ? message.url : undefined);
        } else if (message.type === "HIDE_OVERLAY") {
          const el = document.getElementById(OVERLAY_ID);
          if (el) el.style.visibility = "hidden";
        } else if (message.type === "SHOW_OVERLAY") {
          const el = document.getElementById(OVERLAY_ID);
          if (el) el.style.visibility = "visible";
        }
      }
    });
  },
});

function toggleSimulator(targetUrl?: string) {
  // If overlay is already open, close it (toggle behaviour).
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
    document.documentElement.style.removeProperty("overflow");
    return;
  }

  // Build the simulator page URL with the current page URL pre-loaded.
  const simulatorBase = chrome.runtime.getURL("/simulator.html");
  const simulatorUrl = new URL(simulatorBase);
  const pageUrl = targetUrl ?? window.location.href;
  if (/^https?:\/\//i.test(pageUrl)) {
    simulatorUrl.searchParams.set("url", pageUrl);
  }

  // Outer container — full-screen fixed overlay.
  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    flexDirection: "row",
    background: "transparent",
  });

  // The iframe fills the entire overlay — close button lives inside the React app sidebar.
  const iframe = document.createElement("iframe");
  iframe.src = simulatorUrl.toString();
  iframe.allow = "downloads; clipboard-write";
  Object.assign(iframe.style, {
    flex: "1",
    height: "100%",
    border: "none",
    display: "block",
    background: "#f5f5f3",
  });

  // Listen for postMessages posted from inside the iframe.
  const onMessage = async (e: MessageEvent) => {
    if (e.data?.type === "CLOSE_SIMULATOR") {
      overlay.remove();
      document.documentElement.style.removeProperty("overflow");
      window.removeEventListener("message", onMessage);
      return;
    }

    // COPY_IMAGE: the iframe cannot access clipboard directly (permissions policy).
    // The content script runs in the page context and CAN write to the clipboard.
    if (e.data?.type === "COPY_IMAGE" && typeof e.data.dataUrl === "string") {
      try {
        const res = await fetch(e.data.dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        iframe.contentWindow?.postMessage({ type: "COPY_IMAGE_RESULT", ok: true }, "*");
      } catch (err) {
        iframe.contentWindow?.postMessage({ type: "COPY_IMAGE_RESULT", ok: false, error: String(err) }, "*");
      }
    }
  };
  window.addEventListener("message", onMessage);

  overlay.appendChild(iframe);
  document.documentElement.appendChild(overlay);

  // Prevent the host page from scrolling while the overlay is open.
  document.documentElement.style.overflow = "hidden";

  // Escape key closes the overlay.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.documentElement.style.removeProperty("overflow");
      document.removeEventListener("keydown", onKey, true);
    }
  };
  document.addEventListener("keydown", onKey, true);
}
