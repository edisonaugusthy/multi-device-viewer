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

  it("starts six pages in parallel and replenishes completed slots without timers", () => {
    const ids = Array.from({ length: 150 }, (_, i) => `device-${i}`);
    const onStart = vi.fn();
    let snapshot: GalleryLoadSnapshot;
    const queue = createGalleryLoadQueue([...ids, ids[0]], { onStart, onChange: next => { snapshot = next; } });
    queue.start();
    expect(onStart).toHaveBeenCalledTimes(6);
    for (const [index, id] of ids.entries()) {
      expect(onStart).toHaveBeenCalledTimes(Math.min(ids.length, index + 6));
      queue.settle(id, snapshot!.requests.get(id)!, "loaded");
    }
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(ids);
    expect([...snapshot!.states.values()].every(value => value === "loaded")).toBe(true);
    queue.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("continues starting other devices when preparation fails synchronously", () => {
    const onChange = vi.fn();
    const onStart = vi.fn((id: string) => { if (id === "a") throw new Error("Unavailable"); });
    const queue = createGalleryLoadQueue(["a", "b", "c"], { onStart, onChange });
    queue.start();
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a", "b", "c"]);
    expect([...onChange.mock.lastCall![0].states.values()]).toEqual(["error", "loading", "loading"]);
    expect(onChange).toHaveBeenCalledTimes(1);
    queue.dispose();
  });

  it("keeps document snapshots stable for progress updates and immutable on new starts", () => {
    const { queue, state, complete } = setup();
    const initial = state().requests;
    complete("a");
    expect(state().requests).toBe(initial);
    vi.advanceTimersByTime(500);
    expect(state().requests).not.toBe(initial);
    expect(initial.has("b")).toBe(false);
    const next = state().requests;
    queue.enqueue("a");
    expect(state().requests).toBe(next);
    queue.cancelPending("a");
    expect(state().requests).toBe(next);
    queue.dispose();
  });

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

  it("waits for preferences before starting, then applies gentle pacing", () => {
    const onStart = vi.fn();
    const queue = createGalleryLoadQueue(["a", "b", "c"], { onStart, onChange: vi.fn() });
    queue.configure({ paused: true });
    queue.start();
    vi.advanceTimersByTime(5000);
    expect(onStart).not.toHaveBeenCalled();
    queue.configure({ concurrency: 2, intervalMs: 1000 });
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a"]);
    vi.advanceTimersByTime(1000);
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a", "b"]);
    vi.advanceTimersByTime(5000);
    expect(onStart).toHaveBeenCalledTimes(2);
    queue.dispose();
  });

  it("pauses pending starts and navigation while retaining completed pages", () => {
    const { queue, onStart, complete, state } = setup();
    queue.configure({ concurrency: 2, intervalMs: 1000, paused: true });
    complete("a");
    queue.enqueue("a");
    vi.advanceTimersByTime(60000);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(state().requests.size).toBe(1);
    queue.cancelPending("a");
    expect(state().states.get("a")).toBe("loaded");
    queue.prioritize(["e"]);
    queue.configure({ concurrency: 2, intervalMs: 1000 });
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a", "e"]);
    vi.advanceTimersByTime(999);
    expect(onStart).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a", "e", "b"]);
    queue.dispose();
  });

  it("changes loading speed without restarting pages or leaving old timers", () => {
    const { queue, onStart, complete } = setup();
    queue.configure({ concurrency: 2, intervalMs: 1000 });
    vi.advanceTimersByTime(500);
    expect(onStart).toHaveBeenCalledTimes(1);
    queue.configure({});
    expect(onStart.mock.calls.map(([id]) => id)).toEqual(["a", "b", "c", "d", "e"]);
    queue.configure({ concurrency: 1, intervalMs: 1000 });
    queue.enqueue("a");
    for (const id of ["a", "b", "c", "d"]) complete(id);
    vi.advanceTimersByTime(1000);
    expect(onStart).toHaveBeenCalledTimes(5);
    complete("e");
    expect(onStart).toHaveBeenCalledTimes(6);
    queue.dispose();
    queue.configure({});
    expect(vi.getTimerCount()).toBe(0);
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

  it("keeps stalled network loads within the limit and accepts their eventual completion", () => {
    const { queue, onStart, complete, state } = setup(["a", "b", "c"]);
    vi.advanceTimersByTime(60000);
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b"]);
    expect(state().states.get("a")).toBe("slow");
    complete("a");
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b", "c"]);
    expect(state().states.get("a")).toBe("loaded");
    queue.dispose();
  });

  it("retries a stalled page in its existing slot and rejects its old completion", () => {
    const { queue, onStart, state } = setup(["a", "b", "c"]);
    const old = state().requests.get("a")!;
    vi.advanceTimersByTime(60000);
    queue.configure({ concurrency: 2, paused: true });
    queue.retry("a");
    expect(onStart).toHaveBeenCalledTimes(2);
    queue.configure({ concurrency: 2 });
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b", "a"]);
    queue.settle("a", old, "loaded");
    expect(state().states.get("a")).toBe("loading");
    queue.settle("a", state().requests.get("a")!, "incomplete");
    expect(state().states.get("a")).toBe("incomplete");
    expect(onStart.mock.calls.map(call => call[0])).toEqual(["a", "b", "a", "c"]);
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
