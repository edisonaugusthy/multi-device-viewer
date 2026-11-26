import { useCallback, useEffect, useRef, useState } from "react";
import { createPageWatch, type WatchRequest } from "../domain/simulator/page-watch";
import { readStore, writeStore } from "../infrastructure/storage/local-store";
import { startAutoReloadLoop } from "./auto-reload-loop";

const AUTO_RELOAD_KEY = "mdvAutoReload";
const REQUEST_TIMEOUT_MS = 8000;

/** One choice for every viewer: the workspace has the switch, floating devices follow it. */
export function useAutoReloadSetting(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(false);
  const chosen = useRef(false);
  useEffect(() => {
    let active = true;
    void readStore(AUTO_RELOAD_KEY, false).then(saved => { if (active && !chosen.current) setEnabled(saved === true); }).catch(() => undefined);
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return () => { active = false; };
    // Switched in another tab's viewer.
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && AUTO_RELOAD_KEY in changes) setEnabled(changes[AUTO_RELOAD_KEY].newValue === true);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => { active = false; chrome.storage.onChanged.removeListener(onChanged); };
  }, []);
  const change = useCallback((next: boolean) => {
    chosen.current = true;
    setEnabled(next);
    void writeStore(AUTO_RELOAD_KEY, next).catch(() => undefined);
  }, []);
  return [enabled, change];
}

/** Never from the browser's cache, with the page's own login, and never on to another address. */
function pageRequest(stop: AbortSignal): WatchRequest {
  return async (url, { page, etag, modified }) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
    stop.addEventListener("abort", abort, { once: true });
    const release = () => { clearTimeout(timer); stop.removeEventListener("abort", abort); };
    const headers: Record<string, string> = page ? { Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" } : {};
    if (etag) headers["If-None-Match"] = etag;
    if (modified) headers["If-Modified-Since"] = modified;
    try {
      if (stop.aborted) throw new DOMException("Stopped", "AbortError");
      const response = await fetch(url, { cache: "no-store", credentials: "include", redirect: "manual", headers, signal: controller.signal });
      return {
        status: response.type === "opaqueredirect" ? 0 : response.status, etag: response.headers.get("etag"), modified: response.headers.get("last-modified"),
        text: () => response.text().finally(release),
        discard: () => { release(); void response.body?.cancel().catch(() => undefined); },
      };
    } catch (error) { release(); throw error; }
  };
}

/** In a website's tab the viewer may read only that website; the extension's own page may read any. */
function readable(url: string): boolean {
  if (location.protocol === "chrome-extension:") return true;
  try { return new URL(url).origin === location.origin; } catch { return false; }
}

/**
 * Reloads the previews when the local site they show was rebuilt. Nothing is
 * asked while the tab is hidden (unless `awake`) or while `paused`; a change
 * made meanwhile is found on the next check.
 */
export function useAutoReload({ enabled, paused = false, awake = false, pages, onChange }: {
  enabled: boolean;
  /** A capture or recording a reload would spoil is running. */
  paused?: boolean;
  /** Keep checking in a hidden tab: a device is in its on-top window. */
  awake?: boolean;
  /** The pages the previews show now. */
  pages: () => string[];
  onChange: () => void;
}) {
  const latest = useRef({ paused, awake, pages, onChange });
  latest.current = { paused, awake, pages, onChange };
  const wake = useRef<() => void>(undefined);
  useEffect(() => {
    if (!enabled) return;
    const stop = new AbortController();
    const loop = startAutoReloadLoop({
      watch: createPageWatch(pageRequest(stop.signal)),
      pages: () => latest.current.pages().filter(readable),
      paused: () => latest.current.paused,
      asleep: () => document.hidden && !latest.current.awake,
      onChange: () => latest.current.onChange(),
    });
    wake.current = loop.wake;
    document.addEventListener("visibilitychange", loop.wake);
    return () => { loop.stop(); stop.abort(); wake.current = undefined; document.removeEventListener("visibilitychange", loop.wake); };
  }, [enabled]);
  // The on-top window opened over a hidden tab.
  useEffect(() => { if (awake) wake.current?.(); }, [awake]);
}
