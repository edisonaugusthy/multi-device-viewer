import { previewRequestFilter } from "./preview-request";
import type { PreviewIdentity } from "./preview-identity";
import { identityHeaders as deviceHeaders, type BrowserBrands } from "./preview-emulation";

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
/**
 * Request headers that make a preview frame look like the device's browser:
 * its User-Agent and every client hint it would send (none for Safari or a
 * TV), plus the device's language and screen density when set.
 */
export function identityHeaders(identity: PreviewIdentity, browser: BrowserBrands): HeaderChange[] {
  return Object.entries(deviceHeaders(identity, browser)).map(([header, value]) => value === null ? remove(header) : set(header, value));
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
export function previewHeaderRule(id: number, tabId: number, name: string, identity: PreviewIdentity, browser: BrowserBrands): chrome.declarativeNetRequest.Rule {
  return {
    id, priority: 2,
    condition: { tabIds: [tabId], urlFilter: previewRequestFilter(name), isUrlFilterCaseSensitive: true,
      resourceTypes: ["sub_frame", "xmlhttprequest"] as chrome.declarativeNetRequest.ResourceType[] },
    action: { type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType, requestHeaders: identityHeaders(identity, browser) },
  };
}
