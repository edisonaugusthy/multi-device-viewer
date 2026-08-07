import { afterEach, describe, expect, it, vi } from "vitest";
import { captureTabWithOverlay } from "./capture-service";

describe("captureTabWithOverlay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the source tab ID to the background capture request", async () => {
    const fakeWindow: { parent?: unknown } = {};
    fakeWindow.parent = fakeWindow;
    const sendMessage = vi.fn((message, callback) => {
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
});
