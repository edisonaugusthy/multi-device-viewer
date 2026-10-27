import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewSessions } from "./preview-sessions";

function fakeChrome(tabIds: number[] = [7]) {
  let rules: chrome.declarativeNetRequest.Rule[] = [];
  const updateSessionRules = vi.fn(async ({ removeRuleIds = [], addRules = [] }: chrome.declarativeNetRequest.UpdateRuleOptions) => {
    rules = [...rules.filter(rule => !removeRuleIds.includes(rule.id)), ...structuredClone(addRules)];
  });
  vi.stubGlobal("chrome", {
    declarativeNetRequest: { getSessionRules: async () => structuredClone(rules), updateSessionRules },
    tabs: { query: async () => tabIds.map(id => ({ id })) },
  });
  const ofTab = (tabId: number) => rules.filter(rule => rule.condition.tabIds?.includes(tabId));
  return { updateSessionRules, rules: () => rules, setRules: (next: chrome.declarativeNetRequest.Rule[]) => { rules = next; }, ofTab };
}

describe("preview session rules", () => {
  let browser: ReturnType<typeof fakeChrome>;
  beforeEach(() => { browser = fakeChrome(); });
  afterEach(() => vi.unstubAllGlobals());
  it("accumulates embedding hosts without changing top-level requests", async () => {
    const sessions = createPreviewSessions();
    for (const url of ["https://example.com/a", "https://example.com/b", "https://other.com/"]) await sessions.prepare(7, url);
    await sessions.prepare(8, "https://example.com/");
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(3);
    expect(browser.ofTab(7)).toHaveLength(1);
    expect(browser.ofTab(7)[0].condition.requestDomains).toEqual(["example.com", "other.com"]);
    expect(new Set(browser.rules().map(rule => rule.id)).size).toBe(2);
  });
  it("serializes simultaneous preparation, including after worker restart", async () => {
    const sessions = createPreviewSessions();
    await Promise.all(["https://a.com", "https://b.com", "https://c.com"].map(url => sessions.prepare(7, url)));
    await createPreviewSessions().prepare(7, "https://d.com");
    expect(browser.ofTab(7)).toHaveLength(1);
    expect(browser.ofTab(7)[0].condition.requestDomains).toEqual(["a.com", "b.com", "c.com", "d.com"]);
  });
  it("drops per-device header rules an older version left in an open viewer", async () => {
    browser.setRules([{ id: 1_000_005, priority: 2, condition: { tabIds: [7], urlFilter: "#*:~:mdv-device=mdv-preview-a&" }, action: { type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType } }]);
    await createPreviewSessions().prepare(7, "https://example.com");
    expect(browser.ofTab(7)).toHaveLength(1);
    expect(browser.ofTab(7)[0].condition.urlFilter).toBeUndefined();
  });
  it("surfaces rule installation failure and allows a later retry", async () => {
    browser.updateSessionRules.mockRejectedValueOnce(new Error("quota"));
    const sessions = createPreviewSessions();
    await expect(sessions.prepare(7, "https://example.com")).rejects.toThrow("quota");
    await sessions.prepare(7, "https://example.com");
    expect(browser.ofTab(7)).toHaveLength(1);
  });
  it("refuses a 33rd site in one viewer", async () => {
    const sessions = createPreviewSessions();
    for (let i = 0; i < 32; i++) await sessions.prepare(7, `https://site${i}.com`);
    await expect(sessions.prepare(7, "https://one-more.com")).rejects.toThrow("Close and reopen");
  });
  it("cleans up only the closing tab and prunes missing tabs", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com");
    await sessions.prepare(9, "https://example.com");
    await sessions.close(7);
    expect(browser.rules()).toHaveLength(1);
    expect(browser.rules().every(rule => rule.condition.tabIds?.[0] === 9)).toBe(true);
    await sessions.prune();
    expect(browser.rules()).toEqual([]);
  });
});
