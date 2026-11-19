import { createOverlayLifecycle } from "../src/app/overlay-lifecycle";
import type { ViewerMode, ViewerRestoreState } from "../src/app/viewer-context";
import { defineContentScript } from "wxt/utils/define-content-script";

type ViewerModule = typeof import("../src/app/viewer-mount");
type ViewerLaunch = { url: string; mode?: ViewerMode; sourceTabId?: number; restore?: ViewerRestoreState };
let viewer: Promise<ViewerModule> | undefined;
// The viewer (React, catalogs, styles) ships once as viewer.js and is shared
// with the simulator page; development builds bundle it directly.
const loadViewer = () => viewer ??= (import.meta.env.DEV
  ? import("../src/app/viewer-mount")
  : import(/* @vite-ignore */ chrome.runtime.getURL("/viewer.js")) as Promise<ViewerModule>)
  .catch((error) => { viewer = undefined; throw error; });
let mountViewer: ViewerModule["mountViewer"] | undefined;
let activeMode: ViewerMode = "workspace";
// Set while the page is going away, so the background can tell a reload
// (bring the viewer back afterwards) from the user closing the viewer.
let unloading = false;

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
      window.addEventListener("pagehide", () => { unloading = true; });
      notifyOverlayState(false);
      const onMessage: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (message, _sender, sendResponse) => {
        if (message !== null && typeof message === "object") {
          if (message.type === "MDV_GET_OVERLAY_STATE") {
            sendResponse({ active: overlayLifecycle.active });
            return;
          }
          if (message.type === "OPEN_SIMULATOR") {
            void openViewer({
              mode: message.mode === "floating" || message.mode === "workspace" ? message.mode : undefined,
              url: typeof message.url === "string" ? message.url : window.location.href,
              sourceTabId: typeof message.sourceTabId === "number" ? message.sourceTabId : undefined,
              restore: message.restore && typeof message.restore === "object" ? message.restore : undefined,
            }, typeof message.deviceId === "string" ? message.deviceId : undefined)
              .then(() => sendResponse({ ok: true, active: overlayLifecycle.active }))
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


async function openViewer(launch: ViewerLaunch, deviceId?: string): Promise<void> {
  const mode = launch.mode ?? "workspace";
  if (overlayLifecycle.active) {
    // A reload can request restoration after the viewer is already back.
    if (launch.restore) return;
    if (activeMode === "floating" && mode === "floating") {
      (await loadViewer()).openFloatingPicker(deviceId);
      return;
    }
    if (launch.mode && activeMode !== mode) await overlayLifecycle.close();
  }
  const restore = mode === "floating" && deviceId ? { floatingDevices: [{ deviceId }] } : launch.restore;
  await overlayLifecycle.toggle({ ...launch, mode, restore });
}

const overlayLifecycle = createOverlayLifecycle<ViewerLaunch & { mode: ViewerMode }>({
  prepare: async ({ url }) => {
    const [prepared, module] = await Promise.all([chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url }), loadViewer()]);
    mountViewer = module.mountViewer;
    if (!prepared?.ok) throw new Error(prepared?.error ?? "Could not prepare preview.");
  },
  mount: (launch) => {
    activeMode = launch.mode;
    return mountViewer!({
      ...launch,
      openFloating: deviceId => openViewer({ mode: "floating", url: window.location.href, sourceTabId: launch.sourceTabId }, deviceId),
      close: () => { void overlayLifecycle.close().catch(console.error); },
    });
  },
  release: async () => { await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_CLOSE" }); },
  onState: notifyOverlayState,
});

function notifyOverlayState(active: boolean) {
  void chrome.runtime.sendMessage({ type: "MDV_OVERLAY_STATE", active, mode: activeMode, unloading }).catch(() => undefined);
}
