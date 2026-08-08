import { describe, expect, it } from "vitest";
import { decideStartupNotice, releaseNotesFor } from "./release-notes";

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

  it("keeps the 0.2.1 update concise", () => {
    const release = releaseNotesFor("0.2.1");

    expect(release.heading).toBe("What’s new");
    expect(release.notes.map((note) => note.title)).toEqual([
      "Four new 2026 Galaxy devices, with every posture",
      "A guided first run",
    ]);
    expect(release.notes[0]?.description).toContain("marked NEW");
    expect(release.notes[1]?.description).toContain("eight-step");
    expect(release.notes[1]?.description).toContain("focusing one viewport");
  });

  it("highlights record user flow in the 0.2.4 release", () => {
    const release = releaseNotesFor("0.2.4");

    expect(release.notes.map((note) => note.title)).toEqual([
      "A localized workspace",
      "Record user flow",
      "Refined Liquid Glass previews",
    ]);
    expect(release.notes[1]?.featured).toBe(true);
    expect(release.notes[2]?.description).toContain("Liquid Glass");
  });
});
