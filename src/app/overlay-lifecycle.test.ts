import { describe, expect, it, vi } from "vitest";
import { createOverlayLifecycle } from "./overlay-lifecycle";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

function setup() {
  const dispose = vi.fn();
  const options = {
    prepare: vi.fn(async (_url: string) => {}),
    mount: vi.fn((_url: string) => dispose),
    release: vi.fn(async () => {}),
    onState: vi.fn(),
  };
  return { lifecycle: createOverlayLifecycle(options), options, dispose };
}

describe("overlay lifecycle", () => {
  it("toggles open and closed repeatedly with a matching active state", async () => {
    const { lifecycle, options, dispose } = setup();
    for (let i = 0; i < 3; i++) {
      await lifecycle.toggle("https://example.com");
      expect(lifecycle.active).toBe(true);
      expect(options.onState).toHaveBeenLastCalledWith(true);
      await lifecycle.toggle("https://example.com");
      expect(lifecycle.active).toBe(false);
      expect(options.onState).toHaveBeenLastCalledWith(false);
    }
    expect(dispose).toHaveBeenCalledTimes(3);
  });

  it("honors a second click while preparation is still pending", async () => {
    const { lifecycle, options } = setup();
    const ready = deferred();
    options.prepare.mockReturnValueOnce(ready.promise);
    const opening = lifecycle.toggle("https://example.com");
    await Promise.resolve();
    const closing = lifecycle.toggle("https://example.com");
    ready.resolve();
    await Promise.all([opening, closing]);
    expect(options.mount).not.toHaveBeenCalled();
    expect(lifecycle.active).toBe(false);
    expect(options.release).toHaveBeenCalled();
  });

  it("remembers a third click during preparation without creating two overlays", async () => {
    const { lifecycle, options } = setup();
    const ready = deferred();
    options.prepare.mockReturnValueOnce(ready.promise);
    const first = lifecycle.toggle("https://example.com");
    await Promise.resolve();
    const second = lifecycle.toggle("https://example.com");
    const third = lifecycle.toggle("https://example.com");
    ready.resolve();
    await Promise.all([first, second, third]);
    expect(options.mount).toHaveBeenCalledTimes(1);
    expect(lifecycle.active).toBe(true);
  });

  it("closes immediately, and duplicate close events only unmount once", async () => {
    const { lifecycle, options, dispose } = setup();
    await lifecycle.toggle("https://example.com");
    const released = deferred();
    options.release.mockReturnValue(released.promise);
    const closing = lifecycle.close();
    const duplicate = lifecycle.close();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(lifecycle.active).toBe(false);
    released.resolve();
    await Promise.all([closing, duplicate]);
  });

  it("prepares the new URL when a loading launch is replaced", async () => {
    const { lifecycle, options } = setup();
    const ready = deferred();
    options.prepare.mockReturnValueOnce(ready.promise);
    const first = lifecycle.toggle("https://old.example");
    await Promise.resolve();
    const closing = lifecycle.close();
    const replacement = lifecycle.toggle("https://new.example");
    ready.resolve();
    await Promise.all([first, closing, replacement]);
    expect(options.prepare).toHaveBeenLastCalledWith("https://new.example");
    expect(options.mount).toHaveBeenCalledExactlyOnceWith("https://new.example");
  });

  it("does not mount an invalidated script or reopen from its stale listener", async () => {
    const { lifecycle, options } = setup();
    const ready = deferred();
    options.prepare.mockReturnValueOnce(ready.promise);
    const opening = lifecycle.toggle("https://example.com");
    await Promise.resolve();
    const invalidating = lifecycle.invalidate();
    ready.resolve();
    await Promise.all([opening, invalidating]);
    await lifecycle.toggle("https://example.com");
    expect(options.mount).not.toHaveBeenCalled();
    expect(lifecycle.active).toBe(false);
  });

  it("cleans up failed preparation and allows the next launch", async () => {
    const { lifecycle, options } = setup();
    options.prepare.mockRejectedValueOnce(new Error("Preparation failed"));
    await expect(lifecycle.toggle("https://example.com")).rejects.toThrow("Preparation failed");
    expect(lifecycle.active).toBe(false);
    expect(options.release).toHaveBeenCalled();
    await lifecycle.toggle("https://example.com");
    expect(lifecycle.active).toBe(true);
  });

  it("releases preview rules even if React cleanup fails", async () => {
    const { lifecycle, options, dispose } = setup();
    await lifecycle.toggle("https://example.com");
    dispose.mockImplementationOnce(() => { throw new Error("Unmount failed"); });
    await expect(lifecycle.close()).rejects.toThrow("Unmount failed");
    expect(lifecycle.active).toBe(false);
    expect(options.release).toHaveBeenCalled();
    expect(options.onState).toHaveBeenLastCalledWith(false);
  });
});
