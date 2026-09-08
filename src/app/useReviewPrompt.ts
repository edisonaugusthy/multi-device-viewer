import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeReviewPromptState, reviewEligibilityReason, type ReviewPromptState } from "../domain/review/review-prompt";
import { REVIEW_PROMPT_STORAGE_KEY, type ReviewCommand } from "../domain/review/review-coordinator";
import { dispatchReview } from "./review-client";

export { REVIEW_PROMPT_STORAGE_KEY } from "../domain/review/review-coordinator";
const QUALIFIED_SESSION_MS = 60 * 1000;

interface UseReviewPromptOptions { enabled: boolean; hasMultipleViewports: boolean; canPresent: boolean }

export function useReviewPrompt({ enabled, hasMultipleViewports, canPresent }: UseReviewPromptOptions) {
  const [state, setState] = useState<ReviewPromptState | null>(null);
  const [visible, setVisible] = useState(false);
  const [candidate, setCandidate] = useState(false);
  const [error, setError] = useState(false);
  const qualifiedThisSession = useRef(false);
  const presenting = useRef(false);
  const stateReady = state !== null;
  const receiveState = useCallback((next: ReviewPromptState) => {
    setState(current => !current || next.revision >= current.revision ? next : current);
  }, []);

  const dispatch = useCallback(async (command: ReviewCommand) => {
    try {
      const result = await dispatchReview(command);
      receiveState(result.state);
      setError(false);
      return result;
    } catch (cause) {
      setError(true);
      throw cause;
    }
  }, [receiveState]);

  useEffect(() => {
    let active = true;
    void dispatchReview("load").then(result => {
      if (active) receiveState(result.state);
    }).catch(() => { if (active) setError(true); });
    const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && changes[REVIEW_PROMPT_STORAGE_KEY]?.newValue) {
        receiveState(normalizeReviewPromptState(changes[REVIEW_PROMPT_STORAGE_KEY].newValue));
      }
    };
    if (typeof chrome !== "undefined") chrome.storage?.onChanged.addListener(changed);
    return () => {
      active = false;
      if (typeof chrome !== "undefined") chrome.storage?.onChanged.removeListener(changed);
    };
  }, [receiveState]);

  useEffect(() => {
    if (state && state.outcome !== "pending") {
      setVisible(false);
      setCandidate(false);
    }
  }, [state]);

  useEffect(() => {
    if (!enabled || !stateReady || !hasMultipleViewports || qualifiedThisSession.current) return;
    const timer = window.setTimeout(() => {
      qualifiedThisSession.current = true;
      void dispatch("session").catch(() => undefined);
    }, QUALIFIED_SESSION_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, enabled, hasMultipleViewports, stateReady]);

  useEffect(() => {
    if (!enabled || !candidate || !canPresent || !state || visible || presenting.current) return;
    if (reviewEligibilityReason(state) !== "eligible") return;
    presenting.current = true;
    void dispatch("present").then(result => {
      setCandidate(false);
      setVisible(result.presented);
    }).catch(() => setCandidate(false)).finally(() => { presenting.current = false; });
  }, [dispatch, enabled, canPresent, candidate, state, visible]);

  const noteSuccessfulAction = useCallback(() => {
    if (!enabled) return;
    void dispatch("success").then(() => setCandidate(true)).catch(() => undefined);
  }, [dispatch, enabled]);

  const finish = useCallback(async (command: "postpone" | "never" | "open") => {
    await dispatch(command);
    setVisible(false);
    setCandidate(false);
  }, [dispatch]);
  const postpone = useCallback(() => { void finish("postpone").catch(() => undefined); }, [finish]);
  const optOut = useCallback(() => { void finish("never").catch(() => undefined); }, [finish]);
  const openReview = useCallback(() => finish("open"), [finish]);
  const reason = !enabled ? "disabled" : error ? "error" : !state ? "loading"
    : reviewEligibilityReason(state) !== "eligible" ? reviewEligibilityReason(state)
      : !canPresent ? "dialog" : !candidate ? "action" : "eligible";

  return { visible: visible && state?.outcome === "pending", state, reason, error, noteSuccessfulAction, postpone, openReview, optOut };
}
