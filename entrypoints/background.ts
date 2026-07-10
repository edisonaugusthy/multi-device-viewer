import { defineBackground } from "wxt/utils/define-background";
import { openSimulator } from "../src/app/extension-routes";
import { screenshotFilename } from "../src/domain/capture/capture-service";

const OPEN_SIMULATOR_MENU_ID = "open-tab-in-device-simulator";
const UPDATE_BADGE_TEXT = "NEW";
const LIVE_PREVIEW_CAPTURE_DELAY_MS = 300;
const OFFSCREEN_RECORDING_PATH = "/offscreen.html";

type ViewportCaptureRequest = {
  width: number;
  height: number;
  contentHeight?: number;
  deviceScaleFactor?: number;
  mobile?: boolean;
  scrollToTop?: boolean;
  tabId?: number | null;
};

const SCREENSHOT_COMMAND_PRESETS: Record<string, ViewportCaptureRequest & { label: string }> = {
  "take-screenshot-1": { label: "iphone-14-pro-max", width: 430, height: 932, mobile: true, deviceScaleFactor: 3, scrollToTop: true },
  "take-screenshot-2": { label: "pixel-8", width: 412, height: 915, mobile: true, deviceScaleFactor: 3, scrollToTop: true },
  "take-screenshot-3": { label: "ipad-air", width: 820, height: 1180, mobile: true, deviceScaleFactor: 2, scrollToTop: true },
  "take-screenshot-4": { label: "macbook-air", width: 1440, height: 900, mobile: false, deviceScaleFactor: 2, scrollToTop: true },
};

export default defineBackground(() => {
  createContextMenu();

  chrome.action.onClicked.addListener((tab) => {
    openSimulatorForTab(tab);
  });

  chrome.runtime.onInstalled.addListener((details) => {
    void chrome.storage.local.set({ installedAt: new Date().toISOString() });
    createContextMenu();
    if (details.reason === "update") syncUpdateIndicator();
  });

  chrome.runtime.onStartup.addListener(() => {
    createContextMenu();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== OPEN_SIMULATOR_MENU_ID || !tab) return;
    openSimulatorForTab(tab);
  });

  chrome.commands?.onCommand.addListener((command) => {
    if (command === "start-stop-video-capture") {
      void toggleRecording().catch(console.error);
      return;
    }

    const preset = SCREENSHOT_COMMAND_PRESETS[command];
    if (!preset) return;

    void captureViewportOnTab(preset)
      .then((result) => {
        if (!result.dataUrl) return;
        void chrome.downloads.download({
          url: result.dataUrl,
          filename: screenshotFilename(preset.label),
          saveAs: true,
        });
      })
      .catch(console.error);
  });

  function createContextMenu() {
    chrome.contextMenus.create({
      id: OPEN_SIMULATOR_MENU_ID,
      title: "Open this tab in Multi Device Viewer",
      contexts: ["page", "action"],
    }, () => {
      if (!chrome.runtime.lastError) return;

      chrome.contextMenus.update(OPEN_SIMULATOR_MENU_ID, {
        title: "Open this tab in Multi Device Viewer",
        contexts: ["page", "action"],
      }, () => {
        void chrome.runtime.lastError;
      });
    });
  }

  function openSimulatorForTab(tab: chrome.tabs.Tab) {
    clearUpdateIndicator();

    const url =
      tab.url && /^https?:\/\//i.test(tab.url) ? tab.url : undefined;

    if (typeof tab.id !== "number") {
      void openSimulator(url, tab.id).catch(console.error);
      return;
    }

    // Keep the viewer on the current page. The content script owns the
    // full-screen overlay, so the source page remains underneath it.
    const message = { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id };
    const sendMessage = () => {
      chrome.tabs.sendMessage(tab.id!, message, () => {
        if (!chrome.runtime.lastError) return;
        const isWebPage = /^https?:\/\//i.test(tab.url ?? "");
        if (!isWebPage) {
          // Chrome-internal/restricted pages cannot receive content-script
          // messages, so preserve a usable fallback for those pages.
          void openSimulator(url, tab.id).catch(console.error);
          return;
        }
        console.error("Multi Device Viewer could not attach to the current page", chrome.runtime.lastError.message);
      });
    };

    chrome.tabs.sendMessage(tab.id, message, () => {
      if (!chrome.runtime.lastError) return;

      // A tab that was already open when the extension was reloaded does not
      // automatically receive the content script. Inject it once, then retry
      // the in-page launch instead of opening a chrome-extension:// tab.
      chrome.scripting.executeScript(
        { target: { tabId: tab.id! }, files: ["content-scripts/content.js"] },
        () => {
          if (chrome.runtime.lastError) {
            sendMessage();
            return;
          }
          sendMessage();
        },
      );
    });
  }

  function syncUpdateIndicator() {
    chrome.action.setBadgeBackgroundColor({ color: "#0f766e" });
    chrome.action.setBadgeText({ text: UPDATE_BADGE_TEXT });
  }

  function clearUpdateIndicator() {
    chrome.action.setBadgeText({ text: "" });
  }

  // ── Helper: hide overlay, wait, run fn, restore overlay ─────────────────────
  function withHiddenOverlay<T>(tabId: number, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: "HIDE_OVERLAY" }, () => {
        void chrome.runtime.lastError;
        // Wait for repaint
        setTimeout(() => {
          fn().then(
            (result) => {
              chrome.tabs.sendMessage(tabId, { type: "SHOW_OVERLAY" }, () => {
                void chrome.runtime.lastError;
              });
              resolve(result);
            },
            (err) => {
              chrome.tabs.sendMessage(tabId, { type: "SHOW_OVERLAY" }, () => {
                void chrome.runtime.lastError;
              });
              reject(err);
            }
          );
        }, 150);
      });
    });
  }

  async function resolveCaptureTab(tabId?: number | null): Promise<chrome.tabs.Tab | null> {
    if (typeof tabId === "number" && Number.isInteger(tabId)) {
      return new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab?.id) resolve(null);
          else resolve(tab);
        });
      });
    }

    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0] ?? null;
  }

  async function captureViewportOnTab(request: ViewportCaptureRequest): Promise<{
    dataUrl?: string;
    activeUrl?: string;
    activeTabId?: number;
    error?: string;
  }> {
    const {
      width,
      height,
      contentHeight,
      deviceScaleFactor = 2,
      mobile = true,
      scrollToTop = true,
      tabId,
    } = request;

    const clipHeight = contentHeight ?? height;
    const tab = await resolveCaptureTab(tabId);
    if (!tab?.id) {
      return { error: "No active tab", activeTabId: undefined };
    }

    const targetTabId = tab.id;
    const target = { tabId: targetTabId };
    const runCapture = () =>
      new Promise<string>((resolve, reject) => {
        chrome.debugger.sendCommand(
          target,
          "Emulation.setDeviceMetricsOverride",
          {
            width,
            height,
            deviceScaleFactor,
            mobile,
            screenWidth: width,
            screenHeight: height,
            positionX: 0,
            positionY: 0,
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            const finalizeCapture = () => {
              setTimeout(() => {
                const clipW = width * deviceScaleFactor;
                const clipH = clipHeight * deviceScaleFactor;
                chrome.debugger.sendCommand(
                  target,
                  "Page.captureScreenshot",
                  {
                    format: "png",
                    captureBeyondViewport: false,
                    clip: { x: 0, y: 0, width: clipW, height: clipH, scale: 1 },
                  },
                  (result) => {
                    if (chrome.runtime.lastError || !result) {
                      reject(new Error(chrome.runtime.lastError?.message ?? "capture failed"));
                      return;
                    }
                    const { data } = result as { data: string };
                    chrome.debugger.sendCommand(target, "Emulation.clearDeviceMetricsOverride", {}, () => {
                      void chrome.runtime.lastError;
                      resolve(`data:image/png;base64,${data}`);
                    });
                  },
                );
              }, LIVE_PREVIEW_CAPTURE_DELAY_MS);
            };

            if (!scrollToTop) {
              finalizeCapture();
              return;
            }

            chrome.debugger.sendCommand(
              target,
              "Runtime.evaluate",
              { expression: "window.scrollTo(0,0)" },
              () => {
                void chrome.runtime.lastError;
                finalizeCapture();
              },
            );
          },
        );
      });

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        chrome.debugger.attach(target, "1.3", () => {
          if (chrome.runtime.lastError) {
            if (!tab.windowId) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            withHiddenOverlay(targetTabId, () =>
              new Promise<string>((innerResolve, innerReject) => {
                chrome.tabs.captureVisibleTab(tab.windowId!, { format: "png" }, (fallbackUrl) => {
                  if (chrome.runtime.lastError) innerReject(new Error(chrome.runtime.lastError.message));
                  else innerResolve(fallbackUrl);
                });
              }),
            ).then(resolve, reject);
            return;
          }

          withHiddenOverlay(targetTabId, runCapture).then(
            (captured) => {
              chrome.debugger.detach(target, () => {
                void chrome.runtime.lastError;
                resolve(captured);
              });
            },
            (error) => {
              chrome.debugger.detach(target, () => {
                void chrome.runtime.lastError;
                reject(error);
              });
            },
          );
        });
      });

      return {
        dataUrl,
        activeUrl: tab.url,
        activeTabId: targetTabId,
      };
    } catch (error) {
      return {
        error: String(error),
        activeUrl: tab.url,
        activeTabId: targetTabId,
      };
    }
  }

  async function ensureOffscreenRecordingDocument(): Promise<void> {
    const contexts = await chrome.runtime.getContexts?.({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_RECORDING_PATH)],
    });

    if (contexts && contexts.length > 0) return;

    await chrome.offscreen.createDocument({
      url: OFFSCREEN_RECORDING_PATH,
      reasons: ["USER_MEDIA"],
      justification: "Record the current tab for device preview QA.",
    });
  }

  async function toggleRecording(): Promise<void> {
    const recording = await chrome.storage.session.get("mdvRecordingActive");
    const isActive = Boolean(recording.mdvRecordingActive);
    if (isActive) {
      chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
      return;
    }
    chrome.runtime.sendMessage({ type: "START_RECORDING" });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "OPEN_ACTIVE_TAB_IN_VIEWER") {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) {
          sendResponse({ ok: false, error: "No active tab" });
          return;
        }
        openSimulatorForTab(tab);
        sendResponse({ ok: true });
      });
      return true;
    }

    // ── CAPTURE_TAB_WITH_OVERLAY: capture the visible tab AS-IS (overlay stays visible) ──
    if (message?.type === "CAPTURE_TAB_WITH_OVERLAY") {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.windowId) { sendResponse({ error: "No active tab" }); return; }
        chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
          if (chrome.runtime.lastError) sendResponse({ error: chrome.runtime.lastError.message });
          else sendResponse({ dataUrl });
        });
      });
      return true;
    }

    // ── CAPTURE_TAB_FOR_VIEWPORT: emulate mobile viewport via debugger ───────
    if (message?.type === "CAPTURE_TAB_FOR_VIEWPORT") {
      void captureViewportOnTab(message as ViewportCaptureRequest).then(sendResponse);
      return true;
    }

    if (message?.type === "CAPTURE_LIVE_TAB_PREVIEW") {
      const request = message as ViewportCaptureRequest;
      void captureViewportOnTab({
        ...request,
        scrollToTop: false,
      }).then(sendResponse);
      return true;
    }

    if (message?.type === "START_RECORDING") {
      void (async () => {
        const tab = await resolveCaptureTab(typeof message.tabId === "number" ? message.tabId : null);
        if (!tab?.id) {
          sendResponse({ ok: false, error: "No source tab" });
          return;
        }

        try {
          await ensureOffscreenRecordingDocument();
          const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
          await chrome.storage.session.set({ mdvRecordingActive: true });
          chrome.runtime.sendMessage({
            type: "OFFSCREEN_START_RECORDING",
            streamId,
            tabId: tab.id,
            filename: `multi-device-viewer-recording-${Date.now()}.webm`,
          });
          sendResponse({ ok: true });
        } catch (error) {
          await chrome.storage.session.set({ mdvRecordingActive: false });
          sendResponse({ ok: false, error: String(error) });
        }
      })();
      return true;
    }

    if (message?.type === "STOP_RECORDING") {
      void chrome.storage.session.set({ mdvRecordingActive: false }).then(() => {
        chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP_RECORDING" });
        sendResponse({ ok: true });
      });
      return true;
    }

    if (message?.type === "OFFSCREEN_RECORDING_COMPLETE") {
      void chrome.storage.session.set({ mdvRecordingActive: false }).then(() => {
        if (typeof message.blobUrl === "string" && typeof message.filename === "string") {
          void chrome.downloads.download({
            url: message.blobUrl,
            filename: message.filename,
            saveAs: true,
          });
        }
        void chrome.offscreen.closeDocument().catch(() => undefined);
        sendResponse({ ok: true });
      });
      return true;
    }

    return false;
  });
});
