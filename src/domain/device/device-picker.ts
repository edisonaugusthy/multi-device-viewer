import { groupGalleryDevices, nameStartsWith, newestFirst, type DeviceGalleryGroupId } from "./device-gallery";
import type { Device } from "./device.types";

// Five plain tabs. Computers are laptops and desktops; Other holds TVs,
// watches, kiosks and phones that run neither iOS nor Android.
export const pickerTabs = ["all", "ios", "android", "tablet", "computer", "other"] as const;
export type PickerTab = typeof pickerTabs[number];
const TAB_GROUPS: Record<Exclude<PickerTab, "all">, DeviceGalleryGroupId[]> = {
  ios: ["ios"], android: ["android"], tablet: ["tablet"], computer: ["laptop", "desktop"], other: ["phone", "tv", "watch", "custom"],
};

export type PickerSectionKey = "onScreen" | "starred" | "recent" | "all" | "matches";

export interface PickerSection {
  key: PickerSectionKey;
  devices: Device[];
}

export const PICKER_RECENT_LIMIT = 4;

// The devices of a tab matching the search, names starting with the query
// first, then newest first. Saved custom sizes have their own view.
function tabDevices(devices: Device[], tab: PickerTab, query: string) {
  return groupGalleryDevices(devices, query)
    .filter(group => tab === "all" || TAB_GROUPS[tab].includes(group.id))
    .flatMap(group => group.devices)
    .filter(device => device.brand !== "Custom")
    .sort((left, right) => Number(nameStartsWith(right, query)) - Number(nameStartsWith(left, query)) || newestFirst(left, right));
}

// The All tab pins the devices on screen, then starred devices (or, with
// nothing starred to show, recent ones), then every device not on screen.
// Starring keeps the device in place in the full list. A type tab or a search
// shows one plain list.
export function buildPickerSections({ devices, favorites, recents = [], onScreen = [], query = "", tab = "all" }: {
  devices: Device[];
  favorites: string[];
  recents?: string[];
  onScreen?: Device[];
  query?: string;
  tab?: PickerTab;
}): PickerSection[] {
  const list = tabDevices(devices, tab, query);
  if (tab !== "all" || query.trim()) return list.length ? [{ key: "matches", devices: list }] : [];

  const shown = [...new Map(onScreen.map(device => [device.id, device])).values()];
  const pinned = new Set(shown.map(device => device.id));
  const byId = new Map(list.map(device => [device.id, device]));
  const pick = (ids: string[]) => [...new Set(ids)].filter(id => !pinned.has(id)).map(id => byId.get(id)).filter((device): device is Device => !!device);
  const starred = pick(favorites);
  const shortcuts = starred.length
    ? { key: "starred" as const, devices: starred }
    : { key: "recent" as const, devices: pick(recents).slice(0, PICKER_RECENT_LIMIT) };
  return [
    { key: "onScreen" as const, devices: shown },
    shortcuts,
    { key: "all" as const, devices: list.filter(device => !pinned.has(device.id)) },
  ].filter(section => section.devices.length > 0);
}

/** The tabs that have devices, All first. */
export function availablePickerTabs(devices: Device[]): PickerTab[] {
  return pickerTabs.filter(tab => tab === "all" || tabDevices(devices, tab, "").length > 0);
}

// The devices just before and after this one in its picker type, smallest
// screen first, so a preview can step through similar screens quickly.
export function adjacentPickerDevices(devices: Device[], deviceId: string): { previous?: Device; next?: Device } {
  const group = groupGalleryDevices(devices).find(candidate => candidate.devices.some(device => device.id === deviceId));
  if (!group) return {};
  const index = group.devices.findIndex(device => device.id === deviceId);
  return { previous: group.devices[index - 1], next: group.devices[index + 1] };
}
