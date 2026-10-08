import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preparePreview, setViewerContext } from "./viewer-context";

describe("shared preview preparation", () => {
  const context = () => ({ root: {} as HTMLElement, url: "https://example.test", close: () => {} });
  beforeEach(() => setViewerContext(context()));
  afterEach(() => { setViewerContext(undefined); vi.unstubAllGlobals(); });

  it("shares simultaneous setup and rechecks after completion", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    await Promise.all(Array.from({ length: 150 }, () => preparePreview("https://example.test")));
    expect(sendMessage).toHaveBeenCalledTimes(1);
    await preparePreview("https://example.test");
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it("reports a shared failure to every frame and permits a retry", async () => {
    const sendMessage = vi.fn().mockResolvedValueOnce({ ok: false, error: "Setup failed" }).mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const results = await Promise.allSettled([preparePreview("https://example.test"), preparePreview("https://example.test")]);
    expect(results.map(result => result.status)).toEqual(["rejected", "rejected"]);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    await expect(preparePreview("https://example.test")).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it("keeps different URLs and reopened viewers independent", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const first = preparePreview("https://example.test");
    const second = preparePreview("https://other.test");
    setViewerContext(context());
    const reopened = preparePreview("https://example.test");
    await Promise.all([first, second, reopened]);
    expect(sendMessage).toHaveBeenCalledTimes(3);
  });

  it("does not ask the extension for setup outside an embedded viewer", async () => {
    const sendMessage = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    setViewerContext(undefined);
    await preparePreview("https://example.test");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
