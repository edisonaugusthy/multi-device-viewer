import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultDeviceIds } from "../domain/device/device-catalog";
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

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<PreviewSlot[]>(() => [createPreviewSlot(defaultDeviceIds[0], initialUrlFromSearch(), 0)]);
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
    updateSlot(slotId, (slot) => ({ ...slot, deviceId }));
    setActiveSlot(slotId);
  }, [setActiveSlot, updateSlot]);

  const setSlotUrl = useCallback((slotId: string, url: string) => {
    updateSlot(slotId, (slot) => ({ ...slot, url: normalizeUrl(url), reloadToken: slot.reloadToken + 1 }));
  }, [updateSlot]);

  const rotateSlot = useCallback((slotId: string) => {
    updateSlot(slotId, (slot) => ({ ...slot, orientation: slot.orientation === "portrait" ? "landscape" : "portrait" }));
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
      const nextSlot = { ...source, id: `slot-${Date.now()}-${current.length}`, deviceId: deviceId ?? source.deviceId };
      const next = [...current, nextSlot];
      setActiveSlotId(nextSlot.id);
      return next;
    });
  }, [activeSlotId]);

  const updateDisplay = useCallback((nextDisplay: DisplaySettings) => {
    setDisplay(nextDisplay);
  }, []);

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
