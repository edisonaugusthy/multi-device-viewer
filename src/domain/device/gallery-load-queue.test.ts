import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGalleryLoadQueue, type GalleryLoadSnapshot } from "./gallery-load-queue";

describe("gallery background loading", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const setup = (ids = ["a", "b", "c", "d", "e"]) => {
    let snapshot: GalleryLoadSnapshot;
    const onStart = vi.fn();
    const queue = createGalleryLoadQueue(ids, {
      onStart, onChange: next => { snapshot = next; }, concurrency: 2, intervalMs: 500, timeoutMs: 20000,
    });
    queue.start();
    return { queue, onStart, state: () => snapshot!, complete: (id: string) => queue.settle(id, snapshot!.requests.get(id)!, "loaded") };
  };

  it("paces starts and waits for a loading slot instead of flooding the site", () => {
    const { queue, onStart, complete } = setup();
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a"]);
    vi.advanceTimersByTime(499);
    expect(onStart).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b"]);
    vi.advanceTimersByTime(1000);
    expect(onStart).toHaveBeenCalledTimes(2);
    complete("a");
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b", "c"]);
    queue.dispose();
  });

  it("prioritizes visible cards while still loading every offscreen device", () => {
    const { queue, onStart, complete, state } = setup(["a", "b", "c", "d", "e", "a"]);
    queue.prioritize(["e"]);
    complete("a");
    vi.advanceTimersByTime(500);
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "e"]);
    complete("e");
    queue.prioritize([]);
    for (const id of ["b", "c", "d"]) { vi.advanceTimersByTime(500); complete(id); }
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "e", "b", "c", "d"]);
    expect([...state().states.values()]).toEqual(Array(5).fill("loaded"));
    queue.dispose();
  });

  it("never reloads a completed card when visibility changes rapidly", () => {
    const { queue, onStart, complete } = setup(["a"]);
    complete("a");
    for (let index = 0; index < 20; index++) { queue.prioritize([]); queue.prioritize(["a"]); }
    vi.advanceTimersByTime(30000);
    expect(onStart).toHaveBeenCalledTimes(1);
    queue.dispose();
  });

  it("continues after a stalled page and accepts its eventual load", () => {
    const { queue, onStart, complete, state } = setup(["a", "b", "c"]);
    vi.advanceTimersByTime(20000);
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b", "c"]);
    expect(state().states.get("a")).toBe("slow");
    queue.enqueue("a");
    queue.cancelPending("a");
    expect(state().states.get("a")).toBe("slow");
    complete("a");
    expect(state().states.get("a")).toBe("loaded");
    queue.dispose();
  });

  it("paces repeated navigations, coalesces pending reloads, and ignores old completions", () => {
    const { queue, onStart, complete, state } = setup(["a"]);
    const firstRequest = state().requests.get("a")!;
    queue.enqueue("a");
    queue.enqueue("a");
    complete("a");
    vi.advanceTimersByTime(500);
    expect(onStart).toHaveBeenCalledTimes(2);
    queue.settle("a", firstRequest, "loaded");
    expect(state().states.get("a")).toBe("loading");
    complete("a");
    expect(state().states.get("a")).toBe("loaded");
    queue.dispose();
  });

  it("keeps a source page's own navigation instead of overwriting it with a queued URL", () => {
    const { queue, onStart, complete } = setup(["a"]);
    complete("a");
    queue.enqueue("a");
    queue.cancelPending("a");
    vi.advanceTimersByTime(1000);
    expect(onStart).toHaveBeenCalledTimes(1);
    queue.dispose();
  });

  it("does not retry failures automatically and cancels queued work on close or refresh", () => {
    const { queue, onStart, state } = setup();
    queue.settle("a", state().requests.get("a")!, "error");
    expect(state().states.get("a")).toBe("error");
    queue.dispose();
    vi.advanceTimersByTime(60000);
    queue.enqueue("a");
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
