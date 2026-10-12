import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useI18n } from "../../app/i18n";
import { usePointerDrag } from "../hooks/usePointerDrag";
import { DESIGN_HANDLES, moveDesign, nudgeDesign, resizeDesign, type DesignFrame, type DesignHandle, type DesignSize } from "../interactions/design-frame";
import { cx, focusRing } from "./ui";

/** Where the device's logical screen sits inside the preview container, in container pixels. */
export interface ScreenBox { left: number; top: number; width: number; height: number }

export interface DesignOverlayProps {
  image: string;
  opacity: number;
  blend?: "normal" | "difference";
  /** Shows handles and takes pointer input; otherwise the page underneath stays usable. */
  adjusting: boolean;
  frame: DesignFrame;
  onFrameChange: (frame: DesignFrame) => void;
}

/** Pointer distance within which a dragged design lines up with the screen. */
const SNAP_PX = 6;

const HANDLE_CLASS: Record<DesignHandle, string> = {
  nw: "-left-2 -top-2 size-4 cursor-nwse-resize",
  ne: "-right-2 -top-2 size-4 cursor-nesw-resize",
  sw: "-left-2 -bottom-2 size-4 cursor-nesw-resize",
  se: "-right-2 -bottom-2 size-4 cursor-nwse-resize",
  n: "-top-[7px] left-1/2 h-3.5 w-8 -translate-x-1/2 cursor-ns-resize",
  s: "-bottom-[7px] left-1/2 h-3.5 w-8 -translate-x-1/2 cursor-ns-resize",
  e: "-right-[7px] top-1/2 h-8 w-3.5 -translate-y-1/2 cursor-ew-resize",
  w: "-left-[7px] top-1/2 h-8 w-3.5 -translate-y-1/2 cursor-ew-resize",
};

/**
 * A design image over the device screen. The picture is clipped to the
 * screen; the frame outline and handles are not, so a design pushed past an
 * edge can still be grabbed.
 */
export function DesignOverlay({ image, opacity, blend, adjusting, frame, screen, screenBox, onFrameChange }: DesignOverlayProps & {
  screen: DesignSize;
  screenBox: ScreenBox;
}) {
  const { t } = useI18n();
  const startDrag = usePointerDrag();
  // Drags read the frame they started from; React state may lag a pointer event.
  const latest = useRef(frame);
  latest.current = frame;
  const scale = screen.width > 0 ? screenBox.width / screen.width : 1;
  const snap = SNAP_PX / scale;

  function startMove(event: ReactPointerEvent) {
    if (!adjusting || event.button !== 0 || (event.target as Element).closest("[data-design-handle]")) return;
    event.stopPropagation();
    const origin = latest.current;
    startDrag(event, (deltaX, deltaY) => onFrameChange(moveDesign(origin, deltaX / scale, deltaY / scale, screen, snap)));
  }

  function startResize(event: ReactPointerEvent, handle: DesignHandle) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const origin = latest.current;
    startDrag(event, (deltaX, deltaY, move) => onFrameChange(resizeDesign(origin, handle, deltaX / scale, deltaY / scale, { screen, free: move.shiftKey, snap })));
  }

  function onKeyDown(event: KeyboardEvent) {
    const next = nudgeDesign(latest.current, event.key, event.shiftKey, screen);
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    onFrameChange(next);
  }

  const box = {
    left: screenBox.left + frame.x * scale,
    top: screenBox.top + frame.y * scale,
    width: frame.width * scale,
    height: frame.height * scale,
  };

  return (
    <>
      <div
        aria-hidden
        data-design-overlay
        className={cx("pointer-events-none absolute z-30 overflow-hidden", blend === "difference" && "mix-blend-difference")}
        style={{ left: screenBox.left, top: screenBox.top, width: screenBox.width, height: screenBox.height, opacity: opacity / 100 }}
      >
        <img
          src={image}
          alt=""
          draggable={false}
          className="absolute max-w-none"
          style={{ left: frame.x * scale, top: frame.y * scale, width: box.width, height: box.height }}
        />
      </div>
      <div
        data-design-frame
        role={adjusting ? "group" : undefined}
        aria-label={adjusting ? t("adjustableDesignOverlay") : undefined}
        tabIndex={adjusting ? 0 : undefined}
        onPointerDown={adjusting ? startMove : undefined}
        onKeyDown={adjusting ? onKeyDown : undefined}
        className={cx(
          "absolute z-30 outline-2",
          adjusting
            ? cx("cursor-move touch-none select-none outline-design shadow-[0_0_0_1px_rgba(0,0,0,0.35)]", focusRing)
            : "pointer-events-none outline-design/60",
        )}
        style={box}
      >
        {adjusting && <>
          {DESIGN_HANDLES.map(handle => (
            <button
              key={handle}
              type="button"
              data-design-handle={handle}
              aria-label={handle.length === 2 ? t("resizeDesign") : t("stretchDesign")}
              onPointerDown={event => startResize(event, handle)}
              className={cx("absolute touch-none rounded-full border-2 border-white bg-design shadow", HANDLE_CLASS[handle], focusRing)}
            />
          ))}
          <span
            data-design-frame-size
            className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] text-on-primary shadow-popover"
          >
            {Math.round(frame.width)} × {Math.round(frame.height)} · {Math.round(frame.x)}, {Math.round(frame.y)}
          </span>
        </>}
      </div>
    </>
  );
}
