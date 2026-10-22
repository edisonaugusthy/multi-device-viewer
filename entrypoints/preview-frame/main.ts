import { PREVIEW_SANDBOX, slotIdFromFrameName, webPageUrl } from "../../src/app/preview-frame";

// The wrapper around a phone preview (see src/app/preview-frame.ts). It
// navigates the page frame itself, so the request starts from the extension's
// origin, and relays every message between the viewer above and the page
// below without reading it. The page's bridge sends it where the page
// navigated by itself, so that the wrapper can fetch the page again as a phone.
const params = new URLSearchParams(location.search);
const url = webPageUrl(params.get("url"));
const name = params.get("name") ?? "";
const slotId = slotIdFromFrameName(name);

if (url && slotId) {
  const frame = document.createElement("iframe");
  frame.name = name;
  frame.title = "";
  frame.loading = "eager";
  frame.setAttribute("sandbox", PREVIEW_SANDBOX);
  frame.setAttribute("scrolling", "auto");
  frame.addEventListener("load", () => window.parent.postMessage({ type: "MDV_PREVIEW_FRAME_LOADED", slotId }, "*"));
  window.addEventListener("message", (event) => {
    if (event.source === frame.contentWindow) {
      const data = event.data;
      if (data?.type === "MDV_PREVIEW_NAVIGATE" && data.slotId === slotId) {
        const next = webPageUrl(data.url);
        const target = frame.contentWindow;
        if (!next || !target) return;
        if (data.replace) target.location.replace(next); else target.location.href = next;
        return;
      }
      window.parent.postMessage(data, "*");
    } else if (event.source === window.parent) {
      frame.contentWindow?.postMessage(event.data, "*");
    }
  });
  frame.src = url;
  document.body.append(frame);
}
