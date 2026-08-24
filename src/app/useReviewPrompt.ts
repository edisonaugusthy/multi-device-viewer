import { useCallback, useEffect, useRef, useState } from "react";
import {
  finishReviewPrompt,
  isReviewPromptEligible,
  normalizeReviewPromptState,
  postponeReviewPrompt,
  recordPromptShown,
  recordQualifiedSession,
  recordSuccessfulAction,
  type ReviewPromptOutcome,
  type ReviewPromptState,
} from "../domain/review/review-prompt";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

export const REVIEW_PROMPT_STORAGE_KEY = "mdvReviewPromptState";
const LEGACY_REVIEW_DISMISSED_KEY = "mdvReviewDismissed";
const QUALIFIED_SESSION_MS = 60 * 1000;

interface UseReviewPromptOptions {
  enabled: boolean;
  hasMultipleViewports: boolean;
  canPresent: boolean;
}

export function useReviewPrompt({
  enabled,
  hasMultipleViewports,
  canPresent,
}: UseReviewPromptOptions) {
  const [state, setState] = useState<ReviewPromptState | null>(null);
  const [visible, setVisible] = useState(false);
  const [candidate, setCandidate] = useState(false);
  const qualifiedThisSession = useRef(false);
  const stateReady = state !== null;

  useEffect(() => {
    if (!enabled) return;
    void Promise.all([
      readStore<unknown>(REVIEW_PROMPT_STORAGE_KEY, null),
      readStore<boolean>(LEGACY_REVIEW_DISMISSED_KEY, false),
    ]).then(([stored, legacyDismissed]) => {
      const normalized = normalizeReviewPromptState(stored);
      setState(
        legacyDismissed
          ? finishReviewPrompt(normalized, "never")
          : normalized,
      );
    });
  }, [enabled]);

  useEffect(() => {
    if (!state) return;
    void writeStore(REVIEW_PROMPT_STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    if (
      !enabled ||
      !state ||
      !hasMultipleViewports ||
      qualifiedThisSession.current
    )
      return;
    const timer = window.setTimeout(() => {
      qualifiedThisSession.current = true;
      setState((current) =>
        current ? recordQualifiedSession(current) : current,
      );
    }, QUALIFIED_SESSION_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, hasMultipleViewports, stateReady]);

  useEffect(() => {
    if (!candidate || !canPresent || !state || visible) return;
    const now = Date.now();
    if (!isReviewPromptEligible(state, now)) return;
    setState(recordPromptShown(state, now));
    setCandidate(false);
    setVisible(true);
  }, [canPresent, candidate, state, visible]);

  const noteSuccessfulAction = useCallback(() => {
    if (!enabled) return;
    setState((current) =>
      current ? recordSuccessfulAction(current) : current,
    );
    setCandidate(true);
  }, [enabled]);

  const finish = useCallback((outcome: ReviewPromptOutcome) => {
    setVisible(false);
    setCandidate(false);
    setState((current) => {
      if (!current) return current;
      return outcome === "pending"
        ? postponeReviewPrompt(current)
        : finishReviewPrompt(current, outcome);
    });
  }, []);

  const postpone = useCallback(() => finish("pending"), [finish]);
  const markReviewed = useCallback(() => finish("reviewed"), [finish]);
  const optOut = useCallback(() => finish("never"), [finish]);

  return {
    visible,
    noteSuccessfulAction,
    postpone,
    markReviewed,
    optOut,
  };
}
