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
    await expect(preparePreview("https://example.test")).resolves.toEqual({ exact: false });
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

  it("passes the device identities along and shares setup only among frames asking for the same ones", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const identities = { wrapped: { userAgent: "iPhone Safari", platform: "iOS" as const, mobile: true, hints: false }, direct: null };
    await Promise.all([preparePreview("https://example.test", identities), preparePreview("https://example.test", identities), preparePreview("https://example.test", null), preparePreview("https://example.test")]);
    expect(sendMessage.mock.calls.map(([message]) => message)).toEqual([
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities, exact: undefined },
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities: null, exact: undefined },
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities: undefined, exact: undefined },
    ]);
  });

  it("passes exact identities along and reports whether the tab got them", async () => {
    const sendMessage = vi.fn().mockResolvedValueOnce({ ok: true, exact: true }).mockResolvedValueOnce({ ok: true, exact: false }).mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const frames = { "mdv-preview-a": { userAgent: "Mac Safari", platform: "macOS" as const, mobile: false, hints: false } };
    expect(await preparePreview("https://example.test", { wrapped: null, direct: null }, frames)).toEqual({ exact: true });
    expect(await preparePreview("https://example.test", { wrapped: null, direct: null }, {})).toEqual({ exact: false });
    expect(await preparePreview("https://example.test", null, null)).toEqual({ exact: false });
    expect(sendMessage.mock.calls[0][0]).toEqual({ type: "MDV_PREVIEW_HOST", url: "https://example.test", identities: { wrapped: null, direct: null }, exact: frames });
    expect(sendMessage.mock.calls[2][0].exact).toBeNull();
  });

  it("does not ask the extension for setup outside an embedded viewer", async () => {
    const sendMessage = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    setViewerContext(undefined);
    await preparePreview("https://example.test");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
