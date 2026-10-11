import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

/** Keep capture and listener cleanup identical for all drag handles. */
export function usePointerDrag() {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cleanup.current?.(), []);

  return useCallback((event: ReactPointerEvent, onMove: (deltaX: number, deltaY: number) => void) => {
    if (event.button !== 0) return;
    cleanup.current?.();
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const { pointerId, clientX, clientY } = event;
    const view = target.ownerDocument.defaultView;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      view?.removeEventListener("blur", finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
      cleanup.current = undefined;
    };
    const move = (next: PointerEvent) => {
      if (next.pointerId !== pointerId) return;
      if ((next.buttons & 1) !== 1) return finish();
      onMove(next.clientX - clientX, next.clientY - clientY);
    };
    cleanup.current = finish;
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
    view?.addEventListener("blur", finish);
    try { target.setPointerCapture(pointerId); }
    catch (error) { finish(); throw error; }
  }, []);
}
