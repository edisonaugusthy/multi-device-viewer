const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_PROMPT_POLICY = {
  minimumInstallAgeMs: 7 * DAY_MS,
  minimumQualifiedSessions: 5,
  reminderDelayMs: 14 * DAY_MS,
  reminderAdditionalSessions: 3,
  maximumPrompts: 2,
} as const;

export type ReviewPromptOutcome =
  | "pending"
  | "never";

export interface ReviewPromptState {
  version: 2;
  revision: number;
  installedAt: number;
  qualifiedSessions: number;
  successfulActions: number;
  promptCount: number;
  lastPromptAt: number | null;
  sessionsAtLastRequest: number;
  openedCount: number;
  lastOpenedAt: number | null;
  postponedCount: number;
  lastPostponedAt: number | null;
  outcome: ReviewPromptOutcome;
}

export function createReviewPromptState(now = Date.now()): ReviewPromptState {
  return {
    version: 2,
    revision: 0,
    installedAt: now,
    qualifiedSessions: 0,
    successfulActions: 0,
    promptCount: 0,
    lastPromptAt: null,
    sessionsAtLastRequest: 0,
    openedCount: 0,
    lastOpenedAt: null,
    postponedCount: 0,
    lastPostponedAt: null,
    outcome: "pending",
  };
}

export function normalizeReviewPromptState(
  value: unknown,
  now = Date.now(),
): ReviewPromptState {
  if (!value || typeof value !== "object") return createReviewPromptState(now);
  const candidate = value as Partial<ReviewPromptState> & { sessionsAtLastPrompt?: unknown };
  const storedOutcome = (value as { outcome?: unknown }).outcome;
  const nonNegativeInteger = (input: unknown) =>
    typeof input === "number" && Number.isInteger(input) && input >= 0
      ? input
      : 0;
  const timestamp = (input: unknown, fallback: number | null) =>
    typeof input === "number" && Number.isFinite(input) && input >= 0
      ? input
      : fallback;
  // Older versions stopped requests as soon as a Store tab opened. Keep that
  // visit and its cooldown, without treating it as a review or an opt-out.
  const legacyOpened = storedOutcome === "opened" || storedOutcome === "reviewed";
  const qualifiedSessions = nonNegativeInteger(candidate.qualifiedSessions);
  const lastPromptAt = timestamp(candidate.lastPromptAt, null);

  return {
    version: 2,
    revision: nonNegativeInteger(candidate.revision),
    installedAt: timestamp(candidate.installedAt, now) ?? now,
    qualifiedSessions,
    successfulActions: nonNegativeInteger(candidate.successfulActions),
    promptCount: Math.min(
      REVIEW_PROMPT_POLICY.maximumPrompts,
      nonNegativeInteger(candidate.promptCount),
    ),
    lastPromptAt,
    sessionsAtLastRequest: legacyOpened ? qualifiedSessions
      : nonNegativeInteger(candidate.sessionsAtLastRequest ?? candidate.sessionsAtLastPrompt),
    openedCount: Math.max(legacyOpened ? 1 : 0, nonNegativeInteger(candidate.openedCount)),
    lastOpenedAt: timestamp(candidate.lastOpenedAt, legacyOpened ? lastPromptAt ?? now : null),
    postponedCount: nonNegativeInteger(candidate.postponedCount),
    lastPostponedAt: timestamp(candidate.lastPostponedAt, null),
    outcome: storedOutcome === "never" || storedOutcome === "feedback" ? "never" : "pending",
  };
}

export function recordQualifiedSession(
  state: ReviewPromptState,
): ReviewPromptState {
  if (state.outcome !== "pending") return state;
  return { ...state, qualifiedSessions: state.qualifiedSessions + 1 };
}

export function recordSuccessfulAction(
  state: ReviewPromptState,
): ReviewPromptState {
  if (state.outcome !== "pending") return state;
  return { ...state, successfulActions: state.successfulActions + 1 };
}

export function isReviewPromptEligible(
  state: ReviewPromptState,
  now = Date.now(),
): boolean {
  return reviewEligibilityReason(state, now) === "eligible";
}

export function recordPromptShown(
  state: ReviewPromptState,
  now = Date.now(),
): ReviewPromptState {
  if (!isReviewPromptEligible(state, now)) return state;
  return {
    ...state,
    promptCount: state.promptCount + 1,
    lastPromptAt: now,
    sessionsAtLastRequest: state.qualifiedSessions,
  };
}

export function postponeReviewPrompt(
  state: ReviewPromptState,
  now = Date.now(),
): ReviewPromptState {
  if (state.outcome !== "pending" || state.lastPromptAt === null ||
    (state.lastPostponedAt !== null && state.lastPostponedAt >= state.lastPromptAt)) return state;
  return {
    ...state,
    postponedCount: state.postponedCount + 1,
    lastPostponedAt: now,
    sessionsAtLastRequest: state.qualifiedSessions,
  };
}

export function recordReviewPageOpened(state: ReviewPromptState, now = Date.now()): ReviewPromptState {
  return {
    ...state,
    openedCount: state.openedCount + 1,
    lastOpenedAt: now,
    sessionsAtLastRequest: state.qualifiedSessions,
  };
}

export function finishReviewPrompt(
  state: ReviewPromptState,
  outcome: Exclude<ReviewPromptOutcome, "pending">,
): ReviewPromptState {
  return { ...state, outcome };
}

export type ReviewEligibilityReason = "eligible" | "age" | "sessions" | "cooldown" | "return-sessions" | "limit" | "never";

export function reviewPromptReadyAt(state: ReviewPromptState): number {
  const lastRequestAt = Math.max(state.lastPromptAt ?? -Infinity, state.lastOpenedAt ?? -Infinity, state.lastPostponedAt ?? -Infinity);
  return Math.max(
    state.installedAt + REVIEW_PROMPT_POLICY.minimumInstallAgeMs,
    Number.isFinite(lastRequestAt) ? lastRequestAt + REVIEW_PROMPT_POLICY.reminderDelayMs : 0,
  );
}

export function reviewEligibilityReason(state: ReviewPromptState, now = Date.now()): ReviewEligibilityReason {
  if (state.outcome !== "pending") return state.outcome;
  if (state.promptCount >= REVIEW_PROMPT_POLICY.maximumPrompts) return "limit";
  if (now - state.installedAt < REVIEW_PROMPT_POLICY.minimumInstallAgeMs) return "age";
  if (state.qualifiedSessions < REVIEW_PROMPT_POLICY.minimumQualifiedSessions) return "sessions";
  if (state.promptCount > 0 || state.lastOpenedAt !== null) {
    if ((state.lastPromptAt === null && state.lastOpenedAt === null) || now < reviewPromptReadyAt(state)) return "cooldown";
    if (state.qualifiedSessions - state.sessionsAtLastRequest < REVIEW_PROMPT_POLICY.reminderAdditionalSessions) return "return-sessions";
  }
  return "eligible";
}
