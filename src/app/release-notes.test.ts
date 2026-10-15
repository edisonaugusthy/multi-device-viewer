import { describe, expect, it } from "vitest";
import { CURRENT_RELEASE_NOTES, decideStartupNotice, FEATURE_TOUR_REVISION } from "./release-notes";

describe("decideStartupNotice", () => {
  const current = CURRENT_RELEASE_NOTES.version;
  const base = { useCount: 4, firstRunComplete: true, pendingVersion: null, lastSeenVersion: current, lastSeenTour: FEATURE_TOUR_REVISION };

  it("waits for startup storage to load", () => {
    expect(decideStartupNotice({ ...base, useCount: 0, firstRunComplete: false, pendingVersion: current, lastSeenVersion: null, lastSeenTour: null })).toEqual({ kind: "none" });
  });

  it("shows only the tour on a fresh install", () => {
    expect(decideStartupNotice({ ...base, useCount: 1, firstRunComplete: false, lastSeenTour: null })).toEqual({ kind: "welcome" });
  });

  it("prioritizes the tour if an update arrives before first use", () => {
    expect(decideStartupNotice({ ...base, useCount: 1, firstRunComplete: false, pendingVersion: current, lastSeenVersion: "0.2.10", lastSeenTour: null })).toEqual({ kind: "welcome" });
  });

  it.each(["0.1.5", "0.2.10", current])("shows the notes, then the new tour, after an update from pending version %s", pendingVersion => {
    expect(decideStartupNotice({ ...base, pendingVersion, lastSeenVersion: "0.2.11", lastSeenTour: null })).toEqual({ kind: "release", version: current, tourAfter: true });
  });

  it("shows only the notes when this tour was already seen", () => {
    expect(decideStartupNotice({ ...base, pendingVersion: current, lastSeenVersion: "0.2.11" })).toEqual({ kind: "release", version: current, tourAfter: false });
  });

  it("shows a missed tour on the next visit", () => {
    expect(decideStartupNotice({ ...base, lastSeenTour: null })).toEqual({ kind: "tour" });
    expect(decideStartupNotice({ ...base, lastSeenTour: "0.2.11" })).toEqual({ kind: "tour" });
  });

  it.each([null, "0.2.10", current])("does not repeat the notes or tour with pending version %s", pendingVersion => {
    expect(decideStartupNotice({ ...base, pendingVersion })).toEqual({ kind: "none" });
  });

  it("does not open anything on an ordinary visit", () => {
    expect(decideStartupNotice(base)).toEqual({ kind: "none" });
  });

  it("leads with HomeView and groups the latest improvements", () => {
    expect(CURRENT_RELEASE_NOTES.featured.title).toBe("releaseHomeViewTitle");
    expect(CURRENT_RELEASE_NOTES.sections.map(section => section.title)).toEqual([
      "releaseSectionDevices",
      "releaseSectionViews",
      "releaseSectionReview",
      "releaseSectionGeneral",
    ]);
    const titles = CURRENT_RELEASE_NOTES.sections.flatMap(section => section.notes.map(note => note.title));
    expect(titles).toHaveLength(5);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
