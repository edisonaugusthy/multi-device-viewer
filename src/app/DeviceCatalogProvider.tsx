import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultDeviceIds, devices as baseDevices } from "../domain/device/device-catalog";
import { createCustomDevice, validateCustomDevice } from "../domain/device/device-service";
import type { CustomDeviceInput, Device } from "../domain/device/device.types";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

interface DeviceCatalogContextValue {
  devices: Device[];
  customDevices: Device[];
  favorites: string[];
  recents: string[];
  toggleFavorite: (id: string) => void;
  addRecent: (id: string) => void;
  addCustomDevice: (input: CustomDeviceInput) => string | null;
  removeCustomDevice: (id: string) => void;
  isFavorite: (id: string) => boolean;
  findDevice: (id: string) => Device;
}

const DeviceCatalogContext = createContext<DeviceCatalogContextValue | null>(null);

export function DeviceCatalogProvider({ children }: { children: ReactNode }) {
  const [customDevices, setCustomDevices] = useState<Device[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([
      readStore<Device[]>("customDevices", []),
      readStore<string[]>("favoriteDeviceIds", []),
      readStore<string[]>("recentDeviceIds", defaultDeviceIds)
    ]).then(([storedCustom, storedFavorites, storedRecents]) => {
      setCustomDevices(storedCustom);
      setFavorites(storedFavorites);
      setRecents(storedRecents);
    });
  }, []);

  const devices = useMemo(() => [...baseDevices, ...customDevices], [customDevices]);

  const findDevice = useCallback(
    (id: string) => devices.find((device) => device.id === id) ?? devices[0],
    [devices]
  );

  const addRecent = useCallback((id: string) => {
    setRecents((current) => {
      const next = [id, ...current.filter((candidate) => candidate !== id)].slice(0, 8);
      void writeStore("recentDeviceIds", next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((candidate) => candidate !== id) : [id, ...current];
      void writeStore("favoriteDeviceIds", next);
      return next;
    });
  }, []);

  const addCustomDevice = useCallback((input: CustomDeviceInput) => {
    const error = validateCustomDevice(input);
    if (error) return error;

    const device = createCustomDevice(input);
    setCustomDevices((current) => {
      const next = [device, ...current.filter((candidate) => candidate.id !== device.id)];
      void writeStore("customDevices", next);
      return next;
    });
    addRecent(device.id);
    return null;
  }, [addRecent]);

  const removeCustomDevice = useCallback((id: string) => {
    setCustomDevices((current) => {
      const next = current.filter((device) => device.id !== id);
      void writeStore("customDevices", next);
      return next;
    });
    setFavorites((current) => {
      const next = current.filter((candidate) => candidate !== id);
      void writeStore("favoriteDeviceIds", next);
      return next;
    });
    setRecents((current) => {
      const next = current.filter((candidate) => candidate !== id);
      void writeStore("recentDeviceIds", next);
      return next;
    });
  }, []);

  const value = useMemo<DeviceCatalogContextValue>(
    () => ({
      devices,
      customDevices,
      favorites,
      recents,
      toggleFavorite,
      addRecent,
      addCustomDevice,
      removeCustomDevice,
      isFavorite: (id) => favorites.includes(id),
      findDevice
    }),
    [
      addCustomDevice,
      addRecent,
      customDevices,
      devices,
      favorites,
      findDevice,
      recents,
      removeCustomDevice,
      toggleFavorite,
    ]
  );

  return <DeviceCatalogContext.Provider value={value}>{children}</DeviceCatalogContext.Provider>;
}

export function useDeviceCatalog() {
  const value = useContext(DeviceCatalogContext);
  if (!value) throw new Error("useDeviceCatalog must be used inside DeviceCatalogProvider");
  return value;
}
