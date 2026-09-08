import {
  finishReviewPrompt,
  isReviewPromptEligible,
  normalizeReviewPromptState,
  postponeReviewPrompt,
  recordPromptShown,
  recordQualifiedSession,
  recordSuccessfulAction,
  type ReviewPromptState,
} from "./review-prompt";

export const REVIEW_PROMPT_STORAGE_KEY = "mdvReviewPromptState";
export const LEGACY_REVIEW_DISMISSED_KEY = "mdvReviewDismissed";
export const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/mobile-view-device-emulat/jfcnekmenjickfihkniaoaklehjmdhdb";
export const SUPPORT_URL = "https://github.com/edisonaugusthy/multi-device-viewer/issues/new/choose";

export type ReviewCommand = "load" | "session" | "success" | "present" | "postpone" | "never" | "open";
export interface ReviewResponse { state: ReviewPromptState; presented: boolean }

interface ReviewDependencies {
  read: () => Promise<{ state: unknown; legacyDismissed: boolean }>;
  write: (state: ReviewPromptState) => Promise<void>;
  openReviewPage: () => Promise<void>;
  now?: () => number;
}

/** All viewer instances send commands here; no viewer writes a stale snapshot. */
export function createReviewCoordinator(dependencies: ReviewDependencies) {
  let queue: Promise<unknown> = Promise.resolve();
  return (command: ReviewCommand): Promise<ReviewResponse> => {
    const operation = queue.then(async () => {
      const stored = await dependencies.read();
      const now = dependencies.now?.() ?? Date.now();
      let state = normalizeReviewPromptState(stored.state, now);
      if (stored.legacyDismissed) state = finishReviewPrompt(state, "never");
      let presented = false;
      switch (command) {
        case "session": state = recordQualifiedSession(state); break;
        case "success": state = recordSuccessfulAction(state); break;
        case "present":
          presented = isReviewPromptEligible(state, now);
          if (presented) state = recordPromptShown(state, now);
          break;
        case "postpone": state = postponeReviewPrompt(state); break;
        case "never": state = finishReviewPrompt(state, "never"); break;
        case "open":
          // A successful tab creation is evidence of an opened listing, not a submitted review.
          await dependencies.openReviewPage();
          if (state.outcome !== "never") state = finishReviewPrompt(state, "opened");
          break;
      }
      state = { ...state, revision: state.revision + 1 };
      await dependencies.write(state);
      return { state, presented };
    });
    // Failed opening/storage must not poison later retries.
    queue = operation.catch(() => undefined);
    return operation;
  };
}

export function isReviewCommand(value: unknown): value is ReviewCommand {
  return typeof value === "string" && ["load", "session", "success", "present", "postpone", "never", "open"].includes(value);
}
