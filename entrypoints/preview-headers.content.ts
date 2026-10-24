import { defineContentScript } from "wxt/utils/define-content-script";
import { setupPreviewHeaders } from "../src/app/preview-headers";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  allFrames: true,
  runAt: "document_start",
  world: "MAIN",
  main: setupPreviewHeaders,
});
