import { useSyncExternalStore } from "react";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";

/**
 * Track changes: when on, each preview compares every reload with the one
 * before (or with a version pinned for its page) and its caption says what
 * changed. The switch and the pinned pages are remembered by the extension.
 */
const TRACK_KEY = "mdvTrackChanges";
const PINNED_KEY = "mdvPinnedVersions";
const MAX_PINNED = 100;
const listeners = new Set<() => void>();

let tracking = false;
let pinned: Record<string, number> = {};
let version = 0;
const notify = () => { version++; for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

void Promise.all([readStore<unknown>(TRACK_KEY, false), readStore<unknown>(PINNED_KEY, {})]).then(([storedTracking, storedPinned]) => {
  tracking = storedTracking === true;
  if (storedPinned && typeof storedPinned === "object") {
    pinned = Object.fromEntries(Object.entries(storedPinned).filter((entry): entry is [string, number] => typeof entry[1] === "number"));
  }
  notify();
}).catch(() => undefined);

export function setTracking(next: boolean) {
  tracking = next;
  void writeStore(TRACK_KEY, next).catch(() => undefined);
  notify();
}
export const isTracking = () => tracking;
export function useTracking() {
  return useSyncExternalStore(subscribe, isTracking);
}

/** When this page's version was pinned, or undefined when each reload is compared with the one before. */
export const pinnedAt = (key: string): number | undefined => pinned[key];
export function setPinned(key: string, on: boolean) {
  const next = { ...pinned };
  if (on) next[key] = Date.now(); else delete next[key];
  // Keep the most recent pins.
  pinned = Object.fromEntries(Object.entries(next).sort((a, b) => b[1] - a[1]).slice(0, MAX_PINNED));
  void writeStore(PINNED_KEY, pinned).catch(() => undefined);
  notify();
}
export function usePinnedVersion() {
  return useSyncExternalStore(subscribe, () => version);
}
