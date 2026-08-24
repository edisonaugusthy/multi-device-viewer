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
  recordSuccessfulAction,
} from "./review-prompt";

const DAY_MS = 24 * 60 * 60 * 1000;
const installedAt = Date.UTC(2026, 7, 1);

function eligibleState() {
  return {
    ...createReviewPromptState(installedAt),
    qualifiedSessions: REVIEW_PROMPT_POLICY.minimumQualifiedSessions,
    successfulActions: REVIEW_PROMPT_POLICY.minimumSuccessfulActions,
  };
}

describe("review prompt policy", () => {
  it("waits for age, qualified sessions, and successful actions", () => {
    const ready = eligibleState();
    expect(isReviewPromptEligible(ready, installedAt + 6 * DAY_MS)).toBe(false);
    expect(
      isReviewPromptEligible(
        { ...ready, qualifiedSessions: 4 },
        installedAt + 7 * DAY_MS,
      ),
    ).toBe(false);
    expect(
      isReviewPromptEligible(
        { ...ready, successfulActions: 2 },
        installedAt + 7 * DAY_MS,
      ),
    ).toBe(false);
    expect(isReviewPromptEligible(ready, installedAt + 7 * DAY_MS)).toBe(true);
  });

  it("waits 30 days and 10 more qualified sessions before one reminder", () => {
    const firstShownAt = installedAt + 7 * DAY_MS;
    const first = recordPromptShown(eligibleState(), firstShownAt);
    const withSessions = {
      ...first,
      qualifiedSessions:
        first.qualifiedSessions +
        REVIEW_PROMPT_POLICY.reminderAdditionalSessions,
    };

    expect(isReviewPromptEligible(withSessions, firstShownAt + 29 * DAY_MS)).toBe(false);
    expect(
      isReviewPromptEligible(
        { ...withSessions, qualifiedSessions: withSessions.qualifiedSessions - 1 },
        firstShownAt + 30 * DAY_MS,
      ),
    ).toBe(false);
    expect(isReviewPromptEligible(withSessions, firstShownAt + 30 * DAY_MS)).toBe(true);

    const second = recordPromptShown(withSessions, firstShownAt + 30 * DAY_MS);
    expect(second.promptCount).toBe(2);
    expect(isReviewPromptEligible(second, firstShownAt + 100 * DAY_MS)).toBe(false);
    expect(postponeReviewPrompt(second).outcome).toBe("never");
  });

  it("permanently stops after review or opt-out", () => {
    for (const outcome of ["reviewed", "never"] as const) {
      const state = finishReviewPrompt(eligibleState(), outcome);
      expect(isReviewPromptEligible(state, installedAt + 365 * DAY_MS)).toBe(false);
      expect(recordQualifiedSession(state)).toBe(state);
      expect(recordSuccessfulAction(state)).toBe(state);
    }
  });

  it("preserves a permanent stop for the removed feedback destination", () => {
    expect(normalizeReviewPromptState({ outcome: "feedback" }, installedAt).outcome).toBe("never");
  });

  it("normalizes malformed stored state without making it eligible", () => {
    expect(
      normalizeReviewPromptState(
        {
          installedAt: "yesterday",
          qualifiedSessions: -5,
          successfulActions: Number.NaN,
          promptCount: 99,
          outcome: "unknown",
        },
        installedAt,
      ),
    ).toEqual({
      ...createReviewPromptState(installedAt),
      promptCount: REVIEW_PROMPT_POLICY.maximumPrompts,
    });
  });
});
