import { defineContentScript } from "wxt/utils/define-content-script";
import { setupPreviewBridge } from "../src/app/preview-bridge";
import { setupPreviewLoadHealth } from "../src/app/preview-load-health";
import { setupWrappedNavigation } from "../src/app/preview-navigation";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  allFrames: true,
  runAt: "document_start",
  main(ctx) {
    const cleanup = setupPreviewLoadHealth();
    setupWrappedNavigation();
    const startBridge = () => setupPreviewBridge();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBridge, { once: true });
    else startBridge();
    ctx.onInvalidated(() => { cleanup(); document.removeEventListener("DOMContentLoaded", startBridge); });
  },
});
