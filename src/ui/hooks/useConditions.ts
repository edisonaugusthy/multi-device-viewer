import { useCallback, useEffect, useState } from "react";
import { applyConditions } from "../../app/debugger-client";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import { conditionsFrom, DEFAULT_CONDITIONS, isDefaultConditions, type Conditions } from "../../domain/simulator/preview-conditions";

const STORAGE_KEY = "mdvConditions";

/**
 * The conditions the workspace is tested under, remembered between visits and
 * sent to the tab whenever its debugger is attached (a reopened viewer applies
 * them again, since Chrome drops them when the debugger detaches).
 */
export function useConditions(active: boolean) {
  const [conditions, setConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void readStore<unknown>(STORAGE_KEY, null).then(stored => {
      if (!cancelled && stored) setConditions(conditionsFrom(stored));
    }).catch(() => undefined).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (active && loaded) void applyConditions(conditions);
  }, [active, conditions, loaded]);
  const update = useCallback((change: Partial<Conditions>) => setConditions(current => {
    const next = { ...current, ...change };
    void writeStore(STORAGE_KEY, next).catch(() => undefined);
    return next;
  }), []);
  const reset = useCallback(() => update(DEFAULT_CONDITIONS), [update]);
  return { conditions, update, reset, anyOn: !isDefaultConditions(conditions) };
}
