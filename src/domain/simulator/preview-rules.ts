export const PREVIEW_RULE_BASE = 1_000_000;
export function previewHost(value: unknown): string {
  if (typeof value !== "string") throw new Error("A website URL is required.");
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("Only HTTP and HTTPS website URLs are supported.");
  return url.hostname;
}

/** Only active preview hosts in one tab. Never changes cookies or top-level responses. */
export function previewRule(id: number, tabId: number, domains: string[]): chrome.declarativeNetRequest.Rule {
  return {
    id, priority: 1,
    condition: { tabIds: [tabId], requestDomains: [...new Set(domains)].sort(), resourceTypes: ["sub_frame" as chrome.declarativeNetRequest.ResourceType] },
    action: {
      type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
      responseHeaders: ["x-frame-options", "content-security-policy"].map(header => ({ header, operation: "remove" as chrome.declarativeNetRequest.HeaderOperation })),
    },
  };
}
