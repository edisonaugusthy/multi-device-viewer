import type { PreviewSlot } from "./simulator.types";
import { devices } from "../device/device-catalog";

export const maxPreviewSlots = 4;

export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value)) return value.startsWith("//") ? `https:${value}` : value;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

export function createPreviewSlot(deviceId: string, url: string, index: number): PreviewSlot {
  const device = devices.find((candidate) => candidate.id === deviceId);
  return {
    id: `slot-${Date.now()}-${index}`,
    deviceId,
    url: normalizeUrl(url),
    orientation: device && device.cssViewport.width > device.cssViewport.height ? "landscape" : "portrait",
    zoom: 0.58,
    zoomMode: "fit",
    reloadToken: 0,
    showFrame: true,
  };
}

export function canAddPreviewSlot(slots: PreviewSlot[]): boolean {
  return slots.length < maxPreviewSlots;
}

export function nextZoom(current: number, direction: "in" | "out"): number {
  const delta = direction === "in" ? 0.1 : -0.1;
  return Math.min(1.6, Math.max(0.2, Number((current + delta).toFixed(2))));
}
