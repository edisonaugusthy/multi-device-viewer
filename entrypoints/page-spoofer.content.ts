import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  world: "MAIN",
  allFrames: false,
  runAt: "document_start",
  main() {
    document.documentElement.dataset.mdvPreviewBridge = "ready";

    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data || typeof event.data !== "object") return;
      if (event.data.type !== "MDV_SET_USER_AGENT_HINT") return;

      const value = typeof event.data.value === "string" ? event.data.value : "";
      if (value) {
        document.documentElement.dataset.mdvUserAgentHint = value;
      } else {
        delete document.documentElement.dataset.mdvUserAgentHint;
      }
    });
  },
});
