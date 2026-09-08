import { describe, expect, it } from "vitest";
import { captureLiveSession, type LiveSessionTransport } from "./live-session";
function fixture(options: { failCapture?: boolean; changedDocument?: boolean; cancel?: boolean; failAttach?: boolean } = {}) {
  const calls: string[] = []; let documents = 0;
  const adapter: LiveSessionTransport = {
    attach: async () => { calls.push("attach"); if (options.failAttach) throw new Error("DevTools already attached"); },
    detach: async () => { calls.push("detach"); }, settle: async () => { calls.push("settle"); }, cancelled: () => Boolean(options.cancel && calls.includes("settle")),
    command: async method => {
      calls.push(method);
      if (method === "Page.getLayoutMetrics") return { cssVisualViewport: { pageX: 0, pageY: 400 } };
      if (method === "DOM.getDocument") return { root: { backendNodeId: options.changedDocument && documents++ ? 2 : 1 } };
      if (method === "Page.captureScreenshot") { if (options.failCapture) throw new Error("capture failed"); return { data: "dummy" }; }
      return {};
    },
  };
  return { calls, adapter };
}
describe("live session comparison cleanup", () => {
  it("captures multiple widths and restores metrics and scroll before detaching", async () => {
    const { adapter, calls } = fixture(); const result = await captureLiveSession(adapter, [393, 768, 1280], 900);
    expect(result.map(s => s.width)).toEqual([393, 768, 1280]);
    expect(calls.slice(-4)).toEqual(["Emulation.clearDeviceMetricsOverride", "DOM.getDocument", "Runtime.evaluate", "detach"]);
    expect(calls.some(c => /navigate|reload|cookie/i.test(c))).toBe(false);
  });
  it.each([{ failCapture: true }, { cancel: true }, { changedDocument: true }])("restores on failure, cancellation or navigation: %o", async options => {
    const { adapter, calls } = fixture(options);
    await expect(captureLiveSession(adapter, [393, 1280], 900)).rejects.toThrow();
    expect(calls).toContain("Emulation.clearDeviceMetricsOverride"); expect(calls.at(-1)).toBe("detach");
    if (options.changedDocument) expect(calls.filter(c => c === "Runtime.evaluate")).toHaveLength(1);
  });
  it("does not detach someone else's debugger when attachment fails", async () => {
    const { adapter, calls } = fixture({ failAttach: true });
    await expect(captureLiveSession(adapter, [393], 900)).rejects.toThrow(); expect(calls).toEqual(["attach"]);
  });
});
