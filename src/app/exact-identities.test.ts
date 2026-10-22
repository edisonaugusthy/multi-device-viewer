import { describe, expect, it, vi } from "vitest";
import { createExactIdentities, identityOverride, type DebuggerApi, type DebuggerTarget } from "./exact-identities";
import type { PreviewIdentity } from "../domain/simulator/preview-identity";

const WRAPPER = "chrome-extension://ext/preview-frame.html";
const iphone: PreviewIdentity = { userAgent: "iPhone Safari", platform: "iOS", mobile: true, hints: false };
const windows: PreviewIdentity = { userAgent: "Windows Chrome", platform: "Windows", mobile: false, hints: true };
const brands = [{ brand: "Chromium", version: "141" }];

/** A debugger that records commands and lets the test raise protocol events the way Chrome does. */
function fakeDebugger(attachError?: string) {
  const sent: Array<[DebuggerTarget, string, object | undefined]> = [];
  let events: (source: DebuggerTarget, method: string, params?: object) => void = () => {};
  let detached: (source: DebuggerTarget, reason: string) => void = () => {};
  /** The tab's frame tree: wrapper frames carry the name the viewer gave their element. */
  const names = new Map<string, string>();
  const api: DebuggerApi = {
    attach: vi.fn(async () => { if (attachError) throw new Error(attachError); }),
    detach: vi.fn(async () => {}),
    send: vi.fn(async (target, method, params) => {
      sent.push([target, method, params]);
      if (method === "Page.getFrameTree") return { frameTree: { frame: { id: "TOP" }, childFrames: [...names].map(([id, name]) => ({ frame: { id, name } })) } };
    }),
    onEvent: (listener) => { events = listener; },
    onDetach: (listener) => { detached = listener; },
  };
  // A frame attaches before it has a URL; the URL follows once its navigation commits.
  const attach = (tabId: number, parent: string | undefined, session: string, targetId: string, parentId: string | undefined, type = "iframe") =>
    events({ tabId, sessionId: parent }, "Target.attachedToTarget", { sessionId: session, targetInfo: { targetId, type, url: "", parentId }, waitingForDebugger: true });
  const navigated = (tabId: number, targetId: string, url: string, parentId?: string) =>
    events({ tabId }, "Target.targetInfoChanged", { targetInfo: { targetId, type: "iframe", url, parentId } });
  const commands = (sessionId: string) => sent.filter(([target]) => target.sessionId === sessionId).map(([, method]) => method);
  const override = (sessionId: string) => sent.find(([target, method]) => target.sessionId === sessionId && method === "Emulation.setUserAgentOverride")?.[2];
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  return { api, sent, names, attach, navigated, commands, override, flush, detach: (tabId: number) => detached({ tabId }, "canceled_by_user") };
}

describe("exact device identities through the debugger", () => {
  it("attaches once per tab and auto-attaches to its frames", async () => {
    const browser = fakeDebugger();
    const exact = createExactIdentities(browser.api, WRAPPER, brands, () => {});
    expect(await exact.update(7, { "mdv-mobile-preview-a": iphone })).toBe(true);
    expect(await exact.update(7, { "mdv-mobile-preview-a": iphone, "mdv-preview-b": windows })).toBe(true);
    expect(browser.api.attach).toHaveBeenCalledTimes(1);
    expect(browser.sent).toEqual([[{ tabId: 7 }, "Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }]]);
    expect(exact.attached(7)).toBe(true);
    expect(exact.attached(8)).toBe(false);
  });

  it("gives each wrapper, and the page frame under it, that frame's identity before they run, and lets the page's own frames inherit it", async () => {
    const browser = fakeDebugger();
    const exact = createExactIdentities(browser.api, WRAPPER, brands, () => {});
    await exact.update(7, { "mdv-mobile-preview-a": iphone, "mdv-preview-b": windows });
    browser.names.set("W1", "mdv-mobile-preview-a").set("W2", "mdv-preview-b").set("AD", "");
    browser.attach(7, undefined, "w1", "W1", "TOP");
    browser.attach(7, undefined, "w2", "W2", "TOP");
    browser.attach(7, undefined, "ad", "AD", "TOP");
    await browser.flush();
    // The wrapper is paused before it has a URL; its frame name in the tab's tree tells it apart, and its
    // override covers its page frame's first request.
    expect(browser.commands("w1")).toEqual(["Emulation.setUserAgentOverride", "Emulation.setTouchEmulationEnabled", "Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    expect(browser.override("w1")).toEqual(identityOverride(iphone, brands));
    expect(browser.commands("ad")).toEqual(["Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    browser.navigated(7, "W1", `${WRAPPER}?url=https%3A%2F%2Fexample.com%2F&name=mdv-mobile-preview-a`, "TOP");
    browser.navigated(7, "W2", `${WRAPPER}?url=https%3A%2F%2Fexample.com%2F&name=mdv-preview-b`, "TOP");
    browser.attach(7, "w1", "p1", "P1", "W1");
    browser.attach(7, "w2", "p2", "P2", "W2");
    await browser.flush();
    expect(browser.commands("p1")).toEqual(["Emulation.setUserAgentOverride", "Emulation.setTouchEmulationEnabled", "Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    expect(browser.commands("p2")).toEqual(["Emulation.setUserAgentOverride", "Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    expect(browser.override("p1")).toEqual(identityOverride(iphone, brands));
    expect(browser.override("p2")).toEqual(identityOverride(windows, brands));
    // An embedded frame inside the iPhone's page is an iPhone too; a worker is only resumed.
    browser.attach(7, "p1", "e1", "E1", "P1");
    browser.attach(7, "p1", "k1", "K1", "P1", "worker");
    await browser.flush();
    expect(browser.override("e1")).toEqual(identityOverride(iphone, brands));
    expect(browser.commands("k1")).toEqual(["Runtime.runIfWaitingForDebugger"]);
  });

  it("names a wrapper from its URL once that arrives, and finds a frame's parent through the session that reported it", async () => {
    const browser = fakeDebugger();
    const exact = createExactIdentities(browser.api, WRAPPER, brands, () => {});
    await exact.update(7, { "mdv-preview-b": windows });
    browser.attach(7, undefined, "w2", "W2", undefined);
    await browser.flush();
    expect(browser.override("w2")).toBeUndefined();
    browser.navigated(7, "W2", `${WRAPPER}?name=mdv-preview-b`);
    await browser.flush();
    expect(browser.override("w2")).toEqual(identityOverride(windows, brands));
    browser.attach(7, "w2", "p2", "P2", undefined);
    await browser.flush();
    expect(browser.override("p2")).toEqual(identityOverride(windows, brands));
  });

  it("only resumes frames it has no identity for, and ignores tabs it is not attached to", async () => {
    const browser = fakeDebugger();
    const exact = createExactIdentities(browser.api, WRAPPER, brands, () => {});
    await exact.update(7, {});
    browser.attach(7, undefined, "ad", "AD", "TOP");
    browser.navigated(7, "AD", "https://ads.example/frame", "TOP");
    browser.attach(9, undefined, "x", "X", "TOP");
    await browser.flush();
    expect(browser.commands("ad")).toEqual(["Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    expect(browser.commands("x")).toEqual(["Runtime.runIfWaitingForDebugger"]);
  });

  it("reports when the debugger cannot be attached, and when it is taken away", async () => {
    const taken = fakeDebugger("Another debugger is already attached");
    const lost = vi.fn();
    expect(await createExactIdentities(taken.api, WRAPPER, brands, lost).update(7, {})).toBe(false);
    const browser = fakeDebugger();
    const exact = createExactIdentities(browser.api, WRAPPER, brands, lost);
    await exact.update(7, {});
    browser.detach(7);
    expect(lost).toHaveBeenCalledWith(7);
    expect(exact.attached(7)).toBe(false);
    await exact.close(7);
    expect(browser.api.detach).not.toHaveBeenCalled();
    await exact.update(7, {});
    await exact.close(7);
    expect(browser.api.detach).toHaveBeenCalledWith(7);
  });

  it("describes a browser to the page: its own brands for Chrome, none for Safari, and the matching navigator.platform", () => {
    expect(identityOverride(windows, brands)).toEqual({
      userAgent: "Windows Chrome", platform: "Win32",
      userAgentMetadata: { brands, fullVersionList: brands, platform: "Windows", platformVersion: "", architecture: "", model: "", mobile: false },
    });
    expect(identityOverride(iphone, brands)).toMatchObject({ platform: "iPhone", userAgentMetadata: { brands: [], platform: "iOS", mobile: true } });
  });
});
