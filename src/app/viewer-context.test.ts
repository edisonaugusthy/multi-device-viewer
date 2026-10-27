import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceIdentitiesActive, onDeviceIdentitiesChange, preparePreview, setViewerContext } from "./viewer-context";

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
    await expect(preparePreview("https://example.test")).resolves.toEqual({ identities: false });
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
    const identities = { "mdv-preview-a": { userAgent: "iPhone Safari", platform: "iOS" as const, mobile: true, hints: false }, "mdv-preview-b": null };
    await Promise.all([preparePreview("https://example.test", identities), preparePreview("https://example.test", identities), preparePreview("https://example.test", {}), preparePreview("https://example.test")]);
    expect(sendMessage.mock.calls.map(([message]) => message)).toEqual([
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities },
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities: {} },
      { type: "MDV_PREVIEW_HOST", url: "https://example.test", identities: undefined },
    ]);
  });

  it("reports device identities on only while the background holds the debugger, and resets for a reopened viewer", async () => {
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn().mockResolvedValueOnce({ ok: true, identities: true }).mockResolvedValueOnce({ ok: true }) } });
    const changes: boolean[] = [];
    const stop = onDeviceIdentitiesChange(active => changes.push(active));
    expect(await preparePreview("https://example.test")).toEqual({ identities: true });
    expect(await preparePreview("https://example.test")).toEqual({ identities: false });
    expect(deviceIdentitiesActive()).toBe(false);
    setViewerContext(context());
    expect(deviceIdentitiesActive()).toBe(true);
    stop();
    expect(changes).toEqual([false, true]);
  });

  it("does not ask the extension for setup outside an embedded viewer", async () => {
    const sendMessage = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    setViewerContext(undefined);
    await preparePreview("https://example.test");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
