import { describe, expect, it } from "vitest";
import { decideStartupNotice } from "./release-notes";

describe("decideStartupNotice", () => {
  it("shows only welcome on a fresh install", () => {
    expect(decideStartupNotice({ useCount: 1, firstRunComplete: false, pendingVersion: null, lastSeenVersion: "0.1.4" })).toEqual({ kind: "welcome" });
  });

  it("shows release notes on the first open after an update", () => {
    expect(decideStartupNotice({ useCount: 4, firstRunComplete: true, pendingVersion: "0.1.5", lastSeenVersion: "0.1.4" })).toEqual({ kind: "release", version: "0.1.5" });
  });

  it("does not repeat release notes after that version is seen", () => {
    expect(decideStartupNotice({ useCount: 5, firstRunComplete: true, pendingVersion: null, lastSeenVersion: "0.1.5" })).toEqual({ kind: "none" });
  });

  it("prioritizes welcome if an update arrives before first use", () => {
    expect(decideStartupNotice({ useCount: 1, firstRunComplete: false, pendingVersion: "0.1.5", lastSeenVersion: "0.1.4" })).toEqual({ kind: "welcome" });
  });
});
