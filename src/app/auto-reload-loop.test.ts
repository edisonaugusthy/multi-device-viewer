import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHECK_EVERY_MS, DOWN_EVERY_MS, SETTLE_MS, startAutoReloadLoop } from "./auto-reload-loop";

function setup() {
  const state = { paused: false, asleep: false, pending: false, down: false, results: [] as boolean[] };
  const check = vi.fn(async (_pages: string[]) => state.results.shift() ?? false);
  const onChange = vi.fn();
  const loop = startAutoReloadLoop({
    watch: { check, get pending() { return state.pending; }, get down() { return state.down; } },
    pages: () => ["http://localhost:3000/"], paused: () => state.paused, asleep: () => state.asleep, onChange,
  });
  return { state, check, onChange, loop };
}

describe("the auto reload loop", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("checks about once a second, sooner while a change settles, and reloads once per change", async () => {
    const { state, check, onChange, loop } = setup();
    await vi.advanceTimersByTimeAsync(0);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith(["http://localhost:3000/"]);
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS - 1);
    expect(check).toHaveBeenCalledTimes(1);
    state.pending = true;
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
    state.results = [true];
    state.pending = false;
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(check).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 3);
    expect(onChange).toHaveBeenCalledTimes(1);
    loop.stop();
  });

  it("asks a server that is not running less often", async () => {
    const { state, check, loop } = setup();
    state.down = true;
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(DOWN_EVERY_MS - 1);
    expect(check).toHaveBeenCalledTimes(1);
    state.down = false;
    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    expect(check).toHaveBeenCalledTimes(3);
    loop.stop();
  });

  it("asks nothing while paused, keeps a change found just before, and shows it when the pause ends", async () => {
    const { state, check, onChange, loop } = setup();
    await vi.advanceTimersByTimeAsync(0);
    // A capture starts while the check that finds the change is still under way.
    check.mockImplementationOnce(async () => { state.paused = true; return true; });
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    expect(onChange).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 3);
    expect(check).toHaveBeenCalledTimes(2);
    state.paused = false;
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    expect(onChange).toHaveBeenCalledTimes(1);
    loop.stop();
  });

  it("sleeps while nobody can see the previews and starts again when woken", async () => {
    const { state, check, loop } = setup();
    await vi.advanceTimersByTimeAsync(0);
    state.asleep = true;
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 5);
    expect(check).toHaveBeenCalledTimes(1);
    state.asleep = false;
    loop.wake();
    await vi.advanceTimersByTimeAsync(0);
    expect(check).toHaveBeenCalledTimes(2);
    // Waking again does not start a second run beside the first.
    loop.wake();
    loop.wake();
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    expect(check).toHaveBeenCalledTimes(4);
    loop.stop();
  });

  it("stops for good, even with a check under way, and survives a check that fails", async () => {
    const { check, onChange, loop } = setup();
    check.mockRejectedValueOnce(new Error("boom"));
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    expect(check).toHaveBeenCalledTimes(2);
    let finish: (changed: boolean) => void = () => {};
    check.mockImplementationOnce(() => new Promise<boolean>(resolve => { finish = resolve; }));
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS);
    loop.stop();
    finish(true);
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 3);
    expect(check).toHaveBeenCalledTimes(3);
    expect(onChange).not.toHaveBeenCalled();
  });
});
