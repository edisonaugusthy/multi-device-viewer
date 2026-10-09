import { useCallback, useLayoutEffect, useRef } from "react";

// A function with a fixed identity that always calls the latest callback, so
// memoized children do not re-render just because a parent re-created it.
// Call it from event handlers and effects, not during render.
export function useStableCallback<Args extends unknown[], Result>(callback: (...args: Args) => Result) {
  const latest = useRef(callback);
  useLayoutEffect(() => { latest.current = callback; });
  return useCallback((...args: Args) => latest.current(...args), []);
}
