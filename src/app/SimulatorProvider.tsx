import { getViewerContext } from "./viewer-context";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { defaultDeviceIds } from "../domain/device/device-catalog";
import { useDeviceCatalog } from "./DeviceCatalogProvider";
import { getDefaultOrientation, nextOrientation, normalizeOrientation, supportsOrientation } from "../domain/device/device-service";
import type { BrowserPreferences } from "../domain/device/browser-geometry";
import {
  createPreviewSlot,
  maxPreviewSlots,
  nextZoom,
  normalizeUrl,
} from "../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot, SimulatorState } from "../domain/simulator/simulator.types";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

interface SimulatorContextValue extends SimulatorState {
  ready: boolean;
  setActiveSlot: (slotId: string) => void;
  setSlotDevice: (slotId: string, deviceId: string) => void;
  setSlotBrowserPreferences: (slotId: string, preferences: BrowserPreferences) => void;
  setSlotUrl: (slotId: string, url: string) => void;
  observeSlotUrl: (slotId: string, url: string) => void;
  getSlotUrl: (slotId: string) => string;
  rotateSlot: (slotId: string) => void;
  zoomSlot: (slotId: string, direction: "in" | "out") => void;
  setSlotZoomMode: (slotId: string, zoomMode: PreviewSlot["zoomMode"]) => void;
  reloadSlot: (slotId: string) => void;
  reloadAllSlots: () => void;
  addSlot: (deviceId?: string, orientation?: PreviewSlot["orientation"]) => void;
  applyDevicePreset: (deviceIds: string[]) => void;
  removeSlot: (slotId: string) => void;
  moveSlot: (slotId: string, direction: "left" | "right") => void;
  updateDisplay: (display: DisplaySettings | ((current: DisplaySettings) => DisplaySettings)) => void;
  useCount: number;
}

interface SavedSimulatorSession {
  slots: PreviewSlot[];
  activeSlotId: string;
  display: DisplaySettings;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

const defaultDisplay: DisplaySettings = {
  scrollSync: false,
  navigationSync: false,
  darkMode: typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches,
};

const startupDisplay: DisplaySettings = {
  ...defaultDisplay,
};

function launchTabIdFromSearch(): number | null {
  if (getViewerContext()) return getViewerContext()!.sourceTabId ?? null;
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("sourceTabId");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

function launchUrlFromSearch(): string | null {
  if (getViewerContext()) return getViewerContext()!.url;
  if (typeof window === "undefined") return null;
  const url = new URLSearchParams(window.location.search).get("url");
  return url ? normalizeUrl(url) : null;
}

function initialUrlFromSearch() {
  if (typeof window === "undefined") return "https://example.com";
  return launchUrlFromSearch() ?? "https://example.com";
}

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const { devices } = useDeviceCatalog();
  const [slots, setSlots] = useState<PreviewSlot[]>(() => {
    const url = initialUrlFromSearch();
    return defaultDeviceIds.map((deviceId, i) => createPreviewSlot(deviceId, url, i));
  });
  // Observations must not change iframe src or recreate the live document.
  const observedUrls = useRef(new Map<string, string>());
  const observeSlotUrl = useCallback((slotId: string, url: string) => { observedUrls.current.set(slotId, url); }, []);
  const getSlotUrl = useCallback((slotId: string) => observedUrls.current.get(slotId) ?? slots.find(slot => slot.id === slotId)?.url ?? "", [slots]);
  useEffect(() => {
    const ids = new Set(slots.map(slot => slot.id));
    for (const id of observedUrls.current.keys()) if (!ids.has(id)) observedUrls.current.delete(id);
  }, [slots]);
  const [activeSlotId, setActiveSlotId] = useState(slots[0].id);
  const [display, setDisplay] = useState(() => ({
    ...defaultDisplay,
    darkMode: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  const [useCount, setUseCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [sourceTabId, setSourceTabId] = useState<number | null>(() => launchTabIdFromSearch());
  const displayUpdatedBeforeHydrationRef = useRef(false);

  // Load + increment use count on mount
  useEffect(() => {
    const launchUrl = launchUrlFromSearch();
    void Promise.all([
      readStore<number>("mdvUseCount", 0),
      readStore<SavedSimulatorSession | null>("mdvSimulatorSession", null),
    ]).then(([count, session]) => {
      const next = count + 1;
      const launchTabId = launchTabIdFromSearch();
      setUseCount(next);
      void writeStore("mdvUseCount", next);
      if (session) {
        const restoredSlots = (session.slots.length > 0 ? session.slots : slots).map(slot => ({
          ...slot,
          orientation: normalizeOrientation(slot.orientation, devices.find(device => device.id === slot.deviceId)),
        }));
        const nextSlots = launchUrl
          ? restoredSlots.map((slot) => ({
              ...slot,
              url: launchUrl,
              reloadToken: slot.reloadToken + 1,
            }))
          : restoredSlots;
        setSlots(nextSlots);
        setActiveSlotId(session.activeSlotId || nextSlots[0]?.id || slots[0].id);
        setDisplay((current) => displayUpdatedBeforeHydrationRef.current
          ? current
          : { ...startupDisplay, ...session.display });
      }
      if (launchTabId !== null) {
        setSourceTabId(launchTabId);
      }
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncColorScheme = (event: MediaQueryListEvent) => {
      setDisplay((current) => ({ ...current, darkMode: event.matches }));
    };
    media.addEventListener("change", syncColorScheme);
    return () => media.removeEventListener("change", syncColorScheme);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const session: SavedSimulatorSession = {
      slots,
      activeSlotId,
      display,
    };
    void writeStore("mdvSimulatorSession", session);
  }, [activeSlotId, display, hydrated, slots]);

  const updateSlot = useCallback(
    (slotId: string, updater: (slot: PreviewSlot) => PreviewSlot) => {
      setSlots((current) => {
        const next = current.map((slot) => (slot.id === slotId ? updater(slot) : slot));
        return next;
      });
    },
    []
  );

  const setActiveSlot = useCallback((slotId: string) => {
    setActiveSlotId(slotId);
  }, []);

  const setSlotBrowserPreferences = useCallback((slotId: string, preferences: BrowserPreferences) => {
    updateSlot(slotId, slot => ({ ...slot, browserPreferences: { ...slot.browserPreferences, ...preferences } }));
  }, [updateSlot]);

  const setSlotDevice = useCallback((slotId: string, deviceId: string) => {
    updateSlot(slotId, (slot) => {
      const nextDevice = devices.find((device) => device.id === deviceId);
      return {
        ...slot,
        deviceId,
        orientation: getDefaultOrientation(nextDevice),
        zoom: 0.58,
        zoomMode: "fit",
      };
    });
    setActiveSlot(slotId);
  }, [devices, setActiveSlot, updateSlot]);

  const setSlotUrl = useCallback((slotId: string, url: string) => {
    const normalized = normalizeUrl(url);
    observedUrls.current.set(slotId, normalized);
    updateSlot(slotId, (slot) => ({ ...slot, url: normalized, reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

  const rotateSlot = useCallback((slotId: string) => {
    updateSlot(slotId, (slot) => {
      const device = devices.find((item) => item.id === slot.deviceId);
      if (!device || !supportsOrientation(device)) return slot;
      return { ...slot, orientation: nextOrientation(slot.orientation) };
    });
  }, [devices, updateSlot]);

  const zoomSlot = useCallback((slotId: string, direction: "in" | "out") => {
    updateSlot(slotId, (slot) => ({ ...slot, zoom: nextZoom(slot.zoom, direction), zoomMode: "custom" }));
  }, [updateSlot]);

  const setSlotZoomMode = useCallback((slotId: string, zoomMode: PreviewSlot["zoomMode"]) => {
    updateSlot(slotId, (slot) => ({
      ...slot,
      zoomMode,
      zoom: zoomMode === "actual" ? 1 : zoomMode === "fit" ? 0.58 : slot.zoom
    }));
  }, [updateSlot]);

  const reloadSlot = useCallback((slotId: string) => {
    updateSlot(slotId, (slot) => ({ ...slot, url: observedUrls.current.get(slot.id) ?? slot.url, reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

  const reloadAllSlots = useCallback(() => {
    setSlots((current) => current.map((slot) => ({ ...slot, url: observedUrls.current.get(slot.id) ?? slot.url, reloadToken: slot.reloadToken + 1 })));
  }, []);

  const addSlot = useCallback((deviceId = defaultDeviceIds[0], orientation?: PreviewSlot["orientation"]) => {
    setSlots((current) => {
      if (current.length >= maxPreviewSlots) return current;
      const slot = createPreviewSlot(deviceId, observedUrls.current.get(current[0]?.id) ?? current[0]?.url ?? initialUrlFromSearch(), current.length);
      const device = devices.find((item) => item.id === deviceId);
      if (orientation) slot.orientation = orientation;
      else slot.orientation = getDefaultOrientation(device);
      const next = [...current, slot];
      setActiveSlotId(next[next.length - 1].id);
      return next;
    });
  }, [devices]);

  const applyDevicePreset = useCallback((deviceIds: string[]) => {
    setSlots((current) => {
      const url = observedUrls.current.get(current[0]?.id) ?? current[0]?.url ?? initialUrlFromSearch();
      const next = deviceIds.slice(0, 4).map((deviceId, index) => createPreviewSlot(deviceId, url, index));
      setActiveSlotId(next[0]?.id ?? activeSlotId);
      return next.length > 0 ? next : current;
    });
  }, [activeSlotId]);

  const removeSlot = useCallback((slotId: string) => {
    setSlots((current) => {
      if (current.length === 1) return current;
      const next = current.filter((slot) => slot.id !== slotId);
      if (activeSlotId === slotId) setActiveSlotId(next[0].id);
      return next;
    });
  }, [activeSlotId]);

  const moveSlot = useCallback((slotId: string, direction: "left" | "right") => {
    setSlots((current) => {
      const from = current.findIndex((slot) => slot.id === slotId);
      const to = direction === "left" ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const updateDisplay = useCallback((nextDisplay: DisplaySettings | ((current: DisplaySettings) => DisplaySettings)) => {
    if (!hydrated) displayUpdatedBeforeHydrationRef.current = true;
    setDisplay((current) =>
      typeof nextDisplay === "function"
        ? (nextDisplay as (value: DisplaySettings) => DisplaySettings)(current)
        : nextDisplay,
    );
  }, [hydrated]);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      ready: hydrated,
      slots,
      activeSlotId,
      display,
      sourceTabId,
      useCount,
      setActiveSlot,
      setSlotDevice,
      setSlotBrowserPreferences,
      setSlotUrl,
      observeSlotUrl,
      getSlotUrl,
      rotateSlot,
      zoomSlot,
      setSlotZoomMode,
      reloadSlot,
      reloadAllSlots,
      addSlot,
      applyDevicePreset,
      removeSlot,
      moveSlot,
      updateDisplay,
    }),
    [
      hydrated,
      activeSlotId,
      addSlot,
      applyDevicePreset,
      display,
      moveSlot,
      reloadAllSlots,
      reloadSlot,
      removeSlot,
      rotateSlot,
      setActiveSlot,
      setSlotDevice,
      setSlotBrowserPreferences,
      setSlotUrl,
      observeSlotUrl,
      getSlotUrl,
      setSlotZoomMode,
      slots,
      sourceTabId,
      updateDisplay,
      useCount,
      zoomSlot,
    ]
  );

  return <SimulatorValueProvider value={value}>{children}</SimulatorValueProvider>;
}

export function useSimulator() {
  const value = useContext(SimulatorContext);
  if (!value) throw new Error("useSimulator must be used inside SimulatorProvider");
  return value;
}

// The latest simulator value, readable from event handlers and effects
// without subscribing the component to every slot or status change.
export interface SimulatorRef {
  readonly current: SimulatorContextValue;
}

interface SimulatorStore extends SimulatorRef {
  publish: (value: SimulatorContextValue) => void;
  subscribe: (listener: () => void) => () => void;
}

const SimulatorStoreContext = createContext<SimulatorStore | null>(null);

function createSimulatorStore(initial: SimulatorContextValue): SimulatorStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get current() { return current; },
    publish(value) {
      if (value === current) return;
      current = value;
      listeners.forEach(listener => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

function SimulatorValueProvider({ value, children }: { value: SimulatorContextValue; children: ReactNode }) {
  const [store] = useState(() => createSimulatorStore(value));
  useLayoutEffect(() => store.publish(value), [store, value]);
  return (
    <SimulatorContext.Provider value={value}>
      <SimulatorStoreContext.Provider value={store}>{children}</SimulatorStoreContext.Provider>
    </SimulatorContext.Provider>
  );
}

function useSimulatorStore() {
  const store = useContext(SimulatorStoreContext);
  if (!store) throw new Error("useSimulatorRef must be used inside SimulatorProvider");
  return store;
}

export function useSimulatorRef(): SimulatorRef {
  return useSimulatorStore();
}

// Re-renders only when the selected value changes. Selectors must return
// primitives or values that keep their identity between unrelated updates.
export function useSimulatorSelector<T>(selector: (value: SimulatorContextValue) => T): T {
  const store = useSimulatorStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.current));
}

// A temporary preview surface can own its slots without replacing or saving
// the user's comparison workspace. It shares only the surrounding settings.
export function SimulatorScopeProvider({ value, children }: {
  value: Partial<SimulatorContextValue>;
  children: ReactNode;
}) {
  const parent = useSimulator();
  const scoped = useMemo(() => ({ ...parent, ...value }), [parent, value]);
  return <SimulatorValueProvider value={scoped}>{children}</SimulatorValueProvider>;
}
