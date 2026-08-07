import { describe, expect, it } from "vitest";
import { getKeyboardScrollDelta, shouldKeepKeyboardSessionOnBlur } from "./mobile-keyboard";

describe("mobile keyboard focused-field visibility", () => {
  it("keeps the keyboard session when a simulated key temporarily moves focus outside the iframe", () => {
    expect(shouldKeepKeyboardSessionOnBlur({
      documentHasFocus: false,
      activeEditableConnected: true,
    })).toBe(true);
  });

  it("allows a real in-page blur to close the keyboard", () => {
    expect(shouldKeepKeyboardSessionOnBlur({
      documentHasFocus: true,
      activeEditableConnected: true,
    })).toBe(false);
  });

  it("moves an iOS field above the overlaid keyboard", () => {
    expect(getKeyboardScrollDelta({
      rect: { top: 640, bottom: 684 },
      viewportHeight: 707,
      occludedBottom: 198,
      platform: "ios",
    })).toBe(189);
  });

  it("does not move Android content that fits in the resized viewport", () => {
    expect(getKeyboardScrollDelta({
      rect: { top: 220, bottom: 268 },
      viewportHeight: 340,
      occludedBottom: 0,
      platform: "android",
    })).toBe(0);
  });

  it("moves an Android field only when resize alone cannot reveal it", () => {
    expect(getKeyboardScrollDelta({
      rect: { top: 310, bottom: 372 },
      viewportHeight: 340,
      occludedBottom: 0,
      platform: "android",
    })).toBe(42);
  });

  it("pulls a field down from behind the top browser chrome", () => {
    expect(getKeyboardScrollDelta({
      rect: { top: -18, bottom: 26 },
      viewportHeight: 600,
      occludedBottom: 180,
      platform: "ios",
    })).toBe(-30);
  });
});
