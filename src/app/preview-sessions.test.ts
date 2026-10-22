import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewSessions } from "./preview-sessions";
import { identityHeaders } from "../domain/simulator/preview-rules";

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
  return { updateSessionRules, rules: () => rules };
}
const iphone = { userAgent: "iPhone Safari" };
const android = { userAgent: "Android Chrome", hints: { mobile: true, platform: "Android" } };

describe("preview session rules", () => {
  let browser: ReturnType<typeof fakeChrome>;
  beforeEach(() => { browser = fakeChrome(); });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps one rule per tab, adding hosts and leaving a known host alone", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com/a");
    await sessions.prepare(7, "https://example.com/b");
    await sessions.prepare(7, "https://other.com/");
    await sessions.prepare(8, "https://example.com/");
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(3);
    expect(browser.rules().map(rule => [rule.id, rule.condition.tabIds, rule.condition.requestDomains])).toEqual([[1000000, [7], ["example.com", "other.com"]], [1000001, [8], ["example.com"]]]);
    expect(browser.rules().every(rule => rule.action.requestHeaders === undefined)).toBe(true);
  });

  it("makes the tab's frames identify as a device, and rewrites the rule only when that changes", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com/", iphone);
    expect(browser.rules()[0].action.requestHeaders).toEqual(identityHeaders(iphone));
    await sessions.prepare(7, "https://example.com/", iphone);
    await sessions.prepare(7, "https://example.com/");
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(1);
    await sessions.prepare(7, "https://example.com/", android);
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(2);
    expect(browser.rules()).toHaveLength(1);
    expect(browser.rules()[0].action.requestHeaders).toEqual(identityHeaders(android));
    expect(browser.rules()[0].condition.requestDomains).toEqual(["example.com"]);
  });

  it("keeps the identity when a host is added without one, and drops it for null", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com/", iphone);
    await sessions.prepare(7, "https://other.com/");
    expect(browser.rules()[0].condition.requestDomains).toEqual(["example.com", "other.com"]);
    expect(browser.rules()[0].action.requestHeaders).toEqual(identityHeaders(iphone));
    await sessions.prepare(7, "https://example.com/", null);
    expect(browser.rules()[0].action.requestHeaders).toBeUndefined();
    expect(browser.rules()[0].action.responseHeaders?.map(header => header.header)).toEqual(["x-frame-options", "content-security-policy"]);
  });

  it("removes a tab's rule when it closes and prunes rules of tabs that are gone", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com/", iphone);
    await sessions.prepare(9, "https://example.com/");
    await sessions.close(7);
    expect(browser.rules().map(rule => rule.condition.tabIds)).toEqual([[9]]);
    await sessions.prune();
    expect(browser.rules()).toEqual([]);
  });
});
