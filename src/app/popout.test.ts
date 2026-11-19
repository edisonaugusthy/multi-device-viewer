import { afterEach, describe, expect, it, vi } from "vitest";
import { offerPopOut, onPopOutOffer, popOutScale, popOutWindowSize, takePopOut, type PopOutWindow } from "./popout";

const screen = { width: 1512, height: 944 };
describe("always-on-top window", () => {
  it("opens at exactly the phone's size when that fits the screen", () => {
    const frame = { width: 430, height: 700 };
    const size = popOutWindowSize(frame, screen);
    expect(size).toEqual(frame);
    expect(popOutScale(frame, size)).toBe(1);
  });
  it("shrinks a tall phone or a wide laptop to fit, keeping its shape so the device fills the window", () => {
    for (const frame of [{ width: 440, height: 920 }, { width: 1620, height: 1010 }]) {
      const size = popOutWindowSize(frame, screen);
      expect(size.width).toBeLessThanOrEqual(560);
      expect(size.height).toBeLessThanOrEqual(screen.height * 0.8);
      const scale = popOutScale(frame, size);
      expect(scale).toBeLessThan(1);
      // No more than a rounding pixel of backdrop on any side.
      expect(Math.abs(size.width - frame.width * scale)).toBeLessThan(1);
      expect(Math.abs(size.height - frame.height * scale)).toBeLessThan(1);
    }
  });
  it("fits the device to a resized window, up to 160%", () => {
    const frame = { width: 400, height: 800 };
    expect(popOutScale(frame, { width: 200, height: 2000 })).toBeCloseTo(0.5);
    expect(popOutScale(frame, { width: 4000, height: 4000 })).toBe(1.6);
    expect(popOutScale(frame, { width: 10, height: 10 })).toBe(0.1);
  });
});

describe("a window opened for a device that is not on the page yet", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const fakeWindow = () => {
    const listeners: Array<() => void> = [];
    return { win: { close: vi.fn(), addEventListener: (_type: string, listener: () => void) => { listeners.push(listener); } } as unknown as PopOutWindow, hide: () => listeners.forEach(listener => listener()) };
  };
  it("waits for the floating view that shows that device, and is handed over once", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const { win } = fakeWindow();
    const heard = vi.fn();
    const stop = onPopOutOffer(heard);
    offerPopOut({ win, deviceId: "pixel" });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(takePopOut(id => id === "iphone")).toBeNull();
    expect(takePopOut(id => id === "pixel")).toEqual({ win, deviceId: "pixel" });
    expect(takePopOut(() => true)).toBeNull();
    vi.advanceTimersByTime(9000);
    expect(win.close).not.toHaveBeenCalled();
    stop();
  });
  it("closes an unclaimed window instead of leaving it empty, and forgets one the person closed", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const unclaimed = fakeWindow();
    offerPopOut({ win: unclaimed.win, deviceId: "pixel" });
    vi.advanceTimersByTime(9000);
    expect(unclaimed.win.close).toHaveBeenCalledTimes(1);
    expect(takePopOut(() => true)).toBeNull();
    const closed = fakeWindow();
    offerPopOut({ win: closed.win, deviceId: "pixel" });
    closed.hide();
    expect(takePopOut(() => true)).toBeNull();
  });
});
