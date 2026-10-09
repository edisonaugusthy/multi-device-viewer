import { groupGalleryDevices, type DeviceGalleryGroupId } from "./device-gallery";
import type { Device } from "./device.types";

export type PickerTypeFilter = "all" | DeviceGalleryGroupId;
export type PickerSectionKey = "starred" | "recent" | DeviceGalleryGroupId;

export interface PickerSection {
  key: PickerSectionKey;
  devices: Device[];
}

export const PICKER_RECENT_LIMIT = 4;

// The device picker lists starred and recent devices first, then each type
// from the smallest to the largest screen. Filtering or searching shows only
// the matching types. Custom sizes have their own view.
export function buildPickerSections({ devices, favorites, recents, query = "", typeFilter = "all" }: {
  devices: Device[];
  favorites: string[];
  recents: string[];
  query?: string;
  typeFilter?: PickerTypeFilter;
}): PickerSection[] {
  const groups = groupGalleryDevices(devices, query)
    .filter(group => group.id !== "custom" && (typeFilter === "all" || group.id === typeFilter))
    .map(group => ({ key: group.id, devices: group.devices }) satisfies PickerSection);
  if (typeFilter !== "all" || query.trim()) return groups;

  const byId = new Map(devices.map(device => [device.id, device]));
  const starred = favorites.map(id => byId.get(id)).filter((device): device is Device => !!device);
  const recent = [...new Set(recents)]
    .filter(id => !favorites.includes(id))
    .map(id => byId.get(id))
    .filter((device): device is Device => !!device)
    .slice(0, PICKER_RECENT_LIMIT);
  return [
    { key: "starred" as const, devices: starred },
    { key: "recent" as const, devices: recent },
    ...groups,
  ].filter(section => section.devices.length > 0);
}

export function pickerTypeOptions(devices: Device[]): DeviceGalleryGroupId[] {
  return groupGalleryDevices(devices).map(group => group.id).filter(id => id !== "custom");
}

// The devices just before and after this one in its picker type, smallest
// screen first, so a preview can step through similar screens quickly.
export function adjacentPickerDevices(devices: Device[], deviceId: string): { previous?: Device; next?: Device } {
  const group = groupGalleryDevices(devices).find(candidate => candidate.devices.some(device => device.id === deviceId));
  if (!group) return {};
  const index = group.devices.findIndex(device => device.id === deviceId);
  return { previous: group.devices[index - 1], next: group.devices[index + 1] };
}
