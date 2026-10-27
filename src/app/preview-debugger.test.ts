import { describe, expect, it, vi } from "vitest";
import { createPreviewDebugger, deviceRequestHeaders, type DebuggerApi, type DebuggerTarget } from "./preview-debugger";
import type { PreviewIdentity } from "../domain/simulator/preview-identity";
import type { BrowserBrands } from "../domain/simulator/preview-emulation";
import { conditionCommands, DEFAULT_CONDITIONS } from "../domain/simulator/preview-conditions";

const CONDITION_METHODS = conditionCommands(DEFAULT_CONDITIONS).map(command => command.method);

const iphone: PreviewIdentity = { userAgent: "iPhone Safari", platform: "iOS", mobile: true, hints: false };
const android: PreviewIdentity = { userAgent: "Android Chrome", platform: "Android", mobile: true, hints: true };
const brands: BrowserBrands = { brands: [{ brand: "Chromium", version: "140" }], fullVersionList: [{ brand: "Chromium", version: "140.0.1.2" }], uaFullVersion: "140.0.1.2" };
const pixel: PreviewIdentity = { ...android, touchPoints: 5, details: { model: "Pixel 8", platformVersion: "16.0.0", formFactor: "Mobile", architecture: "", bitness: "" } };
const browserHeaders = { Accept: "*/*", Cookie: "session=1", "User-Agent": "Desktop Chrome", "sec-ch-ua": '"Chromium";v="140"', "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"macOS"' };

type Tree = { frame: { id: string; parentId?: string; name?: string }; childFrames?: Tree[] };
const page = (...childFrames: Tree[]): Tree => ({ frame: { id: "top" }, childFrames });
const frame = (id: string, parentId: string, name = "", ...childFrames: Tree[]): Tree => ({ frame: { id, parentId, name }, childFrames });

function fakeDebugger(trees: Record<string, Tree> = { "": page() }) {
  let onEvent: Parameters<DebuggerApi["onEvent"]>[0] = () => undefined;
  let onDetach: Parameters<DebuggerApi["onDetach"]>[0] = () => undefined;
  const sent: Array<{ target: DebuggerTarget; method: string; params?: Record<string, unknown> }> = [];
  const attached = new Set<number>();
  const api = {
    attach: vi.fn(async (tabId: number) => { if (attached.has(tabId)) throw new Error("Another debugger is already attached"); attached.add(tabId); }),
    detach: vi.fn(async (tabId: number) => { if (!attached.delete(tabId)) throw new Error("Not attached"); }),
    send: vi.fn(async (target: DebuggerTarget, method: string, params?: object): Promise<unknown> => {
      sent.push({ target, method, params: params as Record<string, unknown> });
      if (method === "Page.getFrameTree") return { frameTree: trees[target.sessionId ?? ""] };
      if (method === "Page.addScriptToEvaluateOnNewDocument") return { identifier: `script${sent.length}` };
      return {};
    }),
    onEvent: (listener: typeof onEvent) => { onEvent = listener; },
    onDetach: (listener: typeof onDetach) => { onDetach = listener; },
    attachedTabs: async () => [...attached],
  } satisfies DebuggerApi;
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));
  /** Pause a request and return what it was continued with. */
  const request = async (frameId: string | undefined, resourceType = "Image", sessionId?: string) => {
    const requestId = `r${sent.length}`;
    onEvent({ tabId: 7, sessionId }, "Fetch.requestPaused", { requestId, request: { url: "https://example.com/", headers: browserHeaders }, frameId, resourceType });
    await settle();
    return sent.find(entry => entry.method === "Fetch.continueRequest" && entry.params?.requestId === requestId)?.params;
  };
  const userAgent = async (...args: Parameters<typeof request>) => {
    const headers = (await request(...args))?.headers as Array<{ name: string; value: string }> | undefined;
    return headers?.find(header => header.name.toLowerCase() === "user-agent")?.value;
  };
  const header = async (name: string, ...args: Parameters<typeof request>) => {
    const headers = (await request(...args))?.headers as Array<{ name: string; value: string }> | undefined;
    return headers?.find(entry => entry.name.toLowerCase() === name)?.value;
  };
  const lost: number[] = [];
  const create = () => createPreviewDebugger(api, Promise.resolve(brands), { onLost: tabId => lost.push(tabId) });
  return { api, sent, attached, trees, request, userAgent, header, settle, lost, create, event: (...args: Parameters<typeof onEvent>) => onEvent(...args), detached: (...args: Parameters<typeof onDetach>) => onDetach(...args) };
}

describe("device request headers", () => {
  it("states the device's browser and leaves cookies to Chrome", () => {
    expect(deviceRequestHeaders(browserHeaders, iphone, brands)).toEqual([{ name: "Accept", value: "*/*" }, { name: "user-agent", value: "iPhone Safari" }]);
    expect(deviceRequestHeaders(browserHeaders, android, brands)).toEqual([
      { name: "Accept", value: "*/*" }, { name: "user-agent", value: "Android Chrome" }, { name: "sec-ch-ua", value: '"Chromium";v="140"' },
      { name: "sec-ch-ua-mobile", value: "?1" }, { name: "sec-ch-ua-platform", value: '"Android"' },
    ]);
  });
});

describe("preview debugger", () => {
  it("gives each preview's requests its own device and leaves the page's own alone", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-mobile-preview-a", frame("ad", "a")), frame("b", "top", "mdv-preview-b"), frame("widget", "top")) });
    const previews = browser.create();
    expect(await previews.prepare(7, { "mdv-mobile-preview-a": iphone, "mdv-preview-b": android })).toBe(true);
    expect(browser.sent.map(entry => entry.method)).toEqual(["Fetch.enable", "Page.enable", "Runtime.enable", "Network.enable", ...CONDITION_METHODS, "Page.addScriptToEvaluateOnNewDocument", "Page.getFrameTree", "Target.setAutoAttach"]);
    expect(await browser.userAgent("a")).toBe("iPhone Safari");
    expect(await browser.userAgent("ad")).toBe("iPhone Safari");
    expect(await browser.userAgent("b", "Script")).toBe("Android Chrome");
    expect(await browser.request("top")).toEqual({ requestId: expect.any(String) });
    expect(await browser.request("widget")).toEqual({ requestId: expect.any(String) });
    expect(await browser.request(undefined)).toEqual({ requestId: expect.any(String) });
  });

  it("reads new frames and renamed previews from the frame tree, and keeps a preview a page renames", async () => {
    const browser = fakeDebugger();
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone, "mdv-mobile-preview-a": android });
    browser.trees[""] = page(frame("a", "top", "mdv-preview-a"));
    expect(await browser.userAgent("a", "Document")).toBe("iPhone Safari");
    browser.trees[""] = page(frame("a", "top", "mdv-mobile-preview-a"));
    expect(await browser.userAgent("a", "Document")).toBe("Android Chrome");
    browser.trees[""] = page(frame("a", "top", "site-window-name"));
    expect(await browser.userAgent("a", "Document")).toBe("Android Chrome");
  });

  it("gives a frame named like a preview inside the page or a preview no identity of its own", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a", frame("inner", "a", "mdv-preview-b")), frame("w", "top", "", frame("fake", "w", "mdv-preview-b"))) });
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone, "mdv-preview-b": android });
    expect(await browser.userAgent("inner")).toBe("iPhone Safari");
    expect(await browser.userAgent("fake")).toBeUndefined();
  });

  it("watches a preview in another process before it runs, and only resumes workers", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")), child: frame("a", "top", "mdv-preview-a", frame("embed", "a")) });
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone });
    browser.event({ tabId: 7 }, "Target.attachedToTarget", { sessionId: "child", targetInfo: { type: "iframe" }, waitingForDebugger: true });
    browser.event({ tabId: 7 }, "Target.attachedToTarget", { sessionId: "worker", targetInfo: { type: "worker" }, waitingForDebugger: true });
    await browser.settle();
    const of = (sessionId: string) => browser.sent.filter(entry => entry.target.sessionId === sessionId).map(entry => entry.method);
    expect(of("child")).toEqual(["Fetch.enable", "Page.enable", "Runtime.enable", "Network.enable", ...CONDITION_METHODS, "Page.addScriptToEvaluateOnNewDocument", "Page.getFrameTree", "Target.setAutoAttach", "Runtime.runIfWaitingForDebugger"]);
    expect(of("worker")).toEqual(["Runtime.runIfWaitingForDebugger"]);
    expect(await browser.userAgent("embed", "Image", "child")).toBe("iPhone Safari");
    expect(browser.sent.at(-1)?.target).toEqual({ tabId: 7, sessionId: "child" });
  });

  it("continues every request even when the frame tree cannot be read", async () => {
    const browser = fakeDebugger();
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone });
    browser.api.send.mockImplementation(async (target, method, params) => {
      browser.sent.push({ target, method, params: params as Record<string, unknown> });
      if (method === "Page.getFrameTree") throw new Error("Target closed");
      return {};
    });
    expect(await browser.request("unknown", "Document")).toEqual({ requestId: expect.any(String) });
  });

  it("keeps identities while a tab cannot attach and uses them once it can", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")) });
    const previews = browser.create();
    browser.api.attach.mockRejectedValueOnce(new Error("Cannot access a chrome:// URL"));
    expect(await previews.prepare(7, { "mdv-preview-a": iphone })).toBe(false);
    expect(await previews.prepare(7, { "mdv-preview-b": android })).toBe(true);
    expect(await browser.userAgent("a")).toBe("iPhone Safari");
  });

  it("takes back a tab its last worker left attached", async () => {
    const browser = fakeDebugger();
    browser.attached.add(7);
    const previews = browser.create();
    expect(await previews.prepare(7)).toBe(true);
    expect(browser.api.detach).toHaveBeenCalledWith(7);
    expect(browser.api.attach).toHaveBeenCalledTimes(2);
  });

  it("stays off after the debugging bar is cancelled until the viewer closes", async () => {
    const browser = fakeDebugger();
    const previews = browser.create();
    await previews.prepare(7);
    browser.attached.delete(7);
    browser.detached({ tabId: 7 }, "canceled_by_user");
    expect(browser.lost).toEqual([7]);
    expect(await previews.prepare(7, { "mdv-preview-a": iphone })).toBe(false);
    expect(browser.api.attach).toHaveBeenCalledTimes(1);
    await previews.close(7);
    expect(await previews.prepare(7)).toBe(true);
  });

  it("sends every client hint of a Chrome device", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")) });
    await browser.create().prepare(7, { "mdv-preview-a": pixel });
    expect(await browser.header("sec-ch-ua-model", "a")).toBe('"Pixel 8"');
    expect(await browser.header("sec-ch-ua-platform-version", "a")).toBe('"16.0.0"');
    expect(await browser.header("sec-ch-ua-form-factors", "a")).toBe('"Mobile"');
    expect(await browser.header("sec-ch-ua-full-version-list", "a")).toBe('"Chromium";v="140.0.1.2"');
  });

  it("gives every watched session a navigator script for the current identities and replaces it when they change", async () => {
    const browser = fakeDebugger({ "": page(), child: frame("x", "top") });
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone });
    browser.event({ tabId: 7 }, "Target.attachedToTarget", { sessionId: "child", targetInfo: { type: "iframe" }, waitingForDebugger: false });
    await browser.settle();
    const scripts = () => browser.sent.filter(entry => entry.method === "Page.addScriptToEvaluateOnNewDocument");
    expect(scripts()).toHaveLength(2);
    expect(String(scripts()[0].params?.source)).toContain("iPhone Safari");
    await previews.prepare(7, { "mdv-preview-a": iphone });
    expect(scripts()).toHaveLength(2);
    await previews.prepare(7, { "mdv-preview-b": android });
    expect(scripts()).toHaveLength(4);
    expect(String(scripts()[3].params?.source)).toContain("Android Chrome");
    expect(browser.sent.filter(entry => entry.method === "Page.removeScriptToEvaluateOnNewDocument").map(entry => entry.target.sessionId)).toEqual([undefined, "child"]);
  });

  it("does not report a viewer that closed or a tab that closed as lost", async () => {
    const browser = fakeDebugger();
    const previews = browser.create();
    await previews.prepare(7);
    await previews.close(7);
    browser.detached({ tabId: 7 }, "target_closed");
    await previews.prepare(8);
    browser.detached({ tabId: 8 }, "target_closed");
    expect(browser.lost).toEqual([]);
  });

  it("detaches when the viewer closes and releases sessions a previous worker left", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")) });
    const previews = browser.create();
    await previews.prepare(7, { "mdv-preview-a": iphone });
    await previews.close(7);
    expect(browser.attached.has(7)).toBe(false);
    expect(await browser.request("a")).toEqual({ requestId: expect.any(String) });
    browser.attached.add(9);
    await previews.prune();
    expect(browser.attached.size).toBe(0);
  });

  it("collects each preview's script errors, failed requests and downloads, and starts again on a new page", async () => {
    vi.useFakeTimers();
    try {
      const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a", frame("ad", "a")), frame("b", "top", "mdv-preview-b")) });
      const published: Array<Record<string, unknown>> = [];
      const previews = createPreviewDebugger(browser.api, Promise.resolve(brands), { onDiagnostics: (_tab, data) => published.push(data) });
      const ready = previews.prepare(7, { "mdv-preview-a": iphone });
      await vi.runAllTimersAsync(); await ready;
      const event = (method: string, params: object) => browser.event({ tabId: 7 }, method, params);
      event("Runtime.executionContextCreated", { context: { id: 1, auxData: { frameId: "a", isDefault: true } } });
      event("Runtime.executionContextCreated", { context: { id: 2, auxData: { frameId: "a", isDefault: false } } });
      event("Runtime.executionContextCreated", { context: { id: 3, auxData: { frameId: "top", isDefault: true } } });
      event("Runtime.exceptionThrown", { exceptionDetails: { executionContextId: 1, exception: { description: "TypeError: boom" }, stackTrace: { callFrames: [{ url: "https://example.com/app.js", lineNumber: 4 }] } } });
      event("Runtime.exceptionThrown", { exceptionDetails: { executionContextId: 2, exception: { description: "Error in an extension world" } } });
      event("Runtime.exceptionThrown", { exceptionDetails: { executionContextId: 3, exception: { description: "Error on the page itself" } } });
      event("Network.requestWillBeSent", { requestId: "n1", frameId: "ad", type: "Fetch", documentURL: "https://example.com/", request: { url: "https://example.com/api", method: "GET" } });
      event("Network.responseReceived", { requestId: "n1", response: { status: 500, statusText: "Internal Server Error", mimeType: "application/json" } });
      event("Network.loadingFinished", { requestId: "n1", encodedDataLength: 64 });
      event("Network.requestWillBeSent", { requestId: "n2", frameId: "b", type: "Image", documentURL: "https://example.com/", request: { url: "https://example.com/hero.webp", method: "GET" } });
      event("Network.loadingFinished", { requestId: "n2", encodedDataLength: 4096 });
      event("Network.requestWillBeSent", { requestId: "n3", frameId: "top", type: "Script", request: { url: "https://example.com/page.js", method: "GET" } });
      event("Network.loadingFinished", { requestId: "n3", encodedDataLength: 999 });
      await vi.runAllTimersAsync();
      const latest = published.at(-1) as Record<string, { problems: Array<{ title: string; kind: string }>; download: { bytes: number } }>;
      expect(Object.keys(latest).sort()).toEqual(["mdv-preview-a", "mdv-preview-b"]);
      expect(latest["mdv-preview-a"].problems.map(problem => problem.title)).toEqual(["TypeError: boom", "GET /api"]);
      expect(latest["mdv-preview-a"].download.bytes).toBe(64);
      expect(latest["mdv-preview-b"].download.bytes).toBe(4096);
      expect(browser.sent.some(entry => entry.method === "Network.getResponseBody")).toBe(true);
      // The preview loading a new page starts over.
      browser.event({ tabId: 7 }, "Fetch.requestPaused", { requestId: "doc", request: { url: "https://example.com/next", headers: browserHeaders }, frameId: "a", resourceType: "Document" });
      await vi.runAllTimersAsync();
      expect(previews.diagnostics(7)?.["mdv-preview-a"].problems).toEqual([]);
    } finally { vi.useRealTimers(); }
  });

  it("applies conditions to every watched session and to sessions attached later", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")), child: frame("x", "a") });
    const previews = browser.create();
    expect(await previews.setConditions(8, { ...DEFAULT_CONDITIONS, scheme: "dark" })).toBe(false);
    await previews.prepare(7);
    expect(await previews.setConditions(7, { ...DEFAULT_CONDITIONS, scheme: "dark", cpu: 4 })).toBe(true);
    browser.event({ tabId: 7 }, "Target.attachedToTarget", { sessionId: "child", targetInfo: { type: "iframe" }, waitingForDebugger: false });
    await browser.settle();
    const media = browser.sent.filter(entry => entry.method === "Emulation.setEmulatedMedia" && (entry.params?.features as Array<{ value: string }>)[0].value === "dark");
    expect(media.map(entry => entry.target.sessionId)).toEqual([undefined, "child"]);
    expect(browser.sent.filter(entry => entry.method === "Emulation.setCPUThrottlingRate" && entry.params?.rate === 4)).toHaveLength(2);
  });

  it("captures part of the tab at a scale, pausing animations when asked, only while attached", async () => {
    const browser = fakeDebugger();
    const previews = browser.create();
    await expect(previews.capture(7, { x: 0, y: 0, width: 10, height: 10, scale: 3 })).rejects.toThrow();
    await previews.prepare(7);
    browser.api.send.mockImplementation(async (target, method, params) => {
      browser.sent.push({ target, method, params: params as Record<string, unknown> });
      return method === "Page.captureScreenshot" ? { data: "AAAA" } : {};
    });
    expect(await previews.capture(7, { x: 1, y: 2, width: 30, height: 40, scale: 3 }, true)).toBe("data:image/png;base64,AAAA");
    expect(browser.sent.slice(-3).map(entry => [entry.method, entry.params?.playbackRate ?? entry.params?.clip])).toEqual([
      ["Animation.setPlaybackRate", 0], ["Page.captureScreenshot", { x: 1, y: 2, width: 30, height: 40, scale: 3 }], ["Animation.setPlaybackRate", 1],
    ]);
  });

  it("finds the CSS rule behind a layout problem inside the named preview", async () => {
    const browser = fakeDebugger({ "": page(frame("a", "top", "mdv-preview-a")) });
    const previews = browser.create();
    await previews.prepare(7);
    browser.api.send.mockImplementation(async (target, method, params) => {
      browser.sent.push({ target, method, params: params as Record<string, unknown> });
      if (method === "CSS.enable") browser.event({ tabId: 7 }, "CSS.styleSheetAdded", { header: { styleSheetId: "s1", sourceURL: "https://example.com/css/home.css" } });
      if (method === "DOM.getDocument") return { root: { nodeId: 1, children: [{ nodeId: 2, children: [{ nodeId: 3, frameId: "a", contentDocument: { nodeId: 10 } }] }] } };
      if (method === "DOM.querySelector") return { nodeId: (params as { nodeId: number }).nodeId === 10 ? 11 : 0 };
      if (method === "CSS.getMatchedStylesForNode") return { matchedCSSRules: [{ rule: { origin: "regular", styleSheetId: "s1", selectorList: { text: ".hero-art" }, style: { range: { startLine: 87 }, cssProperties: [{ name: "width", value: "454px" }] } } }] };
      return {};
    });
    expect(await previews.layoutCause(7, "mdv-preview-a", ".hero-art")).toEqual({ selector: ".hero-art", declarations: "width: 454px", source: "home.css:88" });
    expect(await previews.layoutCause(7, "mdv-preview-zzz", ".hero-art")).toBeNull();
    expect(browser.sent.filter(entry => entry.method === "CSS.disable" || entry.method === "DOM.disable")).toHaveLength(2);
  });
});
