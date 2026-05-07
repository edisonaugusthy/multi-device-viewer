export function simulatorUrl(initialUrl?: string): string {
  const base = typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("/simulator.html")
    : "/simulator.html";

  if (!initialUrl) return base;
  const url = new URL(base, window.location.origin);
  url.searchParams.set("url", initialUrl);
  return url.toString();
}

export async function getActiveTabUrl(): Promise<string | undefined> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) return undefined;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

export async function openSimulator(initialUrl?: string): Promise<void> {
  const targetUrl = simulatorUrl(initialUrl);

  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((tab) => tab.url?.startsWith(chrome.runtime.getURL("/simulator.html")));
    if (existing?.id) {
      await chrome.tabs.update(existing.id, { active: true, url: targetUrl });
      return;
    }
    await chrome.tabs.create({ url: targetUrl });
    return;
  }

  window.open(targetUrl, "_blank", "noopener,noreferrer");
}
