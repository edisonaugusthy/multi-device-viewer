import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeReviewPromptState, reviewEligibilityReason, reviewPromptReadyAt, type ReviewPromptState } from "../domain/review/review-prompt";
import { REVIEW_PROMPT_STORAGE_KEY, type ReviewCommand } from "../domain/review/review-coordinator";
import { dispatchReview } from "./review-client";
import { getViewerEventTarget, getViewerRoot } from "./viewer-context";

export { REVIEW_PROMPT_STORAGE_KEY } from "../domain/review/review-coordinator";
const QUALIFIED_SESSION_MS = 60 * 1000;
const QUIET_PERIOD_MS = 5 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647;

interface UseReviewPromptOptions { enabled: boolean; hasMultipleViewports: boolean; canPresent: boolean }

export function useReviewPrompt({ enabled, hasMultipleViewports, canPresent }: UseReviewPromptOptions) {
  const [state, setState] = useState<ReviewPromptState | null>(null);
  const [visible, setVisible] = useState(false);
  const [sessionQualified, setSessionQualified] = useState(false);
  const [foreground, setForeground] = useState(() => document.visibilityState !== "hidden");
  const [error, setError] = useState(false);
  const qualifiedThisSession = useRef(false);
  const presenting = useRef(false);
  const mounted = useRef(true);
  const presentationAllowed = useRef(false);
  presentationAllowed.current = enabled && hasMultipleViewports && canPresent && foreground &&
    sessionQualified && !visible && !error && state?.outcome === "pending";
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
    mounted.current = true;
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
      mounted.current = false;
      if (typeof chrome !== "undefined") chrome.storage?.onChanged.removeListener(changed);
    };
  }, [receiveState]);

  useEffect(() => {
    const changed = () => setForeground(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);

  useEffect(() => {
    if (state && state.outcome !== "pending") {
      setVisible(false);
    }
  }, [state]);

  useEffect(() => {
    if (!enabled || !foreground || !stateReady || !hasMultipleViewports || qualifiedThisSession.current || error) return;
    const timer = window.setTimeout(() => {
      qualifiedThisSession.current = true;
      void dispatch("session").then(() => {
        if (mounted.current) setSessionQualified(true);
      }).catch(() => { qualifiedThisSession.current = false; });
    }, QUALIFIED_SESSION_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, enabled, foreground, hasMultipleViewports, stateReady, error]);

  useEffect(() => {
    if (!presentationAllowed.current || !state) return;
    let timer: number | undefined;
    let active = true;
    const schedule = () => {
      window.clearTimeout(timer);
      const reason = reviewEligibilityReason(state);
      if (reason === "age" || reason === "cooldown") {
        const delay = reviewPromptReadyAt(state) - Date.now();
        if (delay > 0) timer = window.setTimeout(schedule, Math.min(MAX_TIMEOUT_MS, delay));
        return;
      }
      if (reason !== "eligible") return;
      timer = window.setTimeout(() => {
        if (!active || !presentationAllowed.current || presenting.current || document.visibilityState === "hidden") return;
        // Gallery popups and native dialogs can live outside SimulatorApp's state.
        if (getViewerRoot().querySelector('[role="dialog"]:not([data-all-devices-view]), dialog[open]')) { schedule(); return; }
        presenting.current = true;
        void dispatch("present").then(result => {
          if (mounted.current && presentationAllowed.current && result.presented) setVisible(true);
        }).catch(() => undefined).finally(() => { presenting.current = false; });
      }, QUIET_PERIOD_MS);
    };
    const previewActivity = (event: MessageEvent) => {
      // Scrolls inside website frames do not bubble to the viewer's document.
      if (event.data?.type !== "MDV_SCROLL_SYNC_EVENT" && event.data?.type !== "MDV_INTERACTION_EVENT" && event.data?.type !== "MDV_BROWSER_SCROLL") return;
      if (Array.from(getViewerRoot().querySelectorAll("iframe")).some(frame => frame.contentWindow === event.source)) schedule();
    };
    const activityEvents = ["pointerdown", "keydown", "wheel", "scroll"] as const;
    const target = getViewerEventTarget();
    for (const event of activityEvents) target.addEventListener(event, schedule, { capture: true, passive: true });
    window.addEventListener("message", previewActivity);
    schedule();
    return () => {
      active = false;
      window.clearTimeout(timer);
      for (const event of activityEvents) target.removeEventListener(event, schedule, true);
      window.removeEventListener("message", previewActivity);
    };
  }, [dispatch, enabled, canPresent, foreground, hasMultipleViewports, sessionQualified, state, visible, error]);

  const noteSuccessfulAction = useCallback(() => {
    if (!enabled) return;
    void dispatch("success").catch(() => undefined);
  }, [dispatch, enabled]);

  const finish = useCallback(async (command: "postpone" | "never" | "open") => {
    await dispatch(command);
    setVisible(false);
  }, [dispatch]);
  const postpone = useCallback(() => { void finish("postpone").catch(() => undefined); }, [finish]);
  const optOut = useCallback(() => { void finish("never").catch(() => undefined); }, [finish]);
  const openReview = useCallback(() => finish("open"), [finish]);
  const reason = !enabled ? "disabled" : error ? "error" : !state ? "loading"
    : reviewEligibilityReason(state) !== "eligible" ? reviewEligibilityReason(state)
      : !hasMultipleViewports || !sessionQualified ? "testing" : "eligible";

  return { visible: visible && state?.outcome === "pending", state, reason, error, noteSuccessfulAction, postpone, openReview, optOut };
}
