import { describe, expect, it } from "vitest";
import {
  REVIEW_PROMPT_POLICY,
  createReviewPromptState,
  finishReviewPrompt,
  isReviewPromptEligible,
  normalizeReviewPromptState,
  postponeReviewPrompt,
  recordPromptShown,
  recordQualifiedSession,
  recordReviewPageOpened,
  recordSuccessfulAction,
  reviewEligibilityReason,
  reviewPromptReadyAt,
} from "./review-prompt";

const DAY_MS = 24 * 60 * 60 * 1000;
const installedAt = Date.UTC(2026, 7, 1);
const firstShownAt = installedAt + 7 * DAY_MS;

function eligibleState() {
  return {
    ...createReviewPromptState(installedAt),
    qualifiedSessions: REVIEW_PROMPT_POLICY.minimumQualifiedSessions,
  };
}

describe("review prompt policy", () => {
  it("qualifies ordinary multi-device use without special completed actions", () => {
    const ready = eligibleState();
    expect(reviewEligibilityReason(ready, installedAt + 6 * DAY_MS)).toBe("age");
    expect(reviewEligibilityReason({ ...ready, qualifiedSessions: 4 }, firstShownAt)).toBe("sessions");
    expect(ready.successfulActions).toBe(0);
    expect(isReviewPromptEligible(ready, firstShownAt)).toBe(true);
  });

  it("requires 14 days and three return sessions before one reminder", () => {
    const first = recordPromptShown(eligibleState(), firstShownAt);
    const withSessions = { ...first, qualifiedSessions: first.qualifiedSessions + 3 };
    expect(reviewEligibilityReason(withSessions, firstShownAt + 13 * DAY_MS)).toBe("cooldown");
    expect(reviewEligibilityReason({ ...withSessions, qualifiedSessions: 7 }, firstShownAt + 14 * DAY_MS)).toBe("return-sessions");
    expect(isReviewPromptEligible(withSessions, firstShownAt + 14 * DAY_MS)).toBe(true);
    const second = recordPromptShown(withSessions, firstShownAt + 14 * DAY_MS);
    expect(second.promptCount).toBe(2);
    expect(reviewEligibilityReason(second, firstShownAt + 100 * DAY_MS)).toBe("limit");
    expect(recordPromptShown(second, firstShownAt + 100 * DAY_MS)).toBe(second);
    // Exhausting a limit is different from the user's explicit opt-out.
    expect(postponeReviewPrompt(second, firstShownAt + 14 * DAY_MS).outcome).toBe("pending");
  });

  it("records a Store visit without implying a submitted review or an opt-out", () => {
    const first = recordPromptShown(eligibleState(), firstShownAt);
    const opened = recordReviewPageOpened(first, firstShownAt + DAY_MS);
    expect(opened).toMatchObject({ openedCount: 1, lastOpenedAt: firstShownAt + DAY_MS, outcome: "pending", promptCount: 1 });
    const returned = { ...opened, qualifiedSessions: opened.qualifiedSessions + 3 };
    expect(reviewEligibilityReason(returned, firstShownAt + 14 * DAY_MS)).toBe("cooldown");
    expect(isReviewPromptEligible(returned, firstShownAt + 15 * DAY_MS)).toBe(true);
  });

  it("defers requests after a manual Store visit even before the first prompt", () => {
    const opened = recordReviewPageOpened(eligibleState(), firstShownAt);
    expect(opened.promptCount).toBe(0);
    expect(reviewEligibilityReason(opened, firstShownAt)).toBe("cooldown");
    expect(reviewEligibilityReason(opened, firstShownAt + 14 * DAY_MS)).toBe("return-sessions");
    expect(isReviewPromptEligible({ ...opened, qualifiedSessions: 8 }, firstShownAt + 14 * DAY_MS)).toBe(true);
  });

  it("counts postponement once and uses the latest dismissal for cooldown", () => {
    const first = recordPromptShown(eligibleState(), firstShownAt);
    const postponed = postponeReviewPrompt(first, firstShownAt + DAY_MS);
    expect(postponed).toMatchObject({ postponedCount: 1, lastPostponedAt: firstShownAt + DAY_MS, outcome: "pending" });
    expect(postponeReviewPrompt(postponed, firstShownAt + 2 * DAY_MS)).toBe(postponed);
    expect(reviewPromptReadyAt(postponed)).toBe(firstShownAt + 15 * DAY_MS);
    expect(postponeReviewPrompt(eligibleState(), firstShownAt)).toEqual(eligibleState());
  });

  it("permanently honors an opt-out while the manual link still works", () => {
    const stopped = finishReviewPrompt(eligibleState(), "never");
    expect(isReviewPromptEligible(stopped, installedAt + 365 * DAY_MS)).toBe(false);
    expect(recordQualifiedSession(stopped)).toBe(stopped);
    expect(recordSuccessfulAction(stopped)).toBe(stopped);
    const opened = recordReviewPageOpened(stopped, firstShownAt);
    expect(opened.outcome).toBe("never");
    expect(opened.openedCount).toBe(1);
  });

  it("migrates an old opened listing while retaining its prompt budget and requiring new sessions", () => {
    const legacy = {
      ...eligibleState(), version: 1, outcome: "opened", promptCount: 1,
      lastPromptAt: firstShownAt, sessionsAtLastPrompt: 4,
    };
    const migrated = normalizeReviewPromptState(legacy, firstShownAt + DAY_MS);
    expect(migrated).toMatchObject({ version: 2, outcome: "pending", openedCount: 1, lastOpenedAt: firstShownAt, promptCount: 1, sessionsAtLastRequest: 5 });
    expect(reviewEligibilityReason(migrated, firstShownAt + 14 * DAY_MS)).toBe("return-sessions");
    expect(isReviewPromptEligible({ ...migrated, qualifiedSessions: 8 }, firstShownAt + 14 * DAY_MS)).toBe(true);
    expect(normalizeReviewPromptState(migrated, firstShownAt + 2 * DAY_MS)).toEqual(migrated);
  });

  it("starts a cooldown for a legacy visit with no timestamp and does not invent a shown prompt", () => {
    const migrated = normalizeReviewPromptState({ ...eligibleState(), outcome: "reviewed" }, firstShownAt);
    expect(migrated).toMatchObject({ outcome: "pending", openedCount: 1, lastOpenedAt: firstShownAt, promptCount: 0 });
    expect(reviewEligibilityReason(migrated, firstShownAt)).toBe("cooldown");
  });

  it("keeps old reminder baselines and every explicit permanent stop", () => {
    const migrated = normalizeReviewPromptState({ sessionsAtLastPrompt: 9 }, installedAt);
    expect(migrated.sessionsAtLastRequest).toBe(9);
    for (const outcome of ["never", "feedback"]) {
      expect(normalizeReviewPromptState({ outcome }, installedAt).outcome).toBe("never");
    }
  });

  it("normalizes malformed stored state without making it eligible", () => {
    const normalized = normalizeReviewPromptState({
      installedAt: "yesterday", qualifiedSessions: -5, successfulActions: Number.NaN,
      promptCount: 99, openedCount: -2, postponedCount: "many", lastOpenedAt: Infinity,
      outcome: "unknown",
    }, installedAt);
    expect(normalized).toEqual({ ...createReviewPromptState(installedAt), promptCount: REVIEW_PROMPT_POLICY.maximumPrompts });
    expect(isReviewPromptEligible(normalized, firstShownAt)).toBe(false);
    expect(reviewEligibilityReason({ ...eligibleState(), promptCount: 1 }, firstShownAt)).toBe("cooldown");
  });
});
