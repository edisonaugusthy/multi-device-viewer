import { baselineKey, type BaselineIdentity } from "../../domain/visual-regression/visual-regression.types";
import { requestVisualRegression } from "./visual-regression-client";

// Which pages already have a "before" picture, so device toolbars can offer
// "See what changed" without each card asking the worker. One metadata-only
// list request serves every card in the viewer.
let keys: Set<string> | undefined;
let loading: Promise<void> | undefined;
let version = 0;
const listeners = new Set<() => void>();
function changed() { version++; for (const listener of listeners) listener(); }

export function loadBaselineIndex() {
  loading ??= requestVisualRegression({ action: "list" })
    .then(list => { keys = new Set(list.map(meta => baselineKey(meta.identity))); })
    .catch(() => { keys = new Set(); loading = undefined; })
    .finally(changed);
}
export function hasBaseline(identity: BaselineIdentity): boolean {
  try { return keys?.has(baselineKey(identity)) ?? false; } catch { return false; }
}
export function markBaseline(identity: BaselineIdentity, exists: boolean) {
  const key = baselineKey(identity);
  if (!keys || keys.has(key) === exists) return;
  if (exists) keys.add(key); else keys.delete(key);
  changed();
}
export function clearBaselineIndex() { keys = new Set(); changed(); }
export function subscribeBaselineIndex(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const baselineIndexVersion = () => version;
