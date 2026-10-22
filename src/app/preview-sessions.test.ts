import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewSessions } from "./preview-sessions";
import { identityHeaders, previewRuleKind } from "../domain/simulator/preview-rules";

const EXTENSION = "abcdefghijklmnopabcdefghijklmnop";

/** The browser's session rule store, as far as the sessions use it. */
function fakeChrome(tabIds: number[] = [7]) {
  let rules: chrome.declarativeNetRequest.Rule[] = [];
  const updateSessionRules = vi.fn(async ({ removeRuleIds = [], addRules = [] }: chrome.declarativeNetRequest.UpdateRuleOptions) => {
    rules = [...rules.filter(rule => !removeRuleIds.includes(rule.id)), ...JSON.parse(JSON.stringify(addRules))];
  });
  vi.stubGlobal("chrome", {
    declarativeNetRequest: { getSessionRules: async () => JSON.parse(JSON.stringify(rules)), updateSessionRules },
    tabs: { query: async () => tabIds.map(id => ({ id })) },
  });
  const ofTab = (tabId: number) => rules.filter(rule => rule.condition.tabIds?.includes(tabId));
  const headers = (tabId: number) => Object.fromEntries(ofTab(tabId).map(rule => [previewRuleKind(rule), rule.action.requestHeaders]));
  return { updateSessionRules, rules: () => rules, ofTab, headers };
}
const iphone = { userAgent: "iPhone Safari" };
const mac = { userAgent: "Mac Safari" };
const android = { userAgent: "Android Chrome", hints: { mobile: true, platform: "Android" } };

describe("preview session rules", () => {
  let browser: ReturnType<typeof fakeChrome>;
  beforeEach(() => { browser = fakeChrome(); });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps one rule per tab and frame kind, adding hosts to both and leaving a known host alone", async () => {
    const sessions = createPreviewSessions(EXTENSION);
    await sessions.prepare(7, "https://example.com/a");
    await sessions.prepare(7, "https://example.com/b");
    await sessions.prepare(7, "https://other.com/");
    await sessions.prepare(8, "https://example.com/");
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(3);
    expect(browser.ofTab(7).map(rule => [previewRuleKind(rule), rule.condition.requestDomains])).toEqual([["wrapped", ["example.com", "other.com"]], ["direct", ["example.com", "other.com"]]]);
    expect(browser.ofTab(8).map(rule => previewRuleKind(rule))).toEqual(["wrapped", "direct"]);
    expect(new Set(browser.rules().map(rule => rule.id)).size).toBe(4);
    expect(browser.rules().every(rule => rule.action.requestHeaders === undefined)).toBe(true);
  });

  it("tells the frames the extension's page navigates from the website's own", async () => {
    const sessions = createPreviewSessions(EXTENSION);
    await sessions.prepare(7, "https://example.com/", { wrapped: iphone, direct: mac });
    const [wrapped, direct] = browser.ofTab(7);
    expect(wrapped.condition.initiatorDomains).toEqual([EXTENSION]);
    expect(wrapped.condition.excludedInitiatorDomains).toBeUndefined();
    expect(direct.condition.excludedInitiatorDomains).toEqual([EXTENSION]);
    expect(direct.condition.initiatorDomains).toBeUndefined();
    expect(browser.headers(7)).toEqual({ wrapped: identityHeaders(iphone), direct: identityHeaders(mac) });
  });

  it("rewrites only the kind whose identity changed", async () => {
    const sessions = createPreviewSessions(EXTENSION);
    await sessions.prepare(7, "https://example.com/", { wrapped: iphone, direct: mac });
    await sessions.prepare(7, "https://example.com/", { wrapped: iphone, direct: mac });
    await sessions.prepare(7, "https://example.com/");
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(1);
    await sessions.prepare(7, "https://example.com/", { wrapped: android, direct: mac });
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(2);
    expect(browser.updateSessionRules.mock.calls[1][0].removeRuleIds).toHaveLength(1);
    expect(browser.ofTab(7)).toHaveLength(2);
    expect(browser.headers(7)).toEqual({ wrapped: identityHeaders(android), direct: identityHeaders(mac) });
  });

  it("keeps identities when a host is added without any, and drops a kind's for null", async () => {
    const sessions = createPreviewSessions(EXTENSION);
    await sessions.prepare(7, "https://example.com/", { wrapped: iphone, direct: mac });
    await sessions.prepare(7, "https://other.com/");
    expect(browser.ofTab(7).every(rule => rule.condition.requestDomains?.join() === "example.com,other.com")).toBe(true);
    expect(browser.headers(7)).toEqual({ wrapped: identityHeaders(iphone), direct: identityHeaders(mac) });
    await sessions.prepare(7, "https://example.com/", { direct: null });
    expect(browser.headers(7)).toEqual({ wrapped: identityHeaders(iphone), direct: undefined });
    await sessions.prepare(7, "https://example.com/", null);
    expect(browser.headers(7)).toEqual({ wrapped: undefined, direct: undefined });
    expect(browser.ofTab(7).every(rule => rule.action.responseHeaders?.map(header => header.header).join() === "x-frame-options,content-security-policy")).toBe(true);
  });

  it("removes a tab's rules when it closes and prunes rules of tabs that are gone", async () => {
    const sessions = createPreviewSessions(EXTENSION);
    await sessions.prepare(7, "https://example.com/", { wrapped: iphone });
    await sessions.prepare(9, "https://example.com/");
    await sessions.close(7);
    expect(browser.rules().map(rule => rule.condition.tabIds)).toEqual([[9], [9]]);
    await sessions.prune();
    expect(browser.rules()).toEqual([]);
  });
});
