import { afterEach, expect, it, vi } from "vitest";
import { createSurfaceScheduler } from "./surface-scheduler";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function setup() {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 16));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  const sample = vi.fn();
  return { sample, scheduler: createSurfaceScheduler(sample) };
}

it("bounds continuous animation work while still sampling the final change", () => {
  const { scheduler, sample } = setup();
  for (let i = 0; i < 60; i++) {
    scheduler.request();
    scheduler.request();
    vi.advanceTimersByTime(16);
  }
  expect(sample.mock.calls.length).toBeGreaterThan(1);
  expect(sample.mock.calls.length).toBeLessThanOrEqual(10);
  const before = sample.mock.calls.length;
  scheduler.request();
  vi.advanceTimersByTime(150);
  expect(sample).toHaveBeenCalledTimes(before + 1);
});

it("cancels both pending timers and frames when a preview is hidden", () => {
  const { scheduler, sample } = setup();
  scheduler.request();
  scheduler.cancel();
  vi.advanceTimersByTime(200);
  expect(sample).not.toHaveBeenCalled();
  scheduler.request();
  vi.advanceTimersByTime(1);
  scheduler.cancel();
  vi.advanceTimersByTime(200);
  expect(sample).not.toHaveBeenCalled();
  scheduler.request();
  vi.advanceTimersByTime(20);
  expect(sample).toHaveBeenCalledTimes(1);
});
