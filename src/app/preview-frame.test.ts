import { afterEach, describe, expect, it, vi } from "vitest";
import { POPOUT_RELAY, postToPreview, previewFrameName, slotIdFromFrameName } from "./preview-frame";

describe("preview frames", () => {
  afterEach(() => vi.unstubAllGlobals());
  const frame = (host: unknown) => {
    const target = { postMessage: vi.fn() };
    return { target, element: { name: previewFrameName("a", true), contentWindow: target, ownerDocument: { defaultView: host } } as unknown as HTMLIFrameElement };
  };
  it("names a frame after its slot", () => {
    expect(slotIdFromFrameName(previewFrameName("slot-1", false))).toBe("slot-1");
    expect(slotIdFromFrameName(previewFrameName("slot-1", true))).toBe("slot-1");
  });
  it("posts straight to a frame on the page", () => {
    const page = { postMessage: vi.fn() };
    vi.stubGlobal("window", page);
    const { element, target } = frame(page);
    postToPreview(element, { type: "MDV_PREVIEW_REGISTER" });
    expect(target.postMessage).toHaveBeenCalledWith({ type: "MDV_PREVIEW_REGISTER" }, "*");
    expect(page.postMessage).not.toHaveBeenCalled();
  });
  it("sends a message for a frame in the always-on-top window through that window", () => {
    vi.stubGlobal("window", { postMessage: vi.fn() });
    const popOut = { postMessage: vi.fn() };
    const { element, target } = frame(popOut);
    postToPreview(element, { type: "MDV_PREVIEW_REGISTER" });
    expect(popOut.postMessage).toHaveBeenCalledWith({ type: POPOUT_RELAY, frame: "mdv-mobile-preview-a", message: { type: "MDV_PREVIEW_REGISTER" } }, "*");
    expect(target.postMessage).not.toHaveBeenCalled();
  });
  it("ignores a frame that is gone", () => {
    expect(() => postToPreview(null, {})).not.toThrow();
    expect(() => postToPreview({ contentWindow: null } as HTMLIFrameElement, {})).not.toThrow();
  });
});
