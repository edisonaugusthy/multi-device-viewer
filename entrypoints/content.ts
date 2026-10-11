import { createOverlayLifecycle } from "../src/app/overlay-lifecycle";
import { defineContentScript } from "wxt/utils/define-content-script";

type ViewerModule = typeof import("../src/app/viewer-mount");
let viewer: Promise<ViewerModule> | undefined;
// The viewer (React, catalogs, styles) ships once as viewer.js and is shared
// with the simulator page; development builds bundle it directly.
const loadViewer = () => viewer ??= (import.meta.env.DEV
  ? import("../src/app/viewer-mount")
  : import(/* @vite-ignore */ chrome.runtime.getURL("/viewer.js")) as Promise<ViewerModule>)
  .catch((error) => { viewer = undefined; throw error; });
let mountViewer: ViewerModule["mountViewer"] | undefined;

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  // The action handler injects this only when the viewer is opened. Ordinary
  // browsing tabs should not retain React, catalogs, translations and styles.
  registration: "runtime",
  allFrames: false,
  runAt: "document_idle",
  main(ctx) {
    ctx.onInvalidated(() => { void overlayLifecycle.invalidate().catch(console.error); });

    if (window.top === window) {
      notifyOverlayState(false);
      const onMessage: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (message, _sender, sendResponse) => {
        if (message !== null && typeof message === "object") {
          if (message.type === "MDV_GET_OVERLAY_STATE") {
            sendResponse({ active: overlayLifecycle.active });
            return;
          }
          if (message.type === "OPEN_SIMULATOR") {
            void overlayLifecycle.toggle({
              url: typeof message.url === "string" ? message.url : window.location.href,
              sourceTabId: typeof message.sourceTabId === "number" ? message.sourceTabId : undefined,
            }).then(() => sendResponse({ ok: true, active: overlayLifecycle.active }))
              .catch(error => sendResponse({ ok: false, error: String(error) }));
            return true;
          }
        }
      };
      chrome.runtime.onMessage.addListener(onMessage);
      ctx.onInvalidated(() => chrome.runtime.onMessage.removeListener(onMessage));
    }
  },
});


const overlayLifecycle = createOverlayLifecycle<{ url: string; sourceTabId?: number }>({
  prepare: async ({ url }) => {
    const [prepared, module] = await Promise.all([chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url }), loadViewer()]);
    mountViewer = module.mountViewer;
    if (!prepared?.ok) throw new Error(prepared?.error ?? "Could not prepare preview.");
  },
  mount: (launch) => mountViewer!({ ...launch, close: () => { void overlayLifecycle.close().catch(console.error); } }),
  release: async () => { await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_CLOSE" }); },
  onState: notifyOverlayState,
});

function notifyOverlayState(active: boolean) {
  void chrome.runtime.sendMessage({ type: "MDV_OVERLAY_STATE", active }).catch(() => undefined);
}
