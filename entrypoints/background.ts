import { defineBackground } from "wxt/utils/define-background";
import { openSimulator } from "../src/app/extension-routes";
import { LAST_SEEN_RELEASE_VERSION_KEY, PENDING_RELEASE_VERSION_KEY } from "../src/app/release-notes";

const OPEN_SIMULATOR_MENU_ID = "open-tab-in-device-simulator";
const UPDATE_BADGE_TEXT = "NEW";
const OFFSCREEN_RECORDING_PATH = "/offscreen.html";

export default defineBackground(() => {
  createContextMenu();

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (!message || message.type !== "MDV_OVERLAY_STATE" || typeof sender.tab?.id !== "number") return;
    setActiveIndicator(sender.tab.id, Boolean(message.active));
  });

  chrome.action.onClicked.addListener((tab) => {
    openSimulatorForTab(tab);
  });

  chrome.runtime.onInstalled.addListener((details) => {
    createContextMenu();
    const version = chrome.runtime.getManifest().version;
    if (details.reason === "install") {
      void chrome.storage.local.set({
        [LAST_SEEN_RELEASE_VERSION_KEY]: version,
        [PENDING_RELEASE_VERSION_KEY]: null,
      });
      return;
    }
    if (details.reason === "update") {
      void chrome.storage.local.set({ [PENDING_RELEASE_VERSION_KEY]: version });
      syncUpdateIndicator();
    }
  });

  chrome.runtime.onStartup.addListener(() => {
    createContextMenu();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== OPEN_SIMULATOR_MENU_ID || !tab) return;
    openSimulatorForTab(tab);
  });

  function createContextMenu() {
    chrome.contextMenus.create({
      id: OPEN_SIMULATOR_MENU_ID,
      title: "Open this tab in Mobile View & Responsive Tester",
      contexts: ["page", "action"],
    }, () => {
      if (!chrome.runtime.lastError) return;

      chrome.contextMenus.update(OPEN_SIMULATOR_MENU_ID, {
        title: "Open this tab in Mobile View & Responsive Tester",
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
        console.error("Mobile View & Responsive Tester could not attach to the current page", chrome.runtime.lastError.message);
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

  function setActiveIndicator(tabId: number, active: boolean) {
    chrome.action.setBadgeBackgroundColor({ color: "#0f9f8f", tabId });
    chrome.action.setBadgeText({ text: active ? "ON" : "", tabId });
    chrome.action.setTitle({ title: active ? "Mobile View & Responsive Tester is active — click to close" : "Open Mobile View & Responsive Tester", tabId });
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
