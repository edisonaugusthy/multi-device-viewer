import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultDeviceIds, devices as baseDevices } from "../domain/device/device-catalog";
import { createCustomDevice, filterDevices, getDeviceBrands, validateCustomDevice } from "../domain/device/device-service";
import type { CustomDeviceInput, Device, DeviceFilters } from "../domain/device/device.types";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

interface DeviceCatalogContextValue {
  devices: Device[];
  visibleDevices: Device[];
  filters: DeviceFilters;
  brands: string[];
  favorites: string[];
  recents: string[];
  selectedDeviceId: string;
  setFilters: (filters: DeviceFilters) => void;
  setSelectedDeviceId: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addRecent: (id: string) => void;
  addCustomDevice: (input: CustomDeviceInput) => string | null;
  isFavorite: (id: string) => boolean;
  findDevice: (id: string) => Device;
}

const DeviceCatalogContext = createContext<DeviceCatalogContextValue | null>(null);

const defaultFilters: DeviceFilters = {
  query: "",
  type: "all",
  brand: "all",
  favoritesOnly: false
};

export function DeviceCatalogProvider({ children }: { children: ReactNode }) {
  const [customDevices, setCustomDevices] = useState<Device[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState(defaultDeviceIds[0]);
  const [filters, setFilters] = useState<DeviceFilters>(defaultFilters);

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
  const brands = useMemo(() => getDeviceBrands(devices), [devices]);
  const visibleDevices = useMemo(() => filterDevices(devices, filters, favorites), [devices, favorites, filters]);

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

  const setSelectedDeviceId = useCallback(
    (id: string) => {
      setSelectedDeviceIdState(id);
      addRecent(id);
    },
    [addRecent]
  );

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
    setSelectedDeviceId(device.id);
    return null;
  }, [setSelectedDeviceId]);

  const value = useMemo<DeviceCatalogContextValue>(
    () => ({
      devices,
      visibleDevices,
      filters,
      brands,
      favorites,
      recents,
      selectedDeviceId,
      setFilters,
      setSelectedDeviceId,
      toggleFavorite,
      addRecent,
      addCustomDevice,
      isFavorite: (id) => favorites.includes(id),
      findDevice
    }),
    [
      addCustomDevice,
      addRecent,
      brands,
      devices,
      favorites,
      filters,
      findDevice,
      recents,
      selectedDeviceId,
      setSelectedDeviceId,
      toggleFavorite,
      visibleDevices
    ]
  );

  return <DeviceCatalogContext.Provider value={value}>{children}</DeviceCatalogContext.Provider>;
}

export function useDeviceCatalog() {
  const value = useContext(DeviceCatalogContext);
  if (!value) throw new Error("useDeviceCatalog must be used inside DeviceCatalogProvider");
  return value;
}
