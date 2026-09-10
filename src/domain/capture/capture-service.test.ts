import { afterEach, describe, expect, it, vi } from "vitest";
import { captureTabWithOverlay } from "./capture-service";

describe("captureTabWithOverlay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the source tab ID to the background capture request", async () => {
    const fakeWindow: { parent?: unknown; requestAnimationFrame: (callback: () => void) => void } = {
      requestAnimationFrame: callback => callback(),
    };
    fakeWindow.parent = fakeWindow;
    const sendMessage = vi.fn((_message, callback) => {
      callback({ dataUrl: "data:image/png;base64,capture" });
    });

    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("chrome", {
      runtime: {
        lastError: undefined,
        sendMessage,
      },
    });

    await expect(captureTabWithOverlay(42)).resolves.toEqual({
      dataUrl: "data:image/png;base64,capture",
      error: undefined,
    });
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "CAPTURE_TAB_WITH_OVERLAY", tabId: 42 },
      expect.any(Function),
    );
  });

  it("waits for the dismissed menu to paint before requesting screenshot pixels", async () => {
    const frames: Array<() => void> = [];
    const fakeWindow: { parent?: unknown; requestAnimationFrame: (callback: () => void) => number } = {
      requestAnimationFrame: callback => frames.push(callback),
    };
    fakeWindow.parent = fakeWindow;
    const sendMessage = vi.fn((_message, callback) => callback({ dataUrl: "capture" }));
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const capture = captureTabWithOverlay(42);
    expect(sendMessage).not.toHaveBeenCalled();
    frames.shift()!();
    await Promise.resolve();
    expect(sendMessage).not.toHaveBeenCalled();
    frames.shift()!();
    await capture;
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
