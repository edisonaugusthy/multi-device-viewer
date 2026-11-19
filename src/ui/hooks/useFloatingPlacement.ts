import { useCallback, useEffect, useState } from "react";
import { usePopOut, type FloatingPlacement } from "../../app/popout";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";

const KEY = "mdvFloatingPlacement";

/**
 * Where a device chosen for a floating preview opens: over this page, or in
 * its own window above every app. The choice is remembered, so later picks
 * take one click. Undefined where the page cannot open such a window. `asked`
 * is a choice made on the way in (the right-click menu), which replaces the
 * remembered one.
 */
export function useFloatingPlacement(asked?: FloatingPlacement): { value: FloatingPlacement; onChange: (value: FloatingPlacement) => void } | undefined {
  const { supported } = usePopOut();
  const [value, setValue] = useState<FloatingPlacement>(asked ?? "page");
  useEffect(() => {
    if (asked) { void writeStore(KEY, asked).catch(() => undefined); return; }
    let active = true;
    void readStore<FloatingPlacement>(KEY, "page").then(saved => { if (active && saved === "top") setValue("top"); }).catch(() => undefined);
    return () => { active = false; };
  }, [asked]);
  const onChange = useCallback((next: FloatingPlacement) => {
    setValue(next);
    void writeStore(KEY, next).catch(() => undefined);
  }, []);
  return supported ? { value, onChange } : undefined;
}
