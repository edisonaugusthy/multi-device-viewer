import { Camera, Maximize2, Minus, Plus, RotateCw, Share2, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { captureNodeToPng, downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { toLandscapeAwareSize } from "../../domain/device/device-service";
import type { Device } from "../../domain/device/device.types";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { DeviceFrame } from "./DeviceFrame";

interface PreviewCardProps {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
  removable: boolean;
  onAnnotate: () => void;
}

export function PreviewCard({ slot, device, display, removable, onAnnotate }: PreviewCardProps) {
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const { setActiveSlot, removeSlot, rotateSlot, zoomSlot, setSlotZoomMode } = useSimulator();

  const size = useMemo(() => toLandscapeAwareSize(device.cssViewport, slot.orientation), [device, slot.orientation]);

  async function capture() {
    if (!captureRef.current) return;
    const dataUrl = await captureNodeToPng(captureRef.current);
    await downloadDataUrl(dataUrl, screenshotFilename(device.name));
  }

  return (
    <section className="group relative flex min-w-[260px] flex-col rounded-[12px] transition" onClick={() => setActiveSlot(slot.id)}>
      <header className="absolute left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/55 bg-white/42 p-1 opacity-0 shadow-[0_12px_34px_rgb(15_23_42/0.16)] backdrop-blur-2xl transition group-hover:opacity-100">
        <FrameTool label="Zoom out" onClick={() => zoomSlot(slot.id, "out")}>
          <Minus size={15} />
        </FrameTool>
        <FrameTool label="Fit" onClick={() => setSlotZoomMode(slot.id, "fit")}>
          <Maximize2 size={15} />
        </FrameTool>
        <FrameTool label="Zoom in" onClick={() => zoomSlot(slot.id, "in")}>
          <Plus size={15} />
        </FrameTool>
        <FrameTool label="Rotate" onClick={() => rotateSlot(slot.id)}>
          <RotateCw size={15} />
        </FrameTool>
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

      <div className="flex flex-1 items-start justify-center overflow-visible p-0">
        <div
          ref={captureRef}
          className="origin-top transition-transform"
          style={{
            width: size.width,
            transform: `scale(${slot.zoom})`,
            marginBottom: `${Math.max(0, size.height * slot.zoom - size.height)}px`
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

      <button className="sr-only" onClick={capture}>Screenshot</button>
    </section>
  );
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
