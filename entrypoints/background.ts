import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({ installedAt: new Date().toISOString() });
  });

  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    const url =
      tab.url && /^https?:\/\//i.test(tab.url) ? tab.url : undefined;

    chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url }).catch(() => {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id! },
          files: ["content-scripts/content.js"],
        })
        .then(() => {
          chrome.tabs.sendMessage(tab.id!, { type: "OPEN_SIMULATOR", url });
        })
        .catch(console.error);
    });
  });

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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

    // ── CAPTURE_TAB: plain captureVisibleTab at current viewport ────────────
    if (message?.type === "CAPTURE_TAB") {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id || !tab?.windowId) { sendResponse({ error: "No active tab" }); return; }
        const tabId = tab.id;
        const windowId = tab.windowId;

        withHiddenOverlay(tabId, () =>
          new Promise<string>((resolve, reject) => {
            chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
              if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
              else resolve(dataUrl);
            });
          })
        ).then(
          (dataUrl) => sendResponse({ dataUrl }),
          (err) => sendResponse({ error: String(err) })
        );
      });
      return true;
    }

    // ── CAPTURE_TAB_FOR_VIEWPORT: emulate mobile viewport via debugger ───────
    if (message?.type === "CAPTURE_TAB_FOR_VIEWPORT") {
      const { width, height, contentHeight, deviceScaleFactor = 2, mobile = true } = message as {
        width: number; height: number; contentHeight?: number; deviceScaleFactor?: number; mobile?: boolean;
      };
      // clipHeight: how many CSS px of content to capture (no status/bottom chrome)
      const clipHeight = contentHeight ?? height;

      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) { sendResponse({ error: "No active tab" }); return; }
        const tabId = tab.id;
        const target = { tabId };

        const doCapture = () => withHiddenOverlay(tabId, () =>
          new Promise<string>((resolve, reject) => {
            // Set mobile device metrics + scroll to top
            chrome.debugger.sendCommand(target, "Emulation.setDeviceMetricsOverride", {
              width, height, deviceScaleFactor, mobile,
              screenWidth: width, screenHeight: height,
              positionX: 0, positionY: 0,
            }, () => {
              if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }

              // Scroll page to top so we capture from the beginning
              chrome.debugger.sendCommand(target, "Runtime.evaluate", {
                expression: "window.scrollTo(0,0)",
              }, () => {
                void chrome.runtime.lastError;

                // Wait for reflow + scroll
                setTimeout(() => {
                  // Clip to content area in physical pixels (excludes status bar / bottom chrome)
                  const clipW = width      * deviceScaleFactor;
                  const clipH = clipHeight * deviceScaleFactor;
                  chrome.debugger.sendCommand(target, "Page.captureScreenshot", {
                    format: "png",
                    captureBeyondViewport: false,
                    clip: { x: 0, y: 0, width: clipW, height: clipH, scale: 1 },
                  }, (result) => {
                    if (chrome.runtime.lastError || !result) {
                      reject(new Error(chrome.runtime.lastError?.message ?? "capture failed"));
                      return;
                    }
                    const { data } = result as { data: string };
                    // Reset viewport before resolving
                    chrome.debugger.sendCommand(target, "Emulation.clearDeviceMetricsOverride", {}, () => {
                      void chrome.runtime.lastError;
                      resolve(`data:image/png;base64,${data}`);
                    });
                  });
                }, 500);
              });
            });
          })
        );

        // Attach debugger
        chrome.debugger.attach(target, "1.3", () => {
          if (chrome.runtime.lastError) {
            // Already attached or can't attach — fall back to captureVisibleTab
            const windowId = tab.windowId;
            if (!windowId) { sendResponse({ error: "no windowId" }); return; }
            withHiddenOverlay(tabId, () =>
              new Promise<string>((resolve, reject) => {
                chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
                  if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                  else resolve(dataUrl);
                });
              })
            ).then(
              (dataUrl) => sendResponse({ dataUrl }),
              (err) => sendResponse({ error: String(err) })
            );
            return;
          }

          doCapture().then(
            (dataUrl) => {
              chrome.debugger.detach(target, () => { void chrome.runtime.lastError; });
              sendResponse({ dataUrl });
            },
            (err) => {
              chrome.debugger.detach(target, () => { void chrome.runtime.lastError; });
              sendResponse({ error: String(err) });
            }
          );
        });
      });
      return true;
    }

    return false;
  });
});
