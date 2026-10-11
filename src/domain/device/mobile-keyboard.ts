export interface KeyboardTargetRect {
  top: number;
  bottom: number;
}

export function shouldKeepKeyboardSessionOnBlur({
  documentHasFocus,
  activeEditableConnected,
}: {
  documentHasFocus: boolean;
  activeEditableConnected: boolean;
}) {
  return !documentHasFocus && activeEditableConnected;
}

export function getKeyboardScrollDelta({
  rect,
  viewportHeight,
  occludedBottom,
  platform,
}: {
  rect: KeyboardTargetRect;
  viewportHeight: number;
  occludedBottom: number;
  platform: "ios" | "android";
}) {
  const topEdge = platform === "ios" ? 12 : 8;
  const bottomEdge = Math.max(
    topEdge + 48,
    viewportHeight - Math.max(0, occludedBottom) - (platform === "ios" ? 14 : 10),
  );
  if (rect.bottom > bottomEdge) return rect.bottom - bottomEdge;
  if (rect.top < topEdge) return rect.top - topEdge;
  return 0;
}

/** Wide unfolded phones need the same key spacing as tablets, in either orientation. */
export function usesTabletKeyboard(type: string, viewport: { width: number; height: number }) {
  return type === "tablet" || (type === "phone" && Math.min(viewport.width, viewport.height) >= 600);
}

export function keyboardDecimalSeparator(language?: string) {
  try {
    return new Intl.NumberFormat(language?.replaceAll("_", "-") || "en").formatToParts(1.1)
      .find(part => part.type === "decimal")?.value ?? ".";
  } catch { return "."; }
}
