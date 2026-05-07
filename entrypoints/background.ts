import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({ installedAt: new Date().toISOString() });
  });

  chrome.action.onClicked.addListener((tab) => {
    void openOrFocusSimulator(tab.url);
  });
});

async function openOrFocusSimulator(tabUrl?: string) {
  const simulatorUrl = chrome.runtime.getURL("/simulator.html");
  const url = new URL(simulatorUrl);

  if (tabUrl && /^https?:\/\//i.test(tabUrl)) {
    url.searchParams.set("url", tabUrl);
  }

  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((candidate) => candidate.url?.startsWith(simulatorUrl));

  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true, url: url.toString() });
    if (existing.windowId) await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }

  await chrome.tabs.create({ url: url.toString() });
}
