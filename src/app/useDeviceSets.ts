import { useCallback, useEffect, useMemo, useState } from "react";
import { quickDevicePresetIds } from "../domain/device/device-catalog";
import { readStore, writeStore } from "../infrastructure/storage/local-store";
import type { TranslationKey } from "./i18n";

export interface SavedPreset {
  id: string;
  name: string;
  deviceIds: string[];
  createdAt: string;
}

export interface DeviceSet {
  id: string;
  name: string;
  deviceIds: string[];
  builtIn: boolean;
}

const SAVED_SETS_KEY = "mdvSavedPresets";
const HIDDEN_BUILT_IN_KEY = "mdvHiddenBuiltInSets";

export const BUILT_IN_SETS: Array<{ id: string; labelKey: TranslationKey; deviceIds: string[] }> = [
  { id: "phoneTablet", labelKey: "phoneTablet", deviceIds: [...quickDevicePresetIds.phoneTablet] },
  { id: "iosAndroid", labelKey: "iosAndroid", deviceIds: [...quickDevicePresetIds.iosAndroid] },
  { id: "mobileTabletLaptop", labelKey: "mobileTabletLaptop", deviceIds: [...quickDevicePresetIds.mobileTabletLaptop] },
];

function isSavedPreset(value: unknown): value is SavedPreset {
  if (!value || typeof value !== "object") return false;
  const preset = value as Record<string, unknown>;
  return typeof preset.id === "string" && typeof preset.name === "string"
    && Array.isArray(preset.deviceIds) && preset.deviceIds.every(id => typeof id === "string");
}

// Saved and built-in device sets. Built-in sets can be hidden and restored.
export function useDeviceSets(translate: (key: TranslationKey) => string) {
  const [saved, setSaved] = useState<SavedPreset[]>([]);
  const [hiddenBuiltIn, setHiddenBuiltIn] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([
      readStore<SavedPreset[]>(SAVED_SETS_KEY, []),
      readStore<string[]>(HIDDEN_BUILT_IN_KEY, []),
    ]).then(([storedSets, storedHidden]) => {
      setSaved(Array.isArray(storedSets) ? storedSets.filter(isSavedPreset) : []);
      setHiddenBuiltIn(Array.isArray(storedHidden) ? storedHidden : []);
    });
  }, []);

  const persistSaved = useCallback((next: SavedPreset[]) => {
    setSaved(next);
    void writeStore(SAVED_SETS_KEY, next);
  }, []);

  const persistHidden = useCallback((next: string[]) => {
    setHiddenBuiltIn(next);
    void writeStore(HIDDEN_BUILT_IN_KEY, next);
  }, []);

  const userSets = useMemo<DeviceSet[]>(() => saved.map(preset => ({
    id: preset.id, name: preset.name, deviceIds: preset.deviceIds.slice(0, 4), builtIn: false,
  })), [saved]);

  const builtInSets = useMemo<DeviceSet[]>(() => BUILT_IN_SETS
    .filter(set => !hiddenBuiltIn.includes(set.id))
    .map(set => ({ id: set.id, name: translate(set.labelKey), deviceIds: set.deviceIds, builtIn: true })), [hiddenBuiltIn, translate]);

  const saveSet = useCallback((name: string, deviceIds: string[]) => {
    const trimmed = name.trim();
    if (!trimmed || deviceIds.length === 0) return;
    persistSaved([{ id: `preset-${Date.now()}`, name: trimmed, deviceIds: deviceIds.slice(0, 4), createdAt: new Date().toISOString() }, ...saved]);
  }, [persistSaved, saved]);

  const deleteSet = useCallback((set: DeviceSet) => {
    if (set.builtIn) persistHidden([...hiddenBuiltIn, set.id]);
    else persistSaved(saved.filter(preset => preset.id !== set.id));
  }, [hiddenBuiltIn, persistHidden, persistSaved, saved]);

  const restoreBuiltIn = useCallback(() => persistHidden([]), [persistHidden]);

  const exportSets = useCallback(() => {
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mdv-presets.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [saved]);

  const importSets = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported)) return;
        const valid = imported.filter(isSavedPreset);
        const importedIds = new Set(valid.map(preset => preset.id));
        persistSaved([...valid, ...saved.filter(preset => !importedIds.has(preset.id))]);
      } catch {
        // Ignore files that are not exported device sets.
      }
    };
    reader.readAsText(file);
  }, [persistSaved, saved]);

  return {
    userSets,
    builtInSets,
    allSets: useMemo(() => [...userSets, ...builtInSets], [builtInSets, userSets]),
    canRestoreBuiltIn: hiddenBuiltIn.length > 0,
    hasSavedSets: saved.length > 0,
    saveSet,
    deleteSet,
    restoreBuiltIn,
    exportSets,
    importSets,
  };
}
