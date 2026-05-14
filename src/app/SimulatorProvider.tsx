import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { defaultDeviceIds, devices } from "../domain/device/device-catalog";
import { supportsOrientation } from "../domain/device/device-service";
import { createPreviewSlot, maxPreviewSlots, nextZoom, normalizeUrl } from "../domain/simulator/simulator-service";
import type { DisplaySettings, PreviewSlot, SimulatorState } from "../domain/simulator/simulator.types";

interface SimulatorContextValue extends SimulatorState {
  setActiveSlot: (slotId: string) => void;
  setSlotDevice: (slotId: string, deviceId: string) => void;
  setSlotUrl: (slotId: string, url: string) => void;
  rotateSlot: (slotId: string) => void;
  zoomSlot: (slotId: string, direction: "in" | "out") => void;
  setSlotZoomMode: (slotId: string, zoomMode: PreviewSlot["zoomMode"]) => void;
  reloadSlot: (slotId: string) => void;
  reloadAllSlots: () => void;
  addSlot: (deviceId?: string) => void;
  removeSlot: (slotId: string) => void;
  duplicateActiveSlot: (deviceId?: string) => void;
  updateDisplay: (display: DisplaySettings) => void;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

const defaultDisplay: DisplaySettings = {
  showStatusBar: true,
  showBattery: true,
  showUrlBar: true,
  presentationMode: false,
  hideChrome: false
};

function initialUrlFromSearch() {
  if (typeof window === "undefined") return "https://example.com";
  return normalizeUrl(new URLSearchParams(window.location.search).get("url") ?? "https://example.com");
}

const defaultSlotDeviceIds = [
  "apple-iphone-air-2025",   // latest Apple mobile
  "macbook-air-2020-13",     // latest Apple laptop
];

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<PreviewSlot[]>(() => {
    const url = initialUrlFromSearch();
    return defaultSlotDeviceIds.map((deviceId, i) => createPreviewSlot(deviceId, url, i));
  });
  const [activeSlotId, setActiveSlotId] = useState(slots[0].id);
  const [display, setDisplay] = useState(defaultDisplay);

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
        zoomMode: "fit"
      };
    });
    setActiveSlot(slotId);
  }, [setActiveSlot, updateSlot]);

  const setSlotUrl = useCallback((slotId: string, url: string) => {
    updateSlot(slotId, (slot) => ({ ...slot, url: normalizeUrl(url), reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

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
        zoomMode: "fit" as const
      };
      const next = [...current, nextSlot];
      setActiveSlotId(nextSlot.id);
      return next;
    });
  }, [activeSlotId]);

  const updateDisplay = useCallback((nextDisplay: DisplaySettings) => {
    setDisplay(nextDisplay);
  }, []);

  // Keep a stable ref to the current activeSlotId so the message listener
  // below doesn't need to be re-registered every time the active slot changes.
  const activeSlotIdRef = useRef(activeSlotId);
  useEffect(() => {
    activeSlotIdRef.current = activeSlotId;
  }, [activeSlotId]);

  // Listen for LOAD_URL messages sent by the background service worker when the
  // extension icon is clicked while a simulator tab is already open. Using
  // message passing avoids the unreliable "navigate-existing-tab + page reload"
  // approach and lets the React state update without a full page reload.
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
        setSlotUrl(activeSlotIdRef.current, newUrl);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [setSlotUrl]);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      slots,
      activeSlotId,
      display,
      setActiveSlot,
      setSlotDevice,
      setSlotUrl,
      rotateSlot,
      zoomSlot,
      setSlotZoomMode,
      reloadSlot,
      reloadAllSlots,
      addSlot,
      removeSlot,
      duplicateActiveSlot,
      updateDisplay
    }),
    [
      activeSlotId,
      addSlot,
      display,
      duplicateActiveSlot,
      reloadAllSlots,
      reloadSlot,
      removeSlot,
      rotateSlot,
      setActiveSlot,
      setSlotDevice,
      setSlotUrl,
      setSlotZoomMode,
      slots,
      updateDisplay,
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
