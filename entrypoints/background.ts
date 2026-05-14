import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({ installedAt: new Date().toISOString() });
  });

  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    // Send a message to the content script already running on the page.
    // The content script will toggle the simulator overlay in place — the user
    // never leaves the current tab.
    const url =
      tab.url && /^https?:\/\//i.test(tab.url) ? tab.url : undefined;

    chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url }).catch(() => {
      // Content script not yet injected (e.g. a page that was open before the
      // extension was installed/updated). Inject it programmatically then retry.
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
});
