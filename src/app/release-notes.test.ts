import { describe, expect, it } from "vitest";
import { CURRENT_RELEASE_NOTES, decideStartupNotice } from "./release-notes";

describe("decideStartupNotice", () => {
  it("waits for startup storage to load", () => {
    expect(decideStartupNotice({ useCount: 0, firstRunComplete: false, pendingVersion: CURRENT_RELEASE_NOTES.version, lastSeenVersion: null })).toEqual({ kind: "none" });
  });

  it("shows only welcome on a fresh install", () => {
    expect(decideStartupNotice({ useCount: 1, firstRunComplete: false, pendingVersion: null, lastSeenVersion: CURRENT_RELEASE_NOTES.version })).toEqual({ kind: "welcome" });
  });

  it.each(["0.1.5", "0.2.9", "0.2.10", CURRENT_RELEASE_NOTES.version])("shows only current notes when the pending version is %s", pendingVersion => {
    expect(decideStartupNotice({ useCount: 4, firstRunComplete: true, pendingVersion, lastSeenVersion: "0.1.4" })).toEqual({ kind: "release", version: CURRENT_RELEASE_NOTES.version });
  });

  it.each([null, "0.2.10", CURRENT_RELEASE_NOTES.version])("does not repeat the current notes with pending version %s", pendingVersion => {
    expect(decideStartupNotice({ useCount: 5, firstRunComplete: true, pendingVersion, lastSeenVersion: CURRENT_RELEASE_NOTES.version })).toEqual({ kind: "none" });
  });

  it("does not open release notes on an ordinary visit", () => {
    expect(decideStartupNotice({ useCount: 4, firstRunComplete: true, pendingVersion: null, lastSeenVersion: "0.2.10" })).toEqual({ kind: "none" });
  });

  it("prioritizes welcome if an update arrives before first use", () => {
    expect(decideStartupNotice({ useCount: 1, firstRunComplete: false, pendingVersion: CURRENT_RELEASE_NOTES.version, lastSeenVersion: "0.2.10" })).toEqual({ kind: "welcome" });
  });

  it("keeps the current update focused on All devices, its controls, and startup", () => {
    expect(CURRENT_RELEASE_NOTES.notes.map(note => note.title)).toEqual([
      "releaseAllDevicesTitle",
      "releaseGalleryControlsTitle",
      "releaseStartupTitle",
    ]);
    expect(CURRENT_RELEASE_NOTES.notes[0]?.featured).toBe(true);
  });
});
