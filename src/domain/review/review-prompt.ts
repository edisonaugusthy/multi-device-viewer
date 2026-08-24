const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_PROMPT_POLICY = {
  minimumInstallAgeMs: 7 * DAY_MS,
  minimumQualifiedSessions: 5,
  minimumSuccessfulActions: 3,
  reminderDelayMs: 30 * DAY_MS,
  reminderAdditionalSessions: 10,
  maximumPrompts: 2,
} as const;

export type ReviewPromptOutcome =
  | "pending"
  | "reviewed"
  | "never";

export interface ReviewPromptState {
  version: 1;
  installedAt: number;
  qualifiedSessions: number;
  successfulActions: number;
  promptCount: number;
  lastPromptAt: number | null;
  sessionsAtLastPrompt: number;
  outcome: ReviewPromptOutcome;
}

export function createReviewPromptState(now = Date.now()): ReviewPromptState {
  return {
    version: 1,
    installedAt: now,
    qualifiedSessions: 0,
    successfulActions: 0,
    promptCount: 0,
    lastPromptAt: null,
    sessionsAtLastPrompt: 0,
    outcome: "pending",
  };
}

export function normalizeReviewPromptState(
  value: unknown,
  now = Date.now(),
): ReviewPromptState {
  if (!value || typeof value !== "object") return createReviewPromptState(now);
  const candidate = value as Partial<ReviewPromptState>;
  const storedOutcome = (value as { outcome?: unknown }).outcome;
  const nonNegativeInteger = (input: unknown) =>
    typeof input === "number" && Number.isInteger(input) && input >= 0
      ? input
      : 0;
  const timestamp = (input: unknown, fallback: number | null) =>
    typeof input === "number" && Number.isFinite(input) && input >= 0
      ? input
      : fallback;
  const outcomes: ReviewPromptOutcome[] = [
    "pending",
    "reviewed",
    "never",
  ];

  return {
    version: 1,
    installedAt: timestamp(candidate.installedAt, now) ?? now,
    qualifiedSessions: nonNegativeInteger(candidate.qualifiedSessions),
    successfulActions: nonNegativeInteger(candidate.successfulActions),
    promptCount: Math.min(
      REVIEW_PROMPT_POLICY.maximumPrompts,
      nonNegativeInteger(candidate.promptCount),
    ),
    lastPromptAt: timestamp(candidate.lastPromptAt, null),
    sessionsAtLastPrompt: nonNegativeInteger(candidate.sessionsAtLastPrompt),
    outcome:
      storedOutcome === "feedback"
        ? "never"
        : outcomes.includes(storedOutcome as ReviewPromptOutcome)
          ? (storedOutcome as ReviewPromptOutcome)
          : "pending",
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
  if (state.outcome !== "pending") return false;
  if (state.promptCount >= REVIEW_PROMPT_POLICY.maximumPrompts) return false;
  if (
    now - state.installedAt <
    REVIEW_PROMPT_POLICY.minimumInstallAgeMs
  )
    return false;
  if (
    state.qualifiedSessions <
    REVIEW_PROMPT_POLICY.minimumQualifiedSessions
  )
    return false;
  if (
    state.successfulActions <
    REVIEW_PROMPT_POLICY.minimumSuccessfulActions
  )
    return false;

  if (state.promptCount === 0) return true;
  if (state.lastPromptAt === null) return false;
  if (
    now - state.lastPromptAt < REVIEW_PROMPT_POLICY.reminderDelayMs
  )
    return false;
  return (
    state.qualifiedSessions - state.sessionsAtLastPrompt >=
    REVIEW_PROMPT_POLICY.reminderAdditionalSessions
  );
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
    sessionsAtLastPrompt: state.qualifiedSessions,
  };
}

export function postponeReviewPrompt(
  state: ReviewPromptState,
): ReviewPromptState {
  return state.promptCount >= REVIEW_PROMPT_POLICY.maximumPrompts
    ? { ...state, outcome: "never" }
    : state;
}

export function finishReviewPrompt(
  state: ReviewPromptState,
  outcome: Exclude<ReviewPromptOutcome, "pending">,
): ReviewPromptState {
  return { ...state, outcome };
}
