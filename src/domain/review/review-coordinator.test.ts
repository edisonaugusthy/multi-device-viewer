import { describe, expect, it, vi } from "vitest";
import { createReviewCoordinator } from "./review-coordinator";
import { createReviewPromptState, type ReviewPromptState } from "./review-prompt";

const now = Date.UTC(2026, 8, 7);
function fixture(legacyDismissed = false) {
  let stored: ReviewPromptState = { ...createReviewPromptState(now - 8 * 86400000), qualifiedSessions: 5, successfulActions: 3 };
  const open = vi.fn(async () => undefined);
  const command = createReviewCoordinator({
    now: () => now,
    read: async () => ({ state: structuredClone(stored), legacyDismissed }),
    write: async state => { stored = structuredClone(state); },
    openReviewPage: open,
  });
  return { command, open, stored: () => stored };
}

describe("shared review commands", () => {
  it("preserves an opt-out when another viewer reports a late success", async () => {
    const f = fixture();
    await Promise.all([f.command("never"), f.command("success"), f.command("session")]);
    expect(f.stored()).toMatchObject({ outcome: "never", qualifiedSessions: 5, successfulActions: 3 });
    expect((await f.command("present")).presented).toBe(false);
  });
  it("does not lose simultaneous successful actions", async () => {
    const f = fixture();
    await Promise.all([f.command("success"), f.command("success")]);
    expect(f.stored().successfulActions).toBe(5);
  });
  it("grants a prompt to only one of two simultaneous viewers", async () => {
    const f = fixture();
    const results = await Promise.all([f.command("present"), f.command("present")]);
    expect(results.map(r => r.presented)).toEqual([true, false]);
    expect(f.stored().promptCount).toBe(1);
  });
  it("keeps a failed tab open retryable and records only the successful opening", async () => {
    const f = fixture();
    f.open.mockRejectedValueOnce(new Error("Tab creation failed"));
    await expect(f.command("open")).rejects.toThrow("Tab creation failed");
    expect(f.stored().outcome).toBe("pending");
    expect(f.stored()).toMatchObject({ openedCount: 0, lastOpenedAt: null });
    expect((await f.command("open")).state).toMatchObject({ outcome: "pending", openedCount: 1, lastOpenedAt: now });
    expect((await f.command("present")).presented).toBe(false);
    expect(f.open).toHaveBeenCalledTimes(2);
  });
  it("preserves legacy suppression while allowing a manual review", async () => {
    const f = fixture(true);
    expect((await f.command("load")).state.outcome).toBe("never");
    await f.command("open");
    expect(f.open).toHaveBeenCalledOnce();
    expect(f.stored().outcome).toBe("never");
    expect(f.stored().openedCount).toBe(1);
  });
  it("tracks concurrent Store openings without resetting the shown prompt count", async () => {
    const f = fixture();
    await f.command("present");
    await Promise.all([f.command("open"), f.command("open")]);
    expect(f.stored()).toMatchObject({ promptCount: 1, openedCount: 2, outcome: "pending" });
  });
  it("records dismissal once when close commands arrive together", async () => {
    const f = fixture();
    await f.command("present");
    await Promise.all([f.command("postpone"), f.command("postpone")]);
    expect(f.stored()).toMatchObject({ promptCount: 1, postponedCount: 1, lastPostponedAt: now, outcome: "pending" });
  });
  it("initializes install age once and preserves state across later loads", async () => {
    let time = now;
    let stored: unknown;
    const command = createReviewCoordinator({
      now: () => time,
      read: async () => ({ state: stored, legacyDismissed: false }),
      write: async state => { stored = structuredClone(state); },
      openReviewPage: async () => undefined,
    });
    expect((await command("load")).state.installedAt).toBe(now);
    time += 86400000;
    expect((await command("load")).state.installedAt).toBe(now);
  });
});
