import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasExactPermission } from "../../app/viewer-context";
import { canWrapPreviews } from "../../app/preview-frame";
import type { Device } from "../../domain/device/device.types";
import { chromeMajor, exactIdentities, EXACT_RULE_IDENTITIES, isWrappedDevice, previewIdentities, type ExactIdentities, type PreviewIdentities } from "../../domain/simulator/preview-identity";

export interface PreviewFrameSpec { name: string; device: Device }

/**
 * What a set of previews sends with its preparation: with exact identities
 * on and allowed, every frame is wrapped and named in the exact map; without
 * them, phones are wrapped and the two kinds of frame get shared identities.
 * A tab that cannot attach the debugger, or loses it, falls back the same way.
 */
export function useExactIdentities(enabled: boolean, frames: PreviewFrameSpec[]) {
  // Whether this build holds the debugger permission: the setting shows only then.
  const [permitted, setPermitted] = useState<boolean | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    void hasExactPermission().then(granted => { if (active) setPermitted(granted && canWrapPreviews()); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setUnavailable(false); }, [enabled]);
  // The background says when the debugger was taken away (the bar's Cancel, say).
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;
    const onMessage = (message: unknown) => { if ((message as { type?: string })?.type === "MDV_EXACT_IDENTITIES_LOST") setUnavailable(true); };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);
  const report = useCallback((attached: boolean) => { if (!attached) setUnavailable(true); }, []);

  const wrapping = canWrapPreviews();
  const active = enabled && permitted === true && !unavailable && wrapping;
  const frameKey = JSON.stringify(frames.map(frame => [frame.name, frame.device.id]));
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const chromeVersion = chromeMajor(navigator.userAgent);
  const exact = useMemo<ExactIdentities | null>(() => active ? exactIdentities(framesRef.current, chromeVersion) : null, [active, chromeVersion, frameKey]);
  const identities = useMemo<PreviewIdentities>(
    () => active ? EXACT_RULE_IDENTITIES : previewIdentities(framesRef.current.map(frame => frame.device), chromeVersion, wrapping),
    [active, chromeVersion, frameKey, wrapping],
  );
  return {
    /** False while it is not yet known whether the permission is granted; previews wait for it to avoid loading twice. */
    settled: !enabled || permitted !== null,
    permitted: permitted === true,
    active,
    /** Exact identities were asked for but this tab cannot have them. */
    unavailable: enabled && permitted === true && (unavailable || !wrapping),
    identities,
    exact,
    isWrapped: (device: Device) => active || isWrappedDevice(device),
    report,
  };
}
