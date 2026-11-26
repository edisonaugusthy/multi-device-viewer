import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewSessions } from "./preview-sessions";
import { identityHeaders, previewDocumentHeaders, previewRule } from "../domain/simulator/preview-rules";
import { previewRequestFilter } from "../domain/simulator/preview-request";
import type { PreviewIdentity } from "../domain/simulator/preview-identity";
import type { BrowserBrands } from "../domain/simulator/preview-emulation";

const brands: BrowserBrands = { brands: [{ brand: "Chromium", version: "141" }], fullVersionList: [{ brand: "Chromium", version: "141.0.0.0" }], uaFullVersion: "141.0.0.0" };

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
  const headers = (tabId: number, name: string) => ofTab(tabId).find(rule => rule.condition.urlFilter === previewRequestFilter(name))?.action.requestHeaders;
  return { updateSessionRules, rules: () => rules, ofTab, headers };
}
const iphone: PreviewIdentity = { userAgent: "iPhone Safari", platform: "iOS", mobile: true, hints: false };
const mac: PreviewIdentity = { userAgent: "Mac Safari", platform: "macOS", mobile: false, hints: false };
const android: PreviewIdentity = { userAgent: "Android Chrome", platform: "Android", mobile: true, hints: true };

describe("preview session rules", () => {
  let browser: ReturnType<typeof fakeChrome>;
  beforeEach(() => { browser = fakeChrome(); });
  afterEach(() => vi.unstubAllGlobals());
  it("accumulates embedding hosts without changing top-level requests", async () => {
    const sessions = createPreviewSessions();
    for (const url of ["https://example.com/a", "https://example.com/b", "https://other.com/"]) await sessions.prepare(7, url, undefined, brands);
    await sessions.prepare(8, "https://example.com/", undefined, brands);
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(3);
    expect(browser.ofTab(7)).toHaveLength(1);
    expect(browser.ofTab(7)[0].condition.requestDomains).toEqual(["example.com", "other.com"]);
    expect(new Set(browser.rules().map(rule => rule.id)).size).toBe(2);
  });
  it("serializes simultaneous device preparation without losing peers, including after worker restart", async () => {
    const sessions = createPreviewSessions();
    await Promise.all([sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands), sessions.prepare(7, "https://example.com", { "mdv-preview-b": mac }, brands), sessions.prepare(7, "https://example.com", { "mdv-preview-c": android }, brands)]);
    expect(browser.ofTab(7)).toHaveLength(4);
    await createPreviewSessions().prepare(7, "https://other.com", { "mdv-preview-b": android }, brands);
    expect(browser.headers(7, "mdv-preview-a")).toEqual(identityHeaders(iphone, brands));
    expect(browser.headers(7, "mdv-preview-b")).toEqual(identityHeaders(android, brands));
    expect(browser.headers(7, "mdv-preview-c")).toEqual(identityHeaders(android, brands));
  });
  it("retains peer rules on reload and removes only the frame changed to a browser identity", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone, "mdv-preview-b": mac }, brands);
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands);
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(1);
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": null }, brands);
    expect(browser.headers(7, "mdv-preview-a")).toBeUndefined();
    expect(browser.headers(7, "mdv-preview-b")).toEqual(identityHeaders(mac, brands));
    expect(browser.ofTab(7)).toHaveLength(2);
  });
  it("upgrades an older embedding rule so preview documents are revalidated", async () => {
    const older = previewRule(1_000_000, 7, ["example.com"]);
    delete older.action.requestHeaders;
    await chrome.declarativeNetRequest.updateSessionRules({ addRules: [older] });
    await createPreviewSessions().prepare(7, "https://example.com", undefined, brands);
    expect(browser.ofTab(7)).toHaveLength(1);
    expect(browser.ofTab(7)[0].action.requestHeaders).toEqual(previewDocumentHeaders);
  });
  it("surfaces rule installation failure and allows a later retry", async () => {
    browser.updateSessionRules.mockRejectedValueOnce(new Error("quota"));
    const sessions = createPreviewSessions();
    await expect(sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands)).rejects.toThrow("quota");
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands);
    expect(browser.headers(7, "mdv-preview-a")).toEqual(identityHeaders(iphone, brands));
  });
  it("extends every rule to a pop-out window's tab and takes it back when the window is gone", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone, "mdv-preview-b": mac }, brands);
    // Only device a prepares again when it moves to the window; b's rule moves with it.
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands, [12]);
    expect(browser.rules()).toHaveLength(3);
    expect(browser.rules().every(rule => rule.condition.tabIds?.join() === "7,12")).toBe(true);
    expect(browser.headers(12, "mdv-preview-a")).toEqual(identityHeaders(iphone, brands));
    expect(browser.headers(12, "mdv-preview-b")).toEqual(identityHeaders(mac, brands));
    // Unchanged tabs and identities write nothing.
    const writes = browser.updateSessionRules.mock.calls.length;
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands, [12]);
    expect(browser.updateSessionRules).toHaveBeenCalledTimes(writes);
    // The window's own tab closing removes nothing: the website tab owns the rules.
    await sessions.close(12);
    expect(browser.rules()).toHaveLength(3);
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands);
    expect(browser.rules().every(rule => rule.condition.tabIds?.join() === "7")).toBe(true);
    expect(browser.ofTab(12)).toEqual([]);
    await sessions.close(7);
    expect(browser.rules()).toEqual([]);
  });
  it("cleans up only the closing tab and prunes missing tabs", async () => {
    const sessions = createPreviewSessions();
    await sessions.prepare(7, "https://example.com", { "mdv-preview-a": iphone }, brands);
    await sessions.prepare(9, "https://example.com", { "mdv-preview-a": mac }, brands);
    await sessions.close(7);
    expect(browser.rules()).toHaveLength(2);
    expect(browser.rules().every(rule => rule.condition.tabIds?.[0] === 9)).toBe(true);
    await sessions.prune();
    expect(browser.rules()).toEqual([]);
  });
});
