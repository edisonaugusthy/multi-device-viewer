import { previewRequestFilter } from "./preview-request";
import type { PreviewIdentity } from "./preview-identity";

export const PREVIEW_RULE_BASE = 1_000_000;
export function previewHost(value: unknown): string {
  if (typeof value !== "string") throw new Error("A website URL is required.");
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("Only HTTP and HTTPS website URLs are supported.");
  return url.hostname;
}

type HeaderChange = chrome.declarativeNetRequest.ModifyHeaderInfo;
const set = (header: string, value: string): HeaderChange => ({ header, operation: "set" as chrome.declarativeNetRequest.HeaderOperation, value });
const remove = (header: string): HeaderChange => ({ header, operation: "remove" as chrome.declarativeNetRequest.HeaderOperation });
/** Client hints a desktop Chrome may send about itself, beyond the brands in sec-ch-ua. */
const DEVICE_HINTS = ["sec-ch-ua-mobile", "sec-ch-ua-platform", "sec-ch-ua-platform-version", "sec-ch-ua-model", "sec-ch-ua-arch", "sec-ch-ua-bitness", "sec-ch-ua-wow64", "sec-ch-ua-full-version", "sec-ch-ua-full-version-list", "sec-ch-ua-form-factors"];

/**
 * Request headers that make a preview frame look like the device's browser.
 * A browser without client hints (Safari, a TV) drops them all; a Chrome
 * keeps the viewer's own brands and states its platform and form factor.
 */
export function identityHeaders(identity: PreviewIdentity): HeaderChange[] {
  const given: Record<string, string> = identity.hints ? { "sec-ch-ua-mobile": identity.mobile ? "?1" : "?0", "sec-ch-ua-platform": `"${identity.platform}"` } : {};
  return [
    set("user-agent", identity.userAgent),
    ...(identity.hints ? [] : [remove("sec-ch-ua")]),
    ...DEVICE_HINTS.map(header => header in given ? set(header, given[header]) : remove(header)),
  ];
}

/** One line per header change, so rules read back from the browser compare by content. */
export function describeHeaders(changes: HeaderChange[] | undefined): string {
  return (changes ?? []).map(change => `${change.header}:${change.operation}:${change.value ?? ""}`).join("\n");
}

/** Embedding exceptions stay limited to the active preview hosts and iframe responses. */
export function previewRule(id: number, tabId: number, domains: string[]): chrome.declarativeNetRequest.Rule {
  return {
    id, priority: 1,
    condition: { tabIds: [tabId], requestDomains: [...new Set(domains)].sort(), resourceTypes: ["sub_frame" as chrome.declarativeNetRequest.ResourceType] },
    action: {
      type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
      responseHeaders: ["x-frame-options", "content-security-policy"].map(remove),
    },
  };
}

/** Only tagged document and fetch/XHR requests in this tab get this device's headers.
 * API hosts may differ from the document host. Untagged assets are deliberately untouched.
 */
export function previewHeaderRule(id: number, tabId: number, name: string, identity: PreviewIdentity): chrome.declarativeNetRequest.Rule {
  return {
    id, priority: 2,
    condition: { tabIds: [tabId], urlFilter: previewRequestFilter(name), isUrlFilterCaseSensitive: true,
      resourceTypes: ["sub_frame", "xmlhttprequest"] as chrome.declarativeNetRequest.ResourceType[] },
    action: { type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType, requestHeaders: identityHeaders(identity) },
  };
}
