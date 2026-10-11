import { createReviewCoordinator, LEGACY_REVIEW_DISMISSED_KEY, REVIEW_PROMPT_STORAGE_KEY, type ReviewCommand, type ReviewResponse } from "../domain/review/review-coordinator";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

// The standalone dev preview has no extension background, so it keeps review
// state itself. Production builds leave this out of the viewer bundle.
const localCoordinator = import.meta.env.DEV ? createReviewCoordinator({
  read: async () => ({
    state: await readStore<unknown>(REVIEW_PROMPT_STORAGE_KEY, null),
    legacyDismissed: await readStore(LEGACY_REVIEW_DISMISSED_KEY, false),
  }),
  write: state => writeStore(REVIEW_PROMPT_STORAGE_KEY, state),
  openReviewPage: async () => { throw new Error("Open the installed extension to leave a review."); },
}) : undefined;

export async function dispatchReview(command: ReviewCommand): Promise<ReviewResponse> {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    if (!localCoordinator) throw new Error("Review preferences are unavailable.");
    return localCoordinator(command);
  }
  const result = await chrome.runtime.sendMessage({ type: "MDV_REVIEW", command });
  if (!result?.ok) throw new Error(result?.error ?? "Review preferences are unavailable. Please try again.");
  return result.result as ReviewResponse;
}
