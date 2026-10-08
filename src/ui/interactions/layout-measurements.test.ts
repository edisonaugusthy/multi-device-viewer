import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { scheduleLayoutMeasurement } from "./layout-measurements";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => setTimeout(callback, 16));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
});
afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it("batches every read before writes so 109 cards do not force 109 layouts", () => {
  const steps: string[] = [];
  for (let i = 0; i < 109; i++) scheduleLayoutMeasurement(() => { steps.push("read"); return () => { steps.push("write"); }; });
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(16);
  expect(steps).toEqual([...Array(109).fill("read"), ...Array(109).fill("write")]);
});

it("does not measure or write to unmounted previews", () => {
  const read = vi.fn();
  const cancel = scheduleLayoutMeasurement(read);
  cancel();
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(16);
  expect(read).not.toHaveBeenCalled();
  const write = vi.fn();
  const cancelDuringRead = scheduleLayoutMeasurement(() => write);
  scheduleLayoutMeasurement(() => { cancelDuringRead(); return undefined; });
  vi.advanceTimersByTime(16);
  expect(write).not.toHaveBeenCalled();
});
