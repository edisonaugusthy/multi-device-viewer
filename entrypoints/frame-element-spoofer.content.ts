import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  world: "MAIN",
  allFrames: true,
  runAt: "document_start",
  main() {
    const frame = window.frameElement;

    try {
      Object.defineProperty(window, "frameElement", {
        configurable: true,
        get() {
          return frame ?? null;
        },
      });
    } catch {
      // Another script may have already locked the property. That is fine.
    }
  },
});
