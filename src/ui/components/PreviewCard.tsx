import { Camera, Maximize2, Minus, Plus, RotateCw, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { captureNodeToPng, downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { presentationSizeFor, supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { DeviceFrame, estimateDeviceFrameSize } from "./DeviceFrame";

interface PreviewCardProps {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
  removable: boolean;
  onAnnotate: () => void;
}

export function PreviewCard({ slot, device, display, removable, onAnnotate }: PreviewCardProps) {
  const frameAreaRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [fitBounds, setFitBounds] = useState<Size>({ width: 0, height: 0 });
  const { setActiveSlot, removeSlot, rotateSlot, zoomSlot, setSlotZoomMode } = useSimulator();
  const canRotate = supportsOrientation(device);

  const size = useMemo(
    () => (canRotate ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport),
    [canRotate, device, slot.orientation]
  );
  const frameSize = useMemo(
    () =>
      estimateDeviceFrameSize({
        device,
        showFrame: slot.showFrame,
        showStatusBar: display.showStatusBar,
        showUrlBar: display.showUrlBar,
        viewportSize: size
      }),
    [device, display.showStatusBar, display.showUrlBar, size, slot.showFrame]
  );
  const presentationSize = useMemo(() => presentationSizeFor(device, slot.orientation), [device, slot.orientation]);
  const shellScale = fitZoom(frameSize, presentationSize, { x: 0, y: 0 });
  const displaySize = {
    width: frameSize.width * shellScale,
    height: frameSize.height * shellScale
  };
  const effectiveZoom = slot.zoomMode === "fit" ? fitZoom(displaySize, fitBounds) : slot.zoom;

  async function capture() {
    if (!captureRef.current) return;
    const dataUrl = await captureNodeToPng(captureRef.current);
    await downloadDataUrl(dataUrl, screenshotFilename(device.name));
  }

  useEffect(() => {
    const node = frameAreaRef.current;
    if (!node) return;

    const updateBounds = () => {
      const rect = node.getBoundingClientRect();
      setFitBounds({ width: rect.width, height: rect.height });
    };
    updateBounds();

    const observer = new ResizeObserver(updateBounds);
    observer.observe(node);
    window.addEventListener("resize", updateBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  useEffect(() => {
    setBlocked(false);
  }, [device.id, slot.reloadToken, slot.url]);

  return (
    <section
      className="group relative flex h-full min-h-[360px] min-w-[240px] items-center justify-center rounded-lg transition"
      data-testid={`preview-card-${slot.id}`}
      onClick={() => setActiveSlot(slot.id)}
      onFocus={() => setActiveSlot(slot.id)}
      onPointerEnter={() => setActiveSlot(slot.id)}
    >
      <header className="absolute left-1/2 top-0 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1 opacity-0 shadow-[0_12px_34px_rgb(15_23_42/0.16)] backdrop-blur-2xl transition group-hover:opacity-100">
        <FrameTool label="Zoom out" onClick={() => zoomSlot(slot.id, "out")}>
          <Minus size={15} />
        </FrameTool>
        <FrameTool label="Fit" onClick={() => setSlotZoomMode(slot.id, "fit")}>
          <Maximize2 size={15} />
        </FrameTool>
        <FrameTool label="Zoom in" onClick={() => zoomSlot(slot.id, "in")}>
          <Plus size={15} />
        </FrameTool>
        {canRotate && (
          <FrameTool label="Rotate" onClick={() => rotateSlot(slot.id)}>
            <RotateCw size={15} />
          </FrameTool>
        )}
        <FrameTool label="Screenshot" onClick={() => void capture()}>
          <Camera size={15} />
        </FrameTool>
        <FrameTool label="Annotate" onClick={onAnnotate}>
          <Share2 size={15} />
        </FrameTool>
        {removable && (
          <button
            type="button"
            title="Remove preview"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-white/80 hover:text-slate-950"
            onClick={(event) => {
              event.stopPropagation();
              removeSlot(slot.id);
            }}
          >
            <X size={17} />
          </button>
        )}
      </header>

      <div ref={frameAreaRef} className="flex h-full w-full items-center justify-center overflow-visible px-2 pt-14">
        <div
          className="relative shrink-0"
          style={{
            width: displaySize.width * effectiveZoom,
            height: displaySize.height * effectiveZoom
          }}
        >
          <div
            ref={captureRef}
            className="absolute left-0 top-0 origin-top-left transition-transform"
            style={{
              width: frameSize.width,
              height: frameSize.height,
              transform: `scale(${shellScale * effectiveZoom})`
            }}
          >
            <DeviceFrame
              device={device}
              showFrame={slot.showFrame}
              showStatusBar={display.showStatusBar}
              showBattery={display.showBattery}
              showUrlBar={display.showUrlBar}
              url={slot.url}
              viewportSize={size}
              orientation={slot.orientation}
            >
              <div style={{ width: size.width, height: size.height }}>
                {blocked ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-bold text-slate-900">This site blocked embedded preview.</p>
                    <p className="max-w-sm text-sm leading-6 text-slate-600">
                      Some sites use CSP or X-Frame-Options. Open the site in a real tab, then use screenshots and specs from this simulator.
                    </p>
                    <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={() => window.open(slot.url, "_blank", "noopener,noreferrer")}>
                      Open site
                    </button>
                  </div>
                ) : (
                  <iframe
                    key={`${slot.id}-${slot.reloadToken}`}
                    title={`${device.name} preview`}
                    src={slot.url}
                    className="h-full w-full border-0 bg-white"
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    onError={() => setBlocked(true)}
                  />
                )}
              </div>
            </DeviceFrame>
          </div>
        </div>
      </div>

      <button className="sr-only" onClick={capture}>Screenshot</button>
    </section>
  );
}

function fitZoom(frameSize: Size, bounds: Size, padding = { x: 36, y: 36 }) {
  if (!bounds.width || !bounds.height) return 0.58;
  const availableWidth = Math.max(180, bounds.width - padding.x);
  const availableHeight = Math.max(180, bounds.height - padding.y);
  const zoom = Math.min(1, availableWidth / frameSize.width, availableHeight / frameSize.height);
  return Number(Math.max(0.18, zoom).toFixed(3));
}

function FrameTool({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-white/80 hover:text-slate-950"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
