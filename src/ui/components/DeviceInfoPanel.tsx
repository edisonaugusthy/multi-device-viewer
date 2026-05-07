import { Download, Heart, Layers, RotateCw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { mediaQueryFor, toLandscapeAwareSize } from "../../domain/device/device-service";

type PanelTab = "features" | "report" | "png" | "info";

export function DeviceInfoPanel() {
  const [tab, setTab] = useState<PanelTab>("features");
  const { findDevice, isFavorite, toggleFavorite, selectedDeviceId } = useDeviceCatalog();
  const { slots, activeSlotId, rotateSlot, zoomSlot, duplicateActiveSlot } = useSimulator();
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? slots[0];
  const device = findDevice(activeSlot?.deviceId ?? selectedDeviceId);
  const size = useMemo(() => toLandscapeAwareSize(device.cssViewport, activeSlot?.orientation ?? "portrait"), [activeSlot?.orientation, device]);
  const mockup = device.mockupAssets.find((asset) => asset.kind === "transparent-png");

  return (
    <aside className="flex h-full min-h-0 w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Selected device</p>
            <h2 className="mt-1 text-lg font-black leading-tight text-slate-950">{device.name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{device.brand} · {device.os}</p>
          </div>
          <button
            type="button"
            title="Favorite"
            className={`rounded-[8px] border p-2 ${isFavorite(device.id) ? "border-red-100 bg-red-50 text-red-500" : "border-slate-200 text-slate-400"}`}
            onClick={() => toggleFavorite(device.id)}
          >
            <Heart size={18} fill={isFavorite(device.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="rounded-[8px] bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700" onClick={() => rotateSlot(activeSlotId)}>
            <RotateCw className="mx-auto mb-1" size={15} /> Rotate
          </button>
          <button className="rounded-[8px] bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700" onClick={() => zoomSlot(activeSlotId, "in")}>
            <Star className="mx-auto mb-1" size={15} /> Zoom
          </button>
          <button className="rounded-[8px] bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700" onClick={() => duplicateActiveSlot(device.id)}>
            <Layers className="mx-auto mb-1" size={15} /> Compare
          </button>
        </div>
      </div>

      <nav className="grid grid-cols-4 border-b border-slate-200">
        {(["features", "report", "png", "info"] as PanelTab[]).map((item) => (
          <button
            key={item}
            className={`px-2 py-3 text-xs font-black capitalize ${tab === item ? "border-b-2 border-teal-600 text-teal-700" : "text-slate-500"}`}
            onClick={() => setTab(item)}
          >
            {item === "png" ? "PNG" : item}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "features" && (
          <div className="space-y-3">
            <Metric label="CSS viewport" value={`${size.width} x ${size.height}`} />
            <Metric label="Pixel ratio" value={`${device.pixelRatio}x`} />
            <Metric label="Resolution" value={`${device.manufacturerResolution.width} x ${device.manufacturerResolution.height}`} />
            <Metric label="Orientation" value={activeSlot?.orientation ?? "portrait"} />
            <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Media query</p>
              <code className="mt-2 block break-words rounded bg-white p-2 text-[12px] font-semibold text-slate-700">{mediaQueryFor(device, activeSlot?.orientation ?? "portrait")}</code>
            </div>
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">Responsive report</p>
            <p>This local report summarizes the selected device and current preview state. It is designed for client notes, QA handoff, or design review.</p>
            <ul className="space-y-2">
              <li>Viewport category: {device.type}</li>
              <li>Current URL: {activeSlot?.url}</li>
              <li>Recommended breakpoint check: {Math.min(size.width, size.height)}px and up</li>
              <li>Compare-ready: duplicate this device into another slot to validate layout drift.</li>
            </ul>
          </div>
        )}

        {tab === "png" && (
          <div className="space-y-3">
            {mockup?.localPath ? (
              <>
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
                  <img src={mockup.localPath} alt={`${device.name} transparent mockup`} className="mx-auto max-h-[300px] object-contain" />
                </div>
                <a href={mockup.localPath} download className="flex items-center justify-center gap-2 rounded-[8px] bg-teal-700 px-4 py-2 text-sm font-bold text-white">
                  <Download size={16} /> Download local PNG
                </a>
              </>
            ) : (
              <div className="rounded-[12px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                No packaged transparent PNG is available yet for this device. Add one through the mockup importer metadata.
              </div>
            )}
          </div>
        )}

        {tab === "info" && (
          <div className="space-y-3">
            <Metric label="Device id" value={device.id} />
            <Metric label="Family" value={device.family} />
            <Metric label="Updated" value={device.updatedAt} />
            <Metric label="Packaged assets" value={`${device.mockupAssets.length}`} />
          </div>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
