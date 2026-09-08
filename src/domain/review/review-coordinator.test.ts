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
    expect((await f.command("open")).state.outcome).toBe("opened");
    expect(f.open).toHaveBeenCalledTimes(2);
  });
  it("preserves legacy suppression while allowing a manual review", async () => {
    const f = fixture(true);
    expect((await f.command("load")).state.outcome).toBe("never");
    await f.command("open");
    expect(f.open).toHaveBeenCalledOnce();
    expect(f.stored().outcome).toBe("never");
  });
});
