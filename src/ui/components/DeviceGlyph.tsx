import type { Device } from "../../domain/device/device.types";
import { cx } from "./ui";

export type GlyphKind = "phone" | "tablet" | "laptop" | "desktop" | "tv" | "watch" | "custom" | "all" | "starred";

const GLYPH_CLASSES: Record<GlyphKind, string> = {
  phone: "h-4 w-[9px] rounded-[2px]",
  tablet: "h-[17px] w-[13px] rounded-[2px]",
  laptop: "h-[13px] w-5 rounded-[2px]",
  desktop: "h-3.5 w-5 rounded-[1px]",
  tv: "h-[11px] w-[18px] rounded-[1px]",
  watch: "h-[11px] w-[9px] rounded-[3px]",
  custom: "h-3.5 w-2.5 rounded-[1px] border-dashed",
  all: "size-3 rounded-[3px]",
  starred: "size-3 rounded-full",
};

const SMALL_GLYPH_CLASSES: Record<GlyphKind, string> = {
  phone: "h-[13px] w-[7px] rounded-[2px]",
  tablet: "h-3.5 w-2.5 rounded-[2px]",
  laptop: "h-2.5 w-4 rounded-[2px]",
  desktop: "h-[11px] w-4 rounded-[1px]",
  tv: "h-[9px] w-3.5 rounded-[1px]",
  watch: "h-[9px] w-[7px] rounded-[2px]",
  custom: "h-[11px] w-2 rounded-[1px] border-dashed",
  all: "size-2.5 rounded-[2px]",
  starred: "size-2.5 rounded-full",
};

export function glyphKindFor(device: Device): GlyphKind {
  if (device.brand === "Custom") return "custom";
  switch (device.type) {
    case "tablet": return "tablet";
    case "laptop": return "laptop";
    case "desktop": return "desktop";
    case "tv": return "tv";
    case "watch": return "watch";
    case "custom": return "custom";
    default: return "phone";
  }
}

// A small outline of a device's shape, used in lists and set summaries.
export function DeviceGlyph({ kind, small = false, className }: { kind: GlyphKind; small?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("block shrink-0 border-[1.5px] border-current", small ? SMALL_GLYPH_CLASSES[kind] : GLYPH_CLASSES[kind], className)}
    />
  );
}
