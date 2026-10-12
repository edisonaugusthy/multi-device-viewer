import { describe, expect, it, vi } from "vitest";
import { alignedSource, commonSize, handleVisualRegression } from "./visual-regression-service";
import type { BaselineIdentity, CaptureFrame } from "./visual-regression.types";

const identity: BaselineIdentity = { deviceId: "iphone", url: "https://example.com/", orientation: "portrait", viewportWidth: 390, viewportHeight: 844 };
const frame: CaptureFrame = { rect: { left: 100, top: 50, width: 195, height: 422 }, viewport: { width: 1440, height: 900 } };

describe("visual regression service", () => {
  it("compares equal sizes directly and same-shape captures at the smaller size", () => {
    expect(commonSize({ width: 389, height: 843 }, { width: 389, height: 843 })).toEqual({ width: 389, height: 843, resized: false });
    // A 3× baseline and a 2× capture of the same viewport, each losing a pixel to cropping.
    expect(commonSize({ width: 1169, height: 2531 }, { width: 779, height: 1687 })).toEqual({ width: 779, height: 1687, resized: true });
    expect(() => commonSize({ width: 390, height: 844 }, { width: 390, height: 700 })).toThrow("dimensions");
  });
  it("maps the smaller capture's webpage area into the larger capture", () => {
    // The same 390 CSS px viewport at 2× (origin 0.4 px in) and 3× (origin 0.6 px in).
    const small = { width: 779, height: 1687, crop: { x: 0.4, y: 0, width: 780, height: 1688 } };
    const large = { crop: { x: 0.6, y: 0.3, width: 1170, height: 2532 } };
    const source = alignedSource(small, large);
    expect(source.x).toBeCloseTo(0.4 * 1.5 - 0.6);
    expect(source.y).toBeCloseTo(-0.3);
    expect(source.width).toBeCloseTo(779 * 1.5);
    expect(source.height).toBeCloseTo(1687 * 1.5);
  });
  it("rejects clipped or malformed frames and non-web pages before capturing", async () => {
    const host = { captureTab: vi.fn() };
    const capture = (patch: Partial<CaptureFrame["rect"]>, id = identity) =>
      handleVisualRegression({ action: "capture", identity: id, deviceName: "iPhone", frame: { ...frame, rect: { ...frame.rect, ...patch } } }, host);
    await expect(capture({ left: -1 })).rejects.toThrow("clipped");
    await expect(capture({ top: 600 })).rejects.toThrow("clipped");
    await expect(capture({ width: Number.NaN })).rejects.toThrow("image");
    await expect(capture({}, { ...identity, url: "chrome://settings" })).rejects.toThrow("unsupported");
    expect(host.captureTab).not.toHaveBeenCalled();
  });
  it("reports a capture failure from the browser", async () => {
    const host = { captureTab: () => Promise.reject(new Error("capture")) };
    await expect(handleVisualRegression({ action: "capture", identity, deviceName: "", frame }, host)).rejects.toThrow("capture");
  });
  it("treats unknown captures and comparisons as expired", async () => {
    const host = { captureTab: vi.fn() };
    await expect(handleVisualRegression({ action: "save", captureId: "nope" }, host)).rejects.toThrow("expired");
    await expect(handleVisualRegression({ action: "compare", captureId: "nope", threshold: 16 }, host)).rejects.toThrow("expired");
    await expect(handleVisualRegression({ action: "rediff", comparisonId: "nope", threshold: 16 }, host)).rejects.toThrow("expired");
    await expect(handleVisualRegression({ action: "accept", comparisonId: "nope" }, host)).rejects.toThrow("expired");
    await expect(handleVisualRegression({ action: "discard", captureId: "nope" }, host)).resolves.toBeNull();
    await expect(handleVisualRegression({ action: "bogus" } as never, host)).rejects.toThrow("image");
  });
});
