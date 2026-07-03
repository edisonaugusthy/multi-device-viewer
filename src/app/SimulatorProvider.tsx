import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultDeviceIds, devices } from "../domain/device/device-catalog";
import { supportsOrientation } from "../domain/device/device-service";
import { createPreviewSlot, createWorkbenchIssue, maxPreviewSlots, nextZoom, normalizeUrl } from "../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot, SimulatorState, WorkbenchIssue } from "../domain/simulator/simulator.types";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

interface SimulatorContextValue extends SimulatorState {
  setActiveSlot: (slotId: string) => void;
  setSlotDevice: (slotId: string, deviceId: string) => void;
  setSlotUrl: (slotId: string, url: string) => void;
  setAllSlotsUrl: (url: string) => void;
  rotateSlot: (slotId: string) => void;
  zoomSlot: (slotId: string, direction: "in" | "out") => void;
  setSlotZoomMode: (slotId: string, zoomMode: PreviewSlot["zoomMode"]) => void;
  reloadSlot: (slotId: string) => void;
  reloadAllSlots: () => void;
  addSlot: (deviceId?: string) => void;
  applyDevicePreset: (deviceIds: string[]) => void;
  removeSlot: (slotId: string) => void;
  duplicateActiveSlot: (deviceId?: string) => void;
  updateDisplay: (display: DisplaySettings | ((current: DisplaySettings) => DisplaySettings)) => void;
  updateWorkbenchIssue: (issue: WorkbenchIssue | ((current: WorkbenchIssue) => WorkbenchIssue)) => void;
  useCount: number;
}

interface SavedSimulatorSession {
  slots: PreviewSlot[];
  activeSlotId: string;
  display: DisplaySettings;
  workbenchIssue: WorkbenchIssue;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

const defaultDisplay: DisplaySettings = {
  showStatusBar: true,
  showBattery: false,
  showUrlBar: true,
  scrollSync: false,
  darkMode: false,
  presentationMode: false,
  hideChrome: false,
  inspectMode: false
};

const startupDisplay: DisplaySettings = {
  ...defaultDisplay,
  showStatusBar: true,
  showBattery: false,
  showUrlBar: true,
  scrollSync: false,
  darkMode: false,
  presentationMode: false,
  hideChrome: false,
  inspectMode: false,
};

function launchUrlFromSearch(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URLSearchParams(window.location.search).get("url");
  return url ? normalizeUrl(url) : null;
}

function initialUrlFromSearch() {
  if (typeof window === "undefined") return "https://example.com";
  return launchUrlFromSearch() ?? "https://example.com";
}

const defaultSlotDeviceIds = [
  "apple-iphone-14-pro-max-2022", // match common iPhone reference viewport
  "macbook-air-2020-13",     // latest Apple laptop
];

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<PreviewSlot[]>(() => {
    const url = initialUrlFromSearch();
    return defaultSlotDeviceIds.map((deviceId, i) => createPreviewSlot(deviceId, url, i));
  });
  const [activeSlotId, setActiveSlotId] = useState(slots[0].id);
  const [display, setDisplay] = useState(defaultDisplay);
  const [workbenchIssue, setWorkbenchIssue] = useState<WorkbenchIssue>(() => createWorkbenchIssue(defaultSlotDeviceIds[1] ?? ""));
  const [useCount, setUseCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Load + increment use count on mount
  useEffect(() => {
    const launchUrl = launchUrlFromSearch();
    void Promise.all([
      readStore<number>("mdvUseCount", 0),
      readStore<SavedSimulatorSession | null>("mdvSimulatorSession", null),
    ]).then(([count, session]) => {
      const next = count + 1;
      setUseCount(next);
      void writeStore("mdvUseCount", next);
      if (session) {
        const restoredSlots = session.slots.length > 0 ? session.slots : slots;
        const nextSlots = launchUrl
          ? restoredSlots.map((slot) => ({
              ...slot,
              url: launchUrl,
              reloadToken: slot.reloadToken + 1,
              inspectEnabled: false,
              inspectLocked: false,
            }))
          : restoredSlots;
        setSlots(nextSlots);
        setActiveSlotId(session.activeSlotId || nextSlots[0]?.id || slots[0].id);
        setDisplay(startupDisplay);
        setWorkbenchIssue(session.workbenchIssue);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const session: SavedSimulatorSession = {
      slots,
      activeSlotId,
      display,
      workbenchIssue,
    };
    void writeStore("mdvSimulatorSession", session);
  }, [activeSlotId, display, hydrated, slots, workbenchIssue]);

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

  const setSlotDevice = useCallback((slotId: string, deviceId: string) => {
    updateSlot(slotId, (slot) => {
      const currentDevice = devices.find((device) => device.id === slot.deviceId);
      const nextDevice = devices.find((device) => device.id === deviceId);
      const canPreserveOrientation = currentDevice && nextDevice && supportsOrientation(currentDevice) && supportsOrientation(nextDevice);

      return {
        ...slot,
        deviceId,
        orientation: canPreserveOrientation ? slot.orientation : "portrait",
        zoom: 0.58,
        zoomMode: "fit",
        inspectEnabled: false,
        inspectLocked: false
      };
    });
    setActiveSlot(slotId);
  }, [setActiveSlot, updateSlot]);

  const setSlotUrl = useCallback((slotId: string, url: string) => {
    updateSlot(slotId, (slot) => ({ ...slot, url: normalizeUrl(url), reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

  const setAllSlotsUrl = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    setSlots((current) =>
      current.map((slot) => ({ ...slot, url: normalized, reloadToken: slot.reloadToken + 1 }))
    );
  }, []);

  const rotateSlot = useCallback((slotId: string) => {
    updateSlot(slotId, (slot) => {
      const device = devices.find((item) => item.id === slot.deviceId);
      if (!device || !supportsOrientation(device)) return slot;
      return { ...slot, orientation: slot.orientation === "portrait" ? "landscape" : "portrait" };
    });
  }, [updateSlot]);

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
    updateSlot(slotId, (slot) => ({ ...slot, reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

  const reloadAllSlots = useCallback(() => {
    setSlots((current) => current.map((slot) => ({ ...slot, reloadToken: slot.reloadToken + 1 })));
  }, []);

  const addSlot = useCallback((deviceId = defaultDeviceIds[0]) => {
    setSlots((current) => {
      if (current.length >= maxPreviewSlots) return current;
      const next = [...current, createPreviewSlot(deviceId, current[0]?.url ?? initialUrlFromSearch(), current.length)];
      setActiveSlotId(next[next.length - 1].id);
      return next;
    });
  }, []);

  const applyDevicePreset = useCallback((deviceIds: string[]) => {
    setSlots((current) => {
      const url = current[0]?.url ?? initialUrlFromSearch();
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

  const duplicateActiveSlot = useCallback((deviceId?: string) => {
    setSlots((current) => {
      if (current.length >= maxPreviewSlots) return current;
      const source = current.find((slot) => slot.id === activeSlotId) ?? current[0];
      const nextSlot = {
        ...source,
        id: `slot-${Date.now()}-${current.length}`,
        deviceId: deviceId ?? source.deviceId,
        zoom: 0.58,
        zoomMode: "fit" as const,
        inspectEnabled: false,
        inspectLocked: false
      };
      const next = [...current, nextSlot];
      setActiveSlotId(nextSlot.id);
      return next;
    });
  }, [activeSlotId]);

  const updateDisplay = useCallback((nextDisplay: DisplaySettings | ((current: DisplaySettings) => DisplaySettings)) => {
    setDisplay(nextDisplay);
  }, []);

  const updateWorkbenchIssue = useCallback((nextIssue: WorkbenchIssue | ((current: WorkbenchIssue) => WorkbenchIssue)) => {
    setWorkbenchIssue((current) => (typeof nextIssue === "function" ? (nextIssue as (current: WorkbenchIssue) => WorkbenchIssue)(current) : nextIssue));
  }, []);

  // Listen for LOAD_URL messages sent by the background service worker when the
  // extension icon is clicked while a simulator tab is already open.
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;

    const listener = (message: unknown) => {
      if (
        message !== null &&
        typeof message === "object" &&
        (message as Record<string, unknown>).type === "LOAD_URL" &&
        typeof (message as Record<string, unknown>).url === "string"
      ) {
        const newUrl = (message as Record<string, unknown>).url as string;
        setAllSlotsUrl(newUrl);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [setAllSlotsUrl]);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      slots,
      activeSlotId,
      display,
      workbenchIssue,
      useCount,
      setActiveSlot,
      setSlotDevice,
      setSlotUrl,
      setAllSlotsUrl,
      rotateSlot,
      zoomSlot,
      setSlotZoomMode,
      reloadSlot,
      reloadAllSlots,
      addSlot,
      applyDevicePreset,
      removeSlot,
      duplicateActiveSlot,
      updateDisplay,
      updateWorkbenchIssue
    }),
    [
      activeSlotId,
      addSlot,
      applyDevicePreset,
      display,
      duplicateActiveSlot,
      reloadAllSlots,
      reloadSlot,
      removeSlot,
      rotateSlot,
      setActiveSlot,
      setAllSlotsUrl,
      setSlotDevice,
      setSlotUrl,
      setSlotZoomMode,
      slots,
      updateDisplay,
      updateWorkbenchIssue,
      workbenchIssue,
      useCount,
      zoomSlot
    ]
  );

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
}

export function useSimulator() {
  const value = useContext(SimulatorContext);
  if (!value) throw new Error("useSimulator must be used inside SimulatorProvider");
  return value;
}
