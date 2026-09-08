import { createReviewCoordinator, LEGACY_REVIEW_DISMISSED_KEY, REVIEW_PROMPT_STORAGE_KEY, type ReviewCommand, type ReviewResponse } from "../domain/review/review-coordinator";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

const localCoordinator = createReviewCoordinator({
  read: async () => ({
    state: await readStore<unknown>(REVIEW_PROMPT_STORAGE_KEY, null),
    legacyDismissed: await readStore(LEGACY_REVIEW_DISMISSED_KEY, false),
  }),
  write: state => writeStore(REVIEW_PROMPT_STORAGE_KEY, state),
  openReviewPage: async () => { throw new Error("Open the installed extension to leave a review."); },
});

export async function dispatchReview(command: ReviewCommand): Promise<ReviewResponse> {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) return localCoordinator(command);
  const result = await chrome.runtime.sendMessage({ type: "MDV_REVIEW", command });
  if (!result?.ok) throw new Error(result?.error ?? "Review preferences are unavailable. Please try again.");
  return result.result as ReviewResponse;
}
